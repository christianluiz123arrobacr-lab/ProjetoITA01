-- Pause coupon checkout and remove dependent application code first.
begin;
do $$ begin
 if exists(select 1 from public.affiliate_sales) or exists(select 1 from public.affiliate_payouts) then
 raise exception 'Rollback blocked: retain financial history and use forward recovery'; end if;
end; $$;
drop function public.affiliate_dashboard(uuid,uuid,date,date,integer);
drop function public.affiliate_reconcile_payment(uuid,integer);
drop function public.prepare_affiliate_prepaid_checkout(uuid,uuid,text,integer,text,text,text,boolean);
drop function public.affiliate_coupon_quote(uuid,text,integer,text,boolean);
drop function public.affiliate_admin_write(uuid,text,jsonb);
drop table public.affiliate_audit,public.affiliate_payouts,public.affiliate_commission_entries,public.affiliate_sales,public.affiliate_coupons,public.affiliate_profiles,public.affiliate_settings;
commit;
