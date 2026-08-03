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
  cancelAdminMercadoPagoSubscription,
  cancelUserMercadoPagoSubscription,
  createCardSubscriptionCheckout,
  createPixPayment,
  getBillingCapabilities,
  getMyPayments,
  reconcileDuplicateMercadoPagoSubscriptions,
  reconcileMercadoPagoPaymentByAdmin,
  syncMyMercadoPagoPaymentStatus,
} from "./billing/billingService.js";
import {
  buildQuestionInsertPayload,
  getQuestionImportSourceId,
  questionImportPayloadSchema,
  validateQuestionImportItem,
  type ImportResultStatus,
} from "../shared/questionImportSchema.js";
import {
  QUESTION_PDF_EXPORT_LIMIT,
  questionPdfFiltersSchema,
  questionRowMatchesPdfFilters,
} from "../shared/questionPdf.js";
import { NOTEBOOK_DEVELOPMENT_MESSAGE, NOTEBOOK_FEATURE_AVAILABLE } from "../shared/featureAvailability.js";
import { createGoogleDriveConnectUrl, createNotebook, disconnectGoogleDrive, getNotebook, googleDriveStatus, listNotebooks, renameNotebook, trashNotebook, updateNotebook, uploadNotebookPdf } from "./googleDrive/googleDriveService.js";
import { createQuestionReport } from "./questionReports.js";
import { assertUserCanCheckoutPlan, hasLegacyFounderEligibility, isSamePlanFamily, LEGACY_FOUNDER_SLUG, publicPlanAvailability } from "./billing/legacyFounderPricing.js";
import { getCanonicalVetAnalysis, safeQuestionDto, VET_ENGINE_VERSION } from "./vet/vetService.js";
import { normalizeVetText } from "../shared/vet/vetEngine.js";
import { filterVetQuestionPool, getExamAliases, getSubjectAliases, matchesVetContent, postgrestAliasFilter, prioritizeVetCandidates } from "./vet/vetQuestionSelection.js";

const notebookPaperSchema = z.object({ size: z.enum(["a5", "a4", "a3", "infinite"]), lined: z.boolean() });
const stableVetOrder = (seed: string, value: string) => Array.from(`${seed}:${value}`).reduce((hash, char) => ((hash * 31) ^ char.charCodeAt(0)) >>> 0, 2166136261);
const notebookDocumentSchema = z.object({
  version: z.literal(1), name: z.string().trim().min(1).max(80), createdAt: z.string().datetime(), modifiedAt: z.string().datetime(), paper: notebookPaperSchema,
  pages: z.array(z.object({ id: z.string().min(1).max(120), elements: z.array(z.unknown()).max(5000) })).min(1).max(100),
  linkedQuestions: z.array(z.object({ questionId: z.string().uuid(), order: z.number().int().min(0).max(1000), institution: z.string().max(120).optional(), year: z.number().int().min(1900).max(2200).optional(), subject: z.string().max(120).optional(), topic: z.string().max(160).optional(), status: z.enum(["not_started", "in_progress", "completed"]).optional() })).max(100).optional(),
});
const googleFileIdSchema = z.string().regex(/^[A-Za-z0-9_-]{10,200}$/);
function assertNotebooksAvailable(): void {
  if (!NOTEBOOK_FEATURE_AVAILABLE) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: NOTEBOOK_DEVELOPMENT_MESSAGE });
  }
}

async function assertQuestionPdfAccess(userId: string, tokenRole?: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, ativo")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível validar o acesso." });
  const role = tokenRole === "admin" || tokenRole === "editor" ? tokenRole : profile?.role;
  if (role === "admin" || role === "editor") return;
  if (profile?.ativo === false) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não possui acesso à exportação." });
  const { data, error } = await supabaseAdmin.rpc("user_has_active_subscription", { target_user_id: userId });
  if (error || data !== true) throw new TRPCError({ code: "FORBIDDEN", message: "É necessária uma assinatura ativa para exportar questões." });
}

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

async function saveImportedResolutionBlocks(questionId: string, blocks: z.infer<typeof resolutionBlockInputSchema>[]) {
  if (blocks.length === 0) return 0;

  const resolutionPayload = blocks.map((block) =>
    normalizeResolutionBlockPayload(questionId, block)
  );

  const { data, error } = await supabaseAdmin
    .from("resolucoes")
    .insert(resolutionPayload)
    .select("id");

  if (error || !data) {
    throw new Error("Não foi possível salvar os blocos de resolução da questão.");
  }

  const { count, error: countError } = await supabaseAdmin
    .from("resolucoes")
    .select("id", { count: "exact", head: true })
    .eq("questao_id", questionId);

  if (countError) {
    throw new Error("Não foi possível confirmar o salvamento da resolução.");
  }

  if ((count ?? 0) < blocks.length) {
    throw new Error("A resolução foi enviada, mas nem todos os blocos ficaram disponíveis para a questão.");
  }

  return data.length;
}

async function getResolutionBlocksCount(questionId: string) {
  const { count, error } = await supabaseAdmin
    .from("resolucoes")
    .select("id", { count: "exact", head: true })
    .eq("questao_id", questionId);

  if (error) {
    throw new Error("Não foi possível verificar os blocos de resolução existentes.");
  }

  return count ?? 0;
}

type ResolutionSummaryRow = {
  questao_id: string;
  totalBlocks: number;
  totalImages: number;
};

async function loadAllResolutionSummaries() {
  const pageSize = 1000;
  const summaries = new Map<string, ResolutionSummaryRow>();

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from("resolucoes")
      .select("questao_id, tipo, url_imagem")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }

    for (const item of data ?? []) {
      const questionId = (item as any).questao_id;

      if (!questionId) continue;

      const current = summaries.get(questionId) ?? {
        questao_id: questionId,
        totalBlocks: 0,
        totalImages: 0,
      };

      current.totalBlocks += 1;

      if (
        String((item as any).tipo ?? "").toLowerCase().trim() === "imagem" ||
        Boolean((item as any).url_imagem)
      ) {
        current.totalImages += 1;
      }

      summaries.set(questionId, current);
    }

    if (!data || data.length < pageSize) break;
  }

  return Array.from(summaries.values());
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
  googleDrive: router({
    status: protectedProcedure.query(({ ctx }) => googleDriveStatus(ctx.user.id)),
    connectUrl: protectedProcedure.query(({ ctx }) => ({ url: createGoogleDriveConnectUrl(ctx.user.id, ctx.res) })),
    disconnect: protectedProcedure.mutation(({ ctx }) => disconnectGoogleDrive(ctx.user.id)),
  }),
  notebooks: router({
    list: protectedProcedure.query(({ ctx }) => { assertNotebooksAvailable(); return listNotebooks(ctx.user.id); }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(80), paper: notebookPaperSchema, questionIds: z.array(z.string().uuid()).max(100).default([]) })).mutation(async ({ ctx, input }) => {
      assertNotebooksAvailable();
      let linkedQuestions: NonNullable<import("./googleDrive/googleDriveService.js").NotebookDocument["linkedQuestions"]> = [];
      if (input.questionIds.length) {
        const { data, error } = await supabaseAdmin.from("questoes").select("*").in("id", input.questionIds).eq("publicada", true);
        if (error || data?.length !== new Set(input.questionIds).size) throw new TRPCError({ code: "FORBIDDEN", message: "Uma ou mais questões não estão disponíveis." });
        linkedQuestions = (data as Array<Record<string, unknown>>).map((row, order) => ({ questionId: String(row.id), order, institution: typeof row["instituição"] === "string" ? row["instituição"] : undefined, year: typeof row.ano === "number" ? row.ano : undefined, subject: typeof row.disciplina === "string" ? row.disciplina : undefined, topic: Array.isArray(row.assuntos) && typeof row.assuntos[0] === "string" ? row.assuntos[0] : undefined, status: "not_started" }));
      }
      return createNotebook(ctx.user.id, input.name, input.paper, linkedQuestions);
    }),
    get: protectedProcedure.input(z.object({ documentId: googleFileIdSchema })).query(({ ctx, input }) => { assertNotebooksAvailable(); return getNotebook(ctx.user.id, input.documentId); }),
    update: protectedProcedure.input(z.object({ documentId: googleFileIdSchema, document: notebookDocumentSchema, expectedModifiedTime: z.string().datetime(), force: z.boolean().default(false) })).mutation(({ ctx, input }) => { assertNotebooksAvailable(); return updateNotebook(ctx.user.id, input.documentId, input.document, input.expectedModifiedTime, input.force); }),
    rename: protectedProcedure.input(z.object({ documentId: googleFileIdSchema, name: z.string().trim().min(1).max(80) })).mutation(({ ctx, input }) => { assertNotebooksAvailable(); return renameNotebook(ctx.user.id, input.documentId, input.name); }),
    delete: protectedProcedure.input(z.object({ documentId: googleFileIdSchema })).mutation(({ ctx, input }) => { assertNotebooksAvailable(); return trashNotebook(ctx.user.id, input.documentId); }),
    exportPdf: protectedProcedure.input(z.object({ documentId: googleFileIdSchema, name: z.string().trim().min(1).max(80), pdfBase64: z.string().max(16_000_000) })).mutation(({ ctx, input }) => { assertNotebooksAvailable(); return uploadNotebookPdf(ctx.user.id, input.documentId, input.name, input.pdfBase64); }),
    linkedQuestions: protectedProcedure.input(z.object({ questionIds: z.array(z.string().uuid()).max(100) })).query(async ({ input }) => {
      assertNotebooksAvailable();
      if (!input.questionIds.length) return [];
      const { data, error } = await supabaseAdmin.from("questoes").select("*").in("id", input.questionIds).eq("publicada", true);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível carregar as questões desta lista." });
      return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({ id: String(row.id), codigo: typeof row.codigo === "string" ? row.codigo : null, instituição: typeof row["instituição"] === "string" ? row["instituição"] : null, ano: typeof row.ano === "number" ? row.ano : null, disciplina: typeof row.disciplina === "string" ? row.disciplina : null, enunciado: typeof row.enunciado === "string" ? row.enunciado : "" }));
    }),
  }),
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

        await assertRequestRateLimit(ctx.req, "auth:register:ip", {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        await assertRateLimit({
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
    getCapabilities: publicProcedure.query(() => getBillingCapabilities()),

    createCardSubscriptionCheckout: protectedProcedure
      .input(z.object({ planSlug: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) =>
        createCardSubscriptionCheckout({
          userId: ctx.user.id,
          userEmail: ctx.user.email ?? null,
          planSlug: input.planSlug,
        })
      ),

    createPixPayment: protectedProcedure
      .input(z.object({ planSlug: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) =>
        createPixPayment({
          userId: ctx.user.id,
          userEmail: ctx.user.email ?? null,
          planSlug: input.planSlug,
        })
      ),

    getMySubscription: protectedProcedure.query(async ({ ctx }) => {
      const latestSubscription = await getLatestUserBillingSubscription(ctx.user.id);
      return flattenBillingSubscription(latestSubscription);
    }),

    getMyPayments: protectedProcedure.query(async ({ ctx }) => getMyPayments(ctx.user.id)),

    cancelMySubscription: protectedProcedure.mutation(async ({ ctx }) =>
      cancelUserMercadoPagoSubscription(ctx.user.id)
    ),

    syncMyMercadoPagoPaymentStatus: protectedProcedure.mutation(async ({ ctx }) => {
      const sync = await syncMyMercadoPagoPaymentStatus(ctx.user.id);
      return {
        sync,
        subscription: flattenBillingSubscription(await getLatestUserBillingSubscription(ctx.user.id)),
        payments: await getMyPayments(ctx.user.id),
      };
    }),

    listPublicPlans: publicProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseAdmin
        .from("billing_plans")
        .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, is_public, requires_legacy_founder_eligibility, display_order, max_active_subscriptions")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      const userId = ctx.user?.id ?? null;
      const eligible = await hasLegacyFounderEligibility(userId);
      let currentPlanId: string | null = null;
      let currentPlanSlug: string | null = null;
      if (userId) {
        const now = new Date().toISOString();
        const { data: current } = await supabaseAdmin.from("billing_subscriptions").select("plan_id, billing_plans(slug)").eq("user_id", userId).in("status", ["active", "trialing"]).or(`current_period_end.is.null,current_period_end.gte.${now}`).limit(1).maybeSingle();
        currentPlanId = current?.plan_id ? String(current.plan_id) : null;
        currentPlanSlug = pickBillingPlan(current)?.slug ?? null;
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
        display_order: Number(plan.display_order ?? 100),
        ...publicPlanAvailability(plan, eligible, currentPlanId === String(plan.id) || isSamePlanFamily(plan.slug, currentPlanSlug), currentPlanId !== null),
      }));
    }),

    requestManualSubscription: protectedProcedure
      .input(z.object({ planSlug: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        const capabilities = getBillingCapabilities();
        if (!capabilities.manualPixFallbackEnabled) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Pix manual está desabilitado. Use Mercado Pago.",
          });
        }

        const planSlug = input.planSlug.trim();
        const planSlugCandidates = getBillingPlanSlugCandidates(planSlug);

        const { data: billingPlan, error: billingPlanError } = await supabaseAdmin
          .from("billing_plans")
          .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, is_public, requires_legacy_founder_eligibility, max_active_subscriptions")
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
        await assertUserCanCheckoutPlan(ctx.user.id, billingPlan);

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
    exportPdfData: protectedProcedure
      .input(questionPdfFiltersSchema)
      .mutation(async ({ ctx, input }) => {
        await assertRateLimit({
          key: `question-pdf:${ctx.user.id}`,
          limit: 5,
          windowMs: 10 * 60_000,
          // PDF export only reads already-authorized public questions. Keep it
          // available while older environments apply the shared limiter SQL.
          allowInMemoryFallback: true,
        });
        await assertQuestionPdfAccess(ctx.user.id, ctx.user.role);

        const matched: Record<string, unknown>[] = [];
        const batchSize = 200;
        const scanLimit = 4_000;
        for (let offset = 0; offset < scanLimit && (input.practiceStatus !== "all" || matched.length <= QUESTION_PDF_EXPORT_LIMIT); offset += batchSize) {
          const { data, error } = await supabaseAdmin.from("questoes").select(`
            *,
            resolucoes (id, tipo, texto, ordem, url_imagem)
          `).eq("publicada", true).order("created_at", { ascending: false }).range(offset, offset + batchSize - 1);
          if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível buscar as questões para exportação." });
          const rows = (data ?? []) as Record<string, unknown>[];
          matched.push(...rows.filter(row => questionRowMatchesPdfFilters(row, input)));
          if (rows.length < batchSize) break;
        }

        let filtered = matched;
        if (input.practiceStatus !== "all" && matched.length) {
          const ids = matched.map(row => String(row.id));
          const attempts: Array<{ question_id: string; is_correct: boolean | null; answered_at: string }> = [];
          for (let offset = 0; offset < ids.length; offset += batchSize) {
            const { data, error } = await supabaseAdmin.from("user_question_attempts")
              .select("question_id, is_correct, answered_at")
              .eq("user_id", ctx.user.id).in("question_id", ids.slice(offset, offset + batchSize))
              .order("answered_at", { ascending: false });
            if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível aplicar o filtro de prática." });
            attempts.push(...(data ?? []));
          }
          const latest = new Map<string, boolean>();
          for (const attempt of attempts) if (!latest.has(attempt.question_id)) latest.set(attempt.question_id, Boolean(attempt.is_correct));
          filtered = matched.filter(row => {
            const value = latest.get(String(row.id));
            if (input.practiceStatus === "unanswered") return value === undefined;
            if (input.practiceStatus === "answered") return value !== undefined;
            if (input.practiceStatus === "correct") return value === true;
            return value === false;
          });
        }
        return {
          rows: filtered.slice(0, QUESTION_PDF_EXPORT_LIMIT),
          totalMatched: filtered.length,
          limit: QUESTION_PDF_EXPORT_LIMIT,
          truncated: filtered.length > QUESTION_PDF_EXPORT_LIMIT,
        };
      }),

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
        let query = supabaseAdmin.from("questoes").select("*");

        if (input?.subject) {
          query = query.eq("disciplina", input.subject);
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

        return (data ?? []).map(safeQuestionDto);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const { data, error } = await supabaseAdmin
          .from("questoes")
          .select("*")
          .eq("id", input.id)
          .eq("publicada", true)
          .maybeSingle();

        if (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }

        return data ? safeQuestionDto(data) : null;
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
            "id,codigo,enunciado,disciplina,conteudo,assunto,banca,ano,created_at"
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

        await assertRequestRateLimit(ctx.req, "auth:register:ip", {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        await assertRateLimit({
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
        .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, is_public, requires_legacy_founder_eligibility, display_order, updated_at, updated_by, max_active_subscriptions")
        .order("display_order", { ascending: true });

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
          is_public: Boolean(plan.is_public),
          requires_legacy_founder_eligibility: Boolean(plan.requires_legacy_founder_eligibility),
          display_order: Number(plan.display_order ?? 100),
          updated_at: plan.updated_at ?? null,
          updated_by: plan.updated_by ?? null,
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
          gateway_subscription_id,
          gateway_payment_id,
          last_gateway_status,
          gateway_reconciliation_status,
          gateway_reconciliation_error,
          gateway_reconciliation_attempts,
          gateway_reconciliation_last_attempt_at,
          recurring_state,
          recurring_slot_active,
          canonical_access_subscription_id,
          cancel_at_period_end,
          metadata,
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
          gateway_subscription_id: subscription.gateway_subscription_id ?? null,
          gateway_payment_id: subscription.gateway_payment_id ?? null,
          last_gateway_status: subscription.last_gateway_status ?? null,
          gateway_reconciliation_status: subscription.gateway_reconciliation_status ?? null,
          gateway_reconciliation_error: subscription.gateway_reconciliation_error ?? null,
          gateway_reconciliation_attempts: Number(subscription.gateway_reconciliation_attempts ?? 0),
          gateway_reconciliation_last_attempt_at: subscription.gateway_reconciliation_last_attempt_at ?? null,
          recurring_state: subscription.recurring_state ?? null,
          recurring_slot_active: subscription.recurring_slot_active ?? null,
          canonical_access_subscription_id: subscription.canonical_access_subscription_id ?? null,
          cancel_at_period_end: subscription.cancel_at_period_end ?? null,
          metadata: subscription.metadata ?? null,
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
          gateway,
          gateway_subscription_id,
          gateway_payment_id,
          last_gateway_status,
          gateway_reconciliation_status,
          gateway_reconciliation_error,
          cancel_at_period_end,
          metadata,
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
          gateway: subscription?.gateway ?? null,
          gateway_subscription_id: subscription?.gateway_subscription_id ?? null,
          gateway_payment_id: subscription?.gateway_payment_id ?? null,
          last_gateway_status: subscription?.last_gateway_status ?? null,
          gateway_reconciliation_status: subscription?.gateway_reconciliation_status ?? null,
          gateway_reconciliation_error: subscription?.gateway_reconciliation_error ?? null,
          cancel_at_period_end: subscription?.cancel_at_period_end ?? null,
          metadata: subscription?.metadata ?? null,
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

    cancelMercadoPagoSubscriptionNow: adminProcedure
      .input(z.object({ subscriptionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const result = await cancelAdminMercadoPagoSubscription({
          subscriptionId: input.subscriptionId,
          adminUserId: ctx.user.id,
        });

        const { error: logError } = await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_mercadopago_subscription_canceled_now",
          entity_type: "billing_subscription",
          entity_id: input.subscriptionId,
          description: result.outcome === "success"
            ? "Assinatura Mercado Pago cancelada imediatamente no ADM financeiro"
            : "Cancelamento Mercado Pago incompleto; reconciliação necessária",
          level: result.outcome === "success" ? "warning" : "error",
          metadata: { ...input, outcome: result.outcome, failed_subscription_ids: result.failures.map(item => item.subscriptionId) },
        });
        if (logError) throw new TRPCError({ code: "BAD_REQUEST", message: logError.message });

        return result;
      }),

    reconcileMercadoPagoDuplicates: adminProcedure
      .input(z.object({ subscriptionId: z.string().uuid().optional(), confirm: z.literal(true) }))
      .mutation(async ({ ctx, input }) =>
        reconcileDuplicateMercadoPagoSubscriptions({
          subscriptionId: input.subscriptionId,
          adminUserId: ctx.user.id,
        })
      ),

    listBillingPayments: adminProcedure
      .input(z.object({ userId: z.string().uuid().optional(), subscriptionId: z.string().uuid().optional() }).optional())
      .query(async ({ input }) => {
        let query = supabaseAdmin
          .from("billing_payments")
          .select("id, subscription_id, original_subscription_id, applied_to_subscription_id, user_id, plan_id, gateway, gateway_payment_id, payment_method, status, amount_cents, currency, approved_at, access_applied_at, current_period_start, current_period_end, access_duration_value, access_duration_unit, gateway_reconciliation_status, gateway_reconciliation_error, refunded_at, expires_at, payment_url, metadata, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(100);

        if (input?.userId) query = query.eq("user_id", input.userId);
        if (input?.subscriptionId) {
          query = query.or(`subscription_id.eq.${input.subscriptionId},original_subscription_id.eq.${input.subscriptionId},applied_to_subscription_id.eq.${input.subscriptionId}`);
        }

        const { data, error } = await query;
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return data ?? [];
      }),

    reconcileMercadoPagoPayment: adminProcedure
      .input(z.object({ billingPaymentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) =>
        reconcileMercadoPagoPaymentByAdmin({
          billingPaymentId: input.billingPaymentId,
          adminUserId: String(ctx.user.id),
        })
      ),

    listBillingWebhookEvents: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin
        .from("billing_webhook_events")
        .select("id, provider, event_id, event_type, resource_id, request_id, status, attempts, error_message, payload, received_at, processed_at, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return data ?? [];
    }),

    renewBillingSubscription: adminProcedure
      .input(z.object({ subscriptionId: z.string().uuid(), months: z.number().int().min(1).max(24).default(1) }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const { data: subscription, error: subscriptionError } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("id, current_period_end, gateway, metadata")
          .eq("id", input.subscriptionId)
          .maybeSingle();

        if (subscriptionError) throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionError.message });
        if (!subscription?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada." });
        if ((subscription as any).gateway === "mercadopago" && (subscription as any).metadata?.payment_method === "card") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Assinatura recorrente Mercado Pago não deve ser renovada manualmente." });
        }

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
        const { data: subscription, error: fetchError } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("id, gateway, gateway_subscription_id, metadata")
          .eq("id", input.subscriptionId)
          .maybeSingle();
        if (fetchError) throw new TRPCError({ code: "BAD_REQUEST", message: fetchError.message });
        if (!subscription?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada." });

        if ((subscription as any).gateway === "mercadopago" && (subscription as any).metadata?.payment_method === "card") {
          return cancelAdminMercadoPagoSubscription({ subscriptionId: input.subscriptionId, adminUserId: ctx.user.id });
        }

        const now = new Date().toISOString();
        const { error } = await supabaseAdmin
          .from("billing_subscriptions")
          .update({ status: "canceled", canceled_at: now, current_period_end: now, cancel_at_period_end: false })
          .eq("id", input.subscriptionId);

        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

        const { error: logError } = await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_subscription_canceled",
          entity_type: "billing_subscription",
          entity_id: input.subscriptionId,
          description: "Assinatura cancelada no ADM financeiro",
          level: "warning",
          metadata: input,
        });
        if (logError) throw new TRPCError({ code: "BAD_REQUEST", message: logError.message });

        return { success: true } as const;
      }),

    updateBillingPlan: adminProcedure
      .input(
        z.object({
          planId: z.string().uuid(),
          name: z.string().min(1).max(160),
          description: z.string().max(2000).nullable().optional(),
          priceCents: z.number().int().min(1),
          maxActiveSubscriptions: z.number().int().min(0).nullable(),
          isActive: z.boolean(),
          isPublic: z.boolean(),
          displayOrder: z.number().int().min(0).max(10000),
          requiresLegacyFounderEligibility: z.boolean(),
          eligibilityChangeConfirmation: z.string().max(120).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { data: previous, error: readError } = await supabaseAdmin
          .from("billing_plans")
          .select("id, slug, name, description, price_cents, max_active_subscriptions, is_active, is_public, display_order, requires_legacy_founder_eligibility")
          .eq("id", input.planId)
          .maybeSingle();
        if (readError) throw new TRPCError({ code: "BAD_REQUEST", message: readError.message });
        if (!previous) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });

        if (
          previous.slug === LEGACY_FOUNDER_SLUG &&
          previous.requires_legacy_founder_eligibility === true &&
          input.requiresLegacyFounderEligibility === false &&
          input.eligibilityChangeConfirmation !== "REMOVER ELEGIBILIDADE DO PLANO FUNDADOR"
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Confirmação explícita da elegibilidade de fundador é obrigatória." });
        }

        const next = {
          name: input.name,
          description: input.description ?? null,
          price_cents: input.priceCents,
          max_active_subscriptions: input.maxActiveSubscriptions,
          is_active: input.isActive,
          is_public: input.isPublic,
          display_order: input.displayOrder,
          requires_legacy_founder_eligibility: input.requiresLegacyFounderEligibility,
          updated_by: ctx.user.id,
          updated_at: new Date().toISOString(),
        };
        const { error: updateError } = await supabaseAdmin.from("billing_plans").update(next).eq("id", input.planId);
        if (updateError) throw new TRPCError({ code: "BAD_REQUEST", message: updateError.message });

        const { error: logError } = await supabaseAdmin.from("admin_logs").insert({
          admin_user_id: ctx.user.id,
          action: "billing_plan_updated",
          entity_type: "billing_plan",
          entity_id: input.planId,
          description: "Configuração de plano atualizada no ADM",
          level: "info",
          metadata: { slug: previous.slug, previous, next },
        });
        if (logError) {
          console.error("[admin.updateBillingPlan] plano salvo, mas auditoria falhou:", logError.message);
        }

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
      const [questionsResult, resolutionSummaries] = await Promise.all([
        supabaseAdmin
          .from("questoes")
          .select("*")
          .order("created_at", { ascending: false }),
        loadAllResolutionSummaries(),
      ]);

      if (questionsResult.error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: questionsResult.error.message });
      }

      return {
        questions: questionsResult.data ?? [],
        resolutions: [],
        resolutionSummaries,
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
              const existingResolutionBlocks = await getResolutionBlocksCount(duplicateResult.data.id);
              let repairedResolutionBlocks = 0;
              let duplicateMessage = "Questão já importada anteriormente.";

              if (existingResolutionBlocks === 0 && question.resolucao_blocos.length > 0) {
                repairedResolutionBlocks = await saveImportedResolutionBlocks(
                  duplicateResult.data.id,
                  question.resolucao_blocos
                );
                duplicateMessage =
                  "Questão já importada anteriormente; blocos de resolução ausentes foram salvos agora.";
              }

              results.push({
                index: question.raw_index,
                importSourceId,
                status: "duplicada",
                questionId: duplicateResult.data.id,
                codigo: (duplicateResult.data as any).codigo ?? question.codigo,
                resolutionBlocksSaved: repairedResolutionBlocks,
                message: duplicateMessage,
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

            let resolutionBlocksSaved = 0;

            try {
              resolutionBlocksSaved = await saveImportedResolutionBlocks(data.id, question.resolucao_blocos);
            } catch (resolutionError) {
              await supabaseAdmin.from("resolucoes_meta").delete().eq("questao_id", data.id);
              await supabaseAdmin.from("resolucoes").delete().eq("questao_id", data.id);
              await supabaseAdmin.from("questoes").delete().eq("id", data.id);
              throw new Error(
                resolutionError instanceof Error
                  ? `${resolutionError.message} A questão foi revertida para não ficar sem resolução.`
                  : "Questão criada, mas a resolução falhou; a questão foi revertida."
              );
            }

            results.push({
              index: question.raw_index,
              importSourceId,
              status: "criada",
              questionId: data.id,
              codigo: (data as any).codigo ?? question.codigo,
              resolutionBlocksSaved,
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
          .select("id, codigo, disciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição")
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
              .select("id, codigo, disciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição, enunciado")
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
          .select("id, codigo, disciplina, conteudo, conteudos, assunto, assuntos, banca, ano, dificuldade, instituição")
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
          .select("user_id,is_correct,time_spent_seconds,answered_at,subject,difficulty")
          .order("answered_at", { ascending: false }),
        supabaseAdmin
          .from("profiles")
          .select("id,nome,avatar_key,ativo")
          .eq("ativo", true),
      ]);

      if (attemptsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
      if (profilesResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: profilesResult.error.message });

      const groups = new Map<string, any>();
      for (const attempt of attemptsResult.data ?? []) {
        const day = String(attempt.answered_at ?? "").slice(0, 10);
        const key = [attempt.user_id, day, attempt.subject ?? "", attempt.difficulty ?? "", attempt.is_correct ? "1" : "0"].join("|");
        const current = groups.get(key) ?? { user_id: attempt.user_id, answered_at: `${day}T12:00:00.000Z`, subject: attempt.subject, difficulty: attempt.difficulty, is_correct: attempt.is_correct, count: 0, total_time: 0, timed: 0 };
        current.count += 1;
        if (typeof attempt.time_spent_seconds === "number") { current.total_time += attempt.time_spent_seconds; current.timed += 1; }
        groups.set(key, current);
      }
      const attempts = Array.from(groups.values()).flatMap(group => Array.from({ length: group.count }, () => ({ user_id: group.user_id, answered_at: group.answered_at, subject: group.subject, difficulty: group.difficulty, is_correct: group.is_correct, time_spent_seconds: group.timed ? group.total_time / group.timed : null })));
      return { attempts, profiles: profilesResult.data ?? [] };
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
            .select("user_id,is_correct,time_spent_seconds,answered_at,subject,conteudo,assunto,banca,ano,difficulty")
            .eq("user_id", input.userId)
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

      const groups = new Map<string, any>();
      for (const attempt of attemptsResult.data ?? []) {
        const month = String(attempt.answered_at ?? "").slice(0, 7);
        const key = [month, attempt.subject ?? "", attempt.conteudo ?? "", attempt.assunto ?? "", attempt.banca ?? "", attempt.ano ?? "", attempt.difficulty ?? "", attempt.is_correct ? "1" : "0"].join("|");
        const current = groups.get(key) ?? { ...attempt, answered_at: `${month}-15T12:00:00.000Z`, count: 0, total_time: 0, timed: 0 };
        current.count += 1;
        if (typeof attempt.time_spent_seconds === "number") { current.total_time += attempt.time_spent_seconds; current.timed += 1; }
        groups.set(key, current);
      }
      const publicAttempts = Array.from(groups.values()).flatMap(group => Array.from({ length: group.count }, () => ({ user_id: input.userId, is_correct: group.is_correct, time_spent_seconds: group.timed ? group.total_time / group.timed : null, answered_at: group.answered_at, subject: group.subject, conteudo: group.conteudo, assunto: group.assunto, banca: group.banca, ano: group.ano, difficulty: group.difficulty })));
      return {
        profile: profileResult.data,
        attempts: publicAttempts,
        profiles: [profileResult.data],
      };
      }),
  }),

  vet: router({
    getAnalysis: protectedProcedure.query(async ({ ctx }) => getCanonicalVetAnalysis(ctx.user.id)),

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

    /** @deprecated Use getAnalysis; raw attempts and internal weights are never returned. */
    getLearningData: protectedProcedure.query(async ({ ctx }) => getCanonicalVetAnalysis(ctx.user.id)),

    getRecommendedQuestions: protectedProcedure
      .input(z.object({ block: z.enum(["ataque", "consolidacao", "manutencao"]), limit: z.number().int().min(1).max(50).default(12) }))
      .query(async ({ ctx, input }) => {
        const analysis = await getCanonicalVetAnalysis(ctx.user.id);
        if (!analysis) return [];
        const contents = analysis.strategicContents.filter((item: any) => item.block === input.block).slice(0, 12);
        if (!contents.length) return [];
        const topics = contents.map((item: any) => item.conteudo);
        const { data, error } = await supabaseAdmin.from("questoes")
          .select("id,codigo,disciplina,assunto,conteudo,conteudos,assuntos,assuntos_por_conteudo,banca,ano,dificuldade,enunciado,enunciado_pos_imagem,url_imagem,formula,A,B,C,D,E,a_url_imagem,b_url_imagem,c_url_imagem,d_url_imagem,e_url_imagem,instituição,fonte,tag,publicada,created_at")
          .eq("publicada", true).overlaps("conteudos", topics).limit(input.limit * 3);
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        const { data: attempted } = await supabaseAdmin.from("user_question_attempts").select("question_id,answered_at").eq("user_id", ctx.user.id).in("question_id", (data ?? []).map((row: any) => row.id));
        const attemptedIds = new Set((attempted ?? []).map((row: any) => row.question_id));
        return (data ?? []).sort((a: any, b: any) => Number(attemptedIds.has(a.id)) - Number(attemptedIds.has(b.id))).slice(0, input.limit).map(safeQuestionDto);
      }),

    createMockSession: protectedProcedure
      .input(z.object({ mode: z.enum(["ataque", "consolidacao", "manutencao", "misto"]) }))
      .mutation(async ({ ctx, input }) => {
        const { data: existingSession, error: existingError } = await supabaseAdmin
          .from("vet_mock_sessions")
          .select("id,total_questions,status")
          .eq("user_id", ctx.user.id)
          .eq("mode", input.mode)
          .in("status", ["draft", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingError) throw new TRPCError({ code: "BAD_REQUEST", message: existingError.message });
        if (existingSession) return { id: existingSession.id, totalQuestions: existingSession.total_questions, reused: true };

        const analysis = await getCanonicalVetAnalysis(ctx.user.id);
        if (!analysis) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure o objetivo VET primeiro." });
        const desired = input.mode === "misto"
          ? [{ block: "ataque", count: 5 }, { block: "consolidacao", count: 4 }, { block: "manutencao", count: 3 }] as const
          : [{ block: input.mode, count: 10 }] as const;
        const { data: session, error: sessionError } = await supabaseAdmin.from("vet_mock_sessions").insert({
          user_id: ctx.user.id, target_exam: analysis.profile.target_exam, focus_subject: analysis.profile.focus_subject,
          mode: input.mode, status: "draft", engine_version: VET_ENGINE_VERSION,
          engine_snapshot: { generatedAt: analysis.generatedAt, diagnosticConfidence: analysis.diagnosticConfidence },
        }).select("*").single();
        if (sessionError || !session) throw new TRPCError({ code: "BAD_REQUEST", message: sessionError?.message ?? "Não foi possível criar o simulado." });
        const selected: Array<{ row: any; block: string; content: any }> = [];
        const used = new Set<string>();
        const { data: previousAttempts } = await supabaseAdmin.from("user_question_attempts").select("question_id").eq("user_id", ctx.user.id);
        const attemptedIds = new Set((previousAttempts ?? []).map((row: any) => row.question_id));
        const examFilter = postgrestAliasFilter(["banca", "instituição"], getExamAliases(analysis.profile.target_exam));
        const subjectFilter = postgrestAliasFilter(["disciplina"], getSubjectAliases(analysis.profile.focus_subject));
        const questionPool: any[] = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          let query = supabaseAdmin.from("questoes").select("id,disciplina,banca,instituição,conteudos,conteudo,assunto").eq("publicada", true).or(examFilter);
          if (normalizeVetText(analysis.profile.focus_subject) !== "todas") query = query.or(subjectFilter);
          const { data: page, error: poolError } = await query.order("id", { ascending: true }).range(offset, offset + pageSize - 1);
          if (poolError) throw new TRPCError({ code: "BAD_REQUEST", message: poolError.message });
          questionPool.push(...(page ?? []));
          if ((page?.length ?? 0) < pageSize) break;
        }
        const eligiblePool = filterVetQuestionPool(questionPool, analysis.profile.target_exam, analysis.profile.focus_subject);
        for (const target of desired) {
          const contents = analysis.strategicContents.filter((item: any) => item.block === target.block).slice(0, 10);
          if (!contents.length) continue;
          const candidates = prioritizeVetCandidates(eligiblePool.filter(row => contents.some((item: any) => matchesVetContent(row, item.conteudo))), attemptedIds, id => stableVetOrder(session.id, id));
          for (const row of candidates) {
            if (used.has(row.id)) continue;
            const content = contents.find((item: any) => matchesVetContent(row, item.conteudo));
            if (!content) continue;
            used.add(row.id); selected.push({ row, block: target.block, content });
            if (selected.filter(item => item.block === target.block).length >= target.count) break;
          }
        }
        const targetTotal = input.mode === "misto" ? 12 : 10;
        if (selected.length < targetTotal) {
          const fallbackContents = analysis.strategicContents.slice(0, 30);
          const candidates = prioritizeVetCandidates(eligiblePool.filter(row => fallbackContents.some((item: any) => matchesVetContent(row, item.conteudo))), attemptedIds, id => stableVetOrder(session.id, id));
          for (const row of candidates) {
            if (used.has(row.id)) continue;
            const content = fallbackContents.find((item: any) => matchesVetContent(row, item.conteudo));
            if (!content) continue;
            used.add(row.id); selected.push({ row, block: content.block, content });
            if (selected.length >= targetTotal) break;
          }
        }
        if (!selected.length) {
          await supabaseAdmin.from("vet_mock_sessions").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("id", session.id);
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Não há questões suficientes para criar este simulado." });
        }
        const { error: itemsInsertError } = await supabaseAdmin.from("vet_mock_session_items").insert(selected.map((item, index) => ({ session_id: session.id, question_id: item.row.id, position: index + 1, strategic_content: item.content.conteudo, block: item.block, recommendation_score: item.content.priorityScore })));
        if (itemsInsertError) {
          await supabaseAdmin.from("vet_mock_sessions").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("id", session.id);
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível persistir as questões do simulado." });
        }
        await supabaseAdmin.from("vet_mock_sessions").update({ total_questions: selected.length, status: "in_progress", started_at: new Date().toISOString() }).eq("id", session.id);
        return { id: session.id, totalQuestions: selected.length, reused: false };
      }),

    getMockSession: protectedProcedure.input(z.object({ sessionId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const { data: session, error } = await supabaseAdmin.from("vet_mock_sessions").select("*").eq("id", input.sessionId).eq("user_id", ctx.user.id).maybeSingle();
      if (error || !session) throw new TRPCError({ code: "NOT_FOUND", message: "Simulado não encontrado." });
      const { data: items, error: itemsError } = await supabaseAdmin.from("vet_mock_session_items").select("id,position,strategic_content,block,recommendation_score,attempt_id,selected_option,is_correct,answered_at,questoes(id,codigo,disciplina,assunto,conteudo,conteudos,assuntos,assuntos_por_conteudo,banca,ano,dificuldade,enunciado,enunciado_pos_imagem,url_imagem,formula,A,B,C,D,E,a_url_imagem,b_url_imagem,c_url_imagem,d_url_imagem,e_url_imagem,instituição,fonte,tag,publicada,created_at,alternativa_correta,resolucoes(id,tipo,texto,ordem,url_imagem))").eq("session_id", session.id).order("position");
      if (itemsError) throw new TRPCError({ code: "BAD_REQUEST", message: itemsError.message });
      return { session, items: (items ?? []).map((item: any) => {
        const question = Array.isArray(item.questoes) ? item.questoes[0] : item.questoes;
        return {
          ...item,
          question: safeQuestionDto(question),
          answer: item.attempt_id ? { selectedOption: item.selected_option, isCorrect: item.is_correct, correctOption: question?.alternativa_correta, resolution: question?.resolucoes ?? [] } : null,
          questoes: undefined,
        };
      }) };
    }),

    completeMockSession: protectedProcedure.input(z.object({ sessionId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const { data: ownedSession } = await supabaseAdmin.from("vet_mock_sessions").select("id,total_questions").eq("id", input.sessionId).eq("user_id", ctx.user.id).maybeSingle();
      if (!ownedSession) throw new TRPCError({ code: "NOT_FOUND", message: "Simulado não encontrado." });
      const { data: items } = await supabaseAdmin.from("vet_mock_session_items").select("is_correct,attempt_id").eq("session_id", input.sessionId);
      const answered = (items ?? []).filter((item: any) => item.attempt_id).length;
      const correct = (items ?? []).filter((item: any) => item.is_correct === true).length;
      if (answered !== ownedSession.total_questions) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Responda todas as questões antes de concluir o simulado." });
      const { data, error } = await supabaseAdmin.from("vet_mock_sessions").update({ status: "completed", completed_at: new Date().toISOString(), total_answered: answered, correct_answers: correct, accuracy: answered ? correct / answered * 100 : 0, updated_at: new Date().toISOString() }).eq("id", input.sessionId).eq("user_id", ctx.user.id).select("*").single();
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return data;
    }),

    submitMockAnswer: protectedProcedure.input(z.object({ sessionId: z.string().uuid(), questionId: z.string().uuid(), selectedOption: z.enum(["a","b","c","d","e"]), timeSpentSeconds: z.number().int().min(1).max(86400) })).mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseAdmin.rpc("record_canonical_question_attempt", { p_user_id: ctx.user.id, p_question_id: input.questionId, p_selected_option: input.selectedOption, p_time_spent_seconds: input.timeSpentSeconds, p_vet_mock_session_id: input.sessionId });
      const result = Array.isArray(data) ? data[0] : data;
      if (error || !result?.attempt_id) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível registrar a resposta." });
      return { attemptId: result.attempt_id, attemptNumber: result.attempt_number, isCorrect: result.is_correct, correctOption: result.correct_option, resolution: result.resolution ?? [] };
    }),

    getMockResult: protectedProcedure.input(z.object({ sessionId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const { data, error } = await supabaseAdmin.from("vet_mock_sessions").select("id,target_exam,focus_subject,mode,status,started_at,completed_at,total_questions,total_answered,correct_answers,accuracy,engine_version,engine_snapshot,created_at").eq("id", input.sessionId).eq("user_id", ctx.user.id).eq("status", "completed").maybeSingle();
      if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Resultado não encontrado." });
      return data;
    }),

    listMockHistory: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0) }).optional()).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20, offset = input?.offset ?? 0;
      const { data, error } = await supabaseAdmin.from("vet_mock_sessions").select("id,target_exam,focus_subject,mode,status,started_at,completed_at,total_questions,total_answered,correct_answers,accuracy,engine_version,created_at").eq("user_id", ctx.user.id).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return data ?? [];
    }),

    getEvolution: protectedProcedure.input(z.object({ months: z.number().int().min(1).max(24).default(6) }).optional()).query(async ({ ctx, input }) => {
      const since = new Date(); since.setUTCMonth(since.getUTCMonth() - (input?.months ?? 6));
      const { data, error } = await supabaseAdmin.from("user_question_attempts").select("is_correct,time_spent_seconds,answered_at,subject,conteudo,banca").eq("user_id", ctx.user.id).gte("answered_at", since.toISOString()).order("answered_at");
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      const groups = new Map<string, any>();
      for (const row of data ?? []) {
        const month = String(row.answered_at).slice(0, 7);
        const key = [month, row.subject ?? "", row.conteudo ?? "", row.banca ?? ""].join("|");
        const current = groups.get(key) ?? { month, subject: row.subject, conteudo: row.conteudo, banca: row.banca, total: 0, correct: 0, totalTime: 0, timed: 0 };
        current.total += 1; if (row.is_correct) current.correct += 1;
        if (typeof row.time_spent_seconds === "number") { current.totalTime += row.time_spent_seconds; current.timed += 1; }
        groups.set(key, current);
      }
      return Array.from(groups.values()).map(group => ({ month: group.month, subject: group.subject, conteudo: group.conteudo, banca: group.banca, totalAttempts: group.total, accuracy: group.total ? group.correct / group.total * 100 : 0, avgTimeSeconds: group.timed ? group.totalTime / group.timed : null }));
    }),

    refreshCollectiveStats: adminProcedure.mutation(async ({ ctx }) => {
      const { data, error } = await supabaseAdmin.rpc("refresh_vet_collective_stats", { p_admin_user_id: ctx.user.id });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      const { data: latest } = await supabaseAdmin.from("vet_content_collective_stats").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return { updatedGroups: Number(data ?? 0), lastUpdatedAt: latest?.updated_at ?? null };
    }),

    getCollectiveStatsStatus: adminProcedure.query(async () => {
      const [{ count, error: countError }, { data: latest, error: latestError }] = await Promise.all([
        supabaseAdmin.from("vet_content_collective_stats").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("vet_content_collective_stats").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (countError || latestError) throw new TRPCError({ code: "BAD_REQUEST", message: countError?.message ?? latestError?.message });
      return { groups: count ?? 0, lastUpdatedAt: latest?.updated_at ?? null, updateMode: "manual" as const, privacyMinimums: { attempts: 10, users: 5 } };
    }),

    adminListWeights: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("vet_exam_content_weights").select("*").order("exam").order("subject").order("conteudo");
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return data ?? [];
    }),

    adminUpsertWeight: adminProcedure.input(z.object({ exam: z.string().min(1).max(80), subject: z.string().min(1).max(160), conteudo: z.string().min(1).max(220), weight: z.number().min(0).max(10) })).mutation(async ({ ctx, input }) => {
      const { data: existing } = await supabaseAdmin.from("vet_exam_content_weights").select("id").ilike("exam", input.exam).ilike("subject", input.subject).ilike("conteudo", input.conteudo).maybeSingle();
      const payload = { ...input, created_by: ctx.user.id, updated_at: new Date().toISOString() };
      const query = existing?.id ? supabaseAdmin.from("vet_exam_content_weights").update(payload).eq("id", existing.id) : supabaseAdmin.from("vet_exam_content_weights").insert(payload);
      const { data, error } = await query.select("*").single();
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      await supabaseAdmin.from("admin_logs").insert({ admin_user_id: ctx.user.id, action: "vet_weight_updated", entity_type: "vet_exam_content_weight", entity_id: data.id, description: "Peso editorial do VET atualizado", level: "info", metadata: input });
      return data;
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
        await assertRateLimit({
          key: `question-report:${ctx.user.id}`,
          limit: 10,
          windowMs: 60 * 60 * 1000,
          // Reporting is authenticated and additionally constrained by the
          // database service. Do not make the action unusable while an older
          // environment is still waiting for the shared limiter migration.
          allowInMemoryFallback: true,
        });

        return createQuestionReport({
          questionId: input.questionId,
          userId: ctx.user.id,
          reportType: input.reportType,
          comment: input.comment,
        });
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
          selectedOption: z.enum(["a", "b", "c", "d", "e"]),
          timeSpentSeconds: z.number().int().min(1).max(24 * 60 * 60),
          vetMockSessionId: z.string().uuid().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertRateLimit({
          key: `quiz:attempt:${ctx.user.id}`,
          limit: 120,
          windowMs: 60 * 60 * 1000,
          // Canonical attempt validation still happens in the database. This
          // fallback only covers deployments where consume_rate_limit has not
          // reached the PostgREST schema cache yet.
          allowInMemoryFallback: true,
        });

        const { data, error } = await supabaseAdmin
          .rpc("record_canonical_question_attempt", {
            p_user_id: ctx.user.id,
            p_question_id: input.questionId,
            p_selected_option: input.selectedOption,
            p_time_spent_seconds: input.timeSpentSeconds,
            p_vet_mock_session_id: input.vetMockSessionId ?? null,
          });

        const result = Array.isArray(data) ? data[0] : data;
        if (error || !result?.attempt_id) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível salvar a tentativa." });

        return {
          attemptId: result.attempt_id,
          attemptNumber: result.attempt_number,
          isCorrect: result.is_correct,
          correctOption: result.correct_option,
          correctionMessage: result.is_correct ? "Resposta correta." : "Resposta incorreta.",
          resolution: result.resolution ?? [],
        } as const;
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
        supabaseAdmin
          .from("user_question_attempts")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("answered_at", { ascending: false }),
        supabaseAdmin.from("profiles").select("id, nome, avatar_key"),
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

        await assertRateLimit({
          key: `ai:solve:user:${ctx.user.id}`,
          limit: 20,
          windowMs: 60 * 60 * 1000,
        });
        await assertRequestRateLimit(ctx.req, "ai:solve:ip", {
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
