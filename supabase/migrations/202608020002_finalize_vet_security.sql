-- Final VET session validation and collective-statistics audit.
-- Additive/idempotent; preserves every historical attempt and session.

create or replace function public.record_canonical_question_attempt(
  p_user_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_time_spent_seconds integer,
  p_vet_mock_session_id uuid default null
) returns table(attempt_id uuid, attempt_number integer, is_correct boolean, correct_option text, resolution jsonb)
language plpgsql security definer set search_path = public as $$
declare
  v_question public.questoes%rowtype;
  v_attempt_id uuid;
  v_attempt_number integer;
  v_correct boolean;
  v_resolution jsonb;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then raise exception 'attempt user mismatch'; end if;
  if p_user_id is null or p_time_spent_seconds not between 1 and 86400 then raise exception 'invalid attempt'; end if;
  select * into v_question from public.questoes where id = p_question_id and publicada = true;
  if not found then raise exception 'question not found or unpublished'; end if;
  if lower(trim(p_selected_option)) not in ('a','b','c','d','e') then raise exception 'invalid selected option'; end if;
  if lower(trim(coalesce(v_question.alternativa_correta, ''))) not in ('a','b','c','d','e') then raise exception 'question has no valid answer key'; end if;
  if nullif(trim(coalesce(to_jsonb(v_question)->>lower(trim(p_selected_option)), '')), '') is null
     and nullif(trim(coalesce(to_jsonb(v_question)->>(lower(trim(p_selected_option)) || '_url_imagem'), '')), '') is null
  then raise exception 'selected option does not exist'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_question_id::text, 0));
  if p_vet_mock_session_id is not null then
    if not exists (select 1 from public.vet_mock_sessions where id = p_vet_mock_session_id and user_id = p_user_id and status in ('draft','in_progress')) then
      raise exception 'invalid mock session';
    end if;
    if not exists (select 1 from public.vet_mock_session_items where session_id = p_vet_mock_session_id and question_id = p_question_id) then
      raise exception 'question does not belong to mock session';
    end if;
    if exists (select 1 from public.vet_mock_session_items where session_id = p_vet_mock_session_id and question_id = p_question_id and attempt_id is not null) then
      raise exception 'mock question already answered';
    end if;
  end if;

  select coalesce(max(a.attempt_number), 0) + 1 into v_attempt_number from public.user_question_attempts a where a.user_id = p_user_id and a.question_id = p_question_id;
  v_correct := lower(trim(p_selected_option)) = lower(trim(v_question.alternativa_correta));
  select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'tipo', r.tipo, 'texto', r.texto, 'ordem', r.ordem, 'url_imagem', r.url_imagem) order by r.ordem), '[]'::jsonb) into v_resolution from public.resolucoes r where r.questao_id = p_question_id;

  insert into public.user_question_attempts(user_id, question_id, selected_option, is_correct, time_spent_seconds, attempt_number, subject, conteudo, conteudos, assunto, assuntos, banca, institution, ano, difficulty, vet_mock_session_id)
  values (p_user_id, p_question_id, lower(trim(p_selected_option)), v_correct, p_time_spent_seconds, v_attempt_number,
    coalesce(to_jsonb(v_question)->>'disciplina', to_jsonb(v_question)->>'diciplina'),
    coalesce(to_jsonb(v_question)->>'conteudo', to_jsonb(v_question)->>'assunto'),
    array(select jsonb_array_elements_text(coalesce(to_jsonb(v_question)->'conteudos', '[]'::jsonb))),
    to_jsonb(v_question)->>'assunto',
    array(select jsonb_array_elements_text(coalesce(to_jsonb(v_question)->'assuntos', '[]'::jsonb))),
    to_jsonb(v_question)->>'banca', to_jsonb(v_question)->>'instituição',
    nullif(to_jsonb(v_question)->>'ano','')::integer, to_jsonb(v_question)->>'dificuldade', p_vet_mock_session_id)
  returning id into v_attempt_id;

  if p_vet_mock_session_id is not null then
    update public.vet_mock_session_items set attempt_id = v_attempt_id, selected_option = lower(trim(p_selected_option)), is_correct = v_correct, answered_at = now() where session_id = p_vet_mock_session_id and question_id = p_question_id and attempt_id is null;
    update public.vet_mock_sessions set status = 'in_progress', started_at = coalesce(started_at, now()), total_answered = (select count(*) from public.vet_mock_session_items where session_id = p_vet_mock_session_id and attempt_id is not null), correct_answers = (select count(*) from public.vet_mock_session_items where session_id = p_vet_mock_session_id and is_correct = true), updated_at = now() where id = p_vet_mock_session_id and user_id = p_user_id;
  end if;
  return query select v_attempt_id, v_attempt_number, v_correct, lower(trim(v_question.alternativa_correta)), v_resolution;
end $$;
revoke all on function public.record_canonical_question_attempt(uuid,uuid,text,integer,uuid) from public, anon, authenticated;
grant execute on function public.record_canonical_question_attempt(uuid,uuid,text,integer,uuid) to service_role;

create or replace function public.refresh_vet_collective_stats(p_admin_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if not exists (select 1 from public.admin_users where user_id = p_admin_user_id and role = 'admin') then raise exception 'administrator permission required'; end if;
  insert into public.vet_content_collective_stats(exam, subject, conteudo, total_attempts, total_users, correct_attempts, wrong_attempts, collective_accuracy, avg_time_seconds, updated_at)
  select banca, subject, conteudo, count(*), count(distinct user_id), count(*) filter (where is_correct), count(*) filter (where not is_correct), 100.0 * count(*) filter (where is_correct) / count(*), avg(time_spent_seconds), now()
  from public.user_question_attempts where banca is not null and subject is not null and conteudo is not null
  group by banca, subject, conteudo having count(*) >= 10 and count(distinct user_id) >= 5
  on conflict (lower(exam), lower(subject), lower(conteudo)) do update set total_attempts=excluded.total_attempts,total_users=excluded.total_users,correct_attempts=excluded.correct_attempts,wrong_attempts=excluded.wrong_attempts,collective_accuracy=excluded.collective_accuracy,avg_time_seconds=excluded.avg_time_seconds,updated_at=now();
  get diagnostics v_count = row_count;
  insert into public.admin_logs(admin_user_id, action, entity_type, description, level, metadata)
  values (p_admin_user_id, 'vet_collective_stats_refreshed', 'vet_content_collective_stats',
    'Estatísticas coletivas do VET atualizadas manualmente', 'info',
    jsonb_build_object('updated_groups', v_count, 'privacy_min_attempts', 10, 'privacy_min_users', 5, 'updated_at', now()));
  return v_count;
end $$;
revoke all on function public.refresh_vet_collective_stats(uuid) from public, anon, authenticated;
grant execute on function public.refresh_vet_collective_stats(uuid) to service_role;
