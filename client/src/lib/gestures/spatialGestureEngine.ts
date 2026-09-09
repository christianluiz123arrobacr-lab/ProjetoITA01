import type { Point } from "./gestureEngine";

export type SpatialHandGesture =
  | "open"
  | "indexPinch"
  | "middlePinch"
  | "pinkyPinch"
  | "fist"
  | "none";

export type SpatialHand = {
  gesture: SpatialHandGesture;
  cursor: Point;
  anchor: Point;
  depth: number;
  roll: number;
  indexPinch: Point;
  pinchRatios: { index: number; middle: number; pinky: number };
};

export type Vec3 = { x: number; y: number; z: number };

const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: (a.z + b.z) / 2,
});

const cosine = (a: Point, b: Point, c: Point) => {
  const ux = a.x - b.x;
  const uy = a.y - b.y;
  const uz = a.z - b.z;
  const vx = c.x - b.x;
  const vy = c.y - b.y;
  const vz = c.z - b.z;
  return (
    (ux * vx + uy * vy + uz * vz) /
    Math.max(0.00001, Math.hypot(ux, uy, uz) * Math.hypot(vx, vy, vz))
  );
};

export function analyzeSpatialHand(
  points: Point[],
  sensitivity = 1
): SpatialHand | null {
  if (
    points.length !== 21 ||
    points.some(point => ![point.x, point.y, point.z].every(Number.isFinite))
  )
    return null;

  const palmLength = distance(points[0], points[9]);
  const palmWidth = distance(points[5], points[17]);
  const scale = Math.max(palmLength, palmWidth);
  if (scale < 0.025) return null;

  const indexRatio = distance(points[4], points[8]) / scale;
  const middleRatio = distance(points[4], points[12]) / scale;
  const pinkyRatio = distance(points[4], points[20]) / scale;
  const fingers = [5, 9, 13, 17].map(
    base =>
      cosine(points[base], points[base + 1], points[base + 3]) < -0.68 &&
      distance(points[base + 3], points[0]) >
        distance(points[base + 1], points[0]) * 1.1
  );
  const thumb =
    cosine(points[2], points[3], points[4]) < -0.65 &&
    distance(points[4], points[17]) > distance(points[3], points[17]) * 1.08;

  let gesture: SpatialHandGesture = "none";
  const fist =
    !thumb &&
    fingers.every(value => !value) &&
    [8, 12, 16, 20].every(
      tip => distance(points[tip], points[0]) < scale * 1.4
    );
  const threshold = Math.max(0.22, Math.min(0.38, 0.29 * sensitivity));
  const closestPinch = Math.min(indexRatio, middleRatio, pinkyRatio);
  const separated = (candidate: number, others: number[]) =>
    candidate === closestPinch && others.every(value => candidate < value * 0.84);

  if (fist) gesture = "fist";
  else if (
    pinkyRatio < threshold * 1.08 &&
    separated(pinkyRatio, [indexRatio, middleRatio])
  )
    gesture = "pinkyPinch";
  else if (
    middleRatio < threshold &&
    separated(middleRatio, [indexRatio, pinkyRatio])
  )
    gesture = "middlePinch";
  else if (
    indexRatio < threshold &&
    separated(indexRatio, [middleRatio, pinkyRatio])
  )
    gesture = "indexPinch";
  else if (thumb && fingers.every(Boolean) && closestPinch > threshold)
    gesture = "open";

  const palmZ =
    (points[0].z + points[5].z + points[9].z + points[13].z + points[17].z) / 5;
  return {
    gesture,
    cursor: points[8],
    anchor: points[9],
    // Width carries camera distance; relative landmark Z adds a smaller depth cue.
    depth: palmWidth + Math.abs(points[9].z - palmZ) * 0.35,
    roll: Math.atan2(points[5].y - points[17].y, points[5].x - points[17].x),
    indexPinch: midpoint(points[4], points[8]),
    pinchRatios: {
      index: indexRatio,
      middle: middleRatio,
      pinky: pinkyRatio,
    },
  };
}

function deg(value: number) {
  return (value * Math.PI) / 180;
}

function rotateY(point: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: point.x * c + point.z * s,
    y: point.y,
    z: -point.x * s + point.z * c,
  };
}

function rotateX(point: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * c - point.z * s,
    z: point.y * s + point.z * c,
  };
}

/** Inverts the simulator's X-then-Y camera rotation for its screen plane. */
export function unprojectScreenDelta(
  dx: number,
  dy: number,
  depthDelta: number,
  rotationX: number,
  rotationY: number,
  projectScale = 138
): Vec3 {
  const camera = { x: dx / projectScale, y: -dy / projectScale, z: depthDelta };
  return rotateX(rotateY(camera, -deg(rotationY)), -deg(rotationX));
}

export function normalizeAngleDelta(current: number, previous: number) {
  let delta = current - previous;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function depthWithDeadZone(
  current: number,
  reference: number,
  deadZone = 0.012,
  sensitivity = 7
) {
  const difference = current - reference;
  if (Math.abs(difference) <= deadZone) return 0;
  return (difference - Math.sign(difference) * deadZone) * sensitivity;
}

export function safeScaleFactor(
  currentDistance: number,
  previousDistance: number
) {
  if (previousDistance < 0.02 || !Number.isFinite(currentDistance)) return 1;
  return Math.max(0.92, Math.min(1.08, currentDistance / previousDistance));
}
