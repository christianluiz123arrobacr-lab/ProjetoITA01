import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { performance } from "node:perf_hooks";
import type { QuestionPdfFilters } from "../shared/questionPdf.js";
import { QUESTION_PDF_EXPORT_LIMIT } from "../shared/questionPdf.js";

type PdfResult = {
  rows: Record<string, unknown>[];
  totalMatched: number;
  limit: number;
  truncated: boolean;
};
type PdfDatabase = {
  rpc(
    name: string,
    args: Record<string, unknown>
  ): PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};

// Access checks and the rate limiter stay in the protected tRPC procedure.
// No slow fallback: a missing migration fails explicitly instead of scanning the bank.
export async function selectQuestionPdfData(
  db: PdfDatabase,
  userId: string,
  filters: QuestionPdfFilters
) {
  const correlationId = filters.correlationId ?? randomUUID();
  const started = performance.now();
  const log = (outcome: string, databaseCode?: string, rows?: number) =>
    console.info({
      event: "question_pdf_export",
      stage: "server_search",
      correlationId,
      durationMs: Math.round(performance.now() - started),
      outcome,
      databaseCode:
        databaseCode && /^[A-Z0-9_]{1,40}$/.test(databaseCode)
          ? databaseCode
          : undefined,
      rows,
      code: outcome === "error" ? "INTERNAL_SERVER_ERROR" : undefined,
      httpStatus: outcome === "error" ? 500 : 200,
    });
  let response;
  try {
    response = await db.rpc("export_question_pdf_data", {
      p_user_id: userId,
      p_filters: filters,
    });
  } catch {
    log("error", "RPC_TRANSPORT_ERROR");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível buscar as questões para exportação. Tente novamente em instantes.",
    });
  }
  const { data, error } = response;
  if (error) {
    log("error", error.code);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível buscar as questões para exportação. Tente novamente em instantes.",
    });
  }
  const result = data as PdfResult | null;
  if (
    !result ||
    !Array.isArray(result.rows) ||
    result.rows.length > QUESTION_PDF_EXPORT_LIMIT ||
    result.limit !== QUESTION_PDF_EXPORT_LIMIT ||
    !Number.isInteger(result.totalMatched) ||
    result.totalMatched < result.rows.length ||
    typeof result.truncated !== "boolean"
  ) {
    log("error", "INVALID_RPC_RESULT");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível buscar as questões para exportação.",
    });
  }
  log("success", undefined, result.rows.length);
  return {
    ...result,
    correlationId,
    searchDurationMs: Math.round(performance.now() - started),
  };
}
