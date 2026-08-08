-- Final hardening for Mercado Pago billing flows.
-- Keeps already-applied migrations compatible and adds atomic RPCs used by the backend service.

alter table public.billing_payments
  add column if not exists original_subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  add column if not exists access_applied_at timestamptz,
  add column if not exists applied_to_subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  add column if not exists gateway_reconciliation_status text,
  add column if not exists gateway_reconciliation_error text,
  add column if not exists reversal_applied_at timestamptz;

update public.billing_payments
set original_subscription_id = coalesce(original_subscription_id, subscription_id)
where original_subscription_id is null and subscription_id is not null;

alter table public.billing_subscriptions
  add column if not exists reserved_invite_id uuid references public.billing_plan_invites(id) on delete set null,
  add column if not exists gateway_reconciliation_status text,
  add column if not exists gateway_reconciliation_error text;

alter table public.billing_webhook_events
  add column if not exists processing_started_at timestamptz,
  add column if not exists processing_lease_until timestamptz;

create index if not exists billing_payments_gateway_payment_unique_idx
  on public.billing_payments(gateway, gateway_payment_id)
  where gateway_payment_id is not null;

create index if not exists billing_payments_access_application_idx
  on public.billing_payments(applied_to_subscription_id, access_applied_at)
  where access_applied_at is not null;

create index if not exists billing_subscriptions_reserved_invite_idx
  on public.billing_subscriptions(reserved_invite_id)
  where reserved_invite_id is not null;

create index if not exists billing_webhook_processing_lease_idx
  on public.billing_webhook_events(provider, status, processing_lease_until);

create or replace function public.claim_mercadopago_webhook_event(
  p_event_id text,
  p_event_type text,
  p_resource_id text,
  p_request_id text,
  p_payload jsonb default '{}'::jsonb,
  p_processing_lease_seconds integer default 120
)
returns table(id uuid, claim_status text, attempts integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.billing_webhook_events%rowtype;
  v_lease_seconds integer := greatest(coalesce(p_processing_lease_seconds, 120), 30);
begin
  if coalesce(trim(p_event_id), '') = '' then
    raise exception 'event id is required';
  end if;

  perform pg_advisory_xact_lock(hashtext('mercadopago-webhook:' || p_event_id));

  insert into public.billing_webhook_events(
    provider, event_id, event_type, resource_id, request_id, status, attempts, payload,
    processing_started_at, processing_lease_until, error_message
  ) values (
    'mercadopago', p_event_id, p_event_type, p_resource_id, p_request_id, 'processing', 1, p_payload,
    now(), now() + make_interval(secs => v_lease_seconds), null
  )
  on conflict (provider, event_id) do nothing
  returning * into v_event;

  if v_event.id is not null then
    id := v_event.id;
    claim_status := 'claimed';
    attempts := v_event.attempts;
    return next;
    return;
  end if;

  select * into v_event
  from public.billing_webhook_events
  where provider = 'mercadopago' and event_id = p_event_id
  for update;

  if v_event.id is null then
    raise exception 'webhook event could not be claimed';
  end if;

  if v_event.status = 'processed' then
    id := v_event.id;
    claim_status := 'already_processed';
    attempts := v_event.attempts;
    return next;
    return;
  end if;

  if v_event.status = 'processing' and coalesce(v_event.processing_lease_until, v_event.processing_started_at + interval '2 minutes') > now() then
    id := v_event.id;
    claim_status := 'already_processing';
    attempts := v_event.attempts;
    return next;
    return;
  end if;

  update public.billing_webhook_events
  set status = 'processing',
      attempts = coalesce(attempts, 0) + 1,
      event_type = coalesce(p_event_type, event_type),
      resource_id = coalesce(p_resource_id, resource_id),
      request_id = coalesce(p_request_id, request_id),
      payload = coalesce(p_payload, payload),
      processing_started_at = now(),
      processing_lease_until = now() + make_interval(secs => v_lease_seconds),
      error_message = null
  where billing_webhook_events.id = v_event.id
  returning * into v_event;

  id := v_event.id;
  claim_status := case when v_event.attempts > 1 then 'retryable_failed' else 'claimed' end;
  attempts := v_event.attempts;
  return next;
end;
$$;

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
begin
  update public.billing_subscriptions
  set status = 'failed',
      reservation_expires_at = null,
      gateway_subscription_id = coalesce(p_gateway_subscription_id, gateway_subscription_id),
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      gateway_reconciliation_status = p_gateway_reconciliation_status,
      gateway_reconciliation_error = left(p_gateway_reconciliation_error, 500),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'failure_reason', left(coalesce(p_reason, 'Falha ao criar checkout Mercado Pago.'), 500),
        'reconciliation_required', p_gateway_reconciliation_status is not null
      ),
      updated_at = now()
  where id = p_subscription_id and status = 'pending';
end;
$$;

create or replace function public.finalize_mercadopago_invite(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription public.billing_subscriptions%rowtype;
begin
  select * into v_subscription from public.billing_subscriptions where id = p_subscription_id for update;
  if v_subscription.id is null or v_subscription.reserved_invite_id is null then
    return;
  end if;

  update public.billing_plan_invites
  set used_at = coalesce(used_at, now()),
      user_id = coalesce(user_id, v_subscription.user_id)
  where id = v_subscription.reserved_invite_id
    and (user_id is null or user_id = v_subscription.user_id);
end;
$$;

create or replace function public.apply_approved_mercadopago_payment(
  p_payment_id uuid,
  p_gateway_payment_id text,
  p_gateway_status text,
  p_gateway_status_detail text,
  p_date_approved timestamptz default null,
  p_access_days integer default 30
)
returns table(payment_id uuid, applied_to_subscription_id uuid, period_start timestamptz, period_end timestamptz, already_applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.billing_payments%rowtype;
  v_origin public.billing_subscriptions%rowtype;
  v_target public.billing_subscriptions%rowtype;
  v_now timestamptz := now();
  v_start timestamptz;
  v_end timestamptz;
begin
  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'payment not found'; end if;
  if v_payment.gateway <> 'mercadopago' then raise exception 'payment gateway mismatch'; end if;
  if p_gateway_payment_id is not null and v_payment.gateway_payment_id is not null and v_payment.gateway_payment_id <> p_gateway_payment_id then
    raise exception 'gateway payment mismatch';
  end if;

  if v_payment.access_applied_at is not null then
    payment_id := v_payment.id;
    applied_to_subscription_id := v_payment.applied_to_subscription_id;
    period_start := v_payment.current_period_start;
    period_end := v_payment.current_period_end;
    already_applied := true;
    return next;
    return;
  end if;

  select * into v_origin
  from public.billing_subscriptions
  where id = coalesce(v_payment.original_subscription_id, v_payment.subscription_id)
  for update;
  if v_origin.id is null then raise exception 'origin subscription not found'; end if;

  if v_payment.payment_method = 'mercadopago_pix' then
    select * into v_target
    from public.billing_subscriptions
    where user_id = v_origin.user_id
      and gateway = 'mercadopago'
      and status = 'active'
      and coalesce(current_period_end, '-infinity'::timestamptz) > v_now
    order by current_period_end desc
    limit 1
    for update;
    if v_target.id is null then
      v_target := v_origin;
    end if;
  else
    v_target := v_origin;
  end if;

  v_start := greatest(v_now, coalesce(v_target.current_period_end, v_now));
  v_end := v_start + make_interval(days => greatest(coalesce(p_access_days, 30), 1));

  update public.billing_payments
  set status = 'approved',
      original_subscription_id = coalesce(original_subscription_id, v_origin.id),
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      approved_at = coalesce(approved_at, p_date_approved, v_now),
      access_applied_at = v_now,
      applied_to_subscription_id = v_target.id,
      current_period_start = v_start,
      current_period_end = v_end,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'gateway_status', p_gateway_status,
        'gateway_status_detail', p_gateway_status_detail,
        'applied_to_subscription_id', v_target.id
      ),
      updated_at = v_now
  where id = v_payment.id;

  update public.billing_subscriptions
  set status = 'active',
      started_at = coalesce(started_at, v_start),
      current_period_start = v_start,
      current_period_end = v_end,
      next_due_date = v_end,
      reservation_expires_at = null,
      gateway_payment_id = coalesce(p_gateway_payment_id, gateway_payment_id),
      last_gateway_status = p_gateway_status,
      updated_at = v_now
  where id = v_target.id;

  if v_payment.payment_method = 'mercadopago_pix' and v_target.id <> v_origin.id then
    update public.billing_subscriptions
    set status = 'expired',
        reservation_expires_at = null,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('applied_to_subscription_id', v_target.id),
        updated_at = v_now
    where id = v_origin.id;
  end if;

  if v_origin.reserved_invite_id is not null then
    update public.billing_plan_invites
    set used_at = coalesce(used_at, v_now), user_id = coalesce(user_id, v_origin.user_id)
    where id = v_origin.reserved_invite_id and (user_id is null or user_id = v_origin.user_id);
  end if;

  payment_id := v_payment.id;
  applied_to_subscription_id := v_target.id;
  period_start := v_start;
  period_end := v_end;
  already_applied := false;
  return next;
end;
$$;

create or replace function public.recalculate_mercadopago_access_after_reversal(
  p_payment_id uuid,
  p_payment_status text,
  p_gateway_status text,
  p_gateway_status_detail text default null
)
returns table(payment_id uuid, subscription_id uuid, recalculated_period_end timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.billing_payments%rowtype;
  v_target_id uuid;
  v_max_end timestamptz;
  v_now timestamptz := now();
begin
  if p_payment_status not in ('refunded', 'chargeback') then
    raise exception 'invalid reversal status';
  end if;

  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'payment not found'; end if;

  v_target_id := coalesce(v_payment.applied_to_subscription_id, v_payment.subscription_id);
  if v_target_id is null then raise exception 'target subscription not found'; end if;

  perform 1 from public.billing_subscriptions where id = v_target_id for update;

  update public.billing_payments
  set status = p_payment_status,
      refunded_at = coalesce(refunded_at, v_now),
      reversal_applied_at = coalesce(reversal_applied_at, v_now),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'gateway_status', p_gateway_status,
        'gateway_status_detail', p_gateway_status_detail
      ),
      updated_at = v_now
  where id = v_payment.id;

  select max(current_period_end) into v_max_end
  from public.billing_payments
  where coalesce(applied_to_subscription_id, subscription_id) = v_target_id
    and id <> v_payment.id
    and status = 'approved'
    and access_applied_at is not null;

  if v_max_end is null or v_max_end <= v_now then
    update public.billing_subscriptions
    set status = case when p_payment_status = 'chargeback' then 'chargeback' else 'expired' end,
        current_period_end = least(coalesce(current_period_end, v_now), v_now),
        next_due_date = null,
        last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
    recalculated_period_end := v_now;
  else
    update public.billing_subscriptions
    set status = 'active',
        current_period_end = v_max_end,
        next_due_date = v_max_end,
        last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
    recalculated_period_end := v_max_end;
  end if;

  payment_id := v_payment.id;
  subscription_id := v_target_id;
  return next;
end;
$$;

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
  v_plan public.billing_plans%rowtype;
  v_invite public.billing_plan_invites%rowtype;
  v_active_count integer;
  v_subscription_id uuid;
begin
  perform public.expire_stale_billing_reservations();

  select * into v_plan from public.billing_plans where id = p_plan_id and is_active = true for update;
  if v_plan.id is null then raise exception 'Plano indisponível.'; end if;

  if v_plan.invite_only then
    select * into v_invite
    from public.billing_plan_invites i
    where i.plan_id = p_plan_id
      and (i.user_id is null or i.user_id = p_user_id)
      and (i.email is null or lower(i.email) = lower(p_user_email))
      and i.used_at is null
      and (i.expires_at is null or i.expires_at > now())
      and not exists (
        select 1 from public.billing_subscriptions s
        where s.reserved_invite_id = i.id
          and s.status = 'pending'
          and coalesce(s.reservation_expires_at, '-infinity'::timestamptz) > now()
      )
    order by i.created_at asc
    limit 1
    for update;

    if v_invite.id is null then raise exception 'Convite inválido, expirado ou já reservado.'; end if;
  end if;

  if v_plan.max_active_subscriptions is not null then
    select count(*) into v_active_count
    from public.billing_subscriptions
    where plan_id = p_plan_id
      and status in ('active', 'trialing', 'overdue', 'pending')
      and (status <> 'pending' or coalesce(reservation_expires_at, '-infinity'::timestamptz) > now());
    if v_active_count >= v_plan.max_active_subscriptions then raise exception 'Não há vagas disponíveis para este plano.'; end if;
  end if;

  insert into public.billing_subscriptions(
    user_id, plan_id, status, gateway, reservation_expires_at, reserved_invite_id, metadata
  ) values (
    p_user_id, p_plan_id, 'pending', 'mercadopago', p_reservation_expires_at, v_invite.id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('reserved_invite_id', v_invite.id)
  ) returning id into v_subscription_id;

  subscription_id := v_subscription_id;
  return next;
end;
$$;

revoke all on function public.claim_mercadopago_webhook_event(text, text, text, text, jsonb, integer) from public;
revoke all on function public.release_mercadopago_checkout_reservation(uuid, text, text, text, text, text) from public;
revoke all on function public.finalize_mercadopago_invite(uuid) from public;
revoke all on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) from public;
revoke all on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) from public;
revoke all on function public.reserve_mercadopago_checkout(uuid, text, uuid, text, timestamptz, jsonb) from public;

grant execute on function public.claim_mercadopago_webhook_event(text, text, text, text, jsonb, integer) to service_role;
grant execute on function public.release_mercadopago_checkout_reservation(uuid, text, text, text, text, text) to service_role;
grant execute on function public.finalize_mercadopago_invite(uuid) to service_role;
grant execute on function public.apply_approved_mercadopago_payment(uuid, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.recalculate_mercadopago_access_after_reversal(uuid, text, text, text) to service_role;
grant execute on function public.reserve_mercadopago_checkout(uuid, text, uuid, text, timestamptz, jsonb) to service_role;
