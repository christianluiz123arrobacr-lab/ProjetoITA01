import type { BillingPaymentStatus, BillingSubscriptionStatus } from "./billingTypes.js";

export function mapMercadoPagoPaymentStatus(status?: string | null, statusDetail?: string | null): BillingPaymentStatus {
  const normalized = String(status ?? "").toLowerCase();
  const detail = String(statusDetail ?? "").toLowerCase();

  if (normalized === "approved") return "approved";
  if (["authorized", "pending", "in_process", "in_mediation"].includes(normalized)) return "pending";
  if (["rejected", "cancelled", "canceled"].includes(normalized)) return "rejected";
  if (normalized === "refunded") return "refunded";
  if (normalized === "charged_back" || detail.includes("chargeback")) return "chargeback";
  if (normalized === "expired") return "expired";
  return "failed";
}

export function mapMercadoPagoPreapprovalStatus(status?: string | null): BillingSubscriptionStatus {
  switch (String(status ?? "").toLowerCase()) {
    case "authorized":
    case "active":
      return "pending";
    case "pending":
      return "pending";
    case "paused":
      return "overdue";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "finished":
      return "expired";
    default:
      return "failed";
  }
}

export function shouldBlockAccessImmediately(status: BillingPaymentStatus | BillingSubscriptionStatus) {
  return ["failed", "expired", "refunded", "canceled", "chargeback", "rejected"].includes(status);
}

export function addDaysPreservingFuturePeriod(currentPeriodEnd: string | null | undefined, days: number, now = new Date()) {
  const currentEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const base = currentEnd && Number.isFinite(currentEnd.getTime()) && currentEnd > now ? currentEnd : now;
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return {
    start: base.toISOString(),
    end: next.toISOString(),
  };
}

export function centsToMercadoPagoAmount(cents: number) {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("Valor em centavos inválido.");
  }

  return Number((cents / 100).toFixed(2));
}

export function mercadoPagoAmountToCents(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("Valor do Mercado Pago inválido.");
  }

  return Math.round(numberValue * 100);
}
