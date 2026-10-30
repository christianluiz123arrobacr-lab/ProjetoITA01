-- Apply manually BEFORE publishing the dependent backend. No historical writes.
begin;

create or replace function public.vet_revoke_admin_access(
  p_actor uuid,
  p_access_id uuid,
  p_target_user uuid default null
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  target_id uuid;
  entry_user uuid;
  actor_role text;
  target_role text;
  admin_count bigint;
begin
  -- Administrative changes are rare. Serialize with ordinary role writes too,
  -- so concurrent revocations cannot each see the other as the remaining admin.
  lock table public.admin_users, public.profiles in share row exclusive mode;

  select coalesce(
    (select role::text from public.admin_users where user_id = p_actor and role in ('admin','editor')),
    (select case when role = 'admin' then 'admin' else 'student' end from public.profiles where id = p_actor),
    'student'
  ) into actor_role;
  if actor_role <> 'admin' then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;

  select user_id into entry_user from public.admin_users where id = p_access_id;
  if p_target_user is not null and entry_user is not null and entry_user <> p_target_user then
    raise exception using errcode = '22023', message = 'ACCESS_TARGET_MISMATCH';
  end if;
  target_id := coalesce(entry_user, p_target_user);
  -- Backward-compatible identifier for a legacy-only administrator shown in
  -- listAdminUsers: its synthetic access ID is the real profile ID.
  if target_id is null then
    select id into target_id from public.profiles where id = p_access_id and role = 'admin';
  end if;
  if target_id is null or not (
    exists(select 1 from public.admin_users where user_id = target_id)
    or exists(select 1 from public.profiles where id = target_id and role in ('admin','editor'))
  ) then raise exception using errcode = 'P0002', message = 'ACCESS_NOT_FOUND'; end if;

  select coalesce(
    (select role::text from public.admin_users where user_id = target_id and role in ('admin','editor')),
    (select case when role = 'admin' then 'admin' else 'student' end from public.profiles where id = target_id),
    'student'
  ) into target_role;
  if target_role = 'admin' then
    select count(*) into admin_count from (
      select user_id from public.admin_users where role = 'admin'
      union
      select p.id from public.profiles p where p.role = 'admin'
        and not exists(select 1 from public.admin_users a where a.user_id = p.id and a.role in ('admin','editor'))
    ) admins;
    if admin_count <= 1 then raise exception using errcode = 'P0001', message = 'LAST_ADMIN'; end if;
  end if;

  delete from public.admin_users where user_id = target_id;
  update public.profiles set role = 'student' where id = target_id and role in ('admin','editor');
  return jsonb_build_object('userId', target_id, 'role', 'student');
end;
$$;

revoke all on function public.vet_revoke_admin_access(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.vet_revoke_admin_access(uuid,uuid,uuid) to service_role;

-- One snapshot, explicit SQL join: does not require a PostgREST FK relationship.
-- The JSON allowlist also works on older tables lacking optional renderer fields.
create or replace function public.vet_public_content_blocks(p_page_id uuid)
returns jsonb language sql stable security definer
set search_path = pg_catalog, public
as $$
  select coalesce(jsonb_agg(eligible.item order by eligible.order_index, eligible.id), '[]'::jsonb)
  from (
    select b.id, b.order_index,
      (select jsonb_object_agg(e.key,e.value) from jsonb_each(to_jsonb(b)) e
       where e.key = any(array['id','page_id','type','variant','title','content','formula',
         'image_url','items_json','settings_json','order_index','is_visible','created_at','updated_at'])) item
    from public.content_blocks b
    join public.content_pages p on p.id = b.page_id
    where p.id = p_page_id and p.is_published = true and b.is_visible = true
  ) eligible;
$$;
revoke all on function public.vet_public_content_blocks(uuid) from public, anon, authenticated;
grant execute on function public.vet_public_content_blocks(uuid) to service_role;
commit;
