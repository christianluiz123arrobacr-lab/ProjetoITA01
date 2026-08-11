-- Align canonical attempt question identifiers with public.questoes.id.
-- Safe to rerun: UUID columns are left unchanged and no historical row is rewritten.

do $$
declare
  current_data_type text;
  invalid_question_id text;
begin
  -- Prevent a concurrent writer from adding an unchecked text value between
  -- validation and conversion. The migration transaction releases this lock.
  execute 'lock table public.user_question_attempts in access exclusive mode';

  select columns.data_type
    into current_data_type
  from information_schema.columns as columns
  where columns.table_schema = 'public'
    and columns.table_name = 'user_question_attempts'
    and columns.column_name = 'question_id';

  if current_data_type is null then
    raise exception 'Migration aborted: public.user_question_attempts.question_id does not exist';
  end if;

  if current_data_type = 'uuid' then
    return;
  end if;

  if current_data_type <> 'text' then
    raise exception
      'Migration aborted: public.user_question_attempts.question_id has unsupported type % (expected text or uuid)',
      current_data_type;
  end if;

  select attempts.question_id
    into invalid_question_id
  from public.user_question_attempts as attempts
  where attempts.question_id is not null
    and attempts.question_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  limit 1;

  if invalid_question_id is not null then
    raise exception
      'Migration aborted: user_question_attempts.question_id contains a non-UUID value: %',
      invalid_question_id;
  end if;

  alter table public.user_question_attempts
    alter column question_id type uuid
    using question_id::uuid;
end
$$;

create index if not exists idx_user_question_attempts_question_id
  on public.user_question_attempts(question_id);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns as columns
    where columns.table_schema = 'public'
      and columns.table_name = 'user_question_attempts'
      and columns.column_name = 'question_id'
      and columns.data_type = 'uuid'
  ) then
    raise exception 'Migration failed: public.user_question_attempts.question_id is not uuid';
  end if;
end
$$;
