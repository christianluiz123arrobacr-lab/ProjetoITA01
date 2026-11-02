-- READ ONLY. Run after the publication preflight confirmed the stage tables exist.
-- Does not execute payment routines or change permissions.
select id, commercial_enabled, payout_day
from public.affiliate_settings where id=1;

select n.nspname as schema_name,p.proname as function_name,
 pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_can_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
and (p.proname in(
 'apply_approved_prepaid_payment','recalculate_mercadopago_access_after_reversal',
 'apply_approved_mercadopago_payment','rebuild_mercadopago_access_ledger',
 'reserve_mercadopago_checkout','mercadopago_user_lock_key','add_billing_access_duration',
 'referral_calculate_discount','referral_reconcile_payment',
 'save_billing_plan_duration','prepare_prepaid_checkout','claim_prepaid_submission','complete_prepaid_submission',
 'prepare_affiliate_prepaid_checkout')
 or p.proname like 'affiliate_%')
order by p.proname,arguments;
