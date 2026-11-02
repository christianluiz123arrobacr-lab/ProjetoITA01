-- Removes preparation settings only. Export them before rollback if needed.
-- No payments depend on these settings in this delivery.
begin;
do $$ begin
 if to_regclass('public.billing_prepaid_attempts') is not null then
   raise exception 'Rollback 002 must be reviewed and applied before rollback 001';
 end if;
end; $$;
drop function public.save_billing_plan_duration(uuid,uuid,integer,boolean,integer,integer);
drop table public.billing_plan_durations;
commit;
