import { describe, expect, it } from "vitest";
import { formatDifficultyLabel, getDifficultyColor, getDifficultyOrder, getDifficultyWeight, normalizeDifficulty } from "../shared/difficulty";
describe("question difficulty", () => {
  it.each(["Muito difícil", "muito dificil", "muito_dificil", "muito-dificil"])("normalizes %s", value => expect(normalizeDifficulty(value)).toBe("muito_dificil"));
  it("defines very hard presentation and weight", () => {
    expect(formatDifficultyLabel("muito_dificil")).toBe("Muito difícil");
    expect(getDifficultyOrder("muito_dificil")).toBe(4);
    expect(getDifficultyColor("muito_dificil")).toBe("bg-violet-700");
    expect(getDifficultyWeight("muito_dificil")).toBe(4);
    expect(getDifficultyWeight("unknown")).toBe(0);
  });
});
