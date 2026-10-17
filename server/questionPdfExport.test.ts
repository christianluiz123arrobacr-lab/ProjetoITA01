import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  questionPdfFiltersSchema,
  questionRowMatchesPdfFilters,
  normalizePdfFilterText,
} from "../shared/questionPdf";
import { selectQuestionPdfData } from "./questionPdfExport";
import {
  questionPdfFailureMessage,
  logPdfStage,
} from "../client/src/lib/questionPdfDiagnostics";

const transport = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("../client/src/lib/trpcClient", () => ({
  trpcClient: { questions: { exportPdfData: transport } },
}));
import { exportQuestionsForPdf } from "../client/src/services/questions.service";
import { generateQuestionPdf } from "../client/src/lib/questionPdfGenerator";

// Standalone local PostgreSQL/WASM, dev-only. No credentials or remote connection.
let db: any;
const userId = "00000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const small = questionPdfFiltersSchema.parse({
  institutions: ["ITA"],
  subjects: ["Física"],
  years: [2026],
  topics: ["Dinâmica"],
  subtopics: ["Forças"],
  difficulties: ["medio"],
});
const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => {
  const result = await db.query(
    "select public.export_question_pdf_data($1::uuid, $2::jsonb) as result",
    [args.p_user_id, JSON.stringify(args.p_filters)]
  );
  return { data: result.rows[0].result, error: null };
});
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table public.questoes (
      id uuid primary key, created_at timestamptz, publicada boolean, ano integer,
      "instituição" text, disciplina text, diciplina text, dificuldade text,
      codigo text, banca text, enunciado text, enunciado_pos_imagem text,
      conteudo text, assunto text, conteudos text[], assuntos text[], assuntos_por_conteudo jsonb,
      "A" text, "B" text, alternativa_correta text, url_imagem text, image_metadata jsonb,
      a_url_imagem text, options jsonb, resolucoes jsonb, private_note text
    );
    create table public.user_question_attempts (
      id uuid primary key, user_id uuid, question_id uuid, is_correct boolean,
      answered_at timestamptz, attempt_number integer
    );
    insert into public.questoes (id,created_at,publicada,ano,"instituição",disciplina,dificuldade,codigo,banca,
      enunciado,conteudo,assunto,conteudos,assuntos,"A","B",alternativa_correta,resolucoes,private_note)
    select ('00000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
      '2026-01-01'::timestamptz, true, case when i > 3985 then 2026 else 2025 end,
      case when i > 3985 then ' ITÁ ' else 'IME' end,
      case when i > 3985 then 'Física' else 'matematica' end, 'medio', 'Q-' || i, 'Exército',
      'Calcule a força 100%_ $F=ma$', 'Dinâmica', 'Forças',
      array['Dinâmica'], array['Forças'], '2 N', '3 N', 'A', '[{"texto":"NOT FOR PDF"}]', 'PRIVATE'
    from generate_series(1,4000) i;
    update public.questoes set conteudos=null, assuntos=null where id='${id(3986)}';
    update public.questoes set conteudo='valor escalar antigo', assunto='legado',
      assuntos_por_conteudo='{"Dinâmica":["Forças"]}' where id='${id(3987)}';
    update public.questoes set disciplina=null,diciplina=' Física ',conteudos='{}',assuntos='{}'
      where id='${id(3988)}';
    insert into public.questoes(id,publicada,ano,"instituição",disciplina,dificuldade,enunciado)
      values ('${id(5000)}',false,2026,'ITA','Física','medio','unpublished');
    insert into public.user_question_attempts values
      ('${id(6000)}','${userId}','${id(3986)}',false,'2026-01-01',1),
      ('${id(6001)}','${userId}','${id(3986)}',true,'2026-02-01',2),
      ('${id(6002)}','${userId}','${id(3987)}',true,'2026-01-01',1),
      ('${id(6003)}','${userId}','${id(3987)}',false,'2026-02-01',2),
      ('${id(6004)}','${id(2)}','${id(3988)}',false,'2026-03-01',1);
  `);
  await db.exec(
    readFileSync(
      "supabase/migrations/202610060001_optimize_question_pdf_export.sql",
      "utf8"
    )
  );
}, 30_000);
afterAll(async () => {
  await db?.close();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  rpc.mockClear();
  transport.mutate.mockReset();
});

describe("seleção PDF no banco, sem paginação HTTP", () => {
  it("filtra 4.000 registros para 15 em uma única RPC e não retorna resoluções", async () => {
    const result = await selectQuestionPdfData({ rpc }, userId, small);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe("export_question_pdf_data");
    expect(result.rows).toHaveLength(15);
    expect(result.totalMatched).toBe(15);
    expect(result.truncated).toBe(false);
    expect(result.searchDurationMs).toBeLessThan(3000);
    expect(result.rows[0].id).toBe(id(3986));
    for (const row of result.rows) {
      expect(row).not.toHaveProperty("resolucoes");
      expect(row).not.toHaveProperty("private_note");
      expect(row).toHaveProperty("A", "2 N");
    }
  });
  it.each([
    small,
    questionPdfFiltersSchema.parse({ search: "100%_", subjects: ["fisica"] }),
    questionPdfFiltersSchema.parse({ search: "exercito ita", years: [2026] }),
    questionPdfFiltersSchema.parse({ topics: ["valor escalar antigo"] }),
    questionPdfFiltersSchema.parse({
      institutions: ["IME"],
      difficulties: ["médio"],
      years: [2025],
    }),
    questionPdfFiltersSchema.parse({
      subjects: ["FÍSICA"],
      subtopics: ["forcas"],
      search: "dinamica",
    }),
    questionPdfFiltersSchema.parse({ subjects: ["quimica"] }),
  ])(
    "preserva filtros combinados, escalares antigos e arrays JSONL: %j",
    async filters => {
      const source = (
        await db.query(
          "select * from public.questoes where publicada=true order by created_at desc,id asc"
        )
      ).rows;
      const expected = source.filter((row: Record<string, unknown>) =>
        questionRowMatchesPdfFilters(row, filters)
      );
      const result = await selectQuestionPdfData({ rpc }, userId, filters);
      expect(result.rows.map(r => r.id)).toEqual(
        expected.slice(0, 120).map((r: any) => r.id)
      );
      expect(result.totalMatched).toBe(expected.length);
      expect(result.truncated).toBe(expected.length > 120);
    }
  );
  it.each([
    "\u00a0 FÍSICA\t",
    "\ufeffDinâmica\n",
    "100%_",
    '["Dinâmica"]',
    "ação",
    "ß",
    "Æ",
  ])("normalização SQL equivale à JS: %s", async value => {
    const result = await db.query(
      "select public.question_pdf_normalize($1) value",
      [value]
    );
    expect(result.rows[0].value).toBe(normalizePdfFilterText(value));
  });
  it.each([
    ["answered", [3986, 3987]],
    ["correct", [3986]],
    ["wrong", [3987]],
    ["unanswered", Array.from({ length: 13 }, (_, i) => 3988 + i)],
  ])(
    "prática %s usa somente última tentativa do usuário",
    async (practiceStatus, expected) => {
      const result = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({ ...small, practiceStatus })
      );
      expect(result.rows.map(r => r.id)).toEqual(
        (expected as number[]).map(id)
      );
    }
  );
  it("limita a 120 e não perde correspondências depois das primeiras 4.000", async () => {
    const result = await selectQuestionPdfData(
      { rpc },
      userId,
      questionPdfFiltersSchema.parse({})
    );
    expect(result.rows).toHaveLength(120);
    expect(result.totalMatched).toBe(4000);
    expect(result.truncated).toBe(true);
    expect(result.rows.map(r => r.id)).toEqual(
      Array.from({ length: 120 }, (_, i) => id(i + 1))
    );
    const text = readFileSync("server/routers.ts", "utf8");
    const procedure = text.slice(
      text.indexOf("exportPdfData:"),
      text.indexOf("    list: publicProcedure", text.indexOf("exportPdfData:"))
    );
    expect(procedure).toContain("assertRateLimit");
    expect(procedure).toContain("assertQuestionPdfAccess");
    expect(procedure).not.toMatch(/resolucoes|\.range\(|scanLimit/);
  });
  it("nega execução direta por alunos e anônimos", async () => {
    for (const role of ["anon", "authenticated"]) {
      const result = await db.query(
        "select has_function_privilege($1,'public.export_question_pdf_data(uuid,jsonb)','execute') allowed",
        [role]
      );
      expect(result.rows[0].allowed).toBe(false);
    }
  });
  it("não corta o banco em 4.000 registros e distingue exatamente 120 de 121", async () => {
    await db.exec("begin");
    try {
      await db.exec(`update public.questoes set ano=2027 where id <= '${id(120)}';
        insert into public.questoes(id,created_at,publicada,ano,"instituição",disciplina,dificuldade,enunciado)
        values ('${id(5001)}','2025-01-01',true,2028,'ITA','Física','medio','Além da antiga varredura');`);
      const past = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({ years: [2028] })
      );
      expect(past.rows.map(r => r.id)).toEqual([id(5001)]);
      const exact = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({ years: [2027] })
      );
      expect(exact.rows).toHaveLength(120);
      expect(exact.truncated).toBe(false);
      await db.exec(
        `update public.questoes set ano=2027 where id='${id(121)}'`
      );
      const over = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({ years: [2027] })
      );
      expect(over.rows).toHaveLength(120);
      expect(over.totalMatched).toBe(121);
      expect(over.truncated).toBe(true);
    } finally {
      await db.exec("rollback");
    }
  });
  it("mantém texto JSON literal legado e metadados/imagens sem reinterpretar taxonomia", async () => {
    await db.exec("begin");
    try {
      await db.exec(`update public.questoes set conteudo='["Dinâmica"]',
        url_imagem='https://example.test/figure.png',a_url_imagem='https://example.test/option.png',
        enunciado_pos_imagem='Depois da figura',
        image_metadata='[{"texto_alternativo":"Diagrama","legenda":"Figura"}]'
        where id='${id(3986)}'`);
      const result = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({
          topics: ['["Dinâmica"]'],
          subjects: ["Física"],
        })
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        url_imagem: "https://example.test/figure.png",
        a_url_imagem: "https://example.test/option.png",
        enunciado_pos_imagem: "Depois da figura",
        image_metadata: [{ texto_alternativo: "Diagrama", legenda: "Figura" }],
      });
      const normal = await selectQuestionPdfData({ rpc }, userId, small);
      expect(normal.rows).toHaveLength(14);
    } finally {
      await db.exec("rollback");
    }
  });
  it("desempata tentativas no mesmo instante por attempt_number sem trocar de usuário", async () => {
    await db.exec("begin");
    try {
      await db.exec(`insert into public.user_question_attempts values
        ('${id(6005)}','${userId}','${id(3986)}',false,'2026-02-01',3)`);
      const result = await selectQuestionPdfData(
        { rpc },
        userId,
        questionPdfFiltersSchema.parse({ ...small, practiceStatus: "correct" })
      );
      expect(result.rows).toHaveLength(0);
    } finally {
      await db.exec("rollback");
    }
  });
  it("migration ausente falha sem fallback lento ou log de conteúdo", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(
      selectQuestionPdfData(
        { rpc: async () => ({ data: null, error: { code: "PGRST202" } }) },
        userId,
        small
      )
    ).rejects.toThrow("buscar as questões");
    expect(JSON.stringify(log.mock.calls)).not.toContain(userId);
    expect(JSON.stringify(log.mock.calls)).toContain("PGRST202");
  });
  it("filtros → RPC → serviço → mapeamento → PDF e acionamento do download", async () => {
    transport.mutate.mockImplementation(filters =>
      selectQuestionPdfData({ rpc }, userId, filters)
    );
    const result = await exportQuestionsForPdf(small);
    expect(result.questions).toHaveLength(15);
    expect(result.questions[0].correctOptionId).toBe("a");
    expect(result.questions[0].institution).toBe("ITÁ");
    const logo = readFileSync(
      "client/public/brand/projeto-vetor-logo.svg",
      "utf8"
    );
    const font = readFileSync("client/public/fonts/pdf/DejaVuSans.ttf");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) => new Response(url.endsWith(".ttf") ? font : logo)
      )
    );
    let exported: Blob | undefined;
    vi.spyOn(URL, "createObjectURL").mockImplementation(blob => {
      exported = blob as Blob;
      return "blob:test";
    });
    const click = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal("document", {
      createElement: () => ({ click, remove }),
      body: { appendChild: vi.fn() },
    });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    const generated = await generateQuestionPdf({
      questions: result.questions,
      filterSummary: "Física · ITA · 2026",
      correlationId: result.correlationId,
    });
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect((await exported!.text()).startsWith("%PDF-")).toBe(true);
    expect(generated.questions).toBe(15);
    expect(generated.generationDurationMs).toBeGreaterThan(0);
    console.info({
      test: "pdf-local-4000-to-15",
      searchMs: result.searchDurationMs,
      generationMs: Math.round(generated.generationDurationMs),
      resourcesMs: Math.round(generated.resourceDurationMs),
    });
  });
  it("distingue 504 de geração/baixar e não expõe conteúdo de erros", () => {
    const error = {
      message: "PRIVATE TOKEN",
      meta: { response: { status: 504 } },
    };
    expect(questionPdfFailureMessage(error, "server_search")).toContain(
      "servidor demorou"
    );
    expect(questionPdfFailureMessage(error, "generation")).toContain(
      "montar o PDF"
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    logPdfStage("server_search", "test", 10, error);
    expect(JSON.stringify(log.mock.calls)).not.toContain("PRIVATE TOKEN");
    expect(log.mock.calls[0][0]).toMatchObject({
      httpStatus: 504,
      stage: "server_search",
    });
  });
  it("rollback remove apenas os objetos desta entrega", async () => {
    await db.exec(
      readFileSync(
        "supabase/rollbacks/202610060001_optimize_question_pdf_export.rollback.sql",
        "utf8"
      )
    );
    const result = await db.query(
      "select to_regprocedure('public.export_question_pdf_data(uuid,jsonb)') value"
    );
    expect(result.rows[0].value).toBeNull();
    expect(
      (await db.query("select count(*)::integer n from public.questoes"))
        .rows[0].n
    ).toBe(4001);
  });
});
