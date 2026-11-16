-- PRE-PUBLICATION: READ ONLY. Safe when stage tables are absent.
-- Paste the entire file into the SQL Editor of the intended project.
-- No function under review is executed; no payer/user rows are read.
-- Presence/hash match is evidence of structure, NOT of migration history or MVCC.
with expected_tables(stage,name) as (values
 ('dependency','profiles'),
 ('dependency','billing_plans'),
 ('dependency','billing_payments'),
 ('dependency','billing_subscriptions'),
 ('dependency','billing_user_entitlements'),
 ('dependency','billing_plan_invites'),
 ('dependency','student_referrals'),
 ('dependency','referral_discount_claims'),
 ('dependency','referral_campaign_versions'),
 ('dependency','referral_campaign_current'),
 ('202610280001_billing_plan_duration_configuration','billing_plan_durations'),
 ('202610280002_prepaid_checkout_recovery','billing_prepaid_attempts'),
 ('202610280002_prepaid_checkout_recovery','billing_prepaid_attempt_keys'),
 ('202610290001_affiliate_program','affiliate_settings'),
 ('202610290001_affiliate_program','affiliate_profiles'),
 ('202610290001_affiliate_program','affiliate_coupons'),
 ('202610290001_affiliate_program','affiliate_sales'),
 ('202610290001_affiliate_program','affiliate_commission_entries'),
 ('202610290001_affiliate_program','affiliate_payouts'),
 ('202610290001_affiliate_program','affiliate_audit')
), table_report as (
 select e.stage,e.name,c.oid is not null as present,c.relrowsecurity as rls,
 (select jsonb_agg(jsonb_build_object('column',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull) order by a.attnum)
  from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as columns,
 (select jsonb_agg(jsonb_build_object('name',con.conname,'type',con.contype,'definition',pg_get_constraintdef(con.oid)) order by con.conname)
  from pg_constraint con where con.conrelid=c.oid) as constraints,
 (select jsonb_agg(jsonb_build_object('name',i.relname,'valid',x.indisvalid,'definition',pg_get_indexdef(i.oid)) order by i.relname)
  from pg_index x join pg_class i on i.oid=x.indexrelid where x.indrelid=c.oid) as indexes,
 (select jsonb_agg(jsonb_build_object('role',coalesce(r.rolname,'PUBLIC'),'privilege',acl.privilege_type))
  from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl left join pg_roles r on r.oid=acl.grantee) as grants
 from expected_tables e left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=e.name and c.relkind in('r','p')
), expected_functions(stage,signature,expected_hash) as (values
 ('202610280001_billing_plan_duration_configuration','public.save_billing_plan_duration(uuid,uuid,integer,boolean,integer,integer)','6b4e7123e8ff8545808e0076ee078145'),
 ('202610280002_prepaid_checkout_recovery','public.prepare_prepaid_checkout(uuid,uuid,text,integer,text,text)','284822cf0a0915474f05e410256716ac'),
 ('202610280002_prepaid_checkout_recovery','public.claim_prepaid_submission(uuid,uuid)','142fa8de06fc6336a4ce5600a6bbe045'),
 ('202610280002_prepaid_checkout_recovery','public.complete_prepaid_submission(uuid,uuid,jsonb,text)','6a8439a71acfda4aa53e46d878990242'),
 ('202610280002_prepaid_checkout_recovery','public.apply_approved_prepaid_payment(uuid,text,text,text,timestamptz,integer)','0c61f9ed652f3f97b918a329fc741205'),
 ('202610280002_prepaid_checkout_recovery','public.recalculate_mercadopago_access_after_reversal(uuid,text,text,text)','570407fb4666498cb8195b7297eb6813'),
 ('202610290001_affiliate_program','public.affiliate_admin_write(uuid,text,jsonb)','4871696da735698f8f327871983a00a0'),
 ('202610290001_affiliate_program','public.affiliate_coupon_quote(uuid,text,integer,text,boolean)','6a362f17ce1b62918568dcc62cfbdfa5'),
 ('202610290001_affiliate_program','public.prepare_affiliate_prepaid_checkout(uuid,uuid,text,integer,text,text,text,boolean)','1c012ae6f505899d69ba9e5ac3a7d36c'),
 ('202610290001_affiliate_program','public.affiliate_reconcile_payment(uuid,integer)','5f151334ed7bd29537b644908a3ca86e'),
 ('202610290001_affiliate_program','public.affiliate_dashboard(uuid,uuid,date,date,integer)','3cb79848e040cf83415487a8db4c57dc')
), function_report as (
 select e.stage,e.signature,p.oid is not null as present,
 case when p.oid is not null then md5(btrim(regexp_replace(p.prosrc,'\s+',' ','g')))=e.expected_hash end as body_matches_local,
 p.prosecdef as security_definer,p.proconfig as settings,
 (select jsonb_agg(jsonb_build_object('role',coalesce(r.rolname,'PUBLIC'),'privilege',a.privilege_type))
  from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a left join pg_roles r on r.oid=a.grantee) as grants
 from expected_functions e left join pg_proc p on p.oid=to_regprocedure(e.signature)
), dependency_functions as (
 select p.proname as name,pg_get_function_identity_arguments(p.oid) as arguments,
 pg_get_function_result(p.oid) as result
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in (
 'mercadopago_user_lock_key','reserve_mercadopago_checkout','referral_calculate_discount',
 'apply_approved_mercadopago_payment','rebuild_mercadopago_access_ledger',
 'add_billing_access_duration','referral_reconcile_payment')
)
select jsonb_build_object(
 'instructions','Return this JSON report. Do not reapply existing objects. Missing dependency, partial stage or differing body requires review.',
 'migration_history_table_present',to_regclass('supabase_migrations.schema_migrations') is not null,
 'tables',coalesce((select jsonb_agg(to_jsonb(t) order by stage,name) from table_report t),'[]'::jsonb),
 'stage_functions',coalesce((select jsonb_agg(to_jsonb(f) order by stage,signature) from function_report f),'[]'::jsonb),
 'dependency_functions',coalesce((select jsonb_agg(to_jsonb(d) order by name,arguments) from dependency_functions d),'[]'::jsonb),
 'roles',(select jsonb_agg(rolname order by rolname) from pg_roles where rolname in('anon','authenticated','service_role'))
) as publication_diagnostic;
