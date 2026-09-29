import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { VectorPdf, generateQuestionPdf, measurePdfMath } from "../client/src/lib/questionPdfGenerator";
import { PdfUnicodeFont } from "../client/src/lib/questionPdfUnicodeFont";
import type { Question } from "../client/src/types/question";

const fontBytes = readFileSync(new URL("../client/public/fonts/pdf/DejaVuSans.ttf", import.meta.url));
const logo = readFileSync(new URL("../client/public/brand/projeto-vetor-logo.svg", import.meta.url), "utf8");
const text = "x∈N; x∉N; k×x; α θ ≤ ≥ ≠ → − √ ∞; x² x³ x⁴ x₁ x₂; ação, português, órgãos?";
const formula = String.raw`x\in N, x\notin N, k\times x, \alpha, \theta, x\le y, x\ge y, x\ne y, x\to y, -x, \sqrt{x^2}, \infty, x_1^4`;

function mockAssets() {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(url.endsWith(".ttf") ? fontBytes : logo)));
}
// Inspect the actual content operators, including marked-content Unicode.
// Rendering and independent extraction are also checked on the local artifact.
async function extract(blob: Blob) {
  const source = new TextDecoder("latin1").decode(await blob.arrayBuffer());
  const objects = new Map(Array.from(source.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g), m => [Number(m[1]), m[2]]));
  const unicode = (hex: string) => {
    const units = hex.match(/.{4}/g) ?? [];
    return units.filter((u, i) => i !== 0 || u !== "FEFF").map(u => String.fromCharCode(parseInt(u, 16))).join("");
  };
  return Array.from(objects.values()).filter(o => /\/Type \/Page\s/.test(o)).map(page => {
    const contentId = Number(page.match(/\/Contents (\d+) 0 R/)![1]);
    const content = objects.get(contentId)!;
    let depth = 0; let output = "";
    for (const token of content.matchAll(/\/ActualText <([A-F0-9]+)> >> BDC|\bEMC\b|\(((?:\\.|[^\\()])*)\) Tj/g)) {
      if (token[1]) { if (depth === 0) output += unicode(token[1]); depth++; }
      else if (token[0] === "EMC") depth--;
      else if (depth === 0) {
        const bytes = token[2].replace(/\\([0-7]{3}|n|[()\\])/g, (_, escaped) => escaped === "n" ? "\n" : /^[0-7]{3}$/.test(escaped) ? String.fromCharCode(parseInt(escaped, 8)) : escaped);
        output += new TextDecoder("windows-1252").decode(Uint8Array.from(bytes, c => c.charCodeAt(0)));
      }
    }
    return output;
  });
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Unicode no PDF real de questões", () => {
  it("extrai símbolos, scripts, acentos e somente a interrogação original", async () => {
    mockAssets();
    const pdf = new VectorPdf(""); pdf.addPage();
    pdf.text(text, 44, 100, 10);
    const blob = await pdf.blob("Unicode 😀");
    const extracted = (await extract(blob)).join("");
    for (const expected of ["x∈N", "x∉N", "k×x", "α", "θ", "≤", "≥", "≠", "→", "−", "√", "∞", "x²", "x³", "x⁴", "x₁", "x₂", "ação", "português", "órgãos?"]) expect(extracted).toContain(expected);
    expect(extracted.match(/\?/g)).toHaveLength(1);
    const source = await blob.text();
    expect(source).toContain("/Subtype /CIDFontType2");
    expect(source).toContain("/FontFile2");
    expect(source).toContain("/ToUnicode");
    expect(source).not.toContain("/Subtype /Image");
    expect(source).toContain("D83DDE00"); // UTF-16 surrogate pair in metadata.
  });

  it("mantém o renderizador LaTeX vetorial e o texto matemático pesquisável", async () => {
    mockAssets();
    const pdf = new VectorPdf(""); pdf.addPage();
    measurePdfMath(formula, 10).draw(pdf, 44, 100, "#172033");
    // Raw Unicode in math leaves takes the same safe text path.
    measurePdfMath(String.raw`\text{α θ ≤ ≥ ≠ → − √ ∞ x⁴ x₂ ação?}`, 10).draw(pdf, 44, 140, "#172033");
    const blob = await pdf.blob("Matemática");
    const extracted = (await extract(blob)).join("");
    for (const expected of ["∈", "×", "α", "θ", "≤", "≥", "≠", "→", "−", "√", "∞", "⁴", "₂", "ação?"]) expect(extracted).toContain(expected);
    expect(extracted.match(/\?/g)).toHaveLength(1);
    expect(await blob.text()).not.toContain("/Subtype /Image");
  });

  it("exporta enunciado e alternativas com cabeçalho, marca d'água, resolução e gabarito", async () => {
    mockAssets();
    let exported: Blob | undefined;
    vi.spyOn(URL, "createObjectURL").mockImplementation(blob => { exported = blob as Blob; return "blob:test"; });
    vi.stubGlobal("document", { createElement: () => ({ click: vi.fn(), remove: vi.fn() }), body: { appendChild: vi.fn() } });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    const question: Question = {
      id: "unicode", subject: "matematica", topic: "Álgebra", institution: "ITA", year: 2026,
      statement: `${text}\n$${formula}$`,
      options: [{ id: "a", label: "A", text }, { id: "b", label: "B", text: `$${formula}$` }],
      correctOptionId: "a", difficulty: "medio",
    };
    const result = await generateQuestionPdf({ questions: [question], filterSummary: "Teste Unicode · Matemática" });
    expect(result.pages).toBe(2);
    const pages = await extract(exported!);
    const extracted = pages.join("\n");
    expect(extracted.match(/\?/g)).toHaveLength(2);
    expect(extracted.match(/x∈N/g)?.length).toBeGreaterThanOrEqual(2);
    for (const expected of ["PROJETO VETOR", "ESPAÇO PARA RESOLUÇÃO", "GABARITO", "ação", "α", "θ", "∞"]) expect(extracted).toContain(expected);
    const source = await exported!.text();
    expect(source.match(/\/GS1 gs/g)).toHaveLength(result.pages);
    expect(source).not.toContain("/Subtype /Image");
    if (process.env.PDF_UNICODE_OUTPUT) {
      mkdirSync(path.dirname(process.env.PDF_UNICODE_OUTPUT), { recursive: true });
      writeFileSync(process.env.PDF_UNICODE_OUTPUT, new Uint8Array(await exported!.arrayBuffer()));
    }
  });

  it("falha explicitamente quando não há glifo, sem gravar um PDF corrompido", async () => {
    mockAssets();
    const pdf = new VectorPdf(""); pdf.addPage(); pdf.text("\u{10FFFF}", 44, 100);
    await expect(pdf.blob("Sem glifo")).rejects.toThrow("U+10FFFF");
  });

  it("resolve glifos Unicode além do BMP e recusa glifo zero", () => {
    const font = new PdfUnicodeFont(fontBytes);
    expect(font.glyph("😀").id).toBeGreaterThan(0);
    expect(font.glyph("⁴").width).toBeGreaterThan(0);
    expect(() => font.glyph("\u{10FFFF}")).toThrow("não foi substituído");
  });
});
