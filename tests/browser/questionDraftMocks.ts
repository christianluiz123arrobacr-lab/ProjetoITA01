import { useSyncExternalStore } from "react";
let session = { user: { id: "draft-fixture-A" } };
const listeners = new Set<() => void>();
export const fixtureStats = { reads: 0, writes: 0, attempts: 0 };
export function fixtureAccount(id: string) {
  session = { user: { id } };
  listeners.forEach(fn => fn());
}
export const authSession = { getSnapshot: () => ({ session }) };
export function useSupabaseAuth() {
  const user = useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => session.user
  );
  return { user, loading: false };
}
export async function getQuestionNote() {
  fixtureStats.reads++;
  return null;
}
export async function saveQuestionNote() {
  fixtureStats.writes++;
  throw new Error("A fixture bloqueou uma escrita remota indevida");
}
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
        mutateAsync: async () => {
          fixtureStats.attempts++;
          return { isCorrect: true, correctOption: "a", resolution: [] };
        },
      }),
    },
    createQuestionReport: {
      useMutation: () => ({ mutateAsync: async () => ({}) }),
    },
  },
};
