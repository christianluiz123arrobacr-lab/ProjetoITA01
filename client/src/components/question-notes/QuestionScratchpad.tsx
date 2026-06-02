import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  Eraser,
  Highlighter,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Move,
  PenLine,
  Redo2,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getQuestionNote,
  saveQuestionNote,
  type ScratchpadBackground,
  type ScratchpadBrush,
  type ScratchpadPoint,
  type ScratchpadShape,
  type ScratchpadStroke,
} from "@/services/question-notes.service";

type QuestionScratchpadProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
};

type ScratchpadTool = "pen" | "pan" | "areaEraser" | "strokeEraser" | "select" | "shape";
type InteractionMode = "none" | "stroke" | "erase" | "pan" | "shape" | "lasso" | "selectionMove" | "selectionResize";

type CanvasView = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type SelectionHandle = "nw" | "ne" | "sw" | "se";

type ResizeState = {
  handle: SelectionHandle;
  baseBounds: Bounds;
  baseStrokes: ScratchpadStroke[];
};

type LocalScratchpadDraft = {
  strokes: ScratchpadStroke[];
  backgroundType: ScratchpadBackground;
  updatedAt: string;
};

type PointerSnapshot = {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
};

type GestureState = {
  initialDistance: number;
  initialZoom: number;
  initialCenterLogical: { x: number; y: number };
};

type EraserPreview = {
  point: ScratchpadPoint;
  radius: number;
};

type NativePointerLike = {
  clientX: number;
  clientY: number;
  pressure?: number;
  pointerType?: string;
  timeStamp?: number;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 4;
const PAN_MARGIN = 140;
const PALM_REJECTION_MS = 900;
const MAX_HISTORY = 60;
const LOCAL_DRAFT_VERSION = "v2";

const COLORS = [
  "#0f172a",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#f59e0b",
];

const HIGHLIGHTER_COLORS = [
  "#fde047",
  "#bef264",
  "#93c5fd",
  "#f9a8d4",
  "#fdba74",
];

const BACKGROUNDS: { value: ScratchpadBackground; label: string }[] = [
  { value: "grid", label: "Quadriculado" },
  { value: "dots", label: "Pontilhado" },
  { value: "lined", label: "Linhas" },
  { value: "blank", label: "Branco" },
  { value: "cartesian", label: "Cartesiano" },
];

function createStrokeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: ScratchpadPoint, b: ScratchpadPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceXY(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function cloneStrokes(strokes: ScratchpadStroke[]) {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
}

function clampView(view: CanvasView): CanvasView {
  const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM);

  if (zoom <= 1) {
    return {
      zoom,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const minX = CANVAS_WIDTH - CANVAS_WIDTH * zoom - PAN_MARGIN;
  const maxX = PAN_MARGIN;
  const minY = CANVAS_HEIGHT - CANVAS_HEIGHT * zoom - PAN_MARGIN;
  const maxY = PAN_MARGIN;

  return {
    zoom,
    offsetX: clamp(view.offsetX, minX, maxX),
    offsetY: clamp(view.offsetY, minY, maxY),
  };
}

function distancePointToSegment(
  point: ScratchpadPoint,
  start: ScratchpadPoint,
  end: ScratchpadPoint
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1
  );

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function isPointNearPath(
  point: ScratchpadPoint,
  path: ScratchpadPoint[],
  radius: number
) {
  if (path.length === 0) return false;

  if (path.length === 1) {
    return distance(point, path[0]) <= radius;
  }

  for (let i = 1; i < path.length; i += 1) {
    if (distancePointToSegment(point, path[i - 1], path[i]) <= radius) {
      return true;
    }
  }

  return false;
}

function pathLength(path: ScratchpadPoint[]) {
  let total = 0;

  for (let i = 1; i < path.length; i += 1) {
    total += distance(path[i - 1], path[i]);
  }

  return total;
}

function isPointInPolygon(point: ScratchpadPoint, polygon: ScratchpadPoint[]) {
  if (polygon.length < 3) return false;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function isValidBackground(value: unknown): value is ScratchpadBackground {
  return ["grid", "dots", "lined", "blank", "cartesian"].includes(String(value));
}

function isStrokeTouchedByPath(
  stroke: ScratchpadStroke,
  path: ScratchpadPoint[],
  radius: number
) {
  if (stroke.tool === "shape") {
    return stroke.points.some((point) => isPointNearPath(point, path, radius)) ||
      path.some((point) => isPointNearStroke(point, stroke, radius));
  }

  return stroke.points.some((point) => isPointNearPath(point, path, radius));
}

function splitStrokeByEraser(
  stroke: ScratchpadStroke,
  path: ScratchpadPoint[],
  radius: number
) {
  if (stroke.tool !== "pen") return [stroke];

  const chunks: ScratchpadPoint[][] = [];
  let currentChunk: ScratchpadPoint[] = [];
  let changed = false;

  for (const point of stroke.points) {
    if (isPointNearPath(point, path, radius)) {
      changed = true;

      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    } else {
      currentChunk.push(point);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  if (!changed) return [stroke];

  return chunks
    .filter((points) => points.length > 0)
    .map((points, index) => ({
      ...stroke,
      id: `${stroke.id}-cut-${index}-${createStrokeId()}`,
      points,
    }));
}

function eraseStrokesByArea(
  strokes: ScratchpadStroke[],
  path: ScratchpadPoint[],
  radius: number
) {
  return strokes.flatMap((stroke) => splitStrokeByEraser(stroke, path, radius));
}

function eraseWholeStrokes(
  strokes: ScratchpadStroke[],
  path: ScratchpadPoint[],
  radius: number
) {
  return strokes.filter((stroke) => !isStrokeTouchedByPath(stroke, path, radius));
}

function normalizePressure(pressure: number | undefined, pointerType: string) {
  if (pointerType === "mouse") return 0.65;

  if (typeof pressure !== "number" || pressure <= 0) {
    return pointerType === "touch" ? 0.55 : 0.5;
  }

  return clamp(pressure, 0.08, 1);
}

function getFallbackWidth(point: ScratchpadPoint, stroke: ScratchpadStroke) {
  const pressure = clamp(point.pressure ?? 0.5, 0.08, 1);

  if (stroke.brush === "brush") {
    return clamp(stroke.size * (0.2 + pressure * 1.55), 0.7, stroke.size * 1.9);
  }

  if (stroke.brush === "highlighter") {
    return clamp(stroke.size * 2.4, 6, 40);
  }

  return clamp(stroke.size * (0.45 + pressure * 0.85), 0.7, stroke.size * 1.35);
}

function getPointWidth(point: ScratchpadPoint, stroke: ScratchpadStroke) {
  if (typeof point.width === "number" && Number.isFinite(point.width)) {
    return clamp(point.width, 0.6, stroke.size * 2.8);
  }

  return getFallbackWidth(point, stroke);
}

function calculatePointWidth({
  point,
  previousPoint,
  size,
  brush,
}: {
  point: ScratchpadPoint;
  previousPoint?: ScratchpadPoint;
  size: number;
  brush: ScratchpadBrush;
}) {
  const pressure = clamp(point.pressure ?? 0.5, 0.08, 1);

  if (brush === "highlighter") {
    return clamp(size * 2.4, 6, 40);
  }

  const pressureFactor =
    brush === "brush" ? 0.18 + pressure * 1.7 : 0.46 + pressure * 0.9;

  let speedFactor = 1;

  if (previousPoint?.time && point.time && point.time > previousPoint.time) {
    const distanceBetweenPoints = distance(point, previousPoint);
    const deltaTime = point.time - previousPoint.time;
    const velocity = distanceBetweenPoints / Math.max(deltaTime, 1);

    speedFactor = clamp(1.12 - velocity * 0.35, 0.62, 1.12);
  }

  const rawWidth = clamp(size * pressureFactor * speedFactor, 0.65, size * 2.05);

  if (typeof previousPoint?.width === "number") {
    return previousPoint.width * 0.72 + rawWidth * 0.28;
  }

  return rawWidth;
}

function shouldAppendPoint(
  previousPoint: ScratchpadPoint | undefined,
  nextPoint: ScratchpadPoint
) {
  if (!previousPoint) return true;

  return distance(previousPoint, nextPoint) >= 0.55;
}

function getVisibleLogicalRect(view: CanvasView) {
  return {
    left: (-view.offsetX - 30) / view.zoom,
    right: (CANVAS_WIDTH - view.offsetX + 30) / view.zoom,
    top: (-view.offsetY - 30) / view.zoom,
    bottom: (CANVAS_HEIGHT - view.offsetY + 30) / view.zoom,
  };
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  view: CanvasView,
  backgroundType: ScratchpadBackground
) {
  const visible = getVisibleLogicalRect(view);

  if (backgroundType === "blank") return;

  if (backgroundType === "dots") {
    const step = 25;
    const startX = Math.floor(visible.left / step) * step;
    const endX = Math.ceil(visible.right / step) * step;
    const startY = Math.floor(visible.top / step) * step;
    const endY = Math.ceil(visible.bottom / step) * step;

    ctx.save();
    ctx.fillStyle = "#cbd5e1";

    for (let x = startX; x <= endX; x += step) {
      for (let y = startY; y <= endY; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.35 / view.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    return;
  }

  if (backgroundType === "lined") {
    const step = 34;
    const startY = Math.floor(visible.top / step) * step;
    const endY = Math.ceil(visible.bottom / step) * step;

    ctx.save();
    ctx.strokeStyle = "#dbeafe";
    ctx.lineWidth = 1.2 / view.zoom;

    for (let y = startY; y <= endY; y += step) {
      ctx.beginPath();
      ctx.moveTo(visible.left, y);
      ctx.lineTo(visible.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 1.3 / view.zoom;
    ctx.beginPath();
    ctx.moveTo(70, visible.top);
    ctx.lineTo(70, visible.bottom);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const smallStep = 25;
  const bigStep = 100;
  const startSmallX = Math.floor(visible.left / smallStep) * smallStep;
  const endSmallX = Math.ceil(visible.right / smallStep) * smallStep;
  const startSmallY = Math.floor(visible.top / smallStep) * smallStep;
  const endSmallY = Math.ceil(visible.bottom / smallStep) * smallStep;

  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1 / view.zoom;

  for (let x = startSmallX; x <= endSmallX; x += smallStep) {
    ctx.beginPath();
    ctx.moveTo(x, visible.top);
    ctx.lineTo(x, visible.bottom);
    ctx.stroke();
  }

  for (let y = startSmallY; y <= endSmallY; y += smallStep) {
    ctx.beginPath();
    ctx.moveTo(visible.left, y);
    ctx.lineTo(visible.right, y);
    ctx.stroke();
  }

  const startBigX = Math.floor(visible.left / bigStep) * bigStep;
  const endBigX = Math.ceil(visible.right / bigStep) * bigStep;
  const startBigY = Math.floor(visible.top / bigStep) * bigStep;
  const endBigY = Math.ceil(visible.bottom / bigStep) * bigStep;

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.4 / view.zoom;

  for (let x = startBigX; x <= endBigX; x += bigStep) {
    ctx.beginPath();
    ctx.moveTo(x, visible.top);
    ctx.lineTo(x, visible.bottom);
    ctx.stroke();
  }

  for (let y = startBigY; y <= endBigY; y += bigStep) {
    ctx.beginPath();
    ctx.moveTo(visible.left, y);
    ctx.lineTo(visible.right, y);
    ctx.stroke();
  }

  if (backgroundType === "cartesian") {
    const axisX = CANVAS_WIDTH / 2;
    const axisY = CANVAS_HEIGHT / 2;

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2 / view.zoom;

    ctx.beginPath();
    ctx.moveTo(axisX, visible.top);
    ctx.lineTo(axisX, visible.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(visible.left, axisY);
    ctx.lineTo(visible.right, axisY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPaper(
  ctx: CanvasRenderingContext2D,
  view: CanvasView,
  backgroundType: ScratchpadBackground,
  pixelRatio = 1
) {
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.zoom, view.zoom);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-10000, -10000, 20000, 20000);
  drawBackground(ctx, view, backgroundType);
  ctx.restore();
}

function applyView(ctx: CanvasRenderingContext2D, view: CanvasView) {
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.zoom, view.zoom);
}

function drawRoundDot(
  ctx: CanvasRenderingContext2D,
  point: ScratchpadPoint,
  radius: number,
  color: string
) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPenStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (stroke.points.length === 0) return;

  const firstPoint = stroke.points[0];

  ctx.save();
  ctx.globalCompositeOperation = stroke.brush === "highlighter" ? "multiply" : "source-over";
  ctx.globalAlpha = stroke.opacity ?? (stroke.brush === "highlighter" ? 0.35 : 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;

  if (stroke.brush === "brush") {
    ctx.globalAlpha = stroke.opacity ?? 0.97;
  }

  if (stroke.points.length === 1) {
    drawRoundDot(ctx, firstPoint, getPointWidth(firstPoint, stroke) / 2, stroke.color);
    ctx.restore();
    return;
  }

  if (stroke.points.length === 2) {
    const previous = stroke.points[0];
    const current = stroke.points[1];
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(current.x, current.y);
    ctx.lineWidth = (getPointWidth(previous, stroke) + getPointWidth(current, stroke)) / 2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  const points = stroke.points;

  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    const startMid = {
      x: (previous.x + current.x) / 2,
      y: (previous.y + current.y) / 2,
    };
    const endMid = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2,
    };

    ctx.beginPath();
    ctx.moveTo(startMid.x, startMid.y);
    ctx.quadraticCurveTo(current.x, current.y, endMid.x, endMid.y);
    ctx.lineWidth = (getPointWidth(previous, stroke) + getPointWidth(current, stroke) + getPointWidth(next, stroke)) / 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  start: ScratchpadPoint,
  end: ScratchpadPoint,
  size: number
) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(12, size * 4.5);

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawShapeStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (stroke.points.length < 2) return;

  const start = stroke.points[0];
  const end = stroke.points[stroke.points.length - 1];
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  ctx.save();
  ctx.globalAlpha = stroke.opacity ?? 1;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (stroke.shape === "rectangle") {
    ctx.strokeRect(x, y, width, height);
  } else if (stroke.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (stroke.shape === "arrow") {
      drawArrowHead(ctx, start, end, stroke.size);
    }
  }

  ctx.restore();
}

function drawLegacyEraserStroke(
  ctx: CanvasRenderingContext2D,
  stroke: ScratchpadStroke
) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.size * 4;
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";

  ctx.beginPath();

  const firstPoint = stroke.points[0];
  ctx.moveTo(firstPoint.x, firstPoint.y);

  if (stroke.points.length === 1) {
    ctx.lineTo(firstPoint.x + 0.1, firstPoint.y + 0.1);
  } else {
    for (let i = 1; i < stroke.points.length; i += 1) {
      const point = stroke.points[i];
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (stroke.tool === "eraser") {
    drawLegacyEraserStroke(ctx, stroke);
    return;
  }

  if (stroke.tool === "shape") {
    drawShapeStroke(ctx, stroke);
    return;
  }

  drawPenStroke(ctx, stroke);
}

function drawEraserPreview(
  ctx: CanvasRenderingContext2D,
  preview: EraserPreview
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(preview.point.x, preview.point.y, preview.radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(124, 58, 237, 0.08)";
  ctx.strokeStyle = "rgba(124, 58, 237, 0.65)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLassoPreview(ctx: CanvasRenderingContext2D, path: ScratchpadPoint[], view: CanvasView) {
  if (path.length < 2) return;

  ctx.save();
  ctx.strokeStyle = "rgba(124, 58, 237, 0.95)";
  ctx.fillStyle = "rgba(124, 58, 237, 0.08)";
  ctx.lineWidth = 2 / view.zoom;
  ctx.setLineDash([8 / view.zoom, 6 / view.zoom]);
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x, path[i].y);
  }

  ctx.stroke();

  if (path.length > 3) {
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function getStrokeBounds(stroke: ScratchpadStroke): Bounds | null {
  if (stroke.points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of stroke.points) {
    const padding = Math.max(getPointWidth(point, stroke), stroke.size, 4) / 2;
    minX = Math.min(minX, point.x - padding);
    minY = Math.min(minY, point.y - padding);
    maxX = Math.max(maxX, point.x + padding);
    maxY = Math.max(maxY, point.y + padding);
  }

  return { minX, minY, maxX, maxY };
}

function mergeBounds(bounds: Bounds[]): Bounds | null {
  if (bounds.length === 0) return null;

  return bounds.reduce(
    (acc, box) => ({
      minX: Math.min(acc.minX, box.minX),
      minY: Math.min(acc.minY, box.minY),
      maxX: Math.max(acc.maxX, box.maxX),
      maxY: Math.max(acc.maxY, box.maxY),
    }),
    bounds[0]
  );
}

function getSelectedBounds(strokes: ScratchpadStroke[], selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  const boxes = strokes
    .filter((stroke) => selectedSet.has(stroke.id))
    .map(getStrokeBounds)
    .filter(Boolean) as Bounds[];

  const merged = mergeBounds(boxes);

  if (!merged) return null;

  return {
    minX: merged.minX - 10,
    minY: merged.minY - 10,
    maxX: merged.maxX + 10,
    maxY: merged.maxY + 10,
  };
}

function isPointInsideBounds(point: ScratchpadPoint, bounds: Bounds) {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, bounds: Bounds | null, view: CanvasView) {
  if (!bounds) return;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const handleSize = 10 / view.zoom;

  ctx.save();
  ctx.strokeStyle = "rgba(124, 58, 237, 0.95)";
  ctx.fillStyle = "rgba(124, 58, 237, 0.08)";
  ctx.lineWidth = 2 / view.zoom;
  ctx.setLineDash([7 / view.zoom, 5 / view.zoom]);
  ctx.fillRect(bounds.minX, bounds.minY, width, height);
  ctx.strokeRect(bounds.minX, bounds.minY, width, height);
  ctx.setLineDash([]);

  const handles = [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.minX, bounds.maxY],
    [bounds.maxX, bounds.maxY],
  ];

  for (const [x, y] of handles) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2 / view.zoom;
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  }

  ctx.restore();
}

function getSelectionHandles(bounds: Bounds) {
  return [
    { handle: "nw" as const, x: bounds.minX, y: bounds.minY },
    { handle: "ne" as const, x: bounds.maxX, y: bounds.minY },
    { handle: "sw" as const, x: bounds.minX, y: bounds.maxY },
    { handle: "se" as const, x: bounds.maxX, y: bounds.maxY },
  ];
}

function getSelectionHandleAtPoint(
  point: ScratchpadPoint,
  bounds: Bounds,
  view: CanvasView
): SelectionHandle | null {
  const hitRadius = 15 / view.zoom;

  for (const item of getSelectionHandles(bounds)) {
    if (Math.abs(point.x - item.x) <= hitRadius && Math.abs(point.y - item.y) <= hitRadius) {
      return item.handle;
    }
  }

  return null;
}

function getOppositeCorner(bounds: Bounds, handle: SelectionHandle) {
  if (handle === "nw") return { x: bounds.maxX, y: bounds.maxY };
  if (handle === "ne") return { x: bounds.minX, y: bounds.maxY };
  if (handle === "sw") return { x: bounds.maxX, y: bounds.minY };
  return { x: bounds.minX, y: bounds.minY };
}

function scaleStrokeFromBounds(
  stroke: ScratchpadStroke,
  baseBounds: Bounds,
  handle: SelectionHandle,
  currentPoint: ScratchpadPoint
) {
  const anchor = getOppositeCorner(baseBounds, handle);
  const baseHandlePoint = {
    x: handle === "nw" || handle === "sw" ? baseBounds.minX : baseBounds.maxX,
    y: handle === "nw" || handle === "ne" ? baseBounds.minY : baseBounds.maxY,
  };

  const baseDx = baseHandlePoint.x - anchor.x;
  const baseDy = baseHandlePoint.y - anchor.y;
  const nextDx = currentPoint.x - anchor.x;
  const nextDy = currentPoint.y - anchor.y;

  const scaleX = Math.abs(baseDx) < 1 ? 1 : clamp(nextDx / baseDx, 0.12, 8);
  const scaleY = Math.abs(baseDy) < 1 ? 1 : clamp(nextDy / baseDy, 0.12, 8);
  const widthScale = clamp((Math.abs(scaleX) + Math.abs(scaleY)) / 2, 0.25, 4);

  return transformStrokePoints(
    stroke,
    (point) => ({
      ...point,
      x: anchor.x + (point.x - anchor.x) * scaleX,
      y: anchor.y + (point.y - anchor.y) * scaleY,
    }),
    widthScale
  );
}

function getStraightnessScore(stroke: ScratchpadStroke) {
  if (stroke.points.length < 3) return 1;

  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  const length = Math.max(distance(first, last), 1);
  const averageDeviation =
    stroke.points.reduce((total, point) => total + distancePointToSegment(point, first, last), 0) /
    stroke.points.length;

  return averageDeviation / length;
}

function transformStrokeToPerfectShape(
  stroke: ScratchpadStroke,
  shape: ScratchpadShape
): ScratchpadStroke {
  const bounds = getStrokeBounds(stroke);

  if (!bounds) return stroke;

  if (shape === "line" || shape === "arrow") {
    if (stroke.points.length >= 2) {
      const first = stroke.points[0];
      const last = stroke.points[stroke.points.length - 1];
      const averageWidth =
        stroke.points.reduce((total, point) => total + (point.width ?? getFallbackWidth(point, stroke)), 0) /
        Math.max(stroke.points.length, 1);

      return {
        ...stroke,
        tool: "shape",
        shape,
        opacity: stroke.opacity ?? 1,
        points: [
          { ...first, width: averageWidth },
          { ...last, width: averageWidth },
        ],
      };
    }
  }

  const width = Math.max(bounds.maxX - bounds.minX, 8);
  const height = Math.max(bounds.maxY - bounds.minY, 8);
  const size = Math.max(2, stroke.size);

  return {
    ...stroke,
    tool: "shape",
    shape,
    opacity: stroke.opacity ?? 1,
    size,
    points: [
      { x: bounds.minX, y: bounds.minY, pressure: 0.6, width: size },
      { x: bounds.minX + width, y: bounds.minY + height, pressure: 0.6, width: size },
    ],
  };
}

function guessPerfectShape(stroke: ScratchpadStroke): ScratchpadShape {
  const bounds = getStrokeBounds(stroke);

  if (!bounds) return "line";

  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const aspect = width / height;

  if (stroke.tool === "shape" && stroke.shape) return stroke.shape;
  if (getStraightnessScore(stroke) < 0.12) return "line";
  if (aspect > 0.72 && aspect < 1.38) return "ellipse";
  return "rectangle";
}

function smoothFreehandStroke(stroke: ScratchpadStroke): ScratchpadStroke {
  if (stroke.tool !== "pen" || stroke.points.length < 5) return stroke;

  const points = stroke.points.map((point, index, list) => {
    if (index === 0 || index === list.length - 1) return point;

    const previous = list[index - 1];
    const next = list[index + 1];

    return {
      ...point,
      x: previous.x * 0.18 + point.x * 0.64 + next.x * 0.18,
      y: previous.y * 0.18 + point.y * 0.64 + next.y * 0.18,
      width:
        typeof point.width === "number"
          ? ((previous.width ?? point.width) * 0.2 + point.width * 0.6 + (next.width ?? point.width) * 0.2)
          : point.width,
      pressure:
        typeof point.pressure === "number"
          ? ((previous.pressure ?? point.pressure) * 0.2 + point.pressure * 0.6 + (next.pressure ?? point.pressure) * 0.2)
          : point.pressure,
    };
  });

  return {
    ...stroke,
    points,
  };
}

function enrichPointPath(points: ScratchpadPoint[]) {
  if (points.length < 2) return points;

  const enriched: ScratchpadPoint[] = [points[0]];

  for (let i = 1; i < points.length; i += 1) {
    const previous = enriched[enriched.length - 1];
    const current = points[i];
    const gap = distance(previous, current);
    const steps = Math.min(6, Math.floor(gap / 5));

    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      enriched.push({
        x: previous.x + (current.x - previous.x) * t,
        y: previous.y + (current.y - previous.y) * t,
        pressure: (previous.pressure ?? 0.5) + ((current.pressure ?? 0.5) - (previous.pressure ?? 0.5)) * t,
        width:
          typeof previous.width === "number" && typeof current.width === "number"
            ? previous.width + (current.width - previous.width) * t
            : current.width,
        time:
          typeof previous.time === "number" && typeof current.time === "number"
            ? previous.time + (current.time - previous.time) * t
            : current.time,
      });
    }

    enriched.push(current);
  }

  return enriched;
}


function isPointNearStroke(point: ScratchpadPoint, stroke: ScratchpadStroke, radius: number) {
  if (stroke.tool === "shape" && stroke.points.length >= 2) {
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    const box = getStrokeBounds(stroke);

    if (!box) return false;

    if (stroke.shape === "line" || stroke.shape === "arrow") {
      return distancePointToSegment(point, start, end) <= radius + stroke.size;
    }

    if (stroke.shape === "rectangle") {
      const corners = [
        { x: box.minX, y: box.minY },
        { x: box.maxX, y: box.minY },
        { x: box.maxX, y: box.maxY },
        { x: box.minX, y: box.maxY },
      ];

      return (
        isPointInsideBounds(point, box) ||
        distancePointToSegment(point, corners[0], corners[1]) <= radius + stroke.size ||
        distancePointToSegment(point, corners[1], corners[2]) <= radius + stroke.size ||
        distancePointToSegment(point, corners[2], corners[3]) <= radius + stroke.size ||
        distancePointToSegment(point, corners[3], corners[0]) <= radius + stroke.size
      );
    }

    if (stroke.shape === "ellipse") {
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const rx = Math.max(Math.abs(end.x - start.x) / 2, 1);
      const ry = Math.max(Math.abs(end.y - start.y) / 2, 1);
      const value = ((point.x - centerX) ** 2) / (rx ** 2) + ((point.y - centerY) ** 2) / (ry ** 2);
      return value <= 1.15;
    }
  }

  if (stroke.points.length === 1) {
    return distance(point, stroke.points[0]) <= radius + stroke.size;
  }

  for (let i = 1; i < stroke.points.length; i += 1) {
    const padding = Math.max(getPointWidth(stroke.points[i], stroke), stroke.size, 4) / 2;
    if (distancePointToSegment(point, stroke.points[i - 1], stroke.points[i]) <= radius + padding) {
      return true;
    }
  }

  return false;
}

function findStrokeAtPoint(strokes: ScratchpadStroke[], point: ScratchpadPoint, radius = 14) {
  for (let i = strokes.length - 1; i >= 0; i -= 1) {
    if (isPointNearStroke(point, strokes[i], radius)) {
      return strokes[i];
    }
  }

  return null;
}

function getStrokeCenterPoint(stroke: ScratchpadStroke) {
  const bounds = getStrokeBounds(stroke);

  if (!bounds) return null;

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function selectStrokesByLasso(strokes: ScratchpadStroke[], lassoPath: ScratchpadPoint[]) {
  if (lassoPath.length < 3) return [];

  return strokes
    .filter((stroke) => {
      const center = getStrokeCenterPoint(stroke);
      return (
        stroke.points.some((point) => isPointInPolygon(point, lassoPath)) ||
        Boolean(center && isPointInPolygon(center, lassoPath)) ||
        isStrokeTouchedByPath(stroke, lassoPath, 8)
      );
    })
    .map((stroke) => stroke.id);
}

function transformStrokePoints(
  stroke: ScratchpadStroke,
  transformPoint: (point: ScratchpadPoint) => ScratchpadPoint,
  widthScale = 1
): ScratchpadStroke {
  return {
    ...stroke,
    size: Math.max(1, stroke.size * widthScale),
    points: stroke.points.map((point) => ({
      ...transformPoint(point),
      width: typeof point.width === "number" ? Math.max(0.6, point.width * widthScale) : point.width,
    })),
  };
}

function straightenStroke(stroke: ScratchpadStroke): ScratchpadStroke {
  if (stroke.tool === "shape") {
    return {
      ...stroke,
      shape: stroke.shape === "arrow" ? "arrow" : "line",
    };
  }

  if (stroke.points.length < 2) return stroke;

  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  const averageWidth =
    stroke.points.reduce((total, point) => total + (point.width ?? getFallbackWidth(point, stroke)), 0) /
    Math.max(stroke.points.length, 1);

  return {
    ...stroke,
    tool: "shape",
    shape: "line",
    opacity: stroke.opacity ?? 1,
    points: [
      { ...first, width: averageWidth },
      { ...last, width: averageWidth },
    ],
  };
}

function getCanvasPixelRatio() {
  return Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
}

function ensureCanvasBitmap(canvas: HTMLCanvasElement) {
  const pixelRatio = getCanvasPixelRatio();
  const nextWidth = Math.round(CANVAS_WIDTH * pixelRatio);
  const nextHeight = Math.round(CANVAS_HEIGHT * pixelRatio);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  return pixelRatio;
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return [maybeError.message, maybeError.details, maybeError.hint, maybeError.code]
      .filter(Boolean)
      .join(" | ");
  }

  return "Erro desconhecido.";
}

function getLocalDraftKey(userId: string | null | undefined, questionId: string) {
  return `${LOCAL_DRAFT_VERSION}:question-note:${userId ?? "anonymous"}:${questionId}`;
}

function readLocalDraft(userId: string | null | undefined, questionId: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getLocalDraftKey(userId, questionId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LocalScratchpadDraft;

    if (!Array.isArray(parsed.strokes) || !isValidBackground(parsed.backgroundType)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeLocalDraft({
  userId,
  questionId,
  strokes,
  backgroundType,
}: {
  userId?: string | null;
  questionId: string;
  strokes: ScratchpadStroke[];
  backgroundType: ScratchpadBackground;
}) {
  if (typeof window === "undefined") return null;

  const draft: LocalScratchpadDraft = {
    strokes,
    backgroundType,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(getLocalDraftKey(userId, questionId), JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

function isLocalDraftNewer(localDraft: LocalScratchpadDraft | null, remoteUpdatedAt?: string | null) {
  if (!localDraft) return false;
  if (!remoteUpdatedAt) return true;

  return new Date(localDraft.updatedAt).getTime() - new Date(remoteUpdatedAt).getTime() > 15000;
}


function getTwoTouchPointers(activePointers: Map<number, PointerSnapshot>) {
  return Array.from(activePointers.values())
    .filter((pointer) => pointer.pointerType === "touch")
    .slice(0, 2);
}

function toolButtonClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
    active
      ? "bg-violet-600 text-white"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }`;
}

function ToolbarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100">
      <span className="px-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

export function QuestionScratchpad({
  userId,
  questionId,
  questionCode,
}: QuestionScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<ScratchpadStroke | null>(null);
  const shapeStrokeRef = useRef<ScratchpadStroke | null>(null);
  const eraserPathRef = useRef<ScratchpadPoint[]>([]);
  const lassoPathRef = useRef<ScratchpadPoint[]>([]);
  const panLastRawPointRef = useRef<{ x: number; y: number } | null>(null);
  const selectionLastPointRef = useRef<ScratchpadPoint | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const strokesBeforeInteractionRef = useRef<ScratchpadStroke[] | null>(null);
  const selectionMovedRef = useRef(false);
  const strokesRef = useRef<ScratchpadStroke[]>([]);
  const dirtyRef = useRef(false);
  const backgroundTypeRef = useRef<ScratchpadBackground>("grid");
  const activePointerIdRef = useRef<number | null>(null);
  const activePointersRef = useRef<Map<number, PointerSnapshot>>(new Map());
  const gestureRef = useRef<GestureState | null>(null);
  const interactionModeRef = useRef<InteractionMode>("none");
  const lastPenInteractionAtRef = useRef(0);
  const historyRef = useRef<ScratchpadStroke[][]>([]);
  const redoHistoryRef = useRef<ScratchpadStroke[][]>([]);
  const viewRef = useRef<CanvasView>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<ScratchpadTool>("pen");
  const [brush, setBrush] = useState<ScratchpadBrush>("pen");
  const [shapeTool, setShapeTool] = useState<ScratchpadShape>("line");
  const [backgroundType, setBackgroundType] = useState<ScratchpadBackground>("grid");
  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(24);
  const [strokes, setStrokesState] = useState<ScratchpadStroke[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<CanvasView>(viewRef.current);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);
  const [localStatus, setLocalStatus] = useState("");

  const canSave = Boolean(userId && questionId);

  const title = useMemo(() => {
    return questionCode ? `Rascunho da questão ${questionCode}` : "Rascunho da questão";
  }, [questionCode]);

  const selectedBounds = useMemo(
    () => getSelectedBounds(strokes, selectedIds),
    [selectedIds, strokes]
  );

  const replaceStrokes = useCallback((nextStrokes: ScratchpadStroke[]) => {
    strokesRef.current = nextStrokes;
    setStrokesState(nextStrokes);
  }, []);

  function pushHistorySnapshot(snapshot: ScratchpadStroke[]) {
    historyRef.current = [...historyRef.current, cloneStrokes(snapshot)].slice(-MAX_HISTORY);
    redoHistoryRef.current = [];
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(0);
  }

  function markDirty(message = "Alterações não salvas.") {
    dirtyRef.current = true;
    setDirty(true);
    setStatus(message);
    setError("");
  }

  function commitStrokes(nextStrokes: ScratchpadStroke[], historyBase = strokesRef.current) {
    pushHistorySnapshot(historyBase);
    replaceStrokes(nextStrokes);
    markDirty();
  }

  const updateView = useCallback((nextView: CanvasView | ((previous: CanvasView) => CanvasView)) => {
    setView((previous) => {
      const rawNext = typeof nextView === "function" ? nextView(previous) : nextView;
      const clamped = clampView(rawNext);
      viewRef.current = clamped;
      return clamped;
    });
  }, []);

  const getRawCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }, []);

  const getCanvasPointFromNative = useCallback(
    (nativeEvent: NativePointerLike, pointerTypeFallback: string): ScratchpadPoint => {
      const rawPoint = getRawCanvasPoint(nativeEvent.clientX, nativeEvent.clientY);
      const currentView = viewRef.current;

      return {
        x: (rawPoint.x - currentView.offsetX) / currentView.zoom,
        y: (rawPoint.y - currentView.offsetY) / currentView.zoom,
        pressure: normalizePressure(
          nativeEvent.pressure,
          nativeEvent.pointerType ?? pointerTypeFallback
        ),
        time: nativeEvent.timeStamp ?? performance.now(),
      };
    },
    [getRawCanvasPoint]
  );

  const getCanvasPointsFromEvent = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const nativeEvent = event.nativeEvent as PointerEvent & {
        getCoalescedEvents?: () => PointerEvent[];
      };

      const coalescedEvents =
        typeof nativeEvent.getCoalescedEvents === "function"
          ? nativeEvent.getCoalescedEvents()
          : [];

      const sourceEvents = coalescedEvents.length > 0 ? coalescedEvents : [nativeEvent];

      return sourceEvents.map((sourceEvent) =>
        getCanvasPointFromNative(sourceEvent, event.pointerType)
      );
    },
    [getCanvasPointFromNative]
  );

  const redrawCanvas = useCallback(
    (
      extraStroke?: ScratchpadStroke | null,
      eraserPreview?: EraserPreview | null,
      lassoPreview?: ScratchpadPoint[] | null
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pixelRatio = ensureCanvasBitmap(canvas);

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      drawPaper(ctx, viewRef.current, backgroundTypeRef.current, pixelRatio);

      const inkLayer = document.createElement("canvas");
      inkLayer.width = Math.round(CANVAS_WIDTH * pixelRatio);
      inkLayer.height = Math.round(CANVAS_HEIGHT * pixelRatio);

      const inkCtx = inkLayer.getContext("2d");
      if (!inkCtx) return;

      inkCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      inkCtx.imageSmoothingEnabled = true;
      inkCtx.imageSmoothingQuality = "high";

      inkCtx.save();
      applyView(inkCtx, viewRef.current);

      for (const stroke of strokesRef.current) {
        drawStroke(inkCtx, stroke);
      }

      if (extraStroke) {
        drawStroke(inkCtx, extraStroke);
      }

      if (eraserPreview) {
        drawEraserPreview(inkCtx, eraserPreview);
      }

      if (lassoPreview) {
        drawLassoPreview(inkCtx, lassoPreview, viewRef.current);
      }

      drawSelectionBox(
        inkCtx,
        getSelectedBounds(strokesRef.current, selectedIds),
        viewRef.current
      );

      inkCtx.restore();

      ctx.drawImage(inkLayer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },
    [selectedIds]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ensureCanvasBitmap(canvas);

    redrawCanvas();
  }, [open, fullscreen, redrawCanvas]);

  useEffect(() => {
    viewRef.current = view;
    redrawCanvas();
  }, [view, redrawCanvas]);

  useEffect(() => {
    strokesRef.current = strokes;
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  useEffect(() => {
    backgroundTypeRef.current = backgroundType;
    redrawCanvas();
  }, [backgroundType, redrawCanvas]);


  useEffect(() => {
    if (!loaded || !questionId || !dirtyRef.current) return;

    const draft = writeLocalDraft({
      userId,
      questionId,
      strokes,
      backgroundType,
    });

    if (draft) {
      setLocalStatus("Backup local salvo no navegador.");
    }
  }, [backgroundType, loaded, questionId, strokes, userId]);

  useEffect(() => {
    redrawCanvas();
  }, [selectedIds, redrawCanvas]);

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      setLoaded(false);
      setStatus("");
      setError("");

      if (!userId || !questionId) {
        replaceStrokes([]);
        setSelectedIds([]);
        historyRef.current = [];
        redoHistoryRef.current = [];
        setHistoryDepth(0);
        setRedoDepth(0);
        dirtyRef.current = false;
        setDirty(false);
        setLoaded(true);
        return;
      }

      try {
        const note = await getQuestionNote({ userId, questionId });
        const localDraft = readLocalDraft(userId, questionId);

        if (cancelled) return;

        const shouldUseLocal = isLocalDraftNewer(localDraft, note?.updated_at);
        const loadedStrokes = shouldUseLocal
          ? localDraft?.strokes ?? []
          : Array.isArray(note?.strokes)
            ? note.strokes
            : localDraft?.strokes ?? [];
        const loadedBackground = shouldUseLocal
          ? localDraft?.backgroundType ?? "grid"
          : isValidBackground(note?.background_type)
            ? note.background_type
            : localDraft?.backgroundType ?? "grid";

        replaceStrokes(loadedStrokes);
        setBackgroundType(loadedBackground);
        backgroundTypeRef.current = loadedBackground;
        setSelectedIds([]);
        historyRef.current = [];
        redoHistoryRef.current = [];
        setHistoryDepth(0);
        setRedoDepth(0);
        dirtyRef.current = shouldUseLocal;
        setDirty(shouldUseLocal);
        setLocalStatus(shouldUseLocal ? "Rascunho local recuperado. Clique em Salvar para enviar à nuvem." : "Backup local ativo.");
        if (shouldUseLocal) {
          setStatus("Rascunho local recuperado.");
        }
      } catch (loadError) {
        console.error("Erro ao carregar rascunho:", loadError);

        if (!cancelled) {
          const localDraft = readLocalDraft(userId, questionId);

          if (localDraft) {
            replaceStrokes(localDraft.strokes);
            setBackgroundType(localDraft.backgroundType);
            backgroundTypeRef.current = localDraft.backgroundType;
            dirtyRef.current = true;
            setDirty(true);
            setLocalStatus("Rascunho local recuperado. A nuvem falhou, mas o navegador salvou sua pele.");
            setStatus("Rascunho local recuperado.");
          } else {
            setError("Não foi possível carregar o rascunho desta questão.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadNote();

    return () => {
      cancelled = true;
    };
  }, [questionId, replaceStrokes, userId]);

  const handleSave = useCallback(
    async (nextStrokes = strokesRef.current) => {
      if (!canSave || !userId) {
        setError("Entre na sua conta para salvar o rascunho.");
        return;
      }

      try {
        setSaving(true);
        setError("");

        await saveQuestionNote({
          userId,
          questionId,
          strokes: nextStrokes,
          canvasWidth: CANVAS_WIDTH,
          canvasHeight: CANVAS_HEIGHT,
          backgroundType: backgroundTypeRef.current,
          title,
        });

        writeLocalDraft({
          userId,
          questionId,
          strokes: nextStrokes,
          backgroundType: backgroundTypeRef.current,
        });
        dirtyRef.current = false;
        setDirty(false);
        setLocalStatus("Backup local e nuvem sincronizados.");
        setStatus("Rascunho salvo.");
      } catch (saveError) {
        const readableMessage = getReadableErrorMessage(saveError);
        console.error("Erro ao salvar rascunho:", saveError);
        setError(`Não foi possível salvar o rascunho. Detalhe: ${readableMessage}`);
      } finally {
        setSaving(false);
      }
    },
    [canSave, questionId, title, userId]
  );

  useEffect(() => {
    return () => {
      if (!dirtyRef.current || !canSave || !userId) return;

      void saveQuestionNote({
        userId,
        questionId,
        strokes: strokesRef.current,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundType: backgroundTypeRef.current,
        title,
      }).catch((saveError) => {
        console.error("Erro ao salvar rascunho ao sair da questão:", saveError);
      });
    };
  }, [canSave, questionId, title, userId]);

  function updateActivePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    activePointersRef.current.set(event.pointerId, {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  function removeActivePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    activePointersRef.current.delete(event.pointerId);
  }

  function cancelCurrentInkInteraction() {
    currentStrokeRef.current = null;
    shapeStrokeRef.current = null;
    eraserPathRef.current = [];
    lassoPathRef.current = [];
    panLastRawPointRef.current = null;
    selectionLastPointRef.current = null;
    resizeStateRef.current = null;
    activePointerIdRef.current = null;
    interactionModeRef.current = "none";
    setIsDrawing(false);
    redrawCanvas();
  }

  function startTwoFingerGesture() {
    const touchPointers = getTwoTouchPointers(activePointersRef.current);

    if (touchPointers.length < 2) return false;

    const firstRawPoint = getRawCanvasPoint(touchPointers[0].clientX, touchPointers[0].clientY);
    const secondRawPoint = getRawCanvasPoint(touchPointers[1].clientX, touchPointers[1].clientY);
    const centerRaw = midpoint(firstRawPoint, secondRawPoint);
    const currentView = viewRef.current;

    gestureRef.current = {
      initialDistance: Math.max(distanceXY(firstRawPoint, secondRawPoint), 1),
      initialZoom: currentView.zoom,
      initialCenterLogical: {
        x: (centerRaw.x - currentView.offsetX) / currentView.zoom,
        y: (centerRaw.y - currentView.offsetY) / currentView.zoom,
      },
    };

    cancelCurrentInkInteraction();
    return true;
  }

  function updateTwoFingerGesture() {
    const gesture = gestureRef.current;
    const touchPointers = getTwoTouchPointers(activePointersRef.current);

    if (!gesture || touchPointers.length < 2) return;

    const firstRawPoint = getRawCanvasPoint(touchPointers[0].clientX, touchPointers[0].clientY);
    const secondRawPoint = getRawCanvasPoint(touchPointers[1].clientX, touchPointers[1].clientY);
    const currentCenterRaw = midpoint(firstRawPoint, secondRawPoint);
    const currentDistance = Math.max(distanceXY(firstRawPoint, secondRawPoint), 1);

    const nextZoom = clamp(
      gesture.initialZoom * (currentDistance / gesture.initialDistance),
      MIN_ZOOM,
      MAX_ZOOM
    );

    updateView({
      zoom: nextZoom,
      offsetX: currentCenterRaw.x - gesture.initialCenterLogical.x * nextZoom,
      offsetY: currentCenterRaw.y - gesture.initialCenterLogical.y * nextZoom,
    });
  }

  function applyEraser(path: ScratchpadPoint[]) {
    if (tool === "areaEraser") {
      replaceStrokes(eraseStrokesByArea(strokesRef.current, path, eraserSize));
      return;
    }

    if (tool === "strokeEraser") {
      replaceStrokes(eraseWholeStrokes(strokesRef.current, path, eraserSize));
    }
  }

  function appendPointsToCurrentStroke(points: ScratchpadPoint[]) {
    if (!currentStrokeRef.current) return;

    const nextPoints = [...currentStrokeRef.current.points];

    for (const rawPoint of enrichPointPath(points)) {
      const previousPoint = nextPoints[nextPoints.length - 1];

      if (!shouldAppendPoint(previousPoint, rawPoint)) {
        continue;
      }

      const pointWithWidth = {
        ...rawPoint,
        width: calculatePointWidth({
          point: rawPoint,
          previousPoint,
          size: currentStrokeRef.current.size,
          brush: currentStrokeRef.current.brush ?? "pen",
        }),
      };

      nextPoints.push(pointWithWidth);
    }

    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: nextPoints,
    };
  }

  function beginInteraction(event: React.PointerEvent<HTMLCanvasElement>, mode: InteractionMode) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // API web sendo API web. Fingimos que está tudo bem e seguimos.
    }

    activePointerIdRef.current = event.pointerId;
    interactionModeRef.current = mode;
    setIsDrawing(true);
    setStatus("");
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    updateActivePointer(event);

    if (event.pointerType === "pen") {
      lastPenInteractionAtRef.current = Date.now();
    }

    const isPalmAfterPen =
      event.pointerType === "touch" &&
      Date.now() - lastPenInteractionAtRef.current < PALM_REJECTION_MS;

    if (isPalmAfterPen) {
      return;
    }

    const hasTwoTouchPointers = getTwoTouchPointers(activePointersRef.current).length >= 2;

    if (hasTwoTouchPointers) {
      startTwoFingerGesture();
      return;
    }

    if (gestureRef.current || activePointerIdRef.current !== null) {
      return;
    }

    const point = getCanvasPointFromNative(event.nativeEvent, event.pointerType);
    const rawPoint = getRawCanvasPoint(event.clientX, event.clientY);

    if (tool === "pan") {
      beginInteraction(event, "pan");
      panLastRawPointRef.current = rawPoint;
      return;
    }

    if (tool === "select") {
      const currentSelectedBounds = getSelectedBounds(strokesRef.current, selectedIds);

      if (currentSelectedBounds) {
        const selectedHandle = getSelectionHandleAtPoint(point, currentSelectedBounds, viewRef.current);

        if (selectedHandle) {
          beginInteraction(event, "selectionResize");
          resizeStateRef.current = {
            handle: selectedHandle,
            baseBounds: currentSelectedBounds,
            baseStrokes: cloneStrokes(strokesRef.current),
          };
          strokesBeforeInteractionRef.current = cloneStrokes(strokesRef.current);
          selectionMovedRef.current = false;
          return;
        }
      }

      if (currentSelectedBounds && isPointInsideBounds(point, currentSelectedBounds)) {
        beginInteraction(event, "selectionMove");
        selectionLastPointRef.current = point;
        strokesBeforeInteractionRef.current = cloneStrokes(strokesRef.current);
        selectionMovedRef.current = false;
        return;
      }

      beginInteraction(event, "lasso");
      lassoPathRef.current = [point];
      redrawCanvas(null, null, lassoPathRef.current);
      return;
    }

    if (tool === "shape") {
      beginInteraction(event, "shape");
      const stroke: ScratchpadStroke = {
        id: createStrokeId(),
        tool: "shape",
        shape: shapeTool,
        color,
        size,
        points: [point, point],
      };

      shapeStrokeRef.current = stroke;
      redrawCanvas(stroke);
      return;
    }

    beginInteraction(event, tool === "pen" ? "stroke" : "erase");

    if (tool === "pen") {
      const activeBrush = brush;
      const strokeColor = activeBrush === "highlighter" && !HIGHLIGHTER_COLORS.includes(color)
        ? HIGHLIGHTER_COLORS[0]
        : color;
      const pointWithWidth = {
        ...point,
        width: calculatePointWidth({
          point,
          size,
          brush: activeBrush,
        }),
      };

      const stroke: ScratchpadStroke = {
        id: createStrokeId(),
        tool: "pen",
        color: strokeColor,
        size,
        brush: activeBrush,
        opacity: activeBrush === "highlighter" ? 0.35 : 1,
        points: [pointWithWidth],
      };

      currentStrokeRef.current = stroke;
      setSelectedIds([]);
      redrawCanvas(stroke);
      return;
    }

    strokesBeforeInteractionRef.current = cloneStrokes(strokesRef.current);
    currentStrokeRef.current = null;
    eraserPathRef.current = [point];
    setSelectedIds([]);
    applyEraser(eraserPathRef.current);
    redrawCanvas(null, { point, radius: eraserSize });
  }

  function moveSelectedByDelta(dx: number, dy: number) {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);

    const nextStrokes = strokesRef.current.map((stroke) => {
      if (!selectedSet.has(stroke.id)) return stroke;

      return transformStrokePoints(stroke, (point) => ({
        ...point,
        x: point.x + dx,
        y: point.y + dy,
      }));
    });

    selectionMovedRef.current = true;
    replaceStrokes(nextStrokes);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    updateActivePointer(event);

    if (event.pointerType === "pen") {
      lastPenInteractionAtRef.current = Date.now();
    }

    if (gestureRef.current) {
      event.preventDefault();
      updateTwoFingerGesture();
      return;
    }

    const hasTwoTouchPointers = getTwoTouchPointers(activePointersRef.current).length >= 2;

    if (hasTwoTouchPointers) {
      event.preventDefault();
      startTwoFingerGesture();
      return;
    }

    if (!isDrawing || event.pointerId !== activePointerIdRef.current) return;

    event.preventDefault();

    const mode = interactionModeRef.current;

    if (mode === "pan") {
      const rawPoint = getRawCanvasPoint(event.clientX, event.clientY);
      const previousRawPoint = panLastRawPointRef.current;

      if (!previousRawPoint) {
        panLastRawPointRef.current = rawPoint;
        return;
      }

      const dx = rawPoint.x - previousRawPoint.x;
      const dy = rawPoint.y - previousRawPoint.y;

      panLastRawPointRef.current = rawPoint;

      updateView((previous) => ({
        ...previous,
        offsetX: previous.offsetX + dx,
        offsetY: previous.offsetY + dy,
      }));
      return;
    }

    const points = getCanvasPointsFromEvent(event);

    if (mode === "selectionResize") {
      const resizeState = resizeStateRef.current;
      const currentPoint = points[points.length - 1];

      if (!resizeState) return;

      const selectedSet = new Set(selectedIds);
      const nextStrokes = resizeState.baseStrokes.map((stroke) => {
        if (!selectedSet.has(stroke.id)) return stroke;

        return scaleStrokeFromBounds(
          stroke,
          resizeState.baseBounds,
          resizeState.handle,
          currentPoint
        );
      });

      selectionMovedRef.current = true;
      replaceStrokes(nextStrokes);
      return;
    }

    if (mode === "selectionMove") {
      const currentPoint = points[points.length - 1];
      const previousPoint = selectionLastPointRef.current;

      if (!previousPoint) {
        selectionLastPointRef.current = currentPoint;
        return;
      }

      const dx = currentPoint.x - previousPoint.x;
      const dy = currentPoint.y - previousPoint.y;

      selectionLastPointRef.current = currentPoint;
      moveSelectedByDelta(dx, dy);
      return;
    }

    if (mode === "lasso") {
      const nextPoints = points.filter((point) =>
        shouldAppendPoint(lassoPathRef.current[lassoPathRef.current.length - 1], point)
      );

      if (nextPoints.length === 0) return;

      lassoPathRef.current = [...lassoPathRef.current, ...nextPoints];
      redrawCanvas(null, null, lassoPathRef.current);
      return;
    }

    if (mode === "shape" && shapeStrokeRef.current) {
      const lastPoint = points[points.length - 1];
      shapeStrokeRef.current = {
        ...shapeStrokeRef.current,
        points: [shapeStrokeRef.current.points[0], lastPoint],
      };

      redrawCanvas(shapeStrokeRef.current);
      return;
    }

    if (mode === "stroke" && currentStrokeRef.current) {
      appendPointsToCurrentStroke(points);
      redrawCanvas(currentStrokeRef.current);
      return;
    }

    if (mode === "erase") {
      const nextPoints = points.filter((point) =>
        shouldAppendPoint(eraserPathRef.current[eraserPathRef.current.length - 1], point)
      );

      if (nextPoints.length === 0) return;

      eraserPathRef.current = [...eraserPathRef.current, ...nextPoints];
      applyEraser(eraserPathRef.current);

      const lastPoint = eraserPathRef.current[eraserPathRef.current.length - 1];
      redrawCanvas(null, { point: lastPoint, radius: eraserSize });
    }
  }

  function finalizeHistoryIfChanged() {
    const base = strokesBeforeInteractionRef.current;
    strokesBeforeInteractionRef.current = null;

    if (!base) return;

    const changed = JSON.stringify(base) !== JSON.stringify(strokesRef.current);

    if (changed) {
      pushHistorySnapshot(base);
      markDirty();
    }
  }

  function finishStroke(event?: React.PointerEvent<HTMLCanvasElement>) {
    if (event) {
      event.preventDefault();
      removeActivePointer(event);

      const canvas = canvasRef.current;

      if (canvas) {
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch {
          // Se o navegador já soltou a captura, vida que segue.
        }
      }
    }

    if (gestureRef.current) {
      if (getTwoTouchPointers(activePointersRef.current).length < 2) {
        gestureRef.current = null;
      }

      return;
    }

    if (event && activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
      return;
    }

    const mode = interactionModeRef.current;

    if (mode === "stroke" && currentStrokeRef.current) {
      const finishedStroke = smoothFreehandStroke(currentStrokeRef.current);
      const previous = strokesRef.current;

      currentStrokeRef.current = null;
      commitStrokes([...previous, finishedStroke], previous);
    } else if (mode === "shape" && shapeStrokeRef.current) {
      const finishedShape = shapeStrokeRef.current;
      const previous = strokesRef.current;
      shapeStrokeRef.current = null;

      if (distance(finishedShape.points[0], finishedShape.points[1]) > 3) {
        commitStrokes([...previous, finishedShape], previous);
      }
    } else if (mode === "erase") {
      finalizeHistoryIfChanged();
    } else if (mode === "selectionMove" || mode === "selectionResize") {
      if (selectionMovedRef.current) {
        finalizeHistoryIfChanged();
      } else {
        strokesBeforeInteractionRef.current = null;
      }
    } else if (mode === "lasso") {
      const lassoPath = lassoPathRef.current;
      const wasClick = lassoPath.length <= 3 || pathLength(lassoPath) < 14;

      if (wasClick) {
        const clickedPoint = lassoPath[0];
        const clickedStroke = clickedPoint ? findStrokeAtPoint(strokesRef.current, clickedPoint) : null;
        setSelectedIds(clickedStroke ? [clickedStroke.id] : []);
      } else {
        const ids = selectStrokesByLasso(strokesRef.current, lassoPath);
        setSelectedIds(ids);
      }
    }

    currentStrokeRef.current = null;
    shapeStrokeRef.current = null;
    eraserPathRef.current = [];
    lassoPathRef.current = [];
    panLastRawPointRef.current = null;
    selectionLastPointRef.current = null;
    resizeStateRef.current = null;
    activePointerIdRef.current = null;
    interactionModeRef.current = "none";
    selectionMovedRef.current = false;
    setIsDrawing(false);
    redrawCanvas();
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    removeActivePointer(event);

    if (event.pointerId === activePointerIdRef.current) {
      currentStrokeRef.current = null;
      shapeStrokeRef.current = null;
      eraserPathRef.current = [];
      lassoPathRef.current = [];
      strokesBeforeInteractionRef.current = null;
      resizeStateRef.current = null;
      activePointerIdRef.current = null;
      interactionModeRef.current = "none";
      setIsDrawing(false);
      redrawCanvas();
    }

    if (getTwoTouchPointers(activePointersRef.current).length < 2) {
      gestureRef.current = null;
    }
  }

  function handleUndo() {
    if (historyRef.current.length === 0) return;

    const current = cloneStrokes(strokesRef.current);
    const previous = historyRef.current[historyRef.current.length - 1];

    historyRef.current = historyRef.current.slice(0, -1);
    redoHistoryRef.current = [...redoHistoryRef.current, current].slice(-MAX_HISTORY);
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(redoHistoryRef.current.length);
    setSelectedIds([]);
    replaceStrokes(cloneStrokes(previous));
    markDirty();
  }

  function handleRedo() {
    if (redoHistoryRef.current.length === 0) return;

    const current = cloneStrokes(strokesRef.current);
    const next = redoHistoryRef.current[redoHistoryRef.current.length - 1];

    redoHistoryRef.current = redoHistoryRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, current].slice(-MAX_HISTORY);
    setHistoryDepth(historyRef.current.length);
    setRedoDepth(redoHistoryRef.current.length);
    setSelectedIds([]);
    replaceStrokes(cloneStrokes(next));
    markDirty();
  }

  function handleClear() {
    const shouldClear = window.confirm("Limpar todo o rascunho desta questão?");

    if (!shouldClear) return;

    setStatus("");
    setSelectedIds([]);
    commitStrokes([], strokesRef.current);
  }

  function activatePen(nextBrush: ScratchpadBrush) {
    setTool("pen");
    setBrush(nextBrush);

    if (nextBrush === "highlighter" && !HIGHLIGHTER_COLORS.includes(color)) {
      setColor(HIGHLIGHTER_COLORS[0]);
    }
  }

  function activateShape(nextShape: ScratchpadShape) {
    setTool("shape");
    setShapeTool(nextShape);
  }

  function handleBackgroundChange(nextBackground: ScratchpadBackground) {
    setBackgroundType(nextBackground);
    backgroundTypeRef.current = nextBackground;
    markDirty("Fundo alterado. Clique em Salvar para guardar.");
  }

  function resetZoom() {
    updateView({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function zoomAtCanvasPoint(rawPoint: { x: number; y: number }, nextZoom: number) {
    const currentView = viewRef.current;
    const logicalPoint = {
      x: (rawPoint.x - currentView.offsetX) / currentView.zoom,
      y: (rawPoint.y - currentView.offsetY) / currentView.zoom,
    };

    updateView({
      zoom: nextZoom,
      offsetX: rawPoint.x - logicalPoint.x * nextZoom,
      offsetY: rawPoint.y - logicalPoint.y * nextZoom,
    });
  }

  function handleZoomButton(direction: "in" | "out") {
    const currentView = viewRef.current;
    const factor = direction === "in" ? 1.18 : 1 / 1.18;
    const nextZoom = clamp(currentView.zoom * factor, MIN_ZOOM, MAX_ZOOM);

    zoomAtCanvasPoint(
      {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
      },
      nextZoom
    );
  }

  function handleWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    const nextZoom = clamp(viewRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const rawPoint = getRawCanvasPoint(event.clientX, event.clientY);

    zoomAtCanvasPoint(rawPoint, nextZoom);
  }

  function applyTransformToSelection(transformer: (stroke: ScratchpadStroke) => ScratchpadStroke) {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);
    const previous = cloneStrokes(strokesRef.current);
    const next = strokesRef.current.map((stroke) =>
      selectedSet.has(stroke.id) ? transformer(stroke) : stroke
    );

    commitStrokes(next, previous);
  }

  function scaleSelection(factor: number) {
    const bounds = getSelectedBounds(strokesRef.current, selectedIds);
    if (!bounds) return;

    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };

    applyTransformToSelection((stroke) =>
      transformStrokePoints(
        stroke,
        (point) => ({
          ...point,
          x: center.x + (point.x - center.x) * factor,
          y: center.y + (point.y - center.y) * factor,
        }),
        factor
      )
    );
  }

  function straightenSelection() {
    applyTransformToSelection(straightenStroke);
  }

  function transformSelectionToPerfectShape(shape: ScratchpadShape) {
    applyTransformToSelection((stroke) => transformStrokeToPerfectShape(stroke, shape));
  }

  function autoPerfectSelection() {
    applyTransformToSelection((stroke) => transformStrokeToPerfectShape(stroke, guessPerfectShape(stroke)));
  }

  function deleteSelection() {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);
    const previous = cloneStrokes(strokesRef.current);
    const next = strokesRef.current.filter((stroke) => !selectedSet.has(stroke.id));

    setSelectedIds([]);
    commitStrokes(next, previous);
  }

  function duplicateSelection() {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);
    const copies = strokesRef.current
      .filter((stroke) => selectedSet.has(stroke.id))
      .map((stroke) => ({
        ...stroke,
        id: createStrokeId(),
        points: stroke.points.map((point) => ({
          ...point,
          x: point.x + 28,
          y: point.y + 28,
        })),
      }));

    const previous = cloneStrokes(strokesRef.current);
    const next = [...strokesRef.current, ...copies];

    setSelectedIds(copies.map((stroke) => stroke.id));
    commitStrokes(next, previous);
  }

  function exportAsPng() {
    const pixelRatio = 2;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_WIDTH * pixelRatio;
    exportCanvas.height = CANVAS_HEIGHT * pixelRatio;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const exportView: CanvasView = { zoom: 1, offsetX: 0, offsetY: 0 };
    drawPaper(ctx, exportView, backgroundTypeRef.current, pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }

    const url = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${questionCode ?? "rascunho"}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }

  const containerClassName = fullscreen
    ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-white p-3 md:p-5"
    : "mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm";

  const canvasWrapperClassName = fullscreen
    ? "flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-inner"
    : "rounded-2xl border border-slate-200 bg-white p-2 shadow-inner";

  const canvasCursorClass =
    tool === "pen"
      ? "cursor-crosshair"
      : tool === "pan"
        ? "cursor-grab active:cursor-grabbing"
        : tool === "select"
          ? "cursor-pointer"
          : tool === "shape"
            ? "cursor-crosshair"
            : "cursor-cell";

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/60 md:px-6 ${
          fullscreen ? "rounded-2xl border border-violet-100 bg-violet-50" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
            <PenLine className="h-5 w-5" />
          </div>

          <div>
            <p className="font-black text-slate-950">Rascunho manuscrito</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Escreva com alta suavização, selecione, redimensione pelos cantos, transforme rabiscos em formas e mantenha backup local.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {saving ? (
            <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 md:inline-flex">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              salvando
            </span>
          ) : dirty ? (
            <span className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 md:inline-flex">
              alterações não salvas
            </span>
          ) : status ? (
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 md:inline-flex">
              <CheckCircle2 className="h-3.5 w-3.5" />
              salvo
            </span>
          ) : null}

          {open ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </button>

      {open ? (
        <div className={`border-t border-violet-100 p-4 md:p-5 ${fullscreen ? "flex min-h-0 flex-1 flex-col" : ""}`}>
          {!userId ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Você pode testar o rascunho, mas precisa estar logado para salvar e recuperar depois.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <ToolbarGroup label="Ferramentas">
              <button type="button" onClick={() => activatePen("pen")} className={toolButtonClass(tool === "pen" && brush === "pen")}> 
                <PenLine className="h-4 w-4" /> Caneta
              </button>
              <button type="button" onClick={() => activatePen("brush")} className={toolButtonClass(tool === "pen" && brush === "brush")}> 
                <PenLine className="h-4 w-4" /> Pincel
              </button>
              <button type="button" onClick={() => activatePen("highlighter")} className={toolButtonClass(tool === "pen" && brush === "highlighter")}> 
                <Highlighter className="h-4 w-4" /> Marca-texto
              </button>
              <button type="button" onClick={() => setTool("select")} className={toolButtonClass(tool === "select")}> 
                <MousePointer2 className="h-4 w-4" /> Selecionar
              </button>
              <button type="button" onClick={() => setTool("pan")} className={toolButtonClass(tool === "pan")}> 
                <Move className="h-4 w-4" /> Mover
              </button>
              <button type="button" onClick={() => setTool("areaEraser")} className={toolButtonClass(tool === "areaEraser")}> 
                <Eraser className="h-4 w-4" /> Borracha livre
              </button>
              <button type="button" onClick={() => setTool("strokeEraser")} className={toolButtonClass(tool === "strokeEraser")}> 
                <Eraser className="h-4 w-4" /> Apagar traço
              </button>
            </ToolbarGroup>

            <ToolbarGroup label="Formas">
              <button type="button" onClick={() => activateShape("line")} className={toolButtonClass(tool === "shape" && shapeTool === "line")}> 
                <Minus className="h-4 w-4" /> Reta
              </button>
              <button type="button" onClick={() => activateShape("arrow")} className={toolButtonClass(tool === "shape" && shapeTool === "arrow")}> 
                <ArrowRight className="h-4 w-4" /> Seta
              </button>
              <button type="button" onClick={() => activateShape("rectangle")} className={toolButtonClass(tool === "shape" && shapeTool === "rectangle")}> 
                <Square className="h-4 w-4" /> Retângulo
              </button>
              <button type="button" onClick={() => activateShape("ellipse")} className={toolButtonClass(tool === "shape" && shapeTool === "ellipse")}> 
                <Circle className="h-4 w-4" /> Círculo
              </button>
            </ToolbarGroup>

            <ToolbarGroup label="Cores">
              {(brush === "highlighter" ? HIGHLIGHTER_COLORS : COLORS).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setColor(item);
                    if (brush !== "highlighter") setTool("pen");
                  }}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === item
                      ? "border-violet-600 ring-2 ring-violet-200"
                      : "border-white ring-1 ring-slate-200"
                  }`}
                  style={{ backgroundColor: item }}
                  aria-label={`Cor ${item}`}
                />
              ))}
            </ToolbarGroup>

            <ToolbarGroup label="Ajustes">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                Espessura
                <input
                  type="range"
                  min={2}
                  max={18}
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                  className="w-24 accent-violet-600"
                />
                <span className="w-6 text-right text-xs text-slate-500">{size}</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                Borracha
                <input
                  type="range"
                  min={8}
                  max={70}
                  value={eraserSize}
                  onChange={(event) => setEraserSize(Number(event.target.value))}
                  className="w-24 accent-violet-600"
                />
                <span className="w-7 text-right text-xs text-slate-500">{eraserSize}</span>
              </label>

              <select
                value={backgroundType}
                onChange={(event) => handleBackgroundChange(event.target.value as ScratchpadBackground)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-violet-400"
                aria-label="Fundo do rascunho"
              >
                {BACKGROUNDS.map((background) => (
                  <option key={background.value} value={background.value}>
                    {background.label}
                  </option>
                ))}
              </select>
            </ToolbarGroup>

            <ToolbarGroup label="Tela">
              <button type="button" onClick={() => handleZoomButton("out")} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <ZoomOut className="h-4 w-4" /> Zoom
              </button>
              <button type="button" onClick={() => handleZoomButton("in")} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <ZoomIn className="h-4 w-4" /> {Math.round(view.zoom * 100)}%
              </button>
              <button type="button" onClick={resetZoom} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <Move className="h-4 w-4" /> 100%
              </button>
              <button type="button" onClick={() => setFullscreen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? "Sair" : "Tela cheia"}
              </button>
              <button type="button" onClick={exportAsPng} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <Download className="h-4 w-4" /> PNG
              </button>
            </ToolbarGroup>

            <ToolbarGroup label="Ações">
              <button type="button" onClick={handleUndo} disabled={historyDepth === 0} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
                <Undo2 className="h-4 w-4" /> Desfazer
              </button>
              <button type="button" onClick={handleRedo} disabled={redoDepth === 0} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
                <Redo2 className="h-4 w-4" /> Refazer
              </button>
              <button type="button" onClick={handleClear} disabled={strokes.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Limpar
              </button>
              <button type="button" onClick={() => handleSave()} disabled={!canSave || saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </ToolbarGroup>
          </div>

          {selectedIds.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm">
              <span className="font-black text-violet-900">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              <button type="button" onClick={() => scaleSelection(1.15)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Aumentar
              </button>
              <button type="button" onClick={() => scaleSelection(0.87)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Diminuir
              </button>
              <button type="button" onClick={straightenSelection} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Endireitar traço
              </button>
              <button type="button" onClick={autoPerfectSelection} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Forma perfeita
              </button>
              <button type="button" onClick={() => transformSelectionToPerfectShape("line")} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <Minus className="h-4 w-4" /> Reta
              </button>
              <button type="button" onClick={() => transformSelectionToPerfectShape("arrow")} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <ArrowRight className="h-4 w-4" /> Seta
              </button>
              <button type="button" onClick={() => transformSelectionToPerfectShape("rectangle")} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <Square className="h-4 w-4" /> Retângulo
              </button>
              <button type="button" onClick={() => transformSelectionToPerfectShape("ellipse")} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <Circle className="h-4 w-4" /> Círculo
              </button>
              <button type="button" onClick={duplicateSelection} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <Copy className="h-4 w-4" /> Duplicar
              </button>
              <button type="button" onClick={deleteSelection} className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-700 ring-1 ring-red-100 hover:bg-red-100">
                Excluir seleção
              </button>
              <button type="button" onClick={() => setSelectedIds([])} className="rounded-xl bg-white px-3 py-2 font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                Tirar seleção
              </button>
            </div>
          ) : null}

          <div className={canvasWrapperClassName}>
            {!loaded ? (
              <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando rascunho...
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishStroke}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={(event) => {
                  if (isDrawing && event.pointerId === activePointerIdRef.current) {
                    finishStroke(event);
                  }
                }}
                onWheel={handleWheel}
                className={`block w-full rounded-xl bg-white ${canvasCursorClass} ${fullscreen ? "max-h-full flex-1 object-contain" : ""}`}
                style={{
                  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  touchAction: "none",
                }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              Selecionar: clique em um traço ou contorne vários com o laço. Arraste a caixa para mover, arraste os cantos para redimensionar e use “Forma perfeita” para limpar rabiscos.
              {localStatus ? <span className="mt-1 block font-bold text-violet-600">{localStatus}</span> : null}
            </p>

            <button
              type="button"
              onClick={() => {
                redrawCanvas();
                setStatus("Tela redesenhada.");
              }}
              className="inline-flex items-center gap-1 self-start rounded-full bg-white px-3 py-1 font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 md:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              redesenhar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
