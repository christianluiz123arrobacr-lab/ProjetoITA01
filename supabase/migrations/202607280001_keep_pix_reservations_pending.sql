-- A Pix QR code is valid for 24 hours. Previously its subscription reservation
-- expired after 30 minutes, making an unpaid but still payable Pix disappear as
-- "pending" in the UI while the payment row remained pending.

with pending_pix as (
  select distinct on (bp.subscription_id) bp.subscription_id, bp.expires_at
  from public.billing_payments bp
  where bp.gateway = 'mercadopago'
    and bp.payment_method = 'mercadopago_pix'
    and bp.status = 'pending'
    and bp.expires_at > now()
  order by bp.subscription_id, bp.created_at desc
)
update public.billing_subscriptions s
set status = 'pending',
    reservation_expires_at = p.expires_at,
    updated_at = now()
from pending_pix p
where s.id = p.subscription_id
  and s.status = 'expired';

create or replace function public.expire_stale_billing_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.billing_subscriptions s
  set status = 'expired', reservation_expires_at = null, updated_at = now()
  where s.status = 'pending'
    and s.reservation_expires_at is not null
    and s.reservation_expires_at < now()
    and not exists (
      select 1
      from public.billing_payments bp
      where bp.subscription_id = s.id
        and bp.gateway = 'mercadopago'
        and bp.payment_method = 'mercadopago_pix'
        and bp.status = 'pending'
        and bp.expires_at > now()
    );
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_billing_reservations() from public;
grant execute on function public.expire_stale_billing_reservations() to service_role;
