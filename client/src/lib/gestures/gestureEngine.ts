export type Point = { x: number; y: number; z: number };
export type Gesture = "open" | "pinch" | "fist" | "none";
export const HAND_CONNECTIONS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [5, 9, 10, 11, 12],
  [9, 13, 14, 15, 16],
  [13, 17, 18, 19, 20],
  [0, 17],
];
const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const angle = (a: Point, b: Point, c: Point) => {
  const u = [a.x - b.x, a.y - b.y, a.z - b.z],
    v = [c.x - b.x, c.y - b.y, c.z - b.z];
  return (
    u.reduce((n, x, i) => n + x * v[i], 0) /
    Math.max(0.00001, Math.hypot(...u) * Math.hypot(...v))
  );
};
export function classifyHand(points: Point[]): Gesture {
  if (
    points.length !== 21 ||
    points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))
  )
    return "none";
  const scale = distance(points[0], points[9]);
  if (scale < 0.03) return "none";
  const fingers = [5, 9, 13, 17].map(
    base =>
      angle(points[base], points[base + 1], points[base + 3]) < -0.7 &&
      distance(points[base + 3], points[0]) >
        distance(points[base + 1], points[0]) * 1.12
  );
  const thumb =
    angle(points[2], points[3], points[4]) < -0.7 &&
    distance(points[4], points[17]) > distance(points[3], points[17]) * 1.12;
  if (thumb && fingers.every(Boolean)) return "open";
  if (
    !thumb &&
    fingers.every(x => !x) &&
    [8, 12, 16, 20].every(
      tip => distance(points[tip], points[0]) < scale * 1.35
    )
  )
    return "fist";
  if (distance(points[4], points[8]) / scale < 0.28) return "pinch";
  return "none";
}

// Time-based dwell, release latch, target identity and stability: holding a
// gesture can never fire again until the user releases it.
export class GestureDwell {
  private gesture: Gesture = "none";
  private target: string | null = null;
  private anchor: Point | null = null;
  private since = 0;
  private cooldownUntil = 0;
  private fired = false;
  reset() {
    this.gesture = "none";
    this.target = null;
    this.anchor = null;
    this.fired = false;
  }
  update(
    gesture: Gesture,
    position: Point,
    now: number,
    target: string | null
  ): Gesture | null {
    if (gesture !== "pinch") target = null;
    if (gesture !== this.gesture) {
      this.gesture = gesture;
      this.target = target;
      this.since = now;
      this.anchor = position;
      this.fired = false;
    } else if (target !== this.target) {
      this.target = target;
      this.since = now;
    }
    if (gesture === "none" || this.fired || now < this.cooldownUntil)
      return null;
    if (
      gesture === "open" &&
      this.anchor &&
      distance(this.anchor, position) > 0.065
    ) {
      this.since = now;
      this.anchor = position;
    }
    if (gesture === "pinch" && !target) return null;
    if (now - this.since < (gesture === "pinch" ? 300 : 1000)) return null;
    this.fired = true;
    this.cooldownUntil = now + 1200;
    return gesture;
  }
}
export function mapCursor(point: Point, width: number, height: number) {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  return {
    x: 24 + clamp((1 - point.x - 0.12) / 0.76) * Math.max(0, width - 48),
    y: 24 + clamp((point.y - 0.1) / 0.8) * Math.max(0, height - 48),
  };
}
