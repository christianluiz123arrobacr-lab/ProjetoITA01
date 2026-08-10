-- Apply approved Mercado Pago payments to the user's existing active access
-- root, regardless of which gateway originally created that subscription.
-- The unique active-subscription index remains the final invariant guard.

create or replace function public.apply_approved_mercadopago_payment(
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
  v_user_id uuid; v_origin_id uuid;
  v_payment public.billing_payments%rowtype;
  v_origin public.billing_subscriptions%rowtype;
  v_target public.billing_subscriptions%rowtype;
  v_now timestamptz := now(); v_approved_at timestamptz;
  v_duration_value integer; v_duration_unit text; v_rebuild record;
begin
  if lower(coalesce(p_gateway_status, '')) <> 'approved' then
    raise exception 'only final approved payments may grant access';
  end if;

  select user_id, coalesce(original_subscription_id, subscription_id)
    into v_user_id, v_origin_id
  from public.billing_payments
  where id = p_payment_id;
  if v_user_id is null or v_origin_id is null then raise exception 'payment not found or missing origin'; end if;

  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id));

  select * into v_payment
  from public.billing_payments
  where id = p_payment_id
  for update;
  if v_payment.id is null or v_payment.gateway <> 'mercadopago' then raise exception 'payment gateway mismatch'; end if;
  if p_gateway_payment_id is not null and v_payment.gateway_payment_id is not null and v_payment.gateway_payment_id <> p_gateway_payment_id then
    raise exception 'gateway payment mismatch';
  end if;

  select * into v_origin
  from public.billing_subscriptions
  where id = v_origin_id and user_id = v_user_id
  for update;
  if v_origin.id is null then raise exception 'origin subscription not found'; end if;

  if v_payment.access_applied_at is not null then
    payment_id := v_payment.id; applied_to_subscription_id := v_payment.applied_to_subscription_id;
    period_start := v_payment.current_period_start; period_end := v_payment.current_period_end; already_applied := true;
    return next; return;
  end if;

  -- Prefer the one active access root for the user even when it came from the
  -- manual or legacy gateway. This selection is deterministic and row-locked.
  select * into v_target
  from public.billing_subscriptions
  where user_id = v_user_id
    and status = 'active'
  order by
    case
      when current_period_end > v_now then 0
      when current_period_end is null then 1
      else 2
    end,
    case when current_period_end > v_now then current_period_end end desc nulls last,
    created_at desc,
    id desc
  limit 1
  for update;

  if v_target.id is null then v_target := v_origin; end if;

  update public.billing_subscriptions
  set canonical_access_subscription_id = v_target.id,
      canonicalized_at = coalesce(canonicalized_at, v_now),
      updated_at = v_now
  where id in (v_origin.id, v_target.id);

  v_approved_at := coalesce(p_date_approved, v_payment.approved_at, v_now);
  v_duration_value := case when v_payment.payment_method = 'mercadopago_card' then 1 else greatest(coalesce(p_access_days, 30), 1) end;
  v_duration_unit := case when v_payment.payment_method = 'mercadopago_card' then 'months' else 'days' end;

  update public.billing_payments
  set status = 'approved',
      original_subscription_id = coalesce(original_subscription_id, v_origin.id),
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      approved_at = coalesce(approved_at, v_approved_at),
      access_applied_at = v_now,
      applied_to_subscription_id = v_target.id,
      access_duration_value = v_duration_value,
      access_duration_unit = v_duration_unit,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'gateway_status', p_gateway_status,
        'gateway_status_detail', p_gateway_status_detail,
        'applied_to_subscription_id', v_target.id,
        'canonical_access_subscription_id', v_target.id
      ),
      updated_at = v_now
  where id = v_payment.id;

  if v_target.id <> v_origin.id then
    update public.billing_subscriptions
    set status = case when status = 'pending' then 'expired' else status end,
        reservation_expires_at = null,
        canonical_access_subscription_id = v_target.id,
        canonicalized_at = coalesce(canonicalized_at, v_now),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'merged_into_subscription_id', v_target.id,
          'merged_payment_id', v_payment.id,
          'merged_at', v_now
        ),
        updated_at = v_now
    where id = v_origin.id;
  end if;

  if v_origin.reserved_invite_id is not null then
    update public.billing_plan_invites
    set used_at = coalesce(used_at, v_now), user_id = coalesce(user_id, v_origin.user_id)
    where id = v_origin.reserved_invite_id
      and (user_id is null or user_id = v_origin.user_id)
      and used_at is null;
  end if;

  select * into v_rebuild
  from public.rebuild_mercadopago_access_ledger(v_target.id, v_user_id, v_now)
  limit 1;

  -- v_origin was expired above before the ledger can activate v_target, so the
  -- unique one-active-subscription invariant is respected throughout.
  update public.billing_subscriptions
  set reservation_expires_at = null,
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      last_gateway_status = p_gateway_status,
      updated_at = v_now
  where id = v_target.id;

  payment_id := v_payment.id; applied_to_subscription_id := v_target.id;
  period_start := v_rebuild.period_start; period_end := v_rebuild.period_end; already_applied := false;
  return next;
end;
$$;

revoke all on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) from public;
grant execute on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) to service_role;
