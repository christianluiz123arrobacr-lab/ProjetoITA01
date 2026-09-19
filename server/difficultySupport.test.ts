import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_ORDER,
  getDifficultyBucket,
  getDifficultyLabel,
  getDifficultyNumeric,
  getDifficultyOrder,
  getDifficultyRankingPoints,
  getVetPlanDifficultyBonus,
  getVetSelectionDifficultyScore,
} from "../shared/difficulty";

describe("suporte canônico a muito_dificil", () => {
  it("mantém a escala oficial, rótulo e pontuação do ranking", () => {
    expect(DIFFICULTY_ORDER).toEqual(["facil", "medio", "dificil", "muito_dificil"]);
    expect(DIFFICULTY_ORDER.map(getDifficultyNumeric)).toEqual([1, 2, 3, 4]);
    expect(DIFFICULTY_ORDER.map(getDifficultyRankingPoints)).toEqual([2, 4, 8, 16]);
    expect(getDifficultyBucket("muito_dificil")).toBe("very_hard");
    expect(getDifficultyLabel("muito_dificil")).toBe("Muito difícil");
    expect(getDifficultyOrder("muito_dificil")).toBeGreaterThan(getDifficultyOrder("dificil"));
  });

  it("aplica as distribuições explícitas da seleção VET", () => {
    expect(DIFFICULTY_ORDER.map(value => getVetSelectionDifficultyScore(value, "ataque"))).toEqual([4, 10, 8, 6]);
    expect(DIFFICULTY_ORDER.map(value => getVetSelectionDifficultyScore(value, "consolidacao"))).toEqual([7, 10, 4, 2]);
    expect(DIFFICULTY_ORDER.map(value => getVetSelectionDifficultyScore(value, "manutencao"))).toEqual([10, 7, 3, 1]);
  });

  it("aplica bônus explícito no plano VET", () => {
    expect(DIFFICULTY_ORDER.map(getVetPlanDifficultyBonus)).toEqual([2, 5, 8, 10]);
  });

  it("mantém criação, edição, banco, admin, perfil e ranking ligados ao valor canônico", () => {
    const files = [
      "../client/src/pages/AdminQuestionCreatePage.tsx",
      "../client/src/pages/AdminQuestionEditPage.tsx",
      "../client/src/pages/QuestionBankPage.tsx",
      "../client/src/pages/AdminQuestionsPage.tsx",
      "../client/src/pages/PublicProfilePage.tsx",
      "../client/src/pages/ProfilePage.tsx",
      "../client/src/pages/RankingPage.tsx",
    ].map(path => readFileSync(new URL(path, import.meta.url), "utf8"));
    const combined = files.join("\n");

    expect(files[0]).toContain('<option value="muito_dificil">Muito difícil</option>');
    expect(files[1]).toContain('<option value="muito_dificil">Muito difícil</option>');
    expect(files[2]).toContain('key: "muito_dificil"');
    expect(files[3]).toContain('valor === "muito_dificil"');
    expect(combined).toContain("getDifficultyRankingPoints");
    expect(files[6]).toContain('if (value === "muito_dificil") return 16');
    expect(files[6]).toContain("veryHardCorrect");
    expect(files[6]).toContain("veryHard = Math.ceil(points / 16)");
  });

  it("confirma que a tentativa canônica copia a dificuldade da questão", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202608020003_fix_uppercase_question_options.sql", import.meta.url), "utf8");
    expect(sql).toContain("to_jsonb(v_question)->>'dificuldade'");
  });
});
