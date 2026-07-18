export type BillingCycle = "MONTHLY" | "YEARLY" | "ONE_TIME";

export type BillingGateway = "manual" | "mercadopago";

export type BillingSubscriptionStatus =
  | "pending"
  | "active"
  | "overdue"
  | "canceled"
  | "expired"
  | "refunded"
  | "failed"
  | "manual_review"
  | "trialing";

export interface BillingPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_cycle: BillingCycle;
  invite_only: boolean;
  max_active_subscriptions: number | null;
  is_active: boolean;
  features: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BillingPlanWithStats extends BillingPlan {
  active_subscriptions_count: number;
  has_available_slots: boolean;
}

export interface BillingPlanInvite {
  id: string;
  plan_id: string;
  email: string | null;
  user_id: string | null;
  invite_code: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  plan_id: string;

  status: BillingSubscriptionStatus;
  gateway: BillingGateway;

  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  gateway_payment_id: string | null;

  payment_url: string | null;

  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_due_date: string | null;
  canceled_at: string | null;

  last_gateway_status: string | null;
  cancel_at_period_end: boolean;
  reservation_expires_at: string | null;

  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export function formatPriceFromCents(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

export function formatBillingCycle(cycle: BillingCycle): string {
  switch (cycle) {
    case "MONTHLY":
      return "mensal";
    case "YEARLY":
      return "anual";
    case "ONE_TIME":
      return "pagamento único";
    default:
      return "";
  }
}

export function formatSubscriptionStatus(
  status: BillingSubscriptionStatus
): string {
  switch (status) {
    case "pending":
      return "Pendente";
    case "active":
      return "Ativa";
    case "overdue":
      return "Em atraso";
    case "canceled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    case "refunded":
      return "Reembolsada";
    case "failed":
      return "Falhou";
    case "manual_review":
      return "Em análise manual";
    default:
      return "Desconhecida";
  }
}
