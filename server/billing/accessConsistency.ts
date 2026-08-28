export type BillingAccessSubscription = {
  id: string;
  user_id: string;
  status: string | null;
  current_period_end: string | null;
  updated_at: string | null;
  created_at: string | null;
  canonical_access_subscription_id?: string | null;
};

export type BillingAccessPayment = {
  user_id: string;
  status: string | null;
  access_applied_at: string | null;
  subscription_id?: string | null;
  original_subscription_id?: string | null;
  applied_to_subscription_id?: string | null;
};

export type EffectiveBillingAccess = {
  subscriptionId: string | null;
  hasValidAccess: boolean;
  receivesApprovedPayment: boolean;
};

const accessStatuses = new Set(["active", "trialing"]);
const approvedStatus = "approved";

function timestamp(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function hasValidBillingAccess(subscription: BillingAccessSubscription, now = new Date()) {
  if (!accessStatuses.has(subscription.status ?? "")) return false;
  return !subscription.current_period_end || timestamp(subscription.current_period_end, Number.NEGATIVE_INFINITY) >= now.getTime();
}

/**
 * Chooses the only record that represents a student's access. Payments are
 * considered only after the Mercado Pago ledger has applied them, so local
 * pending/rejected/refunded/chargeback records can never grant access here.
 */
export function resolveEffectiveBillingAccess(
  subscriptions: BillingAccessSubscription[],
  payments: BillingAccessPayment[],
  now = new Date(),
) {
  const appliedPaymentTargets = new Set(
    payments
      .filter(payment => payment.status === approvedStatus && Boolean(payment.access_applied_at) && Boolean(payment.applied_to_subscription_id))
      .map(payment => String(payment.applied_to_subscription_id)),
  );
  const byUser = new Map<string, BillingAccessSubscription[]>();
  for (const subscription of subscriptions) {
    const rows = byUser.get(subscription.user_id) ?? [];
    rows.push(subscription);
    byUser.set(subscription.user_id, rows);
  }

  const effectiveByUser = new Map<string, EffectiveBillingAccess>();
  for (const [userId, rows] of byUser) {
    const ordered = [...rows].sort((left, right) => {
      const leftValid = hasValidBillingAccess(left, now);
      const rightValid = hasValidBillingAccess(right, now);
      if (leftValid !== rightValid) return leftValid ? -1 : 1;

      const leftPaid = appliedPaymentTargets.has(left.id);
      const rightPaid = appliedPaymentTargets.has(right.id);
      if (leftPaid !== rightPaid) return leftPaid ? -1 : 1;

      const leftCanonical = left.canonical_access_subscription_id === left.id;
      const rightCanonical = right.canonical_access_subscription_id === right.id;
      if (leftCanonical !== rightCanonical) return leftCanonical ? -1 : 1;

      const byEnd = timestamp(right.current_period_end, Number.POSITIVE_INFINITY) - timestamp(left.current_period_end, Number.POSITIVE_INFINITY);
      if (byEnd) return byEnd;
      const byUpdated = timestamp(right.updated_at, Number.NEGATIVE_INFINITY) - timestamp(left.updated_at, Number.NEGATIVE_INFINITY);
      if (byUpdated) return byUpdated;
      const byCreated = timestamp(right.created_at, Number.NEGATIVE_INFINITY) - timestamp(left.created_at, Number.NEGATIVE_INFINITY);
      if (byCreated) return byCreated;
      return left.id.localeCompare(right.id);
    });
    const selected = ordered[0];
    effectiveByUser.set(userId, selected
      ? {
          subscriptionId: selected.id,
          hasValidAccess: hasValidBillingAccess(selected, now),
          receivesApprovedPayment: appliedPaymentTargets.has(selected.id),
        }
      : { subscriptionId: null, hasValidAccess: false, receivesApprovedPayment: false });
  }

  return { effectiveByUser, appliedPaymentTargets };
}

export function buildBillingConsistencyReport(
  subscriptions: BillingAccessSubscription[],
  payments: BillingAccessPayment[],
  now = new Date(),
) {
  const { effectiveByUser } = resolveEffectiveBillingAccess(subscriptions, payments, now);
  const activeLike = subscriptions.filter(item => accessStatuses.has(item.status ?? ""));
  const byUser = new Map<string, BillingAccessSubscription[]>();
  for (const subscription of subscriptions) {
    const rows = byUser.get(subscription.user_id) ?? [];
    rows.push(subscription);
    byUser.set(subscription.user_id, rows);
  }

  const latestCreatedByUser = new Map<string, string>();
  for (const [userId, rows] of byUser) {
    const latest = [...rows].sort((a, b) => timestamp(b.created_at, Number.NEGATIVE_INFINITY) - timestamp(a.created_at, Number.NEGATIVE_INFINITY))[0];
    if (latest) latestCreatedByUser.set(userId, latest.id);
  }

  const effectiveSubscriptionIds = new Set([...effectiveByUser.values()].map(item => item.subscriptionId).filter(Boolean));
  return {
    totalStudentsWithEffectiveAccess: [...effectiveByUser.values()].filter(item => item.hasValidAccess).length,
    totalActiveOrTrialingRecords: activeLike.length,
    historicalRecords: subscriptions.filter(item => effectiveSubscriptionIds.has(item.id) === false).length,
    usersWithMultipleActiveOrTrialingRecords: [...byUser.entries()]
      .filter(([, rows]) => rows.filter(item => accessStatuses.has(item.status ?? "")).length > 1)
      .map(([userId]) => userId),
    usersWithDisplayedSubscriptionDivergingFromEffective: [...effectiveByUser.entries()]
      .filter(([userId, effective]) => effective.subscriptionId && latestCreatedByUser.get(userId) !== effective.subscriptionId)
      .map(([userId]) => userId),
    approvedPaymentsWithoutAccessApplied: payments
      .filter(payment => payment.status === approvedStatus && !payment.access_applied_at)
      .map(payment => ({ userId: payment.user_id, subscriptionId: payment.subscription_id ?? null, originalSubscriptionId: payment.original_subscription_id ?? null })),
    approvedPaymentsAppliedToDifferentEffectiveSubscription: payments
      .filter(payment => payment.status === approvedStatus && Boolean(payment.access_applied_at) && Boolean(payment.applied_to_subscription_id))
      .filter(payment => effectiveByUser.get(payment.user_id)?.subscriptionId !== payment.applied_to_subscription_id)
      .map(payment => ({ userId: payment.user_id, appliedToSubscriptionId: payment.applied_to_subscription_id ?? null, effectiveSubscriptionId: effectiveByUser.get(payment.user_id)?.subscriptionId ?? null })),
    staleActiveRecords: activeLike.filter(subscription => !hasValidBillingAccess(subscription, now)).map(subscription => subscription.id),
  };
}
