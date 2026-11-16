-- Read-only. No student emails, payer data or credentials.
select to_regclass('public.billing_plan_durations') as stage1_durations,
 to_regclass('public.billing_prepaid_attempts') as stage1_attempts,
 to_regclass('public.affiliate_sales') as affiliate_sales;
select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname like 'affiliate_%' and relkind='r';
select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' and table_name like 'affiliate_%';
select routine_name,grantee,privilege_type from information_schema.routine_privileges where routine_schema='public' and (routine_name like 'affiliate_%' or routine_name='prepare_affiliate_prepaid_checkout');
-- Only AFTER the affiliate migration:
select commercial_enabled,payout_day from public.affiliate_settings where id=1;
select count(*) as sales,sum(commission_cents) as current_commissions_cents from public.affiliate_sales;
select count(*) as entries,sum(delta_cents) as ledger_total_cents from public.affiliate_commission_entries;
-- Expected no rows: each immutable ledger must match its current projection.
select s.payment_id,s.commission_cents,coalesce(sum(e.delta_cents),0) as ledger_cents
from public.affiliate_sales s left join public.affiliate_commission_entries e using(payment_id)
group by s.payment_id,s.commission_cents having s.commission_cents<>coalesce(sum(e.delta_cents),0);
-- Negative balance is a visible debt after refund of commissions already paid.
select a.id as affiliate_id,
 (select coalesce(sum(commission_cents),0) from public.affiliate_sales where affiliate_id=a.id and released)
 -(select coalesce(sum(amount_cents),0) from public.affiliate_payouts where affiliate_id=a.id) as released_balance_cents
from public.affiliate_profiles a;
-- Expected no rows after successful official reconciliation; otherwise retry
-- the existing admin reconciliation against the provider, never edit balances.
select s.payment_id,p.status,p.access_applied_at,s.approved,s.commission_cents
from public.affiliate_sales s join public.billing_payments p on p.id=s.payment_id
where (p.status='approved' and p.access_applied_at is not null and not s.approved)
 or (p.status in('refunded','chargeback') and s.commission_cents<>0);
