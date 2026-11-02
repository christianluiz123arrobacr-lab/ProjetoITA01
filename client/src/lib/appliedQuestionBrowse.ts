import { infiniteQueryOptions } from "@tanstack/react-query";
import { mapQuestao } from "@/services/questions.service";
import {
  hasMeaningfulBrowseFilters,
  type BrowseFilters,
  type BrowseInput,
  type BrowseResult,
} from "@shared/questionBrowse";

type BrowseTransport = {
  browse: {
    query: (
      input: BrowseInput,
      options: { signal: AbortSignal }
    ) => Promise<BrowseResult>;
  };
  details: {
    query: (
      input: { ids: string[] },
      options: { signal: AbortSignal }
    ) => Promise<Record<string, any>[]>;
  };
};

export function appliedQuestionBrowseOptions(
  client: BrowseTransport,
  filters: BrowseFilters | null,
  userId: string | undefined,
  ready: boolean,
  revision = 0
) {
  return infiniteQueryOptions({
    queryKey: ["question-bank-progressive", userId, filters, revision],
    enabled:
      ready &&
      Boolean(userId) &&
      Boolean(filters && hasMeaningfulBrowseFilters(filters)),
    initialPageParam: 0,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async ({ pageParam, signal, client: cache, queryKey }) => {
      const previous = cache.getQueryData<{ pages: BrowseResult[] }>(queryKey)?.pages ?? [];
      const snapshot = previous[0];
      // Keep the applied selection stable as answers change practice-status membership.
      // Only compact IDs are captured; bodies are still transferred in batches of 20.
      const page = pageParam > 0 && snapshot?.selectionIds ? {
        ...snapshot, page: pageParam,
        rows: snapshot.selectionIds.slice(pageParam * 20, (pageParam + 1) * 20).map(id => ({id})),
      } : await client.browse.query(
        { filters: filters!, page: pageParam, pageSize: 20 },
        { signal }
      );
      const ids = page.rows.map(row => row.id);
      if (page.selectionIds && (page.selectionIds.length !== page.total || new Set(page.selectionIds).size !== page.total))
        throw new Error("A seleção recebida está inconsistente. Reaplique os filtros.");
      const details = ids.length
        ? await client.details.query({ ids }, { signal })
        : [];
      if (signal.aborted)
        throw new DOMException("Consulta cancelada", "AbortError");
      const byId = new Map(details.map(row => [row.id, row]));
      const previousIds = new Set(previous.slice(0, pageParam).flatMap(p => p.rows.map(row => row.id)));
      if (details.length !== ids.length || ids.some(id => !byId.has(id)) || (pageParam > 0 && (
        previous[0]?.total !== page.total || previous[0]?.selectionRevision !== page.selectionRevision || !ids.length || ids.some(id => previousIds.has(id))
      ))) throw new Error("A lista mudou durante o treino. Tente novamente; se persistir, reaplique os filtros.");
      return {
        ...page,
        questions: ids.flatMap(id =>
          byId.has(id)
            ? [mapQuestao(byId.get(id) as Parameters<typeof mapQuestao>[0])]
            : []
        ),
      };
    },
    getNextPageParam: (last: BrowseResult) =>
      last.rows.length && (last.page + 1) * 20 < last.total
        ? last.page + 1
        : undefined,
  });
}
