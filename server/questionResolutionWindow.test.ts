import { describe, expect, it } from "vitest";
import {
  containQuestionWindow,
  resizeQuestionWindow,
  type WindowEdge,
} from "../client/src/components/question-notes/floatingQuestionWindow";
import {
  pointerSamples,
  shouldAppendInkSample,
} from "../client/src/components/study-canvas/studyCanvasInk";

const area = { width: 1000, height: 700 };
const start = { x: 100, y: 100, width: 400, height: 300 };
describe("janela local da questão", () => {
  it("mantém título e bordas dentro da área, inclusive após encolher a viewport", () => {
    expect(containQuestionWindow({ ...start, x: -100, y: 900 }, area)).toEqual({
      ...start,
      x: 0,
      y: 400,
    });
    expect(containQuestionWindow(start, { width: 280, height: 180 })).toEqual({
      x: 0,
      y: 0,
      width: 280,
      height: 180,
    });
  });
  it.each(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as WindowEdge[])(
    "redimensiona por %s mantendo limites",
    edge => {
      for (const delta of [-2000, -20, 20, 2000]) {
        const result = resizeQuestionWindow(start, edge, delta, delta, area);
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.width).toBeGreaterThanOrEqual(340);
        expect(result.height).toBeGreaterThanOrEqual(220);
        expect(result.x + result.width).toBeLessThanOrEqual(area.width);
        expect(result.y + result.height).toBeLessThanOrEqual(area.height);
      }
    }
  );
  it("preserva a âncora oposta", () => {
    const result = resizeQuestionWindow(start, "nw", 30, 20, area);
    expect(result.x + result.width).toBe(500);
    expect(result.y + result.height).toBe(400);
  });
});
describe("amostras sem atraso de pressão", () => {
  it("aceita mudanças de pressão com deslocamento mínimo e descarta duplicatas", () => {
    const point = { x: 2, y: 2, pressure: 0.1 };
    expect(
      shouldAppendInkSample(point, { ...point, x: 2.01, pressure: 0.9 })
    ).toBe(true);
    expect(shouldAppendInkSample(point, point)).toBe(false);
  });
  it("preserva amostras coalescidas e a última pressão do evento pai", () => {
    const first = { clientX: 0, clientY: 0, pressure: 0.2, timeStamp: 10 };
    const second = { ...first, clientX: 1, pressure: 0.8, timeStamp: 12 };
    expect(
      pointerSamples({ ...second, getCoalescedEvents: () => [first] })
    ).toEqual([first, expect.objectContaining(second)]);
    expect(
      pointerSamples({ ...second, getCoalescedEvents: () => [first, second] })
    ).toEqual([first, second]);
    expect(pointerSamples(first)).toEqual([first]);
  });
});
