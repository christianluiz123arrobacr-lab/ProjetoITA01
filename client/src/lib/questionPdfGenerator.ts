import katex from "katex";
import type { Question } from "@/types/question";
import { buildPdfFileName, chunkAnswers, getQuestionPdfTags } from "./questionPdfLayout";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 92;
const CONTENT_TOP = 178;
const CONTENT_BOTTOM = 1640;
const NAVY = "#082a4f";
const CYAN = "#16b8cf";
const IVORY = "#fffdf4";

type PdfPage = { jpeg: Uint8Array };

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

function mathNodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  const element = node as Element;
  const children = Array.from(node.childNodes).map(mathNodeToText);
  if (element.tagName === "mfrac") return `(${children[0] ?? ""})/(${children[1] ?? ""})`;
  if (element.tagName === "msqrt") return `√(${children.join("")})`;
  if (element.tagName === "mroot") return `√[${children[1] ?? ""}](${children[0] ?? ""})`;
  if (element.tagName === "msup") return `${children[0] ?? ""}^(${children[1] ?? ""})`;
  if (element.tagName === "msub") return `${children[0] ?? ""}_(${children[1] ?? ""})`;
  return children.join("");
}

export function latexToPdfText(value: string) {
  const render = (formula: string) => {
    try {
      const html = katex.renderToString(formula, { throwOnError: false, output: "mathml" });
      const document = new DOMParser().parseFromString(html, "text/html");
      const math = document.querySelector("math");
      return math ? mathNodeToText(math).replace(/\s+/g, " ").trim() : formula;
    } catch {
      return formula.replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}$]/g, "");
    }
  };
  return value
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => `\n${render(formula)}\n`)
    .replace(/\$([^$]+?)\$/g, (_, formula) => render(formula))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, formula) => `\n${render(formula)}\n`)
    .replace(/\\\((.+?)\\\)/g, (_, formula) => render(formula));
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
    context.fillStyle = NAVY; context.font = "bold 25px Arial"; context.fillText("PROJETO VETOR", 195, 68);
    context.fillStyle = CYAN; context.font = "bold 18px Arial"; context.fillText("LISTA PERSONALIZADA", 195, 98);
    context.strokeStyle = "#b9d8df"; context.lineWidth = 2; context.beginPath(); context.moveTo(MARGIN, 132); context.lineTo(PAGE_WIDTH - MARGIN, 132); context.stroke();
    y = CONTENT_TOP; pageNumber += 1;
  };

  const finishPage = () => {
    context.fillStyle = NAVY; context.font = "16px Arial";
    context.fillText("projetovetor • lista personalizada", MARGIN, 1695);
    context.textAlign = "right"; context.fillText(`Página ${pageNumber}`, PAGE_WIDTH - MARGIN, 1695); context.textAlign = "left";
    pages.push({ jpeg: decodeDataUrl(canvas.toDataURL("image/jpeg", 0.92)) });
  };

  const ensure = (height: number) => { if (y + height > CONTENT_BOTTOM) { finishPage(); startPage(); } };
  const drawLines = (text: string, x: number, width: number, lineHeight = 28, font = "21px Arial", color = "#172033") => {
    context.font = font; context.fillStyle = color;
    const lines = wrapText(context, latexToPdfText(text), width);
    lines.forEach(line => { ensure(lineHeight); context.fillText(line, x, y); y += lineHeight; });
  };
  const drawImage = async (url: string | undefined, maxHeight: number, indent = 0) => {
    const image = await loadImage(url);
    ensure(maxHeight + 15);
    if (!image) { context.fillStyle = "#64748b"; context.font = "italic 18px Arial"; context.fillText("Imagem indisponível", MARGIN + indent, y + 22); y += 42; return; }
    const scale = Math.min((PAGE_WIDTH - MARGIN * 2 - indent) / image.naturalWidth, maxHeight / image.naturalHeight, 1);
    const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
    context.drawImage(image, (PAGE_WIDTH - width) / 2 + indent / 2, y, width, height); y += height + 18;
  };

  startPage();
  context.fillStyle = "#e8f7f8"; context.fillRect(MARGIN, y - 8, PAGE_WIDTH - MARGIN * 2, 92);
  context.fillStyle = NAVY; context.font = "bold 18px Arial"; context.fillText("Filtros aplicados", MARGIN + 20, y + 20);
  y += 48; drawLines(input.filterSummary, MARGIN + 20, PAGE_WIDTH - MARGIN * 2 - 40, 23, "17px Arial", "#29465e"); y += 25;

  for (let index = 0; index < input.questions.length; index += 1) {
    const question = input.questions[index];
    const textualLength = String(question.statement ?? "").length + (question.statementAfterImage?.length ?? 0)
      + question.options.reduce((total, option) => total + (option.text?.length ?? 0), 0);
    const estimatedHeight = 170 + Math.ceil(textualLength / 88) * 28
      + (question.imageUrl ? 300 : 0) + question.options.filter(option => option.imageUrl).length * 180;
    ensure(Math.min(estimatedHeight, CONTENT_BOTTOM - CONTENT_TOP));
    context.fillStyle = NAVY; context.font = "bold 24px Arial"; context.fillText(`${index + 1}.`, MARGIN, y); y += 34;
    context.font = "bold 14px Arial";
    let tagX = MARGIN;
    for (const tag of getQuestionPdfTags(question)) {
      const label = tag.toLocaleUpperCase("pt-BR"); const width = Math.min(context.measureText(label).width + 24, 300);
      if (tagX + width > PAGE_WIDTH - MARGIN) { tagX = MARGIN; y += 30; }
      context.fillStyle = "#dff5f7"; context.fillRect(tagX, y - 18, width, 25); context.fillStyle = NAVY; context.fillText(label, tagX + 10, y); tagX += width + 8;
    }
    y += 35;
    drawLines(question.statement, MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (question.imageUrl) await drawImage(question.imageUrl, 390);
    if (question.statementAfterImage) drawLines(question.statementAfterImage, MARGIN, PAGE_WIDTH - MARGIN * 2);
    if (question.formula) { y += 6; drawLines(question.formula, MARGIN + 28, PAGE_WIDTH - MARGIN * 2 - 56, 30, "22px Georgia", NAVY); }
    y += 10;
    for (const option of question.options) {
      ensure(option.imageUrl ? 180 : 38);
      context.fillStyle = NAVY; context.font = "bold 19px Arial"; context.fillText(`${option.label})`, MARGIN + 18, y);
      if (option.text) drawLines(option.text, MARGIN + 58, PAGE_WIDTH - MARGIN * 2 - 58, 27, "19px Arial");
      else y += 28;
      if (option.imageUrl) await drawImage(option.imageUrl, 210, 58);
      y += 5;
    }
    ensure(100); context.strokeStyle = "#bed0dc"; context.setLineDash([8, 8]);
    for (let line = 0; line < 3; line += 1) { context.beginPath(); context.moveTo(MARGIN, y + line * 30); context.lineTo(PAGE_WIDTH - MARGIN, y + line * 30); context.stroke(); }
    context.setLineDash([]); y += 112;
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
