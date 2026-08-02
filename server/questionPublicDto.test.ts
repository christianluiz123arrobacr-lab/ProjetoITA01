import { describe, expect, it } from "vitest";
import { safeQuestionDto } from "./vet/vetService";

describe("DTO público de questões", () => {
  it("preserva alternativas históricas A-E sem expor o gabarito", () => {
    const dto = safeQuestionDto({
      id: "question-1",
      A: "Alternativa A",
      B: "Alternativa B",
      C: "Alternativa C",
      D: "Alternativa D",
      E: "Alternativa E",
      alternativa_correta: "C",
    });

    expect(dto).toMatchObject({
      a: "Alternativa A",
      b: "Alternativa B",
      c: "Alternativa C",
      d: "Alternativa D",
      e: "Alternativa E",
    });
    expect(dto).not.toHaveProperty("alternativa_correta");
  });

  it("mantém compatibilidade com registros que já usam a-e minúsculos", () => {
    expect(safeQuestionDto({ id: "question-2", a: "Texto novo", A: "Texto legado" }).a).toBe("Texto novo");
  });
});
