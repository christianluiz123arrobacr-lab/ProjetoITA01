-- Read-only. Before migration the table/function will be null; after, both exist.
select to_regclass('public.billing_plan_durations') as duration_table,
 to_regprocedure('public.save_billing_plan_duration(uuid,uuid,integer,boolean,integer,integer)') as save_function;
select c.relrowsecurity as rls_enabled from pg_class c
where c.oid=to_regclass('public.billing_plan_durations');
-- Expected false for public browser roles, true only for the service function.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='billing_plan_durations';
select grantee, privilege_type from information_schema.routine_privileges
where routine_schema='public' and routine_name='save_billing_plan_duration';
