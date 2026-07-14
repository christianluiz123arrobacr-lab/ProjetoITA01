import { describe, expect, it } from "vitest";
import { parseQuestionImportPayload, validateQuestionImportItem } from "../shared/questionImportSchema";

const validQuestion = {
  id_importacao: "questao-001",
  disciplina: "matematica",
  dificuldade: "medio",
  conteudos: ["algebra"],
  assuntos_por_conteudo: [{ conteudo: "algebra", assuntos: ["equações"] }],
  enunciado: "Texto da questão",
  alternativas: { a: "A", b: "B", c: "C", d: "D", e: "" },
  alternativa_correta: "c",
  resolucao_blocos: [
    { tipo: "texto", texto: "Passo 1", ordem: 1 },
    { tipo: "latex", texto: "$$x=1$$", ordem: 2 },
  ],
};

describe("questionImportSchema", () => {
  it("aceita JSON novo de lote com questão válida e alternativa E vazia", () => {
    const batch = parseQuestionImportPayload({ versao: "1.0", tipo: "importacao_lote_questoes", questoes: [validQuestion] });
    expect(batch.summary.total).toBe(1);
    expect(batch.summary.validas).toBe(1);
    expect(batch.questoes[0].warnings).toContain("Alternativa E vazia.");
  });

  it("aceita JSON antigo de questão única", () => {
    const batch = parseQuestionImportPayload(validQuestion);
    expect(batch.tipo).toBe("questao_unica_antiga");
    expect(batch.summary.validas).toBe(1);
  });

  it("marca alternativa correta vazia como inválida", () => {
    const batch = parseQuestionImportPayload({ ...validQuestion, alternativa_correta: "" });
    expect(batch.summary.invalidas).toBe(1);
    expect(batch.questoes[0].errors.join(" ")).toContain("Alternativa correta obrigatória");
  });

  it("marca alternativa correta apontando para opção vazia como inválida", () => {
    const batch = parseQuestionImportPayload({ ...validQuestion, alternativas: { a: "A", b: "B", c: "", d: "D", e: "" }, alternativa_correta: "c" });
    expect(batch.summary.invalidas).toBe(1);
    expect(batch.questoes[0].errors.join(" ")).toContain("alternativa vazia");
  });

  it("mantém hashes estáveis para evitar duplicação", () => {
    const first = parseQuestionImportPayload(validQuestion).questoes[0].item;
    const second = parseQuestionImportPayload(validQuestion).questoes[0].item;
    expect(first.import_hash).toBe(second.import_hash);
  });

  it("valida lotes com oito questões válidas", () => {
    const questoes = Array.from({ length: 8 }, (_, index) => ({ ...validQuestion, id_importacao: `questao-${index}` }));
    const batch = parseQuestionImportPayload({ questoes });
    expect(batch.summary.total).toBe(8);
    expect(batch.summary.validas).toBe(8);
  });

  it("rejeita tipo de bloco não suportado", () => {
    const batch = parseQuestionImportPayload({ ...validQuestion, resolucao_blocos: [{ tipo: "video", texto: "x" }] });
    expect(batch.summary.invalidas).toBe(1);
  });

  it("revalida item normalizado no backend", () => {
    const item = parseQuestionImportPayload(validQuestion).questoes[0].item;
    expect(validateQuestionImportItem(item).status).toBe("valida");
  });
});
