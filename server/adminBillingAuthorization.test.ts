import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

describe("admin.reconcileMercadoPagoPayment", () => {
  it("recusa a reconciliação para usuário comum antes de consultar o pagamento", async () => {
    const ctx = {
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        openId: "student",
        email: "student@example.test",
        name: "Student",
        loginMethod: "supabase",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {}, protocol: "https" },
      res: {},
    } as unknown as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.reconcileMercadoPagoPayment({
      billingPaymentId: "22222222-2222-4222-8222-222222222222",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
