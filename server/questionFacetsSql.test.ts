import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  normalizeQuestionImagePayload,
  getStatementImages,
} from "../shared/questionImages";
import { applyReadyImageSlots } from "./questions/questionImportImages";
import {
  buildQuestionInsertPayload,
  parseQuestionImportPayload,
} from "../shared/questionImportSchema";

let db: PGlite;
const migration = readFileSync(
  "supabase/migrations/202610140001_question_filter_facets.sql",
  "utf8"
);
const rollback = readFileSync(
  "supabase/rollbacks/202610140001_question_filter_facets.rollback.sql",
  "utf8"
);
const user = "00000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table profiles(id uuid,nome text,email text,telefone text,role text,ativo boolean,created_at timestamptz,last_seen_at timestamptz);
    create table admin_users(id uuid);
    create table questoes(id uuid primary key,codigo text,disciplina text,diciplina text,conteudo text,conteudos jsonb,assunto text,assuntos jsonb,assuntos_por_conteudo jsonb,banca text,ano int,dificuldade text,"instituição" text,publicada boolean,created_at timestamptz,enunciado text,enunciado_pos_imagem text,alternativa_correta text,"A" text,url_imagem text,image_metadata jsonb);
    create table resolucoes(id uuid,questao_id uuid,tipo text,texto text,url_imagem text,ordem int,codigo_resolucao text,created_at timestamptz);
    create table user_question_attempts(id uuid,user_id uuid,question_id uuid,is_correct boolean,answered_at timestamptz,attempt_number int);
    insert into questoes(id,codigo,disciplina,conteudo,conteudos,assunto,assuntos,assuntos_por_conteudo,banca,ano,dificuldade,"instituição",publicada,created_at,enunciado,alternativa_correta)
    select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Q-'||n,'Física','Dinâmica',case when n%2=0 then '["Dinâmica","Cinemática"]'::jsonb end,'Forças',case when n%2=0 then '["Forças"]'::jsonb end,'[{"conteudo":"Dinâmica","assuntos":["Forças"]},{"conteudo":"Cinemática","assuntos":["Velocidade"]}]',case when n>2485 then 'Exército' else 'ITA' end,case when n>2485 then 2023 else 2022 end,'medio','IME',true,'2026-01-01',repeat('Enunciado privado ',200),'a' from generate_series(1,2500) n;
    insert into questoes(id,publicada,"instituição",enunciado) values('10000000-0000-4000-8000-000000000001',false,'Privada','Não retornar');
  `);
  await db.exec(
    readFileSync(
      "supabase/migrations/202610060001_optimize_question_pdf_export.sql",
      "utf8"
    )
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610080001_performance_stage_two.sql",
      "utf8"
    )
  );
  await db.exec(migration);
}, 30000);
afterAll(async () => {
  await db?.close();
});
const facets = async (filters = {}) =>
  (
    await db.query<{ result: any }>(
      "select vet_question_filter_facets($1::jsonb) result",
      [JSON.stringify(filters)]
    )
  ).rows[0].result;

describe("facetas compactas, escopo do PDF e imagens no PostgreSQL local", () => {
  it("retorna somente opções públicas, inclusive formatos legado e JSONL, em um banco de 2500", async () => {
    const data = await facets();
    expect(Object.keys(data).sort()).toEqual([
      "difficulties",
      "institutions",
      "subjects",
      "subtopics",
      "topics",
      "years",
    ]);
    expect(data.institutions).toEqual(["IME"]);
    expect(data.years).toEqual(["2023", "2022"]);
    expect(data.topics).toEqual(["cinemática", "dinâmica"]);
    expect(JSON.stringify(data)).not.toMatch(
      /enunciado|Q-1|alternativa|resolucao|rows|Privada/i
    );
    expect(Buffer.byteLength(JSON.stringify(data))).toBeLessThan(1024);
  });
  it("filtra as opções sem retornar questões e respeita relação conteúdo/assunto", async () => {
    const data = await facets({
      institutions: ["IME"],
      years: [2023],
      subjects: ["fisica"],
      topics: ["Cinemática"],
      exams: ["Exército"],
    });
    expect(data.subtopics).toEqual(["velocidade"]);
    expect((await facets({ institutions: ["ausente"] })).years).toEqual([]);
  });
  it("não concede execução de RPC de opções a anon/authenticated", async () => {
    for (const role of ["anon", "authenticated"]) {
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select has_function_privilege($1,'vet_question_filter_facets(jsonb)','EXECUTE') allowed",
            [role]
          )
        ).rows[0].allowed
      ).toBe(false);
    }
  });
  it("o PDF preserva banca e intervalo aplicados, sem perder limite e truncamento", async () => {
    const query = async (filters: object) =>
      (
        await db.query<{ result: any }>(
          "select export_question_pdf_data($1,$2::jsonb) result",
          [user, JSON.stringify(filters)]
        )
      ).rows[0].result;
    const small = await query({
      exams: ["Exército"],
      yearFrom: 2023,
      yearTo: 2025,
    });
    expect(small.rows).toHaveLength(15);
    expect(small.totalMatched).toBe(15);
    expect(small.truncated).toBe(false);
    const none = await query({
      exams: ["Exército"],
      yearFrom: 2024,
      yearTo: 2025,
    });
    expect(none.rows).toEqual([]);
    const large = await query({ years: [2022] });
    expect(large.rows).toHaveLength(120);
    expect(large.truncated).toBe(true);
  });
  it("finaliza lote, grava o JSONB, relê e salva todas as imagens sem perda", async () => {
    const parsed = parseQuestionImportPayload({
      formato: "questoes-v2",
      questoes: [
        {
          chave_importacao: "dupla",
          enunciado: "Antes",
          enunciado_pos_imagem: "Depois",
          disciplina: "Física",
          conteudo: "Dinâmica",
          assunto: "Forças",
          resolucao: "Resolução",
          dificuldade: "medio",
          alternativas: [
            { letra: "A", texto: "a" },
            { letra: "B", texto: "b" },
            { letra: "C", texto: "c" },
          ],
          resposta: "A",
          imagens: [
            {
              slot_id: "um",
              local: "enunciado",
              obrigatoria: true,
              texto_alternativo: "Primeira",
              legenda: "Legenda um",
            },
            {
              slot_id: "dois",
              local: "enunciado",
              obrigatoria: true,
              texto_alternativo: "Segunda",
              legenda: "Legenda dois",
            },
          ],
        },
      ],
    });
    expect(parsed.summary.invalidas).toBe(0);
    const initial = parsed.questoes[0].item;
    const hydrated = applyReadyImageSlots(
      initial,
      [...initial.imagens]
        .reverse()
        .map(image => ({
          ...image,
          import_key: "dupla",
          public_url: `https://storage.test/${image.slot_id}.png`,
        }))
    );
    const payload = normalizeQuestionImagePayload(
      buildQuestionInsertPayload(hydrated, "batch", "actor")
    );
    await db.query(
      "update questoes set url_imagem=$1,image_metadata=$2::jsonb where id=$3",
      [payload.url_imagem, JSON.stringify(payload.image_metadata), user]
    );
    const reloaded = (
      await db.query<any>(
        "select url_imagem,image_metadata from questoes where id=$1",
        [user]
      )
    ).rows[0];
    expect(
      getStatementImages(reloaded.image_metadata, reloaded.url_imagem).map(
        image => image.texto_alternativo
      )
    ).toEqual(["Primeira", "Segunda"]);
    const savedAgain = normalizeQuestionImagePayload(reloaded);
    expect(savedAgain.image_metadata).toEqual(payload.image_metadata);
    const publicDetails: any = (
      await db.query<any>(
        "select vet_question_details(array[$1::uuid]) result",
        [user]
      )
    ).rows[0].result[0];
    expect(publicDetails.image_metadata).toEqual(payload.image_metadata);
    expect(publicDetails).not.toHaveProperty("alternativa_correta");
  });
  it("rollback e reaplicação locais preservam todos os registros e metadados", async () => {
    await db.exec(rollback);
    expect(
      (
        await db.query<any>(
          "select to_regprocedure('vet_question_filter_facets(jsonb)') fn"
        )
      ).rows[0].fn
    ).toBeNull();
    expect(
      (await db.query<any>("select count(*)::int n from questoes")).rows[0].n
    ).toBe(2501);
    await db.exec(migration);
    expect((await facets()).institutions).toEqual(["IME"]);
    expect(
      (
        await db.query<any>(
          "select jsonb_array_length(image_metadata) n from questoes where id=$1",
          [user]
        )
      ).rows[0].n
    ).toBe(2);
  });
});
