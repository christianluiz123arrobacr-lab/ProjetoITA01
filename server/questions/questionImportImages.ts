import {
  type NormalizedQuestionImageSlot,
  type NormalizedQuestionImportItem,
} from "../../shared/questionImportSchema.js";
import { isQuestionImageUrl } from "../../shared/questionImages.js";

export const QUESTION_IMPORT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type QuestionImportImageType = (typeof QUESTION_IMPORT_IMAGE_TYPES)[number];

export type ReadyImportImageSlot = NormalizedQuestionImageSlot & {
  import_key: string;
  public_url: string;
};

export { inspectQuestionImportImage } from "../../shared/questionImageInspection.js";

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


export function applyReadyImageSlots(question: NormalizedQuestionImportItem, slots: ReadyImportImageSlot[]): NormalizedQuestionImportItem {
  const importKey = question.chave_importacao || question.id_importacao || question.import_hash;
  const ownSlots = slots.filter((slot) => slot.import_key === importKey);
  const seen = new Set<string>();
  for (const slot of ownSlots) {
    const expected = question.imagens.find(item => item.slot_id === slot.slot_id);
    if (!expected || expected.local !== slot.local || expected.alternativa !== slot.alternativa || seen.has(slot.slot_id)) throw new Error("Slot desconhecido, incompatível ou duplicado.");
    seen.add(slot.slot_id);
  }
  ownSlots.sort((a,b) => question.imagens.findIndex(item => item.slot_id === a.slot_id) - question.imagens.findIndex(item => item.slot_id === b.slot_id));
  const next: NormalizedQuestionImportItem = { ...question, resolucao_blocos: [...question.resolucao_blocos], image_metadata: question.image_metadata.filter(item => !seen.has(item.slot_id)) };
  let firstStatementImage = true;
  for (const slot of ownSlots) {
    if (!isQuestionImageUrl(slot.public_url)) throw new Error(`URL inválida para o slot ${slot.slot_id}.`);
    if (slot.local === "enunciado" || slot.local === "contexto") { if (firstStatementImage) next.url_imagem = slot.public_url; firstStatementImage = false; }
    else if (slot.local === "alternativa" && slot.alternativa) next[`${slot.alternativa}_url_imagem`] = slot.public_url;
    else if (slot.local === "resolucao") next.resolucao_blocos.push({
      tipo: "imagem",
      texto: JSON.stringify({ alt: slot.texto_alternativo, caption: slot.legenda, slot_id: slot.slot_id }),
      url_imagem: slot.public_url,
      ordem: next.resolucao_blocos.length + 1,
    });
    next.image_metadata.push({ slot_id: slot.slot_id, local: slot.local, alternativa: slot.alternativa, texto_alternativo: slot.texto_alternativo, legenda: slot.legenda, url_imagem: slot.public_url, ordem: question.imagens.findIndex(item => item.slot_id === slot.slot_id) });
  }
  return next;
}
