import { describe, expect, it } from "vitest";
import { BRUSH_RENDERING } from "../client/src/components/study-canvas/studyCanvasBrush";

describe("perfis visuais da escrita", () => {
  it("diferencia caneta, pincel e marca-texto", () => {
    expect(BRUSH_RENDERING.pen).not.toEqual(BRUSH_RENDERING.brush);
    expect(BRUSH_RENDERING.brush.pressureVariation).toBe("expressive");
    expect(BRUSH_RENDERING.highlighter.pressureVariation).toBe("none");
  });

  it("marca-texto é translúcido e não usa multiply", () => {
    expect(BRUSH_RENDERING.highlighter.opacity).toBeGreaterThanOrEqual(0.2);
    expect(BRUSH_RENDERING.highlighter.opacity).toBeLessThanOrEqual(0.3);
    expect(BRUSH_RENDERING.highlighter.composite).toBe("source-over");
  });
});
