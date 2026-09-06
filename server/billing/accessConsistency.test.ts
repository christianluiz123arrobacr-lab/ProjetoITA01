import { describe, expect, it } from "vitest";
import { buildBillingConsistencyReport, resolveEffectiveBillingAccess } from "./accessConsistency";

const now = new Date("2026-08-28T12:00:00.000Z");
const base = { user_id: "student-1", status: "active", updated_at: "2026-08-20T00:00:00.000Z", created_at: "2026-08-01T00:00:00.000Z" };

describe("billing access consistency", () => {
  it("counts one student when historical and canonical subscriptions coexist", () => {
    const subscriptions = [
      { ...base, id: "historic", status: "expired", current_period_end: "2026-08-01T00:00:00.000Z" },
      { ...base, id: "canonical", current_period_end: "2026-09-28T00:00:00.000Z", canonical_access_subscription_id: "canonical" },
    ];
    const payments = [{ user_id: "student-1", status: "approved", access_applied_at: "2026-08-28T00:00:00.000Z", applied_to_subscription_id: "canonical" }];
    const report = buildBillingConsistencyReport(subscriptions, payments, now);
    expect(report.totalStudentsWithEffectiveAccess).toBe(1);
    expect(report.historicalRecords).toBe(1);
  });

  it("does not grant access to an active record with an expired period", () => {
    const resolved = resolveEffectiveBillingAccess([{ ...base, id: "expired-active", current_period_end: "2026-08-27T23:59:59.000Z" }], [], now);
    expect(resolved.effectiveByUser.get("student-1")?.hasValidAccess).toBe(false);
  });

  it("selects the canonical target of an applied approved payment instead of historical subscription", () => {
    const subscriptions = [
      { ...base, id: "old", current_period_end: "2026-08-29T00:00:00.000Z", created_at: "2026-08-27T00:00:00.000Z" },
      { ...base, id: "canonical", current_period_end: "2026-09-28T00:00:00.000Z", canonical_access_subscription_id: "canonical" },
    ];
    const resolved = resolveEffectiveBillingAccess(subscriptions, [{ user_id: "student-1", status: "approved", access_applied_at: "2026-08-28T00:00:00.000Z", applied_to_subscription_id: "canonical" }], now);
    expect(resolved.effectiveByUser.get("student-1")?.subscriptionId).toBe("canonical");
  });

  it.each(["pending", "rejected", "refunded", "chargeback"])("never grants access from a %s payment", status => {
    const resolved = resolveEffectiveBillingAccess([{ ...base, id: "subscription", status: "pending", current_period_end: "2026-09-28T00:00:00.000Z" }], [{ user_id: "student-1", status, access_applied_at: "2026-08-28T00:00:00.000Z", applied_to_subscription_id: "subscription" }], now);
    expect(resolved.effectiveByUser.get("student-1")?.hasValidAccess).toBe(false);
  });
});
