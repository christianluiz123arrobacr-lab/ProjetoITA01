import { describe, expect, it } from "vitest";
import {
  getPaperDimensions,
  getPaperViewportStyle,
  getPaperVisualMetrics,
} from "../client/src/components/study-canvas/studyCanvasPaper";

describe("formatos visuais do papel", () => {
  it("mantém proporção ISO e tamanhos A5 < A4 < A3", () => {
    const a5 = getPaperVisualMetrics("a5"), a4 = getPaperVisualMetrics("a4"), a3 = getPaperVisualMetrics("a3");
    expect(a5.maxWidth).toBeLessThan(a4.maxWidth);
    expect(a4.maxWidth).toBeLessThan(a3.maxWidth);
    expect(a4.aspectRatio).toBeCloseTo(1 / Math.SQRT2);
  });

  it("trata folha infinita sem proporção física fixa", () => {
    expect(getPaperVisualMetrics("infinite")).toMatchObject({ infinite: true, aspectRatio: null });
    expect(getPaperViewportStyle("infinite", true, 1).aspectRatio).toBeUndefined();
  });

  it("usa a mesma escala nos dois eixos em modo normal e tela cheia", () => {
    for (const size of ["a5", "a4", "a3"] as const) {
      const dimensions = getPaperDimensions(size);
      expect(dimensions.width / dimensions.height).toBeCloseTo(1 / Math.SQRT2, 3);
      const normal = getPaperViewportStyle(size, false, 1.5);
      const fullscreen = getPaperViewportStyle(size, true, 1.5);
      expect(normal.width).toBe(fullscreen.width);
      expect(normal.height).toBe(fullscreen.height);
      expect(normal.aspectRatio).toBe(`${dimensions.width} / ${dimensions.height}`);
    }
  });

  it("zoom amplia o frame sem alterar as dimensões persistidas", () => {
    const before = { ...getPaperDimensions("a4") };
    const normal = getPaperViewportStyle("a4", false, 1);
    const zoomed = getPaperViewportStyle("a4", false, 2);
    expect(Number.parseFloat(String(zoomed.width))).toBe(Number.parseFloat(String(normal.width)) * 2);
    expect(getPaperDimensions("a4")).toEqual(before);
  });
});
