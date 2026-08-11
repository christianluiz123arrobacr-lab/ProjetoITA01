-- VET canonical schema, attempts and persisted mock sessions.
-- Additive and idempotent: no historical row is deleted or rewritten.

create table if not exists public.user_vet_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_exam text not null default 'ITA',
  months_until_exam integer not null default 6 check (months_until_exam between 1 and 120),
  hours_per_day numeric(5,2) not null default 3 check (hours_per_day between 0.5 and 24),
  focus_subject text not null default 'todas',
  study_days_per_week integer not null default 5 check (study_days_per_week between 1 and 7),
  study_weekdays text[] not null default array['segunda','terca','quarta','quinta','sexta'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists user_vet_profiles_one_per_user on public.user_vet_profiles(user_id);
alter table public.user_vet_profiles
  add column if not exists study_days_per_week integer default 5,
  add column if not exists study_weekdays text[] default array['segunda','terca','quarta','quinta','sexta'],
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.user_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questoes(id) on delete cascade,
  selected_option text not null,
  is_correct boolean not null,
  time_spent_seconds integer check (time_spent_seconds between 1 and 86400),
  attempt_number integer not null,
  subject text,
  conteudo text,
  assunto text,
  banca text,
  institution text,
  ano integer,
  difficulty text,
  answered_at timestamptz not null default now()
);
alter table public.user_question_attempts
  add column if not exists institution text,
  add column if not exists conteudos text[],
  add column if not exists assuntos text[],
  add column if not exists vet_mock_session_id uuid;

create index if not exists user_question_attempts_user_answered_idx on public.user_question_attempts(user_id, answered_at desc);
create index if not exists user_question_attempts_user_question_idx on public.user_question_attempts(user_id, question_id, attempt_number desc);
create index if not exists user_question_attempts_content_idx on public.user_question_attempts(user_id, subject, conteudo);
create index if not exists user_question_attempts_exam_idx on public.user_question_attempts(banca, subject, conteudo);
create index if not exists user_question_attempts_mock_idx on public.user_question_attempts(vet_mock_session_id) where vet_mock_session_id is not null;

create table if not exists public.vet_exam_content_weights (
  id uuid primary key default gen_random_uuid(),
  exam text not null,
  subject text not null,
  conteudo text not null,
  weight numeric(5,2) not null check (weight between 0 and 10),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists vet_exam_content_weights_key on public.vet_exam_content_weights(lower(exam), lower(subject), lower(conteudo));
alter table public.vet_exam_content_weights
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.vet_content_collective_stats (
  id uuid primary key default gen_random_uuid(),
  exam text not null,
  subject text not null,
  conteudo text not null,
  total_attempts bigint not null default 0,
  total_users bigint not null default 0,
  correct_attempts bigint not null default 0,
  wrong_attempts bigint not null default 0,
  collective_accuracy numeric(6,3),
  avg_time_seconds numeric(10,2),
  updated_at timestamptz not null default now()
);
create unique index if not exists vet_content_collective_stats_key on public.vet_content_collective_stats(lower(exam), lower(subject), lower(conteudo));
alter table public.vet_content_collective_stats
  add column if not exists total_users bigint default 0,
  add column if not exists correct_attempts bigint default 0,
  add column if not exists wrong_attempts bigint default 0,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.vet_mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_exam text not null,
  focus_subject text not null,
  mode text not null check (mode in ('ataque','consolidacao','manutencao','misto')),
  status text not null default 'draft' check (status in ('draft','in_progress','completed','abandoned')),
  started_at timestamptz,
  completed_at timestamptz,
  total_questions integer not null default 0,
  total_answered integer not null default 0,
  correct_answers integer not null default 0,
  accuracy numeric(6,3),
  engine_version text not null,
  engine_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vet_mock_sessions_user_created_idx on public.vet_mock_sessions(user_id, created_at desc);

create table if not exists public.vet_mock_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.vet_mock_sessions(id) on delete cascade,
  question_id uuid not null references public.questoes(id) on delete restrict,
  position integer not null,
  strategic_content text,
  block text not null check (block in ('ataque','consolidacao','manutencao')),
  recommendation_score numeric(7,2) not null default 0,
  attempt_id uuid references public.user_question_attempts(id) on delete set null,
  selected_option text,
  is_correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, question_id),
  unique(session_id, position)
);
alter table public.user_question_attempts drop constraint if exists user_question_attempts_vet_mock_session_id_fkey;
alter table public.user_question_attempts add constraint user_question_attempts_vet_mock_session_id_fkey foreign key (vet_mock_session_id) references public.vet_mock_sessions(id) on delete set null;

alter table public.user_vet_profiles enable row level security;
alter table public.user_question_attempts enable row level security;
alter table public.vet_exam_content_weights enable row level security;
alter table public.vet_content_collective_stats enable row level security;
alter table public.vet_mock_sessions enable row level security;
alter table public.vet_mock_session_items enable row level security;

revoke insert, update, delete on public.user_question_attempts from authenticated;
grant select on public.user_question_attempts to authenticated;
drop policy if exists "user_question_attempts_owner_all" on public.user_question_attempts;
drop policy if exists "user_question_attempts_owner_insert" on public.user_question_attempts;
drop policy if exists "user_question_attempts_owner_update" on public.user_question_attempts;
drop policy if exists "user_question_attempts_owner_delete" on public.user_question_attempts;
drop policy if exists "user_question_attempts_owner_select" on public.user_question_attempts;
create policy "user_question_attempts_owner_select" on public.user_question_attempts for select to authenticated using (user_id = auth.uid() or public.is_admin_or_editor());

drop policy if exists "vet_mock_sessions_owner_select" on public.vet_mock_sessions;
create policy "vet_mock_sessions_owner_select" on public.vet_mock_sessions for select to authenticated using (user_id = auth.uid() or public.is_admin_or_editor());
drop policy if exists "vet_mock_items_owner_select" on public.vet_mock_session_items;
create policy "vet_mock_items_owner_select" on public.vet_mock_session_items for select to authenticated using (exists (select 1 from public.vet_mock_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.is_admin_or_editor())));
revoke insert, update, delete on public.vet_mock_sessions, public.vet_mock_session_items from authenticated;
grant select on public.vet_mock_sessions, public.vet_mock_session_items to authenticated;

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
  if p_vet_mock_session_id is not null and not exists (select 1 from public.vet_mock_sessions where id = p_vet_mock_session_id and user_id = p_user_id and status in ('draft','in_progress')) then raise exception 'invalid mock session'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_question_id::text, 0));
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
  return v_count;
end $$;
revoke all on function public.refresh_vet_collective_stats(uuid) from public, anon, authenticated;
grant execute on function public.refresh_vet_collective_stats(uuid) to service_role;
