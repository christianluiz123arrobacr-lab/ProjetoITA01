-- Manual application before publishing. Depends on 202610080001. No historical writes.
begin;
-- Only metadata: do not convert the entire question (statement/images/options) to JSON.
-- Both spellings exist in legacy installations; resolve actual columns at installation.
do $install$
declare canonical text := 'null::text'; legacy text := 'null::text'; groups_column text := 'null::jsonb';
begin
 if exists(select 1 from pg_attribute where attrelid='public.questoes'::regclass and attname='disciplina' and not attisdropped) then canonical := 'q.disciplina'; end if;
 if exists(select 1 from pg_attribute where attrelid='public.questoes'::regclass and attname='diciplina' and not attisdropped) then legacy := 'q.diciplina'; end if;
 if exists(select 1 from pg_attribute where attrelid='public.questoes'::regclass and attname='assuntos_por_conteudo' and not attisdropped) then groups_column := 'to_jsonb(q.assuntos_por_conteudo)'; end if;
 execute format($view$create view public.vet_question_catalog as
 select q.id,q.created_at,q.publicada,q.ano,q.codigo,q.banca,q."instituição",q.dificuldade,
 coalesce(nullif(%1$s,''),nullif(%2$s,''),'—') admin_subject,
 coalesce(%1$s,%2$s,'fisica') student_subject,
 coalesce(%1$s,%2$s) search_subject,
 public.vet_s2_list(to_jsonb(q.conteudos),q.conteudo,false) topics,
 public.vet_s2_list(to_jsonb(q.assuntos),q.assunto,false) subtopics,
 coalesce((select jsonb_agg(g) from jsonb_array_elements(case when jsonb_typeof(%3$s)='array' then %3$s else '[]'::jsonb end) g
 where public.vet_s2_trim(coalesce(g->>'conteudo',g->>'topic'))<>'' and exists(select 1 from jsonb_array_elements_text(case when jsonb_typeof(g->'assuntos')='array' then g->'assuntos' when jsonb_typeof(g->'subtopics')='array' then g->'subtopics' else '[]'::jsonb end) s where public.vet_s2_trim(s)<>'')),'[]'::jsonb) groups
 from public.questoes q$view$,canonical,legacy,groups_column);
end $install$;
revoke all on public.vet_question_catalog from public,anon,authenticated;
grant select on public.vet_question_catalog to service_role;

create function public.vet_question_global_stats() returns jsonb
language sql stable security invoker set search_path='' as $$
with source as materialized (
 select lower(public.vet_s2_trim(student_subject)) subject,
 dificuldade,regexp_replace(public.vet_s2_norm(dificuldade),'[\s-]+','_','g') difficulty
 from public.vet_question_catalog where publicada=true
) select jsonb_build_object('total',(select count(*) from source),
 'totalDifficulties',(select count(distinct dificuldade) from source where dificuldade<>''),
 'subjects',coalesce((select jsonb_object_agg(v,n) from (select subject v,count(*) n from source group by 1) s),'{}'),
 'difficulties',coalesce((select jsonb_object_agg(v,n) from (select difficulty v,count(*) n from source where difficulty<>'' group by 1) s),'{}'));
$$;

-- Preserve the existing precedence exactly. Scalar subqueries reject duplicate identities.
-- One statement/snapshot per authenticated request; no cross-request role cache.
create function public.vet_resolve_access_role(p_user uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
with snapshot as (
 select (select a.role from public.admin_users a where a.user_id=p_user) admin_role,
 (select jsonb_build_object('role',p.role,'ativo',p.ativo) from public.profiles p where p.id=p_user) profile
) select jsonb_build_object('role',case when admin_role in ('admin','editor') then admin_role
 when profile->>'role'='admin' then 'admin' else 'student' end,'profile',profile) from snapshot;
$$;

-- Admin has no practice filter and does not use student topic/group traversal.
-- Keep student RPC unchanged. Exact count and facets share a narrow metadata snapshot.
create function public.vet_admin_browse_questions(p_filters jsonb,p_page integer,p_size integer,p_admin boolean,p_user uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not p_admin or p_page<0 or p_size<1 or p_size>100 or p_page>100000 then raise exception 'invalid pagination' using errcode='22023'; end if;
 return (
 with core as materialized (
  select c.id,c.created_at,c.publicada,c.ano,c.codigo,c.banca,c."instituição",c.dificuldade,
  c.admin_subject,c.search_subject,c.topics,c.subtopics,
  lower(public.vet_s2_trim(dificuldade)) difficulty,
  case when coalesce(p_filters->'topics','[]')='[]' or c.groups='[]' then c.subtopics else
   array(select distinct lower(public.vet_s2_trim(s)) from jsonb_array_elements(c.groups) g,
    lateral jsonb_array_elements_text(case when jsonb_typeof(g->'assuntos')='array' then g->'assuntos' when jsonb_typeof(g->'subtopics')='array' then g->'subtopics' else '[]' end) s
    where public.vet_s2_overlap(array[coalesce(g->>'conteudo',g->>'topic')],p_filters->'topics',true) and public.vet_s2_trim(s)<>'') end selected_subtopics
  from public.vet_question_catalog c
  where public.vet_s2_overlap(array[banca],p_filters->'exams',true)
   and (p_filters->>'yearFrom' is null or ano >= (p_filters->>'yearFrom')::int)
   and (p_filters->>'yearTo' is null or ano <= (p_filters->>'yearTo')::int)
 ), candidates as materialized (
  select * from core where
   public.vet_s2_overlap(array["instituição"],p_filters->'institutions',true)
   and (coalesce(p_filters->'years','[]')='[]' or exists(select 1 from jsonb_array_elements_text(p_filters->'years') y where ano=y::int))
   and public.vet_s2_overlap(array[admin_subject],p_filters->'subjects',true)
   and public.vet_s2_overlap(topics,p_filters->'topics',true)
   and public.vet_s2_overlap(selected_subtopics,p_filters->'subtopics',true)
   and public.vet_s2_overlap(array[difficulty],p_filters->'difficulties',true)
   and (coalesce(p_filters->>'publication','all')='all' or case p_filters->>'publication' when 'published' then publicada=true when 'unpublished' then publicada is not true else false end)
   -- Admin RPC previously had attempted=false for every row.
   and (coalesce(p_filters->>'practiceStatus','all')='all' or (p_user is not null and p_filters->>'practiceStatus'='unanswered'))
 ), matched as materialized (
  select c.id,c.created_at,c.difficulty from candidates c
  where coalesce(p_filters->>'search','')='' or exists (
   select 1 from public.questoes q, lateral unnest(array[c.codigo,q.enunciado,c.banca,c."instituição",c.ano::text,c.search_subject,array_to_string(c.topics,' '),array_to_string(c.subtopics,' ')]) part
   where q.id=c.id and strpos(public.vet_s2_norm(part,true),public.vet_s2_norm(p_filters->>'search',true))>0
  )
 ), page as materialized (select id,created_at from matched order by created_at desc,id asc limit p_size offset p_page::bigint*p_size),
 projected as (
  select p.id,p.created_at,(select jsonb_object_agg(key,case when key='enunciado' then to_jsonb(left(value#>>'{}',90)) else value end)
   from jsonb_each(to_jsonb(q)) where key=any(array['id','codigo','disciplina','diciplina','conteudo','conteudos','assunto','assuntos','assuntos_por_conteudo','banca','ano','dificuldade','instituição','publicada','created_at','enunciado','is_public','public_slug','public_noindex'])) row
  from page p join public.questoes q on q.id=p.id
 ), summaries as (
  select r.questao_id,count(*) "totalBlocks",count(*) filter(where lower(public.vet_s2_trim(r.tipo))='imagem' or coalesce(r.url_imagem,'')<>'') "totalImages"
  from public.resolucoes r join page p on p.id=r.questao_id group by r.questao_id
 ) select jsonb_build_object('rows',coalesce((select jsonb_agg(row order by created_at desc,id asc) from projected),'[]'),
'total',(select count(*) from matched),'selectionIds',null,'selectionRevision',(select md5(string_agg(id::text,',' order by created_at desc,id asc)) from matched),'page',p_page,'pageSize',p_size,
 'resolutionSummaries',coalesce((select jsonb_agg(to_jsonb(s)) from summaries s),'[]'),
 'facets',jsonb_build_object(
  'institutions',coalesce((select jsonb_agg(v order by v) from (select distinct public.vet_s2_trim("instituição") v from core where public.vet_s2_trim("instituição")<>'') s),'[]'),
  'years',coalesce((select jsonb_agg(v order by v::int desc) from (select distinct ano::text v from core where ano is not null) s),'[]'),
  'subjects',coalesce((select jsonb_agg(v order by v) from (select distinct public.vet_s2_trim(admin_subject) v from core where public.vet_s2_trim(admin_subject)<>'') s),'[]'),
  'topics',coalesce((select jsonb_agg(v order by v) from (select distinct v from core,lateral unnest(topics) v) s),'[]'),
  'subtopics',coalesce((select jsonb_agg(v order by v) from (select distinct v from core,lateral unnest(selected_subtopics) v) s),'[]'),
  'difficulties',coalesce((select jsonb_agg(v order by v) from (select distinct difficulty v from core where difficulty<>'') s),'[]')),
 'stats',jsonb_build_object('total',(select count(*) from core),'totalDifficulties',(select count(distinct dificuldade) from core where dificuldade<>''),
 'subjects',coalesce((select jsonb_object_agg(v,n) from (select lower(public.vet_s2_trim(admin_subject)) v,count(*) n from core group by 1) s),'{}'),
 'difficulties',coalesce((select jsonb_object_agg(v,n) from (select difficulty v,count(*) n from core where difficulty<>'' group by 1) s),'{}'),
 'filteredDifficulties',coalesce((select jsonb_object_agg(v,n) from (select difficulty v,count(*) n from matched where difficulty<>'' group by 1) s),'{}'),
 'answered',0,'correct',0,'wrong',0,'unanswered',(select count(*) from core)))
 );
end $$;

-- Preserve student semantics; add only a deterministic selection fingerprint.
create or replace function public.vet_browse_questions(p_filters jsonb, p_page integer, p_size integer, p_admin boolean, p_user uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
 if p_page<0 or p_size<1 or p_size>100 or p_page>100000 then raise exception 'invalid pagination' using errcode='22023'; end if;
 return (
 with source as materialized (
   -- Materialize legacy JSON once, rather than expanding to_jsonb(q) at every
   -- field/filter reference (especially expensive with long statements).
   select q.*,to_jsonb(q) r from public.questoes q
   where (p_admin or q.publicada=true)
     and public.vet_s2_overlap(array[q.banca],p_filters->'exams',p_admin)
     and (p_filters->>'yearFrom' is null or q.ano >= (p_filters->>'yearFrom')::int)
     and (p_filters->>'yearTo' is null or q.ano <= (p_filters->>'yearTo')::int)
 ), core as materialized (
   select q.id,q.created_at,q.publicada,q.ano,q.codigo,q.banca,q."instituição",q.dificuldade,
     case when p_admin then coalesce(nullif(r->>'disciplina',''),nullif(r->>'diciplina',''),'—') else coalesce(r->>'disciplina',r->>'diciplina','fisica') end subject,
     public.vet_s2_list(r->'conteudos',coalesce(r->>'conteudo',case when not p_admin then r->>'assunto' end),not p_admin) topics,
     public.vet_s2_list(r->'assuntos',r->>'assunto',not p_admin) subtopics,
     coalesce((select jsonb_agg(g) from jsonb_array_elements(case when jsonb_typeof(r->'assuntos_por_conteudo')='array' then r->'assuntos_por_conteudo' else '[]'::jsonb end) g
       where public.vet_s2_trim(coalesce(g->>'conteudo',g->>'topic'))<>'' and exists(select 1 from jsonb_array_elements_text(case when jsonb_typeof(g->'assuntos')='array' then g->'assuntos' when jsonb_typeof(g->'subtopics')='array' then g->'subtopics' else '[]'::jsonb end) s where public.vet_s2_trim(s)<>'')), '[]'::jsonb) groups,
     array[q.codigo,q.enunciado,case when not p_admin then q.id::text end,case when not p_admin then r->>'enunciado_pos_imagem' end,
        coalesce(q.banca,case when not p_admin then 'Sem banca' end),q."instituição",q.ano::text,
        coalesce(r->>'disciplina',r->>'diciplina'),case when not p_admin then q.dificuldade end,
        case when not p_admin then case regexp_replace(public.vet_s2_norm(q.dificuldade),'[\s-]+','_','g') when 'facil' then 'Fácil' when 'medio' then 'Médio' when 'dificil' then 'Difícil' when 'muito_dificil' then 'Muito difícil' else q.dificuldade end end]
        || case when p_admin then array[array_to_string(public.vet_s2_list(r->'conteudos',r->>'conteudo',false),' '),array_to_string(public.vet_s2_list(r->'assuntos',r->>'assunto',false),' ')]
        else public.vet_s2_list(r->'conteudos',coalesce(r->>'conteudo',r->>'assunto')) || public.vet_s2_list(r->'assuntos',r->>'assunto') end search_parts,
     case when p_admin then lower(public.vet_s2_trim(q.dificuldade)) else regexp_replace(public.vet_s2_norm(q.dificuldade),'[\s-]+','_','g') end difficulty
   from source q
 ), enriched as materialized (
   select c.*, latest.id is not null attempted, coalesce(latest.is_correct,false) correct,
     case when coalesce(p_filters->'topics','[]')='[]' or c.groups='[]' then c.subtopics else
       array(select distinct lower(public.vet_s2_trim(s)) from jsonb_array_elements(c.groups) g,
         lateral jsonb_array_elements_text(case when jsonb_typeof(g->'assuntos')='array' then g->'assuntos' when jsonb_typeof(g->'subtopics')='array' then g->'subtopics' else '[]' end) s
         where public.vet_s2_overlap(array[coalesce(g->>'conteudo',g->>'topic')],p_filters->'topics',p_admin)
           and public.vet_s2_trim(s)<>'') end selected_subtopics
   from core c left join lateral (
     select a.id,a.is_correct from public.user_question_attempts a where not p_admin and a.user_id=p_user and a.question_id=c.id
     order by a.answered_at desc,a.attempt_number desc,a.id asc limit 1
   ) latest on true
 ), levels as materialized (
   select e.*,
     public.vet_s2_overlap(array["instituição"],p_filters->'institutions',p_admin) fi,
     (coalesce(p_filters->'years','[]')='[]' or exists(select 1 from jsonb_array_elements_text(p_filters->'years') y where ano=y::int)) fy,
     public.vet_s2_overlap(array[subject],p_filters->'subjects',p_admin) fs,
     public.vet_s2_overlap(topics,p_filters->'topics',p_admin) ft,
     public.vet_s2_overlap(selected_subtopics,p_filters->'subtopics',p_admin) fu,
     public.vet_s2_overlap(array[difficulty],p_filters->'difficulties',p_admin) fd
   from enriched e
 ), matched as materialized (
   select * from levels where fi and fy and fs and ft and fu and fd
   and (coalesce(p_filters->>'search','')='' or exists(select 1 from unnest(search_parts) part where strpos(public.vet_s2_norm(part,p_admin),public.vet_s2_norm(p_filters->>'search',p_admin))>0))
   and (not p_admin or coalesce(p_filters->>'publication','all')='all' or case p_filters->>'publication' when 'published' then publicada=true when 'unpublished' then publicada is not true else false end)
   and (coalesce(p_filters->>'practiceStatus','all')='all' or (p_user is not null and case p_filters->>'practiceStatus' when 'answered' then attempted when 'unanswered' then not attempted when 'correct' then attempted and correct when 'wrong' then attempted and not correct else false end))
 ), page as materialized (select id,created_at from matched order by created_at desc,id asc limit p_size offset (p_page::bigint*p_size)),
 projected as (
   select p.id,p.created_at, (select jsonb_object_agg(key,case when key='enunciado' then to_jsonb(left(value#>>'{}',90)) else value end)
   from jsonb_each(to_jsonb(q)) where key=any(array['id','codigo','disciplina','diciplina','conteudo','conteudos','assunto','assuntos','assuntos_por_conteudo','banca','ano','dificuldade','instituição','publicada','created_at','enunciado'] || case when p_admin then array['is_public','public_slug','public_noindex'] else '{}'::text[] end)) row
   from page p join public.questoes q on q.id=p.id
 ), summaries as (
   select r.questao_id,count(*) "totalBlocks",count(*) filter(where lower(public.vet_s2_trim(r.tipo))='imagem' or coalesce(r.url_imagem,'')<>'') "totalImages"
   from public.resolucoes r join page p on p.id=r.questao_id where p_admin group by r.questao_id
 ) select jsonb_build_object('rows',coalesce((select jsonb_agg(row order by created_at desc,id asc) from projected),'[]'),
 'total',(select count(*) from matched),'selectionIds',case when not p_admin and p_page=0 then (select jsonb_agg(id order by created_at desc,id asc) from matched) else null end,'selectionRevision',(select md5(string_agg(id::text,',' order by created_at desc,id asc)) from matched),'page',p_page,'pageSize',p_size,
 'resolutionSummaries',coalesce((select jsonb_agg(to_jsonb(s)) from summaries s),'[]'),
 'facets',jsonb_build_object(
  'institutions',coalesce((select jsonb_agg(v order by v) from (select distinct public.vet_s2_trim("instituição") v from levels where public.vet_s2_trim("instituição")<>'') t),'[]'),
  'years',coalesce((select jsonb_agg(v order by v::int desc) from (select distinct ano::text v from levels where (p_admin or fi) and ano is not null) t),'[]'),
  'subjects',coalesce((select jsonb_agg(v order by v) from (select distinct case when p_admin then public.vet_s2_trim(subject) else lower(public.vet_s2_trim(subject)) end v from levels where (p_admin or (fi and fy)) and public.vet_s2_trim(subject)<>'') t),'[]'),
  'topics',coalesce((select jsonb_agg(v order by v) from (select distinct v from levels,lateral unnest(topics) v where p_admin or (fi and fy and fs)) t),'[]'),
  'subtopics',coalesce((select jsonb_agg(v order by v) from (select distinct v from levels,lateral unnest(selected_subtopics) v where p_admin or (fi and fy and fs and ft)) t),'[]'),
  'difficulties',coalesce((select jsonb_agg(v order by v) from (select distinct difficulty v from levels where (p_admin or (fi and fy and fs and ft and fu)) and difficulty<>'') t),'[]')),
 'stats',jsonb_build_object('total',(select count(*) from core),'totalDifficulties',(select count(distinct dificuldade) from core where dificuldade<>''),
  'subjects',coalesce((select jsonb_object_agg(v,n) from (select lower(public.vet_s2_trim(subject)) v,count(*) n from core group by 1) t),'{}'),
  'difficulties',coalesce((select jsonb_object_agg(v,n) from (select difficulty v,count(*) n from core where difficulty<>'' group by 1) t),'{}'),
  'filteredDifficulties',coalesce((select jsonb_object_agg(v,n) from (select difficulty v,count(*) n from matched where difficulty<>'' group by 1) t),'{}'),
  'answered',(select count(*) from enriched where attempted),'correct',(select count(*) from enriched where attempted and correct),
  'wrong',(select count(*) from enriched where attempted and not correct),'unanswered',(select count(*) from enriched where not attempted)))
 );
end $$;

revoke all on function public.vet_question_global_stats(),public.vet_resolve_access_role(uuid),public.vet_admin_browse_questions(jsonb,integer,integer,boolean,uuid) from public,anon,authenticated;
grant execute on function public.vet_question_global_stats(),public.vet_resolve_access_role(uuid),public.vet_admin_browse_questions(jsonb,integer,integer,boolean,uuid) to service_role;
notify pgrst,'reload schema';
commit;
