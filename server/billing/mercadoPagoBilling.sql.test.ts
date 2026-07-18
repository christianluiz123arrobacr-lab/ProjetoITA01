import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.BILLING_SQL_TEST_DATABASE_URL;
const runSqlTests = Boolean(databaseUrl);

function psql(sql: string) {
  const dir = mkdtempSync(join(tmpdir(), "mp-billing-sql-"));
  const file = join(dir, "test.sql");
  writeFileSync(file, sql);
  return execFileSync("psql", [String(databaseUrl), "--set", "ON_ERROR_STOP=1", "--tuples-only", "--no-align", "--file", file], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

describe.skipIf(!runSqlTests)("Mercado Pago billing SQL ledger", () => {
  it("applies a payment once, returns already_applied on retry, and uses 30 days for Pix", () => {
    const output = psql(`
      begin;
      create extension if not exists pgtap;
      select plan(3);

      insert into billing_plans(id, slug, name, price_cents, currency, is_active)
      values ('00000000-0000-4000-8000-000000000101', 'sql-pix', 'SQL Pix', 1000, 'BRL', true)
      on conflict (id) do nothing;

      insert into billing_subscriptions(id, user_id, plan_id, status, gateway, metadata)
      values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'pending', 'mercadopago', '{"payment_method":"pix","contracted_price_cents":1000,"contracted_currency":"BRL"}')
      on conflict (id) do nothing;

      insert into billing_payments(id, subscription_id, original_subscription_id, user_id, plan_id, gateway, gateway_payment_id, payment_method, status, amount_cents, currency)
      values ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'mercadopago', 'mp-sql-pix-1', 'mercadopago_pix', 'pending', 1000, 'BRL')
      on conflict (id) do nothing;

      select is((select already_applied from apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000301', 'mp-sql-pix-1', 'approved', null, '2026-07-01T00:00:00Z')), false, 'first application grants access');
      select is((select already_applied from apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000301', 'mp-sql-pix-1', 'approved', null, '2026-07-01T00:00:00Z')), true, 'retry is idempotent');
      select is((select access_duration_unit || ':' || access_duration_value from billing_payments where id = '00000000-0000-4000-8000-000000000301'), 'days:30', 'pix uses 30 day duration');
      select * from finish();
      rollback;
    `);
    expect(output).toContain("0 failures");
  });

  it("rebuilds the ledger after reversing the first of three payments", () => {
    const output = psql(`
      begin;
      create extension if not exists pgtap;
      select plan(1);
      insert into billing_plans(id, slug, name, price_cents, currency, is_active)
      values ('00000000-0000-4000-8000-000000000102', 'sql-ledger', 'SQL Ledger', 1000, 'BRL', true)
      on conflict (id) do nothing;
      insert into billing_subscriptions(id, user_id, plan_id, status, gateway, metadata)
      values ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'pending', 'mercadopago', '{"payment_method":"pix","contracted_price_cents":1000,"contracted_currency":"BRL"}')
      on conflict (id) do nothing;
      insert into billing_payments(id, subscription_id, original_subscription_id, user_id, plan_id, gateway, gateway_payment_id, payment_method, status, amount_cents, currency, approved_at, access_applied_at, applied_to_subscription_id, access_duration_value, access_duration_unit, created_at)
      values
      ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'mercadopago', 'mp-ledger-1', 'mercadopago_pix', 'approved', 1000, 'BRL', '2026-07-01', '2026-07-01', '00000000-0000-4000-8000-000000000202', 30, 'days', '2026-07-01'),
      ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'mercadopago', 'mp-ledger-2', 'mercadopago_pix', 'approved', 1000, 'BRL', '2026-07-02', '2026-07-02', '00000000-0000-4000-8000-000000000202', 30, 'days', '2026-07-02'),
      ('00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'mercadopago', 'mp-ledger-3', 'mercadopago_pix', 'approved', 1000, 'BRL', '2026-07-03', '2026-07-03', '00000000-0000-4000-8000-000000000202', 30, 'days', '2026-07-03')
      on conflict (id) do nothing;
      select recalculate_mercadopago_access_after_reversal('00000000-0000-4000-8000-000000000311', 'refunded', 'refunded', null);
      select is((select current_period_end::date from billing_subscriptions where id = '00000000-0000-4000-8000-000000000202'), date '2026-08-31', 'remaining two payments compact to 60 days');
      select * from finish();
      rollback;
    `);
    expect(output).toContain("0 failures");
  });
});
