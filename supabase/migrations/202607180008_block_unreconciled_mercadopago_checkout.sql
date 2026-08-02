-- Prevent a new recurring checkout while an external preapproval may still be
-- chargeable. Migration 007 and earlier files remain unchanged.

create or replace function public.block_mercadopago_slot_when_reconciliation_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.gateway = 'mercadopago'
     and new.metadata->>'payment_method' = 'card'
     and new.recurring_slot_active then
    if new.recurring_state = 'reconciliation_required' or new.gateway_reconciliation_status is not null then
      raise exception 'unresolved Mercado Pago reconciliation cannot own recurring slot';
    end if;
    if exists (
      select 1
      from public.billing_subscriptions existing
      where existing.user_id = new.user_id
        and existing.gateway = 'mercadopago'
        and existing.metadata->>'payment_method' = 'card'
        and existing.id <> new.id
        and (
          existing.recurring_state = 'reconciliation_required'
          or existing.gateway_reconciliation_status is not null
        )
    ) then
      raise exception 'unresolved Mercado Pago reconciliation blocks recurring checkout';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists billing_subscriptions_block_unreconciled_slot_v8
  on public.billing_subscriptions;

create trigger billing_subscriptions_block_unreconciled_slot_v8
before insert or update of recurring_slot_active, recurring_state, gateway_reconciliation_status
on public.billing_subscriptions
for each row execute function public.block_mercadopago_slot_when_reconciliation_pending();

revoke all on function public.block_mercadopago_slot_when_reconciliation_pending() from public;
grant execute on function public.block_mercadopago_slot_when_reconciliation_pending() to service_role;
