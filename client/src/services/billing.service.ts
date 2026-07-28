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

export const BILLING_PLANS: BillingPlan[] = [
  {
    slug: "beta-selecionado-5",
    dbSlugCandidates: [
      "beta-selecionado-5",
      "selecionados_5",
      "selecionado",
      "selecionados",
      "beta_selecionado",
    ],
    name: "Beta selecionado",
    amountCents: 600,
    currency: "BRL",
    description:
      "Plano especial para pessoas selecionadas que vão ajudar no começo do projeto.",
    isBeta: true,
    maxActiveSubscriptions: null,
    usedSlots: 0,
    remainingSlots: null,
    hasAvailableSlots: true,
  },
  {
    slug: "beta-fundador-8",
    dbSlugCandidates: [
      "beta-fundador-8",
      "fundador_8",
      "fundador",
      "beta_fundador",
    ],
    name: "Beta fundador",
    amountCents: 900,
    currency: "BRL",
    description:
      "Plano inicial para os primeiros alunos que entrarem durante a fase beta.",
    isBeta: true,
    maxActiveSubscriptions: 15,
    usedSlots: 0,
    remainingSlots: null,
    hasAvailableSlots: true,
  },
  {
    slug: "mensal-1099",
    dbSlugCandidates: [
      "mensal-1099",
      "normal_1099",
      "mensal",
      "normal",
      "plano_mensal",
    ],
    name: "Plano mensal",
    amountCents: 1199,
    currency: "BRL",
    description: "Plano padrão mensal para acesso à plataforma.",
    isBeta: false,
    maxActiveSubscriptions: null,
    usedSlots: 0,
    remainingSlots: null,
    hasAvailableSlots: true,
  },
];

export function getBillingPlans() {
  return BILLING_PLANS;
}

export function getBillingPlanBySlug(slug: string) {
  return BILLING_PLANS.find(
    (plan) => plan.slug === slug || plan.dbSlugCandidates.includes(slug)
  );
}

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
  const fallback = getBillingPlanBySlug(row.slug);

  return {
    id: row.id,
    slug: row.slug,
    dbSlugCandidates: fallback?.dbSlugCandidates ?? [row.slug],
    name: row.name,
    amountCents: row.price_cents,
    currency: "BRL",
    description: row.description ?? fallback?.description ?? "Plano de acesso à plataforma.",
    isBeta: fallback?.isBeta ?? isBetaPlan(row.slug),
    maxActiveSubscriptions: row.max_active_subscriptions,
    usedSlots: row.used_slots ?? 0,
    remainingSlots: row.remaining_slots,
    hasAvailableSlots: row.has_available_slots,
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

  return BILLING_PLANS;
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
