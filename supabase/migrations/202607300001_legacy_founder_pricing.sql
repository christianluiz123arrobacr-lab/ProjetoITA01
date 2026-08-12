-- Permanent founder eligibility and server-managed public plan catalogue.
-- Safe to execute more than once: schema changes, grants and backfill all use
-- idempotent operations.

alter table public.billing_plans
  add column if not exists is_public boolean not null default true,
  add column if not exists requires_legacy_founder_eligibility boolean not null default false,
  add column if not exists display_order integer not null default 100,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create table if not exists public.billing_user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entitlement_key text not null,
  source text not null,
  source_subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  source_payment_id uuid references public.billing_payments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key)
);

create index if not exists billing_user_entitlements_user_key_idx
  on public.billing_user_entitlements(user_id, entitlement_key);

alter table public.billing_user_entitlements enable row level security;
revoke all on public.billing_user_entitlements from anon, authenticated;
grant all on public.billing_user_entitlements to service_role;

drop policy if exists "billing_plans_public_active_select" on public.billing_plans;
create policy "billing_plans_public_active_select"
on public.billing_plans for select to anon, authenticated
using (is_active = true and is_public = true);

-- Stop every historical Beta Fundador R$ 6 plan and historical founder sales.
-- History and foreign keys remain untouched; only future catalogue visibility
-- and checkout availability are disabled.
update public.billing_plans
set is_active = false,
    is_public = false,
    updated_at = now()
where slug <> 'legacy-founder'
  and (
    (price_cents = 600 and (lower(slug) in ('beta-selecionado-5', 'selecionados_5', 'selecionado', 'selecionados', 'beta_selecionado') or lower(name) like '%beta%' or lower(name) like '%fundador%'))
    or lower(slug) in ('beta-selecionado-5', 'selecionados_5', 'selecionado', 'selecionados', 'beta_selecionado')
    or lower(slug) in ('beta-fundador-8', 'fundador_8', 'fundador', 'beta_fundador')
  );

insert into public.billing_plans (
  slug, name, description, price_cents, currency, billing_cycle, is_active,
  invite_only, is_public, requires_legacy_founder_eligibility, display_order,
  metadata, updated_at
)
values
  ('legacy-founder', 'Plano Fundador', 'Plano legado para alunos que participaram dos planos iniciais da plataforma.', 900, 'BRL', 'MONTHLY', true, false, true, true, 10, '{"pricing_rule":"legacy_founder","legacy_pricing_initialized":true}'::jsonb, now()),
  ('normal', 'Plano Normal', 'Plano mensal com acesso completo à plataforma.', 1190, 'BRL', 'MONTHLY', true, false, true, false, 20, '{"pricing_rule":"standard","legacy_pricing_initialized":true}'::jsonb, now())
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    price_cents = case
      when coalesce(public.billing_plans.metadata->>'legacy_pricing_initialized', 'false') = 'true' then public.billing_plans.price_cents
      else excluded.price_cents
    end,
    currency = excluded.currency,
    billing_cycle = excluded.billing_cycle,
    is_active = true,
    invite_only = false,
    is_public = true,
    requires_legacy_founder_eligibility = excluded.requires_legacy_founder_eligibility,
    display_order = excluded.display_order,
    metadata = coalesce(public.billing_plans.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();

-- Approved historical payments are the strongest source. The lateral lookup
-- records one stable payment/subscription reference without multiplying rows.
insert into public.billing_user_entitlements (
  user_id, entitlement_key, source, source_subscription_id, source_payment_id,
  metadata
)
select distinct on (p.user_id)
  p.user_id,
  'legacy_founder_eligible',
  case when p.amount_cents = 600 then 'historical_beta_founder' else 'historical_founder' end,
  p.subscription_id,
  p.id,
  jsonb_build_object('historical_plan_id', p.plan_id, 'historical_plan_slug', bp.slug, 'historical_amount_cents', p.amount_cents)
from public.billing_payments p
join public.billing_plans bp on bp.id = p.plan_id
where p.status = 'approved'
  and upper(coalesce(p.currency, 'BRL')) = 'BRL'
  and (
    (p.amount_cents = 600 and (lower(bp.slug) in ('beta-selecionado-5', 'selecionados_5', 'selecionado', 'selecionados', 'beta_selecionado') or lower(bp.name) like '%beta%' or lower(bp.name) like '%fundador%'))
    or (p.amount_cents = 900 and (lower(bp.slug) in ('beta-fundador-8', 'fundador_8', 'fundador', 'beta_fundador', 'legacy-founder') or lower(bp.name) like '%fundador%'))
  )
order by p.user_id, p.approved_at desc nulls last, p.created_at desc
on conflict (user_id, entitlement_key) do nothing;

-- Some old subscriptions predate billing_payments. Only active/trialing rows
-- from the historical plans qualify; pending, failed, canceled and expired rows
-- are deliberately excluded.
insert into public.billing_user_entitlements (
  user_id, entitlement_key, source, source_subscription_id, metadata
)
select distinct on (s.user_id)
  s.user_id,
  'legacy_founder_eligible',
  case when bp.price_cents = 600 then 'historical_beta_founder' else 'historical_founder' end,
  s.id,
  jsonb_build_object('historical_plan_id', s.plan_id, 'historical_plan_slug', bp.slug, 'historical_subscription_status', s.status)
from public.billing_subscriptions s
join public.billing_plans bp on bp.id = s.plan_id
where s.status in ('active', 'trialing', 'approved')
  and (
    lower(bp.slug) in ('beta-selecionado-5', 'selecionados_5', 'selecionado', 'selecionados', 'beta_selecionado', 'beta-fundador-8', 'fundador_8', 'fundador', 'beta_fundador', 'legacy-founder')
    or ((bp.price_cents = 600 or bp.price_cents = 900) and (lower(bp.name) like '%beta%' or lower(bp.name) like '%fundador%'))
  )
order by s.user_id, s.created_at desc
on conflict (user_id, entitlement_key) do nothing;

comment on table public.billing_user_entitlements is
  'Permanent server-owned billing eligibility. Never writable by the frontend.';

create or replace function public.admin_update_billing_plan(
  p_admin_user_id uuid,
  p_plan_id uuid,
  p_name text,
  p_description text,
  p_price_cents integer,
  p_max_active_subscriptions integer,
  p_is_active boolean,
  p_is_public boolean,
  p_display_order integer,
  p_requires_legacy_founder_eligibility boolean,
  p_eligibility_change_confirmation text default null
)
returns public.billing_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous public.billing_plans%rowtype;
  v_next public.billing_plans%rowtype;
begin
  if not exists (select 1 from public.admin_users where user_id = p_admin_user_id and role = 'admin') then
    raise exception 'administrator permission required';
  end if;
  if p_price_cents < 1 or p_display_order < 0 or (p_max_active_subscriptions is not null and p_max_active_subscriptions < 0) then
    raise exception 'invalid billing plan configuration';
  end if;

  select * into v_previous from public.billing_plans where id = p_plan_id for update;
  if not found then raise exception 'billing plan not found'; end if;

  if v_previous.slug = 'legacy-founder'
     and v_previous.requires_legacy_founder_eligibility = true
     and p_requires_legacy_founder_eligibility = false
     and coalesce(p_eligibility_change_confirmation, '') <> 'REMOVER ELEGIBILIDADE DO PLANO FUNDADOR' then
    raise exception 'explicit founder eligibility confirmation required';
  end if;

  update public.billing_plans
  set name = p_name,
      description = p_description,
      price_cents = p_price_cents,
      max_active_subscriptions = p_max_active_subscriptions,
      is_active = p_is_active,
      is_public = p_is_public,
      display_order = p_display_order,
      requires_legacy_founder_eligibility = p_requires_legacy_founder_eligibility,
      updated_by = p_admin_user_id,
      updated_at = now()
  where id = p_plan_id
  returning * into v_next;

  insert into public.admin_logs(admin_user_id, action, entity_type, entity_id, description, level, metadata)
  values (
    p_admin_user_id, 'billing_plan_updated', 'billing_plan', p_plan_id,
    'Configuração de plano atualizada no ADM', 'info',
    jsonb_build_object(
      'slug', v_previous.slug,
      'previous', jsonb_build_object('name', v_previous.name, 'description', v_previous.description, 'priceCents', v_previous.price_cents, 'isActive', v_previous.is_active, 'isPublic', v_previous.is_public, 'displayOrder', v_previous.display_order, 'requiresLegacyFounderEligibility', v_previous.requires_legacy_founder_eligibility),
      'next', jsonb_build_object('name', v_next.name, 'description', v_next.description, 'priceCents', v_next.price_cents, 'isActive', v_next.is_active, 'isPublic', v_next.is_public, 'displayOrder', v_next.display_order, 'requiresLegacyFounderEligibility', v_next.requires_legacy_founder_eligibility)
    )
  );
  return v_next;
end;
$$;

revoke all on function public.admin_update_billing_plan(uuid, uuid, text, text, integer, integer, boolean, boolean, integer, boolean, text) from public, anon, authenticated;
grant execute on function public.admin_update_billing_plan(uuid, uuid, text, text, integer, integer, boolean, boolean, integer, boolean, text) to service_role;
