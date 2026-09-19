-- Motor de aulas estruturadas: identidade, rascunho mutável e versões publicadas imutáveis.
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 1 and 800),
  discipline text not null,
  content text not null,
  subject text not null,
  level text,
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  current_published_version_id uuid,
  archived_at timestamptz
);

create table if not exists public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  schema_version integer not null check (schema_version = 1),
  content_json jsonb not null check (jsonb_typeof(content_json) = 'object'),
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  restored_from_version_id uuid references public.lesson_versions(id),
  change_note text check (change_note is null or char_length(change_note) <= 500),
  unique (lesson_id, version_number)
);

alter table public.lessons
  add constraint lessons_current_published_version_fk
  foreign key (current_published_version_id) references public.lesson_versions(id);

create table if not exists public.lesson_drafts (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  schema_version integer not null check (schema_version = 1),
  content_json jsonb not null check (jsonb_typeof(content_json) = 'object'),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  restored_from_version_id uuid references public.lesson_versions(id)
);

create index if not exists lessons_published_order_idx
  on public.lessons(display_order, title) where current_published_version_id is not null and archived_at is null;
create index if not exists lesson_versions_lesson_published_idx
  on public.lesson_versions(lesson_id, published_at desc);
create index if not exists lessons_taxonomy_idx on public.lessons(discipline, content, subject);

create or replace function public.lesson_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lessons_touch_updated_at
before update on public.lessons
for each row execute function public.lesson_touch_updated_at();

create or replace function public.lesson_current_version_matches()
returns trigger language plpgsql as $$
begin
  if new.current_published_version_id is not null and not exists (
    select 1 from public.lesson_versions v
    where v.id = new.current_published_version_id and v.lesson_id = new.id
  ) then
    raise exception 'published version does not belong to lesson';
  end if;
  return new;
end;
$$;

create trigger lessons_current_version_matches
before insert or update of current_published_version_id on public.lessons
for each row execute function public.lesson_current_version_matches();

create or replace function public.lesson_versions_are_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'published lesson versions are immutable';
end;
$$;

create trigger lesson_versions_immutable
before update or delete on public.lesson_versions
for each row execute function public.lesson_versions_are_immutable();

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
  if v_draft.schema_version <> 1 or jsonb_typeof(v_draft.content_json) <> 'object'
     or v_draft.content_json->>'schemaVersion' <> '1' or jsonb_typeof(v_draft.content_json->'blocks') <> 'array' then
    raise exception 'invalid lesson document';
  end if;
  select coalesce(max(lv.version_number), 0) + 1 into v_next
    from public.lesson_versions lv where lv.lesson_id = p_lesson_id;
  insert into public.lesson_versions(
    lesson_id, version_number, schema_version, content_json, published_by,
    restored_from_version_id, change_note
  )
  values(p_lesson_id, v_next, v_draft.schema_version, v_draft.content_json, p_actor_id,
         v_draft.restored_from_version_id, nullif(trim(p_change_note), ''))
  returning id into v_version_id;
  update public.lessons set current_published_version_id = v_version_id where id = p_lesson_id;
  update public.lesson_drafts set restored_from_version_id = null where lesson_id = p_lesson_id;
  return query select v_version_id, v_next;
end;
$$;

create or replace function public.lesson_restore_draft(
  p_lesson_id uuid,
  p_version_id uuid,
  p_actor_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare v_version public.lesson_versions%rowtype;
begin
  if not exists(select 1 from public.admin_users where user_id = p_actor_id and role = 'admin') then
    raise exception 'administrator permission required';
  end if;
  select * into v_version from public.lesson_versions
    where id = p_version_id and lesson_id = p_lesson_id;
  if not found then raise exception 'lesson version not found'; end if;
  insert into public.lesson_drafts(lesson_id, schema_version, content_json, updated_by, restored_from_version_id)
  values(p_lesson_id, v_version.schema_version, v_version.content_json, p_actor_id, p_version_id)
  on conflict (lesson_id) do update set
    schema_version = excluded.schema_version,
    content_json = excluded.content_json,
    updated_by = excluded.updated_by,
    updated_at = now(),
    restored_from_version_id = excluded.restored_from_version_id;
end;
$$;

revoke all on function public.lesson_publish(uuid, uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.lesson_restore_draft(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.lesson_publish(uuid, uuid, timestamptz, text) to service_role;
grant execute on function public.lesson_restore_draft(uuid, uuid, uuid) to service_role;

alter table public.lessons enable row level security;
alter table public.lesson_drafts enable row level security;
alter table public.lesson_versions enable row level security;

revoke all on public.lessons, public.lesson_drafts, public.lesson_versions from anon;
revoke insert, update, delete on public.lessons, public.lesson_drafts, public.lesson_versions from authenticated;
grant select on public.lessons, public.lesson_drafts, public.lesson_versions to authenticated;

create policy "lessons_read_current_published" on public.lessons for select to authenticated
using (archived_at is null and current_published_version_id is not null);
create policy "lessons_admin_all" on public.lessons for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "lesson_versions_read_current_published" on public.lesson_versions for select to authenticated
using (exists(select 1 from public.lessons l where l.id = lesson_id and l.archived_at is null and l.current_published_version_id = lesson_versions.id));
create policy "lesson_versions_admin_insert" on public.lesson_versions for insert to authenticated
with check (public.is_admin());
create policy "lesson_versions_admin_history" on public.lesson_versions for select to authenticated
using (public.is_admin());

create policy "lesson_drafts_admin_all" on public.lesson_drafts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('lesson-images', 'lesson-images', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "lesson_images_public_read" on storage.objects for select
using (bucket_id = 'lesson-images');
create policy "lesson_images_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'lesson-images' and public.is_admin());
create policy "lesson_images_admin_update" on storage.objects for update to authenticated
using (bucket_id = 'lesson-images' and public.is_admin())
with check (bucket_id = 'lesson-images' and public.is_admin());
create policy "lesson_images_admin_delete" on storage.objects for delete to authenticated
using (bucket_id = 'lesson-images' and public.is_admin());

-- A aula piloto nasce somente como rascunho e não fica visível aos alunos.
do $$
declare v_admin uuid; v_lesson uuid;
begin
  select user_id into v_admin from public.admin_users where role = 'admin' order by user_id limit 1;
  if v_admin is not null and not exists(select 1 from public.lessons where slug = 'bases-da-cinematica-experimental') then
    insert into public.lessons(slug, title, description, discipline, content, subject, level, display_order, created_by)
    values('bases-da-cinematica-experimental', 'Bases da Cinemática — Experimental',
      'Aula piloto do motor estruturado sobre os conceitos iniciais do movimento.',
      'fisica', 'Cinemática', 'Movimento Uniforme', 'Intermediário', 10, v_admin)
    returning id into v_lesson;
    insert into public.lesson_drafts(lesson_id, schema_version, content_json, updated_by)
    values(v_lesson, 1, jsonb_build_object('schemaVersion', 1, 'blocks', jsonb_build_array(
      jsonb_build_object('id','introducao','type','text','visible',true,'title','O que a Cinemática descreve?','content','A **Cinemática** estuda como a posição muda com o tempo. Uma trajetória só faz sentido depois que escolhemos um referencial.'),
      jsonb_build_object('id','velocidade-media','type','formula','visible',true,'latex','v_m = \frac{\Delta s}{\Delta t}','caption','Velocidade média no intervalo','align','center'),
      jsonb_build_object('id','conceito-chave','type','highlight','visible',true,'variant','key_concept','title','Conceito-chave','content','Movimento e repouso dependem do **referencial** adotado.'),
      jsonb_build_object('id','intuicao','type','intuition','visible',true,'title','Pense no trem','content','Para quem está sentado no vagão, a mochila está em repouso. Para quem observa da plataforma, ela se move com o trem.'),
      jsonb_build_object('id','erro-comum','type','common_mistake','visible',true,'title','Erro comum','content','Confundir distância percorrida com deslocamento. O deslocamento compara apenas as posições inicial e final.'),
      jsonb_build_object('id','exemplo','type','example','visible',true,'problem','Um móvel percorre $120\,m$ em $10\,s$. Qual é sua velocidade média?','solution','Aplicando $v_m = \Delta s / \Delta t$, obtemos $v_m = 120/10 = 12\,m/s$.','conclusion','A velocidade média é $12\,m/s$.'),
      jsonb_build_object('id','imagem','type','image','visible',true,'storagePath','brand/projeto-vetor-logo.svg','alt','Identidade visual do Projeto Vetor usada como imagem de desenvolvimento da aula piloto','caption','Placeholder seguro de desenvolvimento; substitua por uma imagem didática do Storage antes de publicar.','align','center','size','small'),
      jsonb_build_object('id','resumo','type','summary','visible',true,'title','Resumo','points',jsonb_build_array('Todo movimento depende de um referencial.','Deslocamento e distância percorrida são grandezas diferentes.','Velocidade média relaciona deslocamento e intervalo de tempo.'))
    )), v_admin);
  end if;
end;
$$;
