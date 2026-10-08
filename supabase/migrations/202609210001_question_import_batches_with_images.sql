alter table public.questoes add column if not exists image_metadata jsonb not null default '[]'::jsonb;

create table if not exists public.question_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'finalizing', 'completed', 'cancelled')),
  format text not null,
  source_name text,
  payload jsonb not null,
  validation_summary jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.question_import_image_slots (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.question_import_batches(id) on delete cascade,
  import_key text not null,
  slot_id text not null,
  required boolean not null default false,
  location text not null check (location in ('enunciado', 'alternativa', 'resolucao', 'contexto')),
  alternative_key text check (alternative_key is null or alternative_key in ('a', 'b', 'c', 'd', 'e')),
  expected_filename text,
  description text,
  alt_text text not null default '',
  caption text,
  bucket text,
  storage_path text,
  public_url text,
  original_name text,
  mime_type text,
  byte_size integer,
  width integer,
  height integer,
  status text not null default 'pending' check (status in ('pending', 'uploading', 'ready', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, import_key, slot_id)
);

create index if not exists question_import_batches_owner_status_idx
  on public.question_import_batches(created_by, status, updated_at desc);
create index if not exists question_import_slots_batch_status_idx
  on public.question_import_image_slots(batch_id, status);

alter table public.question_import_batches enable row level security;
alter table public.question_import_image_slots enable row level security;
revoke all on public.question_import_batches from anon, authenticated;
revoke all on public.question_import_image_slots from anon, authenticated;

comment on table public.question_import_batches is 'Rascunhos administrativos de importação em lote; acesso somente pelo backend service-role.';
comment on table public.question_import_image_slots is 'Slots temporários de imagens vinculados a um lote e chave de importação.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('questoes-imagens', 'questoes-imagens', true, 3145728, array['image/png','image/jpeg','image/webp']),
  ('resolucoes-imagens', 'resolucoes-imagens', true, 3145728, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  file_size_limit = least(coalesce(storage.buckets.file_size_limit, excluded.file_size_limit), excluded.file_size_limit),
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
