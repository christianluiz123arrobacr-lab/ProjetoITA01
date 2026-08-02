-- Mercado Pago billing support. Additive only; do not run directly in production without review.

alter table if exists public.billing_subscriptions
  add column if not exists gateway text not null default 'manual',
  add column if not exists gateway_customer_id text,
  add column if not exists gateway_subscription_id text,
  add column if not exists gateway_payment_id text,
  add column if not exists payment_url text,
  add column if not exists last_gateway_status text,
  add column if not exists started_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists next_due_date timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'billing_subscriptions_gateway_check'
  ) then
    alter table public.billing_subscriptions
      add constraint billing_subscriptions_gateway_check
      check (gateway in ('manual', 'mercadopago'));
  end if;
end $$;

create unique index if not exists billing_subscriptions_one_active_recurring_per_user
on public.billing_subscriptions(user_id)
where gateway = 'mercadopago'
  and status in ('active', 'trialing', 'overdue')
  and (cancel_at_period_end = false or cancel_at_period_end is null);

create index if not exists billing_subscriptions_gateway_subscription_id_idx
on public.billing_subscriptions(gateway_subscription_id)
where gateway_subscription_id is not null;

create index if not exists billing_subscriptions_reservation_expires_at_idx
on public.billing_subscriptions(reservation_expires_at)
where reservation_expires_at is not null;

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.billing_plans(id) on delete set null,
  gateway text not null default 'mercadopago' check (gateway in ('manual', 'mercadopago')),
  gateway_payment_id text,
  payment_method text not null check (payment_method in ('manual_pix', 'mercadopago_pix', 'mercadopago_card')),
  status text not null check (status in ('pending', 'approved', 'rejected', 'expired', 'refunded', 'chargeback', 'failed')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  payment_url text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  expires_at timestamptz,
  approved_at timestamptz,
  refunded_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_payments_gateway_payment_id_unique
on public.billing_payments(gateway, gateway_payment_id)
where gateway_payment_id is not null;

create index if not exists billing_payments_user_created_idx on public.billing_payments(user_id, created_at desc);
create index if not exists billing_payments_subscription_idx on public.billing_payments(subscription_id);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  resource_id text,
  request_id text,
  status text not null default 'received' check (status in ('received', 'processed', 'failed')),
  attempts integer not null default 1,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, event_id)
);

create index if not exists billing_webhook_events_resource_idx
on public.billing_webhook_events(provider, resource_id);

alter table public.billing_payments enable row level security;
alter table public.billing_webhook_events enable row level security;

drop policy if exists "billing_payments_select_own_or_admin" on public.billing_payments;
create policy "billing_payments_select_own_or_admin"
on public.billing_payments
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "billing_payments_admin_all" on public.billing_payments;
create policy "billing_payments_admin_all"
on public.billing_payments
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Webhook events are backend-only via service role; no authenticated client policy is created intentionally.
revoke all on public.billing_webhook_events from anon, authenticated;
grant select on public.billing_payments to authenticated;

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
  set status = 'expired', updated_at = now()
  where status = 'pending'
    and reservation_expires_at is not null
    and reservation_expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_billing_reservations() from public;
