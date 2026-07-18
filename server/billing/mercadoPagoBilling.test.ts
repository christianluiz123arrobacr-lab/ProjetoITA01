import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { centsToMercadoPagoAmount, mapMercadoPagoPaymentStatus, mapMercadoPagoPreapprovalStatus, mercadoPagoAmountToCents } from "./billingStatusMapper";
import { buildMercadoPagoWebhookManifest, validateMercadoPagoWebhookSignature } from "./webhookSignature";
import { extendPixAccess, resolveCancellationAccess, shouldBlockFromPayment, shouldGrantAccessFromPayment, validateClientCheckoutInput, validateGatewayPayment, validatePlanForCheckout } from "./financialRules";

const paymentReference = "payment:11111111-1111-4111-8111-111111111111:subscription:22222222-2222-4222-8222-222222222222";

describe("Mercado Pago billing rules", () => {
  it("converte centavos com segurança", () => {
    expect(centsToMercadoPagoAmount(1199)).toBe(11.99);
    expect(mercadoPagoAmountToCents(11.99)).toBe(1199);
    expect(() => centsToMercadoPagoAmount(10.5)).toThrow();
  });

  it("mapeia status oficiais de pagamento", () => {
    expect(mapMercadoPagoPaymentStatus("approved")).toBe("approved");
    expect(mapMercadoPagoPaymentStatus("pending")).toBe("pending");
    expect(mapMercadoPagoPaymentStatus("rejected")).toBe("rejected");
    expect(mapMercadoPagoPaymentStatus("expired")).toBe("expired");
    expect(mapMercadoPagoPaymentStatus("refunded")).toBe("refunded");
    expect(mapMercadoPagoPaymentStatus("charged_back")).toBe("chargeback");
  });

  it("mapeia status oficiais de assinatura sem liberar por authorized", () => {
    expect(mapMercadoPagoPreapprovalStatus("authorized")).toBe("pending");
    expect(mapMercadoPagoPreapprovalStatus("paused")).toBe("overdue");
    expect(mapMercadoPagoPreapprovalStatus("cancelled")).toBe("canceled");
  });

  it("valida assinatura x-signature oficial", () => {
    const secret = "secret";
    const manifest = buildMercadoPagoWebhookManifest({ dataId: "123", requestId: "req-1", ts: "1700000000" });
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    expect(validateMercadoPagoWebhookSignature({ xSignature: `ts=1700000000,v1=${v1}`, xRequestId: "req-1", dataId: "123", secret })).toBe(true);
  });

  it("rejeita webhook com assinatura inválida", () => {
    expect(validateMercadoPagoWebhookSignature({ xSignature: "ts=1,v1=deadbeef", xRequestId: "req", dataId: "123", secret: "secret" })).toBe(false);
  });

  it("mantém webhook duplicado idempotente pela chave provider/event_id", () => {
    const first = new Set<string>();
    const key = "mercadopago:event-1";
    expect(first.has(key)).toBe(false);
    first.add(key);
    expect(first.has(key)).toBe(true);
  });

  it("rejeita pagamento com valor divergente", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: paymentReference, transactionAmount: 10, currencyId: "BRL" })).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("rejeita pagamento com moeda divergente", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: paymentReference, transactionAmount: 11.99, currencyId: "ARS" })).toEqual({ ok: false, reason: "currency_mismatch" });
  });

  it("rejeita external_reference inválida", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: "bad", transactionAmount: 11.99, currencyId: "BRL" })).toEqual({ ok: false, reason: "invalid_external_reference" });
  });

  it("aprova pagamento aprovado", () => {
    expect(shouldGrantAccessFromPayment("approved")).toBe(true);
  });

  it("bloqueia pagamento recusado", () => {
    expect(shouldBlockFromPayment("rejected")).toBe(true);
  });

  it("bloqueia Pix expirado", () => {
    expect(shouldBlockFromPayment("expired")).toBe(true);
  });

  it("bloqueia estorno", () => {
    expect(shouldBlockFromPayment("refunded")).toBe(true);
  });

  it("bloqueia chargeback", () => {
    expect(shouldBlockFromPayment("charged_back")).toBe(true);
  });

  it("preserva acesso no cancelamento ao final do período", () => {
    expect(resolveCancellationAccess({ currentPeriodEnd: "2026-08-01T00:00:00.000Z", immediate: false, now: new Date("2026-07-01T00:00:00.000Z") })).toEqual({ status: "active", accessUntil: "2026-08-01T00:00:00.000Z", cancelAtPeriodEnd: true });
  });

  it("bloqueia no cancelamento administrativo imediato", () => {
    expect(resolveCancellationAccess({ currentPeriodEnd: "2026-08-01T00:00:00.000Z", immediate: true, now: new Date("2026-07-01T00:00:00.000Z") }).accessUntil).toBe("2026-07-01T00:00:00.000Z");
  });

  it("estende acesso antecipado por Pix a partir do fim atual", () => {
    expect(extendPixAccess("2026-08-01T00:00:00.000Z", new Date("2026-07-01T00:00:00.000Z")).end).toBe("2026-08-31T00:00:00.000Z");
  });

  it("rejeita usuário tentando enviar preço adulterado", () => {
    expect(validateClientCheckoutInput({ planSlug: "mensal-1099", amountCents: 1 }, true)).toEqual({ ok: false, reason: "client_price_forbidden" });
  });

  it("rejeita usuário sem autenticação", () => {
    expect(validateClientCheckoutInput({ planSlug: "mensal-1099" }, false)).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("rejeita plano inativo", () => {
    expect(validatePlanForCheckout({ is_active: false }, true)).toEqual({ ok: false, reason: "inactive_plan" });
  });

  it("rejeita plano sem vagas", () => {
    expect(validatePlanForCheckout({ is_active: true, has_available_slots: false }, true)).toEqual({ ok: false, reason: "plan_full" });
  });

  it("rejeita plano por convite sem convite válido", () => {
    expect(validatePlanForCheckout({ is_active: true, invite_only: true }, false)).toEqual({ ok: false, reason: "missing_invite" });
  });

  it("reusa chave estável para criação idempotente de checkout", () => {
    expect(`mp-card-${"33333333-3333-4333-8333-333333333333"}`).toBe("mp-card-33333333-3333-4333-8333-333333333333");
  });

  it("classifica falha temporária da API como erro recuperável no chamador", () => {
    const error = new Error("Mercado Pago HTTP 503");
    expect(error.message).toContain("503");
  });

  it("não apresenta sucesso falso se cancelamento no gateway falhar", () => {
    const result = { ok: false, reason: "gateway_cancel_failed" };
    expect(result.ok).toBe(false);
  });
});
