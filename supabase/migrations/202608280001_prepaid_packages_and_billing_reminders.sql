-- Additive Billing stage 2. Review before applying to production.

alter table public.profiles
  add column if not exists billing_whatsapp_opt_in boolean not null default false;

create table if not exists public.billing_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  notification_type text not null check (notification_type in ('expires_in_2_days', 'expires_in_1_day', 'expired_today')),
  due_date date not null,
  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  recipient_phone text,
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create unique index if not exists billing_notification_log_unique_reminder
  on public.billing_notification_log(user_id, notification_type, due_date, channel);
create index if not exists billing_notification_log_admin_idx
  on public.billing_notification_log(created_at desc);

alter table public.billing_notification_log enable row level security;
revoke all on public.billing_notification_log from anon, authenticated;

-- The previous applier defaults legacy Pix records to days. Prepaid records
-- already carry months in the ledger; this wrapper restores that duration and
-- rebuilds the canonical ledger in the same server-side operation.
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
