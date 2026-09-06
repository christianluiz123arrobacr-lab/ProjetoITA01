/** Supplemental embedded font; Helvetica remains the font for existing prose.
 * No glyph-zero fallback: unsupported content must produce an actionable error.
 */
export class PdfUnicodeFont {
  private view: DataView;
  private tables = new Map<string, number>();
  private cmap: number;
  private units: number;
  private metrics: number;
  private metricCount: number;

  constructor(readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const v = this.view;
    for (let i = 0; i < v.getUint16(4); i++) {
      const p = 12 + i * 16;
      this.tables.set(String.fromCharCode(...Array.from(bytes.slice(p, p + 4))), v.getUint32(p + 8));
    }
    const table = (name: string) => {
      const offset = this.tables.get(name);
      if (offset === undefined) throw new Error(`Fonte PDF inválida: ${name}.`);
      return offset;
    };
    this.units = v.getUint16(table("head") + 18);
    this.metrics = table("hmtx");
    this.metricCount = v.getUint16(table("hhea") + 34);
    const cmap = table("cmap");
    const candidates: number[] = [];
    for (let i = 0; i < v.getUint16(cmap + 2); i++) {
      const p = cmap + 4 + i * 8;
      const platform = v.getUint16(p);
      const encoding = v.getUint16(p + 2);
      if (platform === 0 || (platform === 3 && [1, 10].includes(encoding))) candidates.push(cmap + v.getUint32(p + 4));
    }
    this.cmap = candidates.find(p => v.getUint16(p) === 12) ?? candidates.find(p => v.getUint16(p) === 4) ?? 0;
    if (!this.cmap) throw new Error("Fonte PDF sem mapa Unicode.");
  }

  glyph(char: string) {
    const code = char.codePointAt(0)!;
    const v = this.view; const p = this.cmap;
    let id = 0;
    if (v.getUint16(p) === 12) {
      let low = 0; let high = v.getUint32(p + 12) - 1;
      while (low <= high) {
        const mid = (low + high) >>> 1; const group = p + 16 + mid * 12;
        const start = v.getUint32(group); const end = v.getUint32(group + 4);
        if (code < start) high = mid - 1;
        else if (code > end) low = mid + 1;
        else { id = v.getUint32(group + 8) + code - start; break; }
      }
    } else if (code <= 0xffff) {
      const count = v.getUint16(p + 6) / 2;
      for (let i = 0; i < count; i++) {
        const end = v.getUint16(p + 14 + i * 2);
        const start = v.getUint16(p + 16 + count * 2 + i * 2);
        if (code < start || code > end) continue;
        const delta = v.getInt16(p + 16 + count * 4 + i * 2);
        const rangeAt = p + 16 + count * 6 + i * 2;
        const range = v.getUint16(rangeAt);
        id = range ? v.getUint16(rangeAt + range + (code - start) * 2) : code;
        if (id) id = (id + delta) & 0xffff;
        break;
      }
    }
    if (!id) throw new Error(`O PDF não possui glifo para “${char}” (U+${code.toString(16).toUpperCase()}). O conteúdo não foi substituído; adicione uma fonte com cobertura para este caractere.`);
    return { id, width: v.getUint16(this.metrics + Math.min(id, this.metricCount - 1) * 4) * 1000 / this.units };
  }
}

let fontPromise: Promise<PdfUnicodeFont> | undefined;
export function loadPdfUnicodeFont() {
  return fontPromise ??= fetch("/fonts/pdf/DejaVuSans.ttf").then(async response => {
    if (!response.ok) throw new Error("Não foi possível carregar a fonte Unicode do PDF.");
    return new PdfUnicodeFont(new Uint8Array(await response.arrayBuffer()));
  }).catch(error => { fontPromise = undefined; throw error; });
}
