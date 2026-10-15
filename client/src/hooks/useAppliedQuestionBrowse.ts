import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import {
  appendUniqueQuestions,
  type BrowseFilters,
} from "@shared/questionBrowse";
import { appliedQuestionBrowseOptions } from "@/lib/appliedQuestionBrowse";

export function useAppliedQuestionBrowse(
  filters: BrowseFilters | null,
  userId: string | undefined,
  ready: boolean,
  revision = 0
) {
  const utils = trpc.useUtils();
  const query = useInfiniteQuery(
    appliedQuestionBrowseOptions(
      utils.client.questions,
      filters,
      userId,
      ready,
      revision
    )
  );
  const questions = useMemo(
    () =>
      appendUniqueQuestions(
        query.data?.pages.map(page => page.questions) ?? []
      ),
    [query.data]
  );
  return { ...query, questions, summary: query.data?.pages[0] };
}
