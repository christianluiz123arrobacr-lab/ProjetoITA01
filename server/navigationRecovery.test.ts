import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
} from "@tanstack/react-query";
import { adminQuestionBrowseOptions } from "../client/src/lib/adminQuestionBrowse";
import { readFileSync } from "node:fs";
import { progressiveQuizState } from "../client/src/lib/progressiveQuiz";
import { scheduleDebouncedUpdate } from "../client/src/hooks/useDebouncedValue";
import { appliedQuestionBrowseOptions } from "../client/src/lib/appliedQuestionBrowse";
import {
  questionBrowseFiltersSchema,
  questionBrowseSchema,
} from "../shared/questionBrowse";
import { retryTransientRead } from "../client/src/lib/transientRetry";
import { LEGAL_CONTACT } from "../shared/legalContact";

vi.mock("../client/src/lib/trpcClient", () => ({ trpcClient: {} }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const row = (id: number) => ({
  id: String(id),
  enunciado: "Sintética",
  publicada: true,
});
const setup = (failure = "") => {
  let mode = failure;
  const transport = {
    browse: {
      query: vi.fn(async ({ page }: { page: number }) => {
        if (page && mode === "network") throw new TypeError("fetch failed");
        const ids = Array.from(
          { length: Math.min(20, 91 - page * 20) },
          (_, i) => page * 20 + i
        );
        if (page && mode === "duplicate") ids[0] = 0;
        return {
          rows: ids.map(row),
          total: page && mode === "changed" ? 90 : 91,
          page,
          pageSize: 20,
          facets: {} as any,
          stats: {} as any,
          resolutionSummaries: [],
        };
      }),
    },
    details: {
      query: vi.fn(async ({ ids }: { ids: string[] }) =>
        ids.map(id => row(Number(id)))
      ),
    },
  };
  const cache = new QueryClient();
  const observer = new InfiniteQueryObserver(
    cache,
    appliedQuestionBrowseOptions(
      transport,
      questionBrowseFiltersSchema.parse({ subjects: ["fisica"] }),
      "u",
      true
    )
  );
  const unsubscribe = observer.subscribe(() => {});
  return {
    observer,
    transport,
    fix: () => {
      mode = "";
    },
    close: () => {
      unsubscribe();
      cache.clear();
    },
  };
};
const settle = async (check: () => boolean) => {
  await vi.waitFor(() => expect(check()).toBe(true));
};

describe("Navegação progressiva e recuperação", () => {
  it("captura IDs no Aplicar e não perde questões quando respostas alteram o status de prática", async () => {
    const ids = Array.from({ length: 41 }, (_, i) => String(i));
    const transport = {
      browse: {
        query: vi
          .fn()
          .mockResolvedValue({
            rows: ids.slice(0, 20).map(id => row(Number(id))),
            selectionIds: ids,
            selectionRevision: "snapshot",
            total: 41,
            page: 0,
            pageSize: 20,
            facets: {},
            stats: {},
            resolutionSummaries: [],
          }),
      },
      details: {
        query: vi.fn(async ({ ids }: { ids: string[] }) =>
          ids.map(id => row(Number(id)))
        ),
      },
    };
    const cache = new QueryClient();
    const observer = new InfiniteQueryObserver(
      cache,
      appliedQuestionBrowseOptions(
        transport,
        questionBrowseFiltersSchema.parse({ practiceStatus: "unanswered" }),
        "u",
        true
      )
    );
    const unsubscribe = observer.subscribe(() => {});
    await settle(() => observer.getCurrentResult().isSuccess);
    // Subsequent live browse would now contain fewer unanswered questions.
    transport.browse.query.mockRejectedValue(
      new Error("Should not re-evaluate membership")
    );
    await observer.fetchNextPage();
    await observer.fetchNextPage();
    expect(transport.browse.query).toHaveBeenCalledTimes(1);
    expect(
      transport.details.query.mock.calls.map(([p]) => p.ids.length)
    ).toEqual([20, 20, 1]);
    expect(
      observer
        .getCurrentResult()
        .data!.pages.flatMap(p => p.questions)
        .map(q => q.id)
    ).toEqual(ids);
    unsubscribe();
    cache.clear();
  });
  it("avança por todos os lotes internos, preserva respostas e só conclui em 91/91", async () => {
    const s = setup();
    await settle(() => s.observer.getCurrentResult().isSuccess);
    const answers = new Map(
      Array.from({ length: 20 }, (_, i) => [String(i), "a"])
    );
    expect(progressiveQuizState(20, 91, 20, 19).complete).toBe(false);
    expect(progressiveQuizState(20, 91, 19, 15).prefetch).toBe(true);
    expect(progressiveQuizState(20, 91, 19, 19).canAdvance).toBe(true);
    for (let i = 0; i < 4; i++) await s.observer.fetchNextPage();
    const pages = s.observer.getCurrentResult().data!.pages;
    expect(pages.flatMap(p => p.questions).map(q => q.id)).toEqual(
      Array.from({ length: 91 }, (_, i) => String(i))
    );
    expect(s.transport.browse.query.mock.calls.map(([p]) => p.page)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(s.observer.getCurrentResult().hasNextPage).toBe(false);
    expect(progressiveQuizState(91, 91, 90, 90).complete).toBe(false);
    expect(progressiveQuizState(91, 91, 91, 90).complete).toBe(true);
    expect(answers.get("0")).toBe("a");
    s.close();
  });
  it.each(["network", "duplicate", "changed"])(
    "%s não encerra o treino nem substitui o primeiro lote; retry recupera",
    async mode => {
      const s = setup(mode);
      await settle(() => s.observer.getCurrentResult().isSuccess);
      const original = s.observer.getCurrentResult().data!.pages[0];
      await s.observer.fetchNextPage();
      expect(s.observer.getCurrentResult().isFetchNextPageError).toBe(true);
      expect(s.observer.getCurrentResult().data!.pages).toEqual([original]);
      expect(progressiveQuizState(20, 91, 20, 19, true).complete).toBe(false);
      s.fix();
      await s.observer.fetchNextPage();
      expect(s.observer.getCurrentResult().data!.pages).toHaveLength(2);
      s.close();
    }
  );
  it("debounce cancela digitação antiga, inclusive ao desmontar", async () => {
    vi.useFakeTimers();
    const update = vi.fn();
    let cancel = scheduleDebouncedUpdate("a", update, 350);
    await vi.advanceTimersByTimeAsync(200);
    cancel();
    cancel = scheduleDebouncedUpdate("ab", update, 350);
    await vi.advanceTimersByTimeAsync(349);
    expect(update).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("ab");
    cancel();
    scheduleDebouncedUpdate("abc", update, 350)();
    await vi.advanceTimersByTimeAsync(400);
    expect(update).toHaveBeenCalledTimes(1);
    const source = readFileSync(
      "client/src/pages/AdminQuestionsPage.tsx",
      "utf8"
    );
    expect(source).toContain("search: debouncedSearch");
    expect(source).toContain("adminQuestionBrowseOptions");
  });
  it("busca administrativa aborta o filtro antigo e nunca aplica sua resposta atrasada", async () => {
    const cache = new QueryClient();
    let resolve!: (data: any) => void;
    let oldSignal!: AbortSignal;
    const transport = {
      browseQuestions: {
        query: vi.fn(({ filters }, { signal }) => {
          if (filters.search === "antigo") {
            oldSignal = signal;
            return new Promise<any>(r => {
              resolve = r;
            });
          }
          return Promise.resolve({
            rows: [row(2)],
            total: 1,
            page: 0,
            pageSize: 25,
            facets: {},
            stats: {},
            resolutionSummaries: [],
          } as any);
        }),
      },
    };
    const options = (search: string) =>
      adminQuestionBrowseOptions(
        transport,
        questionBrowseSchema.parse({ filters: { search } })
      );
    const observer = new QueryObserver(cache, options("antigo"));
    const unsubscribe = observer.subscribe(() => {});
    await settle(() => Boolean(resolve));
    observer.setOptions(options("novo"));
    await settle(() => observer.getCurrentResult().isSuccess);
    expect(oldSignal.aborted).toBe(true);
    resolve({ rows: [row(1)], total: 1 });
    await new Promise(r => setTimeout(r, 0));
    expect(observer.getCurrentResult().data?.rows[0].id).toBe("2");
    unsubscribe();
    cache.clear();
  });
  it("só repete leitura transitória uma vez; nunca autenticação/autorização/validação", () => {
    expect(
      retryTransientRead(0, { data: { code: "SERVICE_UNAVAILABLE" } })
    ).toBe(true);
    expect(
      retryTransientRead(1, { data: { code: "SERVICE_UNAVAILABLE" } })
    ).toBe(false);
    for (const code of [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "BAD_REQUEST",
      "PRECONDITION_FAILED",
      "INTERNAL_SERVER_ERROR",
    ])
      expect(retryTransientRead(0, { data: { code } })).toBe(false);
    expect(retryTransientRead(0, new TypeError("fetch failed"))).toBe(true);
  });
  it("totais independem da busca; todos os documentos usam os mesmos contatos sem alterar versões", () => {
    const bank = readFileSync("client/src/pages/QuestionBankPage.tsx", "utf8");
    expect(bank).toContain("trpc.questions.globalStats.useQuery");
    expect(bank).toContain("const totalQuestions = globalQuery.data?.total");
    expect(bank).not.toContain("Carregar mais questões");
    expect(bank).not.toContain("questões carregadas");
    const legal = readFileSync("client/src/pages/LegalPage.tsx", "utf8");
    expect(legal).toContain("LEGAL_CONTACT.phoneDisplay");
    expect(LEGAL_CONTACT).toEqual({
      email: "projetovetoroficial@gmail.com",
      phone: "+5566971703627",
      phoneDisplay: "(66) 97170-3627",
    });
  });
});
