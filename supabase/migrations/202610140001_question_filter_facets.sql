-- Compact filter options only. Depends on performance_stage_two helper functions.
-- Apply manually before publishing the dependent backend.
begin;
create function public.vet_question_filter_facets(p_filters jsonb)
returns jsonb language sql stable security invoker set search_path = '' as $$
with source as materialized (
 select q.id,q."instituição" institution,q.ano,q.banca,
   coalesce(to_jsonb(q)->>'disciplina',to_jsonb(q)->>'diciplina','fisica') subject,
   public.vet_s2_list(to_jsonb(q.conteudos),coalesce(q.conteudo,q.assunto)) topics,
   public.vet_s2_list(to_jsonb(q.assuntos),q.assunto) subtopics,
   regexp_replace(public.vet_s2_norm(q.dificuldade),'[\s-]+','_','g') difficulty
 from public.questoes q where q.publicada=true
), levels as materialized (
 select *, public.vet_s2_overlap(array[institution],p_filters->'institutions') fi,
   (coalesce(p_filters->'years','[]')='[]' or exists(select 1 from jsonb_array_elements_text(p_filters->'years') y where ano=y::int)) fy,
   public.vet_s2_overlap(array[subject],p_filters->'subjects') fs,
   public.vet_s2_overlap(topics,p_filters->'topics') ft
 from source
 where public.vet_s2_overlap(array[banca],p_filters->'exams')
   and (p_filters->>'yearFrom' is null or ano >= (p_filters->>'yearFrom')::int)
   and (p_filters->>'yearTo' is null or ano <= (p_filters->>'yearTo')::int)
), scoped_relations as materialized (
 select l.*,coalesce(to_jsonb(q)->'assuntos_por_conteudo','[]') groups from levels l join public.questoes q on q.id=l.id where fi and fy and fs and ft
), subject_options as (
 select l.*, case when coalesce(p_filters->'topics','[]')='[]' or groups='[]' then subtopics else
   array(select distinct lower(public.vet_s2_trim(s)) from jsonb_array_elements(case when jsonb_typeof(groups)='array' then groups else '[]' end) g,
     lateral jsonb_array_elements_text(case when jsonb_typeof(g->'assuntos')='array' then g->'assuntos' when jsonb_typeof(g->'subtopics')='array' then g->'subtopics' else '[]' end) s
     where public.vet_s2_overlap(array[coalesce(g->>'conteudo',g->>'topic')],p_filters->'topics') and public.vet_s2_trim(s)<>'') end selected_subtopics
 from scoped_relations l
)
select jsonb_build_object(
 'institutions',coalesce((select jsonb_agg(v order by v) from (select distinct public.vet_s2_trim(institution) v from levels where public.vet_s2_trim(institution)<>'') t),'[]'),
 'years',coalesce((select jsonb_agg(v order by v::int desc) from (select distinct ano::text v from levels where fi and ano is not null) t),'[]'),
 'subjects',coalesce((select jsonb_agg(v order by v) from (select distinct lower(public.vet_s2_trim(subject)) v from levels where fi and fy and public.vet_s2_trim(subject)<>'') t),'[]'),
 'topics',coalesce((select jsonb_agg(v order by v) from (select distinct v from levels,lateral unnest(topics) v where fi and fy and fs) t),'[]'),
 'subtopics',coalesce((select jsonb_agg(v order by v) from (select distinct v from subject_options,lateral unnest(selected_subtopics) v where fi and fy and fs and ft) t),'[]'),
 'difficulties',coalesce((select jsonb_agg(v order by v) from (select distinct difficulty v from levels where fi and fy and fs and ft and difficulty<>'') t),'[]'));
$$;
revoke all on function public.vet_question_filter_facets(jsonb) from public,anon,authenticated;
grant execute on function public.vet_question_filter_facets(jsonb) to service_role;
create or replace function public.export_question_pdf_data(p_user_id uuid, p_filters jsonb)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with filters as materialized (
    select public.question_pdf_normalize(p_filters->>'search') as search,
      public.question_pdf_filter_list(p_filters->'institutions') as institutions,
      public.question_pdf_filter_list(p_filters->'exams') as exams,
      public.question_pdf_filter_list(p_filters->'subjects') as subjects,
      public.question_pdf_filter_list(p_filters->'topics') as topics,
      public.question_pdf_filter_list(p_filters->'subtopics') as subtopics,
      public.question_pdf_filter_list(p_filters->'difficulties') as difficulties,
      array(select v::integer from jsonb_array_elements_text(coalesce(p_filters->'years', '[]'::jsonb)) t(v)) as years,
      coalesce(p_filters->>'practiceStatus', 'all') as practice
  ), matched as materialized (
    select q.id, q.created_at
    from public.questoes q cross join filters f
    cross join lateral (select to_jsonb(q) as r) legacy
    cross join lateral (select
      public.question_pdf_normalize(coalesce(r->>'disciplina', r->>'diciplina')) as subject,
      public.question_pdf_list(r->'conteudos', coalesce(r->>'conteudo', r->>'assunto')) as topics,
      public.question_pdf_list(r->'assuntos', r->>'assunto') as subtopics) taxonomy
    where q.publicada = true
      and (cardinality(f.years) = 0 or q.ano = any(f.years))
      and (p_filters->>'yearFrom' is null or q.ano >= (p_filters->>'yearFrom')::int)
      and (p_filters->>'yearTo' is null or q.ano <= (p_filters->>'yearTo')::int)
      and (cardinality(f.exams) = 0 or public.question_pdf_normalize(q.banca) = any(f.exams))
      and (cardinality(f.institutions) = 0 or public.question_pdf_normalize(q."instituição") = any(f.institutions))
      and (cardinality(f.subjects) = 0 or taxonomy.subject = any(f.subjects))
      and (cardinality(f.difficulties) = 0 or public.question_pdf_normalize(q.dificuldade) = any(f.difficulties))
      and (cardinality(f.topics) = 0 or taxonomy.topics && f.topics)
      and (cardinality(f.subtopics) = 0 or taxonomy.subtopics && f.subtopics)
      -- Literal substring, not LIKE/FTS: %, _, accents, and cross-field searches
      -- have the same meaning as questionRowMatchesPdfFilters.
      and (f.search = '' or strpos(array_to_string(array[
        public.question_pdf_normalize(q.codigo), public.question_pdf_normalize(q.enunciado),
        public.question_pdf_normalize(r->>'enunciado_pos_imagem'), public.question_pdf_normalize(q.banca),
        public.question_pdf_normalize(q."instituição"), public.question_pdf_normalize(q.ano::text),
        taxonomy.subject] || taxonomy.topics || taxonomy.subtopics, ' '), f.search) > 0)
      and (f.practice = 'all' or (
        select case f.practice
          when 'unanswered' then latest.id is null
          when 'answered' then latest.id is not null
          when 'correct' then latest.id is not null and latest.is_correct = true
          when 'wrong' then latest.id is not null and coalesce(latest.is_correct, false) = false
          else false end
        from (select 1) seed left join lateral (
          select a.id, a.is_correct from public.user_question_attempts a
          where a.user_id = p_user_id and a.question_id = q.id
          order by a.answered_at desc, a.attempt_number desc, a.id asc limit 1
        ) latest on true
      ))
  ), page as (
    select id, created_at from matched order by created_at desc, id asc limit 120
  ), projected as (
    -- Optional legacy columns are read through JSON only for these <=120 rows.
    -- An explicit allowlist prevents returning private/unused columns or resolutions.
    select page.id, page.created_at, (
      select jsonb_object_agg(key, value) from jsonb_each(to_jsonb(q))
      where key = any(array['id','codigo','disciplina','diciplina','assunto','conteudo','conteudos',
        'assuntos','assuntos_por_conteudo','banca','ano','dificuldade','enunciado',
        'enunciado_pos_imagem','url_imagem','image_metadata','A','B','C','D','E',
        'a','b','c','d','e','options','a_url_imagem','b_url_imagem','c_url_imagem',
        'd_url_imagem','e_url_imagem','alternativa_correta','instituição'])
    ) as row from page join public.questoes q on q.id = page.id
  ) select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(row order by created_at desc, id asc) from projected), '[]'::jsonb),
    'totalMatched', (select count(*) from matched), 'limit', 120,
    'truncated', (select count(*) > 120 from matched));
$$;
notify pgrst, 'reload schema';
commit;
