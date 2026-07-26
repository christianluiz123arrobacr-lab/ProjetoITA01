import { describe, expect, it } from "vitest";
import { buildStudyCanvasPdf, safePdfFileName } from "../client/src/lib/studyCanvasPdf";

describe("exportação PDF real do caderno", () => {
  it("gera bytes PDF, MIME correto e não JSON", async () => {
    const jpeg = `data:image/jpeg;base64,${btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xd9))}`;
    const blob = buildStudyCanvasPdf([jpeg], "Caderno de dinâmica");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(blob.type).toBe("application/pdf");
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-1.7");
    expect(new TextDecoder().decode(bytes.slice(0, 20))).not.toContain("{");
  });

  it("produz nome explícito com extensão PDF", () => {
    expect(safePdfFileName("Dinâmica — exercícios")).toBe("dinâmica-exercícios-projeto-vetor.pdf");
  });
});
