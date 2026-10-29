import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../_core/context.js", () => ({
  ensureAuthentication: vi.fn(),
  assertAuthenticationAvailable: vi.fn(),
}));
vi.mock("../_core/supabaseAdmin.js", () => ({
  supabaseAdmin: { rpc: mocks.rpc },
}));
import { affiliatesRouter } from "./affiliates";
const id = "11111111-1111-4111-8111-111111111111";
const caller = (role: string | null) =>
  affiliatesRouter.createCaller({ user: role ? { id, role } : null } as any);
beforeEach(() => vi.resetAllMocks());
describe("affiliate API authorization", () => {
  it.each(["student", "editor", null])(
    "blocks %s from every financial mutation",
    async role => {
      const api = caller(role);
      const tasks = [
        () => api.saveProfile({ userId: id, label: "Test", active: true }),
        () =>
          api.saveCoupon({
            affiliateId: id,
            code: "TEST",
            active: false,
            discountBps: 500,
            commissionBps: 1000,
            startsAt: null,
            expiresAt: null,
            maxUses: null,
            planIds: null,
          }),
        () => api.saveSettings({ payoutDay: 10 }),
        () => api.release({ paymentId: id }),
        () =>
          api.payout({
            affiliateId: id,
            requestKey: id,
            amountCents: 100,
            paidOn: "2026-10-29",
            reference: "synthetic",
          }),
      ];
      for (const task of tasks)
        await expect(task()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  );
  it("uses server identity for panel ownership and delegates subject restrictions to SQL", async () => {
    mocks.rpc.mockResolvedValue({ data: {}, error: null });
    await caller("student").dashboard({
      from: "2026-10-01",
      until: "2026-11-01",
      page: 0,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "affiliate_dashboard",
      expect.objectContaining({ p_actor: id, p_subject: null })
    );
  });
  it("returns authorization errors from SQL without leaking internal data", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "secret internal text" },
    });
    await expect(
      caller("editor").dashboard({
        subjectUserId: id,
        from: "2026-10-01",
        until: "2026-11-01",
        page: 0,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Acesso não autorizado.",
    });
  });
  it("fails on a database error instead of confirming an uncertain payout", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "08006" } });
    await expect(
      caller("admin").payout({
        affiliateId: id,
        requestKey: id,
        amountCents: 100,
        paidOn: "2026-10-29",
        reference: "synthetic",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("does not confirm a payout with an empty successful SDK response", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    await expect(
      caller("admin").payout({
        affiliateId: id,
        requestKey: id,
        amountCents: 100,
        paidOn: "2026-10-29",
        reference: "synthetic",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});
