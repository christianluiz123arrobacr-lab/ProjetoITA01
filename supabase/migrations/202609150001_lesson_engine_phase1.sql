-- Motor de Aulas fase 1: acesso pago canônico e documentos v1/v2.
-- Aplicar somente depois de 202609140001_lesson_engine_mvp.sql.

create or replace function public.lesson_has_active_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.ativo = false
    )
    and public.user_has_active_subscription(auth.uid());
$$;

revoke all on function public.lesson_has_active_access() from public, anon;
grant execute on function public.lesson_has_active_access() to authenticated;

drop policy if exists "lessons_read_current_published" on public.lessons;
create policy "lessons_read_current_published" on public.lessons for select to authenticated
using (
  archived_at is null
  and current_published_version_id is not null
  and (public.is_admin_or_editor() or public.lesson_has_active_access())
);

drop policy if exists "lesson_versions_read_current_published" on public.lesson_versions;
create policy "lesson_versions_read_current_published" on public.lesson_versions for select to authenticated
using (
  (public.is_admin_or_editor() or public.lesson_has_active_access())
  and exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and l.archived_at is null
      and l.current_published_version_id = lesson_versions.id
  )
);

alter table public.lesson_drafts drop constraint if exists lesson_drafts_schema_version_check;
alter table public.lesson_drafts add constraint lesson_drafts_schema_version_check check (schema_version in (1, 2));
alter table public.lesson_versions drop constraint if exists lesson_versions_schema_version_check;
alter table public.lesson_versions add constraint lesson_versions_schema_version_check check (schema_version in (1, 2));

create or replace function public.lesson_publish(
  p_lesson_id uuid,
  p_actor_id uuid,
  p_expected_draft_updated_at timestamptz,
  p_change_note text default null
) returns table(version_id uuid, version_number integer)
language plpgsql security definer set search_path = public as $$
declare
  v_next integer;
  v_version_id uuid;
  v_draft public.lesson_drafts%rowtype;
begin
  if not exists(select 1 from public.admin_users where user_id = p_actor_id and role = 'admin') then
    raise exception 'administrator permission required';
  end if;
  perform 1 from public.lessons where id = p_lesson_id and archived_at is null for update;
  if not found then raise exception 'lesson not found'; end if;
  select * into v_draft from public.lesson_drafts where lesson_id = p_lesson_id for update;
  if not found then raise exception 'lesson draft not found'; end if;
  if v_draft.updated_at <> p_expected_draft_updated_at then raise exception 'lesson draft changed during publication'; end if;
  if v_draft.schema_version not in (1, 2)
     or jsonb_typeof(v_draft.content_json) <> 'object'
     or v_draft.content_json->>'schemaVersion' <> v_draft.schema_version::text
     or jsonb_typeof(v_draft.content_json->'blocks') <> 'array' then
    raise exception 'invalid lesson document';
  end if;
  select coalesce(max(lv.version_number), 0) + 1 into v_next
    from public.lesson_versions lv where lv.lesson_id = p_lesson_id;
  insert into public.lesson_versions(
    lesson_id, version_number, schema_version, content_json, published_by,
    restored_from_version_id, change_note
  ) values (
    p_lesson_id, v_next, v_draft.schema_version, v_draft.content_json, p_actor_id,
    v_draft.restored_from_version_id, nullif(trim(p_change_note), '')
  ) returning id into v_version_id;
  update public.lessons set current_published_version_id = v_version_id where id = p_lesson_id;
  update public.lesson_drafts set restored_from_version_id = null where lesson_id = p_lesson_id;
  return query select v_version_id, v_next;
end;
$$;

revoke all on function public.lesson_publish(uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.lesson_publish(uuid, uuid, timestamptz, text) to service_role;

-- Corrige a aula piloto apenas quando a taxonomia canônica contém a grafia correspondente.
do $$
declare
  v_canonical_discipline text;
  v_canonical_content text;
  v_canonical_subject text;
begin
  select q.disciplina, canonical_content.value, canonical_subject.value
  into v_canonical_discipline, v_canonical_content, v_canonical_subject
  from public.questoes q
  join public.lessons l on l.slug = 'bases-da-cinematica-experimental'
  cross join lateral (
    select value from unnest(coalesce(q.conteudos, '{}'::text[]) || array[q.conteudo]) value
    where value is not null
      and translate(lower(value), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') =
          translate(lower(l.content), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
    limit 1
  ) canonical_content
  cross join lateral (
    select value from unnest(coalesce(q.assuntos, '{}'::text[]) || array[q.assunto]) value
    where value is not null
      and translate(lower(value), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') =
          translate(lower(l.subject), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
    limit 1
  ) canonical_subject
  where translate(lower(q.disciplina), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') =
        translate(lower(l.discipline), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  order by q.disciplina
  limit 1;
  if v_canonical_discipline is not null then
    update public.lessons
    set discipline = v_canonical_discipline,
        content = v_canonical_content,
        subject = v_canonical_subject
    where slug = 'bases-da-cinematica-experimental'
      and (discipline, content, subject) is distinct from (v_canonical_discipline, v_canonical_content, v_canonical_subject);
  end if;
end $$;

comment on function public.lesson_has_active_access() is
  'Regra RLS do Motor de Aulas: perfil habilitado e assinatura ativa segundo user_has_active_subscription.';
