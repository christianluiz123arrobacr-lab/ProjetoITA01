import { describe, expect, it } from "vitest";
import { getPaperVisualMetrics } from "../client/src/components/study-canvas/studyCanvasPaper";

describe("formatos visuais do papel", () => {
  it("mantém proporção ISO e tamanhos A5 < A4 < A3", () => {
    const a5 = getPaperVisualMetrics("a5"), a4 = getPaperVisualMetrics("a4"), a3 = getPaperVisualMetrics("a3");
    expect(a5.maxWidth).toBeLessThan(a4.maxWidth);
    expect(a4.maxWidth).toBeLessThan(a3.maxWidth);
    expect(a4.aspectRatio).toBeCloseTo(1 / Math.SQRT2);
  });

  it("trata folha infinita sem proporção física fixa", () => {
    expect(getPaperVisualMetrics("infinite")).toMatchObject({ infinite: true, aspectRatio: null });
  });
});
