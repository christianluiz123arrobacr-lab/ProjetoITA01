import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { invalidateQuestionCaches } from "../client/src/lib/questionCache";
import { synchronizeFilterPage } from "../client/src/hooks/useFilterPage";
import type { TrpcContext } from "./_core/context";

const database = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: database }));
const transport = vi.hoisted(() => ({
  browse: { query: vi.fn() },
  details: { query: vi.fn() },
}));
vi.mock("../client/src/lib/trpcClient", () => ({
  trpcClient: { questions: transport },
}));
import { appRouter } from "./routers";
import { getQuestionSelection } from "../client/src/services/questions.service";

const id = "00000000-0000-4000-8000-000000000001";
function caller(role: "student" | "editor" | "admin" | null) {
  return appRouter.createCaller({
    user: role ? { id, role, email: null } : null,
    req: { headers: {} },
    res: {},
  } as TrpcContext);
}
afterEach(() => vi.clearAllMocks());

describe("Etapa 2: contratos, autorização e cache", () => {
  it("mudar A → B → A sempre reinicia a página, sem reutilizar página antiga", () => {
    const first = { key: "A", page: 5 };
    const second = synchronizeFilterPage(first, "B");
    expect(second.page).toBe(0);
    expect(synchronizeFilterPage(second, "A").page).toBe(0);
    expect(synchronizeFilterPage(first, "A")).toBe(first);
  });
  it.each(["student", null] as const)(
    "bloqueia %s antes de consultas administrativas",
    async role => {
      const admin = caller(role).admin;
      for (const operation of [
        () => admin.getDashboardStats(),
        () => admin.getQuestionSuggestions(),
        () => admin.browseQuestions({}),
        () => admin.listStudentsWithBilling(),
      ]) {
        await expect(operation()).rejects.toMatchObject({ code: "FORBIDDEN" });
      }
      expect(database.rpc).not.toHaveBeenCalled();
      expect(database.from).not.toHaveBeenCalled();
    }
  );
  it("editor conserva listagem/sugestões, mas não pode ler dados de alunos", async () => {
    database.rpc.mockResolvedValue({ data: [], error: null });
    expect(await caller("editor").admin.getQuestionSuggestions()).toEqual([]);
    await expect(
      caller("editor").admin.listStudentsWithBilling()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(database.rpc).toHaveBeenCalledTimes(1);
  });
  it("papel administrativo é imposto no backend, não pelo input", async () => {
    const data = {
      rows: [],
      total: 0,
      facets: {},
      stats: {},
      resolutionSummaries: [],
    };
    database.rpc.mockResolvedValue({ data, error: null });
    await caller("editor").admin.browseQuestions({});
    expect(database.rpc.mock.calls[0][1]).toMatchObject({
      p_admin: true,
      p_user: null,
    });
    await caller("student").questions.browse({});
    expect(database.rpc.mock.calls[1][1]).toMatchObject({
      p_admin: false,
      p_user: id,
    });
  });
  it("detalhes removem gabarito inclusive quando há alternativas canônicas", async () => {
    database.rpc.mockResolvedValue({
      data: [
        {
          id,
          publicada: true,
          alternativa_correta: "A",
          resolucoes: [{ texto: "privado" }],
          options: [{ id: "a", text: "Opção", isCorrect: true }],
        },
      ],
      error: null,
    });
    const result = await caller("student").questions.details({ ids: [id] });
    expect(result[0].options[0]).toMatchObject({ id: "a", text: "Opção" });
    expect(JSON.stringify(result)).not.toMatch(
      /isCorrect|alternativa_correta|privado/
    );
  });
  it.each([
    "createQuestion",
    "updateQuestion",
    "deleteQuestion",
    "setQuestionPublished",
    "importQuestionBatch",
    "finalizeQuestionImportDraft",
    "saveResolutionBlock",
  ])(
    "%s invalida listas, totais e sugestões sem atingir pagamentos",
    mutation => {
      const client = new QueryClient();
      const keys = [
        "questions.browse",
        "questions.details",
        "admin.browseQuestions",
        "admin.getDashboardStats",
        "admin.getQuestionSuggestions",
        "admin.listBillingPayments",
      ];
      keys.forEach(path =>
        client.setQueryData([path.split("."), {}], { value: 1 })
      );
      invalidateQuestionCaches(client, [["admin", mutation]]);
      for (const path of keys)
        expect(client.getQueryState([path.split("."), {}])?.isInvalidated).toBe(
          path !== "admin.listBillingPayments"
        );
      client.clear();
    }
  );
  it("troca rápida de filtros não deixa resposta antiga substituir a consulta atual", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let finish!: (v: string) => void;
    const observer = new QueryObserver(client, {
      queryKey: ["questions", "old"],
      queryFn: () =>
        new Promise<string>(resolve => {
          finish = resolve;
        }),
    });
    const unsubscribe = observer.subscribe(() => {});
    await Promise.resolve();
    observer.setOptions({
      queryKey: ["questions", "new"],
      queryFn: async () => "novo",
    });
    await client.fetchQuery({
      queryKey: ["questions", "new"],
      queryFn: async () => "novo",
    });
    finish("antigo");
    await Promise.resolve();
    expect(observer.getCurrentResult().data).toBe("novo");
    client.clear();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    unsubscribe();
  });
  it("falha ao atualizar sugestões mantém dados anteriores e retry recupera", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["suggestions"], ["conteúdo salvo"]);
    await expect(
      client.fetchQuery({
        queryKey: ["suggestions"],
        queryFn: async () => {
          throw new Error("temporary");
        },
        staleTime: 0,
      })
    ).rejects.toThrow();
    expect(client.getQueryData(["suggestions"])).toEqual(["conteúdo salvo"]);
    expect(
      await client.fetchQuery({
        queryKey: ["suggestions"],
        queryFn: async () => ["recuperado"],
      })
    ).toEqual(["recuperado"]);
    client.clear();
  });
  it("quiz busca 135 IDs em duas páginas e dois lotes de detalhes, não só a página visível", async () => {
    const rows = Array.from({ length: 135 }, (_, n) => ({ id: `q-${n}` }));
    transport.browse.query.mockImplementation(async ({ page }) => ({
      rows: rows.slice(page * 100, (page + 1) * 100),
      total: rows.length,
    }));
    transport.details.query.mockImplementation(async ({ ids }) =>
      ids.map((id: string) => ({
        id,
        ano: 2026,
        enunciado: "Questão",
        publicada: true,
      }))
    );
    const selection = await getQuestionSelection({});
    expect(selection).toHaveLength(135);
    expect(transport.browse.query).toHaveBeenCalledTimes(2);
    expect(transport.details.query).toHaveBeenCalledTimes(2);
    const notebook = await getQuestionSelection({}, 100);
    expect(notebook).toHaveLength(100);
  });
});
