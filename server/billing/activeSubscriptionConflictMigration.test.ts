import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/202607280002_fix_active_subscription_conflict.sql", import.meta.url),
  "utf8",
);

describe("Mercado Pago canonical active subscription migration", () => {
  it("seleciona qualquer assinatura ativa sem limitar o gateway", () => {
    const targetSelection = migration.match(/select \* into v_target[\s\S]*?for update;/i)?.[0] ?? "";
    expect(targetSelection).toContain("where user_id = v_user_id");
    expect(targetSelection).toContain("status = 'active'");
    expect(targetSelection).not.toContain("gateway = 'mercadopago'");
    expect(targetSelection).toContain("current_period_end > v_now");
    expect(targetSelection).toContain("current_period_end is null");
  });

  it("expira e audita a origem antes de reconstruir a raiz canônica", () => {
    const expirePosition = migration.indexOf("'merged_into_subscription_id'");
    const rebuildPosition = migration.indexOf("from public.rebuild_mercadopago_access_ledger");
    expect(expirePosition).toBeGreaterThan(0);
    expect(rebuildPosition).toBeGreaterThan(expirePosition);
    expect(migration).toContain("applied_to_subscription_id = v_target.id");
    expect(migration).toContain("perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id))");
  });

  it("preserva a assinatura e as permissões da RPC", () => {
    expect(migration).toContain("p_payment_id uuid");
    expect(migration).toContain("p_gateway_status text");
    expect(migration).toContain("security definer set search_path = public");
    expect(migration).toContain("grant execute on function public.apply_approved_mercadopago_payment");
    expect(migration).not.toContain("drop index");
  });
});
