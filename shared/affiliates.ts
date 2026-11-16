import { z } from "zod";
export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{2,31}$/);
export const affiliateProfileSchema = z
  .object({
    userId: z.string().uuid(),
    label: z.string().trim().min(1).max(100),
    active: z.boolean(),
  })
  .strict();
export const affiliateCouponSchema = z
  .object({
    id: z.string().uuid().optional(),
    affiliateId: z.string().uuid(),
    code: couponCodeSchema,
    active: z.boolean(),
    discountBps: z.number().int().min(0).max(9900),
    commissionBps: z.number().int().min(0).max(10000),
    startsAt: z.string().datetime().nullable(),
    expiresAt: z.string().datetime().nullable(),
    maxUses: z.number().int().min(1).max(100000000).nullable(),
    planIds: z.array(z.string().uuid()).max(100).nullable(),
  })
  .strict()
  .refine(v => !v.startsAt || !v.expiresAt || v.startsAt < v.expiresAt, {
    message: "Validade inválida",
  });
export const affiliatePayoutSchema = z
  .object({
    affiliateId: z.string().uuid(),
    requestKey: z.string().uuid(),
    amountCents: z.number().int().min(1).max(2147483647),
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reference: z.string().trim().min(1).max(160),
  })
  .strict();
export function affiliatePrice(
  afterDurationCents: number,
  discountBps: number,
  commissionBps: number
) {
  if (
    !Number.isInteger(afterDurationCents) ||
    afterDurationCents < 1 ||
    afterDurationCents > 2147483647 ||
    !Number.isInteger(discountBps) ||
    discountBps < 0 ||
    discountBps > 9900 ||
    !Number.isInteger(commissionBps) ||
    commissionBps < 0 ||
    commissionBps > 10000
  )
    throw Error("Valores inválidos");
  const discountCents = Math.floor(
    (afterDurationCents * discountBps + 5000) / 10000
  );
  const paidCents = afterDurationCents - discountCents;
  if (paidCents < 1) throw Error("O valor pago deve ser positivo");
  return {
    discountCents,
    paidCents,
    commissionCents: Math.floor((paidCents * commissionBps + 5000) / 10000),
  };
}
