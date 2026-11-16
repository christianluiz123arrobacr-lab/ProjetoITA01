-- Preparation only: existing checkout and payment records remain unchanged.
begin;
create table public.billing_plan_durations (
  plan_id uuid not null references public.billing_plans(id) on delete cascade,
  months integer not null check (months in (1,2,3,6,12)),
  enabled boolean not null default false,
  discount_bps integer not null default 0 check (discount_bps between 0 and 9900),
  revision integer not null default 1 check (revision > 0),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (plan_id, months)
);
alter table public.billing_plan_durations enable row level security;
revoke all on public.billing_plan_durations from public, anon, authenticated;
grant select on public.billing_plan_durations to service_role;

create function public.save_billing_plan_duration(
  p_actor uuid, p_plan uuid, p_months integer, p_enabled boolean,
  p_discount_bps integer, p_expected_revision integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.billing_plan_durations; v_revision integer;
begin
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid revision';
  end if;
  if not exists(select 1 from public.profiles where id=p_actor and role='admin' and ativo) then
    raise exception 'Administrator required' using errcode='42501';
  end if;
  -- Serialize even the initial insert. Parent row always exists and also
  -- coordinates deletion; compare-and-swap prevents lost administrative edits.
  perform 1 from public.billing_plans where id=p_plan for update;
  if not found then raise exception 'Plan not found'; end if;
  select revision into v_revision from public.billing_plan_durations where plan_id=p_plan and months=p_months;
  if coalesce(v_revision,0) <> p_expected_revision then
    raise exception 'Configuration changed' using errcode='40001';
  end if;
  insert into public.billing_plan_durations(plan_id,months,enabled,discount_bps,updated_by)
  values(p_plan,p_months,p_enabled,p_discount_bps,p_actor)
  on conflict(plan_id,months) do update set enabled=excluded.enabled,
    discount_bps=excluded.discount_bps, revision=billing_plan_durations.revision+1,
    updated_by=excluded.updated_by, updated_at=now()
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;
revoke all on function public.save_billing_plan_duration(uuid,uuid,integer,boolean,integer,integer) from public,anon,authenticated;
grant execute on function public.save_billing_plan_duration(uuid,uuid,integer,boolean,integer,integer) to service_role;
commit;
