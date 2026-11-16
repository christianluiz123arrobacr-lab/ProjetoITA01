import type { SpatialHand, Vec3 } from "./spatialGestureEngine";

export type HandSide = "Left" | "Right";
export type HandMode = "idle" | "move" | "rotate" | "scale";
/** MediaPipe labels assume a selfie-mirrored source; inference receives raw video pixels. */
export function displayHandSide(modelSide: HandSide): HandSide {
  return modelSide === "Left" ? "Right" : "Left";
}
export type HandSession = {
  side: HandSide;
  mode: HandMode;
  objectId: string | null;
  previous: SpatialHand | null;
  origin: SpatialHand | null;
  scaleReference: number | null;
  scaleApplied: number;
  lastSeen: number;
};

export function emptyHandSession(side: HandSide): HandSession {
  return { side, mode: "idle", objectId: null, previous: null, origin: null, scaleReference: null, scaleApplied: 1, lastSeen: 0 };
}

export function captureHand(session: HandSession, objectId: string, hand: SpatialHand, now: number, mode: HandMode): HandSession {
  return { ...session, mode, objectId, previous: hand, origin: hand, scaleReference: hand.depth, scaleApplied: 1, lastSeen: now };
}

export function releaseHand(session: HandSession): HandSession {
  return { ...session, mode: "idle", objectId: null, previous: null, origin: null, scaleReference: null, scaleApplied: 1 };
}

export function canCapture(sessions: Record<HandSide, HandSession>, side: HandSide, objectId: string) {
  return sessions[side === "Left" ? "Right" : "Left"].objectId !== objectId;
}

export function rotationFromAnchor(current: SpatialHand, previous: SpatialHand, sensitivity: number): Vec3 {
  const dx = current.anchor.x - previous.anchor.x;
  const dy = current.anchor.y - previous.anchor.y;
  return { x: -dy * 150 * sensitivity, y: dx * 150 * sensitivity, z: 0 };
}

export function advanceCursor(current: { x: number; y: number }, target: { x: number; y: number }, smoothing: number) {
  const distance = Math.hypot(target.x - current.x, target.y - current.y);
  const responsiveness = Math.min(1, Math.max(smoothing, 0.58) + distance / 350);
  return { x: current.x + (target.x - current.x) * responsiveness, y: current.y + (target.y - current.y) * responsiveness };
}

export function relativeScale(distance: number, reference: number, applied: number) {
  if (reference < 0.02 || !Number.isFinite(distance)) return { factor: 1, applied };
  const desired = Math.max(0.28, Math.min(3.2, distance / reference));
  return { factor: desired / applied, applied: desired };
}
