-- Separate recurring gateway lifecycle from paid-access lifecycle and close the
-- checkout race that exists while /preapproval is being created.

alter table public.billing_subscriptions
  add column if not exists recurring_state text,
  add column if not exists recurring_slot_active boolean not null default false,
  add column if not exists checkout_creation_owner uuid,
  add column if not exists checkout_creation_expires_at timestamptz;

do $$ begin
  alter table public.billing_subscriptions
    add constraint billing_subscriptions_recurring_state_v6_check
    check (recurring_state is null or recurring_state in
      ('creating', 'pending', 'authorized', 'paused', 'canceled', 'finished', 'failed', 'reconciliation_required'));
exception when duplicate_object then null;
end $$;

update public.billing_subscriptions
set recurring_state = case
      when gateway_reconciliation_status is not null then 'reconciliation_required'
      when lower(coalesce(last_gateway_status, '')) in ('authorized', 'active') then 'authorized'
      when lower(coalesce(last_gateway_status, '')) = 'paused' then 'paused'
      when lower(coalesce(last_gateway_status, '')) in ('cancelled', 'canceled') then 'canceled'
      when lower(coalesce(last_gateway_status, '')) = 'finished' then 'finished'
      when gateway_subscription_id is null and status = 'pending' then 'creating'
      when gateway_subscription_id is not null then 'pending'
      else 'failed'
    end,
    recurring_slot_active = case
      when gateway_reconciliation_status is not null then false
      when lower(coalesce(last_gateway_status, '')) in ('cancelled', 'canceled', 'finished') then false
      else true
    end,
    updated_at = now()
where gateway = 'mercadopago'
  and metadata->>'payment_method' = 'card'
  and recurring_state is null;

drop index if exists public.billing_subscriptions_one_open_mercadopago_card_per_user_v5;

-- Keep one deterministic local owner. External duplicates remain explicitly
-- reconcilable; SQL deliberately does not pretend to cancel gateway resources.
with ranked as (
  select s.id,
         row_number() over (
           partition by s.user_id
           order by
             case s.recurring_state when 'authorized' then 0 when 'pending' then 1 when 'creating' then 2 else 3 end,
             case when exists (
               select 1 from public.billing_payments p
               where coalesce(p.original_subscription_id, p.subscription_id) = s.id
                 and p.status = 'approved' and p.access_applied_at is not null
             ) then 0 else 1 end,
             s.created_at, s.id
         ) rn
  from public.billing_subscriptions s
  where s.gateway = 'mercadopago'
    and s.metadata->>'payment_method' = 'card'
    and s.recurring_slot_active
)
update public.billing_subscriptions s
set recurring_slot_active = false,
    recurring_state = 'reconciliation_required',
    gateway_reconciliation_status = coalesce(s.gateway_reconciliation_status, 'duplicate_gateway_preapproval'),
    gateway_reconciliation_error = coalesce(s.gateway_reconciliation_error, 'Recorrência externa duplicada; confirmar cancelamento no Mercado Pago.'),
    updated_at = now()
from ranked r where r.id = s.id and r.rn > 1;

create unique index if not exists billing_subscriptions_one_recurring_slot_per_user_v6
  on public.billing_subscriptions(user_id)
  where gateway = 'mercadopago'
    and metadata->>'payment_method' = 'card'
    and recurring_slot_active;

create index if not exists billing_subscriptions_recurring_lookup_v6
  on public.billing_subscriptions(user_id, recurring_state, canonical_access_subscription_id)
  where gateway = 'mercadopago' and metadata->>'payment_method' = 'card';

create or replace function public.reserve_mercadopago_recurring_checkout_slot(
  p_user_id uuid,
  p_user_email text,
  p_plan_id uuid,
  p_creation_owner uuid,
  p_creation_expires_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns table(subscription_id uuid, should_create boolean, gateway_subscription_id text, payment_url text)
language plpgsql security definer set search_path = public
as $$
declare
  v_slot public.billing_subscriptions%rowtype;
  v_reserved record;
begin
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user_id));

  select * into v_slot
  from public.billing_subscriptions s
  where s.user_id = p_user_id and s.gateway = 'mercadopago'
    and s.metadata->>'payment_method' = 'card' and s.recurring_slot_active
  order by s.created_at, s.id limit 1 for update;

  if v_slot.id is not null then
    if v_slot.gateway_subscription_id is not null
       or coalesce(v_slot.checkout_creation_expires_at, '-infinity'::timestamptz) > now() then
      subscription_id := v_slot.id; should_create := false;
      gateway_subscription_id := v_slot.gateway_subscription_id; payment_url := v_slot.payment_url;
      return next; return;
    end if;

    update public.billing_subscriptions
    set recurring_state = 'creating', checkout_creation_owner = p_creation_owner,
        checkout_creation_expires_at = p_creation_expires_at,
        reservation_expires_at = p_creation_expires_at, updated_at = now()
    where id = v_slot.id;
    subscription_id := v_slot.id; should_create := true;
    gateway_subscription_id := null; payment_url := v_slot.payment_url;
    return next; return;
  end if;

  select * into v_reserved from public.reserve_mercadopago_checkout(
    p_user_id, p_user_email, p_plan_id, 'card', p_creation_expires_at, p_metadata
  ) limit 1;

  update public.billing_subscriptions
  set recurring_state = 'creating', recurring_slot_active = true,
      checkout_creation_owner = p_creation_owner,
      checkout_creation_expires_at = p_creation_expires_at, updated_at = now()
  where id = v_reserved.subscription_id;

  subscription_id := v_reserved.subscription_id; should_create := true;
  gateway_subscription_id := null; payment_url := null;
  return next;
end;
$$;

create or replace function public.complete_mercadopago_recurring_checkout_slot(
  p_subscription_id uuid,
  p_creation_owner uuid,
  p_gateway_subscription_id text,
  p_gateway_status text,
  p_payment_url text
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.billing_subscriptions
  set gateway_subscription_id = p_gateway_subscription_id,
      last_gateway_status = p_gateway_status,
      recurring_state = case lower(coalesce(p_gateway_status, ''))
        when 'authorized' then 'authorized' when 'active' then 'authorized' when 'paused' then 'paused'
        when 'cancelled' then 'canceled' when 'canceled' then 'canceled'
        when 'finished' then 'finished' else 'pending' end,
      payment_url = p_payment_url,
      checkout_creation_owner = null, checkout_creation_expires_at = null,
      updated_at = now()
  where id = p_subscription_id and recurring_slot_active
    and checkout_creation_owner = p_creation_owner and recurring_state = 'creating';
  if not found then raise exception 'recurring checkout slot ownership lost'; end if;
end;
$$;

create or replace function public.release_mercadopago_checkout_reservation(
  p_subscription_id uuid, p_reason text,
  p_gateway_reconciliation_status text default null,
  p_gateway_reconciliation_error text default null,
  p_gateway_subscription_id text default null,
  p_gateway_payment_id text default null
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.billing_subscriptions
  set status = 'failed', reservation_expires_at = null,
      gateway_subscription_id = coalesce(p_gateway_subscription_id, gateway_subscription_id),
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      recurring_state = case when p_gateway_reconciliation_status is null then 'failed' else 'reconciliation_required' end,
      recurring_slot_active = p_gateway_reconciliation_status is not null,
      checkout_creation_owner = null, checkout_creation_expires_at = null,
      gateway_reconciliation_status = p_gateway_reconciliation_status,
      gateway_reconciliation_error = left(p_gateway_reconciliation_error, 500),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'failure_reason', left(coalesce(p_reason, 'Falha ao criar checkout Mercado Pago.'), 500),
        'reconciliation_required', p_gateway_reconciliation_status is not null), updated_at = now()
  where id = p_subscription_id;
  if not found then raise exception 'checkout reservation not found'; end if;
end;
$$;

-- Merge access roots without losing approved ledger entries. Gateway recurring
-- state is intentionally untouched because only a verified API call may change it.
create or replace function public.reconcile_mercadopago_canonical_access(p_user_id uuid default null)
returns table(user_id uuid, canonical_subscription_id uuid, merged_subscriptions integer)
language plpgsql security definer set search_path = public
as $$
declare v_user record; v_canonical uuid; v_count integer;
begin
  for v_user in select distinct s.user_id from public.billing_subscriptions s
    where s.gateway = 'mercadopago' and (p_user_id is null or s.user_id = p_user_id)
  loop
    perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user.user_id));
    perform 1 from public.billing_subscriptions where billing_subscriptions.user_id = v_user.user_id for update;
    perform 1 from public.billing_payments where billing_payments.user_id = v_user.user_id for update;

    select coalesce(s.canonical_access_subscription_id, s.id) into v_canonical
    from public.billing_subscriptions s
    where s.user_id = v_user.user_id and s.gateway = 'mercadopago'
      and exists (select 1 from public.billing_payments p where p.applied_to_subscription_id = s.id and p.status = 'approved' and p.access_applied_at is not null and p.refunded_at is null)
    order by case when s.status = 'active' and coalesce(s.current_period_end, '-infinity') > now() then 0 else 1 end,
             s.created_at, s.id limit 1;

    if v_canonical is not null then
      update public.billing_payments p set
        original_subscription_id = coalesce(p.original_subscription_id, p.subscription_id),
        applied_to_subscription_id = v_canonical, updated_at = now()
      where p.user_id = v_user.user_id and p.applied_to_subscription_id is not null
        and p.status = 'approved' and p.access_applied_at is not null and p.refunded_at is null;

      update public.billing_subscriptions s set
        canonical_access_subscription_id = v_canonical, canonicalized_at = coalesce(s.canonicalized_at, now()),
        status = case when s.id <> v_canonical and s.status = 'active' then 'expired' else s.status end,
        updated_at = now()
      where s.user_id = v_user.user_id and s.gateway = 'mercadopago';
      get diagnostics v_count = row_count;
      perform public.rebuild_mercadopago_access_ledger(v_canonical, v_user.user_id, now());
      user_id := v_user.user_id; canonical_subscription_id := v_canonical; merged_subscriptions := greatest(v_count - 1, 0);
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.reserve_mercadopago_recurring_checkout_slot(uuid, text, uuid, uuid, timestamptz, jsonb) from public;
revoke all on function public.complete_mercadopago_recurring_checkout_slot(uuid, uuid, text, text, text) from public;
revoke all on function public.reconcile_mercadopago_canonical_access(uuid) from public;
grant execute on function public.reserve_mercadopago_recurring_checkout_slot(uuid, text, uuid, uuid, timestamptz, jsonb) to service_role;
grant execute on function public.complete_mercadopago_recurring_checkout_slot(uuid, uuid, text, text, text) to service_role;
grant execute on function public.reconcile_mercadopago_canonical_access(uuid) to service_role;
