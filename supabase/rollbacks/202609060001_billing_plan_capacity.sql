drop function public.reserve_manual_billing_checkout(uuid,uuid,jsonb);
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
  perform pg_advisory_xact_lock(hashtextextended('mercadopago-user-ledger:' || p_user_id::text, 0));

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
          and s.user_id <> p_user_id
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
drop function public.billing_plan_capacity();
