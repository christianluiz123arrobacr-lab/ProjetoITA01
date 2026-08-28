import { trpcClient } from "@/lib/trpcClient";

export type BillingPlanSlug = string;

export type BillingPlan = {
  id?: string;
  slug: BillingPlanSlug;
  dbSlugCandidates: string[];
  name: string;
  amountCents: number;
  currency: "BRL";
  description: string;
  isBeta: boolean;
  maxActiveSubscriptions?: number | null;
  usedSlots?: number;
  remainingSlots?: number | null;
  hasAvailableSlots?: boolean;
  requiresLegacyFounderEligibility: boolean;
  legacyFounderEligible: boolean;
  hasValidInvite: boolean;
  canCheckout: boolean;
  checkoutBlockReason: "legacy_founder_required" | "active_subscription" | null;
  isCurrentPlan: boolean;
  displayOrder: number;
};

export type PublicBillingPlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string | null;
  billing_cycle: string | null;
  is_active: boolean;
  max_active_subscriptions: number | null;
  active_subscriptions_count: number;
  manual_review_count: number;
  used_slots: number;
  remaining_slots: number | null;
  has_available_slots: boolean;
  requires_legacy_founder_eligibility: boolean;
  legacy_founder_eligible: boolean;
  has_valid_invite: boolean;
  can_checkout: boolean;
  checkout_block_reason: "legacy_founder_required" | "active_subscription" | null;
  is_current_plan: boolean;
  display_order: number;
};


export type BillingCapabilities = {
  mode: "mercadopago" | "manual";
  mercadoPagoEnabled: boolean;
  manualPixFallbackEnabled: boolean;
};

export type MercadoPagoPixResult = {
  subscriptionId: string;
  paymentId: string;
  status: string;
  amountCents: number;
  currency: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: string | null;
  paymentUrl: string | null;
};

export type MercadoPagoCheckoutResult = {
  subscriptionId: string;
  status: string;
  checkoutUrl: string | null;
  paymentUrl: string | null;
  gateway: "mercadopago";
  paymentMethod: "mercadopago_card";
};

export type ManualSubscriptionRequestResult = {
  id?: string;
  user_id?: string;
  plan_id?: string;
  plan_slug?: string;
  status?: string;
  gateway?: string;
  payment_url?: string | null;
  created_at?: string;
  table_used?: string;
};

export const PIX_PAYMENT_INFO = {
  key: "66997227099",
  displayKey: "(66) 99722-7099",
  whatsapp: "5566997227099",
  receiverLabel: "Projeto Vetor",
};

export function formatPlanPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function isBetaPlan(slug: string) {
  const normalized = slug.toLowerCase();
  return normalized.includes("beta") || normalized.includes("fundador") || normalized.includes("selecion");
}

function mapPublicRowToPlan(row: PublicBillingPlanRow): BillingPlan {
  return {
    id: row.id,
    slug: row.slug,
    dbSlugCandidates: [row.slug],
    name: row.name,
    amountCents: row.price_cents,
    currency: "BRL",
    description: row.description ?? "Plano de acesso à plataforma.",
    isBeta: isBetaPlan(row.slug),
    maxActiveSubscriptions: row.max_active_subscriptions,
    usedSlots: row.used_slots ?? 0,
    remainingSlots: row.remaining_slots,
    hasAvailableSlots: row.has_available_slots,
    requiresLegacyFounderEligibility: row.requires_legacy_founder_eligibility,
    legacyFounderEligible: row.legacy_founder_eligible,
    hasValidInvite: row.has_valid_invite,
    canCheckout: row.can_checkout,
    checkoutBlockReason: row.checkout_block_reason,
    isCurrentPlan: row.is_current_plan,
    displayOrder: row.display_order,
  };
}

export async function loadPublicBillingPlans(): Promise<BillingPlan[]> {
  try {
    const rows = await trpcClient.billing.listPublicPlans.query();

    if (Array.isArray(rows) && rows.length > 0) {
      return (rows as PublicBillingPlanRow[]).map(mapPublicRowToPlan);
    }
  } catch (error) {
    console.warn("Não foi possível carregar planos públicos via backend. Usando fallback local:", error);
  }

  return [];
}

export async function requestManualSubscription(
  planSlug: string
): Promise<ManualSubscriptionRequestResult> {
  return trpcClient.billing.requestManualSubscription.mutate({ planSlug });
}

export async function getMyActiveSubscription() {
  return trpcClient.billing.getMyActiveSubscription.query();
}

export async function getMyLatestSubscriptionRequest() {
  return trpcClient.billing.getMyLatestSubscriptionRequest.query();
}

export async function getBillingCapabilities(): Promise<BillingCapabilities> {
  return trpcClient.billing.getCapabilities.query();
}

export async function createCardSubscriptionCheckout(
  planSlug: string
): Promise<MercadoPagoCheckoutResult> {
  return trpcClient.billing.createCardSubscriptionCheckout.mutate({ planSlug });
}

export async function createMercadoPagoPixPayment(
  planSlug: string
): Promise<MercadoPagoPixResult> {
  return trpcClient.billing.createPixPayment.mutate({ planSlug });
}

export async function createPrepaidCheckout(planSlug: string, durationMonths: 1 | 2 | 3, paymentMethod: "card" | "pix") {
  return trpcClient.billing.createPrepaidCheckout.mutate({ planSlug, durationMonths, paymentMethod });
}

export async function getMySubscription() {
  return trpcClient.billing.getMySubscription.query();
}

export async function getMyPayments() {
  return trpcClient.billing.getMyPayments.query();
}

export async function cancelMySubscription() {
  return trpcClient.billing.cancelMySubscription.mutate();
}

export async function syncMyMercadoPagoPaymentStatus() {
  return trpcClient.billing.syncMyMercadoPagoPaymentStatus.mutate();
}
