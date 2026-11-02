-- Only after restoring the previous backend/client. Never run normally.
begin;
drop function public.vet_admin_browse_questions(jsonb,integer,integer,boolean,uuid);
drop function public.vet_question_global_stats();
drop function public.vet_resolve_access_role(uuid);
drop view public.vet_question_catalog;
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
notify pgrst,'reload schema';
commit;
