import { createHmac, timingSafeEqual } from "node:crypto";

export type MercadoPagoSignatureParts = {
  ts: string | null;
  v1: string | null;
};

export function parseMercadoPagoSignature(header: string | string[] | undefined): MercadoPagoSignatureParts {
  const value = Array.isArray(header) ? header[0] : header;
  const parts = new Map<string, string>();

  for (const item of String(value ?? "").split(",")) {
    const [key, raw] = item.split("=");
    if (key?.trim() && raw?.trim()) parts.set(key.trim(), raw.trim());
  }

  return {
    ts: parts.get("ts") ?? null,
    v1: parts.get("v1") ?? null,
  };
}

export function buildMercadoPagoWebhookManifest(input: {
  dataId?: string | null;
  requestId?: string | null;
  ts?: string | null;
}) {
  let manifest = "";
  if (input.dataId) manifest += `id:${input.dataId};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  if (input.ts) manifest += `ts:${input.ts};`;
  return manifest;
}

export function validateMercadoPagoWebhookSignature(input: {
  xSignature: string | string[] | undefined;
  xRequestId: string | string[] | undefined;
  dataId?: string | null;
  secret: string;
}) {
  const requestId = Array.isArray(input.xRequestId) ? input.xRequestId[0] : input.xRequestId;
  const parsed = parseMercadoPagoSignature(input.xSignature);

  if (!input.secret || !requestId || !parsed.ts || !parsed.v1 || !input.dataId) return false;

  const manifest = buildMercadoPagoWebhookManifest({
    dataId: input.dataId,
    requestId,
    ts: parsed.ts,
  });
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");

  const receivedBuffer = Buffer.from(parsed.v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
