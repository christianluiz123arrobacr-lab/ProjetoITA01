import { queryOptions } from "@tanstack/react-query";
import type { BrowseInput, BrowseResult } from "@shared/questionBrowse";
export function adminQuestionBrowseOptions(
  client: {
    browseQuestions: {
      query: (
        input: BrowseInput,
        options: { signal: AbortSignal }
      ) => Promise<BrowseResult>;
    };
  },
  input: BrowseInput
) {
  return queryOptions({
    queryKey: [["admin", "browseQuestions"], { input, type: "query" }],
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const result = await client.browseQuestions.query(input, { signal });
      if (signal.aborted)
        throw new DOMException("Consulta cancelada", "AbortError");
      return result;
    },
  });
}
