import type { QueryClient } from "@tanstack/react-query";
const mutations = new Set([
  "createQuestion",
  "updateQuestion",
  "deleteQuestion",
  "setQuestionPublished",
  "setPublicQuestionPublication",
  "importQuestions",
  "importQuestionBatch",
  "finalizeQuestionImportDraft",
  "saveResolutionBlock",
  "saveResolutionBlocks",
  "deleteResolutionBlock",
  "reorderResolutionBlocks",
]);
export function invalidateQuestionCaches(
  client: QueryClient,
  mutationKey: readonly unknown[] | undefined
) {
  const path = Array.isArray(mutationKey?.[0])
    ? (mutationKey[0] as string[])
    : [];
  if (path[0] !== "admin" || !mutations.has(path.at(-1) ?? "")) return;
  void client.invalidateQueries({
    predicate: query => {
      const key = Array.isArray(query.queryKey[0])
        ? (query.queryKey[0] as string[])
        : [];
      return (
        key[0] === "questions" ||
        (key[0] === "admin" &&
          [
            "browseQuestions",
            "listQuestions",
            "getQuestionSuggestions",
            "getDashboardStats",
            "getQuestionById",
          ].includes(key[1]))
      );
    },
  });
}
