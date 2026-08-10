import { describe, expect, it } from "vitest";
import katex from "katex";
import OCL from "openchemlib";
import { KATEX_RENDER_OPTIONS, renderChemicalEquation } from "../client/src/lib/mathRendering";
import { CHEMICAL_STRUCTURE_RENDERER, smilesToSvg } from "../client/src/lib/chemicalStructureSvg";
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

  it.each(["CCO", "CC=O", "CC(=O)O", "CC(=O)OC", "CC(C)O", "c1ccccc1", "C#N", "CCCl", "CCBr"])("gera SVG vetorial com OpenChemLib para %s", async (smiles) => {
    const svg = await smilesToSvg(smiles);
    expect(CHEMICAL_STRUCTURE_RENDERER).toBe("openchemlib");
    expect(OCL.Molecule.fromSmiles(smiles).getAllAtoms()).toBeGreaterThan(0);
    expect(svg).toMatch(/^\s*<svg/);
    expect(svg).toMatch(/<(?:path|line|polygon|polyline)\b/);
    expect(svg).not.toContain("<script");
  });

  it("interpreta benzeno como ciclo de seis átomos e seis ligações", () => {
    const benzene = OCL.Molecule.fromSmiles("c1ccccc1");
    expect(benzene.getAllAtoms()).toBe(6);
    expect(benzene.getAllBonds()).toBe(6);
  });

  it("inventa coordenadas 2D não lineares para uma molécula ramificada", () => {
    const branched = OCL.Molecule.fromSmiles("CC(C)O");
    branched.inventCoordinates();
    expect(new Set(Array.from({ length: branched.getAllAtoms() }, (_, index) => branched.getAtomY(index).toFixed(4))).size).toBeGreaterThan(1);
  });

  it("rejeita SMILES inválido", async () => {
    await expect(smilesToSvg("C(<script>")).rejects.toThrow();
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
    { tipo: "molecula", smiles: "<svg onload=alert(1)>" },
  ])("rejeita HTML, comandos confiáveis e conteúdo externo", (block) => {
    expect(chemistryResolutionSchema.safeParse({ tipo: "resolucao_quimica", blocos: [block] }).success).toBe(false);
  });
});
