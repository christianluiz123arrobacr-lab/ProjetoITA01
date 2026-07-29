import type { Question } from "@/types/question";
import { normalizeMathSource, renderMathToMathMl } from "./mathRendering";
import { buildPdfFileName, chunkAnswers, fitPdfImage, getQuestionPdfTags, QUESTION_PDF_LAYOUT } from "./questionPdfLayout";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_TOP = 82;
const CONTENT_BOTTOM = 790;
const NAVY = "#082a4f";
const CYAN = "#16b8cf";
const BODY = "#172033";
const IVORY = "#fffdf4";

type PdfTextSegment = { kind: "text" | "math"; value: string; display: boolean };
type MathTree = { tag: string; text: string; children: MathTree[] };
type MathBox = { width: number; height: number; baseline: number; draw: (pdf: VectorPdf, x: number, top: number, color: string) => void };
type PdfImage = { bytes: Uint8Array; width: number; height: number };
type Page = { commands: string[]; images: Set<number> };

const PDF_MATH_CACHE = new Map<string, MathBox>();
const enc = new TextEncoder();
const concat = (parts: Uint8Array[]) => {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
};

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map(char => char + char).join("") : value;
  return [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16) / 255).map(value => value.toFixed(3)).join(" ");
}

function pdfString(value: string) {
  return `(${Array.from(value).map(char => {
    const code = char.charCodeAt(0);
    if (char === "(" || char === ")" || char === "\\") return `\\${char}`;
    if (code === 10) return "\\n";
    if (code >= 32 && code <= 126) return char;
    if (code >= 127 && code <= 255) return `\\${code.toString(8).padStart(3, "0")}`;
    return "?";
  }).join("")})`;
}

function pdfUnicode(value: string) {
  const bytes = [0xfe, 0xff];
  for (const char of value) { const code = char.charCodeAt(0); bytes.push(code >> 8, code & 255); }
  return `<${bytes.map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}>`;
}

const greekSymbolMap: Record<string, string> = {
  "α": "a", "β": "b", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "h", "θ": "q", "ι": "i", "κ": "k", "λ": "l", "μ": "m", "ν": "n", "ξ": "x", "ο": "o", "π": "p", "ρ": "r", "σ": "s", "τ": "t", "υ": "u", "φ": "f", "χ": "c", "ψ": "y", "ω": "w",
  "Γ": "G", "Δ": "D", "Θ": "Q", "Λ": "L", "Ξ": "X", "Π": "P", "Σ": "S", "Φ": "F", "Ψ": "Y", "Ω": "W", "∑": "S", "∏": "P", "∞": "¥", "±": "±", "×": "´", "≤": "£", "≥": "³", "≠": "¹", "∈": "Î", "→": "®", "−": "-", "′": "'", "·": "×",
};

function textWidth(value: string, size: number, bold = false) {
  return Array.from(value).reduce((sum, char) => sum + size * (char === " " ? 0.28 : /[ilI.,:;'|]/.test(char) ? 0.25 : /[MW@%]/.test(char) ? 0.82 : bold ? 0.56 : 0.52), 0);
}

export class VectorPdf {
  pages: Page[] = [];
  images: PdfImage[] = [];
  page!: Page;

  addPage() { this.page = { commands: [], images: new Set() }; this.pages.push(this.page); }
  command(value: string) { this.page.commands.push(value); }
  text(value: string, x: number, top: number, size = 10.5, bold = false, color = BODY, symbol = false) {
    if (!value) return;
    this.command(`BT /${symbol ? "FS" : bold ? "FB" : "FR"} ${size.toFixed(2)} Tf ${rgb(color)} rg 1 0 0 1 ${x.toFixed(2)} ${(PAGE_HEIGHT - top).toFixed(2)} Tm ${pdfString(value)} Tj ET`);
  }
  mixedText(value: string, x: number, top: number, size: number, color: string) {
    let cursor = x; let buffer = "";
    const flush = () => { if (buffer) { this.text(buffer, cursor, top, size, false, color); cursor += textWidth(buffer, size); buffer = ""; } };
    for (const char of value) {
      const mapped = greekSymbolMap[char];
      if (mapped) { flush(); this.text(mapped, cursor, top, size, false, color, true); cursor += size * 0.6; }
      else buffer += char;
    }
    flush();
  }
  line(x1: number, top1: number, x2: number, top2: number, color = BODY, width = 0.7) {
    this.command(`${rgb(color)} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${(PAGE_HEIGHT - top1).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_HEIGHT - top2).toFixed(2)} l S`);
  }
  rect(x: number, top: number, width: number, height: number, color: string) {
    this.command(`${rgb(color)} rg ${x.toFixed(2)} ${(PAGE_HEIGHT - top - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }
  watermark() {
    this.command("q /GS1 gs");
    this.text("PROJETO", 112, 435, 58, true, NAVY);
    this.text("VETOR", 202, 500, 58, true, CYAN);
    this.command("Q");
  }
  addImage(image: PdfImage, x: number, top: number, width: number, height: number) {
    const index = this.images.push(image) - 1;
    this.page.images.add(index);
    this.command(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${(PAGE_HEIGHT - top - height).toFixed(2)} cm /Im${index} Do Q`);
  }
  blob(subject: string) {
    const objects: Uint8Array[] = [];
    const put = (id: number, value: string | Uint8Array) => { objects[id - 1] = typeof value === "string" ? enc.encode(value) : value; };
    put(1, "<< /Type /Catalog /Pages 2 0 R >>");
    put(3, `<< /Title ${pdfUnicode("Projeto Vetor - Lista personalizada de questões")} /Author ${pdfUnicode("Projeto Vetor")} /Subject ${pdfUnicode(subject)} >>`);
    put(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    put(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    put(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Symbol >>");
    put(7, "<< /Type /ExtGState /ca 0.055 /CA 0.055 >>");
    const imageStart = 8;
    this.images.forEach((image, index) => {
      const header = enc.encode(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`);
      put(imageStart + index, concat([header, image.bytes, enc.encode("\nendstream")]));
    });
    const pageStart = imageStart + this.images.length;
    const pageIds: number[] = [];
    this.pages.forEach((page, index) => {
      const contentId = pageStart + index * 2;
      const pageId = contentId + 1; pageIds.push(pageId);
      const stream = page.commands.join("\n");
      put(contentId, `<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`);
      const xObjects = Array.from(page.images).map(image => `/Im${image} ${imageStart + image} 0 R`).join(" ");
      put(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /FR 4 0 R /FB 5 0 R /FS 6 0 R >> /ExtGState << /GS1 7 0 R >> /XObject << ${xObjects} >> >> /Contents ${contentId} 0 R >>`);
    });
    put(2, `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`);
    const header = enc.encode("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n"); const parts = [header]; const offsets = [0]; let cursor = header.length;
    objects.forEach((object, index) => { offsets.push(cursor); const wrapped = concat([enc.encode(`${index + 1} 0 obj\n`), object, enc.encode("\nendobj\n")]); parts.push(wrapped); cursor += wrapped.length; });
    const xrefOffset = cursor;
    const xref = [`xref\n0 ${objects.length + 1}\n`, "0000000000 65535 f \n", ...offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`)].join("");
    parts.push(enc.encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
    return new Blob([concat(parts)], { type: "application/pdf" });
  }
}

export function splitPdfMathSegments(value: string, formulaOnly = false): PdfTextSegment[] {
  const normalized = normalizeMathSource(value);
  if (formulaOnly) return [{ kind: "math", value: normalized.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""), display: true }];
  const segments: PdfTextSegment[] = []; const expression = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\(.+?\\\))/g; let cursor = 0;
  for (const match of Array.from(normalized.matchAll(expression))) {
    const index = match.index ?? 0; if (index > cursor) segments.push({ kind: "text", value: normalized.slice(cursor, index), display: false });
    const source = match[0]; segments.push({ kind: "math", value: source.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""), display: source.startsWith("$$") || source.startsWith("\\[") }); cursor = index + source.length;
  }
  if (cursor < normalized.length) segments.push({ kind: "text", value: normalized.slice(cursor), display: false });
  return segments.length ? segments : [{ kind: "text", value: normalized, display: false }];
}

function parseMathMl(value: string): MathTree {
  const root: MathTree = { tag: "root", text: "", children: [] }; const stack = [root];
  for (const token of value.replace(/<annotation[\s\S]*?<\/annotation>/gi, "").match(/<[^>]+>|[^<]+/g) ?? []) {
    if (token.startsWith("</")) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith("<")) { if (token.startsWith("<!")) continue; const tag = token.match(/^<\s*([\w:-]+)/)?.[1]?.split(":").pop()?.toLowerCase() ?? "span"; const node = { tag, text: "", children: [] } as MathTree; stack.at(-1)!.children.push(node); if (!token.endsWith("/>")) stack.push(node); continue; }
    stack.at(-1)!.text += token.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  return root;
}

function mathBox(node: MathTree, size: number): MathBox {
  const children = node.children.map(child => mathBox(child, size)); const leaf = node.text.trim();
  if (leaf && !children.length) {
    const width = Math.max(size * 0.28, textWidth(leaf, size));
    return { width, height: size * 1.18, baseline: size * 0.88, draw: (pdf, x, top, color) => pdf.mixedText(leaf, x, top + size * 0.88, size, color) };
  }
  if (node.tag === "mfrac") {
    const numerator = children[0] ?? mathBox({ tag: "mn", text: "?", children: [] }, size * 0.82); const denominator = children[1] ?? numerator; const width = Math.max(numerator.width, denominator.width) + 6; const gap = 3;
    return { width, height: numerator.height + denominator.height + gap * 2, baseline: numerator.height + gap + denominator.baseline, draw: (pdf, x, top, color) => { numerator.draw(pdf, x + (width - numerator.width) / 2, top, color); const lineTop = top + numerator.height + gap; pdf.line(x, lineTop, x + width, lineTop, color, 0.65); denominator.draw(pdf, x + (width - denominator.width) / 2, lineTop + gap, color); } };
  }
  if (node.tag === "msqrt" || node.tag === "mroot") {
    const radicand = children[0] ?? sequence(children, size); const index = node.tag === "mroot" ? children[1] : null; const lead = size * 0.7 + (index?.width ?? 0) * 0.45; const height = Math.max(radicand.height + 3, size * 1.3);
    return { width: lead + radicand.width + 2, height, baseline: Math.max(radicand.baseline + 3, size), draw: (pdf, x, top, color) => { if (index) index.draw(pdf, x, top, color); const rootX = x + (index?.width ?? 0) * 0.45; pdf.line(rootX, top + height * 0.58, rootX + size * 0.18, top + height * 0.78, color); pdf.line(rootX + size * 0.18, top + height * 0.78, rootX + size * 0.38, top + 3, color); pdf.line(rootX + size * 0.38, top + 3, rootX + lead + radicand.width, top + 3, color); radicand.draw(pdf, rootX + lead, top + 3, color); } };
  }
  if (["msup", "msub", "msubsup"].includes(node.tag)) {
    const base = children[0] ?? sequence([], size); const sub = node.tag !== "msup" ? children[1] : null; const sup = node.tag === "msup" ? children[1] : node.tag === "msubsup" ? children[2] : null; const scriptWidth = Math.max(sub?.width ?? 0, sup?.width ?? 0); const topExtra = sup ? sup.height * 0.58 : 0; const bottomExtra = sub ? sub.height * 0.52 : 0;
    return { width: base.width + scriptWidth, height: topExtra + base.height + bottomExtra, baseline: topExtra + base.baseline, draw: (pdf, x, top, color) => { base.draw(pdf, x, top + topExtra, color); if (sup) sup.draw(pdf, x + base.width, top, color); if (sub) sub.draw(pdf, x + base.width, top + topExtra + base.baseline * 0.65, color); } };
  }
  if (node.tag === "mtable") {
    const rows = children; const width = Math.max(0, ...rows.map(row => row.width)) + 10; const height = rows.reduce((sum, row) => sum + row.height + 2, 0);
    return { width, height, baseline: height / 2 + size * 0.35, draw: (pdf, x, top, color) => { pdf.line(x + 3, top, x, top, color); pdf.line(x, top, x, top + height, color); pdf.line(x, top + height, x + 3, top + height, color); let rowTop = top; rows.forEach(row => { row.draw(pdf, x + 5, rowTop, color); rowTop += row.height + 2; }); pdf.line(x + width - 3, top, x + width, top, color); pdf.line(x + width, top, x + width, top + height, color); pdf.line(x + width, top + height, x + width - 3, top + height, color); } };
  }
  return sequence(children, size, leaf);
}

function sequence(children: MathBox[], size: number, own = ""): MathBox {
  const ownBox = own ? mathBox({ tag: "mtext", text: own, children: [] }, size) : null; const items = ownBox ? [ownBox, ...children] : children; const baseline = Math.max(size * 0.88, ...items.map(item => item.baseline)); const descent = Math.max(size * 0.25, ...items.map(item => item.height - item.baseline));
  return { width: items.reduce((sum, item) => sum + item.width, 0), height: baseline + descent, baseline, draw: (pdf, x, top, color) => { let cursor = x; items.forEach(item => { item.draw(pdf, cursor, top + baseline - item.baseline, color); cursor += item.width; }); } };
}

export function measurePdfMath(value: string, fontSize = 10.5) {
  try {
    const key = `${fontSize}|${value}`; const cached = PDF_MATH_CACHE.get(key); if (cached) return cached;
    const tree = parseMathMl(renderMathToMathMl(normalizeMathSource(value))); const box = mathBox(tree, fontSize); PDF_MATH_CACHE.set(key, box); return box;
  } catch (error) {
    if (import.meta.env?.DEV) console.warn("Fórmula inválida no PDF; usando texto seguro.", { formula: value, error });
    return mathBox({ tag: "mtext", text: value.replace(/[{}$]/g, ""), children: [] }, fontSize);
  }
}

const superscriptMap: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", "′": "′" };
const subscriptMap: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎" };
function mappedScript(value: string, map: Record<string, string>, fallback: "^" | "_") { const converted = Array.from(value).map(char => map[char]).join(""); return converted.length === value.length ? converted : `${fallback}(${value})`; }
function mathTreeToText(node: MathTree): string {
  if (node.tag === "annotation" || node.tag === "annotation-xml") return "";
  const children = node.children.map(mathTreeToText); const own = node.text.trim();
  if (node.tag === "mspace") return " ";
  if (node.tag === "mfrac") return `(${children[0] ?? ""})/(${children[1] ?? ""})`;
  if (node.tag === "msqrt") return `√(${children.join("")})`;
  if (node.tag === "mroot") return `√[${children[1] ?? ""}](${children[0] ?? ""})`;
  if (node.tag === "msup") return `${children[0] ?? ""}${mappedScript(children[1] ?? "", superscriptMap, "^")}`;
  if (node.tag === "msub") return `${children[0] ?? ""}${mappedScript(children[1] ?? "", subscriptMap, "_")}`;
  if (node.tag === "msubsup") return `${children[0] ?? ""}${mappedScript(children[1] ?? "", subscriptMap, "_")}${mappedScript(children[2] ?? "", superscriptMap, "^")}`;
  return own + children.join("");
}

export function latexToPdfText(value: string, formulaOnly = false) {
  const render = (formula: string) => {
    try { return mathTreeToText(parseMathMl(renderMathToMathMl(formula))).replace(/\u2061/g, "").replace(/\s+/g, " ").trim() || formula; }
    catch { return formula.replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}$]/g, ""); }
  };
  const normalized = normalizeMathSource(value);
  if (formulaOnly) return render(normalized.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""));
  return normalized.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => `\n${render(formula)}\n`).replace(/\$([^$]+?)\$/g, (_, formula) => render(formula)).replace(/\\\[([\s\S]+?)\\\]/g, (_, formula) => `\n${render(formula)}\n`).replace(/\\\((.+?)\\\)/g, (_, formula) => render(formula)).replace(/([^\n]{3,})\.\1(?=\s|$)/g, "$1");
}

function comparableMath(value: string, formulaOnly = false) { return latexToPdfText(value, formulaOnly).toLowerCase().replace(/[^a-z0-9À-ÿ]+/g, ""); }
export function shouldRenderStandaloneFormula(statement: string, formula?: string) { if (!formula?.trim()) return false; const rendered = comparableMath(formula, true); return Boolean(rendered) && !comparableMath(statement).includes(rendered); }
export function isSafePdfMathSvg(value: string) { return !/<foreignObject\b/i.test(value) && !/(?:href|src)\s*=\s*["']https?:/i.test(value) && /^<svg\b/i.test(value.trim()); }
export function getPdfMathVectorSize(viewBoxWidth: number, viewBoxHeight: number, fontSize: number) { const height = Math.max(fontSize, (viewBoxHeight / 1000) * fontSize); return { width: height * (viewBoxWidth / viewBoxHeight), height }; }

export async function buildVectorPdfTestDocument(text = "Enunciado selecionável", pageCount = 1) {
  const pdf = new VectorPdf();
  for (let page = 0; page < pageCount; page += 1) { pdf.addPage(); pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, IVORY); pdf.watermark(); pdf.text(text, MARGIN, 100, 11, false, BODY); }
  return new Uint8Array(await pdf.blob("Teste vetorial").arrayBuffer());
}

async function loadPdfImage(url?: string): Promise<PdfImage | null> {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin); if (parsed.origin !== window.location.origin && !parsed.hostname.endsWith(".supabase.co")) return null;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const item = new Image(); item.crossOrigin = "anonymous"; item.onload = () => resolve(item); item.onerror = reject; item.src = parsed.href; });
    // Canvas is used only to encode the individual question image as JPEG; no
    // page, text, formula, header, or watermark is ever rasterized.
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const context = canvas.getContext("2d"); if (!context) return null; context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9)); if (!blob) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  } catch { return null; }
}

export async function generateQuestionPdf(input: { questions: Question[]; filterSummary: string; logoUrl?: string }) {
  if (!input.questions.length) throw new Error("Nenhuma questão encontrada para exportar.");
  const pdf = new VectorPdf(); let y = CONTENT_TOP; let pageNumber = 0;
  const startPage = () => { pdf.addPage(); pageNumber += 1; pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, IVORY); pdf.watermark(); pdf.text("PROJETO VETOR", MARGIN, 31, 13, true, NAVY); pdf.text("LISTA PERSONALIZADA", MARGIN, 48, 8.5, true, CYAN); pdf.line(MARGIN, 61, PAGE_WIDTH - MARGIN, 61, "#b9d8df", 0.8); y = CONTENT_TOP; };
  const footer = () => { pdf.text("projetovetor • lista personalizada", MARGIN, 812, 7.5, false, NAVY); pdf.text(`Página ${pageNumber}`, PAGE_WIDTH - 78, 812, 7.5, false, NAVY); };
  const ensure = (height: number) => { if (y + height > CONTENT_BOTTOM) { footer(); startPage(); } };

  const richText = async (value: string, x: number, width: number, size = 10.5, color = BODY, formulaOnly = false) => {
    type Token = { kind: "text"; text: string; width: number } | { kind: "math"; box: MathBox; display: boolean; source: string };
    const tokens: Token[] = [];
    splitPdfMathSegments(value, formulaOnly).forEach(segment => {
      if (segment.kind === "math") tokens.push({ kind: "math", box: measurePdfMath(segment.value, size), display: segment.display || formulaOnly, source: segment.value });
      else segment.value.split(/(\s+|\n)/).filter(Boolean).forEach(text => tokens.push({ kind: "text", text, width: textWidth(text, size) }));
    });
    let line: Token[] = []; let used = 0;
    const flush = () => {
      if (!line.length) return;
      const lineHeight = Math.max(size * 1.45, ...line.map(token => token.kind === "math" ? token.box.height + 3 : size * 1.2)); ensure(lineHeight); let cursor = x;
      line.forEach(token => { if (token.kind === "text") { pdf.text(token.text, cursor, y + lineHeight * 0.72, size, false, color); cursor += token.width; } else { token.box.draw(pdf, cursor, y + (lineHeight - token.box.height) / 2, color); cursor += token.box.width; } });
      y += lineHeight; line = []; used = 0;
    };
    for (const token of tokens) {
      if (token.kind === "math" && token.display) { flush(); const box = token.box.width > width ? measurePdfMath(token.source, Math.max(6.5, size * width / token.box.width)) : token.box; const height = box.height + 10; ensure(height); box.draw(pdf, x + Math.max(0, (width - box.width) / 2), y + 5, color); y += height; continue; }
      if (token.kind === "text" && token.text.includes("\n")) { flush(); continue; }
      const tokenWidth = token.kind === "text" ? token.width : token.box.width;
      if (line.length && used + tokenWidth > width) flush(); line.push(token); used += tokenWidth;
    }
    flush();
  };

  const drawQuestionImage = async (url: string | undefined, maxWidth: number, maxHeight: number, x: number) => {
    const image = await loadPdfImage(url); if (!image) { ensure(18); pdf.text("Imagem indisponível", x, y + 11, 8.5, false, "#64748b"); y += 18; return; }
    const fitted = fitPdfImage(image.width, image.height, maxWidth, maxHeight); ensure(fitted.height + 8); pdf.addImage(image, x, y, fitted.width, fitted.height); y += fitted.height + 8;
  };

  startPage(); ensure(55); pdf.rect(MARGIN, y - 5, PAGE_WIDTH - MARGIN * 2, 45, "#e8f7f8"); pdf.text("Filtros aplicados", MARGIN + 10, y + 10, 8.5, true, NAVY); y += 22; await richText(input.filterSummary, MARGIN + 10, PAGE_WIDTH - MARGIN * 2 - 20, 8.5, "#29465e"); y += 12;
  for (let index = 0; index < input.questions.length; index += 1) {
    const question = input.questions[index]; ensure(70); pdf.text(`${index + 1}.`, MARGIN, y + 12, 12, true, NAVY); y += 20;
    let tagX = MARGIN; for (const tag of getQuestionPdfTags(question)) { const label = tag.toUpperCase(); const tagWidth = Math.min(textWidth(label, 7, true) + 12, 145); if (tagX + tagWidth > PAGE_WIDTH - MARGIN) { tagX = MARGIN; y += 17; } pdf.rect(tagX, y, tagWidth, 14, "#dff5f7"); pdf.text(label, tagX + 6, y + 10, 7, true, NAVY); tagX += tagWidth + 5; } y += 23;
    await richText(question.statement ?? "", MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (question.imageUrl) await drawQuestionImage(question.imageUrl, QUESTION_PDF_LAYOUT.statementImageMaxWidth, QUESTION_PDF_LAYOUT.statementImageMaxHeight, MARGIN);
    if (question.statementAfterImage) await richText(question.statementAfterImage, MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (shouldRenderStandaloneFormula(question.statement ?? "", question.formula)) { y += 4; await richText(question.formula ?? "", MARGIN + 12, PAGE_WIDTH - MARGIN * 2 - 24, 11, NAVY, true); }
    y += 7;
    for (const option of question.options) {
      const optionStart = y; const estimated = option.text ? measurePdfMath(option.text, 10).height + 19 : 20; ensure(Math.min(estimated + (option.imageUrl ? 120 : 0), 220));
      pdf.text(`${option.label})`, MARGIN + 8, y + 10, 10, true, NAVY); await richText(option.text ?? "", MARGIN + 29, PAGE_WIDTH - MARGIN * 2 - 29, 10);
      if (!option.text) y += 15; if (option.imageUrl) await drawQuestionImage(option.imageUrl, QUESTION_PDF_LAYOUT.optionImageMaxWidth, QUESTION_PDF_LAYOUT.optionImageMaxHeight, MARGIN + 29);
      y = Math.max(y, optionStart + 18) + 6;
    }
    ensure(QUESTION_PDF_LAYOUT.resolutionSpaceHeight); pdf.text("ESPAÇO PARA RESOLUÇÃO", MARGIN, y + 10, 7, true, "#52677b"); y += QUESTION_PDF_LAYOUT.resolutionSpaceHeight;
  }
  footer();
  for (const columns of chunkAnswers(input.questions.map(question => question.correctOptionId), 5, 12)) {
    startPage(); pdf.text("GABARITO", MARGIN, y + 15, 16, true, NAVY); y += 34; const columnWidth = (PAGE_WIDTH - MARGIN * 2) / 5;
    columns.forEach((column, columnIndex) => column.forEach((item, row) => { const top = y + row * 21; if (row % 2) pdf.rect(MARGIN + columnIndex * columnWidth, top - 11, columnWidth - 5, 18, "#f0f8f8"); pdf.text(`${item.number}. ${item.answer}`, MARGIN + columnIndex * columnWidth + 6, top + 2, 10, true, NAVY); })); footer();
  }
  const blob = pdf.blob(input.filterSummary); const fileName = buildPdfFileName(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; link.hidden = true; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return { fileName, pages: pdf.pages.length, questions: input.questions.length };
}
