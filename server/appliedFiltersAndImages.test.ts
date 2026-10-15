import { describe, expect, it, vi, afterEach } from "vitest";
import { QueryClient, InfiniteQueryObserver } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  hasMeaningfulBrowseFilters,
  appendUniqueQuestions,
  questionBrowseFiltersSchema,
} from "../shared/questionBrowse";
import { appliedQuestionBrowseOptions } from "../client/src/lib/appliedQuestionBrowse";
import {
  getEditableStatementImages,
  getStatementImages,
  normalizeQuestionImagePayload,
  questionImageMetadataListSchema,
  replaceStatementImages,
} from "../shared/questionImages";
import { buildQuestionRichContent } from "../client/src/lib/richQuestionContent";
import { StatementImagesPreview } from "../client/src/components/admin/StatementImagesEditor";
import {
  parseQuestionImportPayload,
  buildQuestionInsertPayload,
} from "../shared/questionImportSchema";
import { applyReadyImageSlots } from "./questions/questionImportImages";
import { mapQuestao } from "../client/src/services/questions.service";
import { safeQuestionDto } from "./vet/vetService";
import { parseLegalContactPhone } from "./legal/legalConfig";
import {
  buildExamAnalysis,
  changeExamAnalysisFilters,
  OTHER_CONTENT_SHARE_THRESHOLD,
  type ExamAnalysisFilters,
} from "../shared/vet/examAnalysis";

vi.mock("../client/src/lib/trpcClient", () => ({
  trpcClient: { questions: {} },
}));
vi.mock("../client/src/lib/signedStorageUpload", () => ({
  uploadToSignedStorageUrl: vi.fn(),
}));
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: {} }));
const empty = () => questionBrowseFiltersSchema.parse({});
const row = (id: string) => ({
  id,
  publicada: true,
  enunciado: `Questão ${id}`,
  ano: 2026,
  disciplina: "fisica",
  conteudo: "Dinâmica",
  dificuldade: "medio",
});
const response = (ids: string[], page = 0, total = 21) => ({
  rows: ids.map(row),
  page,
  pageSize: 20,
  total,
  facets: {} as any,
  stats: {} as any,
  resolutionSummaries: [],
});
const wait = async (condition: () => boolean) => {
  for (let i = 0; i < 100 && !condition(); i++)
    await new Promise(resolve => setTimeout(resolve, 1));
  expect(condition()).toBe(true);
};
afterEach(() => vi.restoreAllMocks());

describe("filtros aplicados e carregamento progressivo", () => {
  it("não consulta questões ao abrir, editar controles sem aplicar ou limpar", async () => {
    const client = new QueryClient();
    const transport = {
      browse: { query: vi.fn().mockResolvedValue(response(["a"])) },
      details: { query: vi.fn().mockResolvedValue([row("a")]) },
    };
    const observer = new InfiniteQueryObserver(
      client,
      appliedQuestionBrowseOptions(transport, null, "u", true)
    );
    const unsubscribe = observer.subscribe(() => {});
    const draft = questionBrowseFiltersSchema.parse({ institutions: ["ITA"] });
    expect(hasMeaningfulBrowseFilters(draft)).toBe(true);
    expect(transport.browse.query).not.toHaveBeenCalled();
    observer.setOptions(
      appliedQuestionBrowseOptions(transport, draft, "u", true)
    );
    await wait(() => observer.getCurrentResult().isSuccess);
    expect(transport.browse.query).toHaveBeenCalledTimes(1);
    const editedDraft = { ...draft, subjects: ["quimica"] };
    expect(editedDraft).not.toEqual(draft);
    expect(observer.getCurrentResult().data?.pages[0].questions[0].id).toBe(
      "a"
    );
    expect(transport.browse.query).toHaveBeenCalledTimes(1);
    observer.setOptions(
      appliedQuestionBrowseOptions(transport, null, "u", true)
    );
    expect(observer.getCurrentResult().data).toBeUndefined();
    expect(transport.browse.query).toHaveBeenCalledTimes(1);
    unsubscribe();
    client.clear();
  });
  it("só aceita filtros significativos, inclusive status e recorte do VET", () => {
    expect(hasMeaningfulBrowseFilters(empty())).toBe(false);
    expect(hasMeaningfulBrowseFilters({ search: "  " })).toBe(false);
    for (const filter of [
      { exams: ["Exército"] },
      { yearFrom: 2020 },
      { practiceStatus: "wrong" as const },
      { search: "Q-1" },
    ])
      expect(hasMeaningfulBrowseFilters(filter)).toBe(true);
  });
  it("acrescenta até 20 por lote, mantém a ordem e deduplica sem alterar os itens anteriores", async () => {
    const client = new QueryClient();
    const first = Array.from({ length: 20 }, (_, i) => String(i));
    const transport = {
      browse: {
        query: vi
          .fn()
          .mockImplementation(async ({ page }) =>
            response(page ? ["19", "20"] : first, page, 22)
          ),
      },
      details: {
        query: vi
          .fn()
          .mockImplementation(async ({ ids }) => [...ids].reverse().map(row)),
      },
    };
    const observer = new InfiniteQueryObserver(
      client,
      appliedQuestionBrowseOptions(
        transport,
        questionBrowseFiltersSchema.parse({ topics: ["Dinâmica"] }),
        "u",
        true
      )
    );
    const unsubscribe = observer.subscribe(() => {});
    await wait(() => observer.getCurrentResult().isSuccess);
    const before = observer.getCurrentResult().data!.pages[0].questions;
    await observer.fetchNextPage();
    const appended = appendUniqueQuestions(
      observer.getCurrentResult().data!.pages.map(page => page.questions)
    );
    expect(appended.map(item => item.id)).toEqual([...first, "20"]);
    expect(appended[0]).toBe(before[0]);
    expect(
      transport.browse.query.mock.calls.map(call => call[0].pageSize)
    ).toEqual([20, 20]);
    unsubscribe();
    client.clear();
  });
  it("troca de filtros cancela ou ignora resposta antiga", async () => {
    const client = new QueryClient();
    let resolveOld!: (result: any) => void;
    let oldSignal!: AbortSignal;
    const transport = {
      browse: {
        query: vi.fn().mockImplementation(({ filters }, { signal }) =>
          filters.search === "antigo"
            ? ((oldSignal = signal),
              new Promise(resolve => {
                resolveOld = resolve;
              }))
            : Promise.resolve(response(["novo"], 0, 1))
        ),
      },
      details: {
        query: vi.fn().mockImplementation(async ({ ids }) => ids.map(row)),
      },
    };
    const observer = new InfiniteQueryObserver(
      client,
      appliedQuestionBrowseOptions(
        transport,
        questionBrowseFiltersSchema.parse({ search: "antigo" }),
        "u",
        true
      )
    );
    const unsubscribe = observer.subscribe(() => {});
    await wait(() => Boolean(resolveOld));
    observer.setOptions(
      appliedQuestionBrowseOptions(
        transport,
        questionBrowseFiltersSchema.parse({ search: "novo" }),
        "u",
        true
      )
    );
    await wait(() => observer.getCurrentResult().isSuccess);
    resolveOld(response(["velho"], 0, 1));
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(oldSignal.aborted).toBe(true);
    expect(
      observer.getCurrentResult().data!.pages[0].questions.map(item => item.id)
    ).toEqual(["novo"]);
    unsubscribe();
    client.clear();
  });
});

describe("período da análise e Outros", () => {
  const source = [
    {
      ...row("a"),
      instituição: "ITA",
      banca: "ITA",
      ano: 2023,
      conteudos: ["Dinâmica"],
      assuntos: ["Forças"],
    },
    {
      ...row("b"),
      instituição: "IME",
      banca: "Exército",
      ano: 2021,
      disciplina: "quimica",
      conteudos: ["Átomos"],
      assuntos: ["Modelos"],
    },
  ];
  for (const period of [{ year: 2023 }, { period: { from: 2022, to: 2024 } }])
    it.each([
      { institution: "IME" },
      { subject: "quimica" },
      { exam: "Exército" },
      { content: "Átomos" },
      { topic: "Modelos" },
    ])(`preserva ${JSON.stringify(period)} ao trocar %j`, change => {
      const filters = changeExamAnalysisFilters(period, change);
      const result = buildExamAnalysis(source, filters);
      expect(result.filters.year).toEqual(period.year);
      expect(result.filters.period).toEqual(period.period);
    });
  it("mantém o intervalo vazio e permite trocar ou limpar o período explicitamente", () => {
    const current: ExamAnalysisFilters = {
      institution: "IME",
      period: { from: 2025, to: 2026 },
    };
    const result = buildExamAnalysis(source, current);
    expect(result.total).toBe(0);
    expect(result.filters.period).toEqual(current.period);
    const year = changeExamAnalysisFilters(current, {
      year: 2021,
      period: undefined,
    });
    expect(buildExamAnalysis(source, year).total).toBe(1);
    const cleared = changeExamAnalysisFilters(year, {
      year: undefined,
      period: undefined,
    });
    expect(cleared.period).toBeUndefined();
    expect(cleared.year).toBeUndefined();
  });
  it("agrupa somente abaixo de 3%, soma Outros e conserva a exploração dos membros", () => {
    const source = [90, 2, 3, 4, 1].flatMap((count, group) =>
      Array.from({ length: count }, (_, i) => ({
        ...row(`${group}-${i}`),
        conteudos: [`Conteúdo ${group}`],
      }))
    );
    const data = buildExamAnalysis(source);
    expect(OTHER_CONTENT_SHARE_THRESHOLD).toBe(3);
    expect(data.donut.find(item => item.key === "Conteúdo 2")?.share).toBe(3);
    expect(data.donut.find(item => item.key === "Conteúdo 3")?.share).toBe(4);
    expect(data.donut.find(item => item.key === "__others__")).toMatchObject({
      share: 3,
      members: ["Conteúdo 1", "Conteúdo 4"],
    });
    expect(data.donut.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(
      100
    );
  });
});

export function multipleImageQuestion() {
  const parsed = parseQuestionImportPayload({
    formato: "questoes-v2",
    questoes: [
      {
        chave_importacao: "q",
        disciplina: "Física",
        conteudo: "Dinâmica",
        assunto: "Forças",
        resolucao: "Resolução",
        dificuldade: "medio",
        enunciado: "Antes",
        enunciado_pos_imagem: "Depois",
        alternativas: [
          { letra: "A", texto: "a" },
          { letra: "B", texto: "b" },
        ],
        resposta: "A",
        imagens: [
          {
            slot_id: "primeira",
            local: "enunciado",
            obrigatoria: true,
            texto_alternativo: "Diagrama 1",
            legenda: "Figura 1",
          },
          {
            slot_id: "segunda",
            local: "contexto",
            obrigatoria: true,
            texto_alternativo: "Diagrama 2",
            legenda: "Figura 2",
          },
          {
            slot_id: "opcao",
            local: "alternativa",
            alternativa: "A",
            obrigatoria: false,
            texto_alternativo: "Alternativa A",
          },
          {
            slot_id: "solucao",
            local: "resolucao",
            obrigatoria: false,
            texto_alternativo: "Resolução",
          },
        ],
      },
    ],
  });
  const question = parsed.questoes[0].item;
  return applyReadyImageSlots(
    question,
    [...question.imagens]
      .reverse()
      .map(slot => ({
        ...slot,
        import_key: "q",
        public_url: `https://storage.test/${slot.slot_id}.png`,
      }))
  );
}

describe("várias imagens do enunciado e compatibilidade", () => {
  it("finaliza na ordem do JSON mesmo quando os uploads chegam invertidos", () => {
    const question = multipleImageQuestion();
    const payload = buildQuestionInsertPayload(question, "batch", "actor");
    expect(question.url_imagem).toBe("https://storage.test/primeira.png");
    const images = getStatementImages(
      payload.image_metadata,
      payload.url_imagem
    );
    expect(
      images.map(item => [
        item.slot_id,
        item.url_imagem,
        item.ordem,
        item.texto_alternativo,
        item.legenda,
      ])
    ).toEqual([
      [
        "primeira",
        "https://storage.test/primeira.png",
        0,
        "Diagrama 1",
        "Figura 1",
      ],
      [
        "segunda",
        "https://storage.test/segunda.png",
        1,
        "Diagrama 2",
        "Figura 2",
      ],
    ]);
    expect(question.a_url_imagem).toBe("https://storage.test/opcao.png");
    expect(question.resolucao_blocos.at(-1)?.url_imagem).toBe(
      "https://storage.test/solucao.png"
    );
  });
  it("recarrega, reordena, edita e salva sem perder metadados de alternativas e resolução", () => {
    const question = multipleImageQuestion();
    const original = buildQuestionInsertPayload(question, "batch", "actor");
    const editable = getEditableStatementImages(
      original.image_metadata,
      original.url_imagem
    );
    const reordered = [...editable].reverse();
    const saved = normalizeQuestionImagePayload({
      ...original,
      image_metadata: replaceStatementImages(
        original.image_metadata,
        reordered
      ),
    });
    const reloaded = JSON.parse(JSON.stringify(saved));
    expect(
      getStatementImages(reloaded.image_metadata, reloaded.url_imagem).map(
        item => item.slot_id
      )
    ).toEqual(["segunda", "primeira"]);
    expect(normalizeQuestionImagePayload(reloaded)).toEqual(reloaded);
    expect(
      reloaded.image_metadata.filter((item: any) =>
        ["alternativa", "resolucao"].includes(item.local)
      )
    ).toHaveLength(2);
  });
  it("modelo público, rich content e preview exibem todas sem duplicar o fallback", () => {
    const question = multipleImageQuestion();
    const payload = buildQuestionInsertPayload(question, "batch", "actor");
    const dto = safeQuestionDto({ ...payload, id: "q" });
    expect(dto).not.toHaveProperty("alternativa_correta");
    expect(
      JSON.stringify(
        safeQuestionDto({
          ...payload,
          image_metadata: payload.image_metadata.map(item => ({
            ...item,
            correctAnswer: "a",
            resolution: "Segredo",
          })),
        })
      )
    ).not.toMatch(/correctAnswer|Segredo/);
    const mapped = mapQuestao(dto);
    const nodes = buildQuestionRichContent(mapped);
    expect(
      nodes.map(node =>
        node.type === "image"
          ? node.url
          : node.type === "text"
            ? node.value
            : node.type
      )
    ).toEqual([
      "Antes",
      "https://storage.test/primeira.png",
      "https://storage.test/segunda.png",
      "Depois",
    ]);
    const html = renderToStaticMarkup(
      createElement(StatementImagesPreview, { images: mapped.statementImages! })
    );
    expect(html.match(/<img /g)).toHaveLength(2);
    expect(html).toContain('alt="Diagrama 2"');
    expect(html).toContain("Figura 1");
  });
  it("preserva imagem legada e remove somente a imagem selecionada", () => {
    expect(getStatementImages([], "https://storage.test/old.png")).toHaveLength(
      1
    );
    const q = multipleImageQuestion();
    const images = getStatementImages(q.image_metadata, q.url_imagem);
    expect(
      getStatementImages(
        replaceStatementImages(q.image_metadata, images.slice(1)),
        null
      ).map(item => item.slot_id)
    ).toEqual(["segunda"]);
  });
  it("mantém URL em edição, mas rejeita URL inválida e slots de metadados duplicados ao salvar", () => {
    const q = multipleImageQuestion();
    const images = getEditableStatementImages(q.image_metadata, q.url_imagem);
    images[0] = { ...images[0], url_imagem: "javascript:alert(1)" };
    expect(getEditableStatementImages(images)[0].url_imagem).toContain(
      "javascript:"
    );
    expect(() =>
      normalizeQuestionImagePayload({ image_metadata: images })
    ).toThrow();
    expect(
      questionImageMetadataListSchema.safeParse([
        q.image_metadata[0],
        q.image_metadata[0],
      ]).success
    ).toBe(false);
    expect(() =>
      applyReadyImageSlots(q, [
        {
          ...q.imagens[0],
          slot_id: "desconhecido",
          import_key: "q",
          public_url: "https://storage.test/x.png",
        },
      ])
    ).toThrow(/Slot/);
  });
});

describe("telefone legal validado", () => {
  it.each([
    undefined,
    "",
    "javascript:alert(1)",
    "+55<script>",
    "123",
    "00 123456789",
  ])("oculta valor inválido %s", value =>
    expect(parseLegalContactPhone(value)).toBeNull()
  );
  it("aceita somente telefone configurado e normaliza para tel seguro", () =>
    expect(parseLegalContactPhone("+55 (61) 99999-1234")).toBe(
      "+5561999991234"
    ));
});
