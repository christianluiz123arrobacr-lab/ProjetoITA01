import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  classifyHand,
  GestureDwell,
  mapCursor,
  type Point,
} from "../client/src/lib/gestures/gestureEngine";

const p = (x: number, y: number): Point => ({ x, y, z: 0 });
const anchor = p(0.5, 0.5);
describe("laboratory camera policy", () => {
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
  ) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  function cameraPolicies(path: string) {
    return config.headers
      .filter(rule => new RegExp(`^${rule.source}$`).test(path))
      .flatMap(rule => rule.headers)
      .filter(header => header.key === "Permissions-Policy");
  }
  it("allows camera only on the laboratory document, including its trailing slash", () => {
    for (const path of [
      "/admin/laboratorio-gestos",
      "/admin/laboratorio-gestos/",
    ]) {
      expect(cameraPolicies(path).map(h => h.value)).toEqual([
        "camera=(self), microphone=(), geolocation=()",
      ]);
    }
    for (const path of [
      "/",
      "/admin",
      "/cadastro",
      "/simuladores/geometria-espacial",
      "/admin/laboratorio-gestos-extra",
      "/admin/laboratorio-gestos/nested",
    ]) {
      expect(cameraPolicies(path).map(h => h.value)).toEqual([
        "camera=(), microphone=(), geolocation=()",
      ]);
    }
  });
});
function openHand(): Point[] {
  const points = Array.from({ length: 21 }, () => p(0.5, 0.85));
  [1, 2, 3, 4].forEach((id, i) => {
    points[id] = p(0.44 - i * 0.08, 0.73 - i * 0.04);
  });
  [5, 9, 13, 17].forEach((base, finger) => {
    [0, 1, 2, 3].forEach(j => {
      points[base + j] = p(0.38 + finger * 0.09, 0.6 - j * 0.12);
    });
  });
  return points;
}
describe("gesture geometry", () => {
  it("requires all five fingers; recognizes a mirrored open palm", () => {
    const hand = openHand();
    expect(classifyHand(hand)).toBe("open");
    expect(classifyHand(hand.map(v => ({ ...v, x: 1 - v.x })))).toBe("open");
    hand[4] = p(0.5, 0.7);
    expect(classifyHand(hand)).not.toBe("open");
  });
  it("recognizes pinch and a closed fist without confusing folded fingers with pinch", () => {
    const hand = openHand();
    hand[4] = { ...hand[8] };
    expect(classifyHand(hand)).toBe("pinch");
    [8, 12, 16, 20].forEach(i => {
      hand[i] = p(0.5, 0.76);
    });
    hand[4] = p(0.51, 0.76);
    expect(classifyHand(hand)).toBe("fist");
  });
  it("rejects missing, non-finite and collapsed landmarks", () => {
    expect(classifyHand([])).toBe("none");
    expect(classifyHand(Array(21).fill(anchor))).toBe("none");
    const hand = openHand();
    hand[8].x = NaN;
    expect(classifyHand(hand)).toBe("none");
  });
  it("maps mirrored coordinates to safe viewport bounds", () => {
    expect(mapCursor(p(-1, -1), 1000, 800)).toEqual({ x: 976, y: 24 });
    expect(mapCursor(p(2, 2), 1000, 800)).toEqual({ x: 24, y: 776 });
    expect(mapCursor(p(0.5, 0.5), 1000, 800)).toEqual({ x: 500, y: 400 });
  });
});
describe("gesture dwell and debounce", () => {
  it("opens once after a stable second and requires release", () => {
    const engine = new GestureDwell();
    expect(engine.update("open", anchor, 0, null)).toBeNull();
    expect(engine.update("open", anchor, 999, null)).toBeNull();
    expect(engine.update("open", anchor, 1000, null)).toBe("open");
    expect(engine.update("open", anchor, 4000, "spatial")).toBeNull();
    engine.update("none", anchor, 4100, null);
    engine.update("open", anchor, 4200, null);
    expect(engine.update("open", anchor, 5200, null)).toBe("open");
  });
  it("restarts dwell on motion and tracking loss", () => {
    const engine = new GestureDwell();
    const moved = p(0.7, 0.5);
    engine.update("open", anchor, 0, null);
    expect(engine.update("open", moved, 900, null)).toBeNull();
    expect(engine.update("open", moved, 1000, null)).toBeNull();
    engine.reset();
    engine.update("open", moved, 1900, null);
    expect(engine.update("open", moved, 2899, null)).toBeNull();
    expect(engine.update("open", moved, 2900, null)).toBe("open");
  });
  it("pinch requires a stable target for 300ms and never repeats while held, even over another item", () => {
    const engine = new GestureDwell();
    engine.update("pinch", anchor, 0, null);
    expect(engine.update("pinch", anchor, 1000, null)).toBeNull();
    engine.update("pinch", anchor, 1100, "spatial");
    expect(engine.update("pinch", anchor, 1399, "spatial")).toBeNull();
    expect(engine.update("pinch", anchor, 1400, "spatial")).toBe("pinch");
    engine.update("pinch", anchor, 3000, "functions");
    expect(engine.update("pinch", anchor, 3400, "functions")).toBeNull();
  });
  it("changing targets before confirming restarts pinch dwell", () => {
    const engine = new GestureDwell();
    engine.update("pinch", anchor, 0, "spatial");
    engine.update("pinch", anchor, 250, "close");
    expect(engine.update("pinch", anchor, 300, "close")).toBeNull();
    expect(engine.update("pinch", anchor, 550, "close")).toBe("pinch");
  });
  it("fist closes once after one second and respects global cooldown", () => {
    const engine = new GestureDwell();
    engine.update("open", anchor, 0, null);
    engine.update("open", anchor, 1000, null);
    engine.update("fist", anchor, 1100, null);
    expect(engine.update("fist", anchor, 2100, null)).toBeNull();
    expect(engine.update("fist", anchor, 2200, null)).toBe("fist");
    expect(engine.update("fist", anchor, 5000, null)).toBeNull();
  });
});
