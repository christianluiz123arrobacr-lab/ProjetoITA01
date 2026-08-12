import type { IncomingMessage, ServerResponse } from "node:http";
import { getPublicQuestion, isValidPublicSlug } from "../../server/publicQuestions.js";
import { buildNotFoundHtml, buildPublicQuestionHtml } from "../../server/publicQuestionPage.js";

export default async function publicQuestionPage(req: IncomingMessage & { query?: Record<string, unknown> }, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; res.setHeader("Allow", "GET, HEAD"); res.end(); return; }
  const parsed = new URL(req.url || "/", "https://www.projetovetor.com");
  const raw = req.query?.slug ?? parsed.pathname.split("/").filter(Boolean).at(-1);
  const slug = typeof raw === "string" ? raw : "";
  try {
    const question = isValidPublicSlug(slug) ? await getPublicQuestion(slug) : null;
    if (!question) {
      res.statusCode = 404; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("X-Robots-Tag", "noindex, nofollow"); res.end(req.method === "HEAD" ? undefined : buildNotFoundHtml()); return;
    }
    res.statusCode = 200; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.end(req.method === "HEAD" ? undefined : buildPublicQuestionHtml(question));
  } catch (error) {
    console.error("[public-question.page]", error instanceof Error ? error.message : error);
    res.statusCode = 404; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("X-Robots-Tag", "noindex, nofollow"); res.end(req.method === "HEAD" ? undefined : buildNotFoundHtml());
  }
}
