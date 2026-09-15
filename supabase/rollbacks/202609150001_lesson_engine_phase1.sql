-- Rollback da fase 1. Recusa reduzir o schema se já houver documentos v2.
do $$
begin
  if exists(select 1 from public.lesson_drafts where schema_version = 2)
     or exists(select 1 from public.lesson_versions where schema_version = 2) then
    raise exception 'rollback bloqueado: existem documentos de aula schemaVersion 2';
  end if;
end $$;

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
  if not exists(select 1 from public.admin_users where user_id = p_actor_id and role = 'admin') then raise exception 'administrator permission required'; end if;
  perform 1 from public.lessons where id = p_lesson_id and archived_at is null for update;
  if not found then raise exception 'lesson not found'; end if;
  select * into v_draft from public.lesson_drafts where lesson_id = p_lesson_id for update;
  if not found then raise exception 'lesson draft not found'; end if;
  if v_draft.updated_at <> p_expected_draft_updated_at then raise exception 'lesson draft changed during publication'; end if;
  if v_draft.schema_version <> 1 or jsonb_typeof(v_draft.content_json) <> 'object'
     or v_draft.content_json->>'schemaVersion' <> '1' or jsonb_typeof(v_draft.content_json->'blocks') <> 'array' then raise exception 'invalid lesson document'; end if;
  select coalesce(max(lv.version_number), 0) + 1 into v_next from public.lesson_versions lv where lv.lesson_id = p_lesson_id;
  insert into public.lesson_versions(lesson_id, version_number, schema_version, content_json, published_by, restored_from_version_id, change_note)
  values(p_lesson_id, v_next, v_draft.schema_version, v_draft.content_json, p_actor_id, v_draft.restored_from_version_id, nullif(trim(p_change_note), ''))
  returning id into v_version_id;
  update public.lessons set current_published_version_id = v_version_id where id = p_lesson_id;
  update public.lesson_drafts set restored_from_version_id = null where lesson_id = p_lesson_id;
  return query select v_version_id, v_next;
end;
$$;

revoke all on function public.lesson_publish(uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.lesson_publish(uuid, uuid, timestamptz, text) to service_role;

alter table public.lesson_drafts drop constraint if exists lesson_drafts_schema_version_check;
alter table public.lesson_drafts add constraint lesson_drafts_schema_version_check check (schema_version = 1);
alter table public.lesson_versions drop constraint if exists lesson_versions_schema_version_check;
alter table public.lesson_versions add constraint lesson_versions_schema_version_check check (schema_version = 1);

drop policy if exists "lesson_versions_read_current_published" on public.lesson_versions;
create policy "lesson_versions_read_current_published" on public.lesson_versions for select to authenticated
using (exists(select 1 from public.lessons l where l.id = lesson_id and l.archived_at is null and l.current_published_version_id = lesson_versions.id));

drop policy if exists "lessons_read_current_published" on public.lessons;
create policy "lessons_read_current_published" on public.lessons for select to authenticated
using (archived_at is null and current_published_version_id is not null);

revoke all on function public.lesson_has_active_access() from authenticated;
drop function if exists public.lesson_has_active_access();
