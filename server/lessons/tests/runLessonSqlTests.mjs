import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(pathToFileURL(resolve("tmp/referral-sql/node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let checks = 0;
const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
const ok = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; console.log(`PASS ${label}`); };

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, created_at timestamptz default now());
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    create table public.admin_users(user_id uuid primary key references auth.users(id), role text not null);
    create function public.is_admin() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid() and role='admin') $$;
    create table public.questoes(id uuid primary key default gen_random_uuid(), disciplina text, conteudo text, conteudos text[], assunto text, assuntos text[], assuntos_por_conteudo jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
    insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','admin@example.test');
    insert into admin_users values('00000000-0000-4000-8000-000000000001','admin');
  `);
  await db.exec(readFileSync("supabase/migrations/202609140001_lesson_engine_mvp.sql", "utf8"));
  const pilot = await one("select id,current_published_version_id from lessons where slug='bases-da-cinematica-experimental'");
  ok(Boolean(pilot.id) && pilot.current_published_version_id === null, true, "aula piloto nasce somente em rascunho");
  const draft = await one("select updated_at from lesson_drafts where lesson_id=$1", [pilot.id]);
  ok((await one("select content_json->'blocks'->1->>'latex' as latex from lesson_drafts where lesson_id=$1", [pilot.id])).latex, "v_m = \\frac{\\Delta s}{\\Delta t}", "LaTeX piloto preserva uma barra por comando");
  const published1 = await one("select * from lesson_publish($1,$2,$3,'primeira versão')", [pilot.id, "00000000-0000-4000-8000-000000000001", draft.updated_at]);
  ok(published1.version_number, 1, "publicação cria versão 1");
  await assert.rejects(db.query("update lesson_versions set version_number=9 where id=$1", [published1.version_id]), /immutable/);
  checks++; console.log("PASS versão publicada é imutável");
  await db.query("update lesson_drafts set content_json=$2,updated_at=now()+interval '1 second' where lesson_id=$1", [pilot.id, JSON.stringify({ schemaVersion: 1, blocks: [{ id: "v2", type: "text", visible: true, content: "Versão 2" }] })]);
  const draft2 = await one("select updated_at from lesson_drafts where lesson_id=$1", [pilot.id]);
  const published2 = await one("select * from lesson_publish($1,$2,$3,'segunda versão')", [pilot.id, "00000000-0000-4000-8000-000000000001", draft2.updated_at]);
  ok(published2.version_number, 2, "nova publicação preserva histórico numerado");
  await db.exec("set role authenticated");
  ok((await one("select count(*)::int as n from lessons")).n, 1, "aluno autenticado lê identidade publicada");
  ok((await one("select count(*)::int as n from lesson_versions")).n, 1, "aluno lê somente a versão publicada atual");
  ok((await one("select count(*)::int as n from lesson_drafts")).n, 0, "aluno não lê rascunho");
  await assert.rejects(db.query("update lessons set title='alterada pelo cliente' where id=$1", [pilot.id]), /permission denied/);
  checks++; console.log("PASS escrita direta autenticada é bloqueada");
  await db.exec("reset role");
  await db.query("select lesson_restore_draft($1,$2,$3)", [pilot.id, published1.version_id, "00000000-0000-4000-8000-000000000001"]);
  ok((await one("select lesson_drafts.restored_from_version_id=lesson_versions.id as restored from lesson_drafts cross join lesson_versions where lesson_drafts.lesson_id=$1 and lesson_versions.id=$2", [pilot.id, published1.version_id])).restored, true, "restauração copia versão para rascunho");
  ok((await one("select count(*)::int as n from lesson_versions where lesson_id=$1", [pilot.id])).n, 2, "restauração não destrói histórico");
  await db.exec(readFileSync("supabase/rollbacks/202609140001_lesson_engine_mvp.sql", "utf8"));
  ok((await one("select to_regclass('public.lessons') is null as removed")).removed, true, "rollback remove as tabelas do motor");
  console.log(`PASS ${checks} verificações concluídas`);
} finally {
  await db.close();
}
