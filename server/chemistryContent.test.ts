import { describe, expect, it } from "vitest";
import katex from "katex";
import { KATEX_RENDER_OPTIONS, renderChemicalEquation } from "../client/src/lib/mathRendering";
import { smilesToSvg } from "../client/src/lib/chemicalStructureSvg";
import { chemistryResolutionSchema, parseStoredChemistryBlock } from "../shared/chemistryContent";

describe("conteúdo didático de Química", () => {
  it("preserva a renderização matemática existente", () => {
    expect(katex.renderToString("x^2 + 1", KATEX_RENDER_OPTIONS)).toContain("katex");
  });

  it("renderiza equações mhchem válidas", () => {
    const html = renderChemicalEquation(String.raw`\ce{CH3COOH + C2H5OH <=>[H+][\Delta] CH3COOC2H5 + H2O}`);
    expect(html).toContain("katex");
    expect(html).not.toContain("katex-error");
  });

  it("permite fallback quando a fórmula química é inválida", () => {
    expect(() => renderChemicalEquation(String.raw`\ce{H2O`)).toThrow();
  });

  it.each(["CCO", "CC=O", "CC(=O)O", "c1ccccc1", "CC(=O)OC"])("gera SVG vetorial para %s", (smiles) => {
    const svg = smilesToSvg(smiles);
    expect(svg).toMatch(/^<svg/);
    expect(svg).not.toContain("<script");
  });

  it("rejeita SMILES inválido", () => {
    expect(() => smilesToSvg("C(<script>")) .toThrow();
  });

  it("aceita JSON químico estruturado e mantém blocos antigos compatíveis", () => {
    expect(chemistryResolutionSchema.parse({ tipo: "resolucao_quimica", blocos: [
      { tipo: "texto", conteudo: "Oxidação parcial do etanol." },
      { tipo: "equacao_quimica", latex: String.raw`\ce{CH3CH2OH + [O] -> CH3CHO + H2O}` },
      { tipo: "molecula", smiles: "CCO", legenda: "Etanol" },
    ] }).blocos).toHaveLength(3);
    expect(parseStoredChemistryBlock({ tipo: "texto", texto: "Resolução antiga" })).toBeNull();
  });

  it.each([
    { tipo: "texto", conteudo: "<script>alert(1)</script>" },
    { tipo: "equacao_quimica", latex: String.raw`\href{https://evil.example}{x}` },
    { tipo: "molecula", smiles: "https://evil.example/a.svg" },
  ])("rejeita HTML, comandos confiáveis e conteúdo externo", (block) => {
    expect(chemistryResolutionSchema.safeParse({ tipo: "resolucao_quimica", blocos: [block] }).success).toBe(false);
  });
});
