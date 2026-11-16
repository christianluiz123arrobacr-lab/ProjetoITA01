-- PSQL ONLY. A new, empty, disposable LOCAL database, never production.
\set ON_ERROR_STOP on
do $$begin
  if current_database()<>'vet_import_review' or coalesce(host(inet_server_addr()),'127.0.0.1') not in ('127.0.0.1','::1') then
    raise exception 'Only the disposable local vet_import_review database is allowed';
  end if;
  if to_regclass('public.questoes') is not null then raise exception 'Database must be empty'; end if;
end$$;
do $$begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end$$;
create schema auth;
create table auth.users(id uuid primary key);
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table public.profiles(id uuid primary key,role text);
create function public.vet_resolve_access_role(p_actor uuid) returns jsonb language sql as $$select jsonb_build_object('role',role) from public.profiles where id=p_actor$$;
create table public.questoes(id uuid primary key default gen_random_uuid(),codigo text,disciplina text,conteudo text,conteudos jsonb,assunto text,assuntos jsonb,assuntos_por_conteudo jsonb,banca text,ano int,dificuldade text,"instituição" text,publicada boolean,enunciado text,enunciado_pos_imagem text,formula text,url_imagem text,"A" text,"B" text,"C" text,"D" text,"E" text,a_url_imagem text,b_url_imagem text,c_url_imagem text,d_url_imagem text,e_url_imagem text,alternativa_correta text);
create table public.resolucoes(id uuid primary key default gen_random_uuid(),questao_id uuid references public.questoes(id),tipo text not null,texto text,url_imagem text,ordem integer);
\ir ../migrations/202607140001_question_batch_import_metadata.sql
\ir ../migrations/202609210001_question_import_batches_with_images.sql
\ir ../migrations/202610200001_question_import_recovery.sql
insert into auth.users values('00000000-0000-4000-8000-000000000001');
insert into profiles values('00000000-0000-4000-8000-000000000001','editor');
-- Local-only fixture, NOT part of the application migration.
create function public.vet_test_batch(p_id uuid) returns jsonb language sql as $$
  select vet_import_control(p_id,'00000000-0000-4000-8000-000000000001','create',null,
    jsonb_build_object('format','questoes-v2','payload',jsonb_build_object('questions',jsonb_build_array(
      jsonb_build_object('chave_importacao','q1','id_importacao',p_id::text||'-source'))),'summary','{}'::jsonb,
      'slots',jsonb_build_array(jsonb_build_object('import_key','q1','slot_id','fig','required',false,'location','enunciado','alt_text','Figura'))));
$$;
