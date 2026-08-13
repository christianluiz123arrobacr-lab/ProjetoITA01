import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";

export const LEGACY_FOUNDER_ENTITLEMENT = "legacy_founder_eligible";
export const LEGACY_FOUNDER_SLUG = "legacy-founder";
export const NORMAL_PLAN_SLUG = "normal";

export type CheckoutPlanPolicy = {
  slug: string;
  is_active?: boolean | null;
  is_public?: boolean | null;
  requires_legacy_founder_eligibility?: boolean | null;
};

export function isRetiredBetaFounderSlug(slug: string) {
  return [
    "beta-selecionado-5", "selecionados_5", "selecionado", "selecionados", "beta_selecionado",
    "beta-fundador-8", "fundador_8", "fundador", "beta_fundador",
  ].includes(slug.trim().toLowerCase());
}

export function isSamePlanFamily(publicSlug: string, activeSlug: string | null | undefined) {
  if (!activeSlug) return false;
  if (publicSlug === activeSlug) return true;
  if (publicSlug === LEGACY_FOUNDER_SLUG) return isRetiredBetaFounderSlug(activeSlug);
  if (publicSlug === NORMAL_PLAN_SLUG) return ["mensal-1099", "normal_1099", "mensal", "normal", "plano_mensal"].includes(activeSlug.toLowerCase());
  return false;
}

export function assertLegacyPlanCheckoutAllowed(plan: CheckoutPlanPolicy, eligible: boolean) {
  if (isRetiredBetaFounderSlug(plan.slug)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "O antigo Plano Beta Fundador não está mais disponível." });
  }
  if (plan.is_active === false || plan.is_public === false) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado ou inativo." });
  }
  if (plan.requires_legacy_founder_eligibility && !eligible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Exclusivo para alunos fundadores que já participaram da plataforma.",
    });
  }
}

export async function hasLegacyFounderEligibility(userId: string | null | undefined) {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin
    .from("billing_user_entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("entitlement_key", LEGACY_FOUNDER_ENTITLEMENT)
    .limit(1)
    .maybeSingle();
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível verificar a elegibilidade do plano." });
  return Boolean(data?.id);
}

export async function assertUserCanCheckoutPlan(userId: string, plan: CheckoutPlanPolicy) {
  const eligible = plan.requires_legacy_founder_eligibility
    ? await hasLegacyFounderEligibility(userId)
    : false;
  assertLegacyPlanCheckoutAllowed(plan, eligible);
  return { legacyFounderEligible: eligible };
}

export function publicPlanAvailability(plan: CheckoutPlanPolicy, eligible: boolean, isCurrentPlan: boolean, hasActiveSubscription = isCurrentPlan) {
  const founderBlocked = Boolean(plan.requires_legacy_founder_eligibility) && !eligible;
  return {
    requires_legacy_founder_eligibility: Boolean(plan.requires_legacy_founder_eligibility),
    legacy_founder_eligible: Boolean(plan.requires_legacy_founder_eligibility && eligible),
    is_current_plan: isCurrentPlan,
    can_checkout: Boolean(plan.is_active !== false && plan.is_public !== false && !founderBlocked && !hasActiveSubscription),
    checkout_block_reason: hasActiveSubscription ? "active_subscription" : founderBlocked ? "legacy_founder_required" : null,
  };
}
