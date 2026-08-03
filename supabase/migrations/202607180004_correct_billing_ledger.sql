-- Correct Mercado Pago access ledger, invite consumption, and canonical access locking.
-- This migration intentionally replaces functions from prior Mercado Pago hardening migrations.

alter table public.billing_payments
  add column if not exists access_duration_value integer,
  add column if not exists access_duration_unit text;

alter table public.billing_payments
  drop constraint if exists billing_payments_access_duration_unit_check;

alter table public.billing_payments
  add constraint billing_payments_access_duration_unit_check
  check (access_duration_unit is null or access_duration_unit in ('days', 'months'));

update public.billing_payments
set access_duration_value = coalesce(access_duration_value, case when payment_method = 'mercadopago_card' then 1 else 30 end),
    access_duration_unit = coalesce(access_duration_unit, case when payment_method = 'mercadopago_card' then 'months' else 'days' end)
where gateway = 'mercadopago';

create index if not exists billing_payments_ledger_order_idx
  on public.billing_payments(applied_to_subscription_id, approved_at, created_at, id)
  where access_applied_at is not null;

create or replace function public.add_billing_access_duration(
  p_base timestamptz,
  p_value integer,
  p_unit text
)
returns timestamptz
language plpgsql
immutable
as $$
begin
  if p_unit = 'months' then
    return p_base + make_interval(months => greatest(coalesce(p_value, 1), 1));
  end if;
  return p_base + make_interval(days => greatest(coalesce(p_value, 30), 1));
end;
$$;

create or replace function public.rebuild_mercadopago_access_ledger(
  p_subscription_id uuid,
  p_user_id uuid,
  p_now timestamptz default now()
)
returns table(subscription_id uuid, period_start timestamptz, period_end timestamptz, payment_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_cursor timestamptz;
  v_first_start timestamptz;
  v_last_end timestamptz;
  v_count integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('mercadopago-user-ledger:' || p_user_id::text, 0));
  perform 1 from public.billing_subscriptions where id = p_subscription_id for update;

  for v_payment in
    select id,
           coalesce(approved_at, access_applied_at, created_at, p_now) as approved_at,
           coalesce(access_duration_value, case when payment_method = 'mercadopago_card' then 1 else 30 end) as duration_value,
           coalesce(access_duration_unit, case when payment_method = 'mercadopago_card' then 'months' else 'days' end) as duration_unit
    from public.billing_payments
    where applied_to_subscription_id = p_subscription_id
      and status = 'approved'
      and access_applied_at is not null
      and refunded_at is null
    order by coalesce(approved_at, access_applied_at, created_at, p_now), created_at, id
  loop
    v_cursor := greatest(v_payment.approved_at, coalesce(v_cursor, v_payment.approved_at));
    if v_first_start is null then
      v_first_start := v_cursor;
    end if;
    v_last_end := public.add_billing_access_duration(v_cursor, v_payment.duration_value, v_payment.duration_unit);

    update public.billing_payments
    set current_period_start = v_cursor,
        current_period_end = v_last_end,
        updated_at = p_now
    where id = v_payment.id;

    v_cursor := v_last_end;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    update public.billing_subscriptions
    set status = 'expired',
        current_period_start = null,
        current_period_end = least(coalesce(current_period_end, p_now), p_now),
        next_due_date = null,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('access_blocked_by_reversal', true),
        updated_at = p_now
    where id = p_subscription_id;

    subscription_id := p_subscription_id;
    period_start := null;
    period_end := p_now;
    payment_count := 0;
    return next;
    return;
  end if;

  update public.billing_subscriptions
  set status = case when v_last_end > p_now then 'active' else 'expired' end,
      current_period_start = v_first_start,
      current_period_end = v_last_end,
      next_due_date = case when v_last_end > p_now then v_last_end else null end,
      updated_at = p_now
  where id = p_subscription_id;

  subscription_id := p_subscription_id;
  period_start := v_first_start;
  period_end := v_last_end;
  payment_count := v_count;
  return next;
end;
$$;

create or replace function public.apply_approved_mercadopago_payment(
  p_payment_id uuid,
  p_gateway_payment_id text,
  p_gateway_status text,
  p_gateway_status_detail text,
  p_date_approved timestamptz default null,
  p_access_days integer default 30
)
returns table(payment_id uuid, applied_to_subscription_id uuid, period_start timestamptz, period_end timestamptz, already_applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.billing_payments%rowtype;
  v_origin public.billing_subscriptions%rowtype;
  v_target public.billing_subscriptions%rowtype;
  v_now timestamptz := now();
  v_approved_at timestamptz;
  v_duration_value integer;
  v_duration_unit text;
  v_rebuild record;
begin
  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'payment not found'; end if;
  if v_payment.gateway <> 'mercadopago' then raise exception 'payment gateway mismatch'; end if;
  if p_gateway_payment_id is not null and v_payment.gateway_payment_id is not null and v_payment.gateway_payment_id <> p_gateway_payment_id then
    raise exception 'gateway payment mismatch';
  end if;

  select * into v_origin
  from public.billing_subscriptions
  where id = coalesce(v_payment.original_subscription_id, v_payment.subscription_id)
  for update;
  if v_origin.id is null then raise exception 'origin subscription not found'; end if;

  perform pg_advisory_xact_lock(hashtextextended('mercadopago-user-ledger:' || v_origin.user_id::text, 0));

  if v_payment.access_applied_at is not null then
    payment_id := v_payment.id;
    applied_to_subscription_id := v_payment.applied_to_subscription_id;
    period_start := v_payment.current_period_start;
    period_end := v_payment.current_period_end;
    already_applied := true;
    return next;
    return;
  end if;

  if v_payment.payment_method = 'mercadopago_pix' then
    select * into v_target
    from public.billing_subscriptions
    where user_id = v_origin.user_id
      and gateway = 'mercadopago'
      and status = 'active'
      and coalesce(current_period_end, '-infinity'::timestamptz) > v_now
    order by current_period_end desc, created_at asc, id asc
    limit 1
    for update;
    if v_target.id is null then
      v_target := v_origin;
    end if;
  else
    if v_origin.status = 'pending' then
      select * into v_target
      from public.billing_subscriptions
      where user_id = v_origin.user_id
        and gateway = 'mercadopago'
        and status = 'active'
        and coalesce(current_period_end, '-infinity'::timestamptz) > v_now
      order by current_period_end desc, created_at asc, id asc
      limit 1
      for update;
    end if;
    if v_target.id is null then
      v_target := v_origin;
    end if;
  end if;

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
        'access_duration_value', v_duration_value,
        'access_duration_unit', v_duration_unit
      ),
      updated_at = v_now
  where id = v_payment.id;

  if v_target.id <> v_origin.id then
    update public.billing_subscriptions
    set status = 'expired',
        reservation_expires_at = null,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('applied_to_subscription_id', v_target.id),
        updated_at = v_now
    where id = v_origin.id;
  end if;

  if v_origin.reserved_invite_id is not null then
    update public.billing_plan_invites
    set used_at = coalesce(used_at, v_now), user_id = coalesce(user_id, v_origin.user_id)
    where id = v_origin.reserved_invite_id and (user_id is null or user_id = v_origin.user_id);
  end if;

  select * into v_rebuild
  from public.rebuild_mercadopago_access_ledger(v_target.id, v_origin.user_id, v_now)
  limit 1;

  update public.billing_subscriptions
  set reservation_expires_at = null,
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      last_gateway_status = p_gateway_status,
      updated_at = v_now
  where id = v_target.id;

  payment_id := v_payment.id;
  applied_to_subscription_id := v_target.id;
  period_start := v_rebuild.period_start;
  period_end := v_rebuild.period_end;
  already_applied := false;
  return next;
end;
$$;

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
  v_payment public.billing_payments%rowtype;
  v_target_id uuid;
  v_user_id uuid;
  v_now timestamptz := now();
  v_rebuild record;
begin
  if p_payment_status not in ('refunded', 'chargeback') then
    raise exception 'invalid reversal status';
  end if;

  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'payment not found'; end if;

  v_target_id := coalesce(v_payment.applied_to_subscription_id, v_payment.subscription_id);
  if v_target_id is null then raise exception 'target subscription not found'; end if;

  select user_id into v_user_id from public.billing_subscriptions where id = v_target_id for update;
  if v_user_id is null then raise exception 'target subscription not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mercadopago-user-ledger:' || v_user_id::text, 0));

  update public.billing_payments
  set status = p_payment_status,
      refunded_at = coalesce(refunded_at, v_now),
      reversal_applied_at = coalesce(reversal_applied_at, v_now),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'gateway_status', p_gateway_status,
        'gateway_status_detail', p_gateway_status_detail,
        'reversal_reason', p_payment_status
      ),
      updated_at = v_now
  where id = v_payment.id;

  select * into v_rebuild
  from public.rebuild_mercadopago_access_ledger(v_target_id, v_user_id, v_now)
  limit 1;

  if p_payment_status = 'chargeback' then
    update public.billing_subscriptions
    set status = case when coalesce(current_period_end, v_now) > v_now then status else 'expired' end,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('blocked_by_chargeback_payment_id', p_payment_id),
        last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
  else
    update public.billing_subscriptions
    set last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
  end if;

  payment_id := v_payment.id;
  subscription_id := v_target_id;
  recalculated_period_end := v_rebuild.period_end;
  return next;
end;
$$;

create or replace function public.reserve_mercadopago_checkout(
  p_user_id uuid,
  p_user_email text,
  p_plan_id uuid,
  p_payment_method text,
  p_reservation_expires_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns table(subscription_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.billing_plans%rowtype;
  v_invite public.billing_plan_invites%rowtype;
  v_active_count integer;
  v_subscription_id uuid;
begin
  perform public.expire_stale_billing_reservations();
  perform pg_advisory_xact_lock(hashtextextended('mercadopago-user-ledger:' || p_user_id::text, 0));

  select * into v_plan from public.billing_plans where id = p_plan_id and is_active = true for update;
  if v_plan.id is null then raise exception 'Plano indisponível.'; end if;

  if v_plan.invite_only then
    select * into v_invite
    from public.billing_plan_invites i
    where i.plan_id = p_plan_id
      and (i.user_id is null or i.user_id = p_user_id)
      and (i.email is null or lower(i.email) = lower(p_user_email))
      and i.used_at is null
      and (i.expires_at is null or i.expires_at > now())
      and not exists (
        select 1 from public.billing_subscriptions s
        where s.reserved_invite_id = i.id
          and s.user_id <> p_user_id
          and s.status = 'pending'
          and coalesce(s.reservation_expires_at, '-infinity'::timestamptz) > now()
      )
    order by i.created_at asc
    limit 1
    for update;

    if v_invite.id is null then raise exception 'Convite inválido, expirado ou já reservado.'; end if;
  end if;

  if v_plan.max_active_subscriptions is not null then
    select count(*) into v_active_count
    from public.billing_subscriptions
    where plan_id = p_plan_id
      and status in ('active', 'trialing', 'overdue', 'pending')
      and (status <> 'pending' or coalesce(reservation_expires_at, '-infinity'::timestamptz) > now());
    if v_active_count >= v_plan.max_active_subscriptions then raise exception 'Não há vagas disponíveis para este plano.'; end if;
  end if;

  insert into public.billing_subscriptions(
    user_id, plan_id, status, gateway, reservation_expires_at, reserved_invite_id, metadata
  ) values (
    p_user_id, p_plan_id, 'pending', 'mercadopago', p_reservation_expires_at, v_invite.id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('reserved_invite_id', v_invite.id)
  ) returning id into v_subscription_id;

  subscription_id := v_subscription_id;
  return next;
end;
$$;

revoke all on function public.add_billing_access_duration(timestamptz, integer, text) from public;
revoke all on function public.rebuild_mercadopago_access_ledger(uuid, uuid, timestamptz) from public;
revoke all on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) from public;
revoke all on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) from public;
revoke all on function public.reserve_mercadopago_checkout(uuid, text, uuid, text, timestamptz, jsonb) from public;

grant execute on function public.add_billing_access_duration(timestamptz, integer, text) to service_role;
grant execute on function public.rebuild_mercadopago_access_ledger(uuid, uuid, timestamptz) to service_role;
grant execute on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) to service_role;
grant execute on function public.reserve_mercadopago_checkout(uuid, text, uuid, text, timestamptz, jsonb) to service_role;
