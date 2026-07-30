import type { IncomingMessage, ServerResponse } from "node:http";
import { processMercadoPagoWebhook } from "../../server/billing/billingService.js";

async function readJsonBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function parseQuery(url: string | undefined) {
  const parsed = new URL(url ?? "/", "https://rumoaoita.local");
  const query: Record<string, unknown> = {};
  parsed.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

export default async function mercadoPagoWebhookHandler(req: IncomingMessage & { body?: unknown; query?: Record<string, unknown> }, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await processMercadoPagoWebhook({
      headers: req.headers,
      query: req.query ?? parseQuery(req.url),
      body: body as any,
    });

    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: result.ok }));
  } catch (error) {
    console.error("[mercadopago.webhook] erro inesperado", error instanceof Error ? error.message : error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false }));
  }
}
