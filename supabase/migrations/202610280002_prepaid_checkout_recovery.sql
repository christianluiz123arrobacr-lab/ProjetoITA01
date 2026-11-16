begin;
create table public.billing_prepaid_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 attempt_key uuid not null,
 plan_id uuid not null references public.billing_plans(id),
 months integer not null check(months in(1,2,3,6,12)),
 method text not null check(method in('card','pix')),
 payment_id uuid not null unique references public.billing_payments(id),
 state text not null default 'prepared' check(state in('prepared','submitted','ready')),
 snapshot jsonb not null,
 result jsonb,
 created_at timestamptz not null default now(),
 submitted_at timestamptz,
 unique(user_id,attempt_key)
);
alter table public.billing_prepaid_attempts enable row level security;
revoke all on public.billing_prepaid_attempts from public,anon,authenticated;
grant select on public.billing_prepaid_attempts to service_role;
create table public.billing_prepaid_attempt_keys (
 user_id uuid not null references public.profiles(id), attempt_key uuid not null,
 attempt_id uuid not null references public.billing_prepaid_attempts(id), primary key(user_id,attempt_key)
);
alter table public.billing_prepaid_attempt_keys enable row level security;
revoke all on public.billing_prepaid_attempt_keys from public,anon,authenticated;
grant select on public.billing_prepaid_attempt_keys to service_role;

create function public.prepare_prepaid_checkout(p_user uuid,p_key uuid,p_slug text,p_months integer,p_method text,p_email text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a billing_prepaid_attempts; p billing_plans; c billing_plan_durations; s uuid; pay uuid;
 base bigint; discount integer; amount integer; referral_discount integer; recurring uuid; snap jsonb;
begin
 if p_key is null or p_months is null or p_months not in(1,2,3,6,12) or p_method is null or p_method not in('pix','card') then raise exception 'Invalid package'; end if;
 -- Same order as referral pricing and ledger: referral program, user, plan.
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user));
 select x.* into a from billing_prepaid_attempts x join billing_prepaid_attempt_keys k on k.attempt_id=x.id where k.user_id=p_user and k.attempt_key=p_key;
 if a.id is null then
   select x.* into a from billing_prepaid_attempts x join billing_payments bp on bp.id=x.payment_id
   where x.user_id=p_user and (x.state<>'ready' or bp.status='pending') order by x.created_at limit 1;
 end if;
 if a.id is not null then
   if a.months<>p_months or a.method<>p_method or not exists(select 1 from billing_plans where id=a.plan_id and slug=p_slug) then
     raise exception 'Existe uma tentativa pendente com outras condições. Recupere o pagamento anterior.';
   end if;
   insert into billing_prepaid_attempt_keys values(p_user,p_key,a.id) on conflict do nothing;
   return to_jsonb(a)||jsonb_build_object('payment_status',(select status from billing_payments where id=a.payment_id));
 end if;
 -- Old checkout calls must finish/expire before creating a new prepaid purchase.
 if exists(select 1 from billing_payments where user_id=p_user and status='pending'
   and (expires_at is null or expires_at>now())) then raise exception 'Já existe um pagamento pendente. Consulte sua assinatura.'; end if;
 select * into p from billing_plans where slug=p_slug for update;
 if p.id is null or not p.is_active or not p.is_public or p.price_cents<=0 or coalesce(p.currency,'BRL')<>'BRL' then raise exception 'Plano indisponível'; end if;
 if p.requires_legacy_founder_eligibility and not exists(select 1 from billing_user_entitlements where user_id=p_user and entitlement_key='legacy_founder_eligible')
 and not exists(select 1 from billing_plan_invites where plan_id=p.id and used_at is null and (user_id is null or user_id=p_user) and (email is null or lower(trim(email))=lower(trim(p_email))) and (expires_at is null or expires_at>now())) then raise exception 'Founder eligibility required'; end if;
 select * into c from billing_plan_durations where plan_id=p.id and months=p_months;
 -- Legacy offers retain their existing 1/2/3 month zero-discount behavior only
 -- until explicitly configured. New 6/12 offers are never enabled by fallback.
 if c.plan_id is null and p_months in(1,2,3) then c.enabled:=true; c.discount_bps:=0; c.revision:=0;
 elsif c.plan_id is null or not c.enabled then raise exception 'Duração desativada'; end if;
 base:=p.price_cents::bigint*p_months;
 discount:=floor((base*c.discount_bps+5000)/10000)::integer;
 amount:=(base-discount)::integer;
 select id into recurring from billing_subscriptions where user_id=p_user and gateway='mercadopago'
 and metadata->>'payment_method'='card' and status in('active','trialing','overdue') order by updated_at desc limit 1;
 select subscription_id into s from public.reserve_mercadopago_checkout(p_user,p_email,p.id,'pix',now()+interval '1 day','{}'::jsonb);
 if s is null then raise exception 'Reservation not confirmed'; end if;
 snap:=jsonb_build_object('base_cents',p.price_cents,'months',p_months,'duration_discount_bps',c.discount_bps,
 'duration_discount_cents',discount,'after_duration_cents',amount,'duration_revision',c.revision,
 'rounding','half_up_package_total','referral_policy','after_duration','title',p.name,'payer_email',p_email,
 'switch_from_recurring_subscription_id',recurring,'subscription_id',s,'expires_at',now()+interval '1 day');
 insert into billing_payments(user_id,plan_id,subscription_id,original_subscription_id,gateway,payment_method,status,amount_cents,currency,expires_at,access_duration_value,access_duration_unit,metadata)
 values(p_user,p.id,s,s,'mercadopago',case when p_method='pix' then 'mercadopago_pix' else 'mercadopago_card' end,'pending',amount,'BRL',now()+interval '1 day',p_months,'months',
 jsonb_build_object('prepaid_package',true,'duration_months',p_months,'switch_from_recurring_subscription_id',recurring,'pricing_snapshot',snap)) returning id into pay;
 -- Preserve official eligibility, campaign versions, first-payment checks and claims.
 referral_discount:=public.referral_calculate_discount(p_user,amount,case when p_method='pix' then 'mercadopago_pix' else 'mercadopago_card' end,true,pay);
 if referral_discount>0 then
   insert into referral_discount_claims(referee_id,referral_id,payment_id,version_id,original_cents,discount_cents)
   select p_user,id,pay,version_id,amount,referral_discount from student_referrals where referee_id=p_user and status='pending';
 end if;
 snap:=snap||jsonb_build_object('referral_discount_cents',referral_discount,'total_cents',amount-referral_discount);
 update billing_payments set amount_cents=amount-referral_discount,metadata=metadata||jsonb_build_object('pricing_snapshot',snap) where id=pay;
 update billing_subscriptions set metadata=metadata||jsonb_build_object('payment_method','prepaid','prepaid_duration_months',p_months,'contracted_price_cents',p.price_cents,'contracted_currency','BRL','switch_from_recurring_subscription_id',recurring) where id=s;
 insert into billing_prepaid_attempts(user_id,attempt_key,plan_id,months,method,payment_id,snapshot)
 values(p_user,p_key,p.id,p_months,p_method,pay,snap) returning * into a;
 insert into billing_prepaid_attempt_keys values(p_user,p_key,a.id);
 return to_jsonb(a);
end; $$;

-- No lease expiry authorizes another external POST. An uncertain submission is
-- recoverable only by official reads or a late response for this same attempt.
create function public.claim_prepaid_submission(p_user uuid,p_attempt uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update billing_prepaid_attempts set state='submitted',submitted_at=now() where id=p_attempt and user_id=p_user and state='prepared';
 return found;
end; $$;

create function public.complete_prepaid_submission(p_user uuid,p_attempt uuid,p_result jsonb,p_gateway_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a billing_prepaid_attempts;
begin
 select * into a from billing_prepaid_attempts where id=p_attempt and user_id=p_user for update;
 if a.id is null or a.state='prepared' then raise exception 'Invalid submission'; end if;
 if a.state='ready' then return a.result; end if;
 if p_result->>'paymentId' is distinct from a.payment_id::text or
   (p_result->>'checkoutUrl' is null and exists(select 1 from billing_payments where id=a.payment_id and status='pending')) then raise exception 'Invalid result'; end if;
 if p_gateway_id is not null and exists(select 1 from billing_payments where id=a.payment_id and gateway_payment_id is not null and gateway_payment_id<>p_gateway_id) then raise exception 'Gateway payment mismatch'; end if;
 update billing_payments set payment_url=p_result->>'checkoutUrl',gateway_payment_id=coalesce(gateway_payment_id,p_gateway_id),
 metadata=metadata||jsonb_build_object('external_reference',p_result->>'externalReference') where id=a.payment_id;
 -- Do not overwrite status/access: a webhook may already have approved/reversed it.
 p_result:=p_result||jsonb_build_object('paymentStatus',(select status from billing_payments where id=a.payment_id));
 update billing_prepaid_attempts set state='ready',result=p_result where id=a.id;
 return p_result;
end; $$;

do $$ declare f regprocedure; begin
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('prepare_prepaid_checkout','claim_prepaid_submission','complete_prepaid_submission') loop
 execute format('revoke all on function %s from public,anon,authenticated',f);
 execute format('grant execute on function %s to service_role',f);
 end loop;
end; $$;
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
  perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
  select user_id into v_user_id from public.billing_payments where id=p_payment_id;
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id));
  select greatest(coalesce(access_duration_value, 1), 1), coalesce(access_duration_unit, 'months'), user_id
    into v_duration_value, v_duration_unit, v_user_id
  from public.billing_payments where id = p_payment_id for update;
  if v_user_id is null or v_duration_unit <> 'months' or v_duration_value not in (1, 2, 3, 6, 12) then
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
  v_user_id uuid;
  v_target_id uuid;
  v_payment public.billing_payments%rowtype;
  v_rebuild record;
  v_now timestamptz := now();
begin
  if p_payment_status not in ('refunded', 'chargeback') then raise exception 'invalid reversal status'; end if;
  select bp.user_id, coalesce(bp.applied_to_subscription_id, bp.subscription_id) into v_user_id, v_target_id from public.billing_payments bp where bp.id = p_payment_id;
  if v_user_id is null or v_target_id is null then raise exception 'payment not found'; end if;

  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(v_user_id));
  select * into v_payment from public.billing_payments where id = p_payment_id for update;
  perform 1 from public.billing_subscriptions where id = v_target_id and user_id = v_user_id for update;

  update public.billing_payments
  set status = p_payment_status,
      refunded_at = coalesce(refunded_at, v_now),
      reversal_applied_at = coalesce(reversal_applied_at, v_now),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('gateway_status', p_gateway_status, 'gateway_status_detail', p_gateway_status_detail, 'reversal_reason', p_payment_status),
      updated_at = v_now
  where id = v_payment.id;

  select * into v_rebuild from public.rebuild_mercadopago_access_ledger(v_target_id, v_user_id, v_now) limit 1;

  if p_payment_status = 'chargeback' then
    update public.billing_subscriptions
    set status = case when coalesce(current_period_end, v_now) > v_now then status else 'expired' end,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('blocked_by_chargeback_payment_id', p_payment_id),
        last_gateway_status = p_gateway_status,
        updated_at = v_now
    where id = v_target_id;
  else
    update public.billing_subscriptions set last_gateway_status = p_gateway_status, updated_at = v_now where id = v_target_id;
  end if;

  payment_id := v_payment.id; subscription_id := v_target_id; recalculated_period_end := v_rebuild.period_end;
  return next;
end;
$$;
commit;
