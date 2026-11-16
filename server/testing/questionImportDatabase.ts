import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Disposable PostgreSQL WASM engine. It serializes connections; tests using this
// helper verify actual SQL effects/rollback, NOT independent MVCC transactions.
export async function createImportDatabase(
  beforeRecovery?: (db: PGlite) => Promise<void>
) {
  const db = await PGlite.create();
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table public.profiles(id uuid primary key,role text);
    create function public.vet_resolve_access_role(p_actor uuid) returns jsonb language sql as $$select jsonb_build_object('role',role) from public.profiles where id=p_actor$$;
    create table public.questoes(id uuid primary key default gen_random_uuid(),codigo text,disciplina text,conteudo text,conteudos jsonb,assunto text,assuntos jsonb,assuntos_por_conteudo jsonb,banca text,ano int,dificuldade text,"instituição" text,publicada boolean,enunciado text,enunciado_pos_imagem text,formula text,url_imagem text,"A" text,"B" text,"C" text,"D" text,"E" text,a_url_imagem text,b_url_imagem text,c_url_imagem text,d_url_imagem text,e_url_imagem text,alternativa_correta text);
    create table public.resolucoes(id uuid primary key default gen_random_uuid(),questao_id uuid references public.questoes(id),tipo text not null,texto text,url_imagem text,ordem integer);
  `);
  for (const file of [
    "202607140001_question_batch_import_metadata.sql",
    "202609210001_question_import_batches_with_images.sql",
    "202610200001_question_import_recovery.sql",
  ]) {
    if (file.startsWith("20261020")) await beforeRecovery?.(db);
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  return db;
}
