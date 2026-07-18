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
  getPayment,
  getPreapproval,
  type MercadoPagoPayment,
} from "./mercadoPagoClient.js";
import { validateMercadoPagoWebhookSignature } from "./webhookSignature.js";
import type { BillingCapabilities, MercadoPagoWebhookPayload } from "./billingTypes.js";

const RESERVATION_MINUTES = 30;
const PIX_EXPIRATION_MINUTES = 60 * 24;
const PIX_ACCESS_DAYS = 30;

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
  if (!appBaseUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "APP_BASE_URL não configurado." });
  if (process.env.NODE_ENV === "production" && !appBaseUrl.startsWith("https://")) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "APP_BASE_URL precisa usar HTTPS em produção." });
  }
  return appBaseUrl.replace(/\/+$/, "");
}

function getMercadoPagoWebhookUrl() {
  return `${getRequiredAppBaseUrl()}/api/mercadopago/webhook`;
}

function getSubscriptionReturnUrl() {
  return `${getRequiredAppBaseUrl()}/assinatura-pendente`;
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

async function getUserProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, email, telefone")
    .eq("id", userId)
    .maybeSingle();
  return data as any | null;
}

async function getPlanForCheckout(planSlug: string) {
  const slug = planSlug.trim();
  const { data, error } = await supabaseAdmin
    .from("billing_plans")
    .select("id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions, invite_only")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if (!data?.id || data.is_active === false) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado ou inativo." });
  if ((data.currency ?? "BRL") !== "BRL") throw new TRPCError({ code: "BAD_REQUEST", message: "Plano com moeda não suportada." });
  if (!Number.isInteger(data.price_cents) || Number(data.price_cents) <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço do plano inválido." });
  return data as any;
}

async function assertPlanAvailability(plan: any) {
  const publicPlansResponse = await supabaseAdmin.rpc("get_public_billing_plans");
  if (!publicPlansResponse.error && Array.isArray(publicPlansResponse.data)) {
    const publicPlan = publicPlansResponse.data.find((item: any) => item.slug === plan.slug || item.id === plan.id);
    if (publicPlan?.has_available_slots === false) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Este plano atingiu o limite de vagas disponível no momento." });
    }
  }
}

async function assertValidInviteIfNeeded(plan: any, userId: string, email: string | null) {
  if (!plan.invite_only) return;
  const now = new Date().toISOString();
  let query = supabaseAdmin
    .from("billing_plan_invites")
    .select("id, used_at, expires_at")
    .eq("plan_id", plan.id)
    .is("used_at", null)
    .or(`user_id.eq.${userId},email.eq.${email ?? "__missing__"}`)
    .limit(1);

  const { data, error } = await query;
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  const invite = (data ?? []).find((item: any) => !item.expires_at || item.expires_at >= now);
  if (!invite) throw new TRPCError({ code: "FORBIDDEN", message: "Este plano exige convite válido." });
}

async function assertNoBlockingSubscription(userId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("id, status, current_period_end, gateway, metadata")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "manual_review"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .limit(1);

  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if ((data ?? []).length > 0) throw new TRPCError({ code: "CONFLICT", message: "Você já possui uma assinatura ativa ou em análise." });
}

async function reusePendingSubscription(userId: string, planId: string, paymentMethod: "card" | "pix") {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .eq("gateway", "mercadopago")
    .eq("status", "pending")
    .gt("reservation_expires_at", now)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return null;
  return (data ?? []).find((item: any) => item.metadata?.payment_method === paymentMethod) ?? null;
}

export async function createCardSubscriptionCheckout(input: { userId: string; userEmail: string | null; planSlug: string }) {
  const capabilities = getBillingCapabilities();
  if (!capabilities.mercadoPagoEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Mercado Pago não configurado." });

  const plan = await getPlanForCheckout(input.planSlug);
  await assertPlanAvailability(plan);
  await assertValidInviteIfNeeded(plan, input.userId, input.userEmail);
  await assertNoBlockingSubscription(input.userId);

  const existing = await reusePendingSubscription(input.userId, plan.id, "card");
  if (existing?.payment_url) {
    return {
      subscriptionId: String(existing.id),
      status: existing.status,
      checkoutUrl: existing.payment_url,
      paymentUrl: existing.payment_url,
      gateway: "mercadopago" as const,
      paymentMethod: "mercadopago_card" as const,
    };
  }

  const profile = await getUserProfile(input.userId);
  const now = new Date();
  const reservationExpiresAt = addMinutes(now, RESERVATION_MINUTES).toISOString();

  const { data: subscription, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: plan.id,
      status: "pending",
      gateway: "mercadopago",
      reservation_expires_at: reservationExpiresAt,
      metadata: {
        payment_method: "card",
        contracted_price_cents: plan.price_cents,
        contracted_currency: plan.currency ?? "BRL",
      },
    })
    .select("id")
    .single();

  if (error || !subscription?.id) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Não foi possível reservar checkout." });

  const checkout = await createPreapprovalCheckout({
    reason: `Rumo ao ITA - ${plan.name}`,
    externalReference: String(subscription.id),
    payerEmail: profile?.email || input.userEmail || "comprador@rumoaoita.local",
    amount: centsToMercadoPagoAmount(Number(plan.price_cents)),
    backUrl: getSubscriptionReturnUrl(),
    notificationUrl: getMercadoPagoWebhookUrl(),
    idempotencyKey: `mp-card-${subscription.id}`,
  });

  const checkoutUrl = checkout.init_point ?? checkout.sandbox_init_point ?? null;
  await supabaseAdmin
    .from("billing_subscriptions")
    .update({
      gateway_subscription_id: checkout.id ? String(checkout.id) : null,
      last_gateway_status: checkout.status ?? null,
      payment_url: checkoutUrl,
    })
    .eq("id", subscription.id);

  return {
    subscriptionId: String(subscription.id),
    status: "pending" as const,
    checkoutUrl,
    paymentUrl: checkoutUrl,
    gateway: "mercadopago" as const,
    paymentMethod: "mercadopago_card" as const,
  };
}

export async function createPixPayment(input: { userId: string; userEmail: string | null; planSlug: string }) {
  const capabilities = getBillingCapabilities();
  if (!capabilities.mercadoPagoEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Mercado Pago não configurado." });

  const plan = await getPlanForCheckout(input.planSlug);
  await assertPlanAvailability(plan);
  await assertValidInviteIfNeeded(plan, input.userId, input.userEmail);

  const existing = await reusePendingSubscription(input.userId, plan.id, "pix");
  if (existing?.id) {
    const { data: payment } = await supabaseAdmin
      .from("billing_payments")
      .select("*")
      .eq("subscription_id", existing.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (payment?.id) {
      return {
        subscriptionId: String(existing.id),
        paymentId: String(payment.id),
        status: payment.status,
        amountCents: Number(payment.amount_cents),
        currency: payment.currency ?? "BRL",
        qrCode: payment.pix_qr_code ?? null,
        qrCodeBase64: payment.pix_qr_code_base64 ?? null,
        expiresAt: payment.expires_at ?? null,
        paymentUrl: payment.payment_url ?? null,
      };
    }
  }

  const profile = await getUserProfile(input.userId);
  const now = new Date();
  const expiresAt = addMinutes(now, PIX_EXPIRATION_MINUTES).toISOString();
  const reservationExpiresAt = addMinutes(now, RESERVATION_MINUTES).toISOString();

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("billing_subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: plan.id,
      status: "pending",
      gateway: "mercadopago",
      reservation_expires_at: reservationExpiresAt,
      metadata: {
        payment_method: "pix",
        contracted_price_cents: plan.price_cents,
        contracted_currency: plan.currency ?? "BRL",
      },
    })
    .select("id")
    .single();

  if (subscriptionError || !subscription?.id) throw new TRPCError({ code: "BAD_REQUEST", message: subscriptionError?.message ?? "Não foi possível criar assinatura pendente." });

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("billing_payments")
    .insert({
      subscription_id: subscription.id,
      user_id: input.userId,
      plan_id: plan.id,
      gateway: "mercadopago",
      payment_method: "mercadopago_pix",
      status: "pending",
      amount_cents: plan.price_cents,
      currency: plan.currency ?? "BRL",
      expires_at: expiresAt,
      metadata: { external_reference_kind: "pix_single_30_days" },
    })
    .select("id")
    .single();

  if (paymentError || !payment?.id) throw new TRPCError({ code: "BAD_REQUEST", message: paymentError?.message ?? "Não foi possível criar pagamento local." });

  const externalReference = `payment:${payment.id}:subscription:${subscription.id}`;
  const mpPayment = await createMercadoPagoPixPayment({
    externalReference,
    payerEmail: profile?.email || input.userEmail || "comprador@rumoaoita.local",
    amount: centsToMercadoPagoAmount(Number(plan.price_cents)),
    description: `Rumo ao ITA - ${plan.name}`,
    notificationUrl: getMercadoPagoWebhookUrl(),
    expiresAt,
    idempotencyKey: `mp-pix-${payment.id}`,
  });

  const transactionData = mpPayment.point_of_interaction?.transaction_data;
  await supabaseAdmin
    .from("billing_payments")
    .update({
      gateway_payment_id: mpPayment.id ? String(mpPayment.id) : null,
      status: mapMercadoPagoPaymentStatus(mpPayment.status, mpPayment.status_detail),
      payment_url: transactionData?.ticket_url ?? null,
      pix_qr_code: transactionData?.qr_code ?? null,
      pix_qr_code_base64: transactionData?.qr_code_base64 ?? null,
      metadata: { external_reference: externalReference, gateway_status: mpPayment.status, gateway_status_detail: mpPayment.status_detail },
    })
    .eq("id", payment.id);

  await supabaseAdmin
    .from("billing_subscriptions")
    .update({ gateway_payment_id: mpPayment.id ? String(mpPayment.id) : null, last_gateway_status: mpPayment.status ?? null })
    .eq("id", subscription.id);

  return {
    subscriptionId: String(subscription.id),
    paymentId: String(payment.id),
    status: mapMercadoPagoPaymentStatus(mpPayment.status, mpPayment.status_detail),
    amountCents: Number(plan.price_cents),
    currency: plan.currency ?? "BRL",
    qrCode: transactionData?.qr_code ?? null,
    qrCodeBase64: transactionData?.qr_code_base64 ?? null,
    expiresAt,
    paymentUrl: transactionData?.ticket_url ?? null,
  };
}

function extractPaymentReference(externalReference: string | null | undefined) {
  const match = String(externalReference ?? "").match(/^payment:([0-9a-f-]{36}):subscription:([0-9a-f-]{36})$/i);
  if (!match) return null;
  return { paymentId: match[1], subscriptionId: match[2] };
}

export async function getMyPayments(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  return data ?? [];
}

export async function cancelUserMercadoPagoSubscription(userId: string) {
  const { data: subscription, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("gateway", "mercadopago")
    .in("status", ["active", "pending", "overdue"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if (!subscription?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura Mercado Pago não encontrada." });

  if (subscription.gateway_subscription_id) {
    await cancelPreapproval(String(subscription.gateway_subscription_id), `mp-cancel-user-${subscription.id}`);
  }

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("billing_subscriptions")
    .update({ cancel_at_period_end: true, canceled_at: now, last_gateway_status: "cancelled" })
    .eq("id", subscription.id);

  return { success: true, accessUntil: subscription.current_period_end ?? null } as const;
}

export async function cancelAdminMercadoPagoSubscription(input: { subscriptionId: string; adminUserId: string }) {
  const { data: subscription, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .maybeSingle();

  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if (!subscription?.id) throw new TRPCError({ code: "NOT_FOUND", message: "Assinatura não encontrada." });
  if (subscription.gateway === "mercadopago" && subscription.gateway_subscription_id) {
    await cancelPreapproval(String(subscription.gateway_subscription_id), `mp-cancel-admin-${subscription.id}`);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("billing_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      canceled_at: now,
      current_period_end: now,
      last_gateway_status: subscription.gateway === "mercadopago" ? "cancelled" : subscription.last_gateway_status ?? null,
      metadata: { ...(subscription.metadata ?? {}), admin_cancelled_by: input.adminUserId, admin_cancelled_at: now },
    })
    .eq("id", input.subscriptionId);

  if (updateError) throw new TRPCError({ code: "BAD_REQUEST", message: updateError.message });
  return { success: true } as const;
}

export async function processApprovedPayment(payment: MercadoPagoPayment) {
  const reference = extractPaymentReference(payment.external_reference);
  if (!reference) throw new Error("external_reference inválida.");

  const { data: localPayment, error } = await supabaseAdmin
    .from("billing_payments")
    .select("*, billing_subscriptions(current_period_end)")
    .eq("id", reference.paymentId)
    .eq("subscription_id", reference.subscriptionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!localPayment?.id) throw new Error("Pagamento local não encontrado.");

  const amountCents = mercadoPagoAmountToCents(payment.transaction_amount);
  if (amountCents !== Number(localPayment.amount_cents)) throw new Error("Valor divergente no pagamento.");
  if ((payment.currency_id ?? "BRL") !== localPayment.currency) throw new Error("Moeda divergente no pagamento.");

  const paymentStatus = mapMercadoPagoPaymentStatus(payment.status, payment.status_detail);
  const now = new Date();
  const period = paymentStatus === "approved"
    ? addDaysPreservingFuturePeriod((localPayment as any).billing_subscriptions?.current_period_end, PIX_ACCESS_DAYS, now)
    : null;

  const paymentPatch: Record<string, unknown> = {
    status: paymentStatus,
    gateway_payment_id: payment.id ? String(payment.id) : localPayment.gateway_payment_id,
    metadata: { ...(localPayment.metadata ?? {}), gateway_status: payment.status, gateway_status_detail: payment.status_detail },
  };

  if (paymentStatus === "approved" && !localPayment.approved_at) paymentPatch.approved_at = payment.date_approved ?? now.toISOString();
  if (["refunded", "chargeback"].includes(paymentStatus)) paymentPatch.refunded_at = now.toISOString();

  await supabaseAdmin.from("billing_payments").update(paymentPatch).eq("id", localPayment.id);

  if (paymentStatus === "approved" && !localPayment.approved_at && period) {
    await supabaseAdmin
      .from("billing_subscriptions")
      .update({
        status: "active",
        started_at: period.start,
        current_period_start: period.start,
        current_period_end: period.end,
        next_due_date: period.end,
        reservation_expires_at: null,
        last_gateway_status: payment.status ?? null,
      })
      .eq("id", reference.subscriptionId);
  }

  if (["refunded", "chargeback"].includes(paymentStatus)) {
    await supabaseAdmin
      .from("billing_subscriptions")
      .update({ status: "refunded", current_period_end: now.toISOString(), last_gateway_status: payment.status ?? null })
      .eq("id", reference.subscriptionId);
  }

  if (["rejected", "failed", "expired"].includes(paymentStatus)) {
    await supabaseAdmin
      .from("billing_subscriptions")
      .update({ status: paymentStatus === "expired" ? "expired" : "failed", last_gateway_status: payment.status ?? null })
      .eq("id", reference.subscriptionId)
      .eq("status", "pending");
  }

  return { paymentStatus } as const;
}

export async function processPreapprovalUpdate(resourceId: string) {
  const preapproval = await getPreapproval(resourceId);
  const subscriptionId = preapproval.external_reference;
  if (!subscriptionId) throw new Error("Preapproval sem external_reference.");
  const mapped = mapMercadoPagoPreapprovalStatus(preapproval.status);
  const patch: Record<string, unknown> = {
    gateway_subscription_id: preapproval.id ? String(preapproval.id) : resourceId,
    last_gateway_status: preapproval.status ?? null,
  };
  if (mapped !== "pending") patch.status = mapped;

  await supabaseAdmin
    .from("billing_subscriptions")
    .update(patch)
    .eq("id", subscriptionId);
  return { subscriptionStatus: mapped } as const;
}

export async function processMercadoPagoWebhook(input: {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  body: MercadoPagoWebhookPayload;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");

  const resourceId = String((input.query["data.id"] as any) ?? input.body?.data?.id ?? input.body?.id ?? "");
  const type = String(input.body?.type ?? input.body?.topic ?? input.query.type ?? "payment");
  const requestId = input.headers["x-request-id"];
  const signatureValid = validateMercadoPagoWebhookSignature({
    xSignature: input.headers["x-signature"],
    xRequestId: requestId,
    dataId: resourceId,
    secret,
  });

  if (!signatureValid) return { ok: false, status: 401 as const, message: "invalid_signature" };

  const eventId = String(input.body?.id ?? `${type}:${resourceId}:${Array.isArray(requestId) ? requestId[0] : requestId}`);
  const eventPayload = {
    provider: "mercadopago",
    event_id: eventId,
    event_type: type,
    resource_id: resourceId,
    request_id: Array.isArray(requestId) ? requestId[0] : requestId ?? null,
    status: "received",
    payload: { type, resourceId },
  };

  const { data: existing } = await supabaseAdmin
    .from("billing_webhook_events")
    .select("id, status")
    .eq("provider", "mercadopago")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing?.status === "processed") return { ok: true, status: 200 as const, duplicate: true };

  const { data: eventRow } = existing?.id
    ? await supabaseAdmin.from("billing_webhook_events").update({ attempts: (existing as any).attempts + 1, status: "received" }).eq("id", existing.id).select("id").single()
    : await supabaseAdmin.from("billing_webhook_events").insert(eventPayload).select("id").single();

  try {
    if (type.includes("preapproval") || type.includes("subscription")) {
      await processPreapprovalUpdate(resourceId);
    } else {
      const payment = await getPayment(resourceId);
      await processApprovedPayment(payment);
    }

    if (eventRow?.id) {
      await supabaseAdmin.from("billing_webhook_events").update({ status: "processed", processed_at: new Date().toISOString(), error_message: null }).eq("id", eventRow.id);
    }
    return { ok: true, status: 200 as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no webhook.";
    if (eventRow?.id) {
      await supabaseAdmin.from("billing_webhook_events").update({ status: "failed", error_message: message }).eq("id", eventRow.id);
    }
    return { ok: true, status: 200 as const, processingError: message };
  }
}
