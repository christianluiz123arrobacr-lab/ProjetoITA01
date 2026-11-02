-- STOP: do not drop attempt identities with any submitted/ready purchase.
-- Reverting application code while attempts exist can recreate charges.
begin;
do $$ begin
 if exists(select 1 from public.billing_prepaid_attempts) then
   raise exception 'Rollback blocked: persisted purchases require retention and forward recovery';
 end if;
 if exists(select 1 from public.billing_payments where access_duration_unit='months' and access_duration_value in(6,12)) then
   raise exception 'Rollback blocked: 6/12 month payments exist';
 end if;
end; $$;
drop function public.complete_prepaid_submission(uuid,uuid,jsonb,text);
drop function public.claim_prepaid_submission(uuid,uuid);
drop function public.prepare_prepaid_checkout(uuid,uuid,text,integer,text,text);
drop table public.billing_prepaid_attempt_keys;
drop table public.billing_prepaid_attempts;
create or replace function public.apply_approved_prepaid_payment(
  p_payment_id uuid,
  p_gateway_payment_id text,
  p_gateway_status text,
  p_gateway_status_detail text,
  p_date_approved timestamptz default null,
  p_access_days integer default 30
)
returns table(payment_id uuid, applied_to_subscription_id uuid, period_start timestamptz, period_end timestamptz, already_applied boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_duration_value integer;
  v_duration_unit text;
  v_user_id uuid;
  v_result record;
  v_rebuild record;
begin
  select greatest(coalesce(access_duration_value, 1), 1), coalesce(access_duration_unit, 'months'), user_id
    into v_duration_value, v_duration_unit, v_user_id
  from public.billing_payments where id = p_payment_id for update;
  if v_user_id is null or v_duration_unit <> 'months' or v_duration_value not in (1, 2, 3) then
    raise exception 'invalid prepaid package payment';
  end if;

  select * into v_result from public.apply_approved_mercadopago_payment(
    p_payment_id, p_gateway_payment_id, p_gateway_status, p_gateway_status_detail, p_date_approved, p_access_days
  ) limit 1;
  update public.billing_payments
  set access_duration_value = v_duration_value,
      access_duration_unit = 'months',
      updated_at = now()
  where id = p_payment_id;
  select * into v_rebuild from public.rebuild_mercadopago_access_ledger(v_result.applied_to_subscription_id, v_user_id, now()) limit 1;
  payment_id := v_result.payment_id;
  applied_to_subscription_id := v_result.applied_to_subscription_id;
  period_start := v_rebuild.period_start;
  period_end := v_rebuild.period_end;
  already_applied := v_result.already_applied;
  return next;
end;
$$;

revoke all on function public.apply_approved_prepaid_payment(uuid, text, text, text, timestamptz, integer) from public;
grant execute on function public.apply_approved_prepaid_payment(uuid, text, text, text, timestamptz, integer) to service_role;
create or replace function public.recalculate_mercadopago_access_after_reversal(
  p_payment_id uuid,
  p_payment_status text,
  p_gateway_status text,
  p_gateway_status_detail text default null
)
returns table(payment_id uuid, subscription_id uuid, recalculated_period_end timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_target_id uuid;
  v_payment public.billing_payments%rowtype;
  v_rebuild record;
  v_now timestamptz := now();
begin
  if p_payment_status not in ('refunded', 'chargeback') then raise exception 'invalid reversal status'; end if;
  select user_id, coalesce(applied_to_subscription_id, subscription_id) into v_user_id, v_target_id from public.billing_payments where id = p_payment_id;
  if v_user_id is null or v_target_id is null then raise exception 'payment not found'; end if;

  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id));
  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  perform 1 from public.billing_subscriptions where id = v_target_id and user_id = v_user_id for update;

  update public.billing_payments
  set status = p_payment_status,
      refunded_at = coalesce(refunded_at, v_now),
      reversal_applied_at = coalesce(reversal_applied_at, v_now),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('gateway_status', p_gateway_status, 'gateway_status_detail', p_gateway_status_detail, 'reversal_reason', p_payment_status),
      updated_at = v_now
  where id = v_payment.id;

  select * into v_rebuild from public.rebuild_mercadopago_access_ledger(v_target_id, v_user_id, v_now) limit 1;

  if p_payment_status = 'chargeback' then
    update public.billing_subscriptions
    set status = case when coalesce(current_period_end, v_now) > v_now then status else 'expired' end,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('blocked_by_chargeback_payment_id', p_payment_id),
        last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
  else
    update public.billing_subscriptions set last_gateway_status = p_gateway_status, updated_at = v_now where id = v_target_id;
  end if;

  payment_id := v_payment.id; subscription_id := v_target_id; recalculated_period_end := v_rebuild.period_end;
  return next;
end;
$$;
commit;
