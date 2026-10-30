const encoder = new TextEncoder();
const encode = (value: string) => encoder.encode(value);
function concat(parts: Uint8Array[]) { const size = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(size); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }
function dataUrlBytes(value: string) { const binary = atob(value.split(",")[1] ?? ""); return Uint8Array.from(binary, character => character.charCodeAt(0)); }

/** Builds a genuine, binary PDF whose pages contain the rendered study canvas. */
export type StudyCanvasPdfPage = { dataUrl: string; width: number; height: number };
export function buildStudyCanvasPdf(jpegPages: StudyCanvasPdfPage[], title: string) {
  if (!jpegPages.length) throw new Error("Não há páginas para exportar.");
  const images = jpegPages.map(page => ({ ...page, bytes: dataUrlBytes(page.dataUrl) }));
  const objects: Uint8Array[] = [];
  const pageIds = images.map((_, index) => 6 + index * 3);
  objects[0] = encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[1] = encode(`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`);
  objects[2] = encode(`<< /Title (${title.replace(/[()\\]/g, " ")}) /Author (Projeto Vetor) >>`);
  images.forEach((image, index) => {
    const imageId = 4 + index * 3, contentId = 5 + index * 3, pageId = 6 + index * 3;
    objects[imageId - 1] = concat([encode(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`), image.bytes, encode("\nendstream")]);
    const portrait = image.height >= image.width; const pageWidth = portrait ? 595 : 842; const pageHeight = portrait ? 842 : 595; const margin = 24; const availableWidth = pageWidth - margin * 2; const availableHeight = pageHeight - margin * 2; const scale = Math.min(availableWidth / image.width, availableHeight / image.height); const drawWidth = image.width * scale; const drawHeight = image.height * scale;
    const stream = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${((pageWidth - drawWidth) / 2).toFixed(2)} ${((pageHeight - drawHeight) / 2).toFixed(2)} cm /Im${index} Do Q`;
    objects[contentId - 1] = encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects[pageId - 1] = encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  const header = encode("%PDF-1.7\n%PV\n"), parts = [header], offsets = [0]; let cursor = header.length;
  objects.forEach((object, index) => { offsets.push(cursor); const wrapped = concat([encode(`${index + 1} 0 obj\n`), object, encode("\nendobj\n")]); parts.push(wrapped); cursor += wrapped.length; });
  const xrefOffset = cursor;
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}`;
  parts.push(encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
  return new Blob([concat(parts)], { type: "application/pdf" });
}

export function safePdfFileName(title: string) { return `${title.trim().replace(/[^A-Za-zÀ-ÿ0-9 _-]+/g, "").replace(/\s+/g, " ") || "Caderno"} — Projeto Vetor.pdf`; }

export type VectorPdfPoint = { x: number; y: number };
export type VectorPdfElement = {
  tool: "pen" | "eraser" | "shape" | "text" | "image" | "meta";
  brush?: "pen" | "brush" | "highlighter";
  shape?: "line" | "arrow" | "rectangle" | "square" | "ellipse" | "circle" | "triangle" | "diamond" | "pentagon";
  color?: string;
  size?: number;
  opacity?: number;
  points: VectorPdfPoint[];
  text?: string;
};
export type VectorPdfPage = { elements: VectorPdfElement[] };
export type PrintPaperSize = "a5" | "a4" | "a3";

export const PDF_PAPER_POINTS: Record<PrintPaperSize, { width: number; height: number }> = {
  a5: { width: 419.53, height: 595.28 },
  a4: { width: 595.28, height: 841.89 },
  a3: { width: 841.89, height: 1190.55 },
};

function rgb(color = "#0f172a") {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  const value = match?.[1] ?? "0f172a";
  return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16) / 255);
}
function pdfText(value: string) { return value.replace(/[\\()]/g, match => `\\${match}`).replace(/[^\x20-\x7eÀ-ÿ]/g, "?"); }

/** Builds page content from notebook points. No screenshot or full-page bitmap is used. */
export function buildVectorStudyCanvasPdf(input: {
  pages: VectorPdfPage[];
  title: string;
  sourceWidth: number;
  sourceHeight: number;
  paperSize: PrintPaperSize;
  lined: boolean;
  paginateInfinite?: boolean;
}) {
  if (!input.pages.length) throw new Error("Não há páginas para exportar.");
  const paper = PDF_PAPER_POINTS[input.paperSize];
  const tileHeight = input.sourceWidth * paper.height / paper.width;
  const renderPages = input.pages.flatMap(page => input.paginateInfinite
    ? Array.from({ length: Math.max(1, Math.ceil(input.sourceHeight / tileHeight)) }, (_, index) => ({ page, yOffset: index * tileHeight, viewportHeight: tileHeight }))
    : [{ page, yOffset: 0, viewportHeight: input.sourceHeight }]);
  const objects: Uint8Array[] = [];
  const pageIds = renderPages.map((_, index) => 5 + index * 2);
  objects[0] = encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[1] = encode(`<< /Type /Pages /Count ${renderPages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`);
  objects[2] = encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  renderPages.forEach(({ page, yOffset, viewportHeight }, index) => {
    const sx = paper.width / input.sourceWidth;
    const sy = paper.height / viewportHeight;
    const commands: string[] = ["1 1 1 rg 0 0 " + paper.width.toFixed(2) + " " + paper.height.toFixed(2) + " re f"];
    if (input.lined) {
      commands.push("0.82 0.88 0.94 RG 0.45 w");
      for (let y = yOffset + 72; y < yOffset + viewportHeight; y += 38) commands.push(`0 ${(paper.height - (y - yOffset) * sy).toFixed(2)} m ${paper.width.toFixed(2)} ${(paper.height - (y - yOffset) * sy).toFixed(2)} l S`);
    }
    for (const element of page.elements) {
      if (element.tool === "eraser" || element.tool === "meta" || element.tool === "image" || !element.points.length) continue;
      const [r, g, b] = rgb(element.color);
      const width = Math.max(0.35, (element.size ?? 2) * (sx + sy) / 2);
      commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${width.toFixed(2)} w 1 J 1 j`);
      const point = (p: VectorPdfPoint) => `${(p.x * sx).toFixed(2)} ${(paper.height - (p.y - yOffset) * sy).toFixed(2)}`;
      if (element.tool === "text") {
        const p = element.points[0];
        commands.push(`BT /F1 ${Math.max(7, (element.size ?? 16) * sy).toFixed(2)} Tf ${point(p)} Td (${pdfText(element.text ?? "")}) Tj ET`);
      } else if (element.tool === "shape" && element.points.length >= 2) {
        let a = element.points[0], z = element.points[element.points.length - 1];
        if (element.shape === "square" || element.shape === "circle") {
          const side=Math.max(Math.abs(z.x-a.x),Math.abs(z.y-a.y)),cx=(a.x+z.x)/2,cy=(a.y+z.y)/2;
          a={x:cx-side/2,y:cy-side/2}; z={x:cx+side/2,y:cy+side/2};
        }
        if (element.shape === "rectangle" || element.shape === "square") commands.push(`${(Math.min(a.x,z.x)*sx).toFixed(2)} ${(paper.height-(Math.max(a.y,z.y)-yOffset)*sy).toFixed(2)} ${(Math.abs(z.x-a.x)*sx).toFixed(2)} ${(Math.abs(z.y-a.y)*sy).toFixed(2)} re S`);
        else if (element.shape === "ellipse" || element.shape === "circle") {
          const cx=(a.x+z.x)/2*sx, cy=paper.height-((a.y+z.y)/2-yOffset)*sy, rx=Math.abs(z.x-a.x)/2*sx, ry=Math.abs(z.y-a.y)/2*sy, k=.5522848;
          commands.push(`${(cx-rx).toFixed(2)} ${cy.toFixed(2)} m ${(cx-rx).toFixed(2)} ${(cy+k*ry).toFixed(2)} ${(cx-k*rx).toFixed(2)} ${(cy+ry).toFixed(2)} ${cx.toFixed(2)} ${(cy+ry).toFixed(2)} c ${(cx+k*rx).toFixed(2)} ${(cy+ry).toFixed(2)} ${(cx+rx).toFixed(2)} ${(cy+k*ry).toFixed(2)} ${(cx+rx).toFixed(2)} ${cy.toFixed(2)} c ${(cx+rx).toFixed(2)} ${(cy-k*ry).toFixed(2)} ${(cx+k*rx).toFixed(2)} ${(cy-ry).toFixed(2)} ${cx.toFixed(2)} ${(cy-ry).toFixed(2)} c ${(cx-k*rx).toFixed(2)} ${(cy-ry).toFixed(2)} ${(cx-rx).toFixed(2)} ${(cy-k*ry).toFixed(2)} ${(cx-rx).toFixed(2)} ${cy.toFixed(2)} c S`);
        } else if (["triangle", "diamond", "pentagon"].includes(element.shape ?? "")) {
          const count=element.shape === "triangle" ? 3 : element.shape === "diamond" ? 4 : 5;
          const cx=(a.x+z.x)/2, cy=(a.y+z.y)/2, rx=Math.abs(z.x-a.x)/2, ry=Math.abs(z.y-a.y)/2;
          const vertices=Array.from({length:count},(_,i)=>({x:cx+Math.cos(-Math.PI/2+i*Math.PI*2/count)*rx,y:cy+Math.sin(-Math.PI/2+i*Math.PI*2/count)*ry}));
          commands.push(`${point(vertices[0])} m ${vertices.slice(1).map(v=>`${point(v)} l`).join(" ")} h S`);
        } else commands.push(`${point(a)} m ${point(z)} l S`);
      } else {
        commands.push(`${point(element.points[0])} m`);
        for (const p of element.points.slice(1)) commands.push(`${point(p)} l`);
        commands.push("S");
      }
    }
    const stream = commands.join("\n");
    const contentId = 4 + index * 2, pageId = 5 + index * 2;
    objects[contentId - 1] = encode(`<< /Length ${encode(stream).length} >>\nstream\n${stream}\nendstream`);
    objects[pageId - 1] = encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${paper.width} ${paper.height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  const header = encode("%PDF-1.7\n%PV\n"), parts = [header], offsets = [0]; let cursor = header.length;
  objects.forEach((object, index) => { offsets.push(cursor); const wrapped = concat([encode(`${index + 1} 0 obj\n`), object, encode("\nendobj\n")]); parts.push(wrapped); cursor += wrapped.length; });
  const xrefOffset = cursor;
  parts.push(encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
  return new Blob([concat(parts)], { type: "application/pdf" });
}
