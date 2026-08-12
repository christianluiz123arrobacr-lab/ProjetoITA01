import type { IncomingMessage, ServerResponse } from "node:http";
import { getPublicQuestion, isValidPublicSlug } from "../../server/publicQuestions.js";
import { buildNotFoundHtml, buildPublicQuestionHtml } from "../../server/publicQuestionPage.js";

type PublicQuestionLoader = typeof getPublicQuestion;

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
      console.error("[public-question.page] falha interna ao carregar página pública", error instanceof Error ? error.message : "unknown_error");
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.end(req.method === "HEAD" ? undefined : "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Erro temporário | Projeto Vetor</title></head><body><h1>Não foi possível carregar esta página</h1><p>Tente novamente em instantes.</p></body></html>");
    }
  };
}

export default createPublicQuestionPageHandler();
