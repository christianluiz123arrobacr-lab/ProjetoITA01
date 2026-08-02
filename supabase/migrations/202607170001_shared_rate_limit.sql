-- Shared, atomic rate-limit buckets for all application instances.
-- This migration is safe to run once through the Supabase SQL editor.

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  request_count integer not null check (request_count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_reset_at_idx
  on public.rate_limit_buckets (reset_at);

alter table public.rate_limit_buckets enable row level security;

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_ms integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket record;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 then
    raise exception 'rate limit bucket key is required';
  end if;

  if p_limit < 1 or p_window_ms < 1 then
    raise exception 'rate limit limit and window must be positive';
  end if;

  insert into public.rate_limit_buckets as buckets (
    bucket_key,
    request_count,
    reset_at,
    updated_at
  )
  values (
    p_bucket_key,
    1,
    now() + (p_window_ms * interval '1 millisecond'),
    now()
  )
  on conflict (bucket_key) do update
  set
    request_count = case
      when buckets.reset_at <= now() then 1
      else buckets.request_count + 1
    end,
    reset_at = case
      when buckets.reset_at <= now()
        then now() + (p_window_ms * interval '1 millisecond')
      else buckets.reset_at
    end,
    updated_at = now()
  returning buckets.request_count, buckets.reset_at into bucket;

  return query
  select
    bucket.request_count <= p_limit,
    greatest(0, ceil(extract(epoch from bucket.reset_at - now())))::integer;
end;
$$;

revoke all on table public.rate_limit_buckets from anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
