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

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return {
        success: true,
      } as const;
    }),
  }),

  admin: router({
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

    grantAdminAccess: adminProcedure
      .input(z.object({ email: z.string().email(), role: z.enum(["admin", "editor"]) }))
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
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

    createAdminImageUpload: adminOrEditorProcedure
      .input(
        z.object({
          bucket: z.enum(["questoes-imagens", "resolucoes-imagens"]),
          originalName: z.string().min(1).max(180),
          contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
          context: z.string().min(1).max(120).optional(),
        })
      )
      .mutation(async ({ input }) => {
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

        return {
          bucket: input.bucket,
          path,
          token: data.token,
          signedUrl: data.signedUrl,
          publicUrl: publicUrlData.publicUrl,
        } as const;
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
