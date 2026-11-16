import { describe, expect, it } from "vitest";
import {
  affiliatePrice,
  affiliateCouponSchema,
  affiliatePayoutSchema,
} from "../../shared/affiliates";
describe("affiliate monetary rules", () => {
  it("calculates 95 reais minus 5% and commission rounded half up", () =>
    expect(affiliatePrice(9500, 500, 1000)).toEqual({
      discountCents: 475,
      paidCents: 9025,
      commissionCents: 903,
    }));
  it("rounds a single commission for the whole multi-month charge", () =>
    expect(affiliatePrice(6783, 500, 1000)).toEqual({
      discountCents: 339,
      paidCents: 6444,
      commissionCents: 644,
    }));
  it("does not create a zero-value payment through rounding", () =>
    expect(() => affiliatePrice(1, 9900, 1000)).toThrow());
  it.each([
    [1.5, 500, 1000],
    [100, 10000, 1000],
    [100, 500, 10001],
  ])("rejects unsafe monetary inputs", (a, b, c) =>
    expect(() => affiliatePrice(a, b, c)).toThrow()
  );
  it("normalizes coupon codes and rejects untrusted financial properties", () => {
    const c = {
      affiliateId: "11111111-1111-4111-8111-111111111111",
      code: "  my-code ",
      active: false,
      discountBps: 500,
      commissionBps: 1000,
      startsAt: null,
      expiresAt: null,
      maxUses: null,
      planIds: null,
    };
    expect(affiliateCouponSchema.parse(c).code).toBe("MY-CODE");
    expect(
      affiliateCouponSchema.safeParse({ ...c, totalCents: 1 }).success
    ).toBe(false);
    expect(
      affiliatePayoutSchema.safeParse({
        affiliateId: c.affiliateId,
        requestKey: c.affiliateId,
        amountCents: -1,
        paidOn: "2026-10-29",
        reference: "Test",
      }).success
    ).toBe(false);
  });
});
