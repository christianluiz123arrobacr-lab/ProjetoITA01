-- Version the canonical access RPC used by auth.getAccessStatus and record
-- safe Mercado Pago recovery diagnostics. This migration does not reconcile
-- or mutate existing payment status/access rows.

alter table public.billing_payments
  add column if not exists last_webhook_received_at timestamptz,
  add column if not exists gateway_last_checked_at timestamptz,
  add column if not exists gateway_last_status text,
  add column if not exists gateway_sync_attempts integer not null default 0;

create or replace function public.user_has_active_subscription(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.billing_subscriptions s
    where s.user_id = target_user_id
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end >= now())
  );
$$;

revoke all on function public.user_has_active_subscription(uuid) from public;
grant execute on function public.user_has_active_subscription(uuid) to service_role;

create index if not exists billing_payments_pending_gateway_recovery_idx
  on public.billing_payments(user_id, created_at desc)
  where gateway = 'mercadopago'
    and status = 'pending'
    and gateway_payment_id is not null;
