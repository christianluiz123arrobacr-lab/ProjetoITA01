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
    queryFn: async ({ pageParam, signal }) => {
      const page = await client.browse.query(
        { filters: filters!, page: pageParam, pageSize: 20 },
        { signal }
      );
      const ids = page.rows.map(row => row.id);
      const details = ids.length
        ? await client.details.query({ ids }, { signal })
        : [];
      if (signal.aborted)
        throw new DOMException("Consulta cancelada", "AbortError");
      const byId = new Map(details.map(row => [row.id, row]));
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
