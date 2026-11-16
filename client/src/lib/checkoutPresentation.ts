export function showPlanForCheckout(plan: {requiresLegacyFounderEligibility: boolean;legacyFounderEligible: boolean;hasValidInvite: boolean}, authenticated: boolean, resolving: boolean) {
  return !plan.requiresLegacyFounderEligibility || (!resolving && authenticated && (plan.legacyFounderEligible || plan.hasValidInvite));
}

export function selectCurrentOffer<T extends {months:number}>(rows: T[] | undefined, selected: number | null, unavailable: boolean): T | undefined {
  if (unavailable) return undefined;
  return selected === null ? rows?.[0] : rows?.find(row=>row.months===selected);
}
