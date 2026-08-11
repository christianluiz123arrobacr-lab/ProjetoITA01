import { describe, expect, it } from "vitest";
import { buildStudyCanvasPdf, buildVectorStudyCanvasPdf, PDF_PAPER_POINTS, safePdfFileName } from "../client/src/lib/studyCanvasPdf";

describe("exportação PDF real do caderno", () => {
  it("gera bytes PDF, MIME correto e não JSON", async () => {
    const jpeg = `data:image/jpeg;base64,${btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xd9))}`;
    const blob = buildStudyCanvasPdf([{ dataUrl: jpeg, width: 1200, height: 1697 }], "Caderno de dinâmica");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(blob.type).toBe("application/pdf");
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-1.7");
    expect(new TextDecoder().decode(bytes.slice(0, 20))).not.toContain("{");
  });

  it("produz nome explícito com extensão PDF", () => {
    expect(safePdfFileName("Dinâmica — exercícios")).toBe("Dinâmica exercícios — Projeto Vetor.pdf");
  });
});

describe("PDF vetorial do caderno", () => {
  it.each(["a5", "a4", "a3"] as const)("gera %s com dimensões físicas e assinatura PDF", async paperSize => {
    const blob = buildVectorStudyCanvasPdf({ pages: [{ elements: [{ tool: "pen", color: "#000000", size: 2, points: [{ x: 10, y: 10 }, { x: 100, y: 120 }] }] }], title: "Teste", sourceWidth: 1200, sourceHeight: 1697, paperSize, lined: false });
    const text = new TextDecoder().decode(await blob.arrayBuffer());
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain(`/MediaBox [0 0 ${PDF_PAPER_POINTS[paperSize].width} ${PDF_PAPER_POINTS[paperSize].height}]`);
    expect(text).not.toContain("/Subtype /Image");
  });
  it("desenha a pauta como linhas vetoriais e pagina papel infinito", async () => {
    const blob = buildVectorStudyCanvasPdf({ pages: [{ elements: [] }], title: "Pautado", sourceWidth: 1600, sourceHeight: 5000, paperSize: "a4", lined: true, paginateInfinite: true });
    const text = new TextDecoder().decode(await blob.arrayBuffer());
    expect(text).toContain("0.82 0.88 0.94 RG");
    expect(text).toContain("/Count 3");
  });
});
