-- Read-only, run manually in the SQL Editor. No tokens, email or camera data.
select to_regclass('public.billing_prepaid_attempts') as attempts,
 to_regclass('public.billing_prepaid_attempt_keys') as attempt_keys,
 to_regprocedure('public.prepare_prepaid_checkout(uuid,uuid,text,integer,text,text)') as prepare,
 to_regprocedure('public.claim_prepaid_submission(uuid,uuid)') as claim,
 to_regprocedure('public.complete_prepaid_submission(uuid,uuid,jsonb,text)') as complete;
select c.relname,c.relrowsecurity from pg_class c where c.oid in
 (to_regclass('public.billing_prepaid_attempts'),to_regclass('public.billing_prepaid_attempt_keys'));
select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name in('billing_prepaid_attempts','billing_prepaid_attempt_keys');
select routine_name,grantee,privilege_type from information_schema.routine_privileges
where routine_schema='public' and routine_name in('prepare_prepaid_checkout','claim_prepaid_submission','complete_prepaid_submission');
-- Run the following only AFTER applying migration 002.
select state,count(*) as attempts from public.billing_prepaid_attempts group by state;
-- Support investigation after migration: deliberately excludes payer/user data.
select a.id as attempt_id,a.state,a.created_at,a.submitted_at,a.payment_id,
 bp.status as payment_status,bp.amount_cents,bp.currency,bp.gateway_payment_id,
 a.result->>'providerResourceId' as provider_resource_id,
 'payment:'||a.payment_id::text||':subscription:'||(a.snapshot->>'subscription_id') as external_reference,
 a.snapshot->>'months' as months,a.snapshot->>'after_duration_cents' as after_duration_cents,
 a.snapshot->>'referral_discount_cents' as referral_discount_cents,
 a.snapshot->>'total_cents' as contracted_total_cents
from public.billing_prepaid_attempts a join public.billing_payments bp on bp.id=a.payment_id
order by a.created_at desc limit 50;
