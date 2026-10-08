import {
  MAX_QUESTION_IMPORT_IMAGE_BYTES,
  type NormalizedQuestionImageSlot,
  type NormalizedQuestionImportItem,
} from "../../shared/questionImportSchema.js";

export const QUESTION_IMPORT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type QuestionImportImageType = (typeof QUESTION_IMPORT_IMAGE_TYPES)[number];

export type ReadyImportImageSlot = NormalizedQuestionImageSlot & {
  import_key: string;
  public_url: string;
};

function ascii(bytes: Uint8Array, start: number, end: number) {
  let value = "";
  for (let index = start; index < end; index += 1) value += String.fromCharCode(bytes[index]);
  return value;
}

export function sanitizeImportFileName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

export function matchFilesToSlots(fileNames: string[], slots: NormalizedQuestionImageSlot[]) {
  const remaining = new Set(slots.map((slot) => slot.slot_id));
  const matches: Record<string, string> = {};
  const ambiguous: Array<{ fileName: string; slotIds: string[] }> = [];
  const unmatched: string[] = [];
  for (const fileName of fileNames) {
    const normalized = fileName.trim().toLowerCase();
    const candidates = slots.filter((slot) => remaining.has(slot.slot_id) && (
      slot.nome_arquivo_esperado?.trim().toLowerCase() === normalized ||
      slot.slot_id.trim().toLowerCase() === normalized.replace(/\.[^.]+$/, "")
    ));
    if (candidates.length === 1) {
      matches[fileName] = candidates[0].slot_id;
      remaining.delete(candidates[0].slot_id);
    } else if (candidates.length > 1) ambiguous.push({ fileName, slotIds: candidates.map((slot) => slot.slot_id) });
    else unmatched.push(fileName);
  }
  return { matches, ambiguous, unmatched };
}

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: (bytes[offset + 5] << 8) | bytes[offset + 6], width: (bytes[offset + 7] << 8) | bytes[offset + 8] };
    }
    if (length < 2) break;
    offset += length + 2;
  }
  return null;
}

export function inspectQuestionImportImage(bytes: Uint8Array, declaredType: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_QUESTION_IMPORT_IMAGE_BYTES) throw new Error("A imagem deve ter no máximo 3 MB.");
  let mime: QuestionImportImageType | null = null;
  let dimensions: { width: number; height: number } | null = null;
  if (bytes.length >= 24 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])) {
    mime = "image/png";
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    dimensions = { width: view.getUint32(16), height: view.getUint32(20) };
  } else if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    mime = "image/webp";
    const chunk = ascii(bytes, 12, 16);
    if (chunk === "VP8X" && bytes.length >= 30) dimensions = {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
    else if (chunk === "VP8 " && bytes.length >= 30) dimensions = { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
    else if (chunk === "VP8L" && bytes.length >= 25) {
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
      dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    mime = "image/jpeg";
    dimensions = jpegDimensions(bytes);
  }
  if (!mime || mime !== declaredType) throw new Error("O conteúdo real do arquivo não corresponde a PNG, JPEG ou WebP.");
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > 12000 || dimensions.height > 12000) throw new Error("Não foi possível validar as dimensões da imagem.");
  return { mime, ...dimensions, byteSize: bytes.byteLength };
}

export function applyReadyImageSlots(question: NormalizedQuestionImportItem, slots: ReadyImportImageSlot[]): NormalizedQuestionImportItem {
  const importKey = question.chave_importacao || question.id_importacao || question.import_hash;
  const ownSlots = slots.filter((slot) => slot.import_key === importKey);
  const next: NormalizedQuestionImportItem = { ...question, resolucao_blocos: [...question.resolucao_blocos], image_metadata: [...question.image_metadata] };
  for (const slot of ownSlots) {
    if (!/^https:\/\//i.test(slot.public_url)) throw new Error(`URL inválida para o slot ${slot.slot_id}.`);
    if (slot.local === "enunciado" || slot.local === "contexto") next.url_imagem = slot.public_url;
    else if (slot.local === "alternativa" && slot.alternativa) next[`${slot.alternativa}_url_imagem`] = slot.public_url;
    else if (slot.local === "resolucao") next.resolucao_blocos.push({
      tipo: "imagem",
      texto: JSON.stringify({ alt: slot.texto_alternativo, caption: slot.legenda, slot_id: slot.slot_id }),
      url_imagem: slot.public_url,
      ordem: next.resolucao_blocos.length + 1,
    });
    next.image_metadata.push({ slot_id: slot.slot_id, local: slot.local, alternativa: slot.alternativa, texto_alternativo: slot.texto_alternativo, legenda: slot.legenda });
  }
  return next;
}
