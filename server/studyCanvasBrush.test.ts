import { describe, expect, it } from "vitest";
import { BRUSH_RENDERING } from "../client/src/components/study-canvas/studyCanvasBrush";
import { readFileSync } from "node:fs";

const workspace = readFileSync(
  new URL("../client/src/components/study-canvas/StudyCanvasWorkspace.tsx", import.meta.url),
  "utf8"
);

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

  it("renderiza caneta e pincel como contorno contínuo sem sobrepor segmentos", () => {
    expect(workspace).toContain("getStrokeOutline(stroke)");
    expect(workspace).toContain("traceSmoothClosedPath");
    expect(workspace).toContain("ctx.fillStyle = stroke.color");
  });

  it("mantém pressão expressiva, pontas graduais e zoom interpolado", () => {
    expect(workspace).toContain("const easedPressure");
    expect(workspace).toContain("const startTaper");
    expect(workspace).toContain("const endTaper");
    expect(workspace).toContain("(measuredZoom - currentZoom) * 0.42");
    expect(workspace).toContain("Math.exp(-event.deltaY * 0.0015)");
  });
});
