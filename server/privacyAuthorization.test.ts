import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
const ai = vi.hoisted(() => vi.fn());
const analysis = vi.hoisted(() => vi.fn());
const examAnalysis = vi.hoisted(() => vi.fn());
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: db }));
vi.mock("./_core/llm.js", () => ({ invokeLLM: ai }));
vi.mock("./_core/rateLimit.js", () => ({
  assertRateLimit: vi.fn(),
  assertRequestRateLimit: vi.fn(),
}));
vi.mock("./vet/vetService.js", async importOriginal => ({
  ...(await importOriginal<object>()),
  getCanonicalVetAnalysis: analysis,
}));
vi.mock("./vet/examAnalysisService.js", () => ({
  getExamAnalysis: examAnalysis,
}));
import { appRouter } from "./routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const userId = "10000000-0000-4000-8000-000000000001";
const questionId = "20000000-0000-4000-8000-000000000001";
const caller = (role: "student" | "editor" | "admin" | null = null) =>
  appRouter.createCaller({
    user: role ? { id: userId, role, email: null } : null,
    req: { headers: {} },
    res: {},
  } as any);

function query(data: unknown) {
  const result = { data, error: null };
  const chain: any = {
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  };
  for (const method of [
    "select",
    "eq",
    "order",
    "range",
    "insert",
    "update",
    "delete",
    "limit",
    "in",
    "upsert",
    "gte",
  ])
    chain[method] = vi.fn(() => chain);
  chain.single = chain.maybeSingle = vi.fn(async () => result);
  return chain;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Etapa 1: regressões reproduzidas nos handlers reais, com banco simulado", () => {
  it("não publica tentativas nem campos privados no ranking anônimo", async () => {
    db.from.mockImplementation(table =>
      query(
        table === "profiles"
          ? [{ id: userId, nome: "Aluno", ativo: true, email: "privado" }]
          : [
              {
                user_id: userId,
                question_id: questionId,
                is_correct: true,
                answered_at: "2026-10-19T12:00:00Z",
                difficulty: "medio",
              },
            ]
      )
    );
    const result = await caller().publicStats.getRankingData();
    expect(JSON.stringify(result)).not.toMatch(
      /question_id|answered_at|attempts|email|privado/
    );
  });
  it("não entrega o banco premium a anônimo", async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });
    await expect(
      caller().questions.details({ ids: [questionId] })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("aluno vencido não chama IA", async () => {
    db.from.mockImplementation(table =>
      query(table === "profiles" ? { role: "student", ativo: true } : null)
    );
    db.rpc.mockResolvedValue({ data: false, error: null });
    ai.mockResolvedValue({
      choices: [{ message: { content: "não deve ocorrer" } }],
    });
    await expect(
      caller("student").ai.solvePhysics({ text: "Calcule" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(ai).not.toHaveBeenCalled();
  });
  it("editor não altera publicação SEO por payload genérico", async () => {
    db.from.mockReturnValue(query(null));
    await expect(
      caller("editor").admin.updateQuestion({
        id: questionId,
        payload: { is_public: true },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.from).not.toHaveBeenCalled();
  });
  it("revogação usa uma operação atômica, não um DELETE isolado", async () => {
    db.from.mockReturnValue(query(null));
    db.rpc.mockResolvedValue({
      data: { userId, role: "student" },
      error: null,
    });
    await caller("admin").admin.removeAdminAccess({ id: questionId });
    expect(db.rpc).toHaveBeenCalledWith(
      "vet_revoke_admin_access",
      expect.any(Object)
    );
    expect(db.from).not.toHaveBeenCalled();
  });
  it("blocos públicos consultam página e blocos atomicamente", async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });
    await caller().contentPages.getBlocksByPageId({ pageId: questionId });
    expect(db.rpc).toHaveBeenCalledWith("vet_public_content_blocks", {
      p_page_id: questionId,
    });
    expect(db.from).not.toHaveBeenCalled();
  });
});

const premiumOperations = [
  ["questions.globalStats", undefined],
  ["questions.filterOptions", {}],
  ["questions.browse", {}],
  ["questions.details", { ids: [questionId] }],
  ["questions.list", undefined],
  ["questions.getById", { id: questionId }],
  ["questions.exportPdfData", {}],
  ["notebooks.linkedQuestions", { questionIds: [questionId] }],
  [
    "quiz.recordAttempt",
    { questionId, selectedOption: "a", timeSpentSeconds: 5 },
  ],
  ["quiz.getQuestionOptionStats", { questionId }],
  ["ai.solvePhysics", { text: "Calcule" }],
  ["vet.getAnalysis", undefined],
  ["vet.getObjective", undefined],
  [
    "vet.saveObjective",
    {
      targetExam: "ITA",
      monthsUntilExam: 6,
      hoursPerDay: 2,
      focusSubject: "Física",
      studyDaysPerWeek: 5,
      studyWeekdays: ["segunda"],
    },
  ],
  ["vet.getLearningData", undefined],
  ["vet.getRecommendedQuestions", { block: "ataque" }],
  ["vet.createMockSession", { mode: "misto" }],
  ["vet.getMockSession", { sessionId: questionId }],
  ["vet.completeMockSession", { sessionId: questionId }],
  [
    "vet.submitMockAnswer",
    {
      sessionId: questionId,
      questionId,
      selectedOption: "a",
      timeSpentSeconds: 5,
    },
  ],
  ["vet.getMockResult", { sessionId: questionId }],
  ["vet.listMockHistory", undefined],
  ["vet.getEvolution", undefined],
  ["vet.getExamAnalysis", {}],
] as const;
function callPath(api: any, path: string, input: unknown) {
  const [group, name] = path.split(".");
  return api[group][name](input);
}
function setupAccess(active: boolean, enabled = true, unavailable = false) {
  db.from.mockImplementation(table =>
    query(table === "profiles" ? { role: "student", ativo: enabled } : null)
  );
  db.rpc.mockImplementation(async name =>
    name === "user_has_active_subscription"
      ? { data: active, error: unavailable ? { code: "08006" } : null }
      : { data: [], error: null }
  );
}

describe("autorização premium antes de entrada, conteúdo e efeitos", () => {
  it.each([
    [null, false, 401],
    ["student", false, 403],
    ["student", true, 503],
  ] as const)(
    "serializa HTTP de acesso %s/%s como %s",
    async (role, unavailable, status) => {
      setupAccess(false, true, unavailable);
      const input = encodeURIComponent(
        JSON.stringify({ json: { ids: [questionId] } })
      );
      const response = await fetchRequestHandler({
        router: appRouter,
        endpoint: "/api/trpc",
        req: new Request(
          `https://local.test/api/trpc/questions.details?input=${input}`
        ),
        createContext: () =>
          ({
            req: { headers: {} },
            res: {},
            user: role ? { id: userId, role, email: null } : null,
          }) as any,
      });
      expect(response.status).toBe(status);
      expect(
        db.rpc.mock.calls.some(([name]) => name === "vet_question_details")
      ).toBe(false);
    }
  );
  it.each(premiumOperations)(
    "%s bloqueia anônimo, vencido, bloqueado e provedor indisponível",
    async (path, input) => {
      for (const state of [
        "anonymous",
        "expired",
        "blocked",
        "unavailable",
      ] as const) {
        vi.clearAllMocks();
        setupAccess(
          state === "blocked",
          state !== "blocked",
          state === "unavailable"
        );
        const api = caller(state === "anonymous" ? null : "student");
        await expect(callPath(api, path, input)).rejects.toMatchObject({
          code:
            state === "anonymous"
              ? "UNAUTHORIZED"
              : state === "unavailable"
                ? "SERVICE_UNAVAILABLE"
                : "FORBIDDEN",
        });
        expect(
          db.from.mock.calls.every(([table]) =>
            ["profiles", "billing_payments"].includes(table)
          )
        ).toBe(true);
        expect(
          db.rpc.mock.calls.every(
            ([name]) => name === "user_has_active_subscription"
          )
        ).toBe(true);
        expect(ai).not.toHaveBeenCalled();
        expect(analysis).not.toHaveBeenCalled();
      }
    }
  );
  it.each(["student", "editor", "admin"] as const)(
    "%s autorizado acessa conteúdo, registra tentativa, usa VET e IA",
    async role => {
      setupAccess(true);
      db.rpc.mockImplementation(async name => ({
        data:
          name === "user_has_active_subscription"
            ? true
            : name === "record_canonical_question_attempt"
              ? {
                  attempt_id: questionId,
                  attempt_number: 1,
                  is_correct: true,
                  correct_option: "a",
                  resolution: [],
                }
              : [],
        error: null,
      }));
      ai.mockResolvedValue({ choices: [{ message: { content: "resposta" } }] });
      analysis.mockResolvedValue({ generatedAt: "sintético" });
      const api = caller(role);
      expect(await api.questions.details({ ids: [questionId] })).toEqual([]);
      expect(
        await api.quiz.recordAttempt({
          questionId,
          selectedOption: "a",
          timeSpentSeconds: 5,
        })
      ).toMatchObject({ attemptId: questionId });
      expect(await api.vet.getAnalysis()).toMatchObject({
        generatedAt: "sintético",
      });
      expect(await api.ai.solvePhysics({ text: "Calcule" })).toEqual({
        result: "resposta",
      });
      expect(ai).toHaveBeenCalledTimes(1);
      expect(analysis).toHaveBeenCalledWith(userId);
      if (role !== "student")
        expect(
          db.rpc.mock.calls.some(
            ([name]) => name === "user_has_active_subscription"
          )
        ).toBe(false);
    }
  );
  it.each(premiumOperations)(
    "%s aceita aluno ativo, editor e administrador",
    async (path, input) => {
      for (const role of ["student", "editor", "admin"] as const) {
        vi.clearAllMocks();
        db.from.mockImplementation(table =>
          query(
            table === "profiles"
              ? { role: "student", ativo: true }
              : table === "billing_payments"
                ? null
                : table === "vet_mock_sessions"
                  ? { id: questionId, total_questions: 0, status: "completed" }
                  : table === "user_vet_profiles"
                    ? { user_id: userId }
                    : []
          )
        );
        db.rpc.mockImplementation(async name => ({
          data:
            name === "user_has_active_subscription"
              ? true
              : name === "vet_question_global_stats"
                ? {
                    total: 0,
                    totalDifficulties: 0,
                    subjects: {},
                    difficulties: {},
                  }
                : name === "vet_question_filter_facets"
                  ? {
                      institutions: [],
                      years: [],
                      subjects: [],
                      topics: [],
                      subtopics: [],
                      difficulties: [],
                    }
                  : name === "vet_browse_questions"
                    ? { rows: [], total: 0, facets: {}, stats: {} }
                    : name === "export_question_pdf_data"
                      ? {
                          rows: [],
                          totalMatched: 0,
                          limit: 120,
                          truncated: false,
                        }
                      : name === "record_canonical_question_attempt"
                        ? { attempt_id: questionId }
                        : [],
          error: null,
        }));
        analysis.mockResolvedValue(null);
        examAnalysis.mockResolvedValue({ synthetic: true });
        ai.mockResolvedValue({
          choices: [{ message: { content: "Resposta" } }],
        });
        await expect(
          callPath(caller(role), path, input)
        ).resolves.not.toBeUndefined();
        expect(
          db.rpc.mock.calls.some(
            ([name]) => name === "user_has_active_subscription"
          )
        ).toBe(role === "student");
      }
    }
  );
  it("não transforma falha de assinatura com pagamento pendente em bloqueio definitivo", async () => {
    setupAccess(false, true, true);
    db.from.mockImplementation(table =>
      query(
        table === "profiles"
          ? { role: "student", ativo: true }
          : { id: questionId }
      )
    );
    await expect(
      caller("student").ai.solvePhysics({ text: "Calcule" })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(ai).not.toHaveBeenCalled();
  });
  it("mantém histórico próprio autenticado sem exigir assinatura", async () => {
    const q = query([]);
    db.from.mockReturnValue(q);
    expect(await caller("student").quiz.getMyAttempts()).toEqual([]);
    expect(q.eq).toHaveBeenCalledWith("user_id", userId);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe("páginas e blocos: consulta pública e preview autorizado", () => {
  it.each(["published", "private", "missing"])(
    "página %s respeita publicação e visibilidade",
    async state => {
      // RPC response contract; the real SQL visibility join is tested in adminAccessSql.
      const all =
        state === "missing"
          ? []
          : [
              {
                id: "visible",
                page_id: questionId,
                order_index: 1,
                is_visible: true,
                content: "Bloco",
                content_pages: { is_published: state === "published" },
              },
              {
                id: "hidden",
                page_id: questionId,
                order_index: 0,
                is_visible: false,
                content: "Privado",
                content_pages: { is_published: state === "published" },
              },
            ];
      db.rpc.mockResolvedValue({
        data: all
          .filter(row => row.content_pages.is_published && row.is_visible)
          .map(({ content_pages: _parent, ...row }) => row),
        error: null,
      });
      const result = await caller().contentPages.getBlocksByPageId({
        pageId: questionId,
      });
      expect(result.map(row => row.id)).toEqual(
        state === "published" ? ["visible"] : []
      );
      expect(JSON.stringify(result)).not.toMatch(/content_pages|Privado/);
    }
  );
  it.each(["editor", "admin"] as const)(
    "%s pode visualizar rascunho sem publicá-lo",
    async role => {
      db.from.mockImplementation(table =>
        query(
          table === "content_pages"
            ? { id: questionId, is_published: false }
            : [{ content: "Rascunho", is_visible: false }]
        )
      );
      expect(
        await caller(role).contentPages.preview({ pageId: questionId })
      ).toMatchObject({
        page: { is_published: false },
        blocks: [{ content: "Rascunho" }],
      });
    }
  );
  it.each([null, "student"] as const)(
    "%s não pode acessar preview",
    async role => {
      await expect(
        caller(role).contentPages.preview({ pageId: questionId })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.from).not.toHaveBeenCalled();
    }
  );
});

describe("campos editoriais e publicação separada", () => {
  it.each(["editor", "admin"] as const)(
    "%s cria e edita payload legítimo, inclusive publicação interna e imagens",
    async role => {
      const q = query({ id: questionId, codigo: "Q1" });
      db.from.mockReturnValue(q);
      const payload = {
        codigo: "Q1",
        disciplina: "Física",
        conteudos: ["Dinâmica"],
        assuntos: ["Forças"],
        assuntos_por_conteudo: [{ conteudo: "Dinâmica", assuntos: ["Forças"] }],
        banca: "Exército",
        instituição: "IME",
        ano: 2023,
        dificuldade: "medio" as const,
        publicada: true,
        enunciado: "Enunciado",
        A: "A",
        alternativa_correta: "a" as const,
        image_metadata: [
          {
            slot_id: "fig",
            local: "enunciado" as const,
            ordem: 0,
            url_imagem: "https://project.supabase.co/image.png",
            texto_alternativo: "Figura",
          },
        ],
      };
      expect(
        await caller(role).admin.createQuestion({ payload })
      ).toMatchObject({ id: questionId });
      expect(
        await caller(role).admin.updateQuestion({ id: questionId, payload })
      ).toEqual({ success: true });
      expect(q.update).toHaveBeenCalledWith(
        expect.objectContaining({
          publicada: true,
          url_imagem: "https://project.supabase.co/image.png",
        })
      );
      expect(q.insert.mock.calls[0][0][0]).not.toHaveProperty("is_public");
    }
  );
  it.each([
    "id",
    "created_at",
    "created_by",
    "import_source_id",
    "imported_by",
    "import_batch_id",
    "is_public",
    "public_slug",
    "public_noindex",
    "public_published_at",
    "unknown_column",
  ])("rejeita %s antes de escrever para editor e admin", async key => {
    for (const role of ["editor", "admin"] as const) {
      await expect(
        caller(role).admin.updateQuestion({
          id: questionId,
          payload: { [key]: "value" },
        } as any)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller(role).admin.createQuestion({
          payload: { [key]: "value" },
        } as any)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(db.from).not.toHaveBeenCalled();
  });
  it("editor não usa a operação específica de publicação SEO", async () => {
    await expect(
      caller("editor").admin.setPublicQuestionPublication({
        id: questionId,
        publish: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("revogação atômica: contrato e falhas do backend", () => {
  it.each(["editor", "student", null] as const)(
    "%s não pode revogar cargos",
    async role => {
      await expect(
        caller(role).admin.removeAdminAccess({ id: questionId })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.rpc).not.toHaveBeenCalled();
    }
  );
  it.each([
    [{ code: "P0001", message: "LAST_ADMIN" }, "CONFLICT"],
    [{ code: "P0002" }, "NOT_FOUND"],
    [{ code: "42501" }, "FORBIDDEN"],
    [{ code: "22023" }, "BAD_REQUEST"],
    [{ code: "08006" }, "SERVICE_UNAVAILABLE"],
    [{ code: "PGRST202" }, "SERVICE_UNAVAILABLE"],
  ])("não anuncia sucesso com falha %j", async (error, code) => {
    db.rpc.mockResolvedValue({ data: null, error });
    await expect(
      caller("admin").admin.removeAdminAccess({ id: questionId })
    ).rejects.toMatchObject({ code });
    expect(db.from).not.toHaveBeenCalled();
  });
});
