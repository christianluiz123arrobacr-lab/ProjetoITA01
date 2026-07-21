import { describe, expect, it, vi } from "vitest";
import { createCheckoutFromExclusiveSlot, processBatchIndependently, sanitizeBillingError } from "./billingOrchestration";

describe("billing orchestration", () => {
  it("processa todos os pagamentos do chargeback e informa sucesso parcial", async () => {
    const process = vi.fn(async (id: string) => {
      if (id === "404") throw new Error("payment not found");
    });
    const result = await processBatchIndependently(["1", "404", "2"], process);
    expect(process).toHaveBeenCalledTimes(3);
    expect(result.outcome).toBe("partial");
    expect(result.results).toEqual([
      { id: "1", ok: true },
      { id: "404", ok: false, error: "payment not found" },
      { id: "2", ok: true },
    ]);
  });

  it("informa falha total e sucesso total", async () => {
    expect((await processBatchIndependently(["1"], async () => undefined)).outcome).toBe("success");
    expect((await processBatchIndependently(["1"], async () => { throw new Error("fail"); })).outcome).toBe("failed");
  });

  it("remove credenciais de erros financeiros", () => {
    expect(sanitizeBillingError(new Error("Authorization: Bearer APP_USR-secret"))).not.toContain("APP_USR-secret");
  });

  it("duas criações concorrentes usam um único slot e chamam o gateway uma vez", async () => {
    let ownerChosen = false;
    let checkout: { id: string } | undefined;
    const reserve = vi.fn(async () => {
      if (!ownerChosen) {
        ownerChosen = true;
        return { shouldCreate: true };
      }
      while (!checkout) await new Promise(resolve => setTimeout(resolve, 1));
      return { shouldCreate: false, existing: checkout };
    });
    const create = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      checkout = { id: "preapproval-1" };
      return checkout;
    });
    const [first, second] = await Promise.all([
      createCheckoutFromExclusiveSlot({ reserve, create }),
      createCheckoutFromExclusiveSlot({ reserve, create }),
    ]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(first.checkout).toEqual({ id: "preapproval-1" });
    expect(second.checkout).toEqual({ id: "preapproval-1" });
  });
});
