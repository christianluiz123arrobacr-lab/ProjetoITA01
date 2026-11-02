-- Manual corrective migration AFTER the three installed subscription migrations.
-- Permissions only: no payment/user rows, prices or commercial flags are changed.
-- CREATE OR REPLACE preserves prior explicit grants; REVOKE PUBLIC alone is insufficient.
begin;
revoke all on function public.apply_approved_mercadopago_payment(uuid,text,text,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.apply_approved_mercadopago_payment(uuid,text,text,text,timestamptz,integer) to service_role;
revoke all on function public.apply_approved_prepaid_payment(uuid,text,text,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.apply_approved_prepaid_payment(uuid,text,text,text,timestamptz,integer) to service_role;
revoke all on function public.rebuild_mercadopago_access_ledger(uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.rebuild_mercadopago_access_ledger(uuid,uuid,timestamptz) to service_role;
revoke all on function public.recalculate_mercadopago_access_after_reversal(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.recalculate_mercadopago_access_after_reversal(uuid,text,text,text) to service_role;
revoke all on function public.reserve_mercadopago_checkout(uuid,text,uuid,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.reserve_mercadopago_checkout(uuid,text,uuid,text,timestamptz,jsonb) to service_role;
-- Fail atomically if role inheritance still permits browser execution.
do $$
declare signature text;
begin
 foreach signature in array array[
'public.apply_approved_mercadopago_payment(uuid,text,text,text,timestamptz,integer)',
'public.apply_approved_prepaid_payment(uuid,text,text,text,timestamptz,integer)',
'public.rebuild_mercadopago_access_ledger(uuid,uuid,timestamptz)',
'public.recalculate_mercadopago_access_after_reversal(uuid,text,text,text)',
'public.reserve_mercadopago_checkout(uuid,text,uuid,text,timestamptz,jsonb)'
 ] loop
   if has_function_privilege('anon',signature,'EXECUTE')
      or has_function_privilege('authenticated',signature,'EXECUTE')
      or not has_function_privilege('service_role',signature,'EXECUTE') then
     raise exception 'Unexpected effective execution privileges for %',signature;
   end if;
 end loop;
end $$;
commit;
