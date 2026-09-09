import type { IncomingMessage, ServerResponse } from "node:http";
import { getPublicQuestion, isValidPublicSlug } from "../../server/publicQuestions.js";
import { buildNotFoundHtml, buildPublicQuestionHtml } from "../../server/publicQuestionPage.js";

type PublicQuestionLoader = typeof getPublicQuestion;

function sanitizedLogValue(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/(bearer|token|password|secret|service[_ -]?role|api[_ -]?key)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 240);
}

export function createPublicQuestionPageHandler(loadQuestion: PublicQuestionLoader = getPublicQuestion) {
  return async function publicQuestionPage(req: IncomingMessage & { query?: Record<string, unknown> }, res: ServerResponse) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.setHeader("Allow", "GET, HEAD");
      res.end();
      return;
    }

    const parsed = new URL(req.url || "/", "https://www.projetovetor.com");
    const raw = req.query?.slug ?? parsed.pathname.split("/").filter(Boolean).at(-1);
    const slug = typeof raw === "string" ? raw : "";

    try {
      const question = isValidPublicSlug(slug) ? await loadQuestion(slug) : null;
      if (!question) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.end(req.method === "HEAD" ? undefined : buildNotFoundHtml());
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
      res.end(req.method === "HEAD" ? undefined : buildPublicQuestionHtml(question));
    } catch (error) {
      const failure = error as { code?: unknown; databaseMessage?: unknown; message?: unknown; hint?: unknown };
      console.error("[public-question.page] erro ao carregar questão pública", {
        route: "/questoes/:slug",
        slug,
        operation: "getPublicQuestion",
        code: sanitizedLogValue(failure.code),
        message: sanitizedLogValue(failure.databaseMessage ?? failure.message) ?? "unknown_error",
        hint: sanitizedLogValue(failure.hint),
      });
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.end(req.method === "HEAD" ? undefined : "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Erro temporário | Projeto Vetor</title></head><body><h1>Não foi possível carregar esta página</h1><p>Tente novamente em instantes.</p></body></html>");
    }
  };
}

export default createPublicQuestionPageHandler();
