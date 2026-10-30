begin;
create table if not exists public.legal_document_acceptances (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null check (char_length(terms_version) between 1 and 80), privacy_version text not null check (char_length(privacy_version) between 1 and 80),
  source text not null check (source in ('registration', 'existing_user_update')), accepted_at timestamptz not null default now(),
  unique (user_id, terms_version, privacy_version)
);
create index if not exists legal_document_acceptances_user_idx on public.legal_document_acceptances (user_id, accepted_at desc);
create table if not exists public.whatsapp_consent_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  consent_version text not null check (char_length(consent_version) between 1 and 80), granted boolean not null,
  source text not null check (source in ('registration', 'profile_settings')), occurred_at timestamptz not null default now()
);
create index if not exists whatsapp_consent_events_user_idx on public.whatsapp_consent_events (user_id, occurred_at desc);
alter table public.legal_document_acceptances enable row level security;
alter table public.whatsapp_consent_events enable row level security;
revoke all on public.legal_document_acceptances from anon, authenticated;
revoke all on public.whatsapp_consent_events from anon, authenticated;
grant all on public.legal_document_acceptances to service_role;
grant all on public.whatsapp_consent_events to service_role;
create or replace function public.record_legal_acceptance(p_user_id uuid, p_terms_version text, p_privacy_version text, p_source text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_source not in ('registration', 'existing_user_update') then raise exception 'Origem de aceite inválida'; end if;
  insert into public.legal_document_acceptances (user_id, terms_version, privacy_version, source)
  values (p_user_id, p_terms_version, p_privacy_version, p_source) on conflict (user_id, terms_version, privacy_version) do nothing;
end; $$;
create or replace function public.record_whatsapp_consent(p_user_id uuid, p_consent_version text, p_granted boolean, p_source text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_source not in ('registration', 'profile_settings') then raise exception 'Origem de consentimento inválida'; end if;
  insert into public.whatsapp_consent_events (user_id, consent_version, granted, source) values (p_user_id, p_consent_version, p_granted, p_source);
  update public.profiles set billing_whatsapp_opt_in = p_granted where id = p_user_id;
  if not found then raise exception 'Perfil não encontrado'; end if;
end; $$;
revoke all on function public.record_legal_acceptance(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.record_whatsapp_consent(uuid, text, boolean, text) from public, anon, authenticated;
grant execute on function public.record_legal_acceptance(uuid, text, text, text) to service_role;
grant execute on function public.record_whatsapp_consent(uuid, text, boolean, text) to service_role;
comment on table public.legal_document_acceptances is 'Aceites versionados dos documentos legais, gravados exclusivamente pelo backend.';
comment on table public.whatsapp_consent_events is 'Histórico imutável de concessão e revogação do consentimento para WhatsApp.';
commit;
-- Rollback manual: execute em uma transação, nesta ordem:
-- begin;
-- drop function if exists public.record_whatsapp_consent(uuid, text, boolean, text);
-- drop function if exists public.record_legal_acceptance(uuid, text, text, text);
-- drop table if exists public.whatsapp_consent_events;
-- drop table if exists public.legal_document_acceptances;
-- commit;
