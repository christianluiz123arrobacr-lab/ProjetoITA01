-- Keep failed gateway compensations reconcilable without violating the v8
-- recurring-slot guard. Migrations 006-008 remain immutable.

create or replace function public.release_mercadopago_checkout_reservation(
  p_subscription_id uuid,
  p_reason text,
  p_gateway_reconciliation_status text default null,
  p_gateway_reconciliation_error text default null,
  p_gateway_subscription_id text default null,
  p_gateway_payment_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription public.billing_subscriptions%rowtype;
  v_reconciliation_status text;
  v_reconciliation_error text;
begin
  select * into v_subscription
  from public.billing_subscriptions
  where id = p_subscription_id
  for update;

  if v_subscription.id is null then
    raise exception 'checkout reservation not found';
  end if;
  if v_subscription.user_id is null then
    raise exception 'checkout reservation has no owner';
  end if;
  if v_subscription.gateway <> 'mercadopago' then
    raise exception 'checkout reservation gateway mismatch';
  end if;
  if v_subscription.status not in ('pending', 'failed')
     and coalesce(v_subscription.recurring_state, '') <> 'reconciliation_required' then
    raise exception 'checkout reservation is not releasable';
  end if;

  -- A retry without reconciliation arguments must never erase a previously
  -- recorded external-resource risk.
  v_reconciliation_status := coalesce(
    p_gateway_reconciliation_status,
    v_subscription.gateway_reconciliation_status
  );
  v_reconciliation_error := coalesce(
    left(p_gateway_reconciliation_error, 500),
    v_subscription.gateway_reconciliation_error
  );

  update public.billing_subscriptions
  set status = 'failed',
      reservation_expires_at = null,
      gateway_subscription_id = coalesce(p_gateway_subscription_id, gateway_subscription_id),
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      recurring_state = case
        when v_reconciliation_status is null then 'failed'
        else 'reconciliation_required'
      end,
      -- Reconciliation itself blocks replacement checkout. Keeping the slot
      -- active would violate v8 and is unnecessary.
      recurring_slot_active = false,
      checkout_creation_owner = null,
      checkout_creation_expires_at = null,
      gateway_reconciliation_status = v_reconciliation_status,
      gateway_reconciliation_error = v_reconciliation_error,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'failure_reason', left(coalesce(p_reason, 'Falha ao criar checkout Mercado Pago.'), 500),
        'reconciliation_required', v_reconciliation_status is not null,
        'gateway_subscription_id', coalesce(p_gateway_subscription_id, gateway_subscription_id),
        'gateway_payment_id', coalesce(p_gateway_payment_id, gateway_payment_id)
      ),
      updated_at = now()
  where id = p_subscription_id
    and user_id = v_subscription.user_id;

  if not found then
    raise exception 'checkout reservation release lost ownership';
  end if;
end;
$$;

revoke all on function public.release_mercadopago_checkout_reservation(uuid, text, text, text, text, text) from public;
grant execute on function public.release_mercadopago_checkout_reservation(uuid, text, text, text, text, text) to service_role;
