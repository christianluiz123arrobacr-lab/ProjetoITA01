drop index if exists public.billing_payments_pending_gateway_recovery_idx;
drop function if exists public.user_has_active_subscription(uuid);

alter table public.billing_payments
  drop column if exists gateway_sync_attempts,
  drop column if exists gateway_last_status,
  drop column if exists gateway_last_checked_at,
  drop column if exists last_webhook_received_at;
