-- READ ONLY. Optional diagnostic, not a migration. Run manually in SQL Editor.
-- Returns policies and privileges, never credentials or application row contents.
select n.nspname as schema_name, c.relname as relation_name,
       c.relkind, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
       c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in (
  'profiles', 'admin_users', 'questoes', 'resolucoes', 'resolucoes_meta',
  'user_question_attempts', 'user_error_review_status', 'user_vet_profiles',
  'vet_mock_sessions', 'vet_mock_session_items', 'vet_exam_content_weights',
  'vet_content_collective_stats', 'google_drive_connections',
  'billing_notification_log', 'question_reports', 'question_import_batches',
  'question_import_assets', 'question_import_items'
)) or (n.nspname = 'storage' and c.relname in ('objects', 'buckets'))
order by 1, 2;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in (
  'profiles', 'admin_users', 'questoes', 'resolucoes', 'resolucoes_meta',
  'user_question_attempts', 'user_error_review_status', 'user_vet_profiles',
  'vet_mock_sessions', 'vet_mock_session_items', 'vet_exam_content_weights',
  'vet_content_collective_stats', 'google_drive_connections',
  'billing_notification_log', 'question_reports', 'question_import_batches',
  'question_import_assets', 'question_import_items'
)) or (schemaname = 'storage' and tablename = 'objects')
order by 1, 2, 3;

select r.rolname, n.nspname as schema_name, c.relname as relation_name,
       has_table_privilege(r.oid, c.oid, 'SELECT') as can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') as can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') as can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') as can_delete
from pg_roles r cross join pg_class c join pg_namespace n on n.oid = c.relnamespace
where r.rolname in ('anon', 'authenticated', 'service_role')
  and n.nspname = 'public'
  and c.relname in ('questoes', 'resolucoes', 'profiles', 'admin_users',
    'user_question_attempts', 'google_drive_connections', 'billing_notification_log')
order by 1, 2, 3;

-- Table ACLs alone do not establish effective access through RLS or column ACLs.
select r.rolname, n.nspname as schema_name, c.relname as relation_name,
       a.attname as column_name,
       has_column_privilege(r.oid, c.oid, a.attnum, 'SELECT') as can_select_column,
       has_column_privilege(r.oid, c.oid, a.attnum, 'UPDATE') as can_update_column
from pg_roles r cross join pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where r.rolname in ('anon', 'authenticated', 'service_role')
  and n.nspname = 'public'
  and ((c.relname = 'questoes' and a.attname in ('enunciado', 'alternativa_correta'))
    or (c.relname = 'profiles' and a.attname in ('role', 'ativo', 'email'))
    or (c.relname = 'google_drive_connections' and a.attname = 'encrypted_refresh_token'))
order by 1, 2, 3, 4;

select p.oid::regprocedure as function_signature, p.prosecdef as security_definer,
       p.proconfig, r.rolname,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join pg_roles r
where n.nspname = 'public'
  and r.rolname in ('anon', 'authenticated', 'service_role')
  and p.proname in ('user_has_active_subscription', 'vet_resolve_access_role',
    'record_canonical_question_attempt', 'vet_admin_dashboard',
    'vet_admin_student_statistics', 'refresh_vet_collective_stats')
order by 1, 4;
