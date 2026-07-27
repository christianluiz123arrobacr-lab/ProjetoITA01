export type StudyCanvasPaperSize = "a5" | "a4" | "a3" | "infinite";

export function getPaperVisualMetrics(size: StudyCanvasPaperSize) {
  if (size === "a5") return { maxWidth: 520, aspectRatio: 1 / Math.SQRT2, infinite: false };
  if (size === "a3") return { maxWidth: 980, aspectRatio: 1 / Math.SQRT2, infinite: false };
  if (size === "infinite") return { maxWidth: 920, aspectRatio: null, infinite: true };
  return { maxWidth: 720, aspectRatio: 1 / Math.SQRT2, infinite: false };
}
