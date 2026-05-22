import { supabase } from "@/lib/supabase";

export type BillingPlanSlug =
  | "beta-selecionado-5"
  | "beta-fundador-8"
  | "mensal-1099";

export type BillingPlan = {
  slug: BillingPlanSlug;
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
    name: "Beta selecionado",
    amountCents: 500,
    currency: "BRL",
    description:
      "Plano especial para pessoas selecionadas que vão ajudar no começo do projeto.",
    isBeta: true,
  },
  {
    slug: "beta-fundador-8",
    name: "Beta fundador",
    amountCents: 800,
    currency: "BRL",
    description:
      "Plano inicial para os primeiros alunos que entrarem durante a fase beta.",
    isBeta: true,
  },
  {
    slug: "mensal-1099",
    name: "Plano mensal",
    amountCents: 1099,
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
    .select("id, nome, full_name, telefone, phone, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar o perfil do usuário:", error);
    return null;
  }

  return data;
}

async function findBillingPlan(slug: string) {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, slug, name, price_cents, currency, billing_cycle")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar billing_plans:", error);
    return null;
  }

  return data;
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
  const billingPlan = await findBillingPlan(localPlan.slug);

  if (!billingPlan?.id) {
    throw new Error(
      "Plano não encontrado no banco. Verifique se o slug do plano existe em billing_plans."
    );
  }

  const existingSubscription = await findLatestUserSubscription(user.id);

  if (existingSubscription?.status === "active") {
    return {
      ...(existingSubscription as ManualSubscriptionRequestResult),
      table_used: "billing_subscriptions",
    };
  }

  if (existingSubscription?.status === "trialing") {
    return {
      ...(existingSubscription as ManualSubscriptionRequestResult),
      table_used: "billing_subscriptions",
    };
  }

  if (existingSubscription?.status === "manual_review") {
    return {
      ...(existingSubscription as ManualSubscriptionRequestResult),
      table_used: "billing_subscriptions",
    };
  }

  const customerName =
    profile?.nome ||
    profile?.full_name ||
    user.user_metadata?.nome ||
    user.user_metadata?.full_name ||
    user.email ||
    "Aluno";

  const customerEmail = profile?.email || user.email || null;
  const customerPhone = profile?.telefone || profile?.phone || null;

  const metadata = {
    origin: "site_beta",
    requestedAt: new Date().toISOString(),
    plan: {
      slug: localPlan.slug,
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
