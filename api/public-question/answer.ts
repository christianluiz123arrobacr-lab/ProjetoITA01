import type { IncomingMessage, ServerResponse } from "node:http";
import { answerPublicQuestion } from "../../server/publicQuestions.js";
import { assertRequestRateLimit } from "../../server/_core/rateLimit.js";

async function body(req: IncomingMessage & { body?: unknown }) { if (req.body && typeof req.body === "object") return req.body as any; const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
export function parsePublicAnswerInput(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const slug = typeof source.slug === "string" ? source.slug : "";
  const selectedOption = typeof source.selectedOption === "string" ? source.selectedOption.toLowerCase() : "";
  return slug && /^[a-e]$/.test(selectedOption) ? { slug, selectedOption } : null;
}
export default async function publicAnswer(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method Not Allowed" })); return; }
  try {
    await assertRequestRateLimit(req, "public-question-answer", { limit: 60, windowMs: 10 * 60 * 1000, allowInMemoryFallback: true });
    const input = parsePublicAnswerInput(await body(req));
    if (!input) { res.statusCode = 400; res.end(JSON.stringify({ error: "Selecione uma alternativa antes de conferir." })); return; }
    const result = await answerPublicQuestion(input.slug, input.selectedOption); res.statusCode = 200; res.end(JSON.stringify(result));
  } catch (error: any) { res.statusCode = error?.code === "TOO_MANY_REQUESTS" ? 429 : error?.code === "NOT_FOUND" ? 404 : 400; res.end(JSON.stringify({ error: res.statusCode === 404 ? "Conteúdo não disponível." : error?.message || "Requisição inválida." })); }
}
