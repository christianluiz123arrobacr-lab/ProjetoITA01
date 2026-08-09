import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
      options: [
        { id: "a", label: "A", text: "Alternativa A", imageUrl: null },
        { id: "b", label: "B", text: "Alternativa B", imageUrl: null },
        { id: "c", label: "C", text: "Alternativa C", imageUrl: null },
        { id: "d", label: "D", text: "Alternativa D", imageUrl: null },
        { id: "e", label: "E", text: "Alternativa E", imageUrl: null },
      ],
    });
    expect(dto).not.toHaveProperty("alternativa_correta");
  });

  it("inclui alternativas compostas somente por imagem na coleção canônica", () => {
    expect(safeQuestionDto({ id: "question-image", a_url_imagem: "https://cdn.test/a.png" }).options).toEqual([
      { id: "a", label: "A", text: null, imageUrl: "https://cdn.test/a.png" },
    ]);
  });

  it("mantém compatibilidade com registros que já usam a-e minúsculos", () => {
    expect(safeQuestionDto({ id: "question-2", a: "Texto novo", A: "Texto legado" }).a).toBe("Texto novo");
  });

  it("permite que a RPC canônica valide e registre alternativas A-E históricas", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202608020003_fix_uppercase_question_options.sql", import.meta.url), "utf8");
    expect(sql).toContain("to_jsonb(v_question)->>upper(trim(p_selected_option))");
    expect(sql).toContain("v_correct := lower(trim(p_selected_option)) = lower(trim(v_question.alternativa_correta))");
    expect(sql).toContain("grant execute on function public.record_canonical_question_attempt");
    expect(sql).toContain("question does not belong to mock session");
    expect(sql).toContain("mock question already answered");
  });
});
