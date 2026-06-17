import { supabase } from "@/lib/supabase";

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
  receiverLabel: "Rumo ao ITA",
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
    usedSlots: 6,
    remainingSlots: 9,
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
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_public_billing_plans"
  );

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return (rpcData as PublicBillingPlanRow[]).map(mapPublicRowToPlan);
  }

  if (rpcError) {
    console.warn("Não foi possível carregar planos públicos via RPC:", rpcError);
  }

  const { data, error } = await supabase
    .from("billing_plans")
    .select(
      "id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions"
    )
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (error) {
    console.warn("Não foi possível carregar billing_plans. Usando fallback local:", error);
    return BILLING_PLANS;
  }

  if (!data || data.length === 0) {
    return BILLING_PLANS;
  }

  return data.map((row: any) =>
    mapPublicRowToPlan({
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      description: row.description,
      price_cents: row.price_cents,
      currency: row.currency,
      billing_cycle: row.billing_cycle,
      is_active: row.is_active,
      max_active_subscriptions: row.max_active_subscriptions ?? null,
      active_subscriptions_count: 0,
      manual_review_count: 0,
      used_slots: 0,
      remaining_slots: row.max_active_subscriptions ?? null,
      has_available_slots: true,
    })
  );
}

async function getCurrentUserOrThrow() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.user) {
    throw new Error("Você precisa estar logado para solicitar uma assinatura.");
  }

  return session.user;
}

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, telefone, email, role, ativo")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar o perfil do usuário:", error);
    return null;
  }

  return data;
}

async function findBillingPlan(planSlug: string) {
  const localPlan = getBillingPlanBySlug(planSlug);
  const candidates = localPlan?.dbSlugCandidates ?? [planSlug];

  if (!candidates.includes(planSlug)) {
    candidates.unshift(planSlug);
  }

  const { data, error } = await supabase
    .from("billing_plans")
    .select(
      "id, slug, name, description, price_cents, currency, billing_cycle, is_active, max_active_subscriptions"
    )
    .in("slug", candidates)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar billing_plans pelo slug:", error);
    return null;
  }

  return data;
}

async function findLatestUserBlockingSubscription(userId: string) {
  const now = Date.now();

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["manual_review", "active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.warn("Não foi possível buscar assinatura existente:", error);
    return null;
  }

  return (data ?? []).find((subscription: any) => {
    if (subscription.status === "manual_review") return true;

    if (!subscription.current_period_end) return true;

    const end = new Date(subscription.current_period_end).getTime();
    return Number.isFinite(end) && end >= now;
  });
}

async function assertPlanHasAvailableSlots(planSlug: string) {
  const publicPlans = await loadPublicBillingPlans().catch(() => []);
  const publicPlan = publicPlans.find(
    (plan) => plan.slug === planSlug || plan.dbSlugCandidates.includes(planSlug)
  );

  if (publicPlan && publicPlan.hasAvailableSlots === false) {
    throw new Error("Este plano atingiu o limite de vagas disponível no momento.");
  }
}

export async function requestManualSubscription(
  planSlug: string
): Promise<ManualSubscriptionRequestResult> {
  const user = await getCurrentUserOrThrow();
  const profile = await getUserProfile(user.id);

  await assertPlanHasAvailableSlots(planSlug);

  const billingPlan = await findBillingPlan(planSlug);

  if (!billingPlan?.id) {
    throw new Error(
      `Plano não encontrado no banco. Slug enviado: ${planSlug}. Verifique os slugs em billing_plans.`
    );
  }

  const existingSubscription = await findLatestUserBlockingSubscription(user.id);

  if (existingSubscription) {
    return {
      ...(existingSubscription as ManualSubscriptionRequestResult),
      table_used: "billing_subscriptions",
    };
  }

  const customerName =
    profile?.nome ||
    user.user_metadata?.nome ||
    user.user_metadata?.full_name ||
    user.email ||
    "Aluno";

  const customerEmail = profile?.email || user.email || null;
  const customerPhone = profile?.telefone || user.user_metadata?.telefone || null;

  const metadata = {
    origin: "site_beta_manual_pix",
    requestedAt: new Date().toISOString(),
    frontendPlanSlug: planSlug,
    databasePlanSlug: billingPlan.slug,
    paymentMethod: "pix_manual",
    plan: {
      slug: planSlug,
      dbSlug: billingPlan.slug,
      name: billingPlan.name,
      amountCents: billingPlan.price_cents,
      currency: billingPlan.currency ?? "BRL",
      isBeta: isBetaPlan(billingPlan.slug),
    },
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
  };

  const payload = {
    user_id: user.id,
    plan_id: billingPlan.id,
    status: "manual_review",
    gateway: "manual",
    payment_url: null,
    metadata,
  };

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao criar assinatura manual:", error);

    throw new Error(
      error.message ||
        "Não foi possível registrar a solicitação de assinatura manual."
    );
  }

  return {
    ...(data as ManualSubscriptionRequestResult),
    table_used: "billing_subscriptions",
  };
}

export async function getMyActiveSubscription() {
  const user = await getCurrentUserOrThrow();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Erro ao buscar assinatura ativa:", error);
    return null;
  }

  return data;
}

export async function getMyLatestSubscriptionRequest() {
  const user = await getCurrentUserOrThrow();

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select(
      `
      *,
      billing_plans (
        id,
        slug,
        name,
        price_cents,
        currency,
        billing_cycle
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Erro ao buscar solicitação de assinatura:", error);
    return null;
  }

  return data;
}
