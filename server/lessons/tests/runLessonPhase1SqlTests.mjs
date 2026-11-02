import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(pathToFileURL(resolve("tmp/referral-sql/node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let checks = 0;
const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
const ok = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; console.log(`PASS ${label}`); };
const ids = { admin: "00000000-0000-4000-8000-000000000001", active: "00000000-0000-4000-8000-000000000002", blocked: "00000000-0000-4000-8000-000000000003" };

async function asUser(id, sql) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
  return one(sql);
}

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table public.admin_users(user_id uuid primary key references auth.users(id), role text not null);
    create table public.profiles(id uuid primary key references auth.users(id), role text not null default 'student', ativo boolean not null default true);
    create table public.billing_subscriptions(id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), status text not null, current_period_end timestamptz);
    create function public.is_admin() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid() and role='admin') $$;
    create function public.is_admin_or_editor() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid() and role in ('admin','editor')) $$;
    create function public.user_has_active_subscription(target_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from billing_subscriptions where user_id=target_user_id and status in ('active','trialing') and (current_period_end is null or current_period_end > now())) $$;
    create table public.questoes(id uuid primary key default gen_random_uuid(), disciplina text, conteudo text, conteudos text[], assunto text, assuntos text[], assuntos_por_conteudo jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
    insert into auth.users(id,email) values('${ids.admin}','admin@example.test'),('${ids.active}','active@example.test'),('${ids.blocked}','blocked@example.test');
    insert into profiles(id,role,ativo) values('${ids.admin}','admin',true),('${ids.active}','student',true),('${ids.blocked}','student',true);
    insert into admin_users values('${ids.admin}','admin');
    insert into billing_subscriptions(user_id,status,current_period_end) values('${ids.active}','active',now()+interval '30 days');
    insert into questoes(disciplina,conteudo,assunto) values('Física','Cinemática','Movimento Uniforme');
  `);
  await db.exec(readFileSync("supabase/migrations/202609140001_lesson_engine_mvp.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/202609150001_lesson_engine_phase1.sql", "utf8"));
  const pilot = await one("select id,discipline from lessons where slug='bases-da-cinematica-experimental'");
  ok(pilot.discipline, "Física", "piloto usa grafia canônica disponível");
  await db.query("update lesson_drafts set schema_version=2,content_json=$2,updated_at=now()+interval '1 second' where lesson_id=$1", [pilot.id, JSON.stringify({ schemaVersion: 2, blocks: [{ id: "v2", type: "text", visible: true, content: "Conteúdo pago" }] })]);
  const draft = await one("select updated_at from lesson_drafts where lesson_id=$1", [pilot.id]);
  const published = await one("select * from lesson_publish($1,$2,$3,'schema v2')", [pilot.id, ids.admin, draft.updated_at]);
  ok(published.version_number, 1, "publicação aceita snapshot v2");
  await assert.rejects(db.query("select * from lesson_publish($1,$2,$3,'concorrente')", [pilot.id, ids.admin, new Date(0).toISOString()]), /draft changed/);
  checks++; console.log("PASS publicação concorrente com versão antiga é recusada");
  await db.query("update lesson_drafts set content_json=$2,updated_at=now()+interval '2 seconds' where lesson_id=$1", [pilot.id, JSON.stringify({ schemaVersion: 2, blocks: [{ id: "v2-atual", type: "text", visible: true, content: "Conteúdo atual" }] })]);
  const secondDraft = await one("select updated_at from lesson_drafts where lesson_id=$1", [pilot.id]);
  ok((await one("select * from lesson_publish($1,$2,$3,'segunda versão')", [pilot.id, ids.admin, secondDraft.updated_at])).version_number, 2, "republicação preserva histórico v2");
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from lessons"), /permission denied/);
  checks++; console.log("PASS anônimo não lê aulas");
  ok((await asUser(ids.blocked, "select count(*)::int as n from lessons")).n, 0, "aluno sem assinatura não lê identidade");
  ok((await asUser(ids.blocked, "select count(*)::int as n from lesson_versions")).n, 0, "aluno sem assinatura não lê versão");
  ok((await asUser(ids.blocked, "select count(*)::int as n from lesson_drafts")).n, 0, "aluno não lê rascunho");
  ok((await asUser(ids.active, "select count(*)::int as n from lessons")).n, 1, "aluno ativo lê aula publicada");
  ok((await asUser(ids.active, "select count(*)::int as n from lesson_versions")).n, 1, "aluno ativo não lê histórico, somente versão atual");
  ok((await asUser(ids.active, "select content_json->'blocks'->0->>'content' as content from lesson_versions")).content, "Conteúdo atual", "aluno recebe o snapshot publicado atual");
  ok((await asUser(ids.admin, "select count(*)::int as n from lessons")).n, 1, "admin lê aula sem assinatura comum");
  ok((await asUser(ids.admin, "select count(*)::int as n from lesson_versions")).n, 2, "admin preserva acesso ao histórico completo");
  await db.exec("reset role");
  await db.query("update billing_subscriptions set current_period_end=now()-interval '1 second' where user_id=$1", [ids.active]);
  ok((await asUser(ids.active, "select count(*)::int as n from lessons")).n, 0, "perda de acesso bloqueia leitura imediatamente");
  console.log(`PASS ${checks} verificações fase 1 concluídas`);
} finally { await db.close(); }
