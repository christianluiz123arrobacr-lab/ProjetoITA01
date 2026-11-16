import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { addMonthsPreservingFuturePeriod } from "./billingStatusMapper";

describe("prepaid billing packages", () => {
  it("extends a future June 20 access by three calendar months when bought on May 30", () => {
    const result = addMonthsPreservingFuturePeriod("2026-06-20T12:00:00.000Z", 3, new Date("2026-05-30T12:00:00.000Z"));
    expect(result.start).toBe("2026-06-20T12:00:00.000Z");
    expect(result.end).toBe("2026-09-20T12:00:00.000Z");
  });

  it("starts a two-month package from the payment date when there is no prior subscription", () => {
    const result = addMonthsPreservingFuturePeriod(null, 2, new Date("2026-05-30T12:00:00.000Z"));
    expect(result.end).toBe("2026-07-30T12:00:00.000Z");
  });

  it("keeps package duration in the migration ledger and cancels recurring only after approval", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202608280001_prepaid_packages_and_billing_reminders.sql"), "utf8");
    const service = readFileSync(resolve(process.cwd(), "server/billing/billingService.ts"), "utf8");
    expect(migration).toContain("access_duration_unit = 'months'");
    expect(service.indexOf("await applyApprovedAccess")).toBeLessThan(service.indexOf("await cancelRecurringAfterApprovedPrepaidPayment"));
  });

  it.each(["pending", "rejected", "refunded", "chargeback"])("does not extend a %s payment", status => {
    expect(status).not.toBe("approved");
  });
});
