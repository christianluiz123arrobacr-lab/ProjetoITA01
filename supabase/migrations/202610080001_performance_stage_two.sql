-- Apply manually BEFORE publishing the dependent backend. No historical writes.
begin;

-- ECMAScript String.trim whitespace (not just ASCII space).
create function public.vet_s2_trim(v text) returns text language sql immutable parallel safe
set search_path = '' as $$ select btrim(coalesce(v,''), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') $$;
create function public.vet_s2_norm(v text, admin boolean default false) returns text language sql immutable parallel safe
set search_path = '' as $$ select case when admin then lower(public.vet_s2_trim(v)) else regexp_replace(normalize(lower(public.vet_s2_trim(v)),NFD),U&'[\0300-\036F]','','g') end $$;
create function public.vet_s2_list(v jsonb, fallback text, fold boolean default true) returns text[] language sql immutable parallel safe
set search_path = '' as $$
  select coalesce(array_agg(s order by first_order) filter(where s<>''),'{}') from (
    select case when fold then lower(public.vet_s2_trim(x)) else public.vet_s2_trim(x) end s, min(ord) first_order
    from jsonb_array_elements_text(case when jsonb_typeof(v)='array' and v<>'[]' then v else jsonb_build_array(fallback) end) with ordinality a(x,ord) group by 1
  ) t;
$$;
create function public.vet_s2_overlap(a text[], b jsonb, admin boolean default false) returns boolean language sql immutable parallel safe
set search_path = '' as $$ select coalesce(b,'[]')='[]' or exists(select 1 from unnest(a) x, jsonb_array_elements_text(b) y where public.vet_s2_norm(x,admin)=public.vet_s2_norm(y,admin)) $$;
create function public.vet_s2_renderable(kind text, body text, url text) returns boolean language sql immutable parallel safe
set search_path = '' as $$ select case when lower(public.vet_s2_trim(kind))='imagem' then public.vet_s2_trim(url)<>'' else public.vet_s2_trim(body)<>'' end $$;

create function public.vet_admin_dashboard() returns jsonb language sql stable security invoker set search_path = '' as $$
with missing as materialized (
  select q.id,q.codigo,q.enunciado,q.banca,q.ano,q.created_at from public.questoes q
  where not exists(select 1 from public.resolucoes r where r.questao_id=q.id and public.vet_s2_renderable(r.tipo,r.texto,r.url_imagem))
) select jsonb_build_object('stats',jsonb_build_object(
  'totalUsers',(select count(*) from public.profiles),'totalAdmins',(select count(*) from public.admin_users),
  'totalQuestions',(select count(*) from public.questoes),'totalUnpublishedQuestions',(select count(*) from public.questoes where publicada=false),
  'totalResolutions',(select count(*) from public.resolucoes),'totalResolutionImages',(select count(*) from public.resolucoes where url_imagem is not null),
  'totalQuestionsWithoutResolution',(select count(*) from missing)),
  'latestQuestions',coalesce((select jsonb_agg(to_jsonb(t)) from (select id,codigo,enunciado,banca,ano,created_at,publicada from public.questoes order by created_at desc,id asc limit 5) t),'[]'),
  'latestResolutions',coalesce((select jsonb_agg(to_jsonb(t)) from (select id,questao_id,tipo,ordem,codigo_resolucao,created_at from public.resolucoes order by created_at desc,id asc limit 5) t),'[]'),
  'latestUsers',coalesce((select jsonb_agg(to_jsonb(t)) from (select id,nome,email,role,ativo,created_at from public.profiles order by created_at desc,id asc limit 5) t),'[]'),
  -- The old missing examples were ordered by ID, not creation date.
  'latestQuestionsWithoutResolution',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from missing order by id asc limit 5) t),'[]'));
$$;

create function public.vet_admin_student_statistics() returns jsonb language sql stable security invoker set search_path = '' as $$
with stats as (
 select user_id,count(*) as attempts_count,count(*) filter(where is_correct=true) as correct_count,
 count(distinct question_id) as distinct_answered,count(distinct question_id) filter(where is_correct=true) as distinct_correct,
 max(answered_at) as last_answered_at from public.user_question_attempts group by user_id
) select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'email',p.email,'telefone',p.telefone,
 'role',p.role,'ativo',p.ativo,'created_at',p.created_at,'last_seen_at',p.last_seen_at,
 'attempts_count',coalesce(s.attempts_count,0),'correct_count',coalesce(s.correct_count,0),
 'distinct_answered',coalesce(s.distinct_answered,0),'distinct_correct',coalesce(s.distinct_correct,0),
 'accuracy',case when coalesce(s.attempts_count,0)=0 then 0 else (s.correct_count::double precision/s.attempts_count)*100 end,
 'last_answered_at',s.last_answered_at) order by p.created_at desc,p.id asc),'[]')
 from public.profiles p left join stats s on p.id=s.user_id;
$$;

create function public.vet_question_suggestions() returns jsonb language sql stable security invoker set search_path = '' as $$
with source as materialized (select to_jsonb(q) r from public.questoes q),
contents as (select public.vet_s2_trim(x) v from source, lateral unnest(array[r->>'conteudo'] || public.vet_s2_list(r->'conteudos',null,false)) x),
subjects as (select public.vet_s2_trim(x) v from source, lateral unnest(array[r->>'assunto'] || public.vet_s2_list(r->'assuntos',null,false)) x),
groups as (select distinct g from source, lateral jsonb_array_elements(case when jsonb_typeof(r->'assuntos_por_conteudo')='array' then r->'assuntos_por_conteudo' else '[]' end) g)
select jsonb_build_array(jsonb_build_object(
 'conteudos',coalesce((select jsonb_agg(v order by v) from (select distinct v from contents where v<>'') t),'[]'),
 'assuntos',coalesce((select jsonb_agg(v order by v) from (select distinct v from subjects where v<>'') t),'[]'),
 'assuntos_por_conteudo',coalesce((select jsonb_agg(g order by g::text) from groups),'[]')))
 || coalesce((select jsonb_agg(jsonb_build_object('banca',v) order by v) from (select distinct public.vet_s2_trim(r->>'banca') v from source where public.vet_s2_trim(r->>'banca')<>'') t),'[]')
 || coalesce((select jsonb_agg(jsonb_build_object('instituição',v) order by v) from (select distinct public.vet_s2_trim(r->>'instituição') v from source where public.vet_s2_trim(r->>'instituição')<>'') t),'[]');
$$;

-- One database snapshot for global filters, exact count, page and compact facets.
-- Called ONLY by service_role after backend permission checks. p_admin is not client-controlled.
create function public.vet_browse_questions(p_filters jsonb, p_page integer, p_size integer, p_admin boolean, p_user uuid)
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
 'total',(select count(*) from matched),'page',p_page,'pageSize',p_size,
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

-- Bounded details for the current page or an explicitly requested quiz. No answers.
create function public.vet_question_details(p_ids uuid[]) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
 if cardinality(p_ids)>100 then raise exception 'too many question IDs' using errcode='22023'; end if;
 return (select coalesce(jsonb_agg(row order by ord),'[]') from (
   select ord,(select jsonb_object_agg(key,value) from jsonb_each(to_jsonb(q))
   where key=any(array['id','codigo','disciplina','diciplina','conteudo','conteudos','assunto','assuntos','assuntos_por_conteudo','banca','ano','dificuldade','instituição','publicada','created_at','enunciado','enunciado_pos_imagem','url_imagem','image_metadata','formula','fonte','tag','A','B','C','D','E','a','b','c','d','e','a_url_imagem','b_url_imagem','c_url_imagem','d_url_imagem','e_url_imagem','options'])) row
   from unnest(p_ids) with ordinality i(id,ord) join public.questoes q on q.id=i.id where q.publicada=true
 ) t);
end $$;
revoke all on function public.vet_question_details(uuid[]) from public,anon,authenticated;
grant execute on function public.vet_question_details(uuid[]) to service_role;

-- Resolutions FK index supports EXISTS and page summaries; existing deployment
-- may already have one: only create if no valid index begins with questao_id.
do $$ begin
 if not exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=i.indkey[0] where i.indrelid='public.resolucoes'::regclass and i.indisvalid and i.indpred is null and a.attname='questao_id') then
   create index vet_s2_resolution_question_idx on public.resolucoes(questao_id);
 end if;
end $$;

-- Latest practice result: reuse the equivalent PDF index when already present.
do $$ begin
 if not exists(select 1 from pg_index i where i.indrelid='public.user_question_attempts'::regclass and i.indisvalid and i.indpred is null and i.indnkeyatts>=5
   and (select array_agg(a.attname::text order by k.ord) from unnest(i.indkey::smallint[]) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum where k.ord<=5)=array['user_id','question_id','answered_at','attempt_number','id']
   and (i.indoption[2] & 1)=1 and (i.indoption[3] & 1)=1) then
   create index vet_s2_latest_attempt_idx on public.user_question_attempts(user_id,question_id,answered_at desc,attempt_number desc,id);
 end if;
end $$;

revoke all on function public.vet_s2_trim(text),public.vet_s2_norm(text,boolean),public.vet_s2_list(jsonb,text,boolean),public.vet_s2_overlap(text[],jsonb,boolean),public.vet_s2_renderable(text,text,text),public.vet_admin_dashboard(),public.vet_admin_student_statistics(),public.vet_question_suggestions(),public.vet_browse_questions(jsonb,integer,integer,boolean,uuid) from public,anon,authenticated;
grant execute on function public.vet_s2_trim(text),public.vet_s2_norm(text,boolean),public.vet_s2_list(jsonb,text,boolean),public.vet_s2_overlap(text[],jsonb,boolean),public.vet_s2_renderable(text,text,text),public.vet_admin_dashboard(),public.vet_admin_student_statistics(),public.vet_question_suggestions(),public.vet_browse_questions(jsonb,integer,integer,boolean,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
