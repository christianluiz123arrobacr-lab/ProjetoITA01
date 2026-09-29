import type { IncomingMessage, ServerResponse } from "node:http";
import { createContext } from "../../server/_core/context.js";
import { assertRateLimit } from "../../server/_core/rateLimit.js";
import { registerPublicQuestionAttempt } from "../../server/publicQuestions.js";

async function body(req: IncomingMessage & { body?: unknown }) { if (req.body && typeof req.body === "object") return req.body as any; const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }
export default async function publicRegister(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "Method Not Allowed" })); return; }
  try {
    const ctx = await createContext({ req, res }); if (!ctx.user) { res.statusCode = 401; res.end(JSON.stringify({ error: "Faça login para registrar a tentativa." })); return; }
    await assertRateLimit({ key: `public-question-register:${ctx.user.id}`, limit: 60, windowMs: 60 * 60 * 1000, allowInMemoryFallback: true });
    const input = await body(req); const slug = typeof input.slug === "string" ? input.slug : ""; const selectedOption = typeof input.selectedOption === "string" ? input.selectedOption.toLowerCase() : ""; const time = Number(input.timeSpentSeconds);
    if (!/^[a-e]$/.test(selectedOption) || !Number.isFinite(time)) throw new Error("Requisição inválida.");
    const result = await registerPublicQuestionAttempt(ctx.user.id, slug, selectedOption, time); res.statusCode = 200; res.end(JSON.stringify(result));
  } catch (error: any) { res.statusCode = error?.code === "NOT_FOUND" ? 404 : 400; res.end(JSON.stringify({ error: error?.message || "Não foi possível registrar." })); }
}
