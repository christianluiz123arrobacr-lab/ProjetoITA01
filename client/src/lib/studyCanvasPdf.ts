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
