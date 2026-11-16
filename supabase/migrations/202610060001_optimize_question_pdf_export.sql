-- PDF only: one server-side selection, no resolution join and no HTTP pagination.
-- Apply manually before publishing the code that calls export_question_pdf_data.
begin;

create or replace function public.question_pdf_normalize(value text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select regexp_replace(normalize(lower(btrim(coalesce(value, ''),
    U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')), NFD),
    U&'[\0300-\036F]', '', 'g');
$$;

create or replace function public.question_pdf_list(value jsonb, fallback text)
returns text[] language sql immutable parallel safe set search_path = '' as $$
  select case when jsonb_typeof(value) = 'array' and value <> '[]'::jsonb
    then array(select public.question_pdf_normalize(v) from jsonb_array_elements_text(value) as t(v))
    else array[public.question_pdf_normalize(fallback)] end;
$$;

create or replace function public.question_pdf_filter_list(value jsonb)
returns text[] language sql immutable parallel safe set search_path = '' as $$
  select array(select public.question_pdf_normalize(v)
    from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as t(v));
$$;

create or replace function public.export_question_pdf_data(p_user_id uuid, p_filters jsonb)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with filters as materialized (
    select public.question_pdf_normalize(p_filters->>'search') as search,
      public.question_pdf_filter_list(p_filters->'institutions') as institutions,
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

create index if not exists question_pdf_latest_attempt_idx
  on public.user_question_attempts(user_id, question_id, answered_at desc, attempt_number desc, id);
create index if not exists question_pdf_published_year_idx
  on public.questoes(ano) where publicada = true;
create index if not exists question_pdf_published_institution_idx
  on public.questoes(public.question_pdf_normalize("instituição")) where publicada = true;
create index if not exists question_pdf_published_difficulty_idx
  on public.questoes(public.question_pdf_normalize(dificuldade)) where publicada = true;

-- Only the authorized backend may request answers or select another user's practice.
revoke all on function public.export_question_pdf_data(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.question_pdf_normalize(text) from public, anon, authenticated;
revoke all on function public.question_pdf_list(jsonb, text) from public, anon, authenticated;
revoke all on function public.question_pdf_filter_list(jsonb) from public, anon, authenticated;
grant execute on function public.export_question_pdf_data(uuid, jsonb),
  public.question_pdf_normalize(text), public.question_pdf_list(jsonb, text),
  public.question_pdf_filter_list(jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
