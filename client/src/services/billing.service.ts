import { supabase } from "@/lib/supabase";

export type BillingPlanSlug =
  | "beta-selecionado-5"
  | "beta-fundador-8"
  | "mensal-1099";

export type BillingPlan = {
  slug: BillingPlanSlug;
  dbSlugCandidates: string[];
  name: string;
  amountCents: number;
  currency: "BRL";
  description: string;
  isBeta: boolean;
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
  },
];

export function getBillingPlans() {
  return BILLING_PLANS;
}

export function getBillingPlanBySlug(slug: string) {
  return BILLING_PLANS.find((plan) => plan.slug === slug);
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

async function findBillingPlan(plan: BillingPlan) {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, slug, name, price_cents, currency, billing_cycle, is_active")
    .in("slug", plan.dbSlugCandidates)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar billing_plans pelo slug:", error);
    return null;
  }

  if (data?.id) {
    return data;
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("billing_plans")
    .select("id, slug, name, price_cents, currency, billing_cycle, is_active")
    .eq("price_cents", plan.amountCents)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    console.warn(
      "Não foi possível buscar billing_plans pelo preço:",
      fallbackError
    );
    return null;
  }

  return fallbackData;
}

async function findLatestUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["manual_review", "active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar assinatura existente:", error);
    return null;
  }

  return data;
}

export async function requestManualSubscription(
  planSlug: string
): Promise<ManualSubscriptionRequestResult> {
  const localPlan = getBillingPlanBySlug(planSlug);

  if (!localPlan) {
    throw new Error("Plano inválido.");
  }

  const user = await getCurrentUserOrThrow();
  const profile = await getUserProfile(user.id);
  const billingPlan = await findBillingPlan(localPlan);

  if (!billingPlan?.id) {
    throw new Error(
      `Plano não encontrado no banco. Slug enviado: ${localPlan.slug}. Verifique os slugs em billing_plans.`
    );
  }

  const existingSubscription = await findLatestUserSubscription(user.id);

  if (
    existingSubscription?.status === "active" ||
    existingSubscription?.status === "trialing" ||
    existingSubscription?.status === "manual_review"
  ) {
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
    origin: "site_beta",
    requestedAt: new Date().toISOString(),
    frontendPlanSlug: localPlan.slug,
    databasePlanSlug: billingPlan.slug,
    plan: {
      slug: localPlan.slug,
      dbSlug: billingPlan.slug,
      name: localPlan.name,
      amountCents: localPlan.amountCents,
      currency: localPlan.currency,
      isBeta: localPlan.isBeta,
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
