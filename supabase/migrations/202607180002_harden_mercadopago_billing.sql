-- Harden Mercado Pago billing after initial rollout. Additive/corrective only.

-- Keep legacy gateway values readable while still constraining known integrations.
alter table if exists public.billing_subscriptions
  drop constraint if exists billing_subscriptions_gateway_check;
alter table if exists public.billing_subscriptions
  add constraint billing_subscriptions_gateway_check
  check (gateway in ('manual', 'mercadopago', 'asaas', 'stripe'));

alter table if exists public.billing_payments
  drop constraint if exists billing_payments_gateway_check;
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'billing_payments') then
    alter table public.billing_payments
      add constraint billing_payments_gateway_check
      check (gateway in ('manual', 'mercadopago', 'asaas', 'stripe'));
  end if;
exception when duplicate_object then null;
end $$;

-- The first index name said recurring but applied to every Mercado Pago active row.
-- Recreate it with an explicit card-recurring predicate so Pix access extensions do not conflict.
drop index if exists public.billing_subscriptions_one_active_recurring_per_user;
create unique index if not exists billing_subscriptions_one_active_mercadopago_card_per_user
on public.billing_subscriptions(user_id)
where gateway = 'mercadopago'
  and status in ('active', 'trialing', 'overdue')
  and coalesce(metadata->>'payment_method', '') = 'card'
  and (cancel_at_period_end = false or cancel_at_period_end is null);

-- Webhook processing has an explicit claim state now.
alter table if exists public.billing_webhook_events
  drop constraint if exists billing_webhook_events_status_check;
alter table if exists public.billing_webhook_events
  add constraint billing_webhook_events_status_check
  check (status in ('received', 'processing', 'processed', 'failed'));

create index if not exists billing_webhook_events_status_retry_idx
on public.billing_webhook_events(provider, status, created_at)
where status in ('received', 'processing', 'failed');

-- Track successful approved payment application independently from gateway id uniqueness.
create index if not exists billing_payments_subscription_status_idx
on public.billing_payments(subscription_id, status, created_at desc);

-- Make stale reservation expiry callable by backend before every checkout attempt.
create or replace function public.expire_stale_billing_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.billing_subscriptions
  set status = 'expired', reservation_expires_at = null, updated_at = now()
  where status = 'pending'
    and reservation_expires_at is not null
    and reservation_expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_billing_reservations() from public;

-- Atomic checkout reservation. It locks the plan row, expires old reservations,
-- counts paid subscriptions and unexpired reservations, and consumes an invite only
-- after the reservation insert succeeds.
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
  plan_record public.billing_plans%rowtype;
  active_or_reserved_count integer;
  invite_record public.billing_plan_invites%rowtype;
  new_subscription_id uuid;
begin
  perform public.expire_stale_billing_reservations();

  select * into plan_record
  from public.billing_plans
  where id = p_plan_id
  for update;

  if not found or coalesce(plan_record.is_active, false) = false then
    raise exception 'Plano indisponível.' using errcode = 'P0001';
  end if;

  if p_payment_method not in ('card', 'pix') then
    raise exception 'Método de pagamento inválido.' using errcode = 'P0001';
  end if;

  if plan_record.max_active_subscriptions is not null then
    select count(*) into active_or_reserved_count
    from public.billing_subscriptions s
    where s.plan_id = p_plan_id
      and (
        s.status in ('active', 'trialing', 'overdue', 'manual_review')
        or (s.status = 'pending' and s.reservation_expires_at is not null and s.reservation_expires_at > now())
      );

    if active_or_reserved_count >= plan_record.max_active_subscriptions then
      raise exception 'Este plano atingiu o limite de vagas disponível no momento.' using errcode = 'P0001';
    end if;
  end if;

  if coalesce(plan_record.invite_only, false) then
    select * into invite_record
    from public.billing_plan_invites i
    where i.plan_id = p_plan_id
      and i.used_at is null
      and (i.expires_at is null or i.expires_at >= now())
      and (
        i.user_id = p_user_id
        or (i.email is not null and lower(i.email) = lower(coalesce(p_user_email, '')))
      )
    order by i.created_at asc
    limit 1
    for update;

    if not found then
      raise exception 'Este plano exige convite válido.' using errcode = 'P0001';
    end if;
  end if;

  insert into public.billing_subscriptions(
    user_id,
    plan_id,
    status,
    gateway,
    reservation_expires_at,
    metadata
  ) values (
    p_user_id,
    p_plan_id,
    'pending',
    'mercadopago',
    p_reservation_expires_at,
    p_metadata
  )
  returning id into new_subscription_id;

  if invite_record.id is not null then
    update public.billing_plan_invites
    set used_at = now(), user_id = coalesce(user_id, p_user_id)
    where id = invite_record.id and used_at is null;
  end if;

  subscription_id := new_subscription_id;
  return next;
end;
$$;

revoke all on function public.reserve_mercadopago_checkout(uuid, text, uuid, text, timestamptz, jsonb) from public;
