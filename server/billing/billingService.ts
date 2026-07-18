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
  getPayment,
  getPreapproval,
  type MercadoPagoPayment,
  type MercadoPagoPreapproval,
} from "./mercadoPagoClient.js";
import { validateMercadoPagoWebhookSignature } from "./webhookSignature.js";
import type { BillingCapabilities, BillingPaymentStatus, MercadoPagoWebhookPayload } from "./billingTypes.js";

const RESERVATION_MINUTES = 30;
const PIX_EXPIRATION_MINUTES = 60 * 24;
const ACCESS_DAYS_PER_PAYMENT = 30;
const GATEWAY = "mercadopago";
const DEFAULT_CURRENCY = "BRL";

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
  return `${getRequiredAppBaseUrl()}/api/mercadopago/webhook`;
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
    .select("id, status, current_period_end, gateway, metadata")
    .eq("user_id", userId)
    .eq("gateway", GATEWAY)
    .in("status", ["active", "trialing", "overdue"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .limit(10);

  if (error) fail(error.message);
  const recurring = (data ?? []).find((item: any) => item.metadata?.payment_method === "card");
  if (recurring) fail("Você já possui uma assinatura recorrente ativa.", "CONFLICT");
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

async function reserveCheckout(input: {
  userId: string;
  userEmail: string | null;
  plan: BillingPlanRow;
  paymentMethod: "card" | "pix";
}) {
  const reservationExpiresAt = addMinutes(new Date(), RESERVATION_MINUTES).toISOString();
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

export async function createCardSubscriptionCheckout(input: { userId: string; userEmail: string | null; planSlug: string }) {
  const capabilities = getBillingCapabilities();
  if (!capabilities.mercadoPagoEnabled) fail("Mercado Pago não configurado.", "PRECONDITION_FAILED");

  await expireStaleReservations();
  const plan = await getPlanForCheckout(input.planSlug);
  await assertNoBlockingRecurringSubscription(input.userId);

  const existing = await reusePendingSubscription(input.userId, plan.id, "card");
  if (existing?.id) {
    const reusable = await resolveReusableCardReservation(existing);
    if (reusable?.usable) {
      return {
        subscriptionId: String(existing.id),
        status: existing.status,
        checkoutUrl: reusable.checkoutUrl,
        paymentUrl: reusable.checkoutUrl,
        gateway: "mercadopago" as const,
        paymentMethod: "mercadopago_card" as const,
      };
    }
  }

  const profile = await getUserProfile(input.userId);
  const payerEmail = getValidatedBuyerEmail(profile?.email, input.userEmail);
  const reservation = await reserveCheckout({ userId: input.userId, userEmail: payerEmail, plan, paymentMethod: "card" });
  let checkout: MercadoPagoPreapproval | null = null;

  try {
    checkout = await createPreapprovalCheckout({
      reason: `Rumo ao ITA - ${plan.name}`,
      externalReference: reservation.subscriptionId,
      payerEmail,
      amount: centsToMercadoPagoAmount(Number(plan.price_cents)),
      backUrl: getSubscriptionReturnUrl(),
      notificationUrl: getMercadoPagoWebhookUrl(),
      idempotencyKey: `mp-card-${reservation.subscriptionId}`,
    });

    const checkoutUrl = checkout.init_point ?? checkout.sandbox_init_point ?? null;
    await updateSubscriptionOrThrow(reservation.subscriptionId, {
      gateway_subscription_id: checkout.id ? String(checkout.id) : null,
      last_gateway_status: checkout.status ?? null,
      payment_url: checkoutUrl,
    });

    return {
      subscriptionId: reservation.subscriptionId,
      status: "pending" as const,
      checkoutUrl,
      paymentUrl: checkoutUrl,
      gateway: "mercadopago" as const,
      paymentMethod: "mercadopago_card" as const,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar checkout Mercado Pago.";
    if (checkout?.id) {
      try {
        await cancelPreapproval(String(checkout.id), `mp-cancel-compensate-${reservation.subscriptionId}`);
        await markSubscriptionFailed(reservation.subscriptionId, message, { gatewaySubscriptionId: String(checkout.id) });
      } catch (cancelError) {
        await markSubscriptionFailed(reservation.subscriptionId, message, {
          reconciliationStatus: "gateway_created_local_failed",
          reconciliationError: cancelError instanceof Error ? cancelError.message : "Falha ao cancelar preapproval criado.",
          gatewaySubscriptionId: String(checkout.id),
        });
      }
    } else {
      await markSubscriptionFailed(reservation.subscriptionId, message);
    }
    throw error;
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
      description: `Rumo ao ITA - ${plan.name}`,
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
  const { data: subscription, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("gateway", GATEWAY)
    .in("status", ["active", "pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) fail(error.message);
  if (!subscription?.id) fail("Assinatura Mercado Pago não encontrada.", "NOT_FOUND");

  if (subscription.gateway_subscription_id) {
    await cancelPreapproval(String(subscription.gateway_subscription_id), `mp-cancel-user-${subscription.id}`);
  }

  const now = isoNow();
  const patch = subscription.current_period_end && new Date(subscription.current_period_end) > new Date()
    ? { cancel_at_period_end: true, canceled_at: now, last_gateway_status: "cancelled" }
    : { status: "canceled", cancel_at_period_end: false, canceled_at: now, current_period_end: now, last_gateway_status: "cancelled" };
  await updateSubscriptionOrThrow(subscription.id, patch);

  return { success: true, accessUntil: subscription.current_period_end ?? null } as const;
}

export async function cancelAdminMercadoPagoSubscription(input: { subscriptionId: string; adminUserId: string }) {
  const subscription = await getSubscriptionById(input.subscriptionId);
  if (!subscription?.id) fail("Assinatura não encontrada.", "NOT_FOUND");
  if (subscription.gateway === GATEWAY && subscription.gateway_subscription_id) {
    await cancelPreapproval(String(subscription.gateway_subscription_id), `mp-cancel-admin-${subscription.id}`);
  }

  const now = isoNow();
  await updateSubscriptionOrThrow(input.subscriptionId, {
    status: "canceled",
    cancel_at_period_end: false,
    canceled_at: now,
    current_period_end: now,
    last_gateway_status: subscription.gateway === GATEWAY ? "cancelled" : subscription.last_gateway_status ?? null,
    metadata: { ...(subscription.metadata ?? {}), admin_cancelled_by: input.adminUserId, admin_cancelled_at: now },
  });
  return { success: true } as const;
}

async function resolvePaymentContext(payment: MercadoPagoPayment) {
  const paymentStatus = mapMercadoPagoPaymentStatus(payment.status, payment.status_detail);
  const pixReference = extractPixPaymentReference(payment.external_reference);

  if (pixReference) {
    const { data: localPayment, error } = await supabaseAdmin
      .from("billing_payments")
      .select("*, billing_subscriptions(*)")
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
      subscription: (localPayment as any).billing_subscriptions as LocalSubscription,
      paymentStatus,
    };
  }

  const subscription = await findSubscriptionForRecurringPayment(payment);
  if (!subscription?.id) throw new Error("Assinatura local não encontrada para pagamento recorrente.");
  const localPayment = await upsertRecurringPaymentRecord({ payment, subscription, paymentStatus });
  return { kind: "card" as const, localPayment, subscription, paymentStatus };
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
  };

  if (mapped === "canceled") {
    if (shouldPreserveAccessAfterGatewayCancel(targetSubscription)) {
      patch.cancel_at_period_end = true;
      patch.canceled_at = targetSubscription.canceled_at ?? isoNow();
    } else {
      patch.status = targetSubscription.status === "pending" ? "canceled" : "expired";
      patch.current_period_end = targetSubscription.current_period_end ?? isoNow();
    }
  } else if (mapped !== "pending") {
    patch.status = mapped;
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

export async function processMercadoPagoWebhook(input: {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  body: MercadoPagoWebhookPayload;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");

  const resourceId = String((input.query["data.id"] as any) ?? input.body?.data?.id ?? input.body?.id ?? "");
  const type = String(input.body?.type ?? input.body?.topic ?? input.query.type ?? input.body?.action ?? "payment");
  const requestId = firstHeader(input.headers["x-request-id"]);
  const signatureValid = validateMercadoPagoWebhookSignature({
    xSignature: input.headers["x-signature"],
    xRequestId: requestId,
    dataId: resourceId,
    secret,
  });

  if (!signatureValid) return { ok: false, status: 401 as const, message: "invalid_signature" };

  const eventId = String(input.body?.id ?? `${type}:${resourceId}:${requestId ?? "no-request-id"}`);
  const claim = await claimWebhookEvent({ eventId, type, resourceId, requestId: requestId ?? null });
  if (claim.claimStatus === "already_processed") return { ok: true, status: 200 as const, duplicate: true };
  if (claim.claimStatus === "already_processing") return { ok: false, status: 409 as const, message: "already_processing" };

  try {
    if (type.includes("preapproval") || type.includes("subscription")) {
      await processPreapprovalUpdate(resourceId);
    } else {
      const payment = await getPayment(resourceId);
      await processApprovedPayment(payment);
    }

    const { error } = await supabaseAdmin
      .from("billing_webhook_events")
      .update({ status: "processed", processed_at: isoNow(), error_message: null })
      .eq("id", claim.row.id);
    if (error) throw new Error(error.message);
    return { ok: true, status: 200 as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no webhook.";
    const { error: updateError } = await supabaseAdmin
      .from("billing_webhook_events")
      .update({ status: "failed", error_message: message })
      .eq("id", claim.row.id);
    if (updateError) throw new Error(updateError.message);
    return { ok: false, status: 500 as const, processingError: message };
  }
}

export const __billingTestHooks = {
  extractPixPaymentReference,
  buildPaymentReference,
  isUuid,
  shouldPreserveAccessAfterGatewayCancel,
};
