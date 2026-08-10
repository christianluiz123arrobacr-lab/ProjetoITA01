-- The report UI and backend existed before the table was guaranteed by a
-- migration. Create/complete it additively so existing installations are safe.

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questoes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  report_type text not null,
  comment text,
  status text not null default 'pendente',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.question_reports
  add column if not exists report_type text,
  add column if not exists comment text,
  add column if not exists status text default 'pendente',
  add column if not exists admin_note text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'question_reports_type_check') then
    alter table public.question_reports add constraint question_reports_type_check
      check (report_type in ('enunciado', 'alternativa', 'gabarito', 'resolucao', 'imagem', 'latex', 'outro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'question_reports_status_check') then
    alter table public.question_reports add constraint question_reports_status_check
      check (status in ('pendente', 'em_analise', 'resolvido', 'ignorado'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'question_reports_comment_length_check') then
    alter table public.question_reports add constraint question_reports_comment_length_check
      check (comment is null or char_length(comment) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'question_reports_admin_note_length_check') then
    alter table public.question_reports add constraint question_reports_admin_note_length_check
      check (admin_note is null or char_length(admin_note) <= 5000);
  end if;
end
$$;

create index if not exists question_reports_question_created_idx
  on public.question_reports(question_id, created_at desc);
create index if not exists question_reports_status_created_idx
  on public.question_reports(status, created_at desc);
create index if not exists question_reports_user_created_idx
  on public.question_reports(user_id, created_at desc);

alter table public.question_reports enable row level security;
revoke all on public.question_reports from anon;
grant select, insert, update, delete on public.question_reports to authenticated;

drop policy if exists "question_reports_insert_own_pending" on public.question_reports;
create policy "question_reports_insert_own_pending"
on public.question_reports for insert to authenticated
with check (user_id = auth.uid() and status = 'pendente');

drop policy if exists "question_reports_select_own_or_admin" on public.question_reports;
create policy "question_reports_select_own_or_admin"
on public.question_reports for select to authenticated
using (user_id = auth.uid() or public.is_admin_or_editor());

drop policy if exists "question_reports_admin_update_delete" on public.question_reports;
create policy "question_reports_admin_update_delete"
on public.question_reports for update to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "question_reports_admin_delete" on public.question_reports;
create policy "question_reports_admin_delete"
on public.question_reports for delete to authenticated
using (public.is_admin_or_editor());
