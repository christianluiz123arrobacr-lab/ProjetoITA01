import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("difficulty integration", () => {
  it("uses production-safe ESM extensions in shared server dependencies", () => {
    expect(readFileSync("shared/vet/vetEngine.ts", "utf8")).toContain('from "../difficulty.js"');
    expect(readFileSync("shared/questionImportSchema.ts", "utf8")).toContain('from "./difficulty.js"');
  });
  it("renders the question-bank level in the fixed order and violet color", () => {
    const source = readFileSync("client/src/pages/QuestionBankPage.tsx", "utf8");
    expect(source.indexOf('key: "muito_dificil"')).toBeGreaterThan(source.indexOf('key: "dificil"'));
    expect(source).toContain('label: "Muito difícil"');
    expect(source).toContain('colorClass: "bg-violet-700"');
    expect(source).toContain("normalizeDifficulty(q.difficulty)");
  });

  it("admin creation and editing offer and normalize very hard", () => {
    for (const file of ["client/src/pages/AdminQuestionCreatePage.tsx", "client/src/pages/AdminQuestionEditPage.tsx"]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain('<option value="muito_dificil">Muito difícil</option>');
      expect(source).toContain("normalizeDifficulty(form.dificuldade)");
    }
  });

  it("profile, public profile and VET use the centralized weight", () => {
    for (const file of ["client/src/pages/RankingPage.tsx", "client/src/pages/ProfilePage.tsx", "client/src/pages/PublicProfilePage.tsx", "shared/vet/vetEngine.ts"]) {
      expect(readFileSync(file, "utf8")).toContain("getDifficultyWeight");
    }
  });
});
