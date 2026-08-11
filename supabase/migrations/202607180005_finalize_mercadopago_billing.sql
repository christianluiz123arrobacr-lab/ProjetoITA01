-- Final Mercado Pago billing hardening: canonical access roots, lock ordering and webhook/payment idempotency.
-- Safe to apply after prior Mercado Pago billing migrations; does not rewrite old migrations.

alter table public.billing_subscriptions
  add column if not exists canonical_access_subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  add column if not exists canonicalized_at timestamptz;

create index if not exists billing_subscriptions_canonical_access_idx
  on public.billing_subscriptions(user_id, canonical_access_subscription_id)
  where gateway = 'mercadopago';

create index if not exists billing_payments_gateway_payment_applied_idx
  on public.billing_payments(gateway, gateway_payment_id, applied_to_subscription_id)
  where gateway_payment_id is not null;

update public.billing_subscriptions s
set canonical_access_subscription_id = coalesce(p.applied_to_subscription_id, s.canonical_access_subscription_id),
    canonicalized_at = coalesce(s.canonicalized_at, now()),
    updated_at = now()
from public.billing_payments p
where p.subscription_id = s.id
  and p.gateway = 'mercadopago'
  and p.applied_to_subscription_id is not null
  and s.canonical_access_subscription_id is null;

update public.billing_subscriptions
set canonical_access_subscription_id = id,
    canonicalized_at = coalesce(canonicalized_at, now()),
    updated_at = now()
where gateway = 'mercadopago'
  and canonical_access_subscription_id is null
  and status in ('active', 'trialing', 'overdue')
  and coalesce(current_period_end, now()) >= now();

with ranked as (
  select id,
         row_number() over (
           partition by user_id
           order by case status when 'active' then 0 when 'overdue' then 1 when 'pending' then 2 else 3 end,
                    coalesce(current_period_end, reservation_expires_at, created_at) desc,
                    created_at asc,
                    id asc
         ) as rn
  from public.billing_subscriptions
  where gateway = 'mercadopago'
    and metadata->>'payment_method' = 'card'
    and gateway_subscription_id is not null
    and status in ('pending', 'active', 'overdue', 'trialing')
)
update public.billing_subscriptions s
set status = case when s.status = 'active' and coalesce(s.current_period_end, now()) > now() then 'overdue' else 'failed' end,
    gateway_reconciliation_status = coalesce(s.gateway_reconciliation_status, 'duplicate_open_preapproval'),
    gateway_reconciliation_error = coalesce(s.gateway_reconciliation_error, 'Preapproval recorrente duplicado detectado por migration; requer reconciliação administrativa.'),
    updated_at = now()
from ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists billing_subscriptions_one_open_mercadopago_card_per_user_v5
  on public.billing_subscriptions(user_id)
  where gateway = 'mercadopago'
    and metadata->>'payment_method' = 'card'
    and gateway_subscription_id is not null
    and status in ('pending', 'active', 'overdue', 'trialing');

create or replace function public.mercadopago_user_lock_key(p_user_id uuid)
returns bigint
language sql
immutable
as $$
  select hashtextextended('mercadopago-user-ledger:' || p_user_id::text, 0);
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
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user_id));
  perform 1 from public.billing_subscriptions where id = p_subscription_id and user_id = p_user_id for update;

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
    for update
  loop
    v_cursor := greatest(v_payment.approved_at, coalesce(v_cursor, v_payment.approved_at));
    if v_first_start is null then v_first_start := v_cursor; end if;
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
        canonical_access_subscription_id = coalesce(canonical_access_subscription_id, id),
        canonicalized_at = coalesce(canonicalized_at, p_now),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('access_blocked_by_reversal', true),
        updated_at = p_now
    where id = p_subscription_id;
    subscription_id := p_subscription_id; period_start := null; period_end := p_now; payment_count := 0;
    return next; return;
  end if;

  update public.billing_subscriptions
  set status = case when v_last_end > p_now then 'active' else 'expired' end,
      current_period_start = v_first_start,
      current_period_end = v_last_end,
      next_due_date = case when v_last_end > p_now then v_last_end else null end,
      canonical_access_subscription_id = coalesce(canonical_access_subscription_id, id),
      canonicalized_at = coalesce(canonicalized_at, p_now),
      updated_at = p_now
  where id = p_subscription_id;

  subscription_id := p_subscription_id; period_start := v_first_start; period_end := v_last_end; payment_count := v_count;
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
  v_user_id uuid;
  v_origin_id uuid;
  v_payment public.billing_payments%rowtype;
  v_origin public.billing_subscriptions%rowtype;
  v_target public.billing_subscriptions%rowtype;
  v_now timestamptz := now();
  v_approved_at timestamptz;
  v_duration_value integer;
  v_duration_unit text;
  v_rebuild record;
begin
  select user_id, coalesce(original_subscription_id, subscription_id) into v_user_id, v_origin_id
  from public.billing_payments
  where id = p_payment_id;
  if v_user_id is null or v_origin_id is null then raise exception 'payment not found or missing origin'; end if;

  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id));

  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'payment not found'; end if;
  if v_payment.gateway <> 'mercadopago' then raise exception 'payment gateway mismatch'; end if;
  if p_gateway_payment_id is not null and v_payment.gateway_payment_id is not null and v_payment.gateway_payment_id <> p_gateway_payment_id then
    raise exception 'gateway payment mismatch';
  end if;

  select * into v_origin from public.billing_subscriptions where id = coalesce(v_payment.original_subscription_id, v_payment.subscription_id) and user_id = v_user_id for update;
  if v_origin.id is null then raise exception 'origin subscription not found'; end if;

  if v_payment.access_applied_at is not null then
    payment_id := v_payment.id; applied_to_subscription_id := v_payment.applied_to_subscription_id;
    period_start := v_payment.current_period_start; period_end := v_payment.current_period_end; already_applied := true;
    return next; return;
  end if;

  if v_origin.canonical_access_subscription_id is not null then
    select * into v_target from public.billing_subscriptions where id = v_origin.canonical_access_subscription_id and user_id = v_user_id for update;
  end if;

  if v_target.id is null then
    select * into v_target
    from public.billing_subscriptions
    where user_id = v_user_id
      and gateway = 'mercadopago'
      and status = 'active'
      and coalesce(current_period_end, '-infinity'::timestamptz) > v_now
    order by current_period_end desc, created_at asc, id asc
    limit 1
    for update;
  end if;

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
        'canonical_access_subscription_id', v_target.id,
        'access_duration_value', v_duration_value,
        'access_duration_unit', v_duration_unit
      ),
      updated_at = v_now
  where id = v_payment.id;

  if v_target.id <> v_origin.id then
    update public.billing_subscriptions
    set status = case when status = 'pending' then 'expired' else status end,
        reservation_expires_at = null,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('applied_to_subscription_id', v_target.id),
        updated_at = v_now
    where id = v_origin.id;
  end if;

  if v_origin.reserved_invite_id is not null then
    update public.billing_plan_invites
    set used_at = coalesce(used_at, v_now), user_id = coalesce(user_id, v_origin.user_id)
    where id = v_origin.reserved_invite_id and (user_id is null or user_id = v_origin.user_id) and used_at is null;
  end if;

  select * into v_rebuild from public.rebuild_mercadopago_access_ledger(v_target.id, v_user_id, v_now) limit 1;

  update public.billing_subscriptions
  set reservation_expires_at = null,
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      last_gateway_status = p_gateway_status,
      updated_at = v_now
  where id = v_target.id;

  payment_id := v_payment.id; applied_to_subscription_id := v_target.id; period_start := v_rebuild.period_start; period_end := v_rebuild.period_end; already_applied := false;
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

create or replace function public.reconcile_mercadopago_canonical_access(p_user_id uuid default null)
returns table(user_id uuid, canonical_subscription_id uuid, merged_subscriptions integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_canonical uuid;
  v_count integer;
begin
  for v_user in
    select distinct s.user_id from public.billing_subscriptions s
    where s.gateway = 'mercadopago' and (p_user_id is null or s.user_id = p_user_id)
  loop
    perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user.user_id));
    select id into v_canonical
    from public.billing_subscriptions
    where user_id = v_user.user_id and gateway = 'mercadopago' and status = 'active' and coalesce(current_period_end, '-infinity'::timestamptz) > now()
    order by current_period_end desc, created_at asc, id asc
    limit 1
    for update;

    if v_canonical is not null then
      update public.billing_subscriptions
      set canonical_access_subscription_id = v_canonical,
          canonicalized_at = coalesce(canonicalized_at, now()),
          status = case when id <> v_canonical and status = 'active' then 'expired' else status end,
          gateway_reconciliation_status = case when id <> v_canonical and status = 'active' then coalesce(gateway_reconciliation_status, 'merged_duplicate_access_root') else gateway_reconciliation_status end,
          updated_at = now()
      where user_id = v_user.user_id and gateway = 'mercadopago';
      get diagnostics v_count = row_count;
      perform public.rebuild_mercadopago_access_ledger(v_canonical, v_user.user_id, now());
      user_id := v_user.user_id; canonical_subscription_id := v_canonical; merged_subscriptions := greatest(v_count - 1, 0);
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.mercadopago_user_lock_key(uuid) from public;
revoke all on function public.rebuild_mercadopago_access_ledger(uuid, uuid, timestamptz) from public;
revoke all on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) from public;
revoke all on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) from public;
revoke all on function public.reconcile_mercadopago_canonical_access(uuid) from public;

grant execute on function public.mercadopago_user_lock_key(uuid) to service_role;
grant execute on function public.rebuild_mercadopago_access_ledger(uuid, uuid, timestamptz) to service_role;
grant execute on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) to service_role;
grant execute on function public.reconcile_mercadopago_canonical_access(uuid) to service_role;
