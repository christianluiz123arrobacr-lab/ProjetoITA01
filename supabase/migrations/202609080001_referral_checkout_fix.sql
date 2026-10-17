-- Persist referral attribution during registration and use the same SQL rules
-- for checkout pricing and the authenticated pricing preview.

create table public.referral_attribution_pending (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id),
  version_id uuid not null references public.referral_campaign_versions(id),
  status text not null default 'pending' check (status in ('pending', 'attached', 'rejected')),
  referral_id uuid references public.student_referrals(id),
  rejection_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referral_attribution_pending enable row level security;
revoke all on public.referral_attribution_pending from public, anon, authenticated;
grant select, insert, update, delete on public.referral_attribution_pending to service_role;

create or replace function public.referral_queue_attribution(p_user uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_version uuid;
  v_existing uuid;
  v_created_at timestamptz;
  v_email text;
  v_other_email text;
begin
  perform pg_advisory_xact_lock(hashtextextended('referral-program', 0));
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user));

  select id into v_existing from student_referrals where referee_id = p_user;
  if v_existing is not null then
    return jsonb_build_object('status', 'attached', 'referral_id', v_existing);
  end if;

  select created_at, lower(trim(email)) into v_created_at, v_email
  from auth.users where id = p_user;

  -- A code can only be queued by the registration request for a fresh account.
  if v_created_at is null or v_created_at < now() - interval '2 hours' then
    return jsonb_build_object('status', 'rejected', 'reason', 'account_not_new');
  end if;

  select user_id into v_referrer from referral_codes where code = lower(trim(p_code));
  if v_referrer is null then
    return jsonb_build_object('status', 'rejected', 'reason', 'invalid_code');
  end if;

  select lower(trim(email)) into v_other_email from auth.users where id = v_referrer;
  if p_user = v_referrer or v_email is null or v_other_email is null or v_email = v_other_email then
    raise exception 'Autoindicação não permitida.';
  end if;

  if not exists(select 1 from profiles where id = p_user and role = 'student' and ativo)
     or not exists(select 1 from profiles where id = v_referrer and role = 'student' and ativo) then
    return jsonb_build_object('status', 'rejected', 'reason', 'inactive_account');
  end if;

  if exists(select 1 from billing_payments where user_id = p_user and (status = 'approved' or access_applied_at is not null)) then
    return jsonb_build_object('status', 'rejected', 'reason', 'previous_payment');
  end if;

  select version_id into v_version from referral_campaign_current;
  if v_version is null or not referral_campaign_live(v_version) then
    return jsonb_build_object('status', 'rejected', 'reason', 'campaign_inactive');
  end if;

  insert into referral_attribution_pending(user_id, referrer_id, version_id)
  values (p_user, v_referrer, v_version)
  on conflict (user_id) do nothing;

  if exists(
    select 1 from referral_attribution_pending
    where user_id = p_user and referrer_id = v_referrer and status in ('pending', 'attached')
  ) then
    return jsonb_build_object('status', 'queued');
  end if;

  return jsonb_build_object('status', 'rejected', 'reason', 'different_referral_already_queued');
end;
$$;

create or replace function public.referral_finalize_attribution(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending referral_attribution_pending%rowtype;
  v_referral uuid;
  v_email text;
  v_other_email text;
begin
  perform pg_advisory_xact_lock(hashtextextended('referral-program', 0));
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user));

  select id into v_referral from student_referrals where referee_id = p_user;
  if v_referral is not null then
    update referral_attribution_pending
    set status = 'attached', referral_id = v_referral, rejection_code = null, updated_at = now()
    where user_id = p_user;
    return jsonb_build_object('status', 'attached', 'referral_id', v_referral);
  end if;

  select * into v_pending from referral_attribution_pending where user_id = p_user for update;
  if v_pending.user_id is null or v_pending.status <> 'pending' then
    return jsonb_build_object('status', coalesce(v_pending.status, 'missing'));
  end if;

  select lower(trim(email)) into v_email from auth.users where id = p_user;
  select lower(trim(email)) into v_other_email from auth.users where id = v_pending.referrer_id;

  if p_user = v_pending.referrer_id or v_email is null or v_other_email is null or v_email = v_other_email then
    update referral_attribution_pending set status = 'rejected', rejection_code = 'self_referral', updated_at = now() where user_id = p_user;
    return jsonb_build_object('status', 'rejected', 'reason', 'self_referral');
  end if;

  if not exists(select 1 from profiles where id = p_user and role = 'student' and ativo)
     or not exists(select 1 from profiles where id = v_pending.referrer_id and role = 'student' and ativo)
     or exists(select 1 from billing_payments where user_id = p_user and (status = 'approved' or access_applied_at is not null))
     or not referral_campaign_live(v_pending.version_id) then
    update referral_attribution_pending set status = 'rejected', rejection_code = 'ineligible', updated_at = now() where user_id = p_user;
    return jsonb_build_object('status', 'rejected', 'reason', 'ineligible');
  end if;

  insert into student_referrals(referrer_id, referee_id, version_id)
  values (v_pending.referrer_id, p_user, v_pending.version_id)
  on conflict (referee_id) do nothing;

  select id into v_referral from student_referrals where referee_id = p_user;
  if v_referral is null then
    return jsonb_build_object('status', 'pending');
  end if;

  update referral_attribution_pending
  set status = 'attached', referral_id = v_referral, rejection_code = null, updated_at = now()
  where user_id = p_user;
  return jsonb_build_object('status', 'attached', 'referral_id', v_referral);
end;
$$;

-- Compatibility entry point. It is now safe for a fresh registration only.
create or replace function public.referral_attach(p_user uuid, p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queued jsonb;
  v_final jsonb;
begin
  v_queued := referral_queue_attribution(p_user, p_code);
  if v_queued->>'status' not in ('queued', 'attached') then return null; end if;
  v_final := referral_finalize_attribution(p_user);
  return nullif(v_final->>'referral_id', '')::uuid;
end;
$$;

create or replace function public.referral_calculate_discount(
  p_user uuid,
  p_amount_cents integer,
  p_payment_method text,
  p_prepaid boolean,
  p_exclude_payment uuid default null
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_referral student_referrals%rowtype;
  v_campaign referral_campaign_versions%rowtype;
begin
  if p_amount_cents <= 0 then return 0; end if;
  if p_payment_method = 'mercadopago_card' and not p_prepaid then return 0; end if;
  if p_payment_method not in ('mercadopago_pix', 'mercadopago_card') then return 0; end if;

  select * into v_referral from student_referrals where referee_id = p_user and status = 'pending';
  if v_referral.id is null or not referral_campaign_live(v_referral.version_id) then return 0; end if;
  if not exists(select 1 from profiles where id = v_referral.referee_id and role = 'student' and ativo)
     or not exists(select 1 from profiles where id = v_referral.referrer_id and role = 'student' and ativo)
     or (select lower(trim(email)) from auth.users where id = v_referral.referee_id)
        = (select lower(trim(email)) from auth.users where id = v_referral.referrer_id) then
    return 0;
  end if;

  select * into v_campaign from referral_campaign_versions where id = v_referral.version_id;
  if v_campaign.benefit not in ('percent', 'fixed') then return 0; end if;
  if exists(select 1 from referral_discount_claims where referee_id = p_user) then return 0; end if;
  if exists(
    select 1 from billing_payments
    where user_id = p_user
      and (p_exclude_payment is null or id <> p_exclude_payment)
      and (status = 'approved' or access_applied_at is not null)
  ) then return 0; end if;

  return least(
    p_amount_cents - 1,
    case
      when v_campaign.benefit = 'percent' then floor(p_amount_cents::numeric * v_campaign.discount / 100.0)::integer
      else v_campaign.discount
    end
  );
end;
$$;

create or replace function public.referral_price_payment(p_payment uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  p billing_payments%rowtype;
  v_price integer;
  v_discount integer;
  v_referral uuid;
  v_version uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('referral-program', 0));
  select * into p from billing_payments where id = p_payment;
  if p.id is null then raise exception 'Pagamento não encontrado.'; end if;
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p.user_id));
  select * into p from billing_payments where id = p_payment for update;

  if p.status <> 'pending' or p.gateway_payment_id is not null or p.payment_url is not null then
    raise exception 'Pagamento não elegível para precificação.';
  end if;
  if exists(select 1 from referral_discount_claims where payment_id = p.id) then return p.amount_cents; end if;

  select price_cents into v_price from billing_plans where id = p.plan_id and is_active;
  if v_price is null or v_price <= 0 then raise exception 'Plano inválido.'; end if;
  if p.amount_cents <> v_price * (case when p.access_duration_unit = 'months' then p.access_duration_value else 1 end) then
    return p.amount_cents;
  end if;

  v_discount := referral_calculate_discount(
    p.user_id,
    p.amount_cents,
    p.payment_method,
    coalesce((p.metadata->>'prepaid_package')::boolean, false),
    p.id
  );
  if v_discount <= 0 then return p.amount_cents; end if;

  select id, version_id into v_referral, v_version
  from student_referrals where referee_id = p.user_id and status = 'pending';

  insert into referral_discount_claims(referee_id, referral_id, payment_id, version_id, original_cents, discount_cents)
  values (p.user_id, v_referral, p.id, v_version, p.amount_cents, v_discount);
  update billing_payments set amount_cents = amount_cents - v_discount where id = p.id;
  return p.amount_cents - v_discount;
end;
$$;

create or replace function public.referral_pricing_preview(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_referral student_referrals%rowtype;
  v_campaign referral_campaign_versions%rowtype;
  v_plans jsonb;
  v_eligible boolean := false;
begin
  select * into v_referral from student_referrals where referee_id = p_user;
  if v_referral.id is not null then
    select * into v_campaign from referral_campaign_versions where id = v_referral.version_id;
    v_eligible := v_referral.status = 'pending'
      and referral_campaign_live(v_referral.version_id)
      and referral_calculate_discount(p_user, 10000, 'mercadopago_pix', false, null) > 0;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'planId', p.id,
    'slug', p.slug,
    'originalCents', p.price_cents,
    'pixCents', p.price_cents - referral_calculate_discount(p_user, p.price_cents, 'mercadopago_pix', false, null),
    'recurringCardCents', p.price_cents,
    'prepaid', jsonb_build_array(
      jsonb_build_object('months', 1, 'originalCents', p.price_cents, 'discountedCents', p.price_cents - referral_calculate_discount(p_user, p.price_cents, 'mercadopago_card', true, null)),
      jsonb_build_object('months', 2, 'originalCents', p.price_cents * 2, 'discountedCents', p.price_cents * 2 - referral_calculate_discount(p_user, p.price_cents * 2, 'mercadopago_card', true, null)),
      jsonb_build_object('months', 3, 'originalCents', p.price_cents * 3, 'discountedCents', p.price_cents * 3 - referral_calculate_discount(p_user, p.price_cents * 3, 'mercadopago_card', true, null))
    )
  ) order by p.display_order, p.id), '[]'::jsonb) into v_plans
  from billing_plans p
  where p.is_active and p.is_public and p.price_cents > 0
    and coalesce(p.metadata->>'referral_only', 'false') <> 'true';

  return jsonb_build_object(
    'linked', v_referral.id is not null,
    'eligible', v_eligible,
    'discountPercent', case when v_eligible and v_campaign.benefit = 'percent' then v_campaign.discount else null end,
    'eligibleMethods', case when v_eligible then jsonb_build_array('pix', 'prepaid_card', 'prepaid_pix') else '[]'::jsonb end,
    'plans', v_plans
  );
end;
$$;

do $$
declare f record;
begin
  for f in select oid::regprocedure as signature from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('referral_queue_attribution', 'referral_finalize_attribution', 'referral_attach', 'referral_calculate_discount', 'referral_price_payment', 'referral_pricing_preview')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end;
$$;
