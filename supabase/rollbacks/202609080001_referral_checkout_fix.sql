drop function if exists public.referral_pricing_preview(uuid);

create or replace function public.referral_attach(p_user uuid,p_code text) returns uuid language plpgsql security definer set search_path=public as $$
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

create or replace function public.referral_price_payment(p_payment uuid) returns integer language plpgsql security definer set search_path=public as $$
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
 if p.amount_cents-v_discount=0 then raise exception 'Este benefício integral precisa ser configurado como dias extras de acesso.'; end if;
 insert into referral_discount_claims(referee_id,referral_id,payment_id,version_id,original_cents,discount_cents) values(p.user_id,r.id,p.id,c.id,p.amount_cents,v_discount);
 update billing_payments set amount_cents=amount_cents-v_discount where id=p.id;
 return p.amount_cents-v_discount;
end; $$;

drop function if exists public.referral_calculate_discount(uuid,integer,text,boolean,uuid);
drop function if exists public.referral_finalize_attribution(uuid);
drop function if exists public.referral_queue_attribution(uuid,text);
drop table if exists public.referral_attribution_pending;

revoke all on function public.referral_attach(uuid,text), public.referral_price_payment(uuid) from public,anon,authenticated;
grant execute on function public.referral_attach(uuid,text), public.referral_price_payment(uuid) to service_role;
