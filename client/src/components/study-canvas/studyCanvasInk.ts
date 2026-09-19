import type { ScratchpadBrush, ScratchpadPoint } from "@/services/question-notes.service";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizePointerPressure(pressure: number | undefined, pointerType: string) {
  if (pointerType === "mouse") return 0.65;
  if (pointerType === "touch") return 0.55;
  if (typeof pressure !== "number" || pressure <= 0) return 0.5;
  return clamp(pressure, 0.08, 1);
}

/** Width belongs to this sample. Previous samples may influence velocity, never pressure. */
export function calculateImmediatePointWidth({ point, previousPoint, size, brush }: {
  point: ScratchpadPoint; previousPoint?: ScratchpadPoint; size: number; brush: ScratchpadBrush;
}) {
  if (brush === "highlighter") return clamp(size * 2.4, 6, 40);
  const pressure = clamp(point.pressure ?? 0.5, 0.08, 1);
  const eased = pressure * pressure * (3 - 2 * pressure);
  const pressureFactor = brush === "brush" ? 0.16 + eased * 1.82 : 0.42 + eased * 0.96;
  let speedFactor = 1;
  if (previousPoint?.time && point.time && point.time > previousPoint.time) {
    const velocity = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) /
      Math.max(point.time - previousPoint.time, 1);
    speedFactor = clamp(1.05 - velocity * 0.12, 0.82, 1.05);
  }
  return clamp(size * pressureFactor * speedFactor, 0.65, size * 2.05);
}

export function getSafeCanvasPixelRatio(deviceRatio: number, width: number, height: number) {
  const pixelBudget = 12_000_000;
  const budgetRatio = Math.sqrt(pixelBudget / Math.max(1, width * height));
  return Math.max(1, Math.min(deviceRatio || 1, 2.5, budgetRatio));
}
