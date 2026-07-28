import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import {
  addDaysPreservingFuturePeriod,
  centsToMercadoPagoAmount,
  mapMercadoPagoPaymentStatus,
  mapMercadoPagoPreapprovalStatus,
  mercadoPagoAmountToCents,
} from "./billingStatusMapper.js";
import {
  cancelPreapproval,
  createPixPayment as createMercadoPagoPixPayment,
  createPreapprovalCheckout,
  extractAuthorizedPaymentId,
  extractChargebackPaymentIds,
  extractClaimPaymentId,
  getAuthorizedPayment,
  getChargeback,
  getClaim,
  getPayment,
  getPreapproval,
  isMercadoPagoNotFound,
  MercadoPagoHttpError,
  type MercadoPagoPayment,
  type MercadoPagoPreapproval,
} from "./mercadoPagoClient.js";
import {
  isBlockingRecurringReconciliation,
  processBatchIndependently,
  runClaimedBillingWebhook,
  runExclusiveRecurringCheckout,
  sanitizeBillingError,
  SUPPORTED_RECONCILIATION_STATUSES,
} from "./billingOrchestration.js";
import { validateMercadoPagoWebhookSignature } from "./webhookSignature.js";
import type { BillingCapabilities, BillingPaymentStatus, MercadoPagoWebhookPayload } from "./billingTypes.js";

const RESERVATION_MINUTES = 30;
const PIX_EXPIRATION_MINUTES = 60 * 24;
const ACCESS_DAYS_PER_PAYMENT = 30;
const GATEWAY = "mercadopago";
const DEFAULT_CURRENCY = "BRL";

export function getCheckoutReservationMinutes(paymentMethod: "card" | "pix") {
  return paymentMethod === "pix" ? PIX_EXPIRATION_MINUTES : RESERVATION_MINUTES;
}

type BillingPlanRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string | null;
  invite_only?: boolean | null;
  max_active_subscriptions?: number | null;
};

type LocalSubscription = Record<string, any> & {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
  gateway_subscription_id?: string | null;
  gateway_payment_id?: string | null;
  metadata?: Record<string, any> | null;
  cancel_at_period_end?: boolean | null;
  canonical_access_subscription_id?: string | null;
  recurring_state?: string | null;
  recurring_slot_active?: boolean | null;
};

type LocalPayment = Record<string, any> & {
  id: string;
  subscription_id: string | null;
  user_id: string;
  plan_id: string | null;
  payment_method: string;
  status: BillingPaymentStatus;
  amount_cents: number;
  currency: string;
  gateway_payment_id?: string | null;
  approved_at?: string | null;
  access_applied_at?: string | null;
  applied_to_subscription_id?: string | null;
  original_subscription_id?: string | null;
  metadata?: Record<string, any> | null;
};

function fail(message: string, code: TRPCError["code"] = "BAD_REQUEST"): never {
  throw new TRPCError({ code, message });
}

function isoNow() {
  return new Date().toISOString();
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function normalizeCurrency(currency: string | null | undefined) {
  return currency || DEFAULT_CURRENCY;
}

function mapRecurringState(status: string | null | undefined) {
  switch (String(status ?? "").toLowerCase()) {
    case "authorized":
    case "active": return "authorized";
    case "pending": return "pending";
    case "paused": return "paused";
    case "cancelled":
    case "canceled": return "canceled";
    case "finished": return "finished";
    default: return "failed";
  }
}

function getValidatedBuyerEmail(profileEmail: string | null | undefined, inputEmail: string | null | undefined) {
  const candidate = String(profileEmail || inputEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) || candidate.endsWith(".local")) {
    fail("Informe um e-mail válido no cadastro antes de iniciar o checkout Mercado Pago.", "PRECONDITION_FAILED");
  }
  return candidate;
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value: string | null | undefined) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? ""));
}

function buildPaymentReference(paymentId: string, subscriptionId: string) {
  return `payment:${paymentId}:subscription:${subscriptionId}`;
}

function extractPixPaymentReference(externalReference: string | null | undefined) {
  const match = String(externalReference ?? "").match(/^payment:([0-9a-f-]{36}):subscription:([0-9a-f-]{36})$/i);
  if (!match) return null;
  return { paymentId: match[1], subscriptionId: match[2] };
}

function getPaymentPreapprovalId(payment: MercadoPagoPayment) {
  const raw = payment.preapproval_id ?? payment.preapproval?.id ?? payment.metadata?.preapproval_id ?? null;
  return raw ? String(raw) : null;
}

function isRecurringSubscription(subscription: LocalSubscription | null | undefined) {
  return subscription?.gateway === GATEWAY && subscription?.metadata?.payment_method === "card";
}

function getContractedAmount(subscription: LocalSubscription) {
  const value = Number(subscription.metadata?.contracted_price_cents);
  if (!Number.isInteger(value) || value <= 0) throw new Error("Preço contratado inválido na assinatura local.");
  return value;
}

function getContractedCurrency(subscription: LocalSubscription) {
  return normalizeCurrency(subscription.metadata?.contracted_currency);
}

function isPaidSubscriptionStillValid(subscription: LocalSubscription, now = new Date()) {
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  return subscription.status === "active" && currentPeriodEnd && Number.isFinite(currentPeriodEnd.getTime()) && currentPeriodEnd > now;
}

function shouldPreserveAccessAfterGatewayCancel(subscription: LocalSubscription, now = new Date()) {
  return Boolean(subscription.cancel_at_period_end && isPaidSubscriptionStillValid(subscription, now));
}

export function getBillingCapabilities(): BillingCapabilities {
  const mode = process.env.BILLING_MODE === "manual" ? "manual" : "mercadopago";
  return {
    mode,
    mercadoPagoEnabled: mode === "mercadopago" && Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    manualPixFallbackEnabled: process.env.MANUAL_PIX_FALLBACK_ENABLED === "true",
  };
}

export function getRequiredAppBaseUrl() {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) fail("APP_BASE_URL não configurado.", "PRECONDITION_FAILED");
  if (process.env.NODE_ENV === "production" && !appBaseUrl.startsWith("https://")) {
    fail("APP_BASE_URL precisa usar HTTPS em produção.", "PRECONDITION_FAILED");
  }
  return appBaseUrl.replace(/\/+$/, "");
}

function getMercadoPagoWebhookUrl() {
  const url = new URL(`${getRequiredAppBaseUrl()}/api/mercadopago/webhook`);
  const urlSecret = process.env.MERCADO_PAGO_WEBHOOK_URL_SECRET;
  if (urlSecret) url.searchParams.set("webhook_secret", urlSecret);
  return url.toString();
}

function getSubscriptionReturnUrl() {
  return `${getRequiredAppBaseUrl()}/assinatura-pendente`;
}

async function expireStaleReservations() {
  const { error } = await supabaseAdmin.rpc("expire_stale_billing_reservations");
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: `Falha ao expirar reservas antigas: ${error.message}` });
}

async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, email, telefone")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  return data as any | null;
}

async function getPlanForCheckout(planSlug: string): Promise<BillingPlanRow> {
  const slug = planSlug.trim();
  const { data, error } = await supabaseAdmin
    .from("billing_plans")
    .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions, invite_only")
    .eq("slug", slug)
    .maybeSingle();

  if (error) fail(error.message);
  if (!data?.id || data.is_active === false) fail("Plano não encontrado ou inativo.", "NOT_FOUND");
  if (normalizeCurrency(data.currency) !== DEFAULT_CURRENCY) fail("Plano com moeda não suportada.");
  if (!Number.isInteger(data.price_cents) || Number(data.price_cents) <= 0) fail("Preço do plano inválido.");
  return data as BillingPlanRow;
}

async function assertNoBlockingRecurringSubscription(userId: string) {
  const now = isoNow();
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("id, status, current_period_end, gateway, metadata, recurring_state, gateway_reconciliation_status")
    .eq("user_id", userId)
    .eq("gateway", GATEWAY)
    .eq("metadata->>payment_method", "card")
    .limit(100);

  if (error) fail(error.message);
  const blockingReconciliation = (data ?? []).find((item: any) =>
    item.metadata?.payment_method === "card" && isBlockingRecurringReconciliation(item)
  );
  if (blockingReconciliation) {
    fail("Existe uma cobrança recorrente pendente de reconciliação. Resolva-a antes de criar outra assinatura.", "CONFLICT");
  }
  const recurring = (data ?? []).find((item: any) => item.metadata?.payment_method === "card");
  if (recurring && ["active", "trialing", "overdue"].includes(recurring.status) && (!recurring.current_period_end || recurring.current_period_end >= now)) {
    fail("Você já possui uma assinatura recorrente ativa.", "CONFLICT");
  }
}

async function reusePendingSubscription(userId: string, planId: string, paymentMethod: "card" | "pix") {
  const now = isoNow();
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("gateway", GATEWAY)
    .eq("status", "pending")
    .gt("reservation_expires_at", now)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) fail(error.message);
  return ((data ?? []).find((item: any) => item.metadata?.payment_method === paymentMethod) ?? null) as LocalSubscription | null;
}

async function resolveReusableCardReservation(subscription: LocalSubscription) {
  const gatewaySubscriptionId = subscription.gateway_subscription_id ? String(subscription.gateway_subscription_id) : null;
  if (!gatewaySubscriptionId) return subscription.payment_url ? { checkoutUrl: subscription.payment_url, usable: true } : null;

  const preapproval = await getPreapproval(gatewaySubscriptionId);
  const status = mapMercadoPagoPreapprovalStatus(preapproval.status);
  if (["pending", "active", "overdue"].includes(status)) {
    return {
      checkoutUrl: preapproval.init_point ?? preapproval.sandbox_init_point ?? subscription.payment_url ?? null,
      usable: true,
    };
  }

  await cancelPreapproval(gatewaySubscriptionId, `mp-cancel-stale-${subscription.id}`);
  await markSubscriptionFailed(subscription.id, `Preapproval antigo ${preapproval.status ?? "desconhecido"} cancelado antes de nova tentativa.`, {
    gatewaySubscriptionId,
  });
  return null;
}


async function findReusableCardSubscriptionForUser(userId: string, planId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("gateway", GATEWAY)
    .not("gateway_subscription_id", "is", null)
    .order("recurring_slot_active", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) fail(error.message);

  for (const row of (data ?? []) as LocalSubscription[]) {
    if (row.metadata?.payment_method !== "card" || !row.gateway_subscription_id) continue;
    if (row.recurring_state === "reconciliation_required" || row.gateway_reconciliation_status) continue;
    if (!row.recurring_slot_active) continue;
    let preapproval: MercadoPagoPreapproval;
    try {
      preapproval = await getPreapproval(String(row.gateway_subscription_id));
    } catch (error) {
      if (!isMercadoPagoNotFound(error)) throw error;
      await updateSubscriptionOrThrow(row.id, {
        recurring_state: "finished",
        recurring_slot_active: false,
        last_gateway_status: "not_found",
        reservation_expires_at: null,
      });
      continue;
    }
    const mapped = mapMercadoPagoPreapprovalStatus(preapproval.status);
    const checkoutUrl = preapproval.init_point ?? preapproval.sandbox_init_point ?? row.payment_url ?? null;
    if (["pending", "active", "overdue"].includes(mapped)) {
      await updateSubscriptionOrThrow(row.id, {
        status: mapped === "active" ? "active" : "pending",
        last_gateway_status: preapproval.status ?? null,
        gateway_subscription_id: preapproval.id ? String(preapproval.id) : row.gateway_subscription_id,
        payment_url: checkoutUrl,
        reservation_expires_at: mapped === "pending" ? addMinutes(new Date(), RESERVATION_MINUTES).toISOString() : row.reservation_expires_at ?? null,
        recurring_state: mapRecurringState(preapproval.status),
        recurring_slot_active: true,
      });
      return { subscription: row, checkoutUrl, status: mapped };
    }

    await updateSubscriptionOrThrow(row.id, {
      status: mapped === "canceled" ? "canceled" : "expired",
      last_gateway_status: preapproval.status ?? null,
      reservation_expires_at: null,
      recurring_state: mapRecurringState(preapproval.status),
      recurring_slot_active: false,
    });
  }

  return null;
}

type CancellationOutcome = {
  outcome: "success" | "partial" | "failed" | "no_action";
  found: number;
  processed: number;
  successes: string[];
  failures: Array<{ subscriptionId: string; error: string }>;
  noActionReason?: string;
};

function isTerminalPreapprovalStatus(status: unknown) {
  return ["cancelled", "canceled", "finished"].includes(String(status ?? "").toLowerCase());
}

type PreapprovalCancellationDependencies = {
  get: typeof getPreapproval;
  cancel: typeof cancelPreapproval;
  update: typeof updateSubscriptionOrThrow;
  isNotFound: typeof isMercadoPagoNotFound;
  now: typeof isoNow;
};

const defaultCancellationDependencies: PreapprovalCancellationDependencies = {
  get: getPreapproval,
  cancel: cancelPreapproval,
  update: updateSubscriptionOrThrow,
  isNotFound: isMercadoPagoNotFound,
  now: isoNow,
};

async function cancelSinglePreapproval(
  origin: LocalSubscription,
  actor: "user" | "admin" | "reconciliation",
  dependencies: PreapprovalCancellationDependencies,
) {
  try {
    let current: MercadoPagoPreapproval | null = null;
    try {
      current = await dependencies.get(String(origin.gateway_subscription_id));
    } catch (error) {
      if (!dependencies.isNotFound(error)) throw error;
    }
    if (current && !isTerminalPreapprovalStatus(current.status)) {
      await dependencies.cancel(String(origin.gateway_subscription_id), `mp-cancel-${actor}-${origin.id}`);
      try {
        current = await dependencies.get(String(origin.gateway_subscription_id));
      } catch (error) {
        if (!dependencies.isNotFound(error)) throw error;
        current = null;
      }
    }
    if (current && !isTerminalPreapprovalStatus(current.status)) throw new Error("Cancelamento não confirmado pelo Mercado Pago.");
    await dependencies.update(origin.id, {
      recurring_state: current?.status === "finished" ? "finished" : "canceled",
      recurring_slot_active: false,
      last_gateway_status: current?.status ?? "not_found",
      gateway_reconciliation_status: null,
      gateway_reconciliation_error: null,
    });
  } catch (error) {
    const message = sanitizeBillingError(error);
    await dependencies.update(origin.id, {
      recurring_state: "reconciliation_required",
      recurring_slot_active: false,
      gateway_reconciliation_status: `${actor}_cancel_gateway_failed`,
      gateway_reconciliation_error: message,
      gateway_reconciliation_last_attempt_at: dependencies.now(),
      gateway_reconciliation_attempts: Number(origin.gateway_reconciliation_attempts ?? 0) + 1,
    });
    throw new Error(message);
  }
}

export async function cancelRelatedPreapprovals(
  origins: LocalSubscription[],
  actor: "user" | "admin" | "reconciliation",
  dependencies = defaultCancellationDependencies,
): Promise<CancellationOutcome> {
  const candidates = origins.filter(origin => origin.gateway_subscription_id);
  const batch = await processBatchIndependently(
    candidates.map(origin => origin.id),
    async id => cancelSinglePreapproval(candidates.find(origin => origin.id === id)!, actor, dependencies),
    "Nenhuma preapproval relacionada exige cancelamento.",
  );
  return {
    outcome: batch.outcome,
    found: candidates.length,
    processed: batch.processed,
    successes: batch.successes,
    failures: batch.failures.map(failure => ({ subscriptionId: failure.id, error: failure.error })),
    noActionReason: batch.noActionReason,
  };
}

async function reserveCheckout(input: {
  userId: string;
  userEmail: string | null;
  plan: BillingPlanRow;
  paymentMethod: "card" | "pix";
}) {
  // A Pix reservation must remain pending for as long as its QR code is payable.
  // Card checkout creation remains a short-lived concurrency reservation.
  const reservationExpiresAt = addMinutes(
    new Date(),
    getCheckoutReservationMinutes(input.paymentMethod),
  ).toISOString();
  const { data, error } = await supabaseAdmin.rpc("reserve_mercadopago_checkout", {
    p_user_id: input.userId,
    p_user_email: input.userEmail,
    p_plan_id: input.plan.id,
    p_payment_method: input.paymentMethod,
    p_reservation_expires_at: reservationExpiresAt,
    p_metadata: {
      payment_method: input.paymentMethod,
      contracted_price_cents: input.plan.price_cents,
      contracted_currency: normalizeCurrency(input.plan.currency),
    },
  });

  if (error) fail(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.subscription_id) fail("Não foi possível reservar checkout.");
  return { subscriptionId: String(row.subscription_id), reservationExpiresAt };
}

async function reserveRecurringCheckoutSlot(input: {
  userId: string;
  userEmail: string;
  plan: BillingPlanRow;
  owner: string;
}) {
  const expiresAt = addMinutes(new Date(), RESERVATION_MINUTES).toISOString();
  const { data, error } = await supabaseAdmin.rpc("reserve_mercadopago_recurring_checkout_slot", {
    p_user_id: input.userId,
    p_user_email: input.userEmail,
    p_plan_id: input.plan.id,
    p_creation_owner: input.owner,
    p_creation_expires_at: expiresAt,
    p_metadata: {
      payment_method: "card",
      contracted_price_cents: input.plan.price_cents,
      contracted_currency: normalizeCurrency(input.plan.currency),
    },
  });
  if (error) fail(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.subscription_id) fail("Não foi possível reservar a recorrência.");
  return {
    subscriptionId: String(row.subscription_id),
    shouldCreate: Boolean(row.should_create),
    gatewaySubscriptionId: row.gateway_subscription_id ? String(row.gateway_subscription_id) : null,
    checkoutUrl: row.payment_url ? String(row.payment_url) : null,
  };
}

async function markSubscriptionFailed(
  subscriptionId: string,
  reason: string,
  options: { reconciliationStatus?: string | null; reconciliationError?: string | null; gatewaySubscriptionId?: string | null; gatewayPaymentId?: string | null } = {},
) {
  const { error } = await supabaseAdmin.rpc("release_mercadopago_checkout_reservation", {
    p_subscription_id: subscriptionId,
    p_reason: reason,
    p_gateway_reconciliation_status: options.reconciliationStatus ?? null,
    p_gateway_reconciliation_error: options.reconciliationError ?? null,
    p_gateway_subscription_id: options.gatewaySubscriptionId ?? null,
    p_gateway_payment_id: options.gatewayPaymentId ?? null,
  });
  if (error) throw new Error(error.message);
}


async function markPaymentFailed(paymentId: string, reason: string) {
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from("billing_payments")
    .select("metadata")
    .eq("id", paymentId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabaseAdmin
    .from("billing_payments")
    .update({
      status: "failed",
      metadata: { ...((payment as any)?.metadata ?? {}), failure_reason: reason },
    })
    .eq("id", paymentId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
}

async function getSubscriptionById(subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as LocalSubscription | null;
}

async function getActiveAccessSubscriptionForUser(userId: string) {
  const now = isoNow();
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("gateway", GATEWAY)
    .eq("status", "active")
    .gte("current_period_end", now)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as LocalSubscription | null;
}

async function findSubscriptionForRecurringPayment(payment: MercadoPagoPayment) {
  const externalReference = payment.external_reference ? String(payment.external_reference) : null;
  if (externalReference && isUuid(externalReference)) {
    const subscription = await getSubscriptionById(externalReference);
    if (subscription) return subscription;
  }

  const preapprovalId = getPaymentPreapprovalId(payment);
  if (preapprovalId) {
    const { data, error } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("*")
      .eq("gateway", GATEWAY)
      .eq("gateway_subscription_id", preapprovalId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) return data as LocalSubscription;
  }

  if (externalReference) {
    const { data, error } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("*")
      .eq("gateway", GATEWAY)
      .eq("gateway_subscription_id", externalReference)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) return data as LocalSubscription;
  }

  return null;
}

async function upsertRecurringPaymentRecord(input: {
  payment: MercadoPagoPayment;
  subscription: LocalSubscription;
  paymentStatus: BillingPaymentStatus;
}) {
  const gatewayPaymentId = input.payment.id ? String(input.payment.id) : null;
  if (!gatewayPaymentId) throw new Error("Pagamento Mercado Pago sem id.");

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("billing_payments")
    .select("*")
    .eq("gateway", GATEWAY)
    .eq("gateway_payment_id", gatewayPaymentId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing as LocalPayment;

  const { data, error } = await supabaseAdmin
    .from("billing_payments")
    .insert({
      subscription_id: input.subscription.id,
      user_id: input.subscription.user_id,
      plan_id: input.subscription.plan_id,
      gateway: GATEWAY,
      gateway_payment_id: gatewayPaymentId,
      payment_method: "mercadopago_card",
      status: "pending",
      original_subscription_id: input.subscription.id,
      access_duration_value: 1,
      access_duration_unit: "months",
      amount_cents: getContractedAmount(input.subscription),
      currency: getContractedCurrency(input.subscription),
      metadata: {
        external_reference: input.payment.external_reference ?? null,
        preapproval_id: getPaymentPreapprovalId(input.payment) ?? input.subscription.gateway_subscription_id ?? null,
        gateway_status: input.payment.status ?? null,
        gateway_status_detail: input.payment.status_detail ?? null,
      },
    })
    .select("*")
    .single();

  if (error || !data?.id) throw new Error(error?.message ?? "Falha ao criar histórico de pagamento recorrente.");
  return data as LocalPayment;
}

async function updatePaymentOrThrow(paymentId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from("billing_payments").update(patch).eq("id", paymentId);
  if (error) throw new Error(error.message);
}

async function updateSubscriptionOrThrow(subscriptionId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from("billing_subscriptions").update(patch).eq("id", subscriptionId);
  if (error) throw new Error(error.message);
}

type CardCheckoutResult = {
  subscriptionId: string;
  status: string;
  checkoutUrl: string | null;
  paymentUrl: string | null;
  gateway: "mercadopago";
  paymentMethod: "mercadopago_card";
};

type ReservedCardCheckoutDependencies = {
  reserve: typeof reserveRecurringCheckoutSlot;
  create: typeof createPreapprovalCheckout;
  complete: (input: { reservation: Awaited<ReturnType<typeof reserveRecurringCheckoutSlot>>; owner: string; checkout: MercadoPagoPreapproval }) => Promise<void>;
  reuse: (reservation: Awaited<ReturnType<typeof reserveRecurringCheckoutSlot>>) => Promise<CardCheckoutResult>;
  compensate: (input: { reservation: Awaited<ReturnType<typeof reserveRecurringCheckoutSlot>>; checkout: MercadoPagoPreapproval | null; error: unknown }) => Promise<void>;
  owner: () => string;
};

async function waitForRecurringCheckout(reservation: Awaited<ReturnType<typeof reserveRecurringCheckoutSlot>>, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("id, gateway_subscription_id, payment_url, recurring_state")
      .eq("id", reservation.subscriptionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.gateway_subscription_id) {
      const preapproval = await getPreapproval(String(data.gateway_subscription_id));
      const checkoutUrl = preapproval.init_point ?? preapproval.sandbox_init_point ?? data.payment_url ?? null;
      return {
        subscriptionId: reservation.subscriptionId,
        status: mapMercadoPagoPreapprovalStatus(preapproval.status),
        checkoutUrl,
        paymentUrl: checkoutUrl,
        gateway: "mercadopago" as const,
        paymentMethod: "mercadopago_card" as const,
      };
    }
    if (["failed", "reconciliation_required"].includes(String(data?.recurring_state))) {
      fail("A criação anterior falhou ou exige reconciliação.", "CONFLICT");
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  fail("A criação da assinatura já está em andamento. Aguarde alguns instantes e tente novamente.", "CONFLICT");
}

const defaultReservedCardCheckoutDependencies: ReservedCardCheckoutDependencies = {
  reserve: reserveRecurringCheckoutSlot,
  create: createPreapprovalCheckout,
  owner: randomUUID,
  complete: async ({ reservation, owner, checkout }) => {
    const checkoutUrl = checkout.init_point ?? checkout.sandbox_init_point ?? null;
    const { error } = await supabaseAdmin.rpc("complete_mercadopago_recurring_checkout_slot", {
      p_subscription_id: reservation.subscriptionId,
      p_creation_owner: owner,
      p_gateway_subscription_id: checkout.id ? String(checkout.id) : null,
      p_gateway_status: checkout.status ?? null,
      p_payment_url: checkoutUrl,
    });
    if (error) throw new Error(error.message);
  },
  reuse: waitForRecurringCheckout,
  compensate: async ({ reservation, checkout, error }) => {
    const message = sanitizeBillingError(error);
    if (checkout?.id) {
      try {
        await cancelPreapproval(String(checkout.id), `mp-cancel-compensate-${reservation.subscriptionId}`);
        await markSubscriptionFailed(reservation.subscriptionId, message, { gatewaySubscriptionId: String(checkout.id) });
      } catch (cancelError) {
        await markSubscriptionFailed(reservation.subscriptionId, message, {
          reconciliationStatus: "gateway_created_local_failed",
          reconciliationError: sanitizeBillingError(cancelError),
          gatewaySubscriptionId: String(checkout.id),
        });
      }
    } else {
      await markSubscriptionFailed(reservation.subscriptionId, message);
    }
  },
};

export async function executeReservedCardCheckout(
  input: {
    userId: string;
    payerEmail: string;
    plan: BillingPlanRow;
    onSubscriptionReserved?: (subscriptionId: string) => void;
  },
  dependencies = defaultReservedCardCheckoutDependencies,
): Promise<CardCheckoutResult> {
  const owner = dependencies.owner();
  return runExclusiveRecurringCheckout({
    reserve: async () => {
      const reservation = await dependencies.reserve({ userId: input.userId, userEmail: input.payerEmail, plan: input.plan, owner });
      input.onSubscriptionReserved?.(reservation.subscriptionId);
      return reservation;
    },
    reuse: dependencies.reuse,
    create: reservation => dependencies.create({
      reason: `Projeto Vetor - ${input.plan.name}`,
      externalReference: reservation.subscriptionId,
      payerEmail: input.payerEmail,
      amount: centsToMercadoPagoAmount(Number(input.plan.price_cents)),
      backUrl: getSubscriptionReturnUrl(),
      notificationUrl: getMercadoPagoWebhookUrl(),
      idempotencyKey: `mp-card-${reservation.subscriptionId}`,
    }),
    complete: async (reservation, checkout) => {
      await dependencies.complete({ reservation, owner, checkout });
      const checkoutUrl = checkout.init_point ?? checkout.sandbox_init_point ?? null;
      return {
        subscriptionId: reservation.subscriptionId,
        status: "pending",
        checkoutUrl,
        paymentUrl: checkoutUrl,
        gateway: "mercadopago",
        paymentMethod: "mercadopago_card",
      };
    },
    compensate: (reservation, checkout, error) => dependencies.compensate({ reservation, checkout, error }),
  });
}

type CardCheckoutFailureContext = {
  subscriptionId: string | null;
  planSlug: string;
};

export function mapMercadoPagoCardCheckoutError(
  error: unknown,
  context: CardCheckoutFailureContext,
  logger: (entry: Record<string, unknown>) => void = console.error,
) {
  const sanitizedMessage = sanitizeBillingError(error);
  const status = error instanceof MercadoPagoHttpError ? error.status : null;
  const errorName = error instanceof Error ? error.name : typeof error;

  logger({
    event: "mercadopago_card_checkout_failed",
    error_name: errorName,
    mercado_pago_http_status: status,
    message: sanitizedMessage,
    subscription_id: context.subscriptionId,
    plan_slug: context.planSlug,
  });

  const rawMessage = error instanceof Error ? error.message : "";
  if (status === 401 || status === 403 || rawMessage.includes("MERCADO_PAGO_ACCESS_TOKEN")) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Não foi possível autenticar a integração de pagamentos. Verifique as credenciais do Mercado Pago.",
    });
  }
  if (error instanceof MercadoPagoHttpError) {
    return new TRPCError({
      code: "BAD_GATEWAY",
      message: "O Mercado Pago recusou a criação da assinatura. Tente novamente mais tarde.",
    });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível iniciar a assinatura." });
}

export async function createCardSubscriptionCheckout(input: { userId: string; userEmail: string | null; planSlug: string }) {
  let subscriptionId: string | null = null;
  const capabilities = getBillingCapabilities();
  if (!capabilities.mercadoPagoEnabled) {
    throw mapMercadoPagoCardCheckoutError(
      new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado."),
      { subscriptionId, planSlug: input.planSlug },
    );
  }

  await expireStaleReservations();
  const { error: slotExpiryError } = await supabaseAdmin.rpc("release_expired_mercadopago_recurring_slots", { p_now: isoNow() });
  if (slotExpiryError) fail(slotExpiryError.message);
  const plan = await getPlanForCheckout(input.planSlug);
  const profile = await getUserProfile(input.userId);
  const payerEmail = getValidatedBuyerEmail(profile?.email, input.userEmail);

  try {
    const reusableCard = await findReusableCardSubscriptionForUser(input.userId, plan.id);
    if (reusableCard?.subscription?.id) {
      subscriptionId = String(reusableCard.subscription.id);
      return {
        subscriptionId,
        status: reusableCard.status,
        checkoutUrl: reusableCard.checkoutUrl,
        paymentUrl: reusableCard.checkoutUrl,
        gateway: "mercadopago" as const,
        paymentMethod: "mercadopago_card" as const,
      };
    }
  } catch (error) {
    throw mapMercadoPagoCardCheckoutError(error, { subscriptionId, planSlug: input.planSlug });
  }

  await assertNoBlockingRecurringSubscription(input.userId);
  try {
    return await executeReservedCardCheckout({
      userId: input.userId,
      payerEmail,
      plan,
      onSubscriptionReserved: id => { subscriptionId = id; },
    });
  } catch (error) {
    throw mapMercadoPagoCardCheckoutError(error, { subscriptionId, planSlug: input.planSlug });
  }
}

export async function createPixPayment(input: { userId: string; userEmail: string | null; planSlug: string }) {
  const capabilities = getBillingCapabilities();
  if (!capabilities.mercadoPagoEnabled) fail("Mercado Pago não configurado.", "PRECONDITION_FAILED");

  await expireStaleReservations();
  const plan = await getPlanForCheckout(input.planSlug);

  const existing = await reusePendingSubscription(input.userId, plan.id, "pix");
  if (existing?.id) {
    const { data: payment, error } = await supabaseAdmin
      .from("billing_payments")
      .select("*")
      .eq("subscription_id", existing.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) fail(error.message);
    if (payment?.id) {
      return {
        subscriptionId: String(existing.id),
        paymentId: String(payment.id),
        status: payment.status,
        amountCents: Number(payment.amount_cents),
        currency: payment.currency ?? DEFAULT_CURRENCY,
        qrCode: payment.pix_qr_code ?? null,
        qrCodeBase64: payment.pix_qr_code_base64 ?? null,
        expiresAt: payment.expires_at ?? null,
        paymentUrl: payment.payment_url ?? null,
      };
    }
  }

  const profile = await getUserProfile(input.userId);
  const payerEmail = getValidatedBuyerEmail(profile?.email, input.userEmail);
  const expiresAt = addMinutes(new Date(), PIX_EXPIRATION_MINUTES).toISOString();
  const reservation = await reserveCheckout({ userId: input.userId, userEmail: payerEmail, plan, paymentMethod: "pix" });

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("billing_payments")
    .insert({
      subscription_id: reservation.subscriptionId,
      user_id: input.userId,
      plan_id: plan.id,
      gateway: GATEWAY,
      payment_method: "mercadopago_pix",
      status: "pending",
      amount_cents: plan.price_cents,
      currency: normalizeCurrency(plan.currency),
      expires_at: expiresAt,
      original_subscription_id: reservation.subscriptionId,
      access_duration_value: ACCESS_DAYS_PER_PAYMENT,
      access_duration_unit: "days",
      metadata: { external_reference_kind: "pix_single_30_days" },
    })
    .select("id")
    .single();

  if (paymentError || !payment?.id) {
    await markSubscriptionFailed(reservation.subscriptionId, paymentError?.message ?? "Falha ao criar pagamento local.");
    fail(paymentError?.message ?? "Não foi possível criar pagamento local.");
  }

  const externalReference = buildPaymentReference(String(payment.id), reservation.subscriptionId);
  try {
    const mpPayment = await createMercadoPagoPixPayment({
      externalReference,
      payerEmail,
      amount: centsToMercadoPagoAmount(Number(plan.price_cents)),
      description: `Projeto Vetor - ${plan.name}`,
      notificationUrl: getMercadoPagoWebhookUrl(),
      expiresAt,
      idempotencyKey: `mp-pix-${payment.id}`,
    });

    const transactionData = mpPayment.point_of_interaction?.transaction_data;
    await updatePaymentOrThrow(String(payment.id), {
      gateway_payment_id: mpPayment.id ? String(mpPayment.id) : null,
      status: mapMercadoPagoPaymentStatus(mpPayment.status, mpPayment.status_detail),
      payment_url: transactionData?.ticket_url ?? null,
      pix_qr_code: transactionData?.qr_code ?? null,
      pix_qr_code_base64: transactionData?.qr_code_base64 ?? null,
      metadata: {
        external_reference: externalReference,
        gateway_status: mpPayment.status ?? null,
        gateway_status_detail: mpPayment.status_detail ?? null,
      },
    });

    await updateSubscriptionOrThrow(reservation.subscriptionId, {
      gateway_payment_id: mpPayment.id ? String(mpPayment.id) : null,
      last_gateway_status: mpPayment.status ?? null,
    });

    return {
      subscriptionId: reservation.subscriptionId,
      paymentId: String(payment.id),
      status: mapMercadoPagoPaymentStatus(mpPayment.status, mpPayment.status_detail),
      amountCents: Number(plan.price_cents),
      currency: normalizeCurrency(plan.currency),
      qrCode: transactionData?.qr_code ?? null,
      qrCodeBase64: transactionData?.qr_code_base64 ?? null,
      expiresAt,
      paymentUrl: transactionData?.ticket_url ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar Pix Mercado Pago.";
    await markPaymentFailed(String(payment.id), message);
    await markSubscriptionFailed(reservation.subscriptionId, message);
    throw error;
  }
}

export async function getMyPayments(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail(error.message);
  return data ?? [];
}

export async function cancelUserMercadoPagoSubscription(userId: string) {
  const { data: subscriptions, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("gateway", GATEWAY)
    .eq("metadata->>payment_method", "card")
    .order("created_at", { ascending: true });

  if (error) fail(error.message);
  const recurring = ((subscriptions ?? []) as LocalSubscription[]).filter(item => item.gateway_subscription_id);
  if (!recurring.length) fail("Assinatura Mercado Pago não encontrada.", "NOT_FOUND");
  const cancellation = await cancelRelatedPreapprovals(recurring, "user");

  const now = isoNow();
  const canonicalId = recurring.find((item) => item.canonical_access_subscription_id)?.canonical_access_subscription_id ?? recurring[0].id;
  const subscription = await getSubscriptionById(canonicalId);
  const patch = subscription?.current_period_end && new Date(subscription.current_period_end) > new Date()
    ? { cancel_at_period_end: true, canceled_at: now, last_gateway_status: "cancelled" }
    : { status: "canceled", cancel_at_period_end: false, canceled_at: now, current_period_end: now, last_gateway_status: "cancelled" };
  await updateSubscriptionOrThrow(canonicalId, patch);

  return { success: cancellation.outcome === "success", accessUntil: subscription?.current_period_end ?? null, ...cancellation } as const;
}

export async function cancelAdminMercadoPagoSubscription(input: { subscriptionId: string; adminUserId: string }) {
  const subscription = await getSubscriptionById(input.subscriptionId);
  if (!subscription?.id) fail("Assinatura não encontrada.", "NOT_FOUND");
  const canonicalId = subscription.canonical_access_subscription_id ?? subscription.id;
  const { data: origins, error: originsError } = await supabaseAdmin.from("billing_subscriptions").select("*").eq("user_id", subscription.user_id).eq("gateway", GATEWAY).eq("metadata->>payment_method", "card");
  if (originsError) fail(originsError.message);
  const relatedOrigins = ((origins ?? []) as LocalSubscription[]).filter(origin => {
    const originCanonical = origin.canonical_access_subscription_id ?? origin.id;
    return origin.id === subscription.id || originCanonical === canonicalId;
  });
  const cancellation = await cancelRelatedPreapprovals(relatedOrigins, "admin");

  const now = isoNow();
  await updateSubscriptionOrThrow(canonicalId, {
    status: "canceled",
    cancel_at_period_end: false,
    canceled_at: now,
    current_period_end: now,
    last_gateway_status: subscription.gateway === GATEWAY ? "cancelled" : subscription.last_gateway_status ?? null,
    metadata: { ...(subscription.metadata ?? {}), admin_cancelled_by: input.adminUserId, admin_cancelled_at: now },
  });
  return { success: cancellation.outcome === "success", ...cancellation } as const;
}

export async function reconcileRecurringRecords(
  found: LocalSubscription[],
  noActionReason: string,
  dependencies = defaultCancellationDependencies,
): Promise<CancellationOutcome> {
  const batch = await processBatchIndependently(
    found.map(origin => origin.id),
    async id => {
      const origin = found.find(item => item.id === id)!;
      const status = String(origin.gateway_reconciliation_status ?? "");
      if (!SUPPORTED_RECONCILIATION_STATUSES.has(status)) {
        const message = `Tipo de reconciliação não suportado: ${status || "ausente"}.`;
        await dependencies.update(origin.id, {
          gateway_reconciliation_error: message,
          gateway_reconciliation_last_attempt_at: dependencies.now(),
          gateway_reconciliation_attempts: Number(origin.gateway_reconciliation_attempts ?? 0) + 1,
        });
        throw new Error(message);
      }
      if (status.includes("duplicate")) {
        const canonicalId = origin.canonical_access_subscription_id;
        if ((canonicalId != null && origin.id === canonicalId) || origin.recurring_slot_active) {
          const message = "Recorrência duplicada coincide com a assinatura canônica ou com o slot principal; cancelamento automático bloqueado.";
          await dependencies.update(origin.id, {
            gateway_reconciliation_error: message,
            gateway_reconciliation_last_attempt_at: dependencies.now(),
            gateway_reconciliation_attempts: Number(origin.gateway_reconciliation_attempts ?? 0) + 1,
          });
          throw new Error(message);
        }
      }
      if (!origin.gateway_subscription_id) {
        const message = "Reconciliação sem gateway_subscription_id; cancelamento externo não pode ser confirmado.";
        await dependencies.update(origin.id, {
          gateway_reconciliation_error: message,
          gateway_reconciliation_last_attempt_at: dependencies.now(),
          gateway_reconciliation_attempts: Number(origin.gateway_reconciliation_attempts ?? 0) + 1,
        });
        throw new Error(message);
      }
      await cancelSinglePreapproval(origin, "reconciliation", dependencies);
    },
    noActionReason,
  );
  return {
    outcome: batch.outcome,
    found: batch.found,
    processed: batch.processed,
    successes: batch.successes,
    failures: batch.failures.map(failure => ({ subscriptionId: failure.id, error: failure.error })),
    noActionReason: batch.noActionReason,
  };
}

export async function reconcileDuplicateMercadoPagoSubscriptions(input: { subscriptionId?: string; adminUserId: string }) {
  let query = supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("gateway", GATEWAY)
    .eq("metadata->>payment_method", "card")
    .or("recurring_state.eq.reconciliation_required,gateway_reconciliation_status.not.is.null");
  if (input.subscriptionId) query = query.eq("id", input.subscriptionId);
  const { data, error } = await query.order("created_at", { ascending: true }).limit(100);
  if (error) fail(error.message);

  const cancellation = await reconcileRecurringRecords(
    (data ?? []) as LocalSubscription[],
    input.subscriptionId ? "A assinatura informada não possui reconciliação pendente." : "Nenhuma reconciliação pendente foi encontrada.",
  );
  const { error: logError } = await supabaseAdmin.from("admin_logs").insert({
    admin_user_id: input.adminUserId,
    action: "billing_mercadopago_duplicates_reconciled",
    entity_type: "billing_subscription",
    entity_id: input.subscriptionId ?? null,
    description: cancellation.outcome === "no_action"
      ? "Reconciliação Mercado Pago sem itens elegíveis"
      : "Reconciliação de recorrências do Mercado Pago",
    level: cancellation.outcome === "success" ? "info" : "warning",
    metadata: {
      outcome: cancellation.outcome,
      found: cancellation.found,
      processed: cancellation.processed,
      successes: cancellation.successes,
      failed_subscription_ids: cancellation.failures.map(item => item.subscriptionId),
      no_action_reason: cancellation.noActionReason ?? null,
    },
  });
  if (logError) fail(logError.message);
  return cancellation;
}

async function resolvePaymentContext(payment: MercadoPagoPayment) {
  const paymentStatus = mapMercadoPagoPaymentStatus(payment.status, payment.status_detail);
  const pixReference = extractPixPaymentReference(payment.external_reference);

  if (pixReference) {
    const { data: localPayment, error } = await supabaseAdmin
      .from("billing_payments")
      .select(PAYMENT_WITH_ORIGIN_SUBSCRIPTION_SELECT)
      .eq("id", pixReference.paymentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!localPayment?.id) throw new Error("Pagamento local não encontrado.");
    if (localPayment.gateway_payment_id && payment.id && String(localPayment.gateway_payment_id) !== String(payment.id)) {
      throw new Error("Pagamento Mercado Pago não corresponde ao pagamento local.");
    }
    const originalSubscriptionId = String(localPayment.original_subscription_id ?? localPayment.subscription_id ?? "");
    if (originalSubscriptionId && originalSubscriptionId !== pixReference.subscriptionId) {
      throw new Error("Referência Pix não corresponde à reserva original.");
    }
    return {
      kind: "pix" as const,
      localPayment: localPayment as LocalPayment,
      subscription: (localPayment as any).origin_subscription as LocalSubscription,
      paymentStatus,
    };
  }

  const subscription = await findSubscriptionForRecurringPayment(payment);
  if (!subscription?.id) throw new Error("Assinatura local não encontrada para pagamento recorrente.");
  const localPayment = await upsertRecurringPaymentRecord({ payment, subscription, paymentStatus });
  return { kind: "card" as const, localPayment, subscription, paymentStatus };
}

// `billing_payments` has three foreign keys to `billing_subscriptions`. PostgREST
// therefore requires the FK created for `subscription_id` to be named explicitly.
export const PAYMENT_WITH_ORIGIN_SUBSCRIPTION_SELECT = `
  *,
  origin_subscription:billing_subscriptions!billing_payments_subscription_id_fkey(*)
`;

type PaymentStatusSyncDependencies = {
  listPendingPayments: (userId: string) => Promise<Array<{ id: string; gateway_payment_id: string; payment_method: string }>>;
  getGatewayPayment: typeof getPayment;
  processGatewayPayment: typeof processApprovedPayment;
  logError: (entry: Record<string, unknown>) => void;
};

const defaultPaymentStatusSyncDependencies: PaymentStatusSyncDependencies = {
  listPendingPayments: async userId => {
    const { data, error } = await supabaseAdmin
      .from("billing_payments")
      .select("id, gateway_payment_id, payment_method")
      .eq("user_id", userId)
      .eq("gateway", GATEWAY)
      .eq("status", "pending")
      .not("gateway_payment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap(row => row.gateway_payment_id
      ? [{ id: String(row.id), gateway_payment_id: String(row.gateway_payment_id), payment_method: String(row.payment_method) }]
      : []);
  },
  getGatewayPayment: getPayment,
  processGatewayPayment: processApprovedPayment,
  logError: entry => console.error(entry),
};

/**
 * Server-side recovery for delayed/failed webhooks. Candidate gateway IDs are
 * selected by authenticated user ownership in the database, never by the client.
 */
export async function syncMyMercadoPagoPaymentStatus(
  userId: string,
  dependencies: PaymentStatusSyncDependencies = defaultPaymentStatusSyncDependencies,
) {
  const pendingPayments = await dependencies.listPendingPayments(userId);
  const results: Array<{ paymentId: string; ok: boolean; status?: string; error?: string }> = [];

  for (const localPayment of pendingPayments) {
    try {
      const gatewayPayment = await dependencies.getGatewayPayment(localPayment.gateway_payment_id);
      if (localPayment.payment_method === "mercadopago_pix") {
        const reference = extractPixPaymentReference(gatewayPayment.external_reference);
        if (!reference || reference.paymentId !== localPayment.id) {
          throw new Error("Referência do pagamento Mercado Pago não corresponde ao pagamento do usuário.");
        }
      }
      const processed = await dependencies.processGatewayPayment(gatewayPayment);
      results.push({ paymentId: localPayment.id, ok: true, status: processed.paymentStatus });
    } catch (error) {
      const message = sanitizeBillingError(error);
      dependencies.logError({
        event: "mercadopago_payment_status_sync_failed",
        local_payment_id: localPayment.id,
        message,
      });
      results.push({ paymentId: localPayment.id, ok: false, error: message });
    }
  }

  return {
    found: pendingPayments.length,
    processed: results.filter(item => item.ok).length,
    failed: results.filter(item => !item.ok).length,
    results,
  };
}

type AdminPaymentReconciliationDependencies = {
  loadLocalPayment: (billingPaymentId: string) => Promise<LocalPayment | null>;
  getGatewayPayment: typeof getPayment;
  processGatewayPayment: typeof processApprovedPayment;
  reloadLocalPayment: (billingPaymentId: string) => Promise<LocalPayment | null>;
  writeAuditLog: (entry: Record<string, unknown>) => Promise<void>;
};

const loadPaymentForReconciliation = async (billingPaymentId: string) => {
  const { data, error } = await supabaseAdmin
    .from("billing_payments")
    .select("*")
    .eq("id", billingPaymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LocalPayment | null;
};

const defaultAdminPaymentReconciliationDependencies: AdminPaymentReconciliationDependencies = {
  loadLocalPayment: loadPaymentForReconciliation,
  getGatewayPayment: getPayment,
  processGatewayPayment: processApprovedPayment,
  reloadLocalPayment: loadPaymentForReconciliation,
  writeAuditLog: async entry => {
    const { error } = await supabaseAdmin.from("admin_logs").insert(entry);
    if (error) throw new Error(error.message);
  },
};

export async function reconcileMercadoPagoPaymentByAdmin(
  input: { billingPaymentId: string; adminUserId: string },
  dependencies: AdminPaymentReconciliationDependencies = defaultAdminPaymentReconciliationDependencies,
) {
  let localPayment: LocalPayment | null = null;
  let gatewayPaymentId: string | null = null;
  let gatewayStatus = "unknown";

  const audit = async (success: boolean, error?: string) => {
    await dependencies.writeAuditLog({
      admin_user_id: input.adminUserId,
      action: "billing_mercadopago_payment_reconciled",
      entity_type: "billing_payment",
      entity_id: input.billingPaymentId,
      description: success
        ? "Pagamento Mercado Pago verificado administrativamente"
        : "Falha na verificação administrativa de pagamento Mercado Pago",
      level: success ? "info" : "warning",
      metadata: {
        billing_payment_id: input.billingPaymentId,
        gateway_payment_id: gatewayPaymentId,
        gateway_status: gatewayStatus,
        success,
        error: error ?? null,
      },
    });
  };

  try {
    localPayment = await dependencies.loadLocalPayment(input.billingPaymentId);
    if (!localPayment?.id) fail("Pagamento local não encontrado.", "NOT_FOUND");
    if (localPayment.gateway !== GATEWAY) fail("Este pagamento não pertence ao Mercado Pago.");

    gatewayPaymentId = localPayment.gateway_payment_id ? String(localPayment.gateway_payment_id) : null;
    if (!gatewayPaymentId) fail("Pagamento local sem ID oficial do Mercado Pago; a reconciliação não pode liberar acesso.");

    const gatewayPayment = await dependencies.getGatewayPayment(gatewayPaymentId);
    gatewayStatus = mapMercadoPagoPaymentStatus(gatewayPayment.status, gatewayPayment.status_detail);
    const officialGatewayId = gatewayPayment.id ? String(gatewayPayment.id) : null;
    if (!officialGatewayId || officialGatewayId !== gatewayPaymentId) {
      fail("O pagamento retornado pelo Mercado Pago não corresponde ao registro local.");
    }

    const processed = await dependencies.processGatewayPayment(gatewayPayment);
    const updatedPayment = await dependencies.reloadLocalPayment(input.billingPaymentId);
    const accessApplied = Boolean(updatedPayment?.access_applied_at);
    const subscriptionId = updatedPayment?.applied_to_subscription_id
      ?? updatedPayment?.subscription_id
      ?? localPayment.subscription_id
      ?? null;

    await audit(true);

    if (processed.paymentStatus === "approved" && accessApplied) {
      return { success: true, paymentStatus: processed.paymentStatus, subscriptionId, accessApplied, message: "Pagamento confirmado e acesso liberado." };
    }
    if (processed.paymentStatus === "pending") {
      return { success: true, paymentStatus: processed.paymentStatus, subscriptionId, accessApplied: false, message: "O Mercado Pago ainda não confirmou este pagamento." };
    }
    return { success: true, paymentStatus: processed.paymentStatus, subscriptionId, accessApplied, message: "Pagamento não aprovado pelo Mercado Pago." };
  } catch (error) {
    const message = sanitizeBillingError(error);
    await audit(false, message).catch(auditError => {
      console.error({ event: "billing_admin_reconciliation_audit_failed", billing_payment_id: input.billingPaymentId, message: sanitizeBillingError(auditError) });
    });
    if (error instanceof TRPCError) throw error;
    fail(message);
  }
}

async function applyApprovedAccess(input: {
  localPayment: LocalPayment;
  payment: MercadoPagoPayment;
}) {
  const { data, error } = await supabaseAdmin.rpc("apply_approved_mercadopago_payment", {
    p_payment_id: input.localPayment.id,
    p_gateway_payment_id: input.payment.id ? String(input.payment.id) : input.localPayment.gateway_payment_id ?? null,
    p_gateway_status: input.payment.status ?? null,
    p_gateway_status_detail: input.payment.status_detail ?? null,
    p_date_approved: input.payment.date_approved ?? null,
    p_access_days: ACCESS_DAYS_PER_PAYMENT,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.payment_id) throw new Error("Falha ao aplicar acesso aprovado.");
  await updatePaymentOrThrow(input.localPayment.id, {
    gateway_reconciliation_status: null,
    gateway_reconciliation_error: null,
  });
}

async function applyPaymentReversal(input: { localPayment: LocalPayment; payment: MercadoPagoPayment; status: BillingPaymentStatus }) {
  const { data, error } = await supabaseAdmin.rpc("recalculate_mercadopago_access_after_reversal", {
    p_payment_id: input.localPayment.id,
    p_payment_status: input.status,
    p_gateway_status: input.payment.status ?? null,
    p_gateway_status_detail: input.payment.status_detail ?? null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.payment_id) throw new Error("Falha ao recalcular acesso após estorno.");
}

export async function processApprovedPayment(payment: MercadoPagoPayment) {
  const context = await resolvePaymentContext(payment);
  const amountCents = mercadoPagoAmountToCents(payment.transaction_amount);
  if (amountCents !== Number(context.localPayment.amount_cents)) throw new Error("Valor divergente no pagamento.");
  if (normalizeCurrency(payment.currency_id) !== context.localPayment.currency) throw new Error("Moeda divergente no pagamento.");

  const now = new Date();
  const paymentPatch: Record<string, unknown> = {
    status: context.paymentStatus,
    gateway_payment_id: payment.id ? String(payment.id) : context.localPayment.gateway_payment_id,
    metadata: {
      ...(context.localPayment.metadata ?? {}),
      gateway_status: payment.status ?? null,
      gateway_status_detail: payment.status_detail ?? null,
      preapproval_id: getPaymentPreapprovalId(payment) ?? context.subscription.gateway_subscription_id ?? null,
    },
  };

  if (context.paymentStatus === "approved") {
    await applyApprovedAccess({ localPayment: context.localPayment, payment });
  } else {
    if (["refunded", "chargeback"].includes(context.paymentStatus)) paymentPatch.refunded_at = now.toISOString();
    await updatePaymentOrThrow(context.localPayment.id, paymentPatch);
  }

  if (["refunded", "chargeback"].includes(context.paymentStatus)) {
    await applyPaymentReversal({ localPayment: context.localPayment, payment, status: context.paymentStatus });
  }

  if (["rejected", "failed", "expired"].includes(context.paymentStatus)) {
    const nextStatus = context.paymentStatus === "expired" ? "expired" : "failed";
    await updateSubscriptionOrThrow(context.subscription.id, {
      status: isRecurringSubscription(context.subscription) && context.subscription.status === "active" ? "overdue" : nextStatus,
      last_gateway_status: payment.status ?? null,
      reservation_expires_at: null,
    });
  }

  return { paymentStatus: context.paymentStatus, kind: context.kind } as const;
}

export async function processPreapprovalUpdate(resourceId: string) {
  const preapproval = await getPreapproval(resourceId);
  const subscriptionId = preapproval.external_reference && isUuid(String(preapproval.external_reference)) ? String(preapproval.external_reference) : null;
  const subscription = subscriptionId ? await getSubscriptionById(subscriptionId) : null;
  const targetSubscription = subscription ?? await (async () => {
    const { data, error } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("*")
      .eq("gateway", GATEWAY)
      .eq("gateway_subscription_id", String(preapproval.id ?? resourceId))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as LocalSubscription | null;
  })();

  if (!targetSubscription?.id) throw new Error("Preapproval sem assinatura local correspondente.");
  const mapped = mapMercadoPagoPreapprovalStatus(preapproval.status);
  const patch: Record<string, unknown> = {
    gateway_subscription_id: preapproval.id ? String(preapproval.id) : resourceId,
    last_gateway_status: preapproval.status ?? null,
    recurring_state: mapRecurringState(preapproval.status),
    recurring_slot_active: !["cancelled", "canceled", "finished"].includes(String(preapproval.status ?? "").toLowerCase()),
  };

  if (mapped === "canceled") {
    if (shouldPreserveAccessAfterGatewayCancel(targetSubscription)) {
      patch.cancel_at_period_end = true;
      patch.canceled_at = targetSubscription.canceled_at ?? isoNow();
    } else {
      patch.status = targetSubscription.status === "pending" ? "canceled" : "expired";
      patch.current_period_end = targetSubscription.current_period_end ?? isoNow();
    }
  }

  await updateSubscriptionOrThrow(targetSubscription.id, patch);
  return { subscriptionStatus: mapped } as const;
}

async function claimWebhookEvent(input: {
  eventId: string;
  type: string;
  resourceId: string;
  requestId: string | null;
}) {
  const { data, error } = await supabaseAdmin.rpc("claim_mercadopago_webhook_event", {
    p_event_id: input.eventId,
    p_event_type: input.type,
    p_resource_id: input.resourceId,
    p_request_id: input.requestId,
    p_payload: { type: input.type, resourceId: input.resourceId },
    p_processing_lease_seconds: 120,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error("Falha ao reivindicar webhook.");
  return { row: row as any, claimStatus: String(row.claim_status) };
}


function normalizeWebhookType(input: string) {
  return input.toLowerCase().replace(/^topic:/, "").replace(/\s+/g, "_");
}

function isSubscriptionWebhookType(type: string) {
  return ["subscription_preapproval", "subscription_authorized_payment", "subscription_preapproval_plan"].includes(type);
}

function hasValidWebhookFallback(input: { type: string; query: Record<string, unknown> }) {
  const urlSecret = process.env.MERCADO_PAGO_WEBHOOK_URL_SECRET;
  if (!urlSecret || !isSubscriptionWebhookType(input.type)) return false;
  const provided = String(input.query.webhook_secret ?? input.query.secret ?? "");
  return provided.length > 0 && provided === urlSecret;
}

async function processAuthorizedPaymentUpdate(resourceId: string) {
  const authorized = await getAuthorizedPayment(resourceId);
  const paymentId = extractAuthorizedPaymentId(authorized);
  if (!paymentId) throw new Error("Pagamento autorizado sem payment_id oficial.");
  const payment = await getPayment(paymentId);
  return processApprovedPayment(payment);
}

type ChargebackProcessingDependencies = {
  getChargeback: typeof getChargeback;
  getPayment: typeof getPayment;
  processPayment: typeof processApprovedPayment;
};

const defaultChargebackProcessingDependencies: ChargebackProcessingDependencies = {
  getChargeback,
  getPayment,
  processPayment: processApprovedPayment,
};

export async function processChargebackUpdate(
  resourceId: string,
  dependencies = defaultChargebackProcessingDependencies,
) {
  const chargeback = await dependencies.getChargeback(resourceId);
  const paymentIds = extractChargebackPaymentIds(chargeback);
  if (!paymentIds.length) throw new Error("Chargeback sem payment_id oficial válido.");
  const result = await processBatchIndependently(paymentIds, async paymentId => {
    const payment = await dependencies.getPayment(paymentId);
    await dependencies.processPayment(payment);
  });
  if (result.outcome !== "success") {
    throw new Error(`Chargeback ${result.outcome}: ${result.results.filter(item => !item.ok).map(item => `${item.id}:${item.error}`).join(";")}`);
  }
  return result;
}

async function processClaimUpdate(resourceId: string) {
  const claim = await getClaim(resourceId);
  const paymentId = extractClaimPaymentId(claim);
  if (!paymentId) throw new Error("Reclamação sem payment_id oficial.");
  const payment = await getPayment(paymentId);
  return processApprovedPayment(payment);
}

async function dispatchMercadoPagoWebhook(type: string, resourceId: string) {
  if (!resourceId) throw new Error("Webhook Mercado Pago sem data.id.");
  if (type === "payment" || type.startsWith("payment.")) {
    const payment = await getPayment(resourceId);
    return processApprovedPayment(payment);
  }
  if (type === "subscription_preapproval") return processPreapprovalUpdate(resourceId);
  if (type === "subscription_authorized_payment") return processAuthorizedPaymentUpdate(resourceId);
  if (type === "subscription_preapproval_plan") return { ignored: true, reason: "preapproval_plan_not_used" } as const;
  if (type === "topic_chargebacks_wh" || type === "chargebacks" || type === "chargeback") return processChargebackUpdate(resourceId);
  if (type === "topic_claims_integration_wh" || type === "claims" || type === "claim") return processClaimUpdate(resourceId);
  return { ignored: true, reason: "unknown_webhook_type" } as const;
}

export async function processMercadoPagoWebhook(input: {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  body: MercadoPagoWebhookPayload;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");

  const resourceId = String((input.query["data.id"] as any) ?? input.body?.data?.id ?? input.body?.id ?? "");
  const type = normalizeWebhookType(String(input.body?.type ?? input.body?.topic ?? input.query.type ?? input.body?.action ?? "payment"));
  const requestId = firstHeader(input.headers["x-request-id"]);
  const signatureValid = validateMercadoPagoWebhookSignature({
    xSignature: input.headers["x-signature"],
    xRequestId: requestId,
    dataId: resourceId,
    secret,
  });

  if (!signatureValid && !hasValidWebhookFallback({ type, query: input.query })) {
    return { ok: false, status: 401 as const, message: "invalid_signature" };
  }

  const eventId = String(input.body?.id ?? `${type}:${resourceId}:${requestId ?? "no-request-id"}`);
  const claim = await claimWebhookEvent({ eventId, type, resourceId, requestId: requestId ?? null });
  if (claim.claimStatus === "already_processed") return { ok: true, status: 200 as const, duplicate: true };
  if (claim.claimStatus === "already_processing") return { ok: false, status: 409 as const, message: "already_processing" };

  return runClaimedBillingWebhook({
    dispatch: () => dispatchMercadoPagoWebhook(type, resourceId),
    markProcessed: async () => {
      const { error } = await supabaseAdmin
        .from("billing_webhook_events")
        .update({ status: "processed", processed_at: isoNow(), error_message: null })
        .eq("id", claim.row.id);
      if (error) throw new Error(error.message);
    },
    markFailed: async message => {
      const { data: localPayment } = await supabaseAdmin
        .from("billing_payments")
        .select("id")
        .eq("gateway", GATEWAY)
        .eq("gateway_payment_id", resourceId)
        .maybeSingle();
      if (localPayment?.id) {
        await supabaseAdmin
          .from("billing_payments")
          .update({
            gateway_reconciliation_status: "webhook_payment_processing_failed",
            gateway_reconciliation_error: message,
          })
          .eq("id", localPayment.id);
      }
      const { error } = await supabaseAdmin
        .from("billing_webhook_events")
        .update({
          status: "failed",
          error_message: message,
          payload: {
            type,
            resourceId,
            billing_payment_id: localPayment?.id ?? null,
            gateway_payment_id: resourceId || null,
            attempted_at: isoNow(),
          },
        })
        .eq("id", claim.row.id);
      if (error) throw new Error(error.message);
    },
  });
}

export const __billingTestHooks = {
  extractPixPaymentReference,
  buildPaymentReference,
  isUuid,
  shouldPreserveAccessAfterGatewayCancel,
};
