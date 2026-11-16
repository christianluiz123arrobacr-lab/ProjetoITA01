begin;

alter table if exists public.questoes
  add column if not exists public_slug text,
  add column if not exists is_public boolean not null default false,
  add column if not exists public_published_at timestamptz,
  add column if not exists public_noindex boolean not null default false;

create unique index if not exists questoes_public_slug_unique_idx
  on public.questoes (public_slug)
  where public_slug is not null;

create index if not exists questoes_public_discovery_idx
  on public.questoes (public_published_at desc, public_slug)
  where is_public = true
    and public_noindex = false
    and publicada = true
    and public_slug is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'questoes_public_slug_format_check'
      and conrelid = 'public.questoes'::regclass
  ) then
    alter table public.questoes add constraint questoes_public_slug_format_check
      check (public_slug is null or (char_length(public_slug) between 8 and 140 and public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
  end if;
end $$;

-- Deliberately do not grant anon access. Public pages are served exclusively by
-- backend handlers that apply is_public/public_noindex/publicada filters.
revoke all on table public.questoes from anon;

commit;
