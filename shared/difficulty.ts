export const DIFFICULTY_ORDER = ["facil", "medio", "dificil", "muito_dificil"] as const;
export type CanonicalDifficulty = (typeof DIFFICULTY_ORDER)[number];

export function normalizeDifficulty(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
}

export function getDifficultyNumeric(value?: string | null) {
  const difficulty = normalizeDifficulty(value);
  if (difficulty === "facil") return 1;
  if (difficulty === "medio") return 2;
  if (difficulty === "dificil") return 3;
  if (difficulty === "muito_dificil") return 4;
  return 2;
}

export function getDifficultyLabel(value?: string | null) {
  const difficulty = normalizeDifficulty(value);
  if (difficulty === "facil") return "Fácil";
  if (difficulty === "medio") return "Médio";
  if (difficulty === "dificil") return "Difícil";
  if (difficulty === "muito_dificil") return "Muito difícil";
  return String(value ?? "");
}

export function getDifficultyOrder(value?: string | null) {
  const index = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(value) as CanonicalDifficulty);
  return index === -1 ? 99 : index + 1;
}

export function getDifficultyRankingPoints(value?: string | null) {
  const difficulty = normalizeDifficulty(value);
  if (difficulty === "facil") return 2;
  if (difficulty === "medio") return 4;
  if (difficulty === "dificil") return 8;
  if (difficulty === "muito_dificil") return 16;
  return 0;
}

export function getDifficultyBucket(value?: string | null) {
  const difficulty = normalizeDifficulty(value);
  if (difficulty === "facil") return "easy";
  if (difficulty === "medio") return "medium";
  if (difficulty === "dificil") return "hard";
  if (difficulty === "muito_dificil") return "very_hard";
  return "unknown";
}

export function getVetSelectionDifficultyScore(
  value: string | null | undefined,
  block: "ataque" | "consolidacao" | "manutencao"
) {
  const difficulty = normalizeDifficulty(value);
  const scores = {
    ataque: { facil: 4, medio: 10, dificil: 8, muito_dificil: 6 },
    consolidacao: { facil: 7, medio: 10, dificil: 4, muito_dificil: 2 },
    manutencao: { facil: 10, medio: 7, dificil: 3, muito_dificil: 1 },
  } as const;
  return scores[block][difficulty as CanonicalDifficulty] ?? 5;
}

export function getVetPlanDifficultyBonus(value?: string | null) {
  const difficulty = normalizeDifficulty(value);
  if (difficulty === "muito_dificil") return 10;
  if (difficulty === "dificil") return 8;
  if (difficulty === "medio") return 5;
  if (difficulty === "facil") return 2;
  return 2;
}
