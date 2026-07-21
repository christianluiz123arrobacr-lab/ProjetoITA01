export type BatchItemResult = { id: string; ok: true } | { id: string; ok: false; error: string };

export async function processBatchIndependently(
  ids: string[],
  process: (id: string) => Promise<unknown>,
): Promise<{ outcome: "success" | "partial" | "failed"; results: BatchItemResult[] }> {
  const results = await Promise.all(ids.map(async id => {
    try {
      await process(id);
      return { id, ok: true } as const;
    } catch (error) {
      return { id, ok: false, error: sanitizeBillingError(error) } as const;
    }
  }));
  const successes = results.filter(result => result.ok).length;
  return { outcome: successes === results.length ? "success" : successes === 0 ? "failed" : "partial", results };
}

export function sanitizeBillingError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Falha desconhecida";
  return raw
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]")
    .replace(/(access[_ -]?token|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, 500);
}

export async function createCheckoutFromExclusiveSlot<T>(input: {
  reserve: () => Promise<{ shouldCreate: boolean; existing?: T }>;
  create: () => Promise<T>;
}) {
  const slot = await input.reserve();
  if (!slot.shouldCreate) return { created: false as const, checkout: slot.existing };
  return { created: true as const, checkout: await input.create() };
}
