-- Review in a staging Supabase project before applying in production.
-- This migration replaces the policy names below; review existing production policies before applying.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.role = 'admin'
  );
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.role in ('admin', 'editor')
  );
$$;

alter table if exists public.profiles enable row level security;
alter table if exists public.admin_users enable row level security;
alter table if exists public.billing_plans enable row level security;
alter table if exists public.billing_subscriptions enable row level security;
alter table if exists public.billing_plan_invites enable row level security;
alter table if exists public.questoes enable row level security;
alter table if exists public.resolucoes enable row level security;
alter table if exists public.resolucoes_meta enable row level security;
alter table if exists public.admin_logs enable row level security;
alter table if exists public.question_notes enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin_or_editor());

drop policy if exists "profiles_update_own_safe_fields" on public.profiles;
create policy "profiles_update_own_safe_fields"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select role from public.profiles where id = auth.uid())
  and ativo = (select ativo from public.profiles where id = auth.uid())
);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_users_select_self_or_admin" on public.admin_users;
create policy "admin_users_select_self_or_admin"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_users_admin_all" on public.admin_users;
create policy "admin_users_admin_all"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "billing_plans_public_active_select" on public.billing_plans;
create policy "billing_plans_public_active_select"
on public.billing_plans
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "billing_plans_admin_all" on public.billing_plans;
create policy "billing_plans_admin_all"
on public.billing_plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "billing_subscriptions_select_own_or_admin" on public.billing_subscriptions;
create policy "billing_subscriptions_select_own_or_admin"
on public.billing_subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "billing_subscriptions_insert_own_manual_review" on public.billing_subscriptions;
create policy "billing_subscriptions_insert_own_manual_review"
on public.billing_subscriptions
for insert
to authenticated
with check (user_id = auth.uid() and status = 'manual_review');

drop policy if exists "billing_subscriptions_admin_all" on public.billing_subscriptions;
create policy "billing_subscriptions_admin_all"
on public.billing_subscriptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questoes_public_read_published" on public.questoes;
create policy "questoes_public_read_published"
on public.questoes
for select
to anon, authenticated
using (publicada = true);

drop policy if exists "questoes_admin_editor_all" on public.questoes;
create policy "questoes_admin_editor_all"
on public.questoes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "resolucoes_public_read_for_published_questions" on public.resolucoes;
create policy "resolucoes_public_read_for_published_questions"
on public.resolucoes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.questoes q
    where q.id = resolucoes.questao_id
      and q.publicada = true
  )
);

drop policy if exists "resolucoes_admin_editor_all" on public.resolucoes;
create policy "resolucoes_admin_editor_all"
on public.resolucoes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "admin_logs_admin_select" on public.admin_logs;
create policy "admin_logs_admin_select"
on public.admin_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_logs_admin_insert" on public.admin_logs;
create policy "admin_logs_admin_insert"
on public.admin_logs
for insert
to authenticated
with check (public.is_admin_or_editor());

drop policy if exists "question_notes_owner_all" on public.question_notes;
create policy "question_notes_owner_all"
on public.question_notes
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
