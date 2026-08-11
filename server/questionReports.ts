import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./_core/supabaseAdmin.js";

type QuestionReportType = "enunciado" | "alternativa" | "gabarito" | "resolucao" | "imagem" | "latex" | "outro";

type QuestionReportDatabaseError = {
  code?: string | null;
  message?: string | null;
};

export function getQuestionReportErrorMessage(error: QuestionReportDatabaseError) {
  if (["42P01", "PGRST205"].includes(String(error.code))) {
    return "O sistema de reports ainda não está configurado no banco de dados. Aplique a migration de question_reports.";
  }
  if (error.code === "23503") return "A questão selecionada não foi encontrada.";
  if (["22001", "23514"].includes(String(error.code))) return "Os dados do report são inválidos ou excedem o limite permitido.";
  return "Não foi possível enviar o report agora. Tente novamente em instantes.";
}

type CreateQuestionReportDependencies = {
  insert: (row: Record<string, unknown>) => Promise<{ id: string | null; error: QuestionReportDatabaseError | null }>;
};

const defaultDependencies: CreateQuestionReportDependencies = {
  insert: async row => {
    const { data, error } = await supabaseAdmin.from("question_reports").insert(row).select("id").single();
    return { id: data?.id ? String(data.id) : null, error };
  },
};

export async function createQuestionReport(
  input: { questionId: string; userId: string; reportType: QuestionReportType; comment?: string | null },
  dependencies: CreateQuestionReportDependencies = defaultDependencies,
) {
  const result = await dependencies.insert({
    question_id: input.questionId,
    user_id: input.userId,
    report_type: input.reportType,
    comment: input.comment?.trim() || null,
    status: "pendente",
  });

  if (result.error || !result.id) {
    console.error("[question-report] insert failed", {
      code: result.error?.code ?? "missing_id",
      question_id: input.questionId,
      user_id: input.userId,
    });
    throw new TRPCError({
      code: result.error?.code === "23503" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
      message: getQuestionReportErrorMessage(result.error ?? {}),
    });
  }

  return { id: result.id } as const;
}
