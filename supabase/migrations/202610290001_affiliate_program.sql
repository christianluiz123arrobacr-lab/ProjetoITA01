begin;
create table public.affiliate_settings(id integer primary key check(id=1),commercial_enabled boolean not null default false,payout_day integer not null default 10 check(payout_day between 1 and 31));
insert into public.affiliate_settings(id) values(1);
create table public.affiliate_profiles(id uuid primary key default gen_random_uuid(),user_id uuid not null unique references public.profiles(id),label text not null check(length(label) between 1 and 100),active boolean not null default false,created_at timestamptz not null default now());
create table public.affiliate_coupons(id uuid primary key default gen_random_uuid(),affiliate_id uuid not null references public.affiliate_profiles(id),code text not null unique check(code~'^[A-Z0-9][A-Z0-9_-]{2,31}$'),active boolean not null default false,discount_bps integer not null check(discount_bps between 0 and 9900),commission_bps integer not null check(commission_bps between 0 and 10000),starts_at timestamptz,expires_at timestamptz,max_uses integer check(max_uses>0),plan_ids uuid[],revision integer not null default 1,check(starts_at is null or expires_at is null or starts_at<expires_at));
create table public.affiliate_sales(payment_id uuid primary key references public.billing_payments(id),affiliate_id uuid not null references public.affiliate_profiles(id),coupon_id uuid not null references public.affiliate_coupons(id),snapshot jsonb not null,paid_cents integer not null check(paid_cents>0),commission_bps integer not null check(commission_bps between 0 and 10000),refunded_cents integer not null default 0 check(refunded_cents>=0 and refunded_cents<=paid_cents),approved boolean not null default false,chargeback boolean not null default false,released boolean not null default false,reserved boolean not null default true,commission_cents integer not null default 0,revision integer not null default 0,created_at timestamptz not null default now(),confirmed_at timestamptz);
create index affiliate_sales_owner on public.affiliate_sales(affiliate_id,created_at,payment_id);
create index affiliate_sales_coupon on public.affiliate_sales(coupon_id,reserved);
create table public.affiliate_commission_entries(id bigint generated always as identity primary key,payment_id uuid not null references public.affiliate_sales(payment_id),revision integer not null,delta_cents integer not null,reason text not null,created_at timestamptz not null default now(),unique(payment_id,revision));
create table public.affiliate_payouts(id uuid primary key default gen_random_uuid(),affiliate_id uuid not null references public.affiliate_profiles(id),request_key uuid not null unique,amount_cents integer not null check(amount_cents>0),paid_on date not null,reference text not null check(length(reference) between 1 and 160),actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now());
create unique index affiliate_payout_reference_unique on public.affiliate_payouts(affiliate_id,lower(trim(reference)));
create table public.affiliate_audit(id bigint generated always as identity primary key,actor_id uuid references public.profiles(id),action text not null,entity_id uuid,details jsonb not null,created_at timestamptz not null default now());

create function public.affiliate_admin_write(p_actor uuid,p_kind text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_old jsonb; v_new jsonb; v_payout affiliate_payouts; v_available bigint; v_aff uuid; v_plans uuid[];
begin
 if not exists(select 1 from profiles where id=p_actor and role='admin' and ativo) then raise exception 'Administrator required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('affiliate-finance',0));
 if p_kind='profile' then
   select to_jsonb(a) into v_old from affiliate_profiles a where user_id=(p_payload->>'userId')::uuid;
   insert into affiliate_profiles(user_id,label,active) values((p_payload->>'userId')::uuid,p_payload->>'label',(p_payload->>'active')::boolean)
   on conflict(user_id) do update set label=excluded.label,active=excluded.active returning id,to_jsonb(affiliate_profiles) into v_id,v_new;
 elsif p_kind='coupon' then
   v_id:=coalesce((p_payload->>'id')::uuid,gen_random_uuid());
   select to_jsonb(c) into v_old from affiliate_coupons c where id=v_id;
   if p_payload->'planIds'<>'null'::jsonb then select array_agg(value::uuid) into v_plans from jsonb_array_elements_text(p_payload->'planIds');
     if coalesce(cardinality(v_plans),0)=0 then raise exception 'Select eligible plans or use null'; end if;
     if exists(select 1 from unnest(v_plans) q where not exists(select 1 from billing_plans where id=q)) then raise exception 'Invalid plan'; end if;
   end if;
   insert into affiliate_coupons(id,affiliate_id,code,active,discount_bps,commission_bps,starts_at,expires_at,max_uses,plan_ids)
   values(v_id,(p_payload->>'affiliateId')::uuid,p_payload->>'code',(p_payload->>'active')::boolean,(p_payload->>'discountBps')::integer,(p_payload->>'commissionBps')::integer,(p_payload->>'startsAt')::timestamptz,(p_payload->>'expiresAt')::timestamptz,(p_payload->>'maxUses')::integer,v_plans)
   on conflict(id) do update set affiliate_id=excluded.affiliate_id,code=excluded.code,active=excluded.active,discount_bps=excluded.discount_bps,commission_bps=excluded.commission_bps,starts_at=excluded.starts_at,expires_at=excluded.expires_at,max_uses=excluded.max_uses,plan_ids=excluded.plan_ids,revision=affiliate_coupons.revision+1
   returning to_jsonb(affiliate_coupons) into v_new;
 elsif p_kind='settings' then
   select to_jsonb(s) into v_old from affiliate_settings s where id=1;
   update affiliate_settings set payout_day=(p_payload->>'payoutDay')::integer where id=1 returning to_jsonb(affiliate_settings) into v_new;
 elsif p_kind='release' then
   v_id:=(p_payload->>'paymentId')::uuid;
   if not exists(select 1 from affiliate_sales where payment_id=v_id and approved and commission_cents>0) then raise exception 'Commission not eligible'; end if;
   select to_jsonb(s) into v_old from affiliate_sales s where payment_id=v_id;
   update affiliate_sales set released=true where payment_id=v_id returning to_jsonb(affiliate_sales) into v_new;
 elsif p_kind='payout' then
   if (p_payload->>'paidOn')::date>current_date then raise exception 'Payout must already have occurred';end if;
   v_aff:=(p_payload->>'affiliateId')::uuid;
   select * into v_payout from affiliate_payouts where request_key=(p_payload->>'requestKey')::uuid;
   if v_payout.id is null then select * into v_payout from affiliate_payouts where affiliate_id=v_aff and lower(trim(reference))=lower(trim(p_payload->>'reference'));end if;
   if v_payout.id is not null then
     if v_payout.affiliate_id<>v_aff or v_payout.amount_cents<>(p_payload->>'amountCents')::integer or v_payout.paid_on<>(p_payload->>'paidOn')::date or lower(trim(v_payout.reference))<>lower(trim(p_payload->>'reference')) then raise exception 'Idempotency key conflict'; end if;
     return to_jsonb(v_payout);
   end if;
   select coalesce(sum(commission_cents),0) into v_available from affiliate_sales where affiliate_id=v_aff and released;
   v_available:=v_available-(select coalesce(sum(amount_cents),0) from affiliate_payouts where affiliate_id=v_aff);
   if (p_payload->>'amountCents')::integer>v_available then raise exception 'Insufficient released balance'; end if;
   insert into affiliate_payouts(affiliate_id,request_key,amount_cents,paid_on,reference,actor_id)
   values(v_aff,(p_payload->>'requestKey')::uuid,(p_payload->>'amountCents')::integer,(p_payload->>'paidOn')::date,p_payload->>'reference',p_actor)
   returning id,to_jsonb(affiliate_payouts) into v_id,v_new;
 else raise exception 'Invalid operation'; end if;
 insert into affiliate_audit(actor_id,action,entity_id,details) values(p_actor,p_kind,v_id,jsonb_build_object('previous',v_old,'next',v_new));
 return v_new;
end; $$;

create function public.affiliate_coupon_quote(p_user uuid,p_slug text,p_months integer,p_code text,p_backend_enabled boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c affiliate_coupons; f affiliate_profiles; p billing_plans; d billing_plan_durations; v_base bigint; v_duration integer; v_coupon integer; v_paid integer;
begin
 if not coalesce(p_backend_enabled,false) or not (select commercial_enabled from affiliate_settings where id=1) then raise exception 'Affiliate checkout disabled'; end if;
 if not exists(select 1 from profiles where id=p_user and ativo) then raise exception 'Unauthorized' using errcode='42501'; end if;
 if exists(select 1 from student_referrals where referee_id=p_user) then raise exception 'Affiliate coupon cannot combine with referral attribution'; end if;
 select * into p from billing_plans where slug=p_slug and is_active and is_public and price_cents>0 and currency='BRL';
 if p.id is null or p_months is null or p_months not in(1,2,3,6,12) then raise exception 'Invalid plan or duration'; end if;
 if p.requires_legacy_founder_eligibility and not exists(select 1 from billing_user_entitlements where user_id=p_user and entitlement_key='legacy_founder_eligible')
 and not exists(select 1 from billing_plan_invites i join profiles pr on pr.id=p_user where i.plan_id=p.id and i.used_at is null and (i.user_id is null or i.user_id=p_user) and (i.email is null or lower(trim(i.email))=lower(trim(pr.email))) and (i.expires_at is null or i.expires_at>now())) then raise exception 'Founder eligibility required'; end if;
 select * into d from billing_plan_durations where plan_id=p.id and months=p_months;
 if d.plan_id is null and p_months<=3 then d.enabled:=true;d.discount_bps:=0;
 elsif d.plan_id is null or not d.enabled then raise exception 'Duration disabled'; end if;
 select * into c from affiliate_coupons where code=p_code;
 select * into f from affiliate_profiles where id=c.affiliate_id;
 if c.id is null or not c.active or not f.active or not exists(select 1 from profiles where id=f.user_id and ativo) or (c.starts_at is not null and c.starts_at>now()) or (c.expires_at is not null and c.expires_at<=now()) then raise exception 'Invalid or unavailable coupon'; end if;
 if c.plan_ids is not null and not p.id=any(c.plan_ids) then raise exception 'Coupon not eligible for plan'; end if;
 if c.max_uses is not null and (select count(*) from affiliate_sales where coupon_id=c.id and reserved)>=c.max_uses then raise exception 'Coupon limit reached'; end if;
 v_base:=p.price_cents::bigint*p_months;v_duration:=floor((v_base*d.discount_bps+5000)/10000)::integer;
 v_coupon:=floor(((v_base-v_duration)*c.discount_bps+5000)/10000)::integer;v_paid:=(v_base-v_duration-v_coupon)::integer;
 if v_paid<1 then raise exception 'Invalid payable amount'; end if;
 return jsonb_build_object('code',c.code,'months',p_months,'subtotalCents',v_base,'durationDiscountCents',v_duration,'couponDiscountCents',v_coupon,'totalCents',v_paid);
end; $$;

create function public.prepare_affiliate_prepaid_checkout(p_user uuid,p_key uuid,p_slug text,p_months integer,p_method text,p_email text,p_coupon text,p_backend_enabled boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a jsonb; c affiliate_coupons; f affiliate_profiles; v_existing boolean; v_discount integer; v_total integer; v_snapshot jsonb; v_pay uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('affiliate-finance',0));
 perform pg_advisory_xact_lock(hashtextextended('referral-program',0));
 perform pg_advisory_xact_lock(mercadopago_user_lock_key(p_user));
 select exists(select 1 from billing_prepaid_attempt_keys where user_id=p_user and attempt_key=p_key) or exists(
 select 1 from billing_prepaid_attempts a join billing_payments bp on bp.id=a.payment_id where a.user_id=p_user and (a.state<>'ready' or bp.status='pending')) into v_existing;
 if not v_existing then
   perform affiliate_coupon_quote(p_user,p_slug,p_months,p_coupon,p_backend_enabled);
   if not coalesce(p_backend_enabled,false) or not (select commercial_enabled from affiliate_settings where id=1) then raise exception 'Affiliate checkout disabled'; end if;
   -- Until stacking policy is approved, any existing referral attribution
   -- excludes coupon checkout. Normal checkout/indication remains unchanged.
   if exists(select 1 from student_referrals where referee_id=p_user) then raise exception 'Affiliate coupon cannot combine with referral attribution'; end if;
   select * into c from affiliate_coupons where code=p_coupon;
   select * into f from affiliate_profiles where id=c.affiliate_id;
   if c.id is null or not c.active or not f.active or (c.starts_at is not null and c.starts_at>now()) or (c.expires_at is not null and c.expires_at<=now()) then raise exception 'Invalid or unavailable coupon'; end if;
   if c.plan_ids is not null and not exists(select 1 from billing_plans where slug=p_slug and id=any(c.plan_ids)) then raise exception 'Coupon not eligible for plan'; end if;
   if c.max_uses is not null and (select count(*) from affiliate_sales where coupon_id=c.id and reserved)>=c.max_uses then raise exception 'Coupon limit reached'; end if;
 end if;
 a:=prepare_prepaid_checkout(p_user,p_key,p_slug,p_months,p_method,p_email);
 if v_existing then
   if a->'snapshot'->'affiliate'->>'code' is distinct from p_coupon then raise exception 'Coupon differs from existing purchase'; end if;
   return a;
 end if;
 v_pay:=(a->>'payment_id')::uuid;
 v_total:=(a->'snapshot'->>'after_duration_cents')::integer;
 v_discount:=floor((v_total::bigint*c.discount_bps+5000)/10000)::integer;
 v_snapshot:=jsonb_build_object('affiliate_id',f.id,'coupon_id',c.id,'code',c.code,'revision',c.revision,'discount_bps',c.discount_bps,'discount_cents',v_discount,'commission_bps',c.commission_bps,'commission_basis','paid_before_provider_fees','rounding','half_up');
 update billing_prepaid_attempts set snapshot=snapshot||jsonb_build_object('affiliate',v_snapshot,'total_cents',v_total-v_discount) where id=(a->>'id')::uuid returning to_jsonb(billing_prepaid_attempts) into a;
 update billing_payments set amount_cents=v_total-v_discount,metadata=metadata||jsonb_build_object('pricing_snapshot',a->'snapshot') where id=v_pay;
 insert into affiliate_sales(payment_id,affiliate_id,coupon_id,snapshot,paid_cents,commission_bps) values(v_pay,f.id,c.id,v_snapshot,v_total-v_discount,c.commission_bps);
 return a;
end; $$;

create function public.affiliate_reconcile_payment(p_payment uuid,p_refunded_cents integer)
returns void language plpgsql security definer set search_path=public as $$
declare s affiliate_sales; p billing_payments; v_target integer; v_delta integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('affiliate-finance',0));
 select * into s from affiliate_sales where payment_id=p_payment for update;
 if s.payment_id is null then return; end if;
 select * into p from billing_payments where id=p_payment;
 if p_refunded_cents is null or p_refunded_cents<0 or p_refunded_cents>s.paid_cents or p.amount_cents<>s.paid_cents then raise exception 'Invalid official amount'; end if;
 s.refunded_cents:=greatest(s.refunded_cents,p_refunded_cents);
 if p.status in('refunded','chargeback') then s.refunded_cents:=s.paid_cents; end if;
 s.chargeback:=s.chargeback or p.status='chargeback';
 s.approved:=s.approved or (p.status='approved' and p.access_applied_at is not null);
 v_target:=case when s.approved and not s.chargeback then floor(((s.paid_cents-s.refunded_cents)::bigint*s.commission_bps+5000)/10000)::integer else 0 end;
 v_delta:=v_target-s.commission_cents;
 if v_delta<>0 then
   insert into affiliate_commission_entries(payment_id,revision,delta_cents,reason) values(p_payment,s.revision+1,v_delta,case when v_delta<0 and s.refunded_cents>0 and s.refunded_cents<s.paid_cents then 'partial_refund' else p.status end);
   s.revision:=s.revision+1;
 end if;
 update affiliate_sales set commission_cents=v_target,revision=s.revision,refunded_cents=s.refunded_cents,chargeback=s.chargeback,approved=s.approved,
 reserved=case when p.status in('rejected','expired','failed') and not s.approved then false else true end,
 confirmed_at=case when s.approved then coalesce(confirmed_at,now()) else confirmed_at end where payment_id=p_payment;
end; $$;

create function public.affiliate_dashboard(p_actor uuid,p_subject uuid,p_from date,p_until date,p_page integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_role text; f affiliate_profiles; v_subject uuid; v_data jsonb; v_day integer; v_next date; v_month date;
begin
 select role into v_role from profiles where id=p_actor and ativo;
 if v_role is null then raise exception 'Unauthorized' using errcode='42501'; end if;
 v_subject:=coalesce(p_subject,p_actor);
 if v_role<>'admin' and v_subject<>p_actor then raise exception 'Forbidden' using errcode='42501'; end if;
 select * into f from affiliate_profiles where user_id=v_subject;
 if f.id is null and v_role not in('admin','editor') then raise exception 'Affiliate required' using errcode='42501'; end if;
 if p_from is null or p_until is null or p_until<=p_from or p_until-p_from>366 or p_page is null or p_page<0 or p_page>100000 then raise exception 'Invalid report range'; end if;
 select payout_day into v_day from affiliate_settings where id=1;
 v_month:=date_trunc('month',current_date)::date;
 v_next:=least(v_month+v_day-1,(v_month+interval '1 month'-interval '1 day')::date);
 if v_next<current_date then v_month:=(v_month+interval '1 month')::date;v_next:=least(v_month+v_day-1,(v_month+interval '1 month'-interval '1 day')::date);end if;
 v_data:=jsonb_build_object('affiliate',case when f.id is null then null else jsonb_build_object('id',f.id,'label',f.label,'active',f.active) end,
 'commercialEnabled',(select commercial_enabled from affiliate_settings where id=1),'payoutDay',v_day,'nextReferenceDate',v_next,
 'coupons',coalesce((select jsonb_agg(to_jsonb(c) order by code) from affiliate_coupons c where affiliate_id=f.id),'[]'::jsonb),
 'pendingCents',(select coalesce(sum(commission_cents),0) from affiliate_sales where affiliate_id=f.id and not released),
 'releasedCents',(select coalesce(sum(commission_cents),0) from affiliate_sales where affiliate_id=f.id and released),
 'paidCents',(select coalesce(sum(amount_cents),0) from affiliate_payouts where affiliate_id=f.id),
 'reversedCents',(select coalesce(-sum(e.delta_cents),0) from affiliate_commission_entries e join affiliate_sales s using(payment_id) where s.affiliate_id=f.id and e.delta_cents<0),
 'periodConfirmedSales',(select count(*) from affiliate_sales where affiliate_id=f.id and approved and (confirmed_at at time zone 'UTC')::date>=p_from and (confirmed_at at time zone 'UTC')::date<p_until),
 'periodNetCents',(select coalesce(sum(paid_cents-refunded_cents),0) from affiliate_sales where affiliate_id=f.id and approved and (confirmed_at at time zone 'UTC')::date>=p_from and (confirmed_at at time zone 'UTC')::date<p_until),
 'adjustments',coalesce((select jsonb_agg(q) from (select e.id,e.delta_cents,e.reason,e.created_at from affiliate_commission_entries e join affiliate_sales s using(payment_id) where s.affiliate_id=f.id order by e.created_at desc,e.id desc limit 20 offset p_page*20) q),'[]'::jsonb),
 'adjustmentCount',(select count(*) from affiliate_commission_entries e join affiliate_sales s using(payment_id) where s.affiliate_id=f.id),
 'salesByDay',coalesce((select jsonb_agg(q order by day) from (select (confirmed_at at time zone 'UTC')::date as day,count(*) as sales,sum(paid_cents-refunded_cents) as sold_cents from affiliate_sales where affiliate_id=f.id and approved and (confirmed_at at time zone 'UTC')::date>=p_from and (confirmed_at at time zone 'UTC')::date<p_until group by 1) q),'[]'::jsonb),
 'payouts',coalesce((select jsonb_agg(q) from (select id,amount_cents,paid_on,reference,created_at from affiliate_payouts where affiliate_id=f.id order by created_at desc,id limit 20 offset p_page*20) q),'[]'::jsonb),
 'payoutCount',(select count(*) from affiliate_payouts where affiliate_id=f.id),
 'sales',coalesce((select jsonb_agg(q) from(select payment_id,paid_cents,commission_cents,refunded_cents,approved,released,chargeback,created_at,confirmed_at from affiliate_sales where affiliate_id=f.id and created_at>=p_from::timestamp at time zone 'UTC' and created_at<p_until::timestamp at time zone 'UTC' order by created_at desc,payment_id limit 20 offset p_page*20) q),'[]'::jsonb),
 'saleCount',(select count(*) from affiliate_sales where affiliate_id=f.id and created_at>=p_from::timestamp at time zone 'UTC' and created_at<p_until::timestamp at time zone 'UTC'));
 if v_role='admin' then v_data:=v_data||jsonb_build_object('affiliates',coalesce((select jsonb_agg(to_jsonb(a) order by label,id) from affiliate_profiles a),'[]'::jsonb)); end if;
 return v_data;
end; $$;

do $$ declare t text; f regprocedure; begin
 foreach t in array array['affiliate_settings','affiliate_profiles','affiliate_coupons','affiliate_sales','affiliate_commission_entries','affiliate_payouts','affiliate_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to service_role',t);
 end loop;
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('affiliate_admin_write','affiliate_coupon_quote','prepare_affiliate_prepaid_checkout','affiliate_reconcile_payment','affiliate_dashboard') loop
 execute format('revoke all on function %s from public,anon,authenticated',f);
 execute format('grant execute on function %s to service_role',f);
 end loop;
end; $$;
commit;
