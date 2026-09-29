-- Records OAuth consent capability only. Notebook contents remain in Google Drive.
alter table public.google_drive_connections
  add column if not exists appdata_enabled_at timestamptz;

comment on column public.google_drive_connections.appdata_enabled_at is
  'When the user granted drive.appdata; null means the connection must be renewed.';
