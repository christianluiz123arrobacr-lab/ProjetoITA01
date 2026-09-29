drop trigger referral_promotional_root_purchase on public.billing_payments;
drop function public.referral_promotional_root_purchase();
drop function public.referral_dashboard(uuid,boolean);
-- Export referral audit/rewards before rollback. This removes the new program.
create or replace function public.rebuild_mercadopago_access_ledger(
  p_subscription_id uuid,
  p_user_id uuid,
  p_now timestamptz default now()
)
returns table(subscription_id uuid, period_start timestamptz, period_end timestamptz, payment_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_cursor timestamptz;
  v_first_start timestamptz;
  v_last_end timestamptz;
  v_count integer := 0;
begin
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user_id));
  perform 1 from public.billing_subscriptions where id = p_subscription_id and user_id = p_user_id for update;

  for v_payment in
    select id,
           coalesce(approved_at, access_applied_at, created_at, p_now) as approved_at,
           coalesce(access_duration_value, case when payment_method = 'mercadopago_card' then 1 else 30 end) as duration_value,
           coalesce(access_duration_unit, case when payment_method = 'mercadopago_card' then 'months' else 'days' end) as duration_unit
    from public.billing_payments
    where applied_to_subscription_id = p_subscription_id
      and status = 'approved'
      and access_applied_at is not null
      and refunded_at is null
    order by coalesce(approved_at, access_applied_at, created_at, p_now), created_at, id
    for update
  loop
    v_cursor := greatest(v_payment.approved_at, coalesce(v_cursor, v_payment.approved_at));
    if v_first_start is null then v_first_start := v_cursor; end if;
    v_last_end := public.add_billing_access_duration(v_cursor, v_payment.duration_value, v_payment.duration_unit);

    update public.billing_payments
    set current_period_start = v_cursor,
        current_period_end = v_last_end,
        updated_at = p_now
    where id = v_payment.id;

    v_cursor := v_last_end;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    update public.billing_subscriptions
    set status = 'expired',
        current_period_start = null,
        current_period_end = least(coalesce(current_period_end, p_now), p_now),
        next_due_date = null,
        canonical_access_subscription_id = coalesce(canonical_access_subscription_id, id),
        canonicalized_at = coalesce(canonicalized_at, p_now),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('access_blocked_by_reversal', true),
        updated_at = p_now
    where id = p_subscription_id;
    subscription_id := p_subscription_id; period_start := null; period_end := p_now; payment_count := 0;
    return next; return;
  end if;

  update public.billing_subscriptions
  set status = case when v_last_end > p_now then 'active' else 'expired' end,
      current_period_start = v_first_start,
      current_period_end = v_last_end,
      next_due_date = case when v_last_end > p_now then v_last_end else null end,
      canonical_access_subscription_id = coalesce(canonical_access_subscription_id, id),
      canonicalized_at = coalesce(canonicalized_at, p_now),
      updated_at = p_now
  where id = p_subscription_id;

  subscription_id := p_subscription_id; period_start := v_first_start; period_end := v_last_end; payment_count := v_count;
  return next;
end;
$$;
drop function public.referral_reconcile_payment(uuid);
drop function public.referral_grant(uuid,uuid,uuid,uuid,integer,text,integer);
drop function public.referral_price_payment(uuid);
drop function public.referral_attach(uuid,text);
drop function public.referral_save_campaign(uuid,jsonb);
drop function public.referral_campaign_live(uuid);
drop table public.referral_discount_claims,public.referral_rewards,public.referral_access_baselines,public.student_referrals,public.referral_codes,public.referral_campaign_current,public.referral_audit,public.referral_campaign_versions;

-- Preserve any existing access subscription and its FK; remove an unused seed only.
delete from public.billing_plans p where p.slug='referral-promotional-access'
 and p.metadata->>'referral_only'='true' and not exists(select 1 from public.billing_subscriptions s where s.plan_id=p.id)
 and not exists(select 1 from public.billing_payments b where b.plan_id=p.id);
