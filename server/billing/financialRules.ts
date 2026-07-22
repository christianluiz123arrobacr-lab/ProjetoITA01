import { addDaysPreservingFuturePeriod, mapMercadoPagoPaymentStatus, mercadoPagoAmountToCents } from "./billingStatusMapper.js";

export type FinancialValidationResult = { ok: true } | { ok: false; reason: string };

const uuidPattern = "[0-9a-f-]{36}";
const pixReferencePattern = new RegExp(`^payment:${uuidPattern}:subscription:${uuidPattern}$`, "i");
const subscriptionReferencePattern = new RegExp(`^${uuidPattern}$`, "i");

export function validateBuyerEmailAddress(email: string | null | undefined): FinancialValidationResult {
  const value = String(email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, reason: "invalid_buyer_email" };
  if (value.endsWith(".local")) return { ok: false, reason: "invalid_buyer_email" };
  return { ok: true };
}

type MercadoPagoPayerEnvironment = Partial<Pick<NodeJS.ProcessEnv, "MERCADO_PAGO_TEST_MODE" | "MERCADO_PAGO_TEST_PAYER_EMAIL">>;

/** Selects the gateway-only payer address without exposing test configuration to the client. */
export function resolveMercadoPagoPayerEmail(
  userEmail: string,
  environment: MercadoPagoPayerEnvironment = process.env,
) {
  if (environment.MERCADO_PAGO_TEST_MODE !== "true") return userEmail;

  const testPayerEmail = String(environment.MERCADO_PAGO_TEST_PAYER_EMAIL ?? "").trim().toLowerCase();
  if (!validateBuyerEmailAddress(testPayerEmail).ok) {
    throw new Error(
      "MERCADO_PAGO_TEST_PAYER_EMAIL deve conter um e-mail válido quando MERCADO_PAGO_TEST_MODE=true.",
    );
  }
  return testPayerEmail;
}

export function validateClientCheckoutInput(input: { planSlug?: unknown; amountCents?: unknown }, authenticated: boolean): FinancialValidationResult {
  if (!authenticated) return { ok: false, reason: "unauthenticated" };
  if (typeof input.planSlug !== "string" || input.planSlug.trim().length === 0) return { ok: false, reason: "invalid_plan" };
  if (input.amountCents !== undefined) return { ok: false, reason: "client_price_forbidden" };
  return { ok: true };
}

export function validatePlanForCheckout(plan: { is_active?: boolean; has_available_slots?: boolean; invite_only?: boolean }, hasInvite: boolean): FinancialValidationResult {
  if (plan.is_active === false) return { ok: false, reason: "inactive_plan" };
  if (plan.has_available_slots === false) return { ok: false, reason: "plan_full" };
  if (plan.invite_only && !hasInvite) return { ok: false, reason: "missing_invite" };
  return { ok: true };
}

export function classifyExternalReference(externalReference: string | null | undefined) {
  const value = String(externalReference ?? "");
  if (pixReferencePattern.test(value)) return "pix_payment" as const;
  if (subscriptionReferencePattern.test(value)) return "card_subscription" as const;
  return "invalid" as const;
}

export function validateGatewayPayment(input: {
  expectedAmountCents: number;
  expectedCurrency: string;
  externalReference: string | null | undefined;
  transactionAmount: unknown;
  currencyId: string | null | undefined;
}): FinancialValidationResult {
  if (classifyExternalReference(input.externalReference) === "invalid") {
    return { ok: false, reason: "invalid_external_reference" };
  }
  if (mercadoPagoAmountToCents(input.transactionAmount) !== input.expectedAmountCents) return { ok: false, reason: "amount_mismatch" };
  if ((input.currencyId ?? "") !== input.expectedCurrency) return { ok: false, reason: "currency_mismatch" };
  return { ok: true };
}

export function shouldGrantAccessFromPayment(status: string | null | undefined) {
  return mapMercadoPagoPaymentStatus(status) === "approved";
}

export function shouldBlockFromPayment(status: string | null | undefined, statusDetail?: string | null) {
  return ["rejected", "expired", "refunded", "chargeback", "failed"].includes(mapMercadoPagoPaymentStatus(status, statusDetail));
}

export function resolveCancellationAccess(input: { currentPeriodEnd?: string | null; immediate: boolean; now?: Date }) {
  const now = input.now ?? new Date();
  if (input.immediate) return { status: "canceled" as const, accessUntil: now.toISOString(), cancelAtPeriodEnd: false };
  return { status: "active" as const, accessUntil: input.currentPeriodEnd ?? null, cancelAtPeriodEnd: true };
}

export function extendPixAccess(currentPeriodEnd: string | null | undefined, now = new Date()) {
  return addDaysPreservingFuturePeriod(currentPeriodEnd, 30, now);
}

export function shouldPreserveAccessOnPreapprovalCancel(input: { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd?: string | null; now?: Date }) {
  const now = input.now ?? new Date();
  const end = input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null;
  return input.cancelAtPeriodEnd && input.status === "active" && Boolean(end && Number.isFinite(end.getTime()) && end > now);
}

export function isDuplicateApprovedPayment(input: { approvedAt?: string | null }) {
  return Boolean(input.approvedAt);
}
