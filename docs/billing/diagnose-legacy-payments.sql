-- Read-only diagnosis: an access record is not proof of payment.
-- Run only against an explicitly approved environment. Do not backfill from
-- plan prices, access duration, subscription status or estimated totals.
select s.gateway, count(*) as subscriptions_without_payment_rows
from public.billing_subscriptions s
where not exists (
 select 1 from public.billing_payments p
 where p.subscription_id=s.id or p.original_subscription_id=s.id or p.applied_to_subscription_id=s.id
)
group by s.gateway;

-- A gateway identifier is a reconciliation candidate, not financial proof.
-- Verify the provider's amount, currency, owner and final status before any
-- separately reviewed migration. No data mutation is performed here.
select s.id as subscription_id,s.user_id,s.gateway,s.gateway_payment_id,s.gateway_subscription_id
from public.billing_subscriptions s
where (s.gateway_payment_id is not null or s.gateway_subscription_id is not null)
 and not exists(select 1 from public.billing_payments p where p.user_id=s.user_id);
