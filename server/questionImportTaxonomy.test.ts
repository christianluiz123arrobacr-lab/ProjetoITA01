import { describe, expect, it } from "vitest";
import { getExistingQuestionTaxonomy } from "../shared/questionImportTaxonomy";

describe("getExistingQuestionTaxonomy", () => {
  it("lê listas e grupos de assuntos já existentes", () => {
    const result = getExistingQuestionTaxonomy([{ conteudos: ["Álgebra"], assuntos_por_conteudo: [{ conteudo: "Geometria", assuntos: ["Triângulos"] }] }]);
    expect([...result.contents]).toEqual(["algebra", "geometria"]);
    expect([...result.subjects]).toEqual(["triangulos"]);
  });

  it("não quebra com campos legados em formato de objeto", () => {
    const result = getExistingQuestionTaxonomy([
      { conteudo: "Funções", conteudos: { antigo: "Funções" }, assuntos: { antigo: "Afim" }, assuntos_por_conteudo: { "Funções": ["Quadrática"] } },
      { assuntos_por_conteudo: { conteudo: "Cálculo", assuntos: ["Limites"] } },
      { conteudos: null, assuntos_por_conteudo: 42 },
      null,
    ]);
    expect(result.contents).toEqual(new Set(["funcoes", "calculo"]));
    expect(result.subjects).toEqual(new Set(["quadratica", "limites"]));
  });

  it("tolera resposta inesperada sem derrubar a tela", () => {
    expect(getExistingQuestionTaxonomy({ rows: [] })).toEqual({ contents: new Set(), subjects: new Set() });
  });
});
