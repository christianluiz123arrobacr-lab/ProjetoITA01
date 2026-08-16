import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  assertLegacyPlanCheckoutAllowed,
  isRetiredBetaFounderSlug,
  isSamePlanFamily,
  publicPlanAvailability,
} from "./legacyFounderPricing";

const founderPlan = {
  slug: "legacy-founder",
  is_active: true,
  is_public: true,
  requires_legacy_founder_eligibility: true,
};
const normalPlan = {
  slug: "normal",
  is_active: true,
  is_public: true,
  requires_legacy_founder_eligibility: false,
};

describe("preços legados de fundador", () => {
  it("bloqueia usuário novo que força checkout do Plano Fundador", () => {
    expect(() => assertLegacyPlanCheckoutAllowed(founderPlan, false)).toThrowError(expect.objectContaining<Partial<TRPCError>>({ code: "FORBIDDEN" }));
  });

  it("permite fundador elegível e continua permitindo após cancelamento", () => {
    expect(() => assertLegacyPlanCheckoutAllowed(founderPlan, true)).not.toThrow();
    expect(publicPlanAvailability(founderPlan, true, false, false)).toMatchObject({ can_checkout: true, legacy_founder_eligible: true });
  });

  it("mostra fundador bloqueado e Plano Normal disponível para usuário novo", () => {
    expect(publicPlanAvailability(founderPlan, false, false, false)).toMatchObject({ can_checkout: false, checkout_block_reason: "legacy_founder_required" });
    expect(publicPlanAvailability(normalPlan, false, false, false)).toMatchObject({ can_checkout: true, checkout_block_reason: null });
  });

  it("não permite checkout dos slugs antigos de R$ 6", () => {
    expect(isRetiredBetaFounderSlug("beta-selecionado-5")).toBe(true);
    expect(() => assertLegacyPlanCheckoutAllowed({ ...normalPlan, slug: "beta-selecionado-5" }, true)).toThrowError(expect.objectContaining<Partial<TRPCError>>({ code: "FORBIDDEN" }));
  });

  it("impede cobrança duplicada enquanto já existe assinatura ativa", () => {
    expect(publicPlanAvailability(normalPlan, false, true, true)).toMatchObject({ can_checkout: false, is_current_plan: true, checkout_block_reason: "active_subscription" });
    expect(publicPlanAvailability(founderPlan, true, false, true)).toMatchObject({ can_checkout: false, is_current_plan: false, checkout_block_reason: "active_subscription" });
  });

  it("reconhece assinatura ativa de um slug antigo como o plano atual equivalente", () => {
    expect(isSamePlanFamily("legacy-founder", "beta-fundador-8")).toBe(true);
    expect(isSamePlanFamily("legacy-founder", "beta-selecionado-5")).toBe(true);
    expect(isSamePlanFamily("normal", "mensal-1099")).toBe(true);
    expect(isSamePlanFamily("normal", "beta-fundador-8")).toBe(false);
  });

  it("migração concede somente por pagamento aprovado ou assinatura ativa e é idempotente", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/202607300001_legacy_founder_pricing.sql", import.meta.url), "utf8");
    expect(sql).toContain("p.status = 'approved'");
    expect(sql).toContain("p.amount_cents = 600");
    expect(sql).toContain("p.amount_cents = 900");
    expect(sql).toContain("s.status in ('active', 'trialing', 'approved')");
    expect(sql).toContain("on conflict (user_id, entitlement_key) do nothing");
    expect(sql).toContain("unique (user_id, entitlement_key)");
    expect(sql).toContain("historical_beta_founder");
    expect(sql).toContain("historical_founder");
  });

  it("inicializa os preços no banco e preserva alterações administrativas em nova execução", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/202607300001_legacy_founder_pricing.sql", import.meta.url), "utf8");
    expect(sql).toContain("'legacy-founder', 'Plano Fundador'");
    expect(sql).toContain("900, 'BRL'");
    expect(sql).toContain("'normal', 'Plano Normal'");
    expect(sql).toContain("1190, 'BRL'");
    expect(sql).toContain("legacy_pricing_initialized");
    expect(sql).toContain("then public.billing_plans.price_cents");
  });

  it("checkout recebe somente planSlug; preço e elegibilidade são carregados no servidor", () => {
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    const service = readFileSync(new URL("./billingService.ts", import.meta.url), "utf8");
    expect(router).toContain('z.object({ planSlug: z.string().min(1).max(120) })');
    expect(router).not.toMatch(/createCardSubscriptionCheckout[\s\S]{0,300}priceCents/);
    expect(service).toContain("await assertUserCanCheckoutPlan(userId, data as BillingPlanRow)");
    expect(service).toContain("amount: centsToMercadoPagoAmount(Number(plan.price_cents))");
  });

  it("frontend mantém o card fundador visível e desabilita seus checkouts quando bloqueado", () => {
    const pricing = readFileSync(new URL("../../client/src/pages/PricingPage.tsx", import.meta.url), "utf8");
    const clientService = readFileSync(new URL("../../client/src/services/billing.service.ts", import.meta.url), "utf8");
    expect(pricing).toContain('plan.checkoutBlockReason === "legacy_founder_required"');
    expect(pricing).toContain("Exclusivo para alunos fundadores que já participaram da plataforma.");
    expect(pricing).toContain("disabled={isLoading || checkoutDisabled");
    expect(clientService).not.toContain("amountCents: 600");
    expect(clientService).not.toContain("amountCents: 900");
    expect(clientService).not.toContain("amountCents: 1190");
  });

  it("alteração administrativa registra preço anterior e novo para os próximos checkouts", () => {
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    const sql = readFileSync(new URL("../../supabase/migrations/202607300001_legacy_founder_pricing.sql", import.meta.url), "utf8");
    expect(router).toContain('action: "billing_plan_updated"');
    expect(router).toContain("price_cents: input.priceCents");
    expect(router).toContain("metadata: { slug: previous.slug, previous, next }");
    expect(sql).toContain("'previous', jsonb_build_object");
    expect(sql).toContain("'next', jsonb_build_object");
    expect(sql).toContain("updated_by = p_admin_user_id");
  });
});
