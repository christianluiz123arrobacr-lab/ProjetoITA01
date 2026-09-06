import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/lib/signedStorageUpload", () => ({ uploadToSignedStorageUrl: vi.fn() }));
import {
  initialForm,
  mapQuestionJsonToForm,
  normalizeImportedQuestion,
  readResolutionBlocks,
} from "../client/src/pages/AdminQuestionCreatePage";
import { normalizeMathSource, renderMathToMathMl } from "../client/src/lib/mathRendering";

const chemistryJson = JSON.stringify({
  enunciado: String.raw`A reação é $\ce{2H2 + O2 -> 2H2O}$.`,
  enunciado_pos_imagem: String.raw`Produto: $\ce{H2O}$.`,
  A: String.raw`$\ce{H2O}$`,
  B: String.raw`$\ce{CO2}$`,
  C: String.raw`$\ce{O2}$`,
  D: String.raw`$\ce{H2}$`,
  E: String.raw`$\ce{NaCl}$`,
  resolucao: String.raw`Pela estequiometria $\ce{2H2 + O2 -> 2H2O}$, ...`,
});

describe("suporte a LaTeX químico", () => {
  it("preserva barras nas duas entradas de importação individual", () => {
    const parsed = JSON.parse(chemistryJson);
    const expected = String.raw`\ce{2H2 + O2 -> 2H2O}`;
    const form = mapQuestionJsonToForm(parsed, initialForm);
    const blocks = readResolutionBlocks(parsed);
    const alternateImport = normalizeImportedQuestion(parsed);

    expect(form.enunciado).toContain(expected);
    expect(form.enunciado_pos_imagem).toContain(String.raw`\ce{H2O}`);
    expect([form.alternativa_a, form.alternativa_b, form.alternativa_c, form.alternativa_d, form.alternativa_e].every(value => value.includes("\\ce{"))).toBe(true);
    expect(blocks[0].texto).toContain(expected);
    expect(alternateImport.formPatch.enunciado).toContain(expected);
    expect(alternateImport.formPatch.alternativa_a).toContain(String.raw`\ce{H2O}`);
    expect(alternateImport.resolutionBlocks[0].texto).toContain(expected);
  });

  it("renderiza mhchem no KaTeX e configura também o MathJax", () => {
    const formula = String.raw`\ce{2H2 + O2 -> 2H2O}`;
    const rendered = renderMathToMathMl(formula);
    const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

    expect(normalizeMathSource(formula)).toBe(formula);
    expect(rendered).toContain("<math");
    expect(rendered).not.toContain("merror");
    expect(indexHtml).toContain('[tex]/mhchem');
    expect(indexHtml).toContain('["mhchem"]');
  });
});
