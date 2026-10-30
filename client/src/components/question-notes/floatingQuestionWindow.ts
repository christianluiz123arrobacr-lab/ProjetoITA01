export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type WindowArea = { width: number; height: number };
export type WindowEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export function containQuestionWindow(
  bounds: WindowBounds,
  area: WindowArea
): WindowBounds {
  const width = clamp(bounds.width, Math.min(340, area.width), area.width);
  const height = clamp(bounds.height, Math.min(220, area.height), area.height);
  return {
    width,
    height,
    x: clamp(bounds.x, 0, area.width - width),
    y: clamp(bounds.y, 0, area.height - height),
  };
}

export function resizeQuestionWindow(
  start: WindowBounds,
  edge: WindowEdge,
  dx: number,
  dy: number,
  area: WindowArea
): WindowBounds {
  let { x, y, width, height } = start;
  if (edge.includes("e"))
    width = clamp(width + dx, Math.min(340, area.width), area.width - x);
  if (edge.includes("s"))
    height = clamp(height + dy, Math.min(220, area.height), area.height - y);
  if (edge.includes("w")) {
    const right = x + width;
    x = clamp(x + dx, 0, right - Math.min(340, area.width));
    width = right - x;
  }
  if (edge.includes("n")) {
    const bottom = y + height;
    y = clamp(y + dy, 0, bottom - Math.min(220, area.height));
    height = bottom - y;
  }
  return containQuestionWindow({ x, y, width, height }, area);
}
