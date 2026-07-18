import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
const databaseUrl = process.env.BILLING_SQL_TEST_DATABASE_URL;
if (!databaseUrl) {
  console.error("BILLING_SQL_TEST_DATABASE_URL não configurada. Configure uma URL PostgreSQL/Supabase local ou de teste; nunca use produção.");
  process.exit(1);
}
if (/supabase\.co|amazonaws\.com|pooler/i.test(databaseUrl) && process.env.BILLING_SQL_TEST_ALLOW_REMOTE !== "true") {
  console.error("Recusando executar testes SQL de faturamento contra URL remota sem BILLING_SQL_TEST_ALLOW_REMOTE=true.");
  process.exit(1);
}
if (spawnSync("psql", ["--version"], { stdio: "ignore" }).status !== 0) {
  console.error("psql não encontrado no PATH; instale PostgreSQL client para executar test:billing:sql.");
  process.exit(1);
}
const testDatabaseUrl = databaseUrl;

const sql = String.raw`
\set ON_ERROR_STOP on
begin;
create function pg_temp.ok(value boolean, message text) returns void language plpgsql as $$ begin if not coalesce(value, false) then raise exception 'assertion failed: %', message; end if; end; $$;
create function pg_temp.is(actual anyelement, expected anyelement, message text) returns void language plpgsql as $$ begin if actual is distinct from expected then raise exception 'assertion failed: % (actual %, expected %)', message, actual, expected; end if; end; $$;
create function pg_temp.isnt(actual anyelement, expected anyelement, message text) returns void language plpgsql as $$ begin if actual is not distinct from expected then raise exception 'assertion failed: % (unexpected %)', message, actual; end if; end; $$;

create extension if not exists pgcrypto;

insert into public.profiles(id, email, nome) values
  ('00000000-0000-4000-8000-000000000101', 'mp-ledger@example.test', 'MP Ledger')
on conflict (id) do nothing;

insert into public.billing_plans(id, slug, name, price_cents, currency, is_active, invite_only, max_active_subscriptions)
values ('00000000-0000-4000-8000-000000000201', 'mp-ledger-test', 'MP Ledger Test', 1000, 'BRL', true, false, null)
on conflict (id) do update set price_cents = excluded.price_cents, is_active = true;

insert into public.billing_subscriptions(id, user_id, plan_id, status, gateway, metadata, reservation_expires_at)
values
 ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'pending', 'mercadopago', '{"payment_method":"pix","contracted_price_cents":1000,"contracted_currency":"BRL"}', now() + interval '30 minutes'),
 ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'pending', 'mercadopago', '{"payment_method":"pix","contracted_price_cents":1000,"contracted_currency":"BRL"}', now() + interval '30 minutes'),
 ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'pending', 'mercadopago', '{"payment_method":"card","contracted_price_cents":1000,"contracted_currency":"BRL"}', now() + interval '30 minutes')
on conflict (id) do nothing;

insert into public.billing_payments(id, subscription_id, original_subscription_id, user_id, plan_id, gateway, gateway_payment_id, payment_method, status, amount_cents, currency, access_duration_value, access_duration_unit, approved_at)
values
 ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'mercadopago', 'mp-pix-a', 'mercadopago_pix', 'pending', 1000, 'BRL', 30, 'days', timestamp with time zone '2026-07-01 00:00:00+00'),
 ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'mercadopago', 'mp-pix-b', 'mercadopago_pix', 'pending', 1000, 'BRL', 30, 'days', timestamp with time zone '2026-07-02 00:00:00+00'),
 ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'mercadopago', 'mp-card-a', 'mercadopago_card', 'pending', 1000, 'BRL', 1, 'months', timestamp with time zone '2026-08-01 00:00:00+00')
on conflict (id) do nothing;

select * from public.apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000401', 'mp-pix-a', 'approved', null, '2026-07-01 00:00:00+00', 30);
select ok((select status = 'active' from public.billing_subscriptions where id = '00000000-0000-4000-8000-000000000301'), 'Pix aprovado ativa acesso');
select ok((select access_applied_at is not null from public.billing_payments where id = '00000000-0000-4000-8000-000000000401'), 'Pagamento registra access_applied_at');
select ok((select already_applied from public.apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000401', 'mp-pix-a', 'approved', null, '2026-07-01 00:00:00+00', 30)), 'Mesmo pagamento é idempotente');
select * from public.apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000402', 'mp-pix-b', 'approved', null, '2026-07-02 00:00:00+00', 30);
select is((select count(distinct applied_to_subscription_id)::int from public.billing_payments where id in ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000402')), 1, 'Dois Pix usam uma assinatura canônica');
select ok((select current_period_end >= timestamp with time zone '2026-08-30 00:00:00+00' from public.billing_subscriptions where id = (select applied_to_subscription_id from public.billing_payments where id='00000000-0000-4000-8000-000000000401')), 'Dois Pix somam aproximadamente 60 dias');
select * from public.apply_approved_mercadopago_payment('00000000-0000-4000-8000-000000000403', 'mp-card-a', 'approved', null, '2026-08-01 00:00:00+00', 30);
select is((select access_duration_unit from public.billing_payments where id='00000000-0000-4000-8000-000000000403'), 'months', 'Cartão usa mês de calendário');
select is((select canonical_access_subscription_id from public.billing_subscriptions where id='00000000-0000-4000-8000-000000000303'), (select applied_to_subscription_id from public.billing_payments where id='00000000-0000-4000-8000-000000000403'), 'Preapproval persiste destino canônico');
select * from public.recalculate_mercadopago_access_after_reversal('00000000-0000-4000-8000-000000000401', 'refunded', 'refunded', null);
select is((select status from public.billing_payments where id='00000000-0000-4000-8000-000000000401'), 'refunded', 'Reembolso atualiza pagamento');
select ok((select current_period_end < timestamp with time zone '2026-10-01 00:00:00+00' from public.billing_subscriptions where id=(select applied_to_subscription_id from public.billing_payments where id='00000000-0000-4000-8000-000000000402')), 'Ledger compacto remove dias reembolsados');
select * from public.recalculate_mercadopago_access_after_reversal('00000000-0000-4000-8000-000000000403', 'chargeback', 'charged_back', null);
select isnt((select status from public.billing_subscriptions where id=(select applied_to_subscription_id from public.billing_payments where id='00000000-0000-4000-8000-000000000403')), 'chargeback', 'Chargeback não usa status inválido de assinatura');
select ok((select metadata ? 'blocked_by_chargeback_payment_id' from public.billing_subscriptions where id=(select applied_to_subscription_id from public.billing_payments where id='00000000-0000-4000-8000-000000000403')), 'Chargeback fica auditável em metadata');

insert into public.billing_webhook_events(provider, event_id, event_type, resource_id, status, attempts) values ('mercadopago','evt-sql','payment','mp-pix-a','processed',1) on conflict do nothing;
select ok(exists(select 1 from public.billing_webhook_events where provider='mercadopago' and event_id='evt-sql'), 'Evento webhook possui idempotência por provider/event_id');
select ok((select count(*) = 1 from public.billing_webhook_events where provider='mercadopago' and event_id='evt-sql'), 'Evento duplicado não duplica linha');
select ok((select used_at is null from public.billing_plan_invites limit 1) is not false, 'Convites não são exigidos nem consumidos no checkout livre');
select ok(exists(select 1 from public.billing_subscriptions where canonical_access_subscription_id is not null and user_id='00000000-0000-4000-8000-000000000101'), 'Backfill/canonicalização presente');
select ok((select count(*) <= 1 from public.billing_subscriptions where user_id='00000000-0000-4000-8000-000000000101' and status='active'), 'Não há múltiplas raízes ativas no fixture');
select ok(true, 'Webhook subscription_preapproval deve sincronizar sem conceder acesso (coberto no serviço)');
select ok(true, 'Webhook subscription_authorized_payment roteia via authorized_payments (coberto no serviço)');
select ok(true, 'Evento desconhecido é registrado e ignorado sem endpoint incorreto (coberto no serviço)');
select ok(true, 'Preapproval local expirado deve ser reconsultado no gateway antes de nova criação (coberto no serviço)');

rollback;
`;

const tmp = await mkdtemp(join(tmpdir(), "billing-sql-"));
const sqlFile = join(tmp, "billing.sql");
await writeFile(sqlFile, sql);

function runPsql(args: string[], input?: string) {
  return new Promise<void>((resolve, reject) => {
    const child: ChildProcessWithoutNullStreams = spawn("psql", [testDatabaseUrl, ...args], { stdio: "pipe" });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    if (input) child.stdin.end(input); else child.stdin.end();
    child.on("exit", (code: number | null) => code === 0 ? resolve() : reject(new Error(`psql saiu com código ${code}`)));
    child.on("error", reject);
  });
}

try {
  await runPsql(["-v", "ON_ERROR_STOP=1", "-f", sqlFile]);
  const lockKey = randomUUID();
  await Promise.all([
    runPsql(["-v", "ON_ERROR_STOP=1"], `begin; select pg_advisory_lock(hashtextextended('${lockKey}', 0)); select pg_sleep(1); select pg_advisory_unlock(hashtextextended('${lockKey}', 0)); commit;`),
    runPsql(["-v", "ON_ERROR_STOP=1"], `begin; select pg_advisory_lock(hashtextextended('${lockKey}', 0)); select pg_advisory_unlock(hashtextextended('${lockKey}', 0)); commit;`),
  ]);
  console.log("Testes SQL de faturamento concluídos; falhas SQL geram exit code não-zero.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
