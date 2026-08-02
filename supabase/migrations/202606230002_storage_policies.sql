-- Review bucket names and existing policies before applying.
-- These policies restrict writes to admins/editors and block risky extensions.

drop policy if exists "questoes_imagens_public_read" on storage.objects;
create policy "questoes_imagens_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'questoes-imagens');

drop policy if exists "questoes_imagens_admin_editor_write" on storage.objects;
create policy "questoes_imagens_admin_editor_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'questoes-imagens'
  and public.is_admin_or_editor()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

drop policy if exists "questoes_imagens_admin_editor_update" on storage.objects;
create policy "questoes_imagens_admin_editor_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'questoes-imagens' and public.is_admin_or_editor())
with check (
  bucket_id = 'questoes-imagens'
  and public.is_admin_or_editor()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

drop policy if exists "resolucoes_imagens_public_read" on storage.objects;
create policy "resolucoes_imagens_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'resolucoes-imagens');

drop policy if exists "resolucoes_imagens_admin_editor_write" on storage.objects;
create policy "resolucoes_imagens_admin_editor_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resolucoes-imagens'
  and public.is_admin_or_editor()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

drop policy if exists "resolucoes_imagens_admin_editor_update" on storage.objects;
create policy "resolucoes_imagens_admin_editor_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'resolucoes-imagens' and public.is_admin_or_editor())
with check (
  bucket_id = 'resolucoes-imagens'
  and public.is_admin_or_editor()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);
