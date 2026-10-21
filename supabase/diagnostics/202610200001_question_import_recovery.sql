-- Read-only preflight. Apply no DELETE/UPDATE to "fix" these results.
select to_regclass('public.questoes') as questions,
  to_regclass('public.resolucoes') as blocks,
  to_regclass('public.question_import_batches') as batches,
  to_regclass('public.question_import_image_slots') as slots,
  to_regprocedure('public.vet_resolve_access_role(uuid)') as role_resolver,
  to_regprocedure('public.vet_import_control(uuid,uuid,text,uuid,jsonb)') as recovery_already_installed;

-- Unexpected project-specific triggers must be reviewed before applying.
select t.tgrelid::regclass as relation,t.tgname,pg_get_triggerdef(t.oid) as definition
from pg_trigger t where not t.tgisinternal and t.tgrelid in ('public.questoes'::regclass,'public.resolucoes'::regclass,
  'public.question_import_batches'::regclass,'public.question_import_image_slots'::regclass);

select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where (schemaname='public' and tablename in ('questoes','resolucoes','question_import_batches','question_import_image_slots'))
  or (schemaname='storage' and tablename='objects');

select import_source_id, count(*) as duplicates
from public.questoes where import_source_id is not null
group by import_source_id having count(*)>1;

select c.relname, i.indisunique, i.indisvalid, pg_get_indexdef(c.oid) as definition
from pg_index i join pg_class c on c.oid=i.indexrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='questoes_import_source_id_unique_idx';

-- Existing partially imported sessions; preserve all rows and images.
select b.id,b.status,count(q.id) as existing_questions,b.result->>'failedCount' as historical_failures
from public.question_import_batches b left join public.questoes q on q.import_batch_id=b.id::text
group by b.id having count(q.id)>0 or coalesce((b.result->>'failedCount')::int,0)>0;

-- Ambiguous legacy gaps require editorial review, never automatic repair.
select q.id as question_id,q.import_batch_id,b.status as batch_status
from public.questoes q left join public.question_import_batches b on q.import_batch_id=b.id::text
where q.import_source_id is not null and not exists(select 1 from public.resolucoes r where r.questao_id=q.id);

-- Unrecognized historical paths are preserved for manual review.
select id,batch_id,status,bucket
from public.question_import_image_slots
where storage_path is not null and storage_path !~ ('^question-imports/'||batch_id||'/'||id||'/[0-9a-f-]{36}\.(png|jpg|webp)$');
