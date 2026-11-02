import { QuestionPdfError } from "./questionPdfErrors";

export type PdfStage =
  | "server_search"
  | "mapping"
  | "resources"
  | "generation"
  | "download";
export function pdfFailureDetails(error: unknown) {
  const e = error as {
    data?: { code?: unknown; httpStatus?: unknown };
    meta?: { response?: { status?: unknown } };
  } | null;
  const code = e?.data?.code;
  const status = e?.meta?.response?.status ?? e?.data?.httpStatus;
  return {
    code:
      typeof code === "string" && /^[A-Z_]{1,40}$/.test(code)
        ? code
        : undefined,
    httpStatus: typeof status === "number" ? status : undefined,
  };
}

export function logPdfStage(
  stage: PdfStage,
  correlationId: string,
  durationMs: number,
  error?: unknown
) {
  const fields = {
    event: "question_pdf_export",
    stage,
    correlationId,
    durationMs: Math.round(durationMs),
    outcome: error ? "error" : "success",
    ...pdfFailureDetails(error),
  };
  if (error) console.error(fields);
  else console.info(fields);
}

export function questionPdfFailureMessage(error: unknown, stage: PdfStage) {
  if (error instanceof QuestionPdfError) return error.userMessage;
  if (stage === "server_search") {
    const { code, httpStatus } = pdfFailureDetails(error);
    if (httpStatus === 504 || code === "TIMEOUT")
      return "O servidor demorou demais para buscar as questões. Tente novamente em instantes.";
    if (code === "UNAUTHORIZED")
      return "Sua sessão expirou. Entre novamente para exportar.";
    if (code === "FORBIDDEN")
      return "Verifique seu acesso e sua assinatura para exportar questões.";
    if (code === "TOO_MANY_REQUESTS")
      return "Muitas tentativas de exportação. Aguarde alguns minutos e tente novamente.";
    return "Não foi possível buscar as questões no servidor. Tente novamente em instantes.";
  }
  return stage === "download"
    ? "O PDF foi montado, mas não foi possível iniciar o download. Tente novamente."
    : "Não foi possível montar o PDF. Atualize a página e tente novamente.";
}
