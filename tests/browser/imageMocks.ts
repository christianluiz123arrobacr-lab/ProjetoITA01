export const useSupabaseAuth = () => ({
  user: { id: "00000000-0000-4000-8000-000000000001" },
  loading: false,
});
export const QuestionScratchpad = () => null;
const utils = {
  quiz: {
    getResolutionAuthors: { fetch: async () => [] },
    getQuestionOptionStats: { fetch: async () => [] },
  },
};
export const trpc = {
  useUtils: () => utils,
  quiz: {
    recordAttempt: {
      useMutation: () => ({
        mutateAsync: async () => ({
          isCorrect: true,
          correctOption: "a",
          resolution: [],
        }),
      }),
    },
    createQuestionReport: {
      useMutation: () => ({ mutateAsync: async () => ({}) }),
    },
  },
};
