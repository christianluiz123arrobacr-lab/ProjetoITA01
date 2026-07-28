import type { Question } from "@/types/question";
import { normalizeMathSource, renderMathToMathMl } from "./mathRendering";
import { buildPdfFileName, chunkAnswers, fitPdfImage, getQuestionPdfTags, QUESTION_PDF_LAYOUT } from "./questionPdfLayout";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 92;
const CONTENT_TOP = 178;
const CONTENT_BOTTOM = 1640;
const NAVY = "#082a4f";
const CYAN = "#16b8cf";
const IVORY = "#fffdf4";

type PdfPage = { jpeg: Uint8Array };
type PdfTextSegment = { kind: "text" | "math"; value: string; display: boolean };

const PDF_MATH_IMAGE_CACHE = new Map<string, Promise<HTMLImageElement | null>>();

type MathJaxSvgApi = {
  startup?: { promise?: Promise<unknown> };
  tex2svgPromise?: (formula: string, options?: { display?: boolean }) => Promise<HTMLElement>;
};

function getMathJaxSvgApi() {
  return (window as typeof window & { MathJax?: MathJaxSvgApi }).MathJax;
}

async function waitForMathJaxSvg(timeoutMs = 4_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const api = getMathJaxSvgApi();
    if (typeof api?.tex2svgPromise === "function") {
      if (api.startup?.promise) await api.startup.promise;
      return api;
    }
    await new Promise(resolve => window.setTimeout(resolve, 40));
  }
  return null;
}

/** Rejects SVG features that would taint the page canvas during PDF rasterization. */
export function isSafePdfMathSvg(value: string) {
  return !/<foreignObject\b/i.test(value)
    && !/(?:href|src)\s*=\s*["']https?:/i.test(value)
    && /^<svg\b/i.test(value.trim());
}

/** MathJax uses 1000 viewBox units per em. This keeps glyphs level with prose. */
export function getPdfMathRasterSize(viewBoxWidth: number, viewBoxHeight: number, fontSize: number) {
  const safeWidth = Number.isFinite(viewBoxWidth) && viewBoxWidth > 0 ? viewBoxWidth : 1000;
  const safeHeight = Number.isFinite(viewBoxHeight) && viewBoxHeight > 0 ? viewBoxHeight : 1000;
  const height = Math.max(fontSize * 0.72, Math.min(fontSize * 2.2, (safeHeight / 1000) * fontSize));
  return {
    width: Math.max(2, height * (safeWidth / safeHeight)),
    height,
  };
}

/** Keeps prose and TeX separate so formulas can be typeset instead of flattened to ASCII. */
export function splitPdfMathSegments(value: string, formulaOnly = false): PdfTextSegment[] {
  const normalized = normalizeMathSource(value);
  if (formulaOnly) {
    return [{
      kind: "math",
      value: normalized.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""),
      display: true,
    }];
  }

  const segments: PdfTextSegment[] = [];
  const expression = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\(.+?\\\))/g;
  let cursor = 0;
  for (const match of Array.from(normalized.matchAll(expression))) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ kind: "text", value: normalized.slice(cursor, index), display: false });
    const source = match[0];
    const display = source.startsWith("$$") || source.startsWith("\\[");
    segments.push({
      kind: "math",
      value: source.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""),
      display,
    });
    cursor = index + source.length;
  }
  if (cursor < normalized.length) segments.push({ kind: "text", value: normalized.slice(cursor), display: false });
  return segments.length ? segments : [{ kind: "text", value: normalized, display: false }];
}

async function renderMathImage(formula: string, fontSize: number, color: string) {
  const key = `${fontSize}|${color}|${formula}`;
  const cached = PDF_MATH_IMAGE_CACHE.get(key);
  if (cached) return cached;

  const pending = new Promise<HTMLImageElement | null>(resolve => {
    void (async () => {
      try {
      const api = await waitForMathJaxSvg();
      if (!api?.tex2svgPromise) { resolve(null); return; }
      const wrapper = await api.tex2svgPromise(normalizeMathSource(formula), { display: false });
      const sourceSvg = wrapper.querySelector("svg");
      if (!sourceSvg) { resolve(null); return; }
      const svg = sourceSvg.cloneNode(true) as SVGSVGElement;
      const viewBox = svg.viewBox.baseVal;
      const rasterSize = getPdfMathRasterSize(viewBox.width, viewBox.height, fontSize);
      const height = Math.ceil(rasterSize.height);
      const width = Math.ceil(rasterSize.width);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("color", color);
      svg.style.color = color;
      svg.style.verticalAlign = "initial";
      const serialized = new XMLSerializer().serializeToString(svg);
      if (!isSafePdfMathSvg(serialized)) { resolve(null); return; }
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
      } catch {
        resolve(null);
      }
    })();
  });
  PDF_MATH_IMAGE_CACHE.set(key, pending);
  return pending;
}

function decodeDataUrl(dataUrl: string) {
  const binary = atob(dataUrl.split(",")[1] ?? "");
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function concat(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((sum, item) => sum + item.length, 0));
  let offset = 0;
  parts.forEach(item => { output.set(item, offset); offset += item.length; });
  return output;
}

const encode = (value: string) => new TextEncoder().encode(value);

function pdfUnicode(value: string) {
  const bytes = [0xfe, 0xff];
  for (const char of value) {
    const code = char.charCodeAt(0);
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  return `<${bytes.map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}>`;
}

function buildRasterPdf(pages: PdfPage[], subject: string) {
  const objects: Uint8Array[] = [];
  const pageIds = pages.map((_, index) => 6 + index * 3);
  objects[0] = encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[1] = encode(`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`);
  objects[2] = encode(`<< /Title ${pdfUnicode("Projeto Vetor - Lista personalizada de questões")} /Author ${pdfUnicode("Projeto Vetor")} /Subject ${pdfUnicode(subject)} >>`);
  objects[3] = encode("<< >>");
  objects[4] = encode("<< >>");

  pages.forEach((page, index) => {
    const imageId = 4 + index * 3;
    const contentId = 5 + index * 3;
    const pageId = 6 + index * 3;
    const imageHeader = encode(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`);
    objects[imageId - 1] = concat([imageHeader, page.jpeg, encode("\nendstream")]);
    const stream = `q 595 0 0 842 0 0 cm /Im${index} Do Q`;
    objects[contentId - 1] = encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects[pageId - 1] = encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });

  const header = encode("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n");
  const parts = [header];
  const offsets = [0];
  let cursor = header.length;
  objects.forEach((object, index) => {
    offsets.push(cursor);
    const wrapped = concat([encode(`${index + 1} 0 obj\n`), object, encode("\nendobj\n")]);
    parts.push(wrapped);
    cursor += wrapped.length;
  });
  const xrefOffset = cursor;
  const xref = [`xref\n0 ${objects.length + 1}\n`, "0000000000 65535 f \n", ...offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`)].join("");
  parts.push(encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
  return new Blob([concat(parts)], { type: "application/pdf" });
}

function isTrustedImageUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin || url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

async function loadImage(url?: string) {
  if (!url || !isTrustedImageUrl(url)) return null;
  return new Promise<HTMLImageElement | null>(resolve => {
    const image = new Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), 8_000);
    image.crossOrigin = "anonymous";
    image.onload = () => finish(image);
    image.onerror = () => {
      try { console.warn("Imagem indisponível durante a exportação do PDF", { host: new URL(url, window.location.origin).hostname }); } catch { /* URL já foi rejeitada */ }
      finish(null);
    };
    image.src = url;
  });
}

type MathTree = { tag: string; text: string; children: MathTree[] };

function parseMathMl(value: string): MathTree {
  const root: MathTree = { tag: "root", text: "", children: [] };
  const stack = [root];
  const tokens = value.replace(/<annotation[\s\S]*?<\/annotation>/gi, "").match(/<[^>]+>|[^<]+/g) ?? [];
  for (const token of tokens) {
    if (token.startsWith("</")) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith("<")) {
      if (token.startsWith("<!") || token.startsWith("<?")) continue;
      const tag = token.match(/^<\s*([\w:-]+)/)?.[1]?.split(":").pop()?.toLowerCase() ?? "span";
      const node: MathTree = { tag, text: "", children: [] };
      stack[stack.length - 1].children.push(node);
      if (!token.endsWith("/>")) stack.push(node);
      continue;
    }
    stack[stack.length - 1].text += token
      .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  return root;
}

const superscriptMap: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", "′": "′" };
const subscriptMap: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎" };
function mappedScript(value: string, map: Record<string, string>, fallback: "^" | "_") {
  const converted = Array.from(value).map(char => map[char]).join("");
  return converted.length === value.length ? converted : `${fallback}(${value})`;
}

function mathTreeToText(node: MathTree): string {
  if (node.tag === "annotation" || node.tag === "annotation-xml") return "";
  const children = node.children.map(mathTreeToText);
  const own = node.text.trim();
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
    try {
      const html = renderMathToMathMl(formula);
      const rendered = mathTreeToText(parseMathMl(html)).replace(/\u2061/g, "").replace(/\s+/g, " ").trim();
      return rendered || formula;
    } catch {
      return formula.replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}$]/g, "");
    }
  };
  const normalized = normalizeMathSource(value);
  if (formulaOnly) return render(normalized.replace(/^\s*(?:\$\$?|\\\[|\\\()/, "").replace(/(?:\$\$?|\\\]|\\\))\s*$/, ""));
  const rendered = normalized
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => `\n${render(formula)}\n`)
    .replace(/\$([^$]+?)\$/g, (_, formula) => render(formula))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, formula) => `\n${render(formula)}\n`)
    .replace(/\\\((.+?)\\\)/g, (_, formula) => render(formula));
  return rendered.replace(/([^\n]{3,})\.\1(?=\s|$)/g, "$1");
}

function comparableMath(value: string, formulaOnly = false) {
  return latexToPdfText(value, formulaOnly).toLocaleLowerCase("pt-BR").replace(/[^a-z0-9À-ÿ]+/g, "");
}

export function shouldRenderStandaloneFormula(statement: string, formula?: string) {
  if (!formula?.trim()) return false;
  const renderedFormula = comparableMath(formula, true);
  return Boolean(renderedFormula) && !comparableMath(statement).includes(renderedFormula);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  String(text).split(/\n/).forEach(paragraph => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
      else line = candidate;
    });
    if (line) lines.push(line);
    if (!words.length) lines.push("");
  });
  return lines;
}

export async function generateQuestionPdf(input: { questions: Question[]; filterSummary: string; logoUrl?: string }) {
  if (!input.questions.length) throw new Error("Nenhuma questão encontrada para exportar.");
  const logo = await loadImage(input.logoUrl ?? "/brand/projeto-vetor-logo.svg");
  const pages: PdfPage[] = [];
  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let y = CONTENT_TOP;
  let pageNumber = 0;

  const startPage = () => {
    canvas = document.createElement("canvas"); canvas.width = PAGE_WIDTH; canvas.height = PAGE_HEIGHT;
    const nextContext = canvas.getContext("2d", { alpha: false });
    if (!nextContext) throw new Error("Seu navegador não conseguiu preparar o PDF. Tente atualizar a página ou usar outro navegador.");
    context = nextContext;
    context.fillStyle = IVORY; context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    if (logo) {
      context.save(); context.globalAlpha = 0.05; context.drawImage(logo, 350, 430, 540, 540); context.restore();
      context.drawImage(logo, MARGIN, 38, 82, 82);
    }
    context.fillStyle = NAVY; context.font = "bold 27px Arial"; context.fillText("PROJETO VETOR", 195, 68);
    context.fillStyle = CYAN; context.font = "bold 18px Arial"; context.fillText("LISTA PERSONALIZADA", 195, 98);
    context.strokeStyle = "#b9d8df"; context.lineWidth = 2; context.beginPath(); context.moveTo(MARGIN, 132); context.lineTo(PAGE_WIDTH - MARGIN, 132); context.stroke();
    y = CONTENT_TOP; pageNumber += 1;
  };

  const finishPage = () => {
    context.fillStyle = NAVY; context.font = "15px Arial";
    context.fillText("projetovetor • lista personalizada", MARGIN, 1695);
    context.textAlign = "right"; context.fillText(`Página ${pageNumber}`, PAGE_WIDTH - MARGIN, 1695); context.textAlign = "left";
    pages.push({ jpeg: decodeDataUrl(canvas.toDataURL("image/jpeg", 0.92)) });
  };

  const ensure = (height: number) => { if (y + height > CONTENT_BOTTOM) { finishPage(); startPage(); } };
  const drawLines = async (text: string, x: number, width: number, lineHeight = 25, font = "19px Arial", color = "#172033", formulaOnly = false) => {
    context.font = font; context.fillStyle = color;
    const fontSize = Number.parseFloat(font) || 19;
    const segments = splitPdfMathSegments(text, formulaOnly);
    let cursorX = x;
    let hasContent = false;
    const nextLine = () => { ensure(lineHeight); y += lineHeight; cursorX = x; hasContent = false; };

    for (const segment of segments) {
      if (segment.kind === "text") {
        const paragraphs = segment.value.split("\n");
        for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
          const words = paragraphs[paragraphIndex].split(/\s+/).filter(Boolean);
          for (const word of words) {
            const label = hasContent ? ` ${word}` : word;
            const wordWidth = context.measureText(label).width;
            if (hasContent && cursorX + wordWidth > x + width) nextLine();
            ensure(lineHeight);
            context.fillText(hasContent ? ` ${word}` : word, cursorX, y);
            cursorX += context.measureText(hasContent ? ` ${word}` : word).width;
            hasContent = true;
          }
          if (paragraphIndex < paragraphs.length - 1) nextLine();
        }
        continue;
      }

      const image = await renderMathImage(segment.value, fontSize, color);
      if (!image) {
        const fallback = latexToPdfText(segment.value, true);
        const fallbackWidth = context.measureText(fallback).width;
        if (hasContent && cursorX + fallbackWidth > x + width) nextLine();
        ensure(lineHeight);
        context.fillText(fallback, cursorX, y);
        cursorX += fallbackWidth;
        hasContent = true;
        continue;
      }

      const display = segment.display || formulaOnly;
      const availableWidth = display ? width : x + width - cursorX;
      const scale = Math.min(1, availableWidth / image.naturalWidth);
      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      if (display && hasContent) nextLine();
      if (!display && hasContent && cursorX + imageWidth > x + width) nextLine();
      ensure(Math.max(lineHeight, imageHeight + 4));
      context.drawImage(image, display ? x + 20 : cursorX, y - imageHeight * 0.78, imageWidth, imageHeight);
      if (display) {
        y += Math.max(lineHeight, imageHeight + 4);
        cursorX = x;
        hasContent = false;
      } else {
        cursorX += imageWidth;
        hasContent = true;
      }
    }
    if (hasContent) y += lineHeight;
  };
  const drawImage = async (url: string | undefined, maxWidth: number, maxHeight: number, x: number) => {
    const image = await loadImage(url);
    if (!image) { ensure(38); context.fillStyle = "#64748b"; context.font = "italic 17px Arial"; context.fillText("Imagem indisponível", x, y + 20); y += 38; return; }
    const fitted = fitPdfImage(image.naturalWidth, image.naturalHeight, maxWidth, maxHeight);
    const { width, height } = fitted;
    ensure(height + 14);
    context.drawImage(image, x, y, width, height); y += height + 14;
  };

  startPage();
  context.fillStyle = "#e8f7f8"; context.fillRect(MARGIN, y - 8, PAGE_WIDTH - MARGIN * 2, 92);
  context.fillStyle = NAVY; context.font = "bold 17px Arial"; context.fillText("Filtros aplicados", MARGIN + 20, y + 20);
  y += 46; await drawLines(input.filterSummary, MARGIN + 20, PAGE_WIDTH - MARGIN * 2 - 40, 22, "17px Arial", "#29465e"); y += 22;

  for (let index = 0; index < input.questions.length; index += 1) {
    const question = input.questions[index];
    const textualLength = String(question.statement ?? "").length + (question.statementAfterImage?.length ?? 0)
      + question.options.reduce((total, option) => total + (option.text?.length ?? 0), 0);
    const estimatedHeight = 226 + Math.ceil(textualLength / 96) * 25
      + (question.imageUrl ? 345 : 0) + question.options.filter(option => option.imageUrl).length * 225;
    ensure(Math.min(estimatedHeight, CONTENT_BOTTOM - CONTENT_TOP));
    context.fillStyle = NAVY; context.font = "bold 22px Arial"; context.fillText(`${index + 1}.`, MARGIN, y); y += 31;
    context.font = "bold 14px Arial";
    let tagX = MARGIN;
    for (const tag of getQuestionPdfTags(question)) {
      const label = tag.toLocaleUpperCase("pt-BR"); const width = Math.min(context.measureText(label).width + 24, 300);
      if (tagX + width > PAGE_WIDTH - MARGIN) { tagX = MARGIN; y += 30; }
      context.fillStyle = "#dff5f7"; context.fillRect(tagX, y - 18, width, 25); context.fillStyle = NAVY; context.fillText(label, tagX + 10, y); tagX += width + 8;
    }
    y += 35;
    await drawLines(question.statement, MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (question.imageUrl) await drawImage(question.imageUrl, QUESTION_PDF_LAYOUT.statementImageMaxWidth, QUESTION_PDF_LAYOUT.statementImageMaxHeight, MARGIN);
    if (question.statementAfterImage) await drawLines(question.statementAfterImage, MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (shouldRenderStandaloneFormula(question.statement, question.formula)) {
      y += 6;
      await drawLines(question.formula ?? "", MARGIN + 24, PAGE_WIDTH - MARGIN * 2 - 48, 27, "20px Georgia", NAVY, true);
    }
    y += 10;
    for (const option of question.options) {
      ensure(option.imageUrl ? 180 : 38);
      context.fillStyle = NAVY; context.font = "bold 18px Arial"; context.fillText(`${option.label})`, MARGIN + 18, y);
      if (option.text) await drawLines(option.text, MARGIN + 55, PAGE_WIDTH - MARGIN * 2 - 55, 24, "18px Arial");
      else y += 25;
      if (option.imageUrl) await drawImage(option.imageUrl, QUESTION_PDF_LAYOUT.optionImageMaxWidth, QUESTION_PDF_LAYOUT.optionImageMaxHeight, MARGIN + 55);
      y += 5;
    }
    ensure(QUESTION_PDF_LAYOUT.resolutionSpaceHeight); context.fillStyle = "#52677b"; context.font = "bold 13px Arial";
    context.fillText("ESPAÇO PARA RESOLUÇÃO", MARGIN, y + 18); y += QUESTION_PDF_LAYOUT.resolutionSpaceHeight;
  }

  finishPage();
  const answerPages = chunkAnswers(input.questions.map(question => question.correctOptionId));
  answerPages.forEach(columns => {
    startPage(); context.fillStyle = NAVY; context.font = "bold 30px Arial"; context.fillText("GABARITO", MARGIN, y); y += 55;
    const columnWidth = (PAGE_WIDTH - MARGIN * 2) / 4;
    columns.forEach((column, columnIndex) => column.forEach((item, row) => {
      context.fillStyle = row % 2 ? "#f0f8f8" : IVORY; context.fillRect(MARGIN + columnIndex * columnWidth, y + row * 42 - 28, columnWidth - 14, 38);
      context.fillStyle = NAVY; context.font = "bold 20px Arial"; context.fillText(`${item.number}. ${item.answer}`, MARGIN + columnIndex * columnWidth + 12, y + row * 42);
    }));
    finishPage();
  });

  const blob = buildRasterPdf(pages, input.filterSummary);
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = buildPdfFileName(); link.hidden = true; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return { fileName: link.download, pages: pages.length, questions: input.questions.length };
}
