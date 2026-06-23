-- Defensive lockdown for frontend-accessed tables that were not covered by the first RLS pass.
-- Run in staging first. This migration avoids failing when optional tables do not exist.

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

do $$
begin
  if to_regclass('public.user_question_attempts') is not null then
    alter table public.user_question_attempts enable row level security;
    revoke all on public.user_question_attempts from anon;
    grant select, insert, update, delete on public.user_question_attempts to authenticated;

    drop policy if exists "user_question_attempts_owner_all" on public.user_question_attempts;
    create policy "user_question_attempts_owner_all"
    on public.user_question_attempts
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

    drop policy if exists "user_question_attempts_admin_all" on public.user_question_attempts;
    create policy "user_question_attempts_admin_all"
    on public.user_question_attempts
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.user_error_review_status') is not null then
    alter table public.user_error_review_status enable row level security;
    revoke all on public.user_error_review_status from anon;
    grant select, insert, update, delete on public.user_error_review_status to authenticated;

    drop policy if exists "user_error_review_status_owner_all" on public.user_error_review_status;
    create policy "user_error_review_status_owner_all"
    on public.user_error_review_status
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

    drop policy if exists "user_error_review_status_admin_all" on public.user_error_review_status;
    create policy "user_error_review_status_admin_all"
    on public.user_error_review_status
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.user_vet_profiles') is not null then
    alter table public.user_vet_profiles enable row level security;
    revoke all on public.user_vet_profiles from anon;
    grant select, insert, update, delete on public.user_vet_profiles to authenticated;

    drop policy if exists "user_vet_profiles_owner_all" on public.user_vet_profiles;
    create policy "user_vet_profiles_owner_all"
    on public.user_vet_profiles
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

    drop policy if exists "user_vet_profiles_admin_all" on public.user_vet_profiles;
    create policy "user_vet_profiles_admin_all"
    on public.user_vet_profiles
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.question_reports') is not null then
    alter table public.question_reports enable row level security;
    revoke all on public.question_reports from anon;
    grant select, insert, update, delete on public.question_reports to authenticated;

    drop policy if exists "question_reports_insert_own_pending" on public.question_reports;
    create policy "question_reports_insert_own_pending"
    on public.question_reports
    for insert
    to authenticated
    with check (user_id = auth.uid() and status = 'pendente');

    drop policy if exists "question_reports_select_own_or_admin" on public.question_reports;
    create policy "question_reports_select_own_or_admin"
    on public.question_reports
    for select
    to authenticated
    using (user_id = auth.uid() or public.is_admin_or_editor());

    drop policy if exists "question_reports_admin_update_delete" on public.question_reports;
    create policy "question_reports_admin_update_delete"
    on public.question_reports
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.content_pages') is not null then
    alter table public.content_pages enable row level security;
    grant select on public.content_pages to anon, authenticated;
    grant insert, update, delete on public.content_pages to authenticated;

    drop policy if exists "content_pages_public_published_select" on public.content_pages;
    create policy "content_pages_public_published_select"
    on public.content_pages
    for select
    to anon, authenticated
    using (is_published = true);

    drop policy if exists "content_pages_admin_editor_all" on public.content_pages;
    create policy "content_pages_admin_editor_all"
    on public.content_pages
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.content_blocks') is not null then
    alter table public.content_blocks enable row level security;
    grant select on public.content_blocks to anon, authenticated;
    grant insert, update, delete on public.content_blocks to authenticated;

    drop policy if exists "content_blocks_public_visible_for_published_page" on public.content_blocks;
    create policy "content_blocks_public_visible_for_published_page"
    on public.content_blocks
    for select
    to anon, authenticated
    using (
      is_visible = true
      and exists (
        select 1
        from public.content_pages cp
        where cp.id = content_blocks.page_id
          and cp.is_published = true
      )
    );

    drop policy if exists "content_blocks_admin_editor_all" on public.content_blocks;
    create policy "content_blocks_admin_editor_all"
    on public.content_blocks
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.vet_exam_content_weights') is not null then
    alter table public.vet_exam_content_weights enable row level security;
    grant select on public.vet_exam_content_weights to anon, authenticated;
    grant insert, update, delete on public.vet_exam_content_weights to authenticated;

    drop policy if exists "vet_exam_content_weights_public_select" on public.vet_exam_content_weights;
    create policy "vet_exam_content_weights_public_select"
    on public.vet_exam_content_weights
    for select
    to anon, authenticated
    using (true);

    drop policy if exists "vet_exam_content_weights_admin_editor_all" on public.vet_exam_content_weights;
    create policy "vet_exam_content_weights_admin_editor_all"
    on public.vet_exam_content_weights
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.vet_content_collective_stats') is not null then
    alter table public.vet_content_collective_stats enable row level security;
    grant select on public.vet_content_collective_stats to anon, authenticated;
    grant insert, update, delete on public.vet_content_collective_stats to authenticated;

    drop policy if exists "vet_content_collective_stats_public_select" on public.vet_content_collective_stats;
    create policy "vet_content_collective_stats_public_select"
    on public.vet_content_collective_stats
    for select
    to anon, authenticated
    using (true);

    drop policy if exists "vet_content_collective_stats_admin_editor_all" on public.vet_content_collective_stats;
    create policy "vet_content_collective_stats_admin_editor_all"
    on public.vet_content_collective_stats
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.resolucoes_meta') is not null then
    alter table public.resolucoes_meta enable row level security;
    revoke all on public.resolucoes_meta from anon;
    grant select, insert, update, delete on public.resolucoes_meta to authenticated;

    drop policy if exists "resolucoes_meta_admin_editor_all" on public.resolucoes_meta;
    create policy "resolucoes_meta_admin_editor_all"
    on public.resolucoes_meta
    for all
    to authenticated
    using (public.is_admin_or_editor())
    with check (public.is_admin_or_editor());
  end if;

  if to_regclass('public.billing_plan_invites') is not null then
    alter table public.billing_plan_invites enable row level security;
    revoke all on public.billing_plan_invites from anon;
    grant select, insert, update, delete on public.billing_plan_invites to authenticated;

    drop policy if exists "billing_plan_invites_admin_all" on public.billing_plan_invites;
    create policy "billing_plan_invites_admin_all"
    on public.billing_plan_invites
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end $$;
