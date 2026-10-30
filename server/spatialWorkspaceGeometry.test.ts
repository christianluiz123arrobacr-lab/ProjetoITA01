import { describe, expect, it } from "vitest";
import { faceArea, faceNormal, pickGeometry, pointDistance, rayTriangle } from "../client/src/lib/gestures/spatialPicking";
import { advanceCursor, canCapture, captureHand, displayHandSide, emptyHandSession, relativeScale, releaseHand, rotationFromAnchor } from "../client/src/lib/gestures/spatialHandSession";
import type { SpatialHand } from "../client/src/lib/gestures/spatialGestureEngine";

const hand = (x: number, y = 0.5): SpatialHand => ({
  gesture: "indexPinch", cursor: { x, y, z: 0 }, anchor: { x, y, z: 0 }, depth: 0.2,
  roll: 0, indexPinch: { x, y, z: 0 }, pinchRatios: { index: 0.1, middle: 0.8, pinky: 0.9 },
});

const square = {
  objectId: "solid-a",
  world: [{ x: -1, y: -1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }],
  projected: [{ x: -1, y: -1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }],
  faces: [[0, 1, 2, 3]],
};
const ray = (x: number, y: number) => ({ origin: { x: 0, y: 0, z: 10 }, direction: { x, y, z: -10 } });

describe("bancada espacial: seleção geométrica", () => {
  it("prioriza vértice e mede distância 3D exata entre vértices", () => {
    const pick = pickGeometry([square], -1, -1, ray(-1, -1), 0.15);
    expect(pick?.kind).toBe("vertex");
    expect(pick?.indices).toEqual([0]);
    expect(pointDistance(square.world[0], square.world[2])).toBeCloseTo(Math.sqrt(8));
  });
  it("seleciona aresta antes da face", () => {
    const pick = pickGeometry([square], 0, -1, ray(0, -1), 0.15);
    expect(pick?.kind).toBe("edge");
    expect(pick?.indices).toEqual([0, 1]);
  });
  it("obtém ponto real de interseção na face e sua área", () => {
    const pick = pickGeometry([square], 0.2, 0.3, ray(0.2, 0.3), 0.1);
    expect(pick?.kind).toBe("face");
    expect(pick?.world).toMatchObject({ x: expect.closeTo(0.2), y: expect.closeTo(0.3), z: expect.closeTo(0) });
    expect(faceArea(square.world, square.faces[0])).toBeCloseTo(4);
    expect(faceNormal(square.world, square.faces[0])).toEqual({ x: 0, y: 0, z: 1 });
    expect(rayTriangle(ray(3, 3), square.world[0], square.world[1], square.world[2])).toBeNull();
  });
});

describe("bancada espacial: sessões de duas mãos", () => {
  it("mantém objetos independentes mesmo com ordem de observação trocada", () => {
    expect(displayHandSide("Left")).toBe("Right");
    const sessions = { Left: emptyHandSession("Left"), Right: emptyHandSession("Right") };
    sessions.Left = captureHand(sessions.Left, "A", hand(0.2), 100, "move");
    sessions.Right = captureHand(sessions.Right, "B", hand(0.8), 100, "move");
    const reordered = [{ side: "Right" as const, observation: hand(0.7) }, { side: "Left" as const, observation: hand(0.3) }];
    for (const item of reordered) sessions[item.side].previous = item.observation;
    expect(sessions.Left.objectId).toBe("A");
    expect(sessions.Right.objectId).toBe("B");
    expect(canCapture(sessions, "Left", "B")).toBe(false);
    sessions.Left = releaseHand(sessions.Left);
    expect(sessions.Right.objectId).toBe("B");
  });
  it("preserva as capturas ao cruzar posições e libera somente a mão perdida", () => {
    const sessions = { Left: captureHand(emptyHandSession("Left"), "A", hand(0.48), 100, "move"), Right: captureHand(emptyHandSession("Right"), "B", hand(0.52), 100, "move") };
    sessions.Left.previous = hand(0.53);
    sessions.Right.previous = hand(0.47);
    expect(sessions.Left.objectId).toBe("A");
    expect(sessions.Right.objectId).toBe("B");
    sessions.Right = releaseHand(sessions.Right);
    expect(sessions.Left.objectId).toBe("A");
    expect(sessions.Right.objectId).toBeNull();
  });
  it("rotaciona continuamente enquanto a pinça se move e para sem salto ao soltar", () => {
    const start = captureHand(emptyHandSession("Left"), "A", hand(0.2), 100, "rotate");
    expect(rotationFromAnchor(hand(0.3), start.previous!, 1).y).toBeCloseTo(15);
    expect(releaseHand(start).previous).toBeNull();
  });
  it("recalibra escala a cada gesto em vez de reutilizar distância anterior", () => {
    const first = relativeScale(0.4, 0.2, 1);
    expect(first.factor).toBeCloseTo(2);
    const next = relativeScale(0.45, 0.4, 1);
    expect(next.factor).toBeCloseTo(1.125);
  });
  it("avança o cursor em quadros sucessivos sem novo resultado de rastreamento", () => {
    const first = advanceCursor({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.34);
    const second = advanceCursor(first, { x: 100, y: 0 }, 0.34);
    expect(first.x).toBeGreaterThan(0);
    expect(second.x).toBeGreaterThan(first.x);
    expect(second.x).toBeLessThanOrEqual(100);
  });
});
