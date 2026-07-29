-- Metadados de idempotência para importação em lote de questões via ADM.
-- Execute manualmente no SQL Editor do Supabase antes de usar /admin/questoes/importar-lote.

alter table if exists public.questoes
  add column if not exists import_source_id text,
  add column if not exists import_batch_id text,
  add column if not exists imported_at timestamptz,
  add column if not exists imported_by uuid references public.profiles(id) on delete set null;

create unique index if not exists questoes_import_source_id_unique_idx
  on public.questoes (import_source_id)
  where import_source_id is not null;

create index if not exists questoes_import_batch_id_idx
  on public.questoes (import_batch_id)
  where import_batch_id is not null;

create index if not exists questoes_imported_by_idx
  on public.questoes (imported_by)
  where imported_by is not null;
