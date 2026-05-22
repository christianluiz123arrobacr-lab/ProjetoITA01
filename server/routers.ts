import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { invokeLLM } from "./_core/llm.js";
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
      .mutation(async ({ input }) => {
        const nome = input.nome.trim();
        const telefone = input.telefone.trim();
        const email = input.email.trim().toLowerCase();

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: input.senha,
          email_confirm: true,
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
    createStudent: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2, "Nome muito curto"),
          email: z.string().email("E-mail inválido"),
          senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuário não autenticado.",
          });
        }

        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem criar alunos.",
          });
        }

        const nome = input.nome.trim();
        const email = input.email.trim().toLowerCase();

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
  }),

  ai: router({
    solvePhysics: publicProcedure
      .input(
        z.object({
          text: z.string().optional(),
          imageBase64: z.string().optional(),
          imageMimeType: z.string().optional(),
          systemPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { text, imageBase64, imageMimeType, systemPrompt } = input;

        if (!text && !imageBase64) {
          throw new Error("Forneça um texto ou uma imagem da questão.");
        }

        const defaultSystemPrompt =
          "Você é um professor de elite e especialista em competições científicas (ITA, IME, IMO, IPhO). Sua missão é resolver problemas complexos de forma EXTREMAMENTE EXPLICATIVA e DIDÁTICA. Para cada passo da resolução, explique o 'porquê' físico ou matemático, os conceitos fundamentais envolvidos e a estratégia adotada. Não apenas mostre o cálculo, mas ensine o raciocínio. OBRIGATORIAMENTE, use '$$' para equações em bloco e '$' para matemática inline. Toda variável, unidade ou fórmula deve estar em LaTeX. A resolução deve ser profunda, clara e chegar ao resultado final com uma conclusão pedagógica.";

        const messages: any[] = [
          {
            role: "system",
            content: systemPrompt || defaultSystemPrompt,
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
