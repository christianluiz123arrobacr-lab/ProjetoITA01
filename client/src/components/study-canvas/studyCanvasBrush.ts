import type { ScratchpadBrush } from "@/services/question-notes.service";

export type BrushRenderingProfile = {
  opacity: number;
  composite: GlobalCompositeOperation;
  pressureVariation: "subtle" | "expressive" | "none";
  lineCap: CanvasLineCap;
};

export const BRUSH_RENDERING: Record<ScratchpadBrush, BrushRenderingProfile> = {
  pen: { opacity: 1, composite: "source-over", pressureVariation: "subtle", lineCap: "round" },
  brush: { opacity: 0.84, composite: "source-over", pressureVariation: "expressive", lineCap: "round" },
  highlighter: { opacity: 0.25, composite: "source-over", pressureVariation: "none", lineCap: "round" },
};
