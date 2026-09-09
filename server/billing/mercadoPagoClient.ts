import { z } from "zod";

const MP_API_BASE_URL = "https://api.mercadopago.com";
const DEFAULT_TIMEOUT_MS = 12_000;

export class MercadoPagoHttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "MercadoPagoHttpError";
  }
}

export function isMercadoPagoNotFound(error: unknown) {
  return error instanceof MercadoPagoHttpError && error.status === 404;
}

export const mercadoPagoPaymentSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.string().nullable().optional(),
  status_detail: z.string().nullable().optional(),
  external_reference: z.string().nullable().optional(),
  transaction_amount: z.number().nullable().optional(),
  currency_id: z.string().nullable().optional(),
  date_approved: z.string().nullable().optional(),
  date_of_expiration: z.string().nullable().optional(),
  preapproval_id: z.union([z.string(), z.number()]).nullable().optional(),
  subscription_id: z.union([z.string(), z.number()]).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  preapproval: z.object({ id: z.union([z.string(), z.number()]).nullable().optional() }).passthrough().nullable().optional(),
  point_of_interaction: z.object({
    transaction_data: z.object({
      qr_code: z.string().nullable().optional(),
      qr_code_base64: z.string().nullable().optional(),
      ticket_url: z.string().nullable().optional(),
    }).partial().optional(),
  }).partial().optional(),
}).passthrough();

export const mercadoPagoPreapprovalSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.string().nullable().optional(),
  external_reference: z.string().nullable().optional(),
  init_point: z.string().nullable().optional(),
  sandbox_init_point: z.string().nullable().optional(),
}).passthrough();

export const mercadoPagoPreferenceSchema = z.object({
  id: z.string().optional(),
  init_point: z.string().nullable().optional(),
  sandbox_init_point: z.string().nullable().optional(),
}).passthrough();

export const mercadoPagoAuthorizedPaymentSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.string().nullable().optional(),
  payment_id: z.union([z.string(), z.number()]).nullable().optional(),
  payment: z.object({ id: z.union([z.string(), z.number()]).nullable().optional() }).passthrough().nullable().optional(),
}).passthrough();

export const mercadoPagoChargebackSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  payments: z.array(z.union([z.string(), z.number()])).optional(),
  payment_id: z.union([z.string(), z.number()]).nullable().optional(),
  payment: z.object({ id: z.union([z.string(), z.number()]).nullable().optional() }).passthrough().nullable().optional(),
}).passthrough();

export const mercadoPagoClaimSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  resource_id: z.union([z.string(), z.number()]).nullable().optional(),
  payment_id: z.union([z.string(), z.number()]).nullable().optional(),
  payment: z.object({ id: z.union([z.string(), z.number()]).nullable().optional() }).passthrough().nullable().optional(),
}).passthrough();

export type MercadoPagoPayment = z.infer<typeof mercadoPagoPaymentSchema>;
export type MercadoPagoPreapproval = z.infer<typeof mercadoPagoPreapprovalSchema>;
export type MercadoPagoAuthorizedPayment = z.infer<typeof mercadoPagoAuthorizedPaymentSchema>;
export type MercadoPagoChargeback = z.infer<typeof mercadoPagoChargebackSchema>;
export type MercadoPagoClaim = z.infer<typeof mercadoPagoClaimSchema>;

function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  return token;
}

async function mercadoPagoFetch(path: string, options: RequestInit & { idempotencyKey?: string } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${getAccessToken()}`);
    headers.set("Content-Type", "application/json");
    if (options.idempotencyKey) headers.set("X-Idempotency-Key", options.idempotencyKey);

    const response = await fetch(`${MP_API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = typeof json?.message === "string" ? json.message : `Mercado Pago HTTP ${response.status}`;
      throw new MercadoPagoHttpError(response.status, message);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createPreapprovalCheckout(input: {
  reason: string;
  externalReference: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
  notificationUrl: string;
  idempotencyKey: string;
}) {
  const payload = {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    notification_url: input.notificationUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: input.amount,
      currency_id: "BRL",
    },
    status: "pending",
  };

  const json = await mercadoPagoFetch("/preapproval", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: input.idempotencyKey,
  });

  return mercadoPagoPreapprovalSchema.parse(json);
}

export async function getPreapproval(id: string) {
  const json = await mercadoPagoFetch(`/preapproval/${encodeURIComponent(id)}`);
  return mercadoPagoPreapprovalSchema.parse(json);
}

export async function cancelPreapproval(id: string, idempotencyKey: string) {
  const json = await mercadoPagoFetch(`/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "canceled" }),
    idempotencyKey,
  });

  return mercadoPagoPreapprovalSchema.parse(json);
}

export async function createPixPayment(input: {
  externalReference: string;
  payerEmail: string;
  amount: number;
  description: string;
  notificationUrl: string;
  expiresAt: string;
  idempotencyKey: string;
}) {
  const payload = {
    transaction_amount: input.amount,
    description: input.description,
    payment_method_id: "pix",
    payer: { email: input.payerEmail },
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    date_of_expiration: input.expiresAt,
  };

  const json = await mercadoPagoFetch("/v1/payments", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: input.idempotencyKey,
  });

  return mercadoPagoPaymentSchema.parse(json);
}

/** Hosted, one-time checkout. Card details never reach Projeto Vetor. */
export async function createPrepaidPreference(input: {
  externalReference: string;
  payerEmail: string;
  amount: number;
  title: string;
  notificationUrl: string;
  backUrl: string;
  idempotencyKey: string;
}) {
  const json = await mercadoPagoFetch("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [{ title: input.title, quantity: 1, unit_price: input.amount, currency_id: "BRL" }],
      payer: { email: input.payerEmail },
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: { success: input.backUrl, pending: input.backUrl, failure: input.backUrl },
      auto_return: "approved",
    }),
    idempotencyKey: input.idempotencyKey,
  });
  return mercadoPagoPreferenceSchema.parse(json);
}

export async function getPayment(id: string) {
  const json = await mercadoPagoFetch(`/v1/payments/${encodeURIComponent(id)}`);
  return mercadoPagoPaymentSchema.parse(json);
}


export async function getAuthorizedPayment(id: string) {
  const json = await mercadoPagoFetch(`/authorized_payments/${encodeURIComponent(id)}`);
  return mercadoPagoAuthorizedPaymentSchema.parse(json);
}

export async function getChargeback(id: string) {
  const json = await mercadoPagoFetch(`/v1/chargebacks/${encodeURIComponent(id)}`);
  return mercadoPagoChargebackSchema.parse(json);
}

export async function getClaim(id: string) {
  const json = await mercadoPagoFetch(`/post-purchase/v1/claims/${encodeURIComponent(id)}`);
  return mercadoPagoClaimSchema.parse(json);
}

export function extractAuthorizedPaymentId(resource: MercadoPagoAuthorizedPayment) {
  return resource.payment_id ? String(resource.payment_id) : resource.payment?.id ? String(resource.payment.id) : null;
}

export function extractChargebackPaymentIds(resource: MercadoPagoChargeback) {
  const candidates = [resource.payment_id, resource.payment?.id, ...(resource.payments ?? [])];
  return Array.from(new Set(candidates.map(value => String(value ?? "").trim()).filter(value => /^\d+$/.test(value))));
}

export function extractChargebackPaymentId(resource: MercadoPagoChargeback) {
  return extractChargebackPaymentIds(resource)[0] ?? null;
}

export function extractClaimPaymentId(resource: MercadoPagoClaim) {
  return resource.payment_id ? String(resource.payment_id) : resource.payment?.id ? String(resource.payment.id) : resource.resource_id ? String(resource.resource_id) : null;
}
