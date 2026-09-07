-- Reconstruct the pre-migration core tables for an isolated PostgreSQL test only.
-- No production data or connection is used.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table public.profiles(id uuid primary key references auth.users(id),email text,nome text,role text default 'student',ativo boolean default true);
create table public.billing_plans(id uuid primary key default gen_random_uuid(),slug text unique,name text,description text,price_cents integer,currency text default 'BRL',billing_cycle text default 'monthly',is_active boolean default true,is_public boolean default true,invite_only boolean default false,max_active_subscriptions integer,metadata jsonb default '{}',created_at timestamptz default now(),updated_at timestamptz default now());
create table public.billing_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),plan_id uuid references billing_plans(id),status text,created_at timestamptz default now(),current_period_end timestamptz);
create unique index billing_subscriptions_one_active_per_user on billing_subscriptions(user_id) where status='active';
create table public.billing_plan_invites(id uuid primary key default gen_random_uuid(),plan_id uuid references billing_plans(id),user_id uuid references profiles(id),email text,token text,expires_at timestamptz,used_at timestamptz,created_at timestamptz default now());
