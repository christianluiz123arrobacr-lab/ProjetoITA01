-- Dedicated, hidden access plan: rewards never consume or overbook a paid-plan slot.
insert into public.billing_plans(slug,name,description,price_cents,currency,is_active,is_public,invite_only,max_active_subscriptions,metadata)
values('referral-promotional-access','Acesso promocional por indicação','Benefício de acesso sem cobrança; não disponível para checkout.',0,'BRL',false,false,false,null,'{"referral_only":true}')
on conflict(slug) do nothing;

-- Campaign versions are immutable snapshots. Only service_role may use this API.
create table public.referral_campaign_versions (
 id uuid primary key default gen_random_uuid(), enabled boolean not null default false,
 title text not null, description text not null, goal integer not null check(goal between 1 and 1000),
 reward_days integer not null check(reward_days between 1 and 3650),
 benefit text not null check(benefit in ('none','percent','fixed','days')),
 discount integer not null default 0 check(discount>=0), extra_days integer not null default 0 check(extra_days between 0 and 3650),
 starts_at timestamptz, ends_at timestamptz, max_rewards integer check(max_rewards>0),
 allow_stacking boolean not null default false, whatsapp_label text not null, whatsapp_message text not null,
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
 check(benefit<>'percent' or discount<=90), check(ends_at is null or starts_at is null or ends_at>starts_at)
);
create table public.referral_campaign_current(id integer primary key check(id=1), version_id uuid not null references public.referral_campaign_versions(id));
create table public.referral_codes(user_id uuid primary key references public.profiles(id), code text unique not null default replace(gen_random_uuid()::text,'-',''), created_at timestamptz not null default now());
create table public.student_referrals(
 id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.profiles(id), referee_id uuid unique not null references public.profiles(id),
 version_id uuid not null references public.referral_campaign_versions(id), status text not null default 'pending' check(status in ('pending','confirmed','reversed')),
 payment_id uuid unique references public.billing_payments(id), created_at timestamptz not null default now(), confirmed_at timestamptz,
 check(referrer_id<>referee_id)
);
create index student_referrals_referrer_version on public.student_referrals(referrer_id,version_id,status);
create table public.referral_rewards(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), version_id uuid not null references public.referral_campaign_versions(id),
 referral_id uuid not null references public.student_referrals(id), payment_id uuid not null references public.billing_payments(id),
 subscription_id uuid references public.billing_subscriptions(id), kind text not null check(kind in ('referrer','referee')), ordinal integer not null check(ordinal>0),
 days integer not null check(days>0), created_at timestamptz not null default now(), revoked_at timestamptz, resumed_at timestamptz, resumed_by_payment_id uuid references public.billing_payments(id),
 unique(user_id,version_id,kind,ordinal)
);
create index referral_rewards_subscription on public.referral_rewards(subscription_id);
create table public.referral_access_baselines(subscription_id uuid primary key references public.billing_subscriptions(id), period_start timestamptz not null, period_end timestamptz not null);
create table public.referral_discount_claims(
 referee_id uuid primary key references public.profiles(id), referral_id uuid not null references public.student_referrals(id),
 payment_id uuid unique not null references public.billing_payments(id), version_id uuid not null references public.referral_campaign_versions(id),
 original_cents integer not null check(original_cents>=0), discount_cents integer not null check(discount_cents>=0 and discount_cents<=original_cents), created_at timestamptz not null default now()
);
create table public.referral_audit(id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null, entity_id uuid not null, details jsonb not null default '{}', created_at timestamptz not null default now());

create function public.referral_campaign_live(p_version uuid) returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((select v.enabled and (v.starts_at is null or v.starts_at<=now()) and (v.ends_at is null or v.ends_at>now())
 and current.enabled and (current.starts_at is null or current.starts_at<=now()) and (current.ends_at is null or current.ends_at>now())
 from referral_campaign_versions v cross join referral_campaign_current c join referral_campaign_versions current on current.id=c.version_id where v.id=p_version),false);
$$;
create function public.referral_save_campaign(p_actor uuid,p_config jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 if not exists(select 1 from profiles where id=p_actor and role='admin') then raise exception 'admin required'; end if;
 if p_config->>'benefit'='fixed' and exists(select 1 from billing_plans where is_active and price_cents<=(p_config->>'discount')::int) then raise exception 'Desconto fixo deve ser menor que o preço de todos os planos ativos.'; end if;
 insert into referral_campaign_versions(enabled,title,description,goal,reward_days,benefit,discount,extra_days,starts_at,ends_at,max_rewards,allow_stacking,whatsapp_label,whatsapp_message,created_by)
 values((p_config->>'enabled')::boolean,p_config->>'title',p_config->>'description',(p_config->>'goal')::int,(p_config->>'reward_days')::int,p_config->>'benefit',(p_config->>'discount')::int,(p_config->>'extra_days')::int,(p_config->>'starts_at')::timestamptz,(p_config->>'ends_at')::timestamptz,(p_config->>'max_rewards')::int,(p_config->>'allow_stacking')::boolean,p_config->>'whatsapp_label',p_config->>'whatsapp_message',p_actor) returning id into v;
 insert into referral_campaign_current values(1,v) on conflict(id) do update set version_id=excluded.version_id;
 insert into referral_audit(actor_id,action,entity_id,details) values(p_actor,'campaign_created',v,p_config);
 return v;
end; $$;
create function public.referral_attach(p_user uuid,p_code text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_referrer uuid; v_version uuid; v_id uuid; v_email text; v_other text;
begin
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 select user_id into v_referrer from referral_codes where code=p_code;
 if v_referrer is null then return null; end if;
 select lower(trim(email)) into v_email from auth.users where id=p_user;
 select lower(trim(email)) into v_other from auth.users where id=v_referrer;
 if p_user=v_referrer or v_email is null or v_other is null or v_email=v_other then raise exception 'Autoindicação não permitida.'; end if;
 perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user));
 if not exists(select 1 from profiles where id=p_user and role='student' and ativo) or not exists(select 1 from profiles where id=v_referrer and role='student' and ativo) then return null; end if;
 select version_id into v_version from referral_campaign_current;
 if not referral_campaign_live(v_version) then return null; end if;
 if exists(select 1 from billing_payments where user_id=p_user and (status='approved' or access_applied_at is not null)) then return null; end if;
 insert into student_referrals(referrer_id,referee_id,version_id) values(v_referrer,p_user,v_version) on conflict(referee_id) do nothing;
 select id into v_id from student_referrals where referee_id=p_user;
 return v_id;
end; $$;

-- Called after the local pending invoice exists, before any gateway request.
-- A claim is never recycled after an ambiguous gateway failure: a delayed approval
-- must not turn two invoices into two first-payment discounts.
create function public.referral_price_payment(p_payment uuid) returns integer language plpgsql security definer set search_path=public as $$
declare p billing_payments%rowtype; r student_referrals%rowtype; c referral_campaign_versions%rowtype; v_price integer; v_discount integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 select * into p from billing_payments where id=p_payment;
 perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p.user_id));
 select * into p from billing_payments where id=p_payment for update;
 if p.id is null or p.status<>'pending' or p.gateway_payment_id is not null or p.payment_url is not null then raise exception 'Pagamento não elegível para precificação.'; end if;
 if exists(select 1 from referral_discount_claims where payment_id=p.id) then return p.amount_cents; end if;
 select * into r from student_referrals where referee_id=p.user_id and status='pending';
 if r.id is null or not referral_campaign_live(r.version_id) then return p.amount_cents; end if;
 if (select lower(trim(email)) from auth.users where id=r.referee_id)=(select lower(trim(email)) from auth.users where id=r.referrer_id) then raise exception 'Autoindicação não permitida.'; end if;
 select * into c from referral_campaign_versions where id=r.version_id;
 if c.benefit not in ('percent','fixed') then return p.amount_cents; end if;
 if exists(select 1 from billing_payments where user_id=p.user_id and id<>p.id and (status='approved' or access_applied_at is not null)) or exists(select 1 from referral_discount_claims where referee_id=p.user_id) then return p.amount_cents; end if;
 if p.payment_method='mercadopago_card' and not coalesce((p.metadata->>'prepaid_package')::boolean,false) then return p.amount_cents; end if;
 select price_cents into v_price from billing_plans where id=p.plan_id and is_active;
 if v_price is null or v_price<=0 then raise exception 'Plano inválido.'; end if;
 if not c.allow_stacking and p.amount_cents <> v_price * (case when p.access_duration_unit='months' then p.access_duration_value else 1 end) then return p.amount_cents; end if;
 if c.benefit='fixed' and c.discount>=v_price then raise exception 'Desconto fixo deve ser menor que o preço do plano.'; end if;
 v_discount:=least(p.amount_cents,case when c.benefit='percent' then floor(p.amount_cents::numeric*c.discount/100.0)::int else c.discount end);
 -- Zero-value checkout requires an explicitly supported gateway-free flow.
 if p.amount_cents-v_discount=0 then raise exception 'Este benefício integral precisa ser configurado como dias extras de acesso.'; end if;
 insert into referral_discount_claims(referee_id,referral_id,payment_id,version_id,original_cents,discount_cents) values(p.user_id,r.id,p.id,c.id,p.amount_cents,v_discount);
 update billing_payments set amount_cents=amount_cents-v_discount where id=p.id;
 return p.amount_cents-v_discount;
end; $$;

create function public.referral_grant(p_user uuid,p_referral uuid,p_payment uuid,p_version uuid,p_days integer,p_kind text,p_ordinal integer) returns void language plpgsql security definer set search_path=public as $$
declare s billing_subscriptions%rowtype; v_id uuid; v_plan uuid; v_rebuild record; v_gap interval; v_previous referral_rewards%rowtype;
begin
 perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user));
 select * into v_previous from referral_rewards where user_id=p_user and version_id=p_version and kind=p_kind and ordinal=p_ordinal;
 if v_previous.id is not null and v_previous.revoked_at is null then return; end if;
 select * into s from billing_subscriptions where user_id=p_user and status in ('active','trialing') order by (status='active') desc,current_period_end desc nulls first limit 1 for update;
 if s.id is null then
 select id into v_plan from billing_plans where slug='referral-promotional-access' and metadata->>'referral_only'='true';
 if v_plan is null then raise exception 'Plano promocional não configurado.'; end if;
 insert into billing_subscriptions(user_id,plan_id,status,gateway,metadata) values(p_user,v_plan,'expired','manual','{"referral_benefit":true}') returning * into s;
 end if;
 -- Preserve any pre-existing access, including audited manual extensions.
 -- This baseline is access only, never a fabricated financial payment.
 if s.current_period_end>now() then
   if exists(select 1 from billing_payments where applied_to_subscription_id=s.id and access_applied_at is not null)
      or exists(select 1 from referral_rewards where subscription_id=s.id) then
     select * into v_rebuild from public.rebuild_mercadopago_access_ledger(s.id,p_user,now()) limit 1;
     v_gap:=s.current_period_end-greatest(coalesce(v_rebuild.period_end,now()),now());
   else v_gap:=s.current_period_end-now();
   end if;
   if v_gap>interval '0 seconds' then
     insert into referral_access_baselines values(s.id,now(),now()+v_gap)
     on conflict(subscription_id) do update set period_end=referral_access_baselines.period_end+v_gap;
   end if;
 end if;
 if v_previous.id is null then
 insert into referral_rewards(user_id,version_id,referral_id,payment_id,subscription_id,kind,ordinal,days) values(p_user,p_version,p_referral,p_payment,s.id,p_kind,p_ordinal,p_days) returning id into v_id;
 else
  update referral_rewards set revoked_at=null,resumed_at=now(),resumed_by_payment_id=p_payment,subscription_id=s.id where id=v_previous.id returning id into v_id;
 end if;
 insert into referral_audit(action,entity_id,details) values(case when v_previous.id is null then 'reward_granted' else 'reward_resumed' end,v_id,jsonb_build_object('days',p_days,'payment_id',p_payment,'subscription_id',s.id));
 -- An unlimited active access remains unlimited; its reward is still auditable.
 if s.status in ('active','trialing') and s.current_period_end is null then return; end if;
 perform public.rebuild_mercadopago_access_ledger(s.id,p_user,now());
end; $$;

create function public.referral_reconcile_payment(p_payment uuid) returns void language plpgsql security definer set search_path=public as $$
declare p billing_payments%rowtype; r student_referrals%rowtype; c referral_campaign_versions%rowtype; n integer; next_reward integer; reward record;
begin
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 select * into p from billing_payments where id=p_payment;
 if p.id is null then return; end if;
 perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p.user_id));
 select * into p from billing_payments where id=p_payment for update;
 select * into r from student_referrals where referee_id=p.user_id;
 if r.id is null then return; end if;
 select * into c from referral_campaign_versions where id=r.version_id;
 if p.status in ('refunded','chargeback') and r.payment_id=p.id and r.status='confirmed' then
 update student_referrals set status='reversed' where id=r.id;
 select count(*)/c.goal into n from student_referrals where referrer_id=r.referrer_id and version_id=c.id and status='confirmed';
 for reward in update referral_rewards set revoked_at=now() where revoked_at is null and ((referral_id=r.id and kind='referee') or (user_id=r.referrer_id and version_id=c.id and kind='referrer' and ordinal>n)) returning * loop
 insert into referral_audit(action,entity_id,details) values('reward_revoked',reward.id,jsonb_build_object('payment_id',p.id));
 perform public.rebuild_mercadopago_access_ledger(reward.subscription_id,reward.user_id,now());
 end loop;
 return;
 end if;
 if r.status<>'pending' or p.amount_cents<=0 or p.status<>'approved' or p.access_applied_at is null or p.applied_to_subscription_id is null or p.refunded_at is not null or not referral_campaign_live(c.id) then return; end if;
 if not exists(select 1 from billing_subscriptions where id=p.applied_to_subscription_id and user_id=p.user_id) then return; end if;
 if p.created_at<r.created_at then return; end if;
 if not exists(select 1 from profiles where id=r.referrer_id and role='student' and ativo) or not exists(select 1 from profiles where id=r.referee_id and role='student' and ativo) then return; end if;
 if (select lower(trim(email)) from auth.users where id=r.referee_id)=(select lower(trim(email)) from auth.users where id=r.referrer_id) then return; end if;
 update student_referrals set status='confirmed',payment_id=p.id,confirmed_at=now() where id=r.id;
 if c.benefit='days' and c.extra_days>0 then perform referral_grant(r.referee_id,r.id,p.id,c.id,c.extra_days,'referee',1); end if;
 select count(*)/c.goal into n from student_referrals where referrer_id=r.referrer_id and version_id=c.id and status='confirmed';
 if c.max_rewards is not null then n:=least(n,c.max_rewards); end if;
 select coalesce(min(ordinal) filter(where revoked_at is not null),coalesce(max(ordinal),0)+1) into next_reward from referral_rewards where user_id=r.referrer_id and version_id=c.id and kind='referrer';
 while next_reward<=n loop
 perform referral_grant(r.referrer_id,r.id,p.id,c.id,c.reward_days,'referrer',next_reward);
 next_reward:=next_reward+1;
 end loop;
end; $$;

-- No browser writes, including through direct PostgREST calls or RPCs.
do $$ declare t text; f record; begin
 foreach t in array array['referral_campaign_versions','referral_campaign_current','referral_codes','student_referrals','referral_rewards','referral_access_baselines','referral_discount_claims','referral_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select, insert, update, delete on public.%I to service_role',t);
 end loop;
 for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'referral_%' loop
 execute format('revoke all on function %s from public, anon, authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end; $$;
grant usage,select on sequence public.referral_audit_id_seq to service_role;

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
  v_access_count integer := 0;
begin
  perform pg_advisory_xact_lock(public.mercadopago_user_lock_key(p_user_id));
  perform 1 from public.billing_subscriptions where id = p_subscription_id and user_id = p_user_id for update;

  for v_payment in
    select * from (
      select id, coalesce(approved_at,access_applied_at,created_at,p_now) as approved_at,
        coalesce(access_duration_value,case when payment_method='mercadopago_card' then 1 else 30 end) as duration_value,
        coalesce(access_duration_unit,case when payment_method='mercadopago_card' then 'months' else 'days' end) as duration_unit,
        'payment'::text as kind, null::timestamptz as fixed_end, created_at as event_created
      from billing_payments where applied_to_subscription_id=p_subscription_id and status='approved' and access_applied_at is not null and refunded_at is null
      union all
      select rw.id,coalesce(rw.resumed_at,rw.created_at),rw.days,'days','reward',null::timestamptz,coalesce(rw.resumed_at,rw.created_at) from referral_rewards rw
      where rw.subscription_id=p_subscription_id and rw.user_id=p_user_id and rw.revoked_at is null
      union all
      select rb.subscription_id,rb.period_start,0,'days','baseline',rb.period_end,rb.period_start from referral_access_baselines rb where rb.subscription_id=p_subscription_id
    ) events order by approved_at,case when kind='baseline' then 0 else 1 end,event_created,id
  loop
    v_cursor := greatest(v_payment.approved_at, coalesce(v_cursor, v_payment.approved_at));
    if v_first_start is null then v_first_start := v_cursor; end if;
    v_last_end := case when v_payment.kind='baseline' then v_cursor+(v_payment.fixed_end-v_payment.approved_at) else public.add_billing_access_duration(v_cursor, v_payment.duration_value, v_payment.duration_unit) end;

    if v_payment.kind='payment' then

    update public.billing_payments
    set current_period_start = v_cursor,
        current_period_end = v_last_end,
        updated_at = p_now
    where id = v_payment.id;

    v_count := v_count + 1;
    end if;
    v_cursor := v_last_end;
    v_access_count := v_access_count + 1;
  end loop;

  if v_access_count = 0 then
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
      next_due_date = case when v_last_end > p_now and not exists(select 1 from billing_plans rp where rp.id=billing_subscriptions.plan_id and rp.slug='referral-promotional-access') then v_last_end else null end,
      canonical_access_subscription_id = coalesce(canonical_access_subscription_id, id),
      canonicalized_at = coalesce(canonicalized_at, p_now),
      updated_at = p_now
  where id = p_subscription_id;

  subscription_id := p_subscription_id; period_start := v_first_start; period_end := v_last_end; payment_count := v_count;
  return next;
end;
$$;
create function public.referral_dashboard(p_user uuid,p_admin boolean default false) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_campaign jsonb; v_current uuid; v_result jsonb;
begin
 if p_admin and not exists(select 1 from profiles where id=p_user and role='admin') then raise exception 'admin required'; end if;
 select version_id into v_current from referral_campaign_current;
 select to_jsonb(c) into v_campaign from referral_campaign_versions c where id=v_current;
 select jsonb_build_object(
 'campaign',v_campaign,'live',referral_campaign_live(v_current),
 'code',(select code from referral_codes where user_id=p_user),
 'confirmed',(select count(*) from student_referrals where (p_admin or referrer_id=p_user) and version_id=v_current and status='confirmed'),
 'metrics',jsonb_build_object(
  'pending',(select count(*) from student_referrals where (p_admin or referrer_id=p_user) and status='pending'),
  'confirmed',(select count(*) from student_referrals where (p_admin or referrer_id=p_user) and status='confirmed'),
  'total',(select count(*) from student_referrals where (p_admin or referrer_id=p_user)),
  'rewards',(select count(*) from referral_rewards where (p_admin or user_id=p_user) and revoked_at is null),
  'days',(select coalesce(sum(days),0) from referral_rewards where (p_admin or user_id=p_user) and revoked_at is null)),
 'referrals',coalesce((select jsonb_agg(x) from (select r.id,'Novo aluno' as name,r.created_at,r.confirmed_at,r.status,r.version_id,case when p_admin then r.payment_id else null end as payment_id from student_referrals r where p_admin or r.referrer_id=p_user order by r.created_at desc,r.id limit 100) x),'[]'::jsonb),
 'rewards',coalesce((select jsonb_agg(x) from (select id,days,kind,ordinal,created_at,revoked_at,version_id,case when p_admin then coalesce(resumed_by_payment_id,payment_id) else null end as payment_id from referral_rewards where p_admin or user_id=p_user order by created_at desc,id limit 100) x),'[]'::jsonb),
 'versions',case when p_admin then coalesce((select jsonb_agg(x) from(select * from referral_campaign_versions order by created_at desc limit 100)x),'[]'::jsonb) else '[]'::jsonb end
 ) into v_result;
 return v_result;
end; $$;
revoke all on function public.referral_dashboard(uuid,boolean) from public, anon, authenticated;
grant execute on function public.referral_dashboard(uuid,boolean) to service_role;
-- Convert only a promotional access root when the student actually purchases a
-- paid plan. Existing paid/legacy subscription plans are untouched.
create function public.referral_promotional_root_purchase() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='approved' and new.amount_cents>0 and new.access_applied_at is not null and new.applied_to_subscription_id is not null then
  update billing_subscriptions s set plan_id=new.plan_id,
   metadata=coalesce(s.metadata,'{}') || jsonb_build_object('referral_converted_by_payment',new.id)
  where s.id=new.applied_to_subscription_id and s.user_id=new.user_id
   and exists(select 1 from billing_plans p where p.id=s.plan_id and p.slug='referral-promotional-access' and p.metadata->>'referral_only'='true')
   and exists(select 1 from billing_plans p where p.id=new.plan_id and p.price_cents>0);
 end if;
 return new;
end; $$;
create trigger referral_promotional_root_purchase after update of access_applied_at on public.billing_payments
 for each row execute function public.referral_promotional_root_purchase();
revoke all on function public.referral_promotional_root_purchase() from public,anon,authenticated;
grant execute on function public.referral_promotional_root_purchase() to service_role;
