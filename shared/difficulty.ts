export type QuestionDifficulty = "facil" | "medio" | "dificil" | "muito_dificil";
const VALUES: Record<QuestionDifficulty, { label: string; order: number; color: string; weight: number }> = {
  facil: { label: "Fácil", order: 1, color: "bg-emerald-500", weight: 1 },
  medio: { label: "Médio", order: 2, color: "bg-amber-500", weight: 2 },
  dificil: { label: "Difícil", order: 3, color: "bg-rose-500", weight: 3 },
  muito_dificil: { label: "Muito difícil", order: 4, color: "bg-violet-700", weight: 4 },
};
export function normalizeDifficulty(value: unknown): QuestionDifficulty | null {
  if (typeof value !== "string") return null;
  const key = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return key in VALUES ? key as QuestionDifficulty : null;
}
export function formatDifficultyLabel(value: unknown): string { const key = normalizeDifficulty(value); return key ? VALUES[key].label : typeof value === "string" ? value : ""; }
export function getDifficultyOrder(value: unknown): number { const key = normalizeDifficulty(value); return key ? VALUES[key].order : 99; }
export function getDifficultyColor(value: unknown): string { const key = normalizeDifficulty(value); return key ? VALUES[key].color : "bg-slate-400"; }
export function getDifficultyWeight(value: unknown): number { const key = normalizeDifficulty(value); return key ? VALUES[key].weight : 0; }
