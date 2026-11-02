import type { PublicRankingInput } from "../../shared/publicRanking";
export const useSupabaseAuth = () => ({
  user: { id: "visual-1" },
  loading: false,
});
const data = {
  profiles: Array.from({ length: 5 }, (_, i) => ({
    id: `visual-${i + 1}`,
    nome: `Aluno sintético ${i + 1}`,
    avatar_key: `avatar_${i + 1}`,
    ativo: true,
  })),
  attempts: Array.from({ length: 90 }, (_, i) => ({
    id: String(i),
    user_id: `visual-${(i % 5) + 1}`,
    question_id: String(i),
    is_correct: i % 7 !== 0,
    time_spent_seconds: 40 + i,
    answered_at: new Date().toISOString(),
    subject: "fisica",
    conteudo: "Dinâmica",
    assunto: "Forças",
    banca: "ITA",
    ano: 2026,
    difficulty: ["facil", "medio", "dificil", "muito_dificil"][i % 4],
  })),
};
const utils = {
  publicStats: {
    getRankingData: {
      fetch: async (input?: PublicRankingInput) => {
        const state = new URLSearchParams(location.search).get("state");
        if (state === "loading") return new Promise(() => {});
        if (state === "error") throw new Error("Falha sintética");
        if (state === "empty") return { ranking: [], seasonRanking: [] };
        const { buildPublicRanking } = await import("../../server/publicRanking");
        return buildPublicRanking(data.attempts, data.profiles, input ?? { period: "season", subject: "all", timeZone: "America/Sao_Paulo" });
      },
    },
  },
};
export const trpc = { useUtils: () => utils };
