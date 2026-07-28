export type NotebookPaperSize = "a5" | "a4" | "a3" | "infinite";
export type NotebookPaper = { size: NotebookPaperSize; lined: boolean };
export type NotebookPoint = { x: number; y: number };
export type NotebookElement = {
  id: string;
  type:
    | "pen"
    | "highlighter"
    | "line"
    | "arrow"
    | "rectangle"
    | "circle"
    | "triangle"
    | "text";
  color: string;
  width: number;
  points: NotebookPoint[];
  text?: string;
};
export type NotebookDocument = {
  version: 1;
  name: string;
  createdAt: string;
  modifiedAt: string;
  paper: NotebookPaper;
  pages: Array<{ id: string; elements: NotebookElement[] }>;
  linkedQuestions?: Array<{ questionId: string; order: number; institution?: string; year?: number; subject?: string; topic?: string; status?: "not_started" | "in_progress" | "completed" }>;
};

export function migrateNotebookElements(elements: unknown[]): NotebookElement[] {
  return elements.filter((element): element is NotebookElement => {
    if (!element || typeof element !== "object") return false;
    const candidate = element as Partial<NotebookElement>;
    return typeof candidate.id === "string" && Array.isArray(candidate.points);
  });
}
export const NOTEBOOK_AUTOSAVE_MS = 120_000;
export function validateNotebookName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name)
    return { valid: false as const, error: "Informe um nome para o caderno." };
  if (name.length > 80)
    return { valid: false as const, error: "Use no máximo 80 caracteres." };
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(name))
    return {
      valid: false as const,
      error: "O nome contém caracteres não permitidos.",
    };
  return { valid: true as const, name };
}
export function paperDimensions(size: NotebookPaperSize) {
  if (size === "a5") return { width: 840, height: 1188 };
  if (size === "a3") return { width: 1680, height: 2376 };
  if (size === "infinite") return { width: 1600, height: 5000 };
  return { width: 1200, height: 1697 };
}
export function shouldAutosave(
  dirty: boolean,
  lastSavedAt: number,
  now: number
) {
  return dirty && now - lastSavedAt >= NOTEBOOK_AUTOSAVE_MS;
}
