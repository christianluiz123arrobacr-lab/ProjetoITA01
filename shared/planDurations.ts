import { z } from "zod";
import { couponCodeSchema } from "./affiliates.js";

export const PLAN_MONTHS = [1, 2, 3, 6, 12] as const;
export const planMonthsSchema = z.union(PLAN_MONTHS.map(value => z.literal(value)));
export const prepaidCheckoutSchema = z.object({
  planSlug: z.string().min(1).max(120), durationMonths: planMonthsSchema,
  paymentMethod: z.enum(["card", "pix"]), attemptKey: z.string().uuid(),
  couponCode: couponCodeSchema.optional(),
}).strict();
export const durationConfigSchema = z.object({
  planId: z.string().uuid(),
  months: planMonthsSchema,
  enabled: z.boolean(),
  discountBps: z.number().int().min(0).max(9900),
  expectedRevision: z.number().int().min(0),
}).strict();

// Half up, once on the package total. 100 basis points = 1%.
export function calculateDurationPrice(baseCents: number, months: number, discountBps: number) {
  if (!Number.isSafeInteger(baseCents) || baseCents < 1 || baseCents > 2147483647
      || !PLAN_MONTHS.includes(months as typeof PLAN_MONTHS[number])
      || !Number.isInteger(discountBps) || discountBps < 0 || discountBps > 9900) {
    throw new Error("Preço ou duração inválidos.");
  }
  const subtotalCents = baseCents * months;
  const discountCents = Math.floor((subtotalCents * discountBps + 5000) / 10000);
  const totalCents = subtotalCents - discountCents;
  if (totalCents > 2147483647) throw new Error("Valor do pacote excede o limite financeiro.");
  return { baseCents, months, discountBps, subtotalCents, discountCents, totalCents, rounding: "half_up_package_total" as const };
}
