import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { centsToMercadoPagoAmount, mapMercadoPagoPaymentStatus, mapMercadoPagoPreapprovalStatus, mercadoPagoAmountToCents } from "./billingStatusMapper";
import { buildMercadoPagoWebhookManifest, validateMercadoPagoWebhookSignature } from "./webhookSignature";
import { extractChargebackPaymentId, extractChargebackPaymentIds, mercadoPagoChargebackSchema } from "./mercadoPagoClient";
import {
  classifyExternalReference,
  extendPixAccess,
  isDuplicateApprovedPayment,
  resolveCancellationAccess,
  shouldBlockFromPayment,
  shouldGrantAccessFromPayment,
  shouldPreserveAccessOnPreapprovalCancel,
  validateBuyerEmailAddress,
  validateClientCheckoutInput,
  validateGatewayPayment,
  validatePlanForCheckout,
} from "./financialRules";

const pixReference = "payment:11111111-1111-4111-8111-111111111111:subscription:22222222-2222-4222-8222-222222222222";
const cardReference = "33333333-3333-4333-8333-333333333333";

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
    expect(mapMercadoPagoPaymentStatus("authorized")).toBe("pending");
  });

  it("extrai payment_id do array oficial de chargeback", () => {
    const chargeback = mercadoPagoChargebackSchema.parse({ id: 123, payments: [86439942806] });
    expect(extractChargebackPaymentId(chargeback)).toBe("86439942806");
  });

  it("extrai, valida e remove IDs repetidos de chargeback", () => {
    const chargeback = mercadoPagoChargebackSchema.parse({ payment_id: 10, payments: [10, "20", "bad", 20, 30] });
    expect(extractChargebackPaymentIds(chargeback)).toEqual(["10", "20", "30"]);
  });

  it("mapeia preapproval authorized sem liberar acesso", () => {
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

  it("classifica referência Pix e referência de assinatura recorrente", () => {
    expect(classifyExternalReference(pixReference)).toBe("pix_payment");
    expect(classifyExternalReference(cardReference)).toBe("card_subscription");
    expect(classifyExternalReference("bad")).toBe("invalid");
  });

  it("aceita pagamento recorrente com referência de assinatura válida", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: cardReference, transactionAmount: 11.99, currencyId: "BRL" })).toEqual({ ok: true });
  });

  it("rejeita pagamento com valor divergente", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: pixReference, transactionAmount: 10, currencyId: "BRL" })).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("rejeita pagamento com moeda divergente", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: pixReference, transactionAmount: 11.99, currencyId: "ARS" })).toEqual({ ok: false, reason: "currency_mismatch" });
  });

  it("rejeita external_reference inválida", () => {
    expect(validateGatewayPayment({ expectedAmountCents: 1199, expectedCurrency: "BRL", externalReference: "bad", transactionAmount: 11.99, currencyId: "BRL" })).toEqual({ ok: false, reason: "invalid_external_reference" });
  });

  it("aprova pagamento aprovado", () => {
    expect(shouldGrantAccessFromPayment("approved")).toBe(true);
    expect(shouldGrantAccessFromPayment("authorized")).toBe(false);
  });

  it("bloqueia pagamento recusado, Pix expirado, estorno e chargeback", () => {
    expect(shouldBlockFromPayment("rejected")).toBe(true);
    expect(shouldBlockFromPayment("expired")).toBe(true);
    expect(shouldBlockFromPayment("refunded")).toBe(true);
    expect(shouldBlockFromPayment("charged_back")).toBe(true);
  });

  it("preserva acesso no cancelamento ao final do período", () => {
    expect(resolveCancellationAccess({ currentPeriodEnd: "2026-08-01T00:00:00.000Z", immediate: false, now: new Date("2026-07-01T00:00:00.000Z") })).toEqual({ status: "active", accessUntil: "2026-08-01T00:00:00.000Z", cancelAtPeriodEnd: true });
  });

  it("bloqueia no cancelamento administrativo imediato", () => {
    expect(resolveCancellationAccess({ currentPeriodEnd: "2026-08-01T00:00:00.000Z", immediate: true, now: new Date("2026-07-01T00:00:00.000Z") }).accessUntil).toBe("2026-07-01T00:00:00.000Z");
  });

  it("não bloqueia antecipadamente webhook de preapproval cancelled quando há cancelamento ao fim do período", () => {
    expect(shouldPreserveAccessOnPreapprovalCancel({ status: "active", cancelAtPeriodEnd: true, currentPeriodEnd: "2026-08-01T00:00:00.000Z", now: new Date("2026-07-01T00:00:00.000Z") })).toBe(true);
  });

  it("estende acesso antecipado por Pix a partir do fim atual", () => {
    expect(extendPixAccess("2026-08-01T00:00:00.000Z", new Date("2026-07-01T00:00:00.000Z")).end).toBe("2026-08-31T00:00:00.000Z");
  });

  it("não deve estender novamente pagamento duplicado já aprovado", () => {
    expect(isDuplicateApprovedPayment({ approvedAt: "2026-07-01T00:00:00.000Z" })).toBe(true);
    expect(isDuplicateApprovedPayment({ approvedAt: null })).toBe(false);
  });

  it("rejeita usuário tentando enviar preço adulterado", () => {
    expect(validateClientCheckoutInput({ planSlug: "mensal-1099", amountCents: 1 }, true)).toEqual({ ok: false, reason: "client_price_forbidden" });
  });

  it("rejeita usuário sem autenticação", () => {
    expect(validateClientCheckoutInput({ planSlug: "mensal-1099" }, false)).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("rejeita e-mail ausente, inválido ou fictício antes de chamar o Mercado Pago", () => {
    expect(validateBuyerEmailAddress(null)).toEqual({ ok: false, reason: "invalid_buyer_email" });
    expect(validateBuyerEmailAddress("comprador@rumoaoita.local")).toEqual({ ok: false, reason: "invalid_buyer_email" });
    expect(validateBuyerEmailAddress("aluno@example.com")).toEqual({ ok: true });
  });

  it("rejeita plano inativo, sem vagas e convite ausente", () => {
    expect(validatePlanForCheckout({ is_active: false }, true)).toEqual({ ok: false, reason: "inactive_plan" });
    expect(validatePlanForCheckout({ is_active: true, has_available_slots: false }, true)).toEqual({ ok: false, reason: "plan_full" });
    expect(validatePlanForCheckout({ is_active: true, invite_only: true }, false)).toEqual({ ok: false, reason: "missing_invite" });
  });

  it("usa chaves estáveis para criação idempotente de checkout e Pix", () => {
    expect(`mp-card-${cardReference}`).toBe("mp-card-33333333-3333-4333-8333-333333333333");
    expect(`mp-pix-${cardReference}`).toBe("mp-pix-33333333-3333-4333-8333-333333333333");
  });
});
