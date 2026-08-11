import type { CSSProperties } from "react";

export type StudyCanvasPaperSize = "a5" | "a4" | "a3" | "infinite";

/** Stable document-space sizes. They never depend on the browser viewport. */
export const PAPER_DIMENSIONS = {
  a5: { width: 840, height: 1188 },
  a4: { width: 1200, height: 1697 },
  a3: { width: 1680, height: 2376 },
  infinite: { width: 1600, height: 5000 },
} as const;

const PAPER_BASE_WIDTH = { a5: 520, a4: 720, a3: 980, infinite: 920 } as const;

export function getPaperDimensions(size: StudyCanvasPaperSize) {
  return PAPER_DIMENSIONS[size];
}

export function isFinitePaper(size: StudyCanvasPaperSize) {
  return size !== "infinite";
}

/**
 * Visual page sizing uses one scalar for both axes. The canvas bitmap keeps its
 * document coordinates while this frame controls navigation and presentation.
 */
export function getPaperViewportStyle(
  paperSize: StudyCanvasPaperSize,
  _fullscreen: boolean,
  zoom: number
): CSSProperties {
  const dimensions = PAPER_DIMENSIONS[paperSize];
  const width = PAPER_BASE_WIDTH[paperSize] * zoom;
  const height = width * (dimensions.height / dimensions.width);

  return {
    width: `${width}px`,
    height: `${height}px`,
    minWidth: `${width}px`,
    minHeight: `${height}px`,
    aspectRatio: paperSize === "infinite" ? undefined : `${dimensions.width} / ${dimensions.height}`,
    flex: "0 0 auto",
  };
}

export function getPaperVisualMetrics(size: StudyCanvasPaperSize) {
  const dimensions = PAPER_DIMENSIONS[size];
  return {
    maxWidth: PAPER_BASE_WIDTH[size],
    aspectRatio: size === "infinite" ? null : dimensions.width / dimensions.height,
    infinite: size === "infinite",
  };
}
