import { describe, expect, it } from "vitest";
import { parseQuestionImportPayload } from "../shared/questionImportSchema";
import { selectValidQuestionImportItems } from "../shared/questionImportSelection";

const question = (key: string, enunciado = "Enunciado") => ({
  chave_importacao: key,
  disciplina: "Matemática",
  assunto: "Funções",
  enunciado,
  alternativas: [{ letra: "A", texto: "1" }, { letra: "B", texto: "2" }],
  resposta: "A",
  resolucao: "Resolução",
});

describe("seleção de questões para importação parcial", () => {
  it("importa somente válidas e identifica a inválida", () => {
    const batch = parseQuestionImportPayload({ formato: "questoes-v2", questoes: [question("a"), question("b", ""), question("c")] });
    const result = selectValidQuestionImportItems(batch.questoes, batch.questoes.map((preview) => preview.item));
    expect(result.valid.map((item) => item.chave_importacao)).toEqual(["a", "c"]);
    expect(result.skipped).toEqual([1]);
  });

  it("não considera válida uma questão inválida por regra específica do formato v2", () => {
    const batch = parseQuestionImportPayload({ formato: "questoes-v2", questoes: [question("a"), question("", "Sem chave")] });
    const result = selectValidQuestionImportItems(batch.questoes, batch.questoes.map((preview) => preview.item));
    expect(result.valid).toHaveLength(1);
    expect(result.skipped).toEqual([1]);
  });

  it("revalida no servidor antes de selecionar", () => {
    const batch = parseQuestionImportPayload({ formato: "questoes-v2", questoes: [question("a")] });
    const changed = { ...batch.questoes[0].item, enunciado: "" };
    expect(selectValidQuestionImportItems(batch.questoes, [changed]).valid).toHaveLength(0);
  });

  it("rejeita rascunho inconsistente", () => {
    expect(() => selectValidQuestionImportItems([], [parseQuestionImportPayload(question("a")).questoes[0].item])).toThrow(/inconsistente/);
  });
});
