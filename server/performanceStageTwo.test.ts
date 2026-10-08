import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { browseQuestions, performanceRpc } from "./performanceStageTwo";
import {
  questionBrowseSchema,
  collectBrowsePages,
} from "../shared/questionBrowse";
import {
  getQuestionsWithoutResolution,
  summarizeAttempts,
  hasRenderableResolution,
} from "../shared/statistics";

let db: PGlite;
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rpc = vi.fn(async (name: string, args: Record<string, any> = {}) => {
  const params =
    name === "vet_browse_questions"
      ? [
          JSON.stringify(args.p_filters),
          args.p_page,
          args.p_size,
          args.p_admin,
          args.p_user,
        ]
      : [];
  const placeholders =
    name === "vet_browse_questions"
      ? "$1::jsonb,$2::int,$3::int,$4::boolean,$5::uuid"
      : "";
  const result = await db.query<{ result: unknown }>(
    `select public.${name}(${placeholders}) result`,
    params
  );
  return { data: result.rows[0].result, error: null };
});
beforeAll(async () => {
  db = await PGlite.create();
  const fixture = `create role anon; create role authenticated; create role service_role;
 create table profiles(id uuid primary key,nome text,email text,telefone text,role text,ativo boolean,created_at timestamptz,last_seen_at timestamptz);
 create table admin_users(id uuid primary key,role text);
 create table questoes(id uuid primary key,codigo text,disciplina text,diciplina text,conteudo text,conteudos text[],assunto text,assuntos text[],assuntos_por_conteudo jsonb,banca text,ano int,dificuldade text,"instituição" text,publicada boolean,created_at timestamptz,enunciado text,enunciado_pos_imagem text,alternativa_correta text,"A" text,url_imagem text,private_note text,is_public boolean,public_slug text,public_noindex boolean);
 create table resolucoes(id uuid primary key,questao_id uuid,tipo text,texto text,url_imagem text,ordem int,codigo_resolucao text,created_at timestamptz);
 create table user_question_attempts(id uuid primary key,user_id uuid,question_id uuid,is_correct boolean,answered_at timestamptz,attempt_number int);
 insert into profiles values('${id(1)}','Synthetic','fake@example.invalid',null,'student',true,'2026-01-01',null),('${id(2)}','No attempts',null,null,'student',true,'2026-01-01',null);
 insert into questoes(id,codigo,disciplina,conteudo,conteudos,assunto,assuntos,assuntos_por_conteudo,banca,ano,dificuldade,"instituição",publicada,created_at,enunciado,alternativa_correta,"A",private_note)
 select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Q-'||n,'Física','Dinâmica',array['Dinâmica','Cinemática'],'Forças',array['Forças','Velocidade'],'[{"conteudo":"Dinâmica","assuntos":["Forças"]},{"conteudo":"Cinemática","assuntos":["Velocidade"]}]','Exército',case when n>2485 then 2026 else 2025 end,'medio','ITA',true,'2026-01-01',repeat('enunciado ',400),'A','Opção','PRIVATE' from generate_series(1,2500) n;
 insert into resolucoes(id,questao_id,tipo,texto,url_imagem,created_at) select ('00000000-0000-4000-9000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'texto','Resposta',null,'2026-01-01' from generate_series(1,2490) n;
 insert into resolucoes values('${id(3000)}','${id(2491)}',' ImAgEm ',null,' image.png ',1,'R','2026-01-01'),('${id(3001)}','${id(2491)}','texto','Outro bloco',null,2,'R','2026-01-01'),('${id(3002)}','${id(2492)}','imagem','texto não torna imagem válida','  ',1,'R','2026-01-01'),('${id(3003)}','${id(2493)}','latex',E'\\t\\n ',null,1,'R','2026-01-01'),('${id(3004)}','${id(2494)}',null,null,'url isolada',1,'R','2026-01-01');
 insert into user_question_attempts values('${id(4000)}','${id(1)}','${id(2499)}',true,'2026-01-01',1),('${id(4001)}','${id(1)}','${id(2499)}',false,'2026-02-01',2),('${id(4002)}','${id(1)}','${id(2498)}',true,'2026-02-01',1),('${id(4003)}','${id(1)}','${id(2498)}',true,'2026-02-01',2),('${id(4004)}','${id(2)}','${id(2497)}',false,'2026-02-01',1);
 update questoes set publicada=false where id='${id(10)}';
 `;
  for (const statement of fixture.split(";").filter(value => value.trim())) {
    await db.exec(statement);
  }
  await db.exec(
    readFileSync(
      "supabase/migrations/202610080001_performance_stage_two.sql",
      "utf8"
    )
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
const browse = (
  filters: object = {},
  page = 0,
  size = 20,
  admin = false,
  user: string | null = id(1)
) =>
  browseQuestions(
    { rpc },
    questionBrowseSchema.parse({ filters, page, pageSize: size }),
    admin,
    user
  );

describe("Etapa 2: PostgreSQL local sintético (não produção)", () => {
  it("dashboard usa um RPC e preserva definição renderizável acima do limite Supabase", async () => {
    rpc.mockClear();
    const result: any = await performanceRpc({ rpc }, "vet_admin_dashboard");
    const qs = (
      await db.query<{ id: string }>("select id from questoes order by id")
    ).rows;
    const blocks: any[] = (await db.query("select * from resolucoes")).rows;
    expect(result.stats.totalQuestions).toBe(2500);
    expect(result.stats.totalQuestionsWithoutResolution).toBe(
      getQuestionsWithoutResolution(qs, blocks).length
    );
    expect(
      result.latestQuestionsWithoutResolution.map((r: any) => r.id)
    ).toEqual(
      getQuestionsWithoutResolution(qs, blocks)
        .slice(0, 5)
        .map(r => r.id)
    );
    expect(result.stats.totalResolutionImages).toBe(3); // non-null, including whitespace and non-image
    expect(result.latestQuestions).toHaveLength(5);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("SQL e JS são equivalentes para espaços Unicode, nulos, texto e imagem", async () => {
    const blocks = [
      { tipo: "imagem", texto: "ignored", url_imagem: " " },
      { tipo: " IMAGEM ", url_imagem: " ok " },
      { tipo: "latex", texto: "\u00a0\t\n" },
      { tipo: null, texto: " x " },
      { tipo: "texto", texto: null },
    ];
    for (const b of blocks) {
      const r = await db.query<{ valid: boolean }>(
        "select vet_s2_renderable($1,$2,$3) valid",
        [b.tipo, b.texto ?? null, b.url_imagem ?? null]
      );
      expect(r.rows[0].valid).toBe(hasRenderableResolution(b));
    }
  });
  it("agrega todo histórico, não confunde tentativas com acertos únicos e preserva datas desconhecidas", async () => {
    const result: any[] = await performanceRpc(
      { rpc },
      "vet_admin_student_statistics"
    );
    const attempts: any[] = (
      await db.query("select * from user_question_attempts where user_id=$1", [
        id(1),
      ])
    ).rows;
    const old = summarizeAttempts(attempts),
      row = result.find(r => r.id === id(1));
    expect(row).toMatchObject({
      attempts_count: old.totalAttempts,
      correct_count: old.correctAttempts,
      distinct_answered: old.distinctAnswered,
      distinct_correct: old.distinctCorrect,
      accuracy: old.accuracy,
      last_seen_at: null,
    });
    await db.exec(`insert into profiles(id) values('${id(3)}')`);
    expect(
      (
        await performanceRpc<any[]>({ rpc }, "vet_admin_student_statistics")
      ).find(r => r.id === id(3))
    ).toMatchObject({
      attempts_count: 0,
      correct_count: 0,
      last_answered_at: null,
      last_seen_at: null,
    });
  });
  it("2.500 registros: filtra 15 antes de retornar a página, sem varredura HTTP", async () => {
    rpc.mockClear();
    const r = await browse({
      years: [2026],
      institutions: ["itá"],
      subjects: ["fisica"],
      topics: ["dinamica"],
      subtopics: ["forcas"],
      difficulties: ["medio"],
    });
    expect(r.total).toBe(15);
    expect(r.rows).toHaveLength(15);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(r.rows[0].enunciado.length).toBeLessThanOrEqual(90);
    expect(JSON.stringify(r)).not.toMatch(
      /alternativa_correta|PRIVATE|Resposta/
    );
  });
  it("ordenação empatada por ID, múltiplas páginas, vazio e limite validado", async () => {
    const a = await browse({}, 0),
      b = await browse({}, 1);
    expect(a.rows[0].id).toBe(id(1));
    expect(b.rows[0].id).toBe(id(22));
    expect(a.total).toBe(2499);
    expect(new Set([...a.rows, ...b.rows].map(r => r.id)).size).toBe(40);
    expect((await browse({ years: [2199] })).total).toBe(0);
    expect(() => questionBrowseSchema.parse({ pageSize: 101 })).toThrow();
  });
  it("assuntos agrupados e múltiplos conteúdos respeitam contexto", async () => {
    expect(
      (await browse({ topics: ["Cinemática"], subtopics: ["Forças"] })).total
    ).toBe(0);
    expect(
      (await browse({ topics: ["Cinemática"], subtopics: ["Velocidade"] }))
        .total
    ).toBe(2499);
    expect(
      (
        await browse({
          topics: ["Dinâmica", "Cinemática"],
          subtopics: ["Forças"],
        })
      ).total
    ).toBe(2499);
  });
  it("prática usa tentativa mais recente, desempata e isola outro aluno", async () => {
    expect(
      (await browse({ practiceStatus: "wrong" })).rows.map(r => r.id)
    ).toEqual([id(2499)]);
    expect(
      (await browse({ practiceStatus: "correct" })).rows.map(r => r.id)
    ).toEqual([id(2498)]);
    expect((await browse({ practiceStatus: "answered" })).total).toBe(2);
    expect((await browse({ practiceStatus: "unanswered" })).total).toBe(2497);
    expect(
      (await browse({ practiceStatus: "unanswered" }, 0, 20, false, null)).total
    ).toBe(0);
  });
  it("facetas e estatísticas não representam só a página", async () => {
    const r = await browse({ years: [2026] }, 0, 2);
    expect(r.rows).toHaveLength(2);
    expect(r.total).toBe(15);
    expect(r.stats.total).toBe(2499);
    expect(r.facets.years).toEqual(["2026", "2025"]);
    expect(r.stats.subjects["física"]).toBe(2499);
    expect(r.stats.filteredDifficulties.medio).toBe(15);
  });
  it("publicação e resumo de resolução administrativos ficam restritos ao caminho admin", async () => {
    const r = await browse({ publication: "unpublished" }, 0, 20, true);
    expect(r.total).toBe(1);
    expect(r.rows[0].id).toBe(id(10));
    expect(r.resolutionSummaries[0].totalBlocks).toBe(1);
    expect(
      (await browse({ search: "Q-10" }, 0, 100)).rows.every(
        r => r.id !== id(10)
      )
    ).toBe(true);
  });
  it("sugestões compactas preservam simples, arrays, grupos e grafia sem mudar registros", async () => {
    const r: any[] = await performanceRpc({ rpc }, "vet_question_suggestions");
    expect(r.length).toBeLessThan(10);
    expect(r[0].conteudos).toContain("Dinâmica");
    expect(r[0].assuntos).toContain("Velocidade");
    expect(r[0].assuntos_por_conteudo).toHaveLength(2);
    expect(
      (await db.query<{ v: string }>("select conteudo v from questoes limit 1"))
        .rows[0].v
    ).toBe("Dinâmica");
  });
  it("nenhuma função administrativa é executável por anon/authenticated", async () => {
    for (const role of ["anon", "authenticated"])
      for (const fn of [
        "vet_admin_dashboard()",
        "vet_admin_student_statistics()",
        "vet_question_suggestions()",
        "vet_browse_questions(jsonb,integer,integer,boolean,uuid)",
        "vet_question_details(uuid[])",
      ]) {
        const r = await db.query<{ allowed: boolean }>(
          "select has_function_privilege($1,$2,'execute') allowed",
          [role, fn]
        );
        expect(r.rows[0].allowed).toBe(false);
      }
  });
  it("detalhes completos preservam alternativas, mas excluem gabarito, resolução e questões privadas", async () => {
    const r = await db.query<{ result: any[] }>(
      "select vet_question_details($1::uuid[]) result",
      [[id(1), id(10)]]
    );
    expect(r.rows[0].result).toHaveLength(1);
    expect(r.rows[0].result[0]).toMatchObject({ id: id(1), A: "Opção" });
    expect(r.rows[0].result[0].enunciado.length).toBeGreaterThan(90);
    expect(JSON.stringify(r.rows[0].result)).not.toMatch(
      /alternativa_correta|PRIVATE|Resposta/
    );
  });
  it("legado simples, arrays vazios e JSONL agrupado inválido mantêm fallback e busca por campo", async () => {
    await db.exec(
      `update questoes set conteudos='{}',assuntos='{}',assuntos_por_conteudo='[{"conteudo":"","assuntos":[]}]',enunciado='Fragmento Singular' where id='${id(2500)}'`
    );
    const r = await browse({
      search: "Fragmento Singular",
      topics: ["dinamica"],
      subtopics: ["forcas"],
    });
    expect(r.total).toBe(1);
    expect(r.rows[0].id).toBe(id(2500));
    expect((await browse({ search: "singular exército" })).total).toBe(0);
    expect((await browse({ search: id(2500) })).total).toBe(1);
    expect((await browse({ search: "Médio", years: [2026] })).total).toBe(15);
  });
  it("seleção completa detecta mudanças e não entra em loop com páginas repetidas", async () => {
    await expect(
      collectBrowsePages(async page => ({
        rows: [{ id: "a" }],
        total: page ? 3 : 2,
      }))
    ).rejects.toThrow("lista mudou");
    await expect(
      collectBrowsePages(async () => ({ rows: [{ id: "a" }], total: 2 }))
    ).rejects.toThrow("lista mudou");
  });
  it("plano local usa índice de resoluções para busca por questão", async () => {
    await db.exec("analyze resolucoes");
    const plan = await db.query(
      "explain (format json) select 1 from resolucoes where questao_id=$1",
      [id(1)]
    );
    expect(JSON.stringify(plan.rows)).toContain(
      "vet_s2_resolution_question_idx"
    );
  });
  it("migration ausente/falha não vira zeros ou lista vazia; nova tentativa recupera", async () => {
    const failing = {
      rpc: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } })
        .mockResolvedValueOnce({ data: [], error: null }),
    };
    await expect(
      performanceRpc(failing, "vet_admin_student_statistics")
    ).rejects.toThrow("migration");
    expect(
      await performanceRpc(failing, "vet_admin_student_statistics")
    ).toEqual([]);
  });
  it("coleta de quiz não fica limitada à primeira página e não duplica IDs", async () => {
    const rows = await collectBrowsePages(page =>
      browse({ years: [2026] }, page, 4)
    );
    expect(rows).toHaveLength(15);
    expect(new Set(rows.map(r => r.id)).size).toBe(15);
  });
  it("mede consultas e bytes antes/depois sem alegar tempo de produção", async () => {
    const t = performance.now();
    const before = await db.query(
      "select id,codigo,enunciado,banca,ano,created_at from questoes"
    );
    const blocks = await db.query(
      "select id,questao_id,tipo,texto,url_imagem from resolucoes"
    );
    const beforeMs = performance.now() - t;
    const next = performance.now();
    const after = await performanceRpc({ rpc }, "vet_admin_dashboard");
    console.info({
      benchmark: "local-pglite-dashboard",
      before: {
        queries:
          Math.ceil(before.rows.length / 500) +
          Math.ceil(blocks.rows.length / 500) +
          9,
        rows: before.rows.length + blocks.rows.length,
        bytes: Buffer.byteLength(JSON.stringify([before.rows, blocks.rows])),
        ms: Math.round(beforeMs),
      },
      after: {
        queries: 1,
        rows: 20,
        bytes: Buffer.byteLength(JSON.stringify(after)),
        ms: Math.round(performance.now() - next),
      },
    });
  });
  it("rollback e reaplicação são testados localmente", async () => {
    await db.exec(
      readFileSync(
        "supabase/rollbacks/202610080001_performance_stage_two.rollback.sql",
        "utf8"
      )
    );
    expect(
      (
        await db.query<{ fn: unknown }>(
          "select to_regprocedure('vet_admin_dashboard()') fn"
        )
      ).rows[0].fn
    ).toBeNull();
    expect(
      (await db.query<{ n: number }>("select count(*)::int n from questoes"))
        .rows[0].n
    ).toBe(2500);
    await db.exec(
      readFileSync(
        "supabase/migrations/202610080001_performance_stage_two.sql",
        "utf8"
      )
    );
    expect((await browse({ years: [2026] })).total).toBe(15);
  });
});
