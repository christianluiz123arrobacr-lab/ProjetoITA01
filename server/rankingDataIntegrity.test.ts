import { describe, expect, it, vi } from "vitest";
import { buildPublicRanking } from "./publicRanking";
import { publicRankingInputSchema } from "../shared/publicRanking";
import { legacyRanking } from "./testing/legacyRankingReference";

const profiles = ["a", "b", "c", "blocked"].map(id => ({
  id,
  nome: id,
  ativo: id !== "blocked",
  avatar_key: "avatar_1",
  email: "private",
}));
const attempt = (
  user: string,
  question: string,
  day: string,
  correct = true,
  difficulty = "medio",
  time: number | null = 60,
  subject = "fisica"
) => ({
  user_id: user,
  question_id: question,
  answered_at: `${day}T10:00:00Z`,
  is_correct: correct,
  difficulty,
  time_spent_seconds: time,
  subject,
});
const rows = [
  attempt("a", "q1", "2026-10-20"),
  attempt("a", "q1", "2026-10-20"),
  attempt("a", "q2", "2026-10-19", false),
  attempt("a", "q2", "2026-10-20", true, "dificil"),
  attempt("a", "q3", "2026-10-21", true, "facil"),
  attempt("b", "q4", "2026-10-20", true, "muito_dificil", 80),
  attempt("c", "q5", "2026-10-01"),
  attempt("blocked", "q6", "2026-10-20", true, "muito_dificil"),
];
const rank = (period = "all", subject = "all", input = rows) =>
  buildPublicRanking(
    input,
    profiles,
    publicRankingInputSchema.parse({ period, subject }),
    new Date("2026-10-21T18:00:00Z")
  );

describe("ranking agregado: regras anteriores preservadas no servidor", () => {
  it("equivale ao algoritmo congelado da base para todos os períodos e disciplinas", () => {
    vi.stubEnv("TZ", "America/Sao_Paulo");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T18:00:00Z"));
    try {
      const fixture = [
        ...rows,
        attempt("a", "q1", "2026-10-10", true, "muito_dificil"),
        attempt("c", "q7", "2026-10-20", true, "medio", 10, "matematica"),
      ];
      for (const period of ["24h", "season", "7d", "30d", "all"] as const) {
        for (const subject of [
          "all",
          "fisica",
          "matematica",
          "quimica",
        ] as const) {
          expect(rank(period, subject, fixture).ranking).toEqual(
            legacyRanking(fixture, profiles, period, subject)
          );
        }
      }
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });
  it("mantém pesos 2/4/8/16, acertos únicos e taxa por tentativa", () => {
    const result = rank().ranking;
    expect(result.map(row => row.userId)).toEqual(["b", "a", "c"]);
    expect(result[1]).toMatchObject({
      score: 14,
      correctCount: 3,
      correctAttempts: 4,
      totalAttempts: 5,
      accuracy: 80,
      avgTimeSeconds: 60,
      easyCorrect: 1,
      mediumCorrect: 1,
      hardCorrect: 1,
      topStreak: 2,
    });
  });
  it("preserva todos os períodos e a elegibilidade", () => {
    for (const period of ["24h", "season", "7d", "30d", "all"]) {
      const dto = rank(period);
      expect(dto.ranking.some(row => row.userId === "blocked")).toBe(false);
      expect(dto.seasonRanking.map(row => row.userId)).toEqual(["b", "a"]);
    }
    expect(rank("7d").ranking.map(row => row.userId)).toEqual(["b", "a"]);
    expect(rank("30d").ranking).toHaveLength(3);
    expect(rank("24h").ranking.map(row => row.userId)).toEqual(["a"]);
  });
  it("preserva filtros de disciplina normalizados", () => {
    const mixed = [
      ...rows,
      attempt("c", "q7", "2026-10-20", true, "facil", 40, " Matemática "),
    ];
    expect(rank("all", "matematica", mixed).ranking).toMatchObject([
      { userId: "c", score: 2 },
    ]);
    expect(rank("all", "quimica", mixed).ranking).toEqual([]);
  });
  it("desempata por acertos únicos, taxa, tempo médio e atividade nessa ordem", () => {
    const compare = (a: any[], b: any[]) =>
      rank("all", "all", [...a, ...b]).ranking[0].userId;
    expect(
      compare(
        [attempt("a", "1", "2026-10-20", true, "medio")],
        [
          attempt("b", "2", "2026-10-20", true, "facil"),
          attempt("b", "3", "2026-10-20", true, "facil"),
        ]
      )
    ).toBe("b");
    expect(
      compare(
        [
          attempt("a", "1", "2026-10-20"),
          attempt("a", "2", "2026-10-20", false),
        ],
        [attempt("b", "1", "2026-10-20")]
      )
    ).toBe("b");
    expect(
      compare(
        [attempt("a", "1", "2026-10-20", true, "medio", 40)],
        [attempt("b", "1", "2026-10-20", true, "medio", 60)]
      )
    ).toBe("a");
    expect(
      compare(
        [attempt("a", "1", "2026-10-19")],
        [attempt("b", "1", "2026-10-20")]
      )
    ).toBe("b");
  });
  it("compara a posição anterior sem divulgar tentativas", () => {
    const dto = rank("7d", "all", [
      ...rows,
      attempt("a", "old", "2026-10-10", true, "muito_dificil"),
    ]);
    expect(dto.ranking.find(row => row.userId === "a")?.positionDelta).toBe(-1);
    expect(
      dto.ranking.find(row => row.userId === "b")?.positionDelta
    ).toBeNull();
    expect(JSON.stringify(dto)).not.toMatch(
      /question_id|answered_at|selected_option|email|q1/
    );
    expect(Object.keys(dto).sort()).toEqual(["ranking", "seasonRanking"]);
  });
  it("preserva a média diária legada quando há tempos ausentes", () => {
    expect(
      rank("all", "all", [
        attempt("a", "1", "2026-10-20", true, "medio", null),
        attempt("a", "1", "2026-10-20", true, "medio", 90),
      ]).ranking[0].avgTimeSeconds
    ).toBe(90);
  });
  it("rejeita fuso inválido e preserva semana vazia", () => {
    expect(
      publicRankingInputSchema.safeParse({ timeZone: "invalid" }).success
    ).toBe(false);
    expect(rank("season", "all", []).ranking).toEqual([]);
  });
});
