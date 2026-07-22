import { beforeEach, describe, expect, it, vi } from "vitest";
import { isBlockingRecurringReconciliation, processBatchIndependently, runClaimedBillingWebhook, sanitizeBillingError } from "./billingOrchestration";
import {
  cancelRelatedPreapprovals,
  executeReservedCardCheckout,
  mapMercadoPagoCardCheckoutError,
  processChargebackUpdate,
  reconcileRecurringRecords,
} from "./billingService";
import { MercadoPagoHttpError } from "./mercadoPagoClient";

const plan = { id: "plan-1", slug: "mensal", name: "Mensal", price_cents: 1000, currency: "BRL" };
const baseOrigin = {
  id: "subscription-1",
  user_id: "user-1",
  plan_id: "plan-1",
  status: "expired",
  gateway: "mercadopago",
  gateway_subscription_id: "preapproval-1",
  recurring_state: "reconciliation_required",
  recurring_slot_active: false,
  canonical_access_subscription_id: "canonical-1",
  gateway_reconciliation_attempts: 0,
  metadata: { payment_method: "card" },
};

function cancellationDependencies(overrides: Record<string, unknown> = {}) {
  const canceled: Record<string, boolean> = {};
  const defaults = {
    get: vi.fn(async (id: string) => ({ id, status: canceled[id] ? "canceled" : "authorized" })),
    cancel: vi.fn(async (id: string) => { canceled[id] = true; return { id, status: "canceled" }; }),
    update: vi.fn().mockResolvedValue(undefined),
    isNotFound: vi.fn().mockReturnValue(false),
    now: vi.fn().mockReturnValue("2026-07-21T00:00:00.000Z"),
  };
  return { ...defaults, ...overrides } as any;
}

describe("produção de billing orchestration", () => {
  beforeEach(() => {
    process.env.APP_BASE_URL = "https://example.test";
  });

  it("lista vazia retorna no_action com contadores explícitos", async () => {
    await expect(processBatchIndependently([], vi.fn(), "Nada pendente")).resolves.toMatchObject({
      outcome: "no_action", found: 0, processed: 0, successes: [], failures: [], noActionReason: "Nada pendente",
    });
  });

  it("duas chamadas no fluxo de produção criam exatamente uma preapproval e retornam o mesmo checkout", async () => {
    let slotClaimed = false;
    let finish!: (value: any) => void;
    const completed = new Promise(resolve => { finish = resolve; });
    const reserve = vi.fn(async () => {
      if (!slotClaimed) {
        slotClaimed = true;
        return { subscriptionId: "subscription-1", shouldCreate: true, gatewaySubscriptionId: null, checkoutUrl: null };
      }
      return { subscriptionId: "subscription-1", shouldCreate: false, gatewaySubscriptionId: null, checkoutUrl: null };
    });
    const createPreapprovalCheckout = vi.fn(async () => ({ id: "preapproval-1", status: "pending", init_point: "https://checkout.test/1" }));
    const dependencies = {
      reserve,
      create: createPreapprovalCheckout,
      owner: vi.fn().mockReturnValue("00000000-0000-4000-8000-000000000001"),
      complete: vi.fn(async ({ reservation, checkout }: any) => finish({
        subscriptionId: reservation.subscriptionId, status: "pending", checkoutUrl: checkout.init_point,
        paymentUrl: checkout.init_point, gateway: "mercadopago", paymentMethod: "mercadopago_card",
      })),
      reuse: vi.fn(async () => completed as any),
      compensate: vi.fn(),
    } as any;

    const [first, second] = await Promise.all([
      executeReservedCardCheckout({ userId: "user-1", payerEmail: "buyer@example.test", plan }, dependencies),
      executeReservedCardCheckout({ userId: "user-1", payerEmail: "buyer@example.test", plan }, dependencies),
    ]);

    expect(createPreapprovalCheckout).toHaveBeenCalledTimes(1);
    expect(reserve).toHaveBeenCalledTimes(2);
    expect(first.subscriptionId).toBe("subscription-1");
    expect(second).toEqual(first);
  });

  it("falha na primeira criação executa a compensação da reserva", async () => {
    const compensate = vi.fn();
    await expect(executeReservedCardCheckout({ userId: "user-1", payerEmail: "buyer@example.test", plan }, {
      reserve: vi.fn().mockResolvedValue({ subscriptionId: "subscription-1", shouldCreate: true, gatewaySubscriptionId: null, checkoutUrl: null }),
      create: vi.fn().mockRejectedValue(new Error("gateway unavailable")),
      owner: vi.fn().mockReturnValue("owner"), complete: vi.fn(), reuse: vi.fn(), compensate,
    } as any)).rejects.toThrow("gateway unavailable");
    expect(compensate).toHaveBeenCalledTimes(1);
  });

  it("usa o mesmo e-mail validado na reserva local e no Mercado Pago", async () => {
    const reserve = vi.fn().mockResolvedValue({
      subscriptionId: "subscription-1", shouldCreate: true, gatewaySubscriptionId: null, checkoutUrl: null,
    });
    const create = vi.fn().mockResolvedValue({ id: "preapproval-1", status: "pending", init_point: "https://checkout.test/1" });
    await executeReservedCardCheckout({
      userId: "user-1",
      payerEmail: "account@example.com",
      plan,
    }, {
      reserve,
      create,
      owner: vi.fn().mockReturnValue("owner"),
      complete: vi.fn(),
      reuse: vi.fn(),
      compensate: vi.fn(),
    } as any);

    expect(reserve).toHaveBeenCalledWith(expect.objectContaining({ userEmail: "account@example.com" }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ payerEmail: "account@example.com" }));
  });

  it("em produção mantém a mensagem genérica para a mesma recusa", () => {
    const logger = vi.fn();
    const mapped = mapMercadoPagoCardCheckoutError(
      new MercadoPagoHttpError(400, "payer buyer@example.com rejected Authorization: Bearer secret-token"),
      { subscriptionId: "subscription-1", planSlug: "mensal" },
      logger,
    );
    expect(mapped.message).toBe("O Mercado Pago recusou a criação da assinatura. Tente novamente mais tarde.");
    expect(mapped.message).not.toContain("HTTP 400");
    expect(mapped.message).not.toContain("buyer@example.com");
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({
      event: "mercadopago_card_checkout_failed",
      error_name: "MercadoPagoHttpError",
      mercado_pago_http_status: 400,
      subscription_id: "subscription-1",
      plan_slug: "mensal",
    }));
    const logged = JSON.stringify(logger.mock.calls[0]);
    expect(logged).not.toContain("buyer@example.com");
    expect(logged).not.toContain("secret-token");
  });

  it("mapeia falha de autenticação sem registrar credenciais", () => {
    const logger = vi.fn();
    const mapped = mapMercadoPagoCardCheckoutError(
      new MercadoPagoHttpError(401, "invalid access_token=top-secret"),
      { subscriptionId: null, planSlug: "mensal" },
      logger,
    );
    expect(mapped.message).toBe("Não foi possível autenticar a integração de pagamentos. Verifique as credenciais do Mercado Pago.");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("top-secret");
  });

  it("usa mensagem genérica para falhas internas desconhecidas", () => {
    const mapped = mapMercadoPagoCardCheckoutError(
      new Error("database details"),
      { subscriptionId: null, planSlug: "mensal" },
      vi.fn(),
    );
    expect(mapped).toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível iniciar a assinatura." });
  });

  it("cancela duas preapprovals e limpa reconciliação somente após confirmação", async () => {
    const deps = cancellationDependencies();
    const result = await cancelRelatedPreapprovals([
      baseOrigin,
      { ...baseOrigin, id: "subscription-2", gateway_subscription_id: "preapproval-2" },
    ] as any, "admin", deps);
    expect(result).toMatchObject({ outcome: "success", found: 2, processed: 2 });
    expect(deps.cancel).toHaveBeenCalledTimes(2);
    expect(deps.update).toHaveBeenCalledWith("subscription-1", expect.objectContaining({
      gateway_reconciliation_status: null, gateway_reconciliation_error: null,
    }));
  });

  it("continua após primeira falha e retorna resultado parcial", async () => {
    const canceled: Record<string, boolean> = {};
    const cancel = vi.fn(async (id: string) => {
      if (id === "preapproval-1") throw new Error("temporary");
      canceled[id] = true;
    });
    const deps = cancellationDependencies({
      cancel,
      get: vi.fn(async (id: string) => ({ id, status: canceled[id] ? "canceled" : "authorized" })),
    });
    const result = await cancelRelatedPreapprovals([
      baseOrigin,
      { ...baseOrigin, id: "subscription-2", gateway_subscription_id: "preapproval-2" },
    ] as any, "user", deps);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(result.outcome).toBe("partial");
    expect(result.failures).toHaveLength(1);
    expect(deps.update).toHaveBeenCalledWith("subscription-1", expect.objectContaining({
      gateway_reconciliation_attempts: 1,
      gateway_reconciliation_last_attempt_at: "2026-07-21T00:00:00.000Z",
    }));
  });

  it("404 confirma estado terminal e libera o bloqueio", async () => {
    const notFound = new Error("404");
    const updates: Record<string, any> = {};
    const deps = cancellationDependencies({
      get: vi.fn().mockRejectedValue(notFound),
      isNotFound: vi.fn(error => error === notFound),
      update: vi.fn(async (_id: string, patch: any) => Object.assign(updates, patch)),
    });
    const result = await cancelRelatedPreapprovals([baseOrigin] as any, "user", deps);
    expect(result.outcome).toBe("success");
    expect(updates).toMatchObject({ recurring_state: "canceled", gateway_reconciliation_status: null });
    expect(isBlockingRecurringReconciliation(updates)).toBe(false);
  });

  it.each([
    { recurring_state: "reconciliation_required", gateway_reconciliation_status: "user_cancel_gateway_failed" },
    { recurring_state: "reconciliation_required", gateway_reconciliation_status: "gateway_created_local_failed" },
    { recurring_state: "reconciliation_required", gateway_reconciliation_status: "duplicate_gateway_preapproval" },
  ])("reconciliação pendente bloqueia novo checkout: $gateway_reconciliation_status", record => {
    expect(isBlockingRecurringReconciliation(record)).toBe(true);
    expect(isBlockingRecurringReconciliation({ recurring_state: "canceled", gateway_reconciliation_status: null })).toBe(false);
  });

  it.each(["admin_cancel_gateway_failed", "user_cancel_gateway_failed", "reconciliation_cancel_gateway_failed", "gateway_created_local_failed"])(
    "repete e conclui reconciliação %s",
    async status => {
      const deps = cancellationDependencies();
      const result = await reconcileRecurringRecords([{ ...baseOrigin, gateway_reconciliation_status: status }] as any, "none", deps);
      expect(result.outcome).toBe("success");
      expect(deps.get).toHaveBeenCalled();
      expect(deps.cancel).toHaveBeenCalledOnce();
    },
  );

  it("não cancela a assinatura canônica marcada como duplicata", async () => {
    const deps = cancellationDependencies();
    const result = await reconcileRecurringRecords([{ ...baseOrigin, id: "canonical-1", gateway_reconciliation_status: "duplicate_gateway_preapproval" }] as any, "none", deps);
    expect(result.outcome).toBe("failed");
    expect(deps.cancel).not.toHaveBeenCalled();
  });

  it("reconcilia duplicata antiga sem canonical ID quando ela não é o slot principal", async () => {
    const deps = cancellationDependencies();
    const result = await reconcileRecurringRecords([{
      ...baseOrigin,
      canonical_access_subscription_id: null,
      recurring_slot_active: false,
      gateway_reconciliation_status: "duplicate_gateway_preapproval",
    }] as any, "none", deps);
    expect(result.outcome).toBe("success");
    expect(deps.cancel).toHaveBeenCalledOnce();
  });

  it("não cancela duplicata antiga sem canonical ID quando ela ainda é o slot principal", async () => {
    const deps = cancellationDependencies();
    const result = await reconcileRecurringRecords([{
      ...baseOrigin,
      canonical_access_subscription_id: null,
      recurring_slot_active: true,
      gateway_reconciliation_status: "duplicate_gateway_preapproval",
    }] as any, "none", deps);
    expect(result.outcome).toBe("failed");
    expect(deps.cancel).not.toHaveBeenCalled();
  });

  it("status desconhecido falha com segurança e incrementa auditoria", async () => {
    const deps = cancellationDependencies();
    const result = await reconcileRecurringRecords([{ ...baseOrigin, gateway_reconciliation_status: "future_status", gateway_reconciliation_attempts: 2 }] as any, "none", deps);
    expect(result.outcome).toBe("failed");
    expect(result.failures[0]?.error).toContain("não suportado");
    expect(deps.update).toHaveBeenCalledWith("subscription-1", expect.objectContaining({ gateway_reconciliation_attempts: 3 }));
  });

  it("reexecução após sucesso sem pendências retorna no_action", async () => {
    const deps = cancellationDependencies();
    expect((await reconcileRecurringRecords([{ ...baseOrigin, gateway_reconciliation_status: "user_cancel_gateway_failed" }] as any, "none", deps)).outcome).toBe("success");
    expect((await reconcileRecurringRecords([], "Já reconciliado", deps)).outcome).toBe("no_action");
  });

  it("falha temporária mantém bloqueio para novo checkout", async () => {
    const updates: Record<string, any> = {};
    const deps = cancellationDependencies({
      get: vi.fn().mockRejectedValue(new Error("timeout Authorization: Bearer secret-token")),
      update: vi.fn(async (_id: string, patch: any) => Object.assign(updates, patch)),
    });
    const result = await reconcileRecurringRecords([{ ...baseOrigin, gateway_reconciliation_status: "admin_cancel_gateway_failed" }] as any, "none", deps);
    expect(result.outcome).toBe("failed");
    expect(isBlockingRecurringReconciliation(updates)).toBe(true);
    expect(updates.gateway_reconciliation_error).not.toContain("secret-token");
  });

  it("chargeback plural consulta IDs únicos, continua após falha e sinaliza retry", async () => {
    let failPayment20 = true;
    const getPayment = vi.fn(async (id: string) => {
      if (id === "20" && failPayment20) throw new Error("payment not found");
      return { id, status: "charged_back" };
    });
    const reversalApplications: Record<string, number> = {};
    const processPayment = vi.fn(async (payment: any) => {
      reversalApplications[payment.id] ??= 0;
      if (reversalApplications[payment.id] === 0) reversalApplications[payment.id] += 1;
    });
    const dependencies = {
      getChargeback: vi.fn().mockResolvedValue({ payments: [10, 10, 20, 30] }),
      getPayment,
      processPayment,
    } as any;
    const markFailed = vi.fn();
    const first = await runClaimedBillingWebhook({
      dispatch: () => processChargebackUpdate("chargeback-1", dependencies),
      markProcessed: vi.fn(),
      markFailed,
    });
    expect(first).toMatchObject({ ok: false, status: 500 });
    expect(markFailed).toHaveBeenCalledWith(expect.stringContaining("partial"));
    expect(getPayment.mock.calls.map(call => call[0])).toEqual(["10", "20", "30"]);
    expect(processPayment).toHaveBeenCalledTimes(2);

    failPayment20 = false;
    const second = await runClaimedBillingWebhook({
      dispatch: () => processChargebackUpdate("chargeback-1", dependencies),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
    });
    expect(second).toMatchObject({ ok: true, status: 200 });
    expect(reversalApplications).toEqual({ "10": 1, "20": 1, "30": 1 });
  });

  it("sanitiza tokens em erros persistíveis", () => {
    expect(sanitizeBillingError(new Error("Authorization: Bearer fake-token"))).not.toContain("fake-token");
  });
});
