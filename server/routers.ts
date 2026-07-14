import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { adminOrEditorProcedure, adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { invokeLLM } from "./_core/llm.js";
import { assertRateLimit, assertRequestRateLimit } from "./_core/rateLimit.js";
import { supabaseAdmin } from "./_core/supabaseAdmin.js";
import {
  buildQuestionInsertPayload,
  getQuestionImportSourceId,
  questionImportPayloadSchema,
  validateQuestionImportItem,
  type ImportResultStatus,
} from "../shared/questionImportSchema.js";

const resolutionBlockInputSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(["texto", "latex", "imagem"]),
  texto: z.string().max(20000).nullable().optional(),
  url_imagem: z.string().url().nullable().optional(),
  ordem: z.number().int().min(1).max(500),
});

const scratchpadPointInputSchema = z.object({
  x: z.number(),
  y: z.number(),
  pressure: z.number().optional(),
  width: z.number().optional(),
  time: z.number().optional(),
});

const scratchpadStrokeInputSchema = z.object({
  id: z.string().min(1),
  tool: z.enum(["pen", "eraser", "shape", "text", "image", "meta"]),
  color: z.string().min(1).max(80),
  size: z.number().min(0).max(500),
  points: z.array(scratchpadPointInputSchema).max(20000),
  brush: z.enum(["pen", "brush", "highlighter"]).optional(),
  shape: z.enum(["line", "arrow", "rectangle", "ellipse", "triangle"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
  text: z.string().max(20000).optional(),
  imageData: z.string().max(2_000_000).optional(),
  rotation: z.number().optional(),
  pageId: z.string().max(120).optional(),
  payload: z.unknown().optional(),
});

const questionNoteInputSchema = z.object({
  questionId: z.string().uuid(),
  strokes: z.array(scratchpadStrokeInputSchema).max(2000),
  canvasWidth: z.number().positive().max(10000),
  canvasHeight: z.number().positive().max(10000),
  backgroundType: z.enum(["grid", "dots", "lined", "blank", "cartesian"]).default("grid"),
  title: z.string().max(160).nullable().optional(),
});

function normalizeResolutionBlockPayload(questaoId: string, block: z.infer<typeof resolutionBlockInputSchema>) {
  return {
    questao_id: questaoId,
    tipo: block.tipo,
    texto: block.tipo === "imagem" ? null : (block.texto?.trim() || null),
    url_imagem: block.tipo === "imagem" ? (block.url_imagem?.trim() || null) : null,
    ordem: block.ordem,
  };
}

function addMonthsIso(baseDate: Date, months: number) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

function pickBillingPlan(row: any) {
  return Array.isArray(row?.billing_plans) ? row.billing_plans[0] : row?.billing_plans;
}

function flattenBillingSubscription(row: any) {
  if (!row) return null;

  const plan = pickBillingPlan(row);

  return {
    subscription_id: row.id,
    status: row.status,
    gateway: row.gateway ?? null,
    payment_url: row.payment_url ?? null,
    started_at: row.started_at ?? null,
    current_period_start: row.current_period_start ?? null,
    current_period_end: row.current_period_end ?? null,
    next_due_date: row.next_due_date ?? null,
    created_at: row.created_at ?? null,
    plan_id: plan?.id ?? "",
    plan_slug: plan?.slug ?? "",
    plan_name: plan?.name ?? "Plano da plataforma",
    plan_description: plan?.description ?? null,
    plan_price_cents: Number(plan?.price_cents ?? 0),
    plan_currency: plan?.currency ?? "BRL",
    plan_billing_cycle: plan?.billing_cycle ?? null,
  };
}

async function getLatestUserBillingSubscription(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select(
      `
      *,
      billing_plans (
        id,
        slug,
        name,
        description,
        price_cents,
        currency,
        billing_cycle
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  }

  return data ?? null;
}

function isBlockingBillingSubscription(row: any) {
  if (!row) return false;
  if (row.status === "manual_review") return true;
  if (!["active", "trialing"].includes(row.status)) return false;
  if (!row.current_period_end) return true;

  const end = new Date(row.current_period_end).getTime();
  return Number.isFinite(end) && end >= Date.now();
}

function getBillingPlanSlugCandidates(slug: string) {
  const candidatesBySlug: Record<string, string[]> = {
    "beta-selecionado-5": [
      "beta-selecionado-5",
      "selecionados_5",
      "selecionado",
      "selecionados",
      "beta_selecionado",
    ],
    "beta-fundador-8": [
      "beta-fundador-8",
      "fundador_8",
      "fundador",
      "beta_fundador",
    ],
    "mensal-1099": [
      "mensal-1099",
      "normal_1099",
      "mensal",
      "normal",
      "plano_mensal",
    ],
  };

  const candidates = candidatesBySlug[slug] ?? [slug];
  return candidates.includes(slug) ? candidates : [slug, ...candidates];
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    registerStudent: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2, "Nome muito curto"),
          telefone: z.string().min(8, "Digite um telefone válido"),
          email: z.string().email("E-mail inválido"),
          senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const nome = input.nome.trim();
        const telefone = input.telefone.trim();
        const email = input.email.trim().toLowerCase();

        assertRequestRateLimit(ctx.req, "auth:register:ip", {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        assertRateLimit({
          key: `auth:register:email:${email}`,
          limit: 3,
          windowMs: 60 * 60 * 1000,
        });

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: input.senha,
          email_confirm: false,
          user_metadata: {
            nome,
            telefone,
          },
        });

        if (error || !data.user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error?.message ?? "Erro ao criar usuário no Supabase Auth.",
          });
        }

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              nome,
              telefone,
              email,
              role: "student",
              ativo: true,
            },
            {
              onConflict: "id",
            }
          );

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              profileError.message ?? "Erro ao criar perfil do aluno.",
          });
        }

        return {
          success: true,
          userId: data.user.id,
          email,
        } as const;
      }),


    updateMyProfile: protectedProcedure
      .input(
        z.object({
          nome: z.string().trim().min(1).max(120),
          email: z.string().email().nullable().optional(),
          avatarKey: z.string().trim().min(1).max(80),
          bio: z.string().max(180).nullable().optional(),
          provaAlvo: z.string().max(120).nullable().optional(),
          focoAtual: z.string().max(160).nullable().optional(),
          metaSemanalQuestoes: z.number().int().min(0).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: ctx.user.id,
              nome: input.nome,
              email: input.email ?? ctx.user.email ?? null,
              avatar_key: input.avatarKey,
              bio: input.bio?.trim() || null,
              prova_alvo: input.provaAlvo?.trim() || null,
              foco_atual: input.focoAtual?.trim() || null,
              meta_semanal_questoes: input.metaSemanalQuestoes ?? null,
            },
            { onConflict: "id" }
          )
          .select("*")
          .single();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data;
      }),


    getAccessStatus: protectedProcedure.query(async ({ ctx }) => {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role, ativo")
        .eq("id", ctx.user.id)
        .maybeSingle();

      if (profileError) throw new TRPCError({ code: "BAD_REQUEST", message: profileError.message });

      const profileRole = (profile as any)?.role;
      const role =
        ctx.user.role === "admin" || ctx.user.role === "editor"
          ? ctx.user.role
          : profileRole ?? ctx.user.role;
      const ativo = (profile as any)?.ativo;

      if (role === "admin" || role === "editor") {
        return {
          accessState: "allowed",
          role,
          ativo: ativo ?? true,
          hasActiveSubscription: true,
          subscriptionStatus: "admin_override",
          currentPeriodEnd: null,
          planName: null,
          blockReason: null,
          source: "role",
        } as const;
      }

      if (ativo === false) {
        return {
          accessState: "blocked",
          role,
          ativo,
          hasActiveSubscription: false,
          subscriptionStatus: null,
          currentPeriodEnd: null,
          planName: null,
          blockReason: "inactive_profile",
          source: "profile",
        } as const;
      }

      const latestSubscription = await getLatestUserBillingSubscription(ctx.user.id);
      const latestSubscriptionDetails = flattenBillingSubscription(latestSubscription);

      const rpcResponse = await supabaseAdmin.rpc("user_has_active_subscription", {
        target_user_id: ctx.user.id,
      });

      if (!rpcResponse.error && typeof rpcResponse.data === "boolean") {
        return {
          accessState: rpcResponse.data ? "allowed" : "blocked",
          role,
          ativo: ativo ?? true,
          hasActiveSubscription: rpcResponse.data,
          subscriptionStatus: latestSubscriptionDetails?.status ?? null,
          currentPeriodEnd: latestSubscriptionDetails?.current_period_end ?? null,
          planName: latestSubscriptionDetails?.plan_name ?? null,
          blockReason: rpcResponse.data ? null : (latestSubscriptionDetails ? "expired_subscription" : "no_subscription"),
          source: "rpc",
        } as const;
      }

      const now = new Date().toISOString();
      const { data: subscription, error: subscriptionError } = await supabaseAdmin
        .from("billing_subscriptions")
        .select("id")
        .eq("user_id", ctx.user.id)
        .in("status", ["active", "trialing"])
        .or(`current_period_end.is.null,current_period_end.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionError.message });

      return {
        accessState: subscription ? "allowed" : "blocked",
        role,
        ativo: ativo ?? true,
        hasActiveSubscription: Boolean(subscription),
        subscriptionStatus: latestSubscriptionDetails?.status ?? null,
        currentPeriodEnd: latestSubscriptionDetails?.current_period_end ?? null,
        planName: latestSubscriptionDetails?.plan_name ?? null,
        blockReason: subscription ? null : (latestSubscriptionDetails ? "expired_subscription" : "no_subscription"),
        source: "fallback",
      } as const;
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie?.(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return {
        success: true,
      } as const;
    }),
  }),

  billing: router({
    listPublicPlans: publicProcedure.query(async () => {
      const rpcResponse = await supabaseAdmin.rpc("get_public_billing_plans");

      if (!rpcResponse.error && Array.isArray(rpcResponse.data) && rpcResponse.data.length > 0) {
        return rpcResponse.data;
      }

      if (rpcResponse.error) {
        console.warn("[billing.listPublicPlans] RPC get_public_billing_plans falhou:", rpcResponse.error);
      }

      const { data, error } = await supabaseAdmin
        .from("billing_plans")
        .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions")
        .eq("is_active", true)
        .order("price_cents", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return (data ?? []).map((plan: any) => ({
        id: String(plan.id),
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        price_cents: plan.price_cents,
        currency: plan.currency,
        billing_cycle: plan.billing_cycle,
        is_active: plan.is_active,
        max_active_subscriptions: plan.max_active_subscriptions ?? null,
        active_subscriptions_count: 0,
        manual_review_count: 0,
        used_slots: 0,
        remaining_slots: plan.max_active_subscriptions ?? null,
        has_available_slots: true,
      }));
    }),

    requestManualSubscription: protectedProcedure
      .input(z.object({ planSlug: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        const planSlug = input.planSlug.trim();
        const planSlugCandidates = getBillingPlanSlugCandidates(planSlug);

        const publicPlansResponse = await supabaseAdmin.rpc("get_public_billing_plans");
        const publicPlans = !publicPlansResponse.error && Array.isArray(publicPlansResponse.data)
          ? publicPlansResponse.data
          : [];
        const publicPlan = publicPlans.find((plan: any) => planSlugCandidates.includes(plan.slug));

        if (publicPlan?.has_available_slots === false) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este plano atingiu o limite de vagas disponível no momento.",
          });
        }

        const { data: billingPlan, error: billingPlanError } = await supabaseAdmin
          .from("billing_plans")
          .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions")
          .in("slug", planSlugCandidates)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (billingPlanError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: billingPlanError.message });
        }

        if (!billingPlan?.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Plano não encontrado no banco. Slug enviado: ${planSlug}. Verifique os slugs em billing_plans.`,
          });
        }

        const { data: existingSubscriptions, error: existingSubscriptionsError } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("*")
          .eq("user_id", ctx.user.id)
          .in("status", ["manual_review", "active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(5);

        if (existingSubscriptionsError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: existingSubscriptionsError.message });
        }

        const existingSubscription = (existingSubscriptions ?? []).find(isBlockingBillingSubscription);

        if (existingSubscription) {
          return {
            ...existingSubscription,
            table_used: "billing_subscriptions",
          };
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, nome, telefone, email, role, ativo")
          .eq("id", ctx.user.id)
          .maybeSingle();

        const metadata = {
          origin: "site_beta_manual_pix",
          requestedAt: new Date().toISOString(),
          frontendPlanSlug: planSlug,
          databasePlanSlug: billingPlan.slug,
          paymentMethod: "pix_manual",
          plan: {
            slug: planSlug,
            dbSlug: billingPlan.slug,
            name: billingPlan.name,
            amountCents: billingPlan.price_cents,
            currency: billingPlan.currency ?? "BRL",
          },
          customer: {
            name: (profile as any)?.nome || ctx.user.email || "Aluno",
            email: (profile as any)?.email || ctx.user.email || null,
            phone: (profile as any)?.telefone || null,
          },
        };

        const payload = {
          user_id: ctx.user.id,
          plan_id: billingPlan.id,
          status: "manual_review",
          gateway: "manual",
          payment_url: null,
          metadata,
        };

        const { data, error } = await supabaseAdmin
          .from("billing_subscriptions")
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return {
          ...(data as any),
          table_used: "billing_subscriptions",
        };
      }),

    getMyActiveSubscription: protectedProcedure.query(async ({ ctx }) => {
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from("billing_subscriptions")
        .select("*")
        .eq("user_id", ctx.user.id)
        .in("status", ["active", "trialing"])
        .or(`current_period_end.is.null,current_period_end.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return data ?? null;
    }),

    getMyLatestSubscriptionRequest: protectedProcedure.query(async ({ ctx }) => {
      const latestSubscription = await getLatestUserBillingSubscription(ctx.user.id);
      return flattenBillingSubscription(latestSubscription);
    }),
  }),

  contentPages: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("content_pages")
          .select("*")
          .eq("slug", input.slug)
          .eq("is_published", true)
          .maybeSingle();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        if (!data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Página de conteúdo não encontrada.",
          });
        }

        return data;
      }),

    getBlocksByPageId: publicProcedure
      .input(z.object({ pageId: z.string().uuid() }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("content_blocks")
          .select("*")
          .eq("page_id", input.pageId)
          .eq("is_visible", true)
          .order("order_index", { ascending: true });

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ?? [];
      }),

    getWithBlocks: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        const { data: page, error: pageError } = await supabaseAdmin
          .from("content_pages")
          .select("*")
          .eq("slug", input.slug)
          .eq("is_published", true)
          .maybeSingle();

        if (pageError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: pageError.message });
        }

        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Página de conteúdo não encontrada.",
          });
        }

        const { data: blocks, error: blocksError } = await supabaseAdmin
          .from("content_blocks")
          .select("*")
          .eq("page_id", page.id)
          .eq("is_visible", true)
          .order("order_index", { ascending: true });

        if (blocksError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: blocksError.message });
        }

        return {
          page,
          blocks: blocks ?? [],
        };
      }),
  }),

  questions: router({
    list: publicProcedure
      .input(
        z
          .object({
            subject: z.string().optional(),
            exam: z.string().optional(),
            year: z.number().int().optional(),
            difficulty: z.string().optional(),
            institution: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        let query = supabaseAdmin.from("questoes").select(`
          *,
          resolucoes (
            id,
            tipo,
            texto,
            ordem,
            url_imagem
          )
        `);

        if (input?.subject) {
          query = query.or(`disciplina.eq.${input.subject},diciplina.eq.${input.subject}`);
        }

        if (input?.exam) {
          query = query.eq("banca", input.exam);
        }

        if (input?.year) {
          query = query.eq("ano", input.year);
        }

        if (input?.difficulty) {
          query = query.eq("dificuldade", input.difficulty);
        }

        if (input?.institution) {
          query = query.eq("instituição", input.institution);
        }

        query = query.eq("publicada", true);

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ?? [];
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("questoes")
          .select(`
            *,
            resolucoes (
              id,
              tipo,
              texto,
              ordem,
              url_imagem
            )
          `)
          .eq("id", input.id)
          .eq("publicada", true)
          .maybeSingle();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ?? null;
      }),
  }),

  notes: router({
    getQuestionNote: protectedProcedure
      .input(z.object({ questionId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await supabaseAdmin
          .from("question_notes")
          .select("*")
          .eq("user_id", ctx.user.id)
          .eq("question_id", input.questionId)
          .maybeSingle();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ?? null;
      }),

    saveQuestionNote: protectedProcedure
      .input(questionNoteInputSchema)
      .mutation(async ({ ctx, input }) => {
        const payload = {
          user_id: ctx.user.id,
          question_id: input.questionId,
          strokes: input.strokes,
          canvas_width: input.canvasWidth,
          canvas_height: input.canvasHeight,
          background_type: input.backgroundType,
          title: input.title ?? null,
          updated_at: new Date().toISOString(),
        };

        const { data: existing, error: existingError } = await supabaseAdmin
          .from("question_notes")
          .select("id")
          .eq("user_id", ctx.user.id)
          .eq("question_id", input.questionId)
          .maybeSingle();

        if (existingError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: existingError.message });
        }

        const query = existing?.id
          ? supabaseAdmin
              .from("question_notes")
              .update(payload)
              .eq("id", existing.id)
              .eq("user_id", ctx.user.id)
              .select("*")
              .single()
          : supabaseAdmin
              .from("question_notes")
              .insert(payload)
              .select("*")
              .single();

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data;
      }),

    deleteQuestionNote: protectedProcedure
      .input(z.object({ questionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("question_notes")
          .delete()
          .eq("user_id", ctx.user.id)
          .eq("question_id", input.questionId);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return { success: true } as const;
      }),
  }),

  admin: router({
    getDashboardStats: adminOrEditorProcedure.query(async () => {
      const [
        usersCountResult,
        adminsCountResult,
        questionsCountResult,
        unpublishedQuestionsCountResult,
        resolutionsCountResult,
        resolutionImagesResult,
        latestQuestionsResult,
        latestResolutionsResult,
        latestUsersResult,
        allQuestionsResult,
        allResolutionQuestionIdsResult,
      ] = await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("admin_users").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("questoes").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("questoes")
          .select("id", { count: "exact", head: true })
          .eq("publicada", false),
        supabaseAdmin.from("resolucoes").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("resolucoes")
          .select("id", { count: "exact", head: true })
          .not("url_imagem", "is", null),
        supabaseAdmin
          .from("questoes")
          .select("id,codigo,enunciado,banca,ano,created_at,publicada")
          .order("created_at", { ascending: false })
          .limit(5),
        supabaseAdmin
          .from("resolucoes")
          .select("id,questao_id,tipo,ordem,codigo_resolucao,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabaseAdmin
          .from("profiles")
          .select("id,nome,email,role,ativo,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabaseAdmin
          .from("questoes")
          .select("id,codigo,enunciado,banca,ano,created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("resolucoes").select("questao_id"),
      ]);

      const possibleError =
        usersCountResult.error ||
        adminsCountResult.error ||
        questionsCountResult.error ||
        unpublishedQuestionsCountResult.error ||
        resolutionsCountResult.error ||
        resolutionImagesResult.error ||
        latestQuestionsResult.error ||
        latestResolutionsResult.error ||
        latestUsersResult.error ||
        allQuestionsResult.error ||
        allResolutionQuestionIdsResult.error;

      if (possibleError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: possibleError.message ?? "Não foi possível carregar o dashboard administrativo.",
        });
      }

      const resolutionQuestionIds = new Set(
        ((allResolutionQuestionIdsResult.data as Array<{ questao_id: string | null }> | null) ?? [])
          .map((item) => item.questao_id)
          .filter(Boolean)
      );
      const allQuestions =
        (allQuestionsResult.data as Array<{
          id: string;
          codigo?: string | null;
          enunciado?: string | null;
          banca?: string | null;
          ano?: number | null;
          created_at?: string | null;
        }> | null) ?? [];
      const questionsWithoutResolution = allQuestions.filter(
        (question) => !resolutionQuestionIds.has(question.id)
      );

      return {
        stats: {
          totalUsers: usersCountResult.count ?? 0,
          totalAdmins: adminsCountResult.count ?? 0,
          totalQuestions: questionsCountResult.count ?? 0,
          totalQuestionsWithoutResolution: questionsWithoutResolution.length,
          totalUnpublishedQuestions: unpublishedQuestionsCountResult.count ?? 0,
          totalResolutions: resolutionsCountResult.count ?? 0,
          totalResolutionImages: resolutionImagesResult.count ?? 0,
        },
        latestQuestions: latestQuestionsResult.data ?? [],
        latestResolutions: latestResolutionsResult.data ?? [],
        latestUsers: latestUsersResult.data ?? [],
        latestQuestionsWithoutResolution: questionsWithoutResolution.slice(0, 5),
      } as const;
    }),
    listAdminLogs: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin
        .from("admin_logs")
        .select(
          "id,created_at,actor_user_id,actor_email,action,entity_type,entity_id,description,level,metadata"
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message ?? "Não foi possível carregar os logs administrativos.",
        });
      }

      return data ?? [];
    }),

    listProfiles: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id,nome,email,role,ativo,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message ?? "Não foi possível carregar os perfis.",
        });
      }

      return data ?? [];
    }),

    updateProfile: adminProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          nome: z.string().trim().min(1, "Nome é obrigatório").max(160),
          role: z.enum(["student", "admin", "editor"]),
          ativo: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .update({
            nome: input.nome,
            role: input.role,
            ativo: input.ativo,
          })
          .eq("id", input.id)
          .select("id,nome,email,role,ativo,created_at")
          .single();

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message ?? "Não foi possível salvar as alterações do perfil.",
          });
        }

        await supabaseAdmin.from("admin_logs").insert({
          actor_user_id: ctx.user.id,
          actor_email: ctx.user.email,
          action: "update_profile",
          entity_type: "profile",
          entity_id: input.id,
          description: `Perfil ${data.email ?? input.id} atualizado.`,
          level: "info",
          metadata: {
            role: input.role,
            ativo: input.ativo,
          },
        });

        return data;
      }),

    listResolutionOverview: adminOrEditorProcedure.query(async () => {
      const [questionsResult, resolutionsResult] = await Promise.all([
        supabaseAdmin
          .from("questoes")
          .select(
            "id,codigo,enunciado,disciplina,diciplina,conteudo,assunto,banca,ano,created_at"
          )
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("resolucoes").select("id,questao_id,tipo,url_imagem"),
      ]);

      const possibleError = questionsResult.error || resolutionsResult.error;

      if (possibleError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: possibleError.message ?? "Não foi possível carregar as resoluções.",
        });
      }

      return {
        questions: questionsResult.data ?? [],
        resolutions: resolutionsResult.data ?? [],
      } as const;
    }),

    createStudent: adminProcedure
      .input(
        z.object({
          nome: z.string().min(2, "Nome muito curto"),
          email: z.string().email("E-mail inválido"),
          senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const nome = input.nome.trim();
        const email = input.email.trim().toLowerCase();

        assertRequestRateLimit(ctx.req, "auth:register:ip", {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        assertRateLimit({
          key: `auth:register:email:${email}`,
          limit: 3,
          windowMs: 60 * 60 * 1000,
        });

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: input.senha,
          email_confirm: true,
          user_metadata: {
            nome,
          },
        });

        if (error || !data.user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error?.message ?? "Erro ao criar usuário no Supabase Auth.",
          });
        }

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              nome,
              email,
              role: "student",
              ativo: true,
            },
            {
              onConflict: "id",
            }
          );

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: profileError.message ?? "Erro ao criar perfil do aluno.",
          });
        }

        return {
          success: true,
          userId: data.user.id,
        } as const;
      }),

    listAdminUsers: adminProcedure.query(async () => {
      const { data: adminUsers, error: adminUsersError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (adminUsersError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: adminUsersError.message });
      }

      const userIds = Array.from(new Set((adminUsers ?? []).map((item: any) => item.user_id).filter(Boolean)));
      const { data: profiles, error: profilesError } = userIds.length
        ? await supabaseAdmin.from("profiles").select("*").in("id", userIds)
        : { data: [], error: null };

      if (profilesError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: profilesError.message });
      }

      const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));

      return (adminUsers ?? []).map((adminUser: any) => ({
        ...adminUser,
        profile: profileMap.get(adminUser.user_id) ?? null,
      }));
    }),


    listBillingPlans: adminProcedure.query(async () => {
      const { data: plans, error: plansError } = await supabaseAdmin
        .from("billing_plans")
        .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions")
        .order("price_cents", { ascending: true });

      if (plansError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: plansError.message });
      }

      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from("billing_subscriptions")
        .select("id, plan_id, status");

      if (subscriptionsError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionsError.message });
      }

      return (plans ?? []).map((plan: any) => {
        const planSubscriptions = (subscriptions ?? []).filter((item: any) => String(item.plan_id) === String(plan.id));
        const activeCount = planSubscriptions.filter((item: any) => ["active", "trialing"].includes(item.status)).length;
        const manualReviewCount = planSubscriptions.filter((item: any) => item.status === "manual_review").length;
        const usedSlots = activeCount + manualReviewCount;
        const maxSlots = plan.max_active_subscriptions ?? null;

        return {
          id: String(plan.id),
          slug: plan.slug,
          name: plan.name,
          description: plan.description ?? null,
          price_cents: Number(plan.price_cents || 0),
          currency: plan.currency ?? "BRL",
          billing_cycle: plan.billing_cycle ?? null,
          is_active: Boolean(plan.is_active),
          max_active_subscriptions: maxSlots,
          active_subscriptions_count: activeCount,
          manual_review_count: manualReviewCount,
          used_slots: usedSlots,
          remaining_slots: maxSlots == null ? null : Math.max(maxSlots - usedSlots, 0),
          has_available_slots: maxSlots == null || usedSlots < maxSlots,
        };
      });
    }),

    listBillingSubscriptions: adminProcedure.query(async () => {
      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from("billing_subscriptions")
        .select(`
          id,
          user_id,
          status,
          gateway,
          payment_url,
          plan_id,
          started_at,
          current_period_end,
          next_due_date,
          created_at,
          updated_at,
          billing_plans (
            id,
            slug,
            name,
            price_cents
          )
        `)
        .order("created_at", { ascending: false });

      if (subscriptionsError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionsError.message });
      }

      const userIds = Array.from(new Set((subscriptions ?? []).map((item: any) => item.user_id).filter(Boolean)));
      const { data: profiles, error: profilesError } = userIds.length
        ? await supabaseAdmin.from("profiles").select("id, nome, email").in("id", userIds)
        : { data: [], error: null };

      if (profilesError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: profilesError.message });
      }

      const profileMap = new Map((profiles ?? []).map((profile: any) => [String(profile.id), profile]));

      return (subscriptions ?? []).map((subscription: any) => {
        const profile = profileMap.get(String(subscription.user_id));
        const plan = pickBillingPlan(subscription);

        return {
          subscription_id: String(subscription.id),
          user_id: String(subscription.user_id),
          user_name: profile?.nome || "Aluno sem nome",
          user_email: profile?.email || "Sem e-mail",
          plan_id: plan?.id ? String(plan.id) : subscription.plan_id ? String(subscription.plan_id) : "",
          plan_slug: plan?.slug || "",
          plan_name: plan?.name || "Plano não encontrado",
          plan_price_cents: Number(plan?.price_cents || 0),
          status: subscription.status,
          gateway: subscription.gateway || "manual",
          payment_url: subscription.payment_url ?? null,
          started_at: subscription.started_at ?? null,
          current_period_end: subscription.current_period_end ?? null,
          next_due_date: subscription.next_due_date ?? null,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at,
        };
      });
    }),

    listBillingPlanInvites: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin
        .from("billing_plan_invites")
        .select(`
          id,
          plan_id,
          email,
          user_id,
          invite_code,
          used_at,
          expires_at,
          created_at,
          billing_plans (
            id,
            slug,
            name,
            price_cents
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return (data ?? []).map((invite: any) => {
        const plan = pickBillingPlan(invite);
        return {
          invite_id: String(invite.id),
          plan_id: plan?.id ? String(plan.id) : String(invite.plan_id),
          plan_slug: plan?.slug || "",
          plan_name: plan?.name || "Plano não encontrado",
          plan_price_cents: Number(plan?.price_cents || 0),
          email: invite.email ?? null,
          user_id: invite.user_id ?? null,
          invite_code: invite.invite_code ?? null,
          used_at: invite.used_at ?? null,
          expires_at: invite.expires_at ?? null,
          created_at: invite.created_at,
        };
      });
    }),

    listStudentsWithBilling: adminProcedure.query(async () => {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, nome, email, telefone, role, ativo, created_at, last_seen_at")
        .order("created_at", { ascending: false });

      if (profilesError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: profilesError.message });
      }

      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from("billing_subscriptions")
        .select(`
          id,
          user_id,
          status,
          plan_id,
          current_period_end,
          next_due_date,
          created_at,
          updated_at,
          billing_plans (
            id,
            slug,
            name,
            price_cents
          )
        `)
        .order("created_at", { ascending: false });

      if (subscriptionsError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionsError.message });
      }

      const subscriptionMap = new Map<string, any>();
      for (const subscription of subscriptions ?? []) {
        const userId = String((subscription as any).user_id);
        if (!subscriptionMap.has(userId)) subscriptionMap.set(userId, subscription);
      }

      return (profiles ?? []).map((profile: any) => {
        const subscription = subscriptionMap.get(String(profile.id));
        const plan = pickBillingPlan(subscription);

        return {
          id: String(profile.id),
          nome: profile.nome ?? null,
          email: profile.email ?? null,
          telefone: profile.telefone ?? null,
          role: profile.role ?? null,
          ativo: profile.ativo ?? null,
          created_at: profile.created_at ?? null,
          last_seen_at: profile.last_seen_at ?? null,
          subscription_id: subscription?.id ? String(subscription.id) : null,
          subscription_status: subscription?.status ?? null,
          plan_id: subscription?.plan_id ? String(subscription.plan_id) : plan?.id ? String(plan.id) : null,
          plan_slug: plan?.slug ?? null,
          plan_name: plan?.name ?? null,
          plan_price_cents: plan?.price_cents ?? null,
          current_period_end: subscription?.current_period_end ?? null,
          next_due_date: subscription?.next_due_date ?? null,
          subscription_created_at: subscription?.created_at ?? null,
          updated_at: subscription?.updated_at ?? null,
          attempts_count: 0,
          correct_count: 0,
          wrong_count: 0,
          last_answered_at: null,
        };
      });
    }),

    updateStudentProfile: adminProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          nome: z.string().max(180).nullable().optional(),
          telefone: z.string().max(40).nullable().optional(),
          role: z.string().max(40).default("student"),
          ativo: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            nome: input.nome || null,
            telefone: input.telefone || null,
            role: input.role || "student",
            ativo: input.ativo,
          })
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "student_profile_updated",
          entity_type: "profile",
          entity_id: input.id,
          description: "Perfil de aluno atualizado no ADM",
          level: "info",
          metadata: input,
        });

        return { success: true } as const;
      }),

    renewUserSubscription: adminProcedure
      .input(z.object({ userId: z.string().uuid(), planId: z.string().uuid(), months: z.number().int().min(1).max(24) }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const currentPeriodStart = now.toISOString();

        const { data: existing, error: existingError } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("id, current_period_end")
          .eq("user_id", input.userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: existingError.message });
        }

        const renewalBase = existing?.current_period_end && new Date(existing.current_period_end) > now
          ? new Date(existing.current_period_end)
          : now;
        const currentPeriodEnd = addMonthsIso(renewalBase, input.months);

        if (existing?.id) {
          const { error } = await supabaseAdmin
            .from("billing_subscriptions")
            .update({
              plan_id: input.planId,
              status: "active",
              gateway: "manual",
              started_at: currentPeriodStart,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              next_due_date: currentPeriodEnd,
              canceled_at: null,
            })
            .eq("id", existing.id);

          if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        } else {
          const { error } = await supabaseAdmin.from("billing_subscriptions").insert({
            user_id: input.userId,
            plan_id: input.planId,
            status: "active",
            gateway: "manual",
            started_at: currentPeriodStart,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            next_due_date: currentPeriodEnd,
          });

          if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_user_subscription_renewed",
          entity_type: "billing_subscription",
          entity_id: input.userId,
          description: "Assinatura de aluno renovada/liberada no ADM",
          level: "info",
          metadata: input,
        });

        return { success: true } as const;
      }),

    renewBillingSubscription: adminProcedure
      .input(z.object({ subscriptionId: z.string().uuid(), months: z.number().int().min(1).max(24).default(1) }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const { data: subscription, error: subscriptionError } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("id, current_period_end")
          .eq("id", input.subscriptionId)
          .maybeSingle();

        if (subscriptionError) throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionError.message });
        if (!subscription?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada." });

        const renewalBase = subscription.current_period_end && new Date(subscription.current_period_end) > now
          ? new Date(subscription.current_period_end)
          : now;
        const end = addMonthsIso(renewalBase, input.months);
        const { error } = await supabaseAdmin
          .from("billing_subscriptions")
          .update({
            status: "active",
            gateway: "manual",
            started_at: now.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: end,
            next_due_date: end,
            canceled_at: null,
          })
          .eq("id", input.subscriptionId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_subscription_renewed",
          entity_type: "billing_subscription",
          entity_id: input.subscriptionId,
          description: "Assinatura renovada/aprovada no ADM financeiro",
          level: "info",
          metadata: input,
        });

        return { success: true } as const;
      }),

    cancelBillingSubscription: adminProcedure
      .input(z.object({ subscriptionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date().toISOString();
        const { error } = await supabaseAdmin
          .from("billing_subscriptions")
          .update({ status: "canceled", canceled_at: now })
          .eq("id", input.subscriptionId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_subscription_canceled",
          entity_type: "billing_subscription",
          entity_id: input.subscriptionId,
          description: "Assinatura cancelada no ADM financeiro",
          level: "warning",
          metadata: input,
        });

        return { success: true } as const;
      }),

    updateBillingPlan: adminProcedure
      .input(
        z.object({
          planId: z.string().uuid(),
          name: z.string().min(1).max(160),
          description: z.string().max(2000).nullable().optional(),
          priceCents: z.number().int().min(0),
          maxActiveSubscriptions: z.number().int().min(0).nullable(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("billing_plans")
          .update({
            name: input.name,
            description: input.description ?? null,
            price_cents: input.priceCents,
            max_active_subscriptions: input.maxActiveSubscriptions,
            is_active: input.isActive,
          })
          .eq("id", input.planId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_plan_updated",
          entity_type: "billing_plan",
          entity_id: input.planId,
          description: "Plano financeiro atualizado no ADM",
          level: "info",
          metadata: input,
        });

        return { success: true } as const;
      }),

    createBillingPlanInvite: adminProcedure
      .input(z.object({ planSlug: z.string().min(1).max(160), email: z.string().email(), expiresAt: z.string().datetime().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { data: plan, error: planError } = await supabaseAdmin
          .from("billing_plans")
          .select("id, slug, name")
          .eq("slug", input.planSlug)
          .maybeSingle();

        if (planError) throw new TRPCError({ code: "BAD_REQUEST", message: planError.message });
        if (!plan?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });

        const { data, error } = await supabaseAdmin
          .from("billing_plan_invites")
          .insert({
            plan_id: plan.id,
            email: input.email.trim().toLowerCase(),
            invite_code: randomUUID(),
            expires_at: input.expiresAt ?? null,
          })
          .select("id")
          .single();

        if (error || !data?.id) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível criar o convite." });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_plan_invite_created",
          entity_type: "billing_plan_invite",
          entity_id: data.id,
          description: "Convite de plano criado no ADM financeiro",
          level: "info",
          metadata: { ...input, planId: plan.id },
        });

        return { id: data.id } as const;
      }),

    deleteBillingPlanInvite: adminProcedure
      .input(z.object({ inviteId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("billing_plan_invites")
          .delete()
          .eq("id", input.inviteId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_plan_invite_deleted",
          entity_type: "billing_plan_invite",
          entity_id: input.inviteId,
          description: "Convite de plano removido no ADM financeiro",
          level: "warning",
          metadata: input,
        });

        return { success: true } as const;
      }),

    grantAdminAccess: adminProcedure
      .input(z.object({ email: z.string().email(), role: z.enum(["admin", "editor"]) }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id, email")
          .eq("email", email)
          .maybeSingle();

        if (profileError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: profileError.message });
        }

        if (!profile?.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum usuário com esse e-mail foi encontrado em profiles." });
        }

        const { error } = await supabaseAdmin.from("admin_users").upsert(
          {
            user_id: profile.id,
            role: input.role,
          },
          { onConflict: "user_id" }
        );

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return { success: true } as const;
      }),

    updateAdminRole: adminProcedure
      .input(z.object({ id: z.string().uuid(), role: z.enum(["admin", "editor"]) }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("admin_users")
          .update({ role: input.role })
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return { success: true } as const;
      }),

    removeAdminAccess: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", input.id);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return { success: true } as const;
      }),


    getQuestionSuggestions: adminOrEditorProcedure.query(async () => {
      const { data, error } = await supabaseAdmin
        .from("questoes")
        .select("conteudo, conteudos, assunto, assuntos, assuntos_por_conteudo, banca, instituição");

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return data ?? [];
    }),

    getQuestionById: adminOrEditorProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("questoes")
          .select("*")
          .eq("id", input.id)
          .maybeSingle();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        if (!data) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Questão não encontrada." });
        }

        return data;
      }),


    listQuestions: adminOrEditorProcedure.query(async () => {
      const [questionsResult, resolutionsResult] = await Promise.all([
        supabaseAdmin
          .from("questoes")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("resolucoes")
          .select("id, questao_id, tipo, url_imagem"),
      ]);

      if (questionsResult.error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: questionsResult.error.message });
      }

      if (resolutionsResult.error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: resolutionsResult.error.message });
      }

      return {
        questions: questionsResult.data ?? [],
        resolutions: resolutionsResult.data ?? [],
      };
    }),

    createQuestion: adminOrEditorProcedure
      .input(z.object({ payload: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseAdmin
          .from("questoes")
          .insert([input.payload])
          .select("id, codigo")
          .single();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        if (!data?.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A questão foi criada, mas o ID não retornou." });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "question_created",
          entity_type: "questao",
          entity_id: data.id,
          description: `Questão ${(data as any)?.codigo || data.id} criada no ADM`,
          level: "info",
          metadata: input.payload,
        });

        return { id: data.id } as const;
      }),

    importQuestionBatch: adminProcedure
      .input(questionImportPayloadSchema)
      .mutation(async ({ ctx, input }) => {
        const startedAt = Date.now();
        const results: Array<{
          index: number;
          importSourceId: string;
          status: ImportResultStatus;
          questionId: string | null;
          codigo: string | null;
          resolutionBlocksSaved: number;
          message: string;
        }> = [];

        for (const question of input.questions) {
          const preview = validateQuestionImportItem(question);
          const importSourceId = getQuestionImportSourceId(question);

          if (preview.status === "invalida") {
            results.push({
              index: question.raw_index,
              importSourceId,
              status: "falhou",
              questionId: null,
              codigo: question.codigo,
              resolutionBlocksSaved: 0,
              message: preview.errors.join(" ") || "Questão inválida.",
            });
            continue;
          }

          try {
            const duplicateResult = await supabaseAdmin
              .from("questoes")
              .select("id, codigo")
              .eq("import_source_id", importSourceId)
              .maybeSingle();

            if (duplicateResult.error) {
              throw new Error(
                duplicateResult.error.message.includes("import_source_id")
                  ? "A migration de importação em lote ainda não foi aplicada no Supabase. Rode o SQL criado neste PR antes de importar."
                  : "Não foi possível verificar duplicidade da questão."
              );
            }

            if (duplicateResult.data?.id) {
              results.push({
                index: question.raw_index,
                importSourceId,
                status: "duplicada",
                questionId: duplicateResult.data.id,
                codigo: (duplicateResult.data as any).codigo ?? question.codigo,
                resolutionBlocksSaved: 0,
                message: "Questão já importada anteriormente.",
              });
              continue;
            }

            const payload = buildQuestionInsertPayload(question, input.batchId, ctx.user.id);
            const { data, error } = await supabaseAdmin
              .from("questoes")
              .insert([payload])
              .select("id, codigo")
              .single();

            if (error || !data?.id) {
              throw new Error(error?.message.includes("import_source_id")
                ? "A migration de importação em lote ainda não foi aplicada no Supabase. Rode o SQL criado neste PR antes de importar."
                : "Não foi possível criar a questão.");
            }

            const resolutionPayload = question.resolucao_blocos.map((block) =>
              normalizeResolutionBlockPayload(data.id, block)
            );
            const resolutionResult = await supabaseAdmin
              .from("resolucoes")
              .insert(resolutionPayload)
              .select("id");

            if (resolutionResult.error || !resolutionResult.data) {
              await supabaseAdmin.from("resolucoes_meta").delete().eq("questao_id", data.id);
              await supabaseAdmin.from("resolucoes").delete().eq("questao_id", data.id);
              await supabaseAdmin.from("questoes").delete().eq("id", data.id);
              throw new Error("Questão criada, mas a resolução falhou; a questão foi revertida.");
            }

            results.push({
              index: question.raw_index,
              importSourceId,
              status: "criada",
              questionId: data.id,
              codigo: (data as any).codigo ?? question.codigo,
              resolutionBlocksSaved: resolutionResult.data.length,
              message: "Questão e resolução importadas com sucesso.",
            });
          } catch (error) {
            results.push({
              index: question.raw_index,
              importSourceId,
              status: "falhou",
              questionId: null,
              codigo: question.codigo,
              resolutionBlocksSaved: 0,
              message: error instanceof Error ? error.message : "Falha inesperada ao importar a questão.",
            });
          }
        }

        const createdCount = results.filter((result) => result.status === "criada").length;
        const duplicatedCount = results.filter((result) => result.status === "duplicada").length;
        const failedCount = results.filter((result) => result.status === "falhou").length;
        const resolutionBlocksSaved = results.reduce((sum, result) => sum + result.resolutionBlocksSaved, 0);
        const durationMs = Date.now() - startedAt;

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "question_batch_imported",
          entity_type: "question_import_batch",
          entity_id: input.batchId,
          description: `Importação em lote: ${createdCount} criada(s), ${duplicatedCount} duplicada(s), ${failedCount} falha(s)`,
          level: failedCount > 0 ? "warning" : "info",
          metadata: {
            batchId: input.batchId,
            receivedCount: input.questions.length,
            createdCount,
            duplicatedCount,
            failedCount,
            resolutionBlocksSaved,
            durationMs,
          },
        });

        return {
          batchId: input.batchId,
          createdCount,
          duplicatedCount,
          failedCount,
          resolutionBlocksSaved,
          durationMs,
          results,
        } as const;
      }),

    createAdminImageUpload: adminOrEditorProcedure
      .input(
        z.object({
          bucket: z.enum(["questoes-imagens", "resolucoes-imagens"]),
          originalName: z.string().min(1).max(180),
          contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
          context: z.string().min(1).max(120).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const extensionByType: Record<typeof input.contentType, string> = {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
        };
        const safeContext = (input.context || "admin-upload")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9/_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 100) || "admin-upload";
        const extension = extensionByType[input.contentType];
        const path = `${safeContext}/${Date.now()}-${randomUUID()}.${extension}`;

        const { data, error } = await supabaseAdmin.storage
          .from(input.bucket)
          .createSignedUploadUrl(path);

        if (error || !data?.token) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error?.message ?? "Não foi possível criar URL assinada para upload.",
          });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from(input.bucket)
          .getPublicUrl(path);

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "admin_image_signed_upload_created",
          entity_type: "storage_object",
          entity_id: path,
          description: `URL assinada criada para upload em ${input.bucket}`,
          level: "info",
          metadata: {
            bucket: input.bucket,
            path,
            contentType: input.contentType,
            originalName: input.originalName,
            context: input.context ?? null,
          },
        });

        return {
          bucket: input.bucket,
          path,
          token: data.token,
          signedUrl: data.signedUrl,
          publicUrl: publicUrlData.publicUrl,
        } as const;
      }),

    getResolutionEditor: adminOrEditorProcedure
      .input(z.object({ questaoId: z.string().uuid() }))
      .query(async ({ input }) => {
        const [questionResult, blocksResult, metaResult] = await Promise.all([
          supabaseAdmin
            .from("questoes")
            .select("id, codigo, enunciado")
            .eq("id", input.questaoId)
            .maybeSingle(),
          supabaseAdmin
            .from("resolucoes")
            .select("id, questao_id, tipo, texto, ordem, url_imagem, codigo_resolucao, created_at")
            .eq("questao_id", input.questaoId)
            .order("ordem", { ascending: true }),
          supabaseAdmin
            .from("resolucoes_meta")
            .select("*")
            .eq("questao_id", input.questaoId)
            .maybeSingle(),
        ]);

        if (questionResult.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: questionResult.error.message });
        }

        if (!questionResult.data) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Questão não encontrada." });
        }

        if (blocksResult.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: blocksResult.error.message });
        }

        if (metaResult.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: metaResult.error.message });
        }

        return {
          question: questionResult.data,
          blocks: blocksResult.data ?? [],
          meta: metaResult.data ?? null,
        };
      }),

    saveResolutionAuthor: adminOrEditorProcedure
      .input(z.object({ questaoId: z.string().uuid(), autorNome: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        const autorNome = input.autorNome.trim();
        const { data, error } = await supabaseAdmin
          .from("resolucoes_meta")
          .upsert(
            {
              questao_id: input.questaoId,
              autor_nome: autorNome,
            },
            { onConflict: "questao_id" }
          )
          .select("*")
          .single();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "resolution_author_saved",
          entity_type: "resolucao_meta",
          entity_id: input.questaoId,
          description: `Autor da resolução definido como ${autorNome}`,
          level: "info",
          metadata: {
            questaoId: input.questaoId,
            autorNome,
          },
        });

        return { meta: data } as const;
      }),

    saveResolutionBlock: adminOrEditorProcedure
      .input(z.object({ questaoId: z.string().uuid(), block: resolutionBlockInputSchema }))
      .mutation(async ({ ctx, input }) => {
        const payload = normalizeResolutionBlockPayload(input.questaoId, input.block);

        if (input.block.id) {
          const { data, error } = await supabaseAdmin
            .from("resolucoes")
            .update(payload)
            .eq("id", input.block.id)
            .eq("questao_id", input.questaoId)
            .select("id")
            .maybeSingle();

          if (error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          }

          if (!data?.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Bloco de resolução não encontrado." });
          }

          await supabaseAdmin.from("admin_logs").insert({
            admin_user_id: ctx.user.id,
            action: "resolution_block_updated",
            entity_type: "resolucao",
            entity_id: data.id,
            description: "Bloco de resolução atualizado no ADM",
            level: "info",
            metadata: { questaoId: input.questaoId, ...payload },
          });

          return { id: data.id } as const;
        }

        const { data, error } = await supabaseAdmin
          .from("resolucoes")
          .insert(payload)
          .select("id")
          .single();

        if (error || !data?.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível criar o bloco." });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "resolution_block_created",
          entity_type: "resolucao",
          entity_id: data.id,
          description: "Bloco de resolução criado no ADM",
          level: "info",
          metadata: { questaoId: input.questaoId, ...payload },
        });

        return { id: data.id } as const;
      }),

    saveResolutionBlocks: adminOrEditorProcedure
      .input(
        z.object({
          questaoId: z.string().uuid(),
          blocks: z.array(resolutionBlockInputSchema).min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const savedBlocks: Array<{ id: string; index: number }> = [];
        let createdCount = 0;
        let updatedCount = 0;

        for (let index = 0; index < input.blocks.length; index += 1) {
          const block = input.blocks[index];
          const payload = normalizeResolutionBlockPayload(input.questaoId, block);

          if (block.id) {
            const { data, error } = await supabaseAdmin
              .from("resolucoes")
              .update(payload)
              .eq("id", block.id)
              .eq("questao_id", input.questaoId)
              .select("id")
              .maybeSingle();

            if (error) {
              throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
            }

            if (!data?.id) {
              throw new TRPCError({ code: "NOT_FOUND", message: `Bloco ${index + 1} não encontrado.` });
            }

            updatedCount += 1;
            savedBlocks.push({ id: data.id, index });
          } else {
            const { data, error } = await supabaseAdmin
              .from("resolucoes")
              .insert(payload)
              .select("id")
              .single();

            if (error || !data?.id) {
              throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? `Não foi possível criar o bloco ${index + 1}.` });
            }

            createdCount += 1;
            savedBlocks.push({ id: data.id, index });
          }
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "resolution_blocks_saved",
          entity_type: "resolucao",
          entity_id: input.questaoId,
          description: "Blocos de resolução salvos em lote no ADM",
          level: "info",
          metadata: {
            questaoId: input.questaoId,
            totalBlocos: input.blocks.length,
            criados: createdCount,
            atualizados: updatedCount,
          },
        });

        return { blocks: savedBlocks, createdCount, updatedCount } as const;
      }),

    deleteResolutionBlock: adminOrEditorProcedure
      .input(z.object({ questaoId: z.string().uuid(), id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { data: block, error: blockError } = await supabaseAdmin
          .from("resolucoes")
          .select("id, questao_id, tipo, ordem, url_imagem")
          .eq("id", input.id)
          .eq("questao_id", input.questaoId)
          .maybeSingle();

        if (blockError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: blockError.message });
        }

        if (!block?.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bloco de resolução não encontrado." });
        }

        const { error } = await supabaseAdmin
          .from("resolucoes")
          .delete()
          .eq("id", input.id)
          .eq("questao_id", input.questaoId);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "resolution_block_deleted",
          entity_type: "resolucao",
          entity_id: input.id,
          description: "Bloco de resolução excluído no ADM",
          level: "warning",
          metadata: block,
        });

        return { success: true } as const;
      }),

    updateQuestion: adminOrEditorProcedure
      .input(z.object({ id: z.string().uuid(), payload: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin
          .from("questoes")
          .update(input.payload)
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "question_updated",
          entity_type: "questao",
          entity_id: input.id,
          description: `Questão ${(input.payload as any).codigo || input.id} editada no ADM`,
          level: "info",
          metadata: input.payload,
        });

        return { success: true } as const;
      }),

    setQuestionPublished: adminOrEditorProcedure
      .input(z.object({ id: z.string().uuid(), publicada: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const { data: question, error: questionError } = await supabaseAdmin
          .from("questoes")
          .select("id, codigo, disciplina, diciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição")
          .eq("id", input.id)
          .maybeSingle();

        if (questionError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: questionError.message });
        }

        const { error } = await supabaseAdmin
          .from("questoes")
          .update({ publicada: input.publicada })
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: input.publicada ? "question_published" : "question_unpublished",
          entity_type: "questao",
          entity_id: input.id,
          description: `Questão ${(question as any)?.codigo || input.id} ${input.publicada ? "publicada" : "despublicada"} no ADM`,
          level: "info",
          metadata: {
            ...((question as Record<string, unknown> | null) ?? {}),
            publicada: input.publicada,
          },
        });

        return { success: true } as const;
      }),



    listQuestionReports: adminOrEditorProcedure.query(async () => {
      const { data: reports, error: reportsError } = await supabaseAdmin
        .from("question_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (reportsError) throw new TRPCError({ code: "BAD_REQUEST", message: reportsError.message });

      const loadedReports = reports ?? [];
      const questionIds = Array.from(new Set(loadedReports.map((report: any) => report.question_id).filter(Boolean)));
      const userIds = Array.from(new Set(loadedReports.map((report: any) => report.user_id).filter(Boolean)));

      const [questionsResult, profilesResult] = await Promise.all([
        questionIds.length > 0
          ? supabaseAdmin
              .from("questoes")
              .select("id, codigo, disciplina, diciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição, enunciado")
              .in("id", questionIds)
          : Promise.resolve({ data: [], error: null }),
        userIds.length > 0
          ? supabaseAdmin
              .from("profiles")
              .select("id, nome, email")
              .in("id", userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (questionsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: questionsResult.error.message });
      if (profilesResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profilesResult.error.message });

      return {
        reports: loadedReports,
        questions: questionsResult.data ?? [],
        profiles: profilesResult.data ?? [],
      };
    }),

    updateQuestionReport: adminOrEditorProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: z.enum(["pendente", "em_analise", "resolvido", "ignorado"]).optional(),
          adminNote: z.string().max(5000).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.status !== undefined) payload.status = input.status;
        if (input.adminNote !== undefined) payload.admin_note = input.adminNote;

        const { data, error } = await supabaseAdmin
          .from("question_reports")
          .update(payload)
          .eq("id", input.id)
          .select("*")
          .single();

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "question_report_updated",
          entity_type: "question_report",
          entity_id: input.id,
          description: `Report de erro atualizado para status ${(data as any)?.status ?? input.status ?? "sem alteração"}`,
          level: "info",
          metadata: {
            reportId: input.id,
            questionId: (data as any)?.question_id ?? null,
            status: (data as any)?.status ?? input.status ?? null,
            adminNote: (data as any)?.admin_note ?? null,
          },
        });

        return data;
      }),

    deleteQuestion: adminOrEditorProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { data: question, error: questionError } = await supabaseAdmin
          .from("questoes")
          .select("id, codigo, disciplina, diciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição")
          .eq("id", input.id)
          .maybeSingle();

        if (questionError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: questionError.message });
        }

        const { error: deleteResolutionsMetaError } = await supabaseAdmin
          .from("resolucoes_meta")
          .delete()
          .eq("questao_id", input.id);

        if (deleteResolutionsMetaError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: deleteResolutionsMetaError.message });
        }

        const { error: deleteResolutionsError } = await supabaseAdmin
          .from("resolucoes")
          .delete()
          .eq("questao_id", input.id);

        if (deleteResolutionsError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: deleteResolutionsError.message });
        }

        const { error: deleteQuestionError } = await supabaseAdmin
          .from("questoes")
          .delete()
          .eq("id", input.id);

        if (deleteQuestionError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: deleteQuestionError.message });
        }

        await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "question_deleted",
          entity_type: "questao",
          entity_id: input.id,
          description: `Questão ${(question as any)?.codigo || input.id} excluída no ADM`,
          level: "warning",
          metadata: question ?? { id: input.id },
        });

        return { success: true } as const;
      }),
  }),



  publicStats: router({
    getRankingData: publicProcedure.query(async () => {
      const [attemptsResult, profilesResult] = await Promise.all([
        supabaseAdmin
          .from("user_question_attempts")
          .select("id,user_id,question_id,is_correct,time_spent_seconds,answered_at,subject,conteudo,assunto,banca,ano,difficulty")
          .order("answered_at", { ascending: false }),
        supabaseAdmin
          .from("profiles")
          .select("id,nome,avatar_key,ativo")
          .eq("ativo", true),
      ]);

      if (attemptsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
      if (profilesResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profilesResult.error.message });

      return { attempts: attemptsResult.data ?? [], profiles: profilesResult.data ?? [] };
    }),

    getPublicProfile: publicProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        const [profileResult, attemptsResult, profilesResult] = await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("id,nome,ativo,created_at,last_seen_at,avatar_key,bio,prova_alvo,foco_atual,meta_semanal_questoes")
            .eq("id", input.userId)
            .maybeSingle(),
          supabaseAdmin
            .from("user_question_attempts")
            .select("id,user_id,question_id,is_correct,time_spent_seconds,answered_at,attempt_number,subject,conteudo,assunto,banca,ano,difficulty")
            .order("answered_at", { ascending: false }),
          supabaseAdmin
            .from("profiles")
            .select("id,nome,avatar_key,ativo")
            .eq("ativo", true),
        ]);

        if (profileResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profileResult.error.message });
        if (attemptsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
        if (profilesResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profilesResult.error.message });

        if (!profileResult.data || profileResult.data.ativo === false) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não disponível." });
        }

        return {
          profile: profileResult.data,
          attempts: attemptsResult.data ?? [],
          profiles: profilesResult.data ?? [],
        };
      }),
  }),

  vet: router({
    getObjective: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseAdmin
        .from("user_vet_profiles")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return data ?? null;
    }),

    saveObjective: protectedProcedure
      .input(
        z.object({
          targetExam: z.string().min(2).max(40),
          monthsUntilExam: z.number().int().min(1).max(120),
          hoursPerDay: z.number().min(0.5).max(24),
          focusSubject: z.string().min(1).max(160),
          studyDaysPerWeek: z.number().int().min(1).max(7),
          studyWeekdays: z.array(z.string().max(20)).min(1).max(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const payload = {
          user_id: ctx.user.id,
          target_exam: input.targetExam,
          months_until_exam: input.monthsUntilExam,
          hours_per_day: input.hoursPerDay,
          focus_subject: input.focusSubject,
          study_days_per_week: input.studyDaysPerWeek,
          study_weekdays: input.studyWeekdays,
        };

        const { data, error } = await supabaseAdmin
          .from("user_vet_profiles")
          .upsert(payload, { onConflict: "user_id" })
          .select("*")
          .single();

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return data;
      }),

    getLearningData: protectedProcedure.query(async ({ ctx }) => {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("user_vet_profiles")
        .select("*")
        .eq("user_id", ctx.user.id)
        .maybeSingle();

      if (profileError) throw new TRPCError({ code: "BAD_REQUEST", message: profileError.message });

      if (!profile?.target_exam) {
        return { profile: profile ?? null, attempts: [], weights: [], collectiveStats: [] };
      }

      const [attemptsResponse, weightsResponse, collectiveResponse] = await Promise.all([
        supabaseAdmin
          .from("user_question_attempts")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("answered_at", { ascending: false }),
        supabaseAdmin
          .from("vet_exam_content_weights")
          .select("*")
          .eq("exam", profile.target_exam),
        supabaseAdmin
          .from("vet_content_collective_stats")
          .select("*")
          .eq("exam", profile.target_exam),
      ]);

      if (attemptsResponse.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResponse.error.message });
      if (weightsResponse.error) throw new TRPCError({ code: "BAD_REQUEST", message: weightsResponse.error.message });
      if (collectiveResponse.error) throw new TRPCError({ code: "BAD_REQUEST", message: collectiveResponse.error.message });

      return {
        profile,
        attempts: attemptsResponse.data ?? [],
        weights: weightsResponse.data ?? [],
        collectiveStats: collectiveResponse.data ?? [],
      };
    }),
  }),

  quiz: router({

    getResolutionAuthors: publicProcedure
      .input(
        z.object({
          questionIds: z.array(z.string().uuid()).min(1).max(100),
        })
      )
      .query(async ({ input }) => {
        const uniqueQuestionIds = Array.from(new Set(input.questionIds));
        const { data, error } = await supabaseAdmin
          .from("resolucoes_meta")
          .select("questao_id, autor_nome")
          .in("questao_id", uniqueQuestionIds);

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ?? [];
      }),

    createQuestionReport: protectedProcedure
      .input(
        z.object({
          questionId: z.string().uuid(),
          reportType: z.enum(["enunciado", "alternativa", "gabarito", "resolucao", "imagem", "latex", "outro"]),
          comment: z.string().max(2000).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertRateLimit({
          key: `question-report:${ctx.user.id}`,
          limit: 10,
          windowMs: 60 * 60 * 1000,
        });

        const { data, error } = await supabaseAdmin
          .from("question_reports")
          .insert({
            question_id: input.questionId,
            user_id: ctx.user.id,
            report_type: input.reportType,
            comment: input.comment?.trim() || null,
            status: "pendente",
          })
          .select("id")
          .single();

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return { id: data.id } as const;
      }),
    getQuestionOptionStats: protectedProcedure
      .input(z.object({ questionId: z.string().uuid() }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("user_question_attempts")
          .select("selected_option")
          .eq("question_id", input.questionId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        const counts = new Map<string, number>();
        for (const row of data ?? []) {
          const option = (row as any).selected_option;
          if (!option) continue;
          counts.set(option, (counts.get(option) ?? 0) + 1);
        }

        return Array.from(counts.entries()).map(([selected_option, total]) => ({ selected_option, total }));
      }),

    recordAttempt: protectedProcedure
      .input(
        z.object({
          questionId: z.string().uuid(),
          selectedOption: z.string().min(1).max(20),
          isCorrect: z.boolean(),
          timeSpentSeconds: z.number().int().min(1).max(24 * 60 * 60),
          subject: z.string().max(160).nullable().optional(),
          conteudo: z.string().max(220).nullable().optional(),
          assunto: z.string().max(220).nullable().optional(),
          banca: z.string().max(160).nullable().optional(),
          ano: z.union([z.number().int(), z.string()]).nullable().optional(),
          difficulty: z.string().max(80).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertRateLimit({
          key: `quiz:attempt:${ctx.user.id}`,
          limit: 120,
          windowMs: 60 * 60 * 1000,
        });

        const { count, error: countError } = await supabaseAdmin
          .from("user_question_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.user.id)
          .eq("question_id", input.questionId);

        if (countError) throw new TRPCError({ code: "BAD_REQUEST", message: countError.message });

        const attemptNumber = (count ?? 0) + 1;
        const parsedYear = typeof input.ano === "string" ? Number.parseInt(input.ano, 10) : input.ano;
        const { data, error } = await supabaseAdmin
          .from("user_question_attempts")
          .insert({
            user_id: ctx.user.id,
            question_id: input.questionId,
            selected_option: input.selectedOption,
            is_correct: input.isCorrect,
            time_spent_seconds: input.timeSpentSeconds,
            attempt_number: attemptNumber,
            subject: input.subject ?? null,
            conteudo: input.conteudo ?? null,
            assunto: input.assunto ?? null,
            banca: input.banca ?? null,
            ano: Number.isFinite(parsedYear as number) ? parsedYear : null,
            difficulty: input.difficulty ?? null,
          })
          .select("id, attempt_number")
          .single();

        if (error || !data?.id) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível salvar a tentativa." });

        return { id: data.id, attemptNumber: data.attempt_number } as const;
      }),

    getMyAttempts: protectedProcedure
      .input(
        z.object({
          onlyWrong: z.boolean().optional(),
          summary: z.boolean().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        let query = supabaseAdmin
          .from("user_question_attempts")
          .select(input?.summary ? "question_id,is_correct,answered_at" : "*")
          .eq("user_id", ctx.user.id)
          .order("answered_at", { ascending: false });

        if (input?.onlyWrong) query = query.eq("is_correct", false);

        const { data, error } = await query;
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return data ?? [];
      }),

    getErrorNotebook: protectedProcedure.query(async ({ ctx }) => {
      const [attemptsResult, reviewResult] = await Promise.all([
        supabaseAdmin
          .from("user_question_attempts")
          .select("*")
          .eq("user_id", ctx.user.id)
          .eq("is_correct", false)
          .order("answered_at", { ascending: false }),
        supabaseAdmin
          .from("user_error_review_status")
          .select("*")
          .eq("user_id", ctx.user.id),
      ]);

      if (attemptsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
      if (reviewResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: reviewResult.error.message });

      return { attempts: attemptsResult.data ?? [], reviewStatuses: reviewResult.data ?? [] };
    }),

    upsertErrorReviewStatus: protectedProcedure
      .input(
        z.object({
          questionId: z.string().uuid(),
          reviewed: z.boolean(),
          reviewedAt: z.string().datetime().nullable().optional(),
          errorType: z.string().max(120).nullable().optional(),
          note: z.string().max(5000).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const payload = {
          user_id: ctx.user.id,
          question_id: input.questionId,
          reviewed: input.reviewed,
          reviewed_at: input.reviewed ? input.reviewedAt ?? new Date().toISOString() : null,
          error_type: input.errorType ?? null,
          note: input.note ?? null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("user_error_review_status")
          .upsert(payload, { onConflict: "user_id,question_id" })
          .select()
          .single();

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return data;
      }),

    getProfileStats: protectedProcedure.query(async ({ ctx }) => {
      const [profileResult, attemptsResult, profilesResult] = await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", ctx.user.id).maybeSingle(),
        supabaseAdmin.from("user_question_attempts").select("*").order("answered_at", { ascending: false }),
        supabaseAdmin.from("profiles").select("id, nome, email, avatar_key, ativo"),
      ]);

      if (profileResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profileResult.error.message });
      if (attemptsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
      if (profilesResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profilesResult.error.message });

      return {
        profile: profileResult.data ?? null,
        attempts: attemptsResult.data ?? [],
        profiles: profilesResult.data ?? [],
      };
    }),
  }),

  ai: router({
    solvePhysics: protectedProcedure
      .input(
        z.object({
          text: z.string().max(8000).optional(),
          imageBase64: z.string().max(4_000_000).optional(),
          imageMimeType: z.enum(["image/png", "image/jpeg", "image/webp"]).optional(),
          mode: z.enum(["calculations", "detailed"]).default("detailed"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { text, imageBase64, imageMimeType, mode } = input;

        assertRateLimit({
          key: `ai:solve:user:${ctx.user.id}`,
          limit: 20,
          windowMs: 60 * 60 * 1000,
        });
        assertRequestRateLimit(ctx.req, "ai:solve:ip", {
          limit: 60,
          windowMs: 60 * 60 * 1000,
        });

        if (!text && !imageBase64) {
          throw new Error("Forneça um texto ou uma imagem da questão.");
        }

        const detailedSystemPrompt =
          "Você é um professor de elite e especialista em competições científicas (ITA, IME, IMO, IPhO). Sua missão é resolver problemas complexos de forma EXTREMAMENTE EXPLICATIVA e DIDÁTICA. Para cada passo da resolução, explique o 'porquê' físico ou matemático, os conceitos fundamentais envolvidos e a estratégia adotada. Não apenas mostre o cálculo, mas ensine o raciocínio. OBRIGATORIAMENTE, use '$$' para equações em bloco e '$' para matemática inline. Toda variável, unidade ou fórmula deve estar em LaTeX. A resolução deve ser profunda, clara e chegar ao resultado final com uma conclusão pedagógica.";
        const calculationsSystemPrompt =
          "Você é um professor de elite especialista em competições científicas (ITA, IME, IMO, IPhO). Resolva o problema mostrando APENAS os cálculos passo a passo, as fórmulas utilizadas e o resultado final. Não inclua explicações teóricas ou conceituais. Use LaTeX com '$$' para equações em bloco e '$' para inline. Seja conciso e direto.";

        const messages: any[] = [
          {
            role: "system",
            content: mode === "calculations" ? calculationsSystemPrompt : detailedSystemPrompt,
          },
        ];

        const userContent: any[] = [];

        if (text) {
          userContent.push({ type: "text", text });
        }

        if (imageBase64 && imageMimeType) {
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${imageMimeType};base64,${imageBase64}`,
            },
          });
        }

        messages.push({ role: "user", content: userContent });

        const response = await invokeLLM({
          messages,
        });

        const content = response.choices[0]?.message?.content;
        const resultText =
          typeof content === "string" ? content : "Erro ao processar.";

        return { result: resultText };
      }),
  }),
});

export type AppRouter = typeof appRouter;
