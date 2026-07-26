import { describe, expect, it } from "vitest";
import {
  isMultitouchGesture,
  shouldCancelInkForPointerDown,
} from "../client/src/components/study-canvas/studyCanvasPointerGuards";

describe("proteção multitoque do editor compartilhado", () => {
  it("não trata um dedo, mouse ou caneta como gesto", () => {
    expect(isMultitouchGesture([{ pointerId: 1, pointerType: "touch" }])).toBe(false);
    expect(isMultitouchGesture([{ pointerId: 1, pointerType: "pen" }])).toBe(false);
  });

  it("cancela a tinta assim que o segundo dedo aparece", () => {
    const active = [{ pointerId: 1, pointerType: "touch" }];
    expect(shouldCancelInkForPointerDown(active, { pointerId: 2, pointerType: "touch" })).toBe(true);
  });

  it("mantém stylus independente de um toque de palma", () => {
    const active = [{ pointerId: 1, pointerType: "pen" }];
    expect(shouldCancelInkForPointerDown(active, { pointerId: 2, pointerType: "touch" })).toBe(false);
  });

  it("volta a permitir desenho depois que o gesto termina", () => {
    expect(isMultitouchGesture([])).toBe(false);
    expect(shouldCancelInkForPointerDown([], { pointerId: 3, pointerType: "touch" })).toBe(false);
  });
});
