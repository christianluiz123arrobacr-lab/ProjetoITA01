import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const registration = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
const referralService = readFileSync(new URL("./referralService.ts", import.meta.url), "utf8");
const billingService = readFileSync(new URL("./billingService.ts", import.meta.url), "utf8");
const clientBilling = readFileSync(new URL("../../client/src/services/billing.service.ts", import.meta.url), "utf8");
const pricing = readFileSync(new URL("../../client/src/pages/PricingPage.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../supabase/migrations/202609080001_referral_checkout_fix.sql", import.meta.url), "utf8");

describe("fluxo de desconto por indicação", () => {
  it("registra a atribuição no backend durante o cadastro e não engole retorno nulo", () => {
    expect(registration).toContain("registerReferralAttribution(data.user.id, input.referralCode)");
    expect(registration).toContain("referralStatus");
    expect(referralService).toContain('referral_queue_attribution');
    expect(referralService).toContain('referral_finalize_attribution');
    expect(migration).toContain("v_created_at < now() - interval '2 hours'");
  });

  it("não usa dica do navegador nos endpoints de checkout", () => {
    expect(clientBilling).not.toContain("getReferralHint");
    expect(billingService).not.toContain("attachReferral(input.userId");
    expect(billingService).toContain("await finalizePendingReferral(input.userId)");
  });

  it("precifica o pagamento local antes de enviar exatamente o mesmo valor ao gateway", () => {
    const pricingCall = billingService.indexOf('referralRpc("referral_price_payment"');
    const gatewayAmount = billingService.indexOf("amount: centsToMercadoPagoAmount(amountCents)", pricingCall);
    expect(pricingCall).toBeGreaterThan(-1);
    expect(gatewayAmount).toBeGreaterThan(pricingCall);
    expect(billingService).not.toContain("input.amountCents");
  });

  it("carrega prévia autenticada e explica Pix, pacote e cartão recorrente", () => {
    expect(referralService).toContain('referral_pricing_preview');
    expect(pricing).toContain("getReferralPricingPreview");
    expect(pricing).toContain("preço");
    expect(pricing).toContain("desconto no primeiro pagamento via Pix ou pacote pré-pago");
    expect(pricing).toContain("não se aplica à assinatura mensal recorrente no cartão");
  });

  it("mantém RLS e cálculo percentual inteiro no SQL", () => {
    expect(migration).toContain("alter table public.referral_attribution_pending enable row level security");
    expect(migration).toContain("floor(p_amount_cents::numeric * v_campaign.discount / 100.0)::integer");
    expect(migration).toContain("p_amount_cents - 1");
  });
});
