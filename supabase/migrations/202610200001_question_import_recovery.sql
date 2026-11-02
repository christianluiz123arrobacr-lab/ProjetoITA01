-- Apply manually BEFORE publishing the dependent backend. No historical DML.
-- The previous backend is fenced from mutating import sessions after this SQL.
begin;
-- Fail atomically instead of waiting indefinitely behind an active editor/import.
set local lock_timeout='5s';
set local statement_timeout='60s';
-- Fails without modifying data if the historical idempotency prerequisite is
-- absent or incompatible. Run the companion diagnostic before retrying.
create unique index if not exists questoes_import_source_id_unique_idx
  on public.questoes(import_source_id) where import_source_id is not null;
do $$begin
  if not exists(select 1 from pg_index i join pg_class c on c.oid=i.indexrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='questoes_import_source_id_unique_idx' and i.indisunique and i.indisvalid
      and i.indrelid='public.questoes'::regclass and i.indnkeyatts=1
      and i.indkey[0]=(select attnum from pg_attribute where attrelid='public.questoes'::regclass and attname='import_source_id')
      and pg_get_expr(i.indpred,i.indrelid)='(import_source_id IS NOT NULL)') then
    raise exception 'IMPORT_SOURCE_INDEX_INVALID: run the diagnostic';
  end if;
end$$;
alter table public.question_import_batches
  add column if not exists operation_id uuid,
  add column if not exists operation_kind text,
  add column if not exists lease_until timestamptz,
  add column if not exists revision bigint not null default 0,
  add column if not exists last_error text,
  add column if not exists cleanup_pending boolean not null default false,
  add column if not exists cleanup_scan_pending boolean not null default true,
  add column if not exists cleanup_slot integer not null default 0,
  add column if not exists cleanup_offset integer not null default 0,
  add column if not exists client_request_key text;
create unique index if not exists question_import_request_unique
  on public.question_import_batches(created_by, client_request_key) where client_request_key is not null;

create table if not exists public.question_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.question_import_batches(id),
  import_key text not null,
  source_id text not null,
  question_id uuid references public.questoes(id) on delete set null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique(batch_id, import_key)
);
alter table public.resolucoes
  add column if not exists import_item_id uuid references public.question_import_items(id),
  add column if not exists import_block_index integer;
create unique index if not exists resolucoes_import_block_unique
  on public.resolucoes(import_item_id, import_block_index) where import_item_id is not null;

create table if not exists public.question_import_assets (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.question_import_batches(id),
  slot_row_id uuid,
  bucket text not null check(bucket in ('questoes-imagens','resolucoes-imagens')),
  storage_path text not null,
  public_url text not null,
  state text not null default 'candidate' check(state in ('candidate','ready','retained','delete_pending','deleted')),
  last_error text,
  delete_after timestamptz not null default (now()+interval '130 minutes'),
  updated_at timestamptz not null default now(),
  unique(bucket, storage_path)
);
create index if not exists question_import_assets_batch on public.question_import_assets(batch_id, state);
create index if not exists question_import_assets_url on public.question_import_assets(public_url);
create index if not exists question_import_assets_path on public.question_import_assets(storage_path);
alter table public.question_import_items enable row level security;
alter table public.question_import_assets enable row level security;
revoke all on public.question_import_items, public.question_import_assets from public, anon, authenticated;
revoke all on public.question_import_items, public.question_import_assets from service_role;
grant select on public.question_import_items to service_role;

-- Also fences an older backend during the publication window. RPCs set this
-- transaction-local marker only after locking and checking ownership/state.
create function public.vet_import_mutation_guard() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
declare b uuid;
begin
  if tg_table_name = 'question_import_batches' then b := old.id;
  else b := coalesce(new.batch_id,old.batch_id); end if;
  if current_setting('vet.import_batch',true) is distinct from b::text then
    raise exception 'IMPORT_PROTOCOL_REQUIRED' using errcode='55000';
  end if;
  -- Recheck after any wait inside a control action, immediately before its
  -- final batch write. A timed-out action rolls its earlier slot/asset work back.
  if tg_table_name='question_import_batches' and nullif(current_setting('vet.import_token',true),'') is not null then
    if old.operation_id::text is distinct from current_setting('vet.import_token',true)
      or old.lease_until<=clock_timestamp() then
      raise exception 'IMPORT_LEASE_LOST' using errcode='40001';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger question_import_batch_guard before update or delete on public.question_import_batches
for each row execute function public.vet_import_mutation_guard();
create trigger question_import_slot_guard before insert or update or delete on public.question_import_image_slots
for each row execute function public.vet_import_mutation_guard();

-- Serialize references with durable deletion tombstones. A Storage request may
-- outlive a lease; once tombstoned, that path can NEVER be associated again.
create function public.vet_import_reference_text(p_value jsonb) returns text
language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_text text:=p_value::text; v_code text; v_byte integer;
begin
  -- URL paths may contain percent-encoded ASCII even when saved by a manual
  -- editor. Compare their decoded physical path too; never fetch a URL here.
  for v_code in select distinct m[1] from regexp_matches(v_text,'%([0-7][0-9a-fA-F])','g') m
  loop
    v_byte:=get_byte(decode(v_code,'hex'),0);
    if v_byte between 32 and 126 then v_text:=replace(v_text,'%'||v_code,chr(v_byte)); end if;
  end loop;
  return v_text;
end$$;
create function public.vet_import_reference_guard() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
declare a record; v_path text; v_paths text[]; v_text text;
begin
  if tg_table_name='questoes' then
    if tg_op='INSERT' then
      -- The old stateless endpoint used a batch key without a persisted batch.
      -- Fence that writer too, not just IDs already present in the sessions table.
      if new.import_batch_id is not null and current_setting('vet.import_batch',true) is distinct from new.import_batch_id then
        raise exception 'IMPORT_PROTOCOL_REQUIRED' using errcode='55000';
      end if;
    end if;
  end if;
  -- Legacy paths may not have an asset row yet. Serialize their discovery with
  -- manual references too, before either side can commit an untracked reference.
  -- Lock the physical path, not a particular public/signed URL representation.
  -- Extract paths inside Markdown/text as well as dedicated image columns.
  -- Do not scan the asset ledger for ordinary edits with no import image.
  v_text:=to_jsonb(new)::text;
  if strpos(v_text,'question-imports/')=0 and strpos(v_text,'%')=0 then return new; end if;
  v_text:=public.vet_import_reference_text(to_jsonb(new));
  select array_agg(distinct matches[1] order by matches[1]) into v_paths from regexp_matches(v_text,
    '(question-imports/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp))','g') matches;
  foreach v_path in array coalesce(v_paths,array[]::text[])
  loop
    if not pg_try_advisory_xact_lock(hashtextextended(v_path,37)) then
      raise exception 'IMPORT_REFERENCE_BUSY' using errcode='40001';
    end if;
  end loop;
  for a in select id,state from public.question_import_assets
    where storage_path=any(v_paths)
    order by id for update nowait
  loop
    if a.state in ('delete_pending','deleted') then
      raise exception 'IMPORT_FILE_DISCARDED' using errcode='55000';
    end if;
    update public.question_import_assets set state='retained',updated_at=clock_timestamp() where id=a.id;
    if not found then raise exception 'IMPORT_ASSET_CHANGED' using errcode='40001'; end if;
  end loop;
  return new;
end $$;
create trigger question_import_question_reference before insert or update on public.questoes
for each row execute function public.vet_import_reference_guard();
create trigger question_import_resolution_reference before insert or update on public.resolucoes
for each row execute function public.vet_import_reference_guard();

create function public.vet_import_file_referenced(p_path text) returns boolean
language sql stable set search_path=pg_catalog,public as $$
  select exists(select 1 from public.questoes q where strpos(public.vet_import_reference_text(to_jsonb(q)),p_path)>0)
    or exists(select 1 from public.resolucoes r where strpos(public.vet_import_reference_text(to_jsonb(r)),p_path)>0);
$$;

create function public.vet_import_control(p_batch uuid,p_actor uuid,p_action text,p_token uuid default null,p_args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='2s' as $$
declare b public.question_import_batches; s public.question_import_image_slots;
  a public.question_import_assets; v_id uuid; v_path text; v_bucket text; v_result jsonb; v_key text;
begin
  if coalesce(public.vet_resolve_access_role(p_actor)->>'role','student') not in ('admin','editor') then
    raise exception 'IMPORT_FORBIDDEN' using errcode='42501';
  end if;
  perform set_config('vet.import_batch',p_batch::text,true);
  perform set_config('vet.import_token',case when p_action='claim' then '' else coalesce(p_token::text,'') end,true);
  if p_action='create' then
    v_key := p_args->>'request_key';
    insert into public.question_import_batches(id,created_by,format,source_name,payload,validation_summary,client_request_key)
      values(p_batch,p_actor,p_args->>'format',p_args->>'source_name',p_args->'payload',p_args->'summary',v_key)
      on conflict(created_by,client_request_key) where client_request_key is not null do nothing returning id into v_id;
    if v_id is null then
      select * into b from public.question_import_batches where created_by=p_actor and client_request_key=v_key;
      if b.payload is distinct from p_args->'payload' then raise exception 'IMPORT_REQUEST_CHANGED' using errcode='40001'; end if;
      return to_jsonb(b)-'operation_id';
    end if;
    insert into public.question_import_image_slots(batch_id,import_key,slot_id,required,location,alternative_key,expected_filename,description,alt_text,caption)
      select p_batch,x.import_key,x.slot_id,x.required,x.location,x.alternative_key,x.expected_filename,x.description,x.alt_text,x.caption
      from jsonb_to_recordset(coalesce(p_args->'slots','[]')) as x(import_key text,slot_id text,required boolean,location text,alternative_key text,expected_filename text,description text,alt_text text,caption text);
    select * into b from public.question_import_batches where id=p_batch;
    return to_jsonb(b)-'operation_id';
  end if;
  select * into b from public.question_import_batches where id=p_batch and created_by=p_actor for update;
  if not found then raise exception 'IMPORT_NOT_FOUND' using errcode='P0002'; end if;
  if p_action='snapshot' then
    return (to_jsonb(b)-'operation_id')||jsonb_build_object('slots',coalesce((select jsonb_agg(to_jsonb(ss)) from public.question_import_image_slots ss where ss.batch_id=p_batch),'[]'),
      'progress',coalesce((select jsonb_agg(jsonb_build_object('import_key',i.import_key,'result',i.result)) from public.question_import_items i where i.batch_id=p_batch),'[]'));
  end if;
  if p_action='claim' then
    if b.status='completed' and p_args->>'kind'='finalize' then return to_jsonb(b)-'operation_id'; end if;
    if b.operation_id is not null and b.lease_until>clock_timestamp() then raise exception 'IMPORT_BUSY' using errcode='40001'; end if;
    if p_token is null then raise exception 'IMPORT_TOKEN_REQUIRED' using errcode='22023'; end if;
    case p_args->>'kind'
      when 'finalize' then
        if b.status not in ('draft','finalizing') then raise exception 'IMPORT_NOT_FINALIZABLE' using errcode='55000'; end if;
      when 'edit' then
        if b.status<>'draft' then raise exception 'IMPORT_NOT_EDITABLE' using errcode='55000'; end if;
      when 'cancel' then
        if b.status not in ('draft','cancelled') then raise exception 'IMPORT_CANNOT_CANCEL_PROCESSING' using errcode='55000'; end if;
        if exists(select 1 from public.question_import_items where batch_id=p_batch)
          or exists(select 1 from public.questoes q where q.import_batch_id=p_batch::text) then
          raise exception 'IMPORT_PARTIAL_REQUIRES_RESUME' using errcode='55000';
        end if;
      when 'cleanup' then
        if b.status not in ('completed','cancelled') then raise exception 'IMPORT_NOT_TERMINAL' using errcode='55000'; end if;
      else raise exception 'IMPORT_UNKNOWN_OPERATION' using errcode='22023';
    end case;
    -- Serialize adoption of historical, not-yet-journaled paths too.
    for v_path in select storage_path from public.question_import_image_slots
      where batch_id=p_batch and storage_path is not null order by storage_path
    loop
      if not pg_try_advisory_xact_lock(hashtextextended(v_path,37)) then
        raise exception 'IMPORT_REFERENCE_BUSY' using errcode='40001';
      end if;
    end loop;
    -- Adopt existing slot references without changing historical content.
    insert into public.question_import_assets(batch_id,slot_row_id,bucket,storage_path,public_url,state)
      select p_batch,id,bucket,storage_path,public_url,case when status='ready' then 'ready' else 'candidate' end
      from public.question_import_image_slots where batch_id=p_batch and bucket in ('questoes-imagens','resolucoes-imagens')
        and public_url is not null and storage_path ~ ('^question-imports/'||p_batch||'/'||id||'/[0-9a-f-]{36}\.(png|jpg|webp)$')
      on conflict(bucket,storage_path) do nothing;
    update public.question_import_batches set operation_id=p_token,operation_kind=p_args->>'kind',lease_until=clock_timestamp()+interval '60 seconds',
      status=case p_args->>'kind' when 'cancel' then 'cancelled' else status end,
      cleanup_scan_pending=cleanup_scan_pending or p_args->>'kind' in ('cancel','cleanup'),
      cleanup_pending=cleanup_pending or p_args->>'kind' in ('cancel','cleanup'), last_error=null, revision=revision+1,updated_at=clock_timestamp()
      where id=p_batch returning * into b;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return to_jsonb(b)||jsonb_build_object('slots',coalesce((select jsonb_agg(to_jsonb(ss)) from public.question_import_image_slots ss where ss.batch_id=p_batch),'[]'),
      'progress',coalesce((select jsonb_agg(to_jsonb(i)) from public.question_import_items i where i.batch_id=p_batch),'[]'));
  end if;
  if b.operation_id is distinct from p_token or p_token is null or b.lease_until<=clock_timestamp() then
    raise exception 'IMPORT_LEASE_LOST' using errcode='40001';
  end if;
  if p_action='release' then
    update public.question_import_batches set operation_id=null,operation_kind=null,lease_until=null,
      last_error=p_args->>'error',revision=revision+1,updated_at=clock_timestamp() where id=p_batch returning * into b;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return to_jsonb(b)-'operation_id';
  end if;
  if p_action='renew' then
    update public.question_import_batches set lease_until=clock_timestamp()+interval '60 seconds' where id=p_batch returning * into b;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return to_jsonb(b);
  end if;
  if p_action='start' then
    if b.operation_kind<>'finalize' or b.status not in ('draft','finalizing') then raise exception 'IMPORT_NOT_FINALIZABLE' using errcode='55000'; end if;
    update public.question_import_batches set status='finalizing',revision=revision+1,updated_at=clock_timestamp() where id=p_batch;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return '{}';
  end if;
  if p_action in ('register','confirm','remove_slot','metadata','remove_invalid') then
    if b.status<>'draft' or b.operation_kind<>'edit' then raise exception 'IMPORT_NOT_EDITABLE' using errcode='55000'; end if;
    if p_action='remove_invalid' then
      update public.question_import_assets set state='candidate' where batch_id=p_batch and state='ready'
        and slot_row_id in(select id from public.question_import_image_slots where batch_id=p_batch and import_key=p_args->>'import_key');
      delete from public.question_import_image_slots where batch_id=p_batch and import_key=p_args->>'import_key';
      update public.question_import_batches set payload=p_args->'payload',validation_summary=p_args->'summary',revision=revision+1,cleanup_pending=true,updated_at=clock_timestamp() where id=p_batch;
      if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
      return '{}';
    end if;
    select * into s from public.question_import_image_slots where batch_id=p_batch and import_key=p_args->>'import_key' and slot_id=p_args->>'slot_id' for update;
    if not found then raise exception 'IMPORT_SLOT_NOT_FOUND' using errcode='P0002'; end if;
    if p_action='register' then
      v_path:=p_args->>'path'; v_bucket:=case when s.location='resolucao' then 'resolucoes-imagens' else 'questoes-imagens' end;
      if v_path !~ ('^question-imports/'||p_batch||'/'||s.id||'/[0-9a-f-]{36}\.(png|jpg|webp)$') then raise exception 'IMPORT_FILE_OWNER' using errcode='42501'; end if;
      if not pg_try_advisory_xact_lock(hashtextextended(v_path,37)) then
        raise exception 'IMPORT_REFERENCE_BUSY' using errcode='40001';
      end if;
      insert into public.question_import_assets(batch_id,slot_row_id,bucket,storage_path,public_url)
        values(p_batch,s.id,v_bucket,v_path,p_args->>'url');
      if not found then raise exception 'IMPORT_ASSET_CHANGED' using errcode='40001'; end if;
    elsif p_action='confirm' then
      select * into a from public.question_import_assets where batch_id=p_batch and slot_row_id=s.id and storage_path=p_args->>'path' for update;
      if not found or a.state in ('delete_pending','deleted') then raise exception 'IMPORT_FILE_DISCARDED' using errcode='55000'; end if;
      if s.storage_path=a.storage_path and s.status='ready' then return '{}'; end if;
      if s.storage_path is distinct from p_args->>'previous_path' then raise exception 'IMPORT_SLOT_CHANGED' using errcode='40001'; end if;
      if s.required and coalesce(p_args->>'alt','')='' then raise exception 'IMPORT_ALT_REQUIRED' using errcode='22023'; end if;
      update public.question_import_assets set state='candidate' where batch_id=p_batch and storage_path=s.storage_path and state='ready';
      update public.question_import_assets set state=case when state='retained' then state else 'ready' end where id=a.id;
      if not found then raise exception 'IMPORT_ASSET_CHANGED' using errcode='40001'; end if;
      update public.question_import_image_slots set bucket=a.bucket,storage_path=a.storage_path,public_url=a.public_url,original_name=p_args->>'name',alt_text=p_args->>'alt',caption=p_args->>'caption',
        mime_type=p_args->>'mime',byte_size=(p_args->>'bytes')::int,width=(p_args->>'width')::int,height=(p_args->>'height')::int,status='ready',updated_at=clock_timestamp() where id=s.id;
      if not found then raise exception 'IMPORT_SLOT_CHANGED' using errcode='40001'; end if;
    elsif p_action='remove_slot' then
      update public.question_import_image_slots set bucket=null,storage_path=null,public_url=null,original_name=null,mime_type=null,byte_size=null,width=null,height=null,status='pending',updated_at=clock_timestamp() where id=s.id;
      if not found then raise exception 'IMPORT_SLOT_CHANGED' using errcode='40001'; end if;
      update public.question_import_assets set state='candidate' where batch_id=p_batch and storage_path=s.storage_path and state='ready';
    else
      if s.required and coalesce(p_args->>'alt','')='' then raise exception 'IMPORT_ALT_REQUIRED' using errcode='22023'; end if;
      update public.question_import_image_slots set alt_text=p_args->>'alt',caption=p_args->>'caption',updated_at=clock_timestamp() where id=s.id;
      if not found then raise exception 'IMPORT_SLOT_CHANGED' using errcode='40001'; end if;
    end if;
    update public.question_import_batches set revision=revision+1,cleanup_pending=true,updated_at=clock_timestamp() where id=p_batch;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return '{}';
  end if;
  if p_action='plan_delete' then
    v_result:='[]';
    for a in select * from public.question_import_assets where batch_id=p_batch and state in ('candidate','delete_pending','ready')
      and (p_args->>'path' is null or storage_path=p_args->>'path')
      and (state<>'ready' or b.status='cancelled')
      order by updated_at,id limit 3 for update
    loop
      if public.vet_import_file_referenced(a.storage_path) then
        update public.question_import_assets set state='retained' where id=a.id;
      elsif not exists(select 1 from public.question_import_image_slots where batch_id=p_batch and storage_path=a.storage_path and status='ready') or b.status='cancelled'
        or (b.status='completed' and a.state in ('candidate','delete_pending')) then
        update public.question_import_assets set state='delete_pending',updated_at=clock_timestamp() where id=a.id;
        if not found then raise exception 'IMPORT_ASSET_CHANGED' using errcode='40001'; end if;
        v_result:=v_result||jsonb_build_array(jsonb_build_object('id',a.id,'bucket',a.bucket,'path',a.storage_path));
      end if;
    end loop;
    update public.question_import_batches set cleanup_pending=exists(select 1 from public.question_import_assets where batch_id=p_batch and state in ('candidate','delete_pending')) or cleanup_scan_pending where id=p_batch;
    return v_result;
  end if;
  if p_action='deleted' then
    update public.question_import_assets set state=case when p_args->>'error' is null and delete_after<=clock_timestamp() then 'deleted' else 'delete_pending' end,last_error=p_args->>'error',updated_at=clock_timestamp()
      where id=(p_args->>'asset_id')::uuid and batch_id=p_batch and state='delete_pending';
    if not found then raise exception 'IMPORT_ASSET_CHANGED' using errcode='40001'; end if;
    -- Offset-based Storage listings shift after removals. Restart their cursor
    -- only when something was removed or its outcome is uncertain.
    if coalesce((p_args->>'removed')::boolean,false) or p_args->>'error' is not null then
      update public.question_import_batches set cleanup_slot=0,cleanup_offset=0,cleanup_scan_pending=true where id=p_batch;
    end if;
    update public.question_import_batches set cleanup_pending=exists(select 1 from public.question_import_assets where batch_id=p_batch and state in ('candidate','delete_pending')) or cleanup_scan_pending where id=p_batch;
    return '{}';
  end if;
  if p_action in ('discover','advance_scan') then
    if b.status not in ('cancelled','completed') or b.operation_kind not in ('cancel','cleanup') then raise exception 'IMPORT_NOT_TERMINAL' using errcode='55000'; end if;
    if p_action='advance_scan' then
      update public.question_import_batches set cleanup_slot=(p_args->>'slot')::int,cleanup_offset=(p_args->>'offset')::int,
        cleanup_scan_pending=(p_args->>'slot')::int>0 or (p_args->>'offset')::int>0,
        cleanup_pending=exists(select 1 from public.question_import_assets where batch_id=p_batch and state in ('candidate','delete_pending'))
          or (p_args->>'slot')::int>0 or (p_args->>'offset')::int>0 where id=p_batch;
      return '{}';
    end if;
    select * into s from public.question_import_image_slots where batch_id=p_batch and id=(p_args->>'slot_row_id')::uuid;
    v_path:=p_args->>'path';
    if not found or v_path !~ ('^question-imports/'||p_batch||'/'||s.id||'/[0-9a-f-]{36}\.(png|jpg|webp)$') then raise exception 'IMPORT_FILE_OWNER' using errcode='42501'; end if;
    if not pg_try_advisory_xact_lock(hashtextextended(v_path,37)) then
      raise exception 'IMPORT_REFERENCE_BUSY' using errcode='40001';
    end if;
    insert into public.question_import_assets(batch_id,slot_row_id,bucket,storage_path,public_url)
      values(p_batch,s.id,case when s.location='resolucao' then 'resolucoes-imagens' else 'questoes-imagens' end,v_path,p_args->>'url')
      on conflict(bucket,storage_path) do nothing;
    if b.lease_until<=clock_timestamp() then raise exception 'IMPORT_LEASE_LOST' using errcode='40001'; end if;
    return '{}';
  end if;
  if p_action='complete' then
    if b.status<>'finalizing' or b.operation_kind<>'finalize' then raise exception 'IMPORT_NOT_FINALIZABLE' using errcode='55000'; end if;
    if (p_args->>'expected_count')::int<>(select count(*) from public.question_import_items where batch_id=p_batch) then raise exception 'IMPORT_ITEMS_PENDING' using errcode='55000'; end if;
    -- Ready images of invalid/skipped items were never committed by this run.
    -- Keep actual/manual references protected by the deletion planner/trigger.
    update public.question_import_assets set state='candidate' where batch_id=p_batch and state='ready'
      and slot_row_id in(select skipped_slot.id from public.question_import_image_slots skipped_slot where skipped_slot.batch_id=p_batch
        and not exists(select 1 from public.question_import_items i where i.batch_id=p_batch and i.import_key=skipped_slot.import_key));
    update public.question_import_batches set status='completed',result=p_args->'result',completed_at=clock_timestamp(),updated_at=clock_timestamp(),operation_id=null,operation_kind=null,lease_until=null,last_error=null,
      cleanup_pending=exists(select 1 from public.question_import_assets where batch_id=p_batch and state in ('candidate','delete_pending')) or cleanup_scan_pending,revision=revision+1 where id=p_batch returning * into b;
    if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
    return to_jsonb(b)-'operation_id';
  end if;
  raise exception 'IMPORT_UNKNOWN_ACTION' using errcode='22023';
end $$;

-- One short database transaction per item. No Storage/HTTP is called here.
create function public.vet_import_commit_item(p_batch uuid,p_actor uuid,p_token uuid,p_key text,p_question jsonb,p_blocks jsonb,p_index integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='2s' as $$
declare b public.question_import_batches; q public.questoes; v_item uuid:=gen_random_uuid(); v_source text:=p_question->>'import_source_id';
  v_result jsonb; v_columns text; v_values text; v_new boolean:=false; v_blocks integer:=0; v_review boolean:=false;
begin
  if coalesce(public.vet_resolve_access_role(p_actor)->>'role','student') not in ('admin','editor') then raise exception 'IMPORT_FORBIDDEN' using errcode='42501'; end if;
  select * into b from public.question_import_batches where id=p_batch and created_by=p_actor for update;
  if not found then raise exception 'IMPORT_NOT_FOUND' using errcode='P0002'; end if;
  if b.status<>'finalizing' or b.operation_kind<>'finalize' or b.operation_id is distinct from p_token or p_token is null or b.lease_until<=clock_timestamp() then raise exception 'IMPORT_LEASE_LOST' using errcode='40001'; end if;
  perform set_config('vet.import_batch',p_batch::text,true);
  perform set_config('vet.import_token',p_token::text,true);
  select result into v_result from public.question_import_items where batch_id=p_batch and import_key=p_key;
  if found then return v_result; end if;
  if not exists(select 1 from jsonb_array_elements(b.payload->'questions') x where coalesce(x->>'chave_importacao',x->>'id_importacao',x->>'import_hash')=p_key and coalesce(x->>'id_importacao',x->>'import_hash')=v_source) then raise exception 'IMPORT_ITEM_UNKNOWN' using errcode='22023'; end if;
  p_question:=p_question||jsonb_build_object('import_batch_id',p_batch::text,'imported_by',p_actor);
  -- Explicit allowlist; jsonb_populate_record casts to the real column types.
  select string_agg(format('%I',key),',' order by key),string_agg(format('x.%I',key),',' order by key) into v_columns,v_values
    from jsonb_object_keys(p_question) key where key=any(array['codigo','disciplina','conteudo','conteudos','assunto','assuntos','assuntos_por_conteudo','banca','ano','dificuldade','instituição','publicada','enunciado','enunciado_pos_imagem','formula','url_imagem','A','B','C','D','E','a_url_imagem','b_url_imagem','c_url_imagem','d_url_imagem','e_url_imagem','image_metadata','alternativa_correta','import_source_id','import_batch_id','imported_at','imported_by']);
  execute format('insert into public.questoes(%s) select %s from jsonb_populate_record(null::public.questoes,$1) x on conflict(import_source_id) where import_source_id is not null do nothing returning *',v_columns,v_values) into q using p_question;
  v_new:=q.id is not null;
  -- The duplicate is read only. Do not invert the question/asset lock order of
  -- an editorial UPDATE after our BEFORE INSERT reference trigger has run.
  if not v_new then select * into strict q from public.questoes where import_source_id=v_source; end if;
  v_review:=not v_new and jsonb_array_length(p_blocks)>0 and not exists(select 1 from public.resolucoes where questao_id=q.id);
  v_result:=jsonb_build_object('index',p_index,'importSourceId',v_source,'status',case when v_new then 'criada' else 'duplicada' end,'questionId',q.id,'codigo',q.codigo,'resolutionBlocksSaved',case when v_new then jsonb_array_length(p_blocks) else 0 end,
    'requiresReview',v_review,'message',case when v_new then 'Questão e resolução importadas com sucesso.' when v_review then 'Questão legada existente sem blocos: revise a resolução manualmente. Nenhum conteúdo foi sobrescrito.' else 'Questão existente preservada; resolução não foi sobrescrita.' end);
  insert into public.question_import_items(id,batch_id,import_key,source_id,question_id,result) values(v_item,p_batch,p_key,v_source,q.id,v_result);
  if not found then raise exception 'IMPORT_JOURNAL_INCOMPLETE' using errcode='55000'; end if;
  if v_new then
    insert into public.resolucoes(questao_id,tipo,texto,url_imagem,ordem,import_item_id,import_block_index)
      select q.id,x.tipo,x.texto,x.url_imagem,x.ordem,v_item,n::integer from jsonb_array_elements(p_blocks) with ordinality e(block,n)
        cross join lateral jsonb_populate_record(null::public.resolucoes,e.block) x;
    get diagnostics v_blocks=row_count;
    if v_blocks<>jsonb_array_length(p_blocks) then raise exception 'IMPORT_BLOCKS_INCOMPLETE'; end if;
  end if;
  -- Conservative preservation, including legacy duplicates and later manual edits.
  update public.question_import_assets set state='retained' where batch_id=p_batch and slot_row_id in(select id from public.question_import_image_slots where batch_id=p_batch and import_key=p_key and status='ready') and state='ready';
  if b.lease_until<=clock_timestamp() then raise exception 'IMPORT_LEASE_LOST' using errcode='40001'; end if;
  update public.question_import_batches set lease_until=clock_timestamp()+interval '60 seconds',revision=revision+1,updated_at=clock_timestamp(),last_error=null where id=p_batch;
  if not found then raise exception 'IMPORT_STATE_CHANGED' using errcode='40001'; end if;
  return v_result;
end $$;

revoke all on function public.vet_import_control(uuid,uuid,text,uuid,jsonb),public.vet_import_commit_item(uuid,uuid,uuid,text,jsonb,jsonb,integer),public.vet_import_file_referenced(text),public.vet_import_reference_text(jsonb),public.vet_import_mutation_guard(),public.vet_import_reference_guard() from public,anon,authenticated;
grant execute on function public.vet_import_control(uuid,uuid,text,uuid,jsonb),public.vet_import_commit_item(uuid,uuid,uuid,text,jsonb,jsonb,integer) to service_role;
notify pgrst,'reload schema';
commit;
