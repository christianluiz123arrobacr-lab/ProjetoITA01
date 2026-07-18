import { addDaysPreservingFuturePeriod, mapMercadoPagoPaymentStatus, mercadoPagoAmountToCents } from "./billingStatusMapper.js";

export type FinancialValidationResult = { ok: true } | { ok: false; reason: string };

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

export function validateGatewayPayment(input: {
  expectedAmountCents: number;
  expectedCurrency: string;
  externalReference: string | null | undefined;
  transactionAmount: unknown;
  currencyId: string | null | undefined;
}): FinancialValidationResult {
  if (!/^payment:[0-9a-f-]{36}:subscription:[0-9a-f-]{36}$/i.test(String(input.externalReference ?? ""))) {
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
