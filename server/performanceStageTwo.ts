import { TRPCError } from "@trpc/server";
import { bounded, safeErrorCode } from "../shared/authRecovery.js";
import type { BrowseInput, BrowseResult } from "../shared/questionBrowse.js";
type Database = {
  rpc: (
    name: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};
export type DashboardResult = {
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalQuestions: number;
    totalQuestionsWithoutResolution: number;
    totalUnpublishedQuestions: number;
    totalResolutions: number;
    totalResolutionImages: number;
  };
  latestQuestions: Record<string, any>[];
  latestResolutions: Record<string, any>[];
  latestUsers: Record<string, any>[];
  latestQuestionsWithoutResolution: Record<string, any>[];
};
export type StudentStatisticsRow = Record<string, any> & {
  id: string;
  attempts_count: number;
  correct_count: number;
  distinct_answered: number;
  distinct_correct: number;
  accuracy: number;
  last_answered_at: string | null;
};

export async function performanceRpc<T>(
  db: Database,
  name: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const start = performance.now();
  const controller = new AbortController();
  let rows = 0,
    bytes = 0;
  try {
    const query = db.rpc(name, args) as ReturnType<Database["rpc"]> & {
      abortSignal?: (s: AbortSignal) => ReturnType<Database["rpc"]>;
    };
    const response = await bounded(
      query.abortSignal?.(controller.signal) ?? query,
      15000
    );
    if (response.error) throw response.error;
    if (response.data == null) throw { code: "INVALID_RPC_RESULT" };
    const result = response.data as any;
    const nonnegative = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) && value >= 0;
    if (
      name === "vet_admin_dashboard" &&
      (!result.stats ||
        ![
          "totalUsers",
          "totalAdmins",
          "totalQuestions",
          "totalQuestionsWithoutResolution",
          "totalUnpublishedQuestions",
          "totalResolutions",
          "totalResolutionImages",
        ].every(key => nonnegative(result.stats[key])) ||
        ![
          "latestQuestions",
          "latestResolutions",
          "latestUsers",
          "latestQuestionsWithoutResolution",
        ].every(key => Array.isArray(result[key])))
    )
      throw { code: "INVALID_RPC_RESULT" };
    if (
      name === "vet_admin_student_statistics" &&
      (!Array.isArray(result) ||
        !result.every(
          row =>
            typeof row.id === "string" &&
            [
              "attempts_count",
              "correct_count",
              "distinct_answered",
              "distinct_correct",
              "accuracy",
            ].every(key => nonnegative(row[key]))
        ))
    )
      throw { code: "INVALID_RPC_RESULT" };
    if (
      ["vet_question_details", "vet_question_suggestions"].includes(name) &&
      !Array.isArray(result)
    )
      throw { code: "INVALID_RPC_RESULT" };
    rows = Array.isArray(result)
      ? result.length
      : Array.isArray(result.rows)
        ? result.rows.length
        : 1;
    bytes = Buffer.byteLength(JSON.stringify(result));
    return result as T;
  } catch (error) {
    const code = safeErrorCode(error);
    console.warn({
      event: "performance_stage_two",
      operation: name,
      outcome: "error",
      code,
      duration_ms: Math.round(performance.now() - start),
    });
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: ["PGRST202", "42883"].includes(code)
        ? "Esta consulta depende da migration de desempenho Etapa 2. Solicite ao administrador sua aplicação antes de publicar."
        : "Não foi possível atualizar os dados. Tente novamente em instantes.",
    });
  } finally {
    controller.abort();
    console.info({
      event: "performance_stage_two",
      operation: name,
      queries: 1,
      rows,
      bytes,
      duration_ms: Math.round(performance.now() - start),
    });
  }
}

export async function browseQuestions(
  db: Database,
  input: BrowseInput,
  administrative: boolean,
  userId: string | null
): Promise<BrowseResult> {
  const result = await performanceRpc<BrowseResult>(
    db,
    "vet_browse_questions",
    {
      p_filters: input.filters,
      p_page: input.page,
      p_size: input.pageSize,
      p_admin: administrative,
      p_user: userId,
    }
  );
  if (
    !Array.isArray(result.rows) ||
    result.rows.length > input.pageSize ||
    !Number.isInteger(result.total) ||
    !result.facets ||
    !result.stats
  ) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Resposta de listagem inválida. Tente novamente.",
    });
  }
  return result;
}
