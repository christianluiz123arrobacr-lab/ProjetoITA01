import type { IncomingMessage, ServerResponse } from "node:http";
import { answerPublicQuestion } from "../../server/publicQuestions.js";
import { assertRequestRateLimit } from "../../server/_core/rateLimit.js";

async function body(req: IncomingMessage & { body?: unknown }) { if (req.body && typeof req.body === "object") return req.body as any; const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
export default async function publicAnswer(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method Not Allowed" })); return; }
  try {
    await assertRequestRateLimit(req, "public-question-answer", { limit: 60, windowMs: 10 * 60 * 1000, allowInMemoryFallback: true });
    const input = await body(req); const slug = typeof input.slug === "string" ? input.slug : ""; const selectedOption = input.reveal === true ? null : typeof input.selectedOption === "string" ? input.selectedOption.toLowerCase() : "";
    const result = await answerPublicQuestion(slug, selectedOption); res.statusCode = 200; res.end(JSON.stringify(result));
  } catch (error: any) { res.statusCode = error?.code === "TOO_MANY_REQUESTS" ? 429 : error?.code === "NOT_FOUND" ? 404 : 400; res.end(JSON.stringify({ error: res.statusCode === 404 ? "Conteúdo não disponível." : error?.message || "Requisição inválida." })); }
}
