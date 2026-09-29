import { validateQuestionImportItem, type NormalizedQuestionImportItem, type QuestionImportPreviewItem } from "./questionImportSchema.js";

export function selectValidQuestionImportItems(previews: QuestionImportPreviewItem[], questions: NormalizedQuestionImportItem[]) {
  if (previews.length !== questions.length) throw new Error("O rascunho de importação está inconsistente.");
  const valid: NormalizedQuestionImportItem[] = [];
  const skipped: number[] = [];
  questions.forEach((question, index) => {
    if (previews[index]?.item?.import_hash !== question.import_hash) throw new Error("O rascunho de importação está inconsistente.");
    if (previews[index]?.status === "valida" && validateQuestionImportItem(question).status === "valida") valid.push(question);
    else skipped.push(previews[index]?.index ?? question.raw_index);
  });
  return { valid, skipped };
}
