-- Stores only encrypted Google Drive connection credentials. Notebook content never enters Supabase.
create table if not exists public.google_drive_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null,
  token_expiry timestamptz,
  google_account_email text,
  folder_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_drive_connections enable row level security;
revoke all on table public.google_drive_connections from anon, authenticated;
comment on table public.google_drive_connections is 'Server-only encrypted Google Drive credentials; never notebook content.';
