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
  plan_slug?: string;
  plan_id?: string;
  status?: string;
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
    description:
      "Plano padrão mensal para acesso à plataforma.",
    isBeta: false,
  },
];

export function getBillingPlans() {
  return BILLING_PLANS;
}

export function getBillingPlanBySlug(slug: string) {
  return BILLING_PLANS.find((plan) => plan.slug === slug);
}

function isMissingTableOrColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  const details =
    "details" in error && typeof error.details === "string"
      ? error.details.toLowerCase()
      : "";

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  return (
    code === "42P01" ||
    code === "42703" ||
    message.includes("does not exist") ||
    message.includes("column") ||
    details.includes("does not exist") ||
    details.includes("column")
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
    .select("id, nome, full_name, telefone, phone, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar o perfil do usuário:", error);
    return null;
  }

  return data;
}

async function findBillingPlanId(slug: string) {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn("Não foi possível buscar billing_plans:", error);
    return null;
  }

  return data?.id ?? null;
}

async function tryInsert(
  table: string,
  payloads: Record<string, unknown>[]
): Promise<ManualSubscriptionRequestResult | null> {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      return {
        ...(data as ManualSubscriptionRequestResult),
        table_used: table,
      };
    }

    lastError = error;

    if (!isMissingTableOrColumnError(error)) {
      console.warn(`Falha ao inserir em ${table}:`, error);
    }
  }

  if (lastError) {
    console.warn(`Nenhuma tentativa funcionou para ${table}:`, lastError);
  }

  return null;
}

export async function requestManualSubscription(
  planSlug: string
): Promise<ManualSubscriptionRequestResult> {
  const plan = getBillingPlanBySlug(planSlug);

  if (!plan) {
    throw new Error("Plano inválido.");
  }

  const user = await getCurrentUserOrThrow();
  const profile = await getUserProfile(user.id);

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
      slug: plan.slug,
      name: plan.name,
      amountCents: plan.amountCents,
      currency: plan.currency,
      isBeta: plan.isBeta,
    },
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
  };

  /*
    Tentativa 1:
    Tabela ideal para solicitação manual.

    Se você criou uma tabela específica para pedidos de assinatura,
    esse é o modelo mais limpo. Fica separado da assinatura ativa.
  */
  const requestResult = await tryInsert("billing_subscription_requests", [
    {
      user_id: user.id,
      plan_slug: plan.slug,
      plan_name: plan.name,
      amount_cents: plan.amountCents,
      currency: plan.currency,
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      metadata,
    },
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
      metadata,
    },
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
    },
  ]);

  if (requestResult) {
    return requestResult;
  }

  /*
    Tentativa 2:
    Caso seu projeto ainda use apenas billing_subscriptions.

    A assinatura entra como pending, e depois você/admin transforma
    em active quando o pagamento for confirmado.
  */
  const planId = await findBillingPlanId(plan.slug);

  const subscriptionPayloads: Record<string, unknown>[] = [];

  if (planId) {
    subscriptionPayloads.push(
      {
        user_id: user.id,
        plan_id: planId,
        status: "pending",
        provider: "manual",
        metadata,
      },
      {
        user_id: user.id,
        plan_id: planId,
        status: "pending",
      }
    );
  }

  subscriptionPayloads.push(
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
      provider: "manual",
      metadata,
    },
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
    },
    {
      user_id: user.id,
      status: "pending",
      provider: "manual",
      metadata,
    },
    {
      user_id: user.id,
      status: "pending",
    }
  );

  const subscriptionResult = await tryInsert(
    "billing_subscriptions",
    subscriptionPayloads
  );

  if (subscriptionResult) {
    return subscriptionResult;
  }

  /*
    Tentativa 3:
    Alguns projetos usam tabela simples chamada subscriptions.
    É fallback para não morrer por causa de nome de tabela, esse
    festival de criatividade humana sem governança.
  */
  const genericSubscriptionResult = await tryInsert("subscriptions", [
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
      provider: "manual",
      metadata,
    },
    {
      user_id: user.id,
      plan_slug: plan.slug,
      status: "pending",
    },
    {
      user_id: user.id,
      status: "pending",
    },
  ]);

  if (genericSubscriptionResult) {
    return genericSubscriptionResult;
  }

  throw new Error(
    "Não foi possível registrar a solicitação de assinatura. Verifique se existe uma tabela billing_subscription_requests ou billing_subscriptions no Supabase e se as políticas RLS permitem insert para o usuário autenticado."
  );
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
    .from("billing_subscription_requests")
    .select("*")
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
