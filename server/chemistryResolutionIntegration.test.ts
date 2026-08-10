import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const quiz = readFileSync(new URL("../client/src/components/InteractiveQuiz.tsx", import.meta.url), "utf8");
const structureRenderer = readFileSync(new URL("../client/src/lib/chemicalStructureSvg.ts", import.meta.url), "utf8");

describe("integração dos blocos químicos na resolução", () => {
  it("encaminha equações químicas e moléculas ao renderizador central", () => {
    expect(quiz).toContain('block.type === "equacao_quimica" || block.type === "molecula"');
    expect(quiz).toContain("<ChemistryResolutionBlock");
  });

  it("não contém o antigo parser ou posicionador manual de SMILES", () => {
    expect(structureRenderer).toContain('import("openchemlib")');
    expect(structureRenderer).toContain("molecule.inventCoordinates()");
    expect(structureRenderer).not.toContain("type Atom =");
    expect(structureRenderer).not.toContain("const branches");
    expect(structureRenderer).not.toContain("Math.sin");
  });

  it("não injeta SVG molecular como HTML", () => {
    expect(structureRenderer).not.toContain("dangerouslySetInnerHTML");
    expect(structureRenderer).toContain("data:image/svg+xml");
    expect(structureRenderer).toContain("FORBIDDEN_SVG");
  });
});
