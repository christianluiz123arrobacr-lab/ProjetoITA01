export type BillingBatchOutcome = "success" | "partial" | "failed" | "no_action";
export type BatchItemResult = { id: string; ok: true } | { id: string; ok: false; error: string };
export type BatchResult = {
  outcome: BillingBatchOutcome;
  found: number;
  processed: number;
  successes: string[];
  failures: Array<{ id: string; error: string }>;
  results: BatchItemResult[];
  noActionReason?: string;
};

export async function processBatchIndependently(
  ids: string[],
  process: (id: string) => Promise<unknown>,
  noActionReason = "Nenhum item elegível foi encontrado.",
): Promise<BatchResult> {
  if (ids.length === 0) {
    return { outcome: "no_action", found: 0, processed: 0, successes: [], failures: [], results: [], noActionReason };
  }
  const results = await Promise.all(ids.map(async id => {
    try {
      await process(id);
      return { id, ok: true } as const;
    } catch (error) {
      return { id, ok: false, error: sanitizeBillingError(error) } as const;
    }
  }));
  const successes = results.filter(result => result.ok).map(result => result.id);
  const failures = results
    .filter((result): result is { id: string; ok: false; error: string } => !result.ok)
    .map(({ id, error }) => ({ id, error }));
  return {
    outcome: failures.length === 0 ? "success" : successes.length === 0 ? "failed" : "partial",
    found: ids.length,
    processed: results.length,
    successes,
    failures,
    results,
  };
}

export function sanitizeBillingError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Falha desconhecida";
  return raw
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]")
    .replace(/(access[_ -]?token|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]")
    .slice(0, 500);
}

export type ExclusiveRecurringReservation = {
  subscriptionId: string;
  shouldCreate: boolean;
  gatewaySubscriptionId: string | null;
  checkoutUrl: string | null;
};

export async function runExclusiveRecurringCheckout<TCheckout, TResult>(input: {
  reserve: () => Promise<ExclusiveRecurringReservation>;
  create: (reservation: ExclusiveRecurringReservation) => Promise<TCheckout>;
  complete: (reservation: ExclusiveRecurringReservation, checkout: TCheckout) => Promise<TResult>;
  reuse: (reservation: ExclusiveRecurringReservation) => Promise<TResult>;
  compensate: (reservation: ExclusiveRecurringReservation, checkout: TCheckout | null, error: unknown) => Promise<void>;
}) {
  const reservation = await input.reserve();
  if (!reservation.shouldCreate) return input.reuse(reservation);
  let checkout: TCheckout | null = null;
  try {
    checkout = await input.create(reservation);
    return await input.complete(reservation, checkout);
  } catch (error) {
    await input.compensate(reservation, checkout, error);
    throw error;
  }
}

export const SUPPORTED_RECONCILIATION_STATUSES = new Set([
  "duplicate_gateway_preapproval",
  "duplicate_open_preapproval",
  "admin_cancel_gateway_failed",
  "user_cancel_gateway_failed",
  "reconciliation_cancel_gateway_failed",
  "gateway_created_local_failed",
]);

export function isBlockingRecurringReconciliation(record: {
  recurring_state?: string | null;
  gateway_reconciliation_status?: string | null;
}) {
  return record.recurring_state === "reconciliation_required" || Boolean(record.gateway_reconciliation_status);
}

export async function runClaimedBillingWebhook(input: {
  dispatch: () => Promise<unknown>;
  markProcessed: () => Promise<void>;
  markFailed: (message: string) => Promise<void>;
}) {
  try {
    const result = await input.dispatch();
    await input.markProcessed();
    return { ok: true as const, status: 200 as const, result };
  } catch (error) {
    const processingError = sanitizeBillingError(error);
    await input.markFailed(processingError);
    return { ok: false as const, status: 500 as const, processingError };
  }
}
