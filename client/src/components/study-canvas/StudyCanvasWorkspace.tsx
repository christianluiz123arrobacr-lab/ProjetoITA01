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
  FileText,
  ImagePlus,
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
  RotateCw,
  Save,
  Square,
  Trash2,
  Triangle,
  Type,
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
import { isMultitouchGesture } from "./studyCanvasPointerGuards";

export type StudyCanvasPage = {
  id: string;
  title: string;
  strokes: ScratchpadStroke[];
  backgroundType: ScratchpadBackground;
};

export type StudyCanvasDocument = {
  pages: StudyCanvasPage[];
  activePageId: string;
};

export type StudyCanvasPersistence = {
  load: () => Promise<StudyCanvasDocument | null>;
  save: (document: StudyCanvasDocument) => Promise<void>;
};

type StudyCanvasWorkspaceProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
  titleOverride?: string;
  persistence?: StudyCanvasPersistence;
  disableLocalDraft?: boolean;
  initiallyOpen?: boolean;
  hideLauncher?: boolean;
  autosaveIntervalMs?: number;
  saveRequest?: number;
  onStateChange?: (state: { dirty: boolean; saving: boolean; error: string }) => void;
  backgroundOverride?: ScratchpadBackground;
};

type ScratchpadTool = "pen" | "pan" | "areaEraser" | "strokeEraser" | "select" | "shape" | "text";
type FullscreenPanel = "tools" | "shapes" | "colors" | "size" | "view" | "selection" | "pages" | "actions" | null;
type InteractionMode = "none" | "stroke" | "erase" | "pan" | "shape" | "text" | "lasso" | "selectionMove" | "selectionResize" | "selectionRotate";

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

type SelectionHandle = "nw" | "ne" | "sw" | "se" | "rotate";

type ResizeState = {
  handle: Exclude<SelectionHandle, "rotate">;
  baseBounds: Bounds;
  baseStrokes: ScratchpadStroke[];
};

type RotateState = {
  baseBounds: Bounds;
  baseStrokes: ScratchpadStroke[];
  startAngle: number;
};

type ScratchpadPage = StudyCanvasPage;

type StoredPagesPayload = {
  kind: "scratchpad-pages-v1";
  activePageId: string;
  pages: ScratchpadPage[];
};

type LocalScratchpadDraft = {
  strokes?: ScratchpadStroke[];
  backgroundType?: ScratchpadBackground;
  pages?: ScratchpadPage[];
  activePageId?: string;
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
const LOCAL_DRAFT_VERSION = "v3";
const PAGE_META_STROKE_ID = "__scratchpad_pages_v1";
const AUTO_SHAPE_HOLD_MS = 360;
const ERASER_LIVE_APPLY_MS = 55;

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

type PenPreset = {
  label: string;
  tool: ScratchpadTool;
  brush?: ScratchpadBrush;
  color?: string;
  size?: number;
  eraserSize?: number;
};

type ScratchpadListItem = {
  key: string;
  questionId: string;
  title: string;
  updatedAt: string;
  pagesCount: number;
};

const PEN_PRESETS: PenPreset[] = [
  { label: "Preta fina", tool: "pen", brush: "pen", color: "#0f172a", size: 3 },
  { label: "Azul média", tool: "pen", brush: "pen", color: "#2563eb", size: 5 },
  { label: "Vermelha", tool: "pen", brush: "pen", color: "#dc2626", size: 4 },
  { label: "Pincel", tool: "pen", brush: "brush", color: "#0f172a", size: 7 },
  { label: "Marca-texto", tool: "pen", brush: "highlighter", color: "#fde047", size: 13 },
  { label: "Borracha", tool: "areaEraser", eraserSize: 26 },
  { label: "Traço inteiro", tool: "strokeEraser", eraserSize: 28 },
];

const IMAGE_CACHE = new Map<string, HTMLImageElement>();

function createPageId() {
  return `page-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createScratchpadPage(index = 1): ScratchpadPage {
  return {
    id: createPageId(),
    title: `Página ${index}`,
    strokes: [],
    backgroundType: "grid",
  };
}

function clonePage(page: ScratchpadPage): ScratchpadPage {
  return {
    ...page,
    strokes: cloneStrokes(page.strokes),
  };
}

function normalizePages(rawPages: unknown, fallbackBackground: ScratchpadBackground): ScratchpadPage[] {
  if (!Array.isArray(rawPages)) {
    return [createScratchpadPage(1)];
  }

  const pages = rawPages
    .map((page, index) => {
      const maybePage = page as Partial<ScratchpadPage>;

      return {
        id: typeof maybePage.id === "string" ? maybePage.id : createPageId(),
        title: typeof maybePage.title === "string" ? maybePage.title : `Página ${index + 1}`,
        strokes: Array.isArray(maybePage.strokes)
          ? maybePage.strokes.filter((stroke) => stroke?.tool !== "meta")
          : [],
        backgroundType: isValidBackground(maybePage.backgroundType)
          ? maybePage.backgroundType
          : fallbackBackground,
      };
    })
    .filter((page) => page.id);

  return pages.length > 0 ? pages : [createScratchpadPage(1)];
}

function encodePagesForStorage(pages: ScratchpadPage[], activePageId: string): ScratchpadStroke[] {
  const payload: StoredPagesPayload = {
    kind: "scratchpad-pages-v1",
    activePageId,
    pages: pages.map(clonePage),
  };

  return [
    {
      id: PAGE_META_STROKE_ID,
      tool: "meta",
      color: "#000000",
      size: 0,
      points: [],
      payload,
    },
  ];
}

function decodePagesFromStorage({
  storedStrokes,
  backgroundType,
}: {
  storedStrokes: ScratchpadStroke[] | null | undefined;
  backgroundType: ScratchpadBackground;
}) {
  const metaStroke = Array.isArray(storedStrokes)
    ? storedStrokes.find((stroke) => stroke?.id === PAGE_META_STROKE_ID || stroke?.tool === "meta")
    : null;

  const payload = metaStroke?.payload as StoredPagesPayload | undefined;

  if (payload?.kind === "scratchpad-pages-v1") {
    const pages = normalizePages(payload.pages, backgroundType);
    const activePage = pages.some((page) => page.id === payload.activePageId)
      ? payload.activePageId
      : pages[0].id;

    return {
      pages,
      activePageId: activePage,
    };
  }

  const page = createScratchpadPage(1);
  page.id = "page-1";
  page.strokes = Array.isArray(storedStrokes)
    ? storedStrokes.filter((stroke) => stroke?.tool !== "meta")
    : [];
  page.backgroundType = backgroundType;

  return {
    pages: [page],
    activePageId: page.id,
  };
}

function getPageNumberLabel(index: number) {
  return `P${index + 1}`;
}

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
  if (stroke.tool === "meta") return [stroke];

  if (stroke.tool !== "pen") {
    return isStrokeTouchedByPath(stroke, path, radius) ? [] : [stroke];
  }

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
  return strokes.filter((stroke) => stroke.tool === "meta" || !isStrokeTouchedByPath(stroke, path, radius));
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

  if (stroke.shape === "rectangle" || stroke.shape === "ellipse" || stroke.shape === "triangle") {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(stroke.rotation ?? 0);

    if (stroke.shape === "rectangle") {
      ctx.strokeRect(-width / 2, -height / 2, width, height);
    } else if (stroke.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(width / 2, height / 2);
      ctx.lineTo(-width / 2, height / 2);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
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

function drawTextStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (!stroke.text || stroke.points.length === 0) return;

  const point = stroke.points[0];
  const fontSize = Math.max(12, stroke.size * 5);

  ctx.save();
  ctx.globalAlpha = stroke.opacity ?? 1;
  ctx.translate(point.x, point.y);
  ctx.rotate(stroke.rotation ?? 0);
  ctx.fillStyle = stroke.color;
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textBaseline = "top";

  const lines = stroke.text.split("\n");

  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * fontSize * 1.25);
  });

  ctx.restore();
}

function getImageFromCache(src: string) {
  const cached = IMAGE_CACHE.get(src);

  if (cached) return cached;

  const image = new Image();
  image.src = src;
  IMAGE_CACHE.set(src, image);

  return image;
}

function drawImageStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (!stroke.imageData || stroke.points.length < 2) return;

  const start = stroke.points[0];
  const end = stroke.points[stroke.points.length - 1];
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.max(Math.abs(end.x - start.x), 8);
  const height = Math.max(Math.abs(end.y - start.y), 8);
  const center = {
    x: x + width / 2,
    y: y + height / 2,
  };
  const image = getImageFromCache(stroke.imageData);

  ctx.save();
  ctx.globalAlpha = stroke.opacity ?? 1;
  ctx.translate(center.x, center.y);
  ctx.rotate(stroke.rotation ?? 0);

  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.fillStyle = "#64748b";
    ctx.font = "700 18px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Imagem", 0, 0);
  }

  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (stroke.tool === "meta") return;

  if (stroke.tool === "eraser") {
    drawLegacyEraserStroke(ctx, stroke);
    return;
  }

  if (stroke.tool === "shape") {
    drawShapeStroke(ctx, stroke);
    return;
  }

  if (stroke.tool === "text") {
    drawTextStroke(ctx, stroke);
    return;
  }

  if (stroke.tool === "image") {
    drawImageStroke(ctx, stroke);
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
  if (stroke.tool === "meta") return null;
  if (stroke.points.length === 0) return null;

  if (stroke.tool === "text") {
    const point = stroke.points[0];
    const text = stroke.text ?? "";
    const fontSize = Math.max(12, stroke.size * 5);
    const lines = text.split("\n");
    const maxChars = Math.max(...lines.map((line) => line.length), 1);
    return {
      minX: point.x - 8,
      minY: point.y - 8,
      maxX: point.x + maxChars * fontSize * 0.62 + 8,
      maxY: point.y + lines.length * fontSize * 1.25 + 8,
    };
  }

  if (stroke.tool === "image" && stroke.points.length >= 2) {
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    return {
      minX: Math.min(start.x, end.x) - 8,
      minY: Math.min(start.y, end.y) - 8,
      maxX: Math.max(start.x, end.x) + 8,
      maxY: Math.max(start.y, end.y) + 8,
    };
  }

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

  const handles = getSelectionHandles(bounds);

  for (const item of handles) {
    ctx.fillStyle = item.handle === "rotate" ? "#7c3aed" : "#ffffff";
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2 / view.zoom;

    if (item.handle === "rotate") {
      ctx.beginPath();
      ctx.moveTo((bounds.minX + bounds.maxX) / 2, bounds.minY);
      ctx.lineTo(item.x, item.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(item.x, item.y, handleSize * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(item.x - handleSize / 2, item.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(item.x - handleSize / 2, item.y - handleSize / 2, handleSize, handleSize);
    }
  }

  ctx.restore();
}

function getSelectionHandles(bounds: Bounds) {
  return [
    { handle: "nw" as const, x: bounds.minX, y: bounds.minY },
    { handle: "ne" as const, x: bounds.maxX, y: bounds.minY },
    { handle: "sw" as const, x: bounds.minX, y: bounds.maxY },
    { handle: "se" as const, x: bounds.maxX, y: bounds.maxY },
    { handle: "rotate" as const, x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY - 32 },
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

function getOppositeCorner(bounds: Bounds, handle: Exclude<SelectionHandle, "rotate">) {
  if (handle === "nw") return { x: bounds.maxX, y: bounds.maxY };
  if (handle === "ne") return { x: bounds.minX, y: bounds.maxY };
  if (handle === "sw") return { x: bounds.maxX, y: bounds.minY };
  return { x: bounds.minX, y: bounds.minY };
}

function scaleStrokeFromBounds(
  stroke: ScratchpadStroke,
  baseBounds: Bounds,
  handle: Exclude<SelectionHandle, "rotate">,
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
  return transformStrokePoints(
    stroke,
    (point) => ({
      ...point,
      x: anchor.x + (point.x - anchor.x) * scaleX,
      y: anchor.y + (point.y - anchor.y) * scaleY,
    }),
    1
  );
}

function getBoundsCenter(bounds: Bounds) {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function getAngleFromCenter(center: ScratchpadPoint, point: ScratchpadPoint) {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

function rotatePointAround(point: ScratchpadPoint, center: ScratchpadPoint, angle: number): ScratchpadPoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    ...point,
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function rotateStroke(stroke: ScratchpadStroke, center: ScratchpadPoint, angle: number): ScratchpadStroke {
  if (stroke.tool === "shape" && (stroke.shape === "rectangle" || stroke.shape === "ellipse")) {
    return {
      ...stroke,
      rotation: (stroke.rotation ?? 0) + angle,
    };
  }

  if (stroke.tool === "text" || stroke.tool === "image") {
    return {
      ...stroke,
      rotation: (stroke.rotation ?? 0) + angle,
    };
  }

  return transformStrokePoints(stroke, (point) => rotatePointAround(point, center, angle), 1);
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

function getStrokeShapeMetrics(stroke: ScratchpadStroke) {
  const bounds = getStrokeBounds(stroke);

  if (!bounds) {
    return null;
  }

  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const diagonal = Math.hypot(width, height);
  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  const closedness = first && last ? distance(first, last) / Math.max(diagonal, 1) : 1;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const rx = width / 2;
  const ry = height / 2;
  const aspect = width / height;

  let ellipseScore = 0;
  let rectangleScore = 0;
  let triangleScore = 0;

  const points = stroke.points.length > 90
    ? stroke.points.filter((_, index) => index % Math.ceil(stroke.points.length / 90) === 0)
    : stroke.points;

  const triangleTop = { x: cx, y: bounds.minY };
  const triangleRight = { x: bounds.maxX, y: bounds.maxY };
  const triangleLeft = { x: bounds.minX, y: bounds.maxY };

  for (const point of points) {
    const normalizedEllipse =
      Math.sqrt(
        ((point.x - cx) * (point.x - cx)) / Math.max(rx * rx, 1) +
          ((point.y - cy) * (point.y - cy)) / Math.max(ry * ry, 1)
      );

    ellipseScore += Math.abs(normalizedEllipse - 1);

    const dxToEdge = Math.min(Math.abs(point.x - bounds.minX), Math.abs(point.x - bounds.maxX)) / width;
    const dyToEdge = Math.min(Math.abs(point.y - bounds.minY), Math.abs(point.y - bounds.maxY)) / height;
    rectangleScore += Math.min(dxToEdge, dyToEdge);

    const triangleDistance =
      Math.min(
        distancePointToSegment(point, triangleTop, triangleRight),
        distancePointToSegment(point, triangleRight, triangleLeft),
        distancePointToSegment(point, triangleLeft, triangleTop)
      ) / Math.max(diagonal, 1);

    triangleScore += triangleDistance;
  }

  const count = Math.max(points.length, 1);

  return {
    bounds,
    width,
    height,
    diagonal,
    aspect,
    closedness,
    straightness: getStraightnessScore(stroke),
    ellipseScore: ellipseScore / count,
    rectangleScore: rectangleScore / count,
    triangleScore: triangleScore / count,
  };
}

function guessPerfectShape(stroke: ScratchpadStroke): ScratchpadShape {
  if (stroke.tool === "shape" && stroke.shape) return stroke.shape;

  const metrics = getStrokeShapeMetrics(stroke);

  if (!metrics) return "line";

  const { aspect, closedness, straightness, ellipseScore, rectangleScore, triangleScore } = metrics;

  if (straightness < 0.055 && closedness > 0.45) {
    return "line";
  }

  const looksClosed = closedness < 0.34;

  if (!looksClosed) {
    return straightness < 0.1 ? "line" : "rectangle";
  }

  const aspectLooksCircular = aspect > 0.72 && aspect < 1.38;

  /*
   * Triângulo precisa ser MUITO evidente.
   *
   * A pontuação triangular tende a ficar artificialmente boa para círculos e retângulos,
   * porque qualquer forma fechada acaba tendo alguns pontos perto das três arestas de um
   * triângulo imaginário. Se a gente deixa o triângulo competir de igual para igual,
   * tudo vira triângulo. Sim, a geometria resolveu fazer cosplay de bug.
   */
  const triangleClearlyBetter =
    triangleScore < rectangleScore * 0.52 &&
    triangleScore < ellipseScore * 0.52 &&
    aspect > 0.45 &&
    aspect < 2.15;

  const ellipseClearlyBetter =
    ellipseScore <= rectangleScore * 0.95 &&
    (aspectLooksCircular || ellipseScore < triangleScore * 0.7);

  const rectangleClearlyBetter =
    rectangleScore < ellipseScore * 0.9 &&
    rectangleScore < triangleScore * 0.82;

  if (ellipseClearlyBetter) return "ellipse";
  if (rectangleClearlyBetter) return "rectangle";
  if (triangleClearlyBetter) return "triangle";

  if (aspectLooksCircular) return "ellipse";
  return rectangleScore <= ellipseScore ? "rectangle" : "ellipse";
}

function shouldAutoPerfectStroke(stroke: ScratchpadStroke, pointerUpTime?: number) {
  if (stroke.tool !== "pen" || stroke.brush === "highlighter" || stroke.points.length < 8) {
    return false;
  }

  const metrics = getStrokeShapeMetrics(stroke);

  if (!metrics || metrics.diagonal < 35) return false;

  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  const lastMoveTime = last.time ?? first.time ?? 0;
  const holdTime = typeof pointerUpTime === "number" && lastMoveTime > 0 ? pointerUpTime - lastMoveTime : 0;
  const looksLikeLine = metrics.straightness < 0.05 && metrics.closedness > 0.45;
  const looksLikeClosedShape = metrics.closedness < 0.28 && metrics.diagonal > 45;

  return holdTime >= AUTO_SHAPE_HOLD_MS && (looksLikeLine || looksLikeClosedShape);
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
  if (stroke.tool === "meta") return false;

  if ((stroke.tool === "text" || stroke.tool === "image") && getStrokeBounds(stroke)) {
    const bounds = getStrokeBounds(stroke);
    return Boolean(bounds && isPointInsideBounds(point, {
      minX: bounds.minX - radius,
      minY: bounds.minY - radius,
      maxX: bounds.maxX + radius,
      maxY: bounds.maxY + radius,
    }));
  }

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

    if (stroke.shape === "triangle") {
      const top = { x: (box.minX + box.maxX) / 2, y: box.minY };
      const right = { x: box.maxX, y: box.maxY };
      const left = { x: box.minX, y: box.maxY };

      return (
        isPointInsideBounds(point, box) ||
        distancePointToSegment(point, top, right) <= radius + stroke.size ||
        distancePointToSegment(point, right, left) <= radius + stroke.size ||
        distancePointToSegment(point, left, top) <= radius + stroke.size
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

    if (Array.isArray(parsed.pages)) {
      return {
        ...parsed,
        pages: normalizePages(parsed.pages, parsed.backgroundType ?? "grid"),
        activePageId: typeof parsed.activePageId === "string" ? parsed.activePageId : undefined,
      };
    }

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
  pages,
  activePageId,
}: {
  userId?: string | null;
  questionId: string;
  strokes?: ScratchpadStroke[];
  backgroundType?: ScratchpadBackground;
  pages?: ScratchpadPage[];
  activePageId?: string;
}) {
  if (typeof window === "undefined") return null;

  const draft: LocalScratchpadDraft = {
    strokes,
    backgroundType,
    pages: pages?.map(clonePage),
    activePageId,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(getLocalDraftKey(userId, questionId), JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

function getLocalDraftIndexes() {
  if (typeof window === "undefined") return [];

  const prefix = `${LOCAL_DRAFT_VERSION}:question-note:`;
  const items: ScratchpadListItem[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as LocalScratchpadDraft;
      const questionIdFromKey = key.replace(prefix, "").split(":").slice(1).join(":") || "sem-id";
      const pagesCount = Array.isArray(parsed.pages)
        ? parsed.pages.length
        : Array.isArray(parsed.strokes)
          ? 1
          : 0;

      items.push({
        key,
        questionId: questionIdFromKey,
        title: questionIdFromKey === "anonymous" ? "Rascunho local" : `Questão ${questionIdFromKey.slice(0, 8)}`,
        updatedAt: parsed.updatedAt,
        pagesCount,
      });
    } catch {
      // Ignora lixo perdido no localStorage. Até o navegador coleciona entulho.
    }
  }

  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function deleteLocalDraftByKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function formatLocalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data desconhecida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
      <span className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

export function StudyCanvasWorkspace({
  userId,
  questionId,
  questionCode,
  titleOverride,
  persistence,
  disableLocalDraft = false,
  initiallyOpen = false,
  hideLauncher = false,
  autosaveIntervalMs,
  saveRequest = 0,
  onStateChange,
  backgroundOverride,
}: StudyCanvasWorkspaceProps) {
  const fullscreenRootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const committedLayerRef = useRef<HTMLCanvasElement | null>(null);
  const committedLayerDirtyRef = useRef(true);
  const inkPreviewFrameRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const currentStrokeRef = useRef<ScratchpadStroke | null>(null);
  const shapeStrokeRef = useRef<ScratchpadStroke | null>(null);
  const eraserPathRef = useRef<ScratchpadPoint[]>([]);
  const eraserFrameRef = useRef<number | null>(null);
  const eraserLastApplyAtRef = useRef(0);
  const lassoPathRef = useRef<ScratchpadPoint[]>([]);
  const panLastRawPointRef = useRef<{ x: number; y: number } | null>(null);
  const selectionLastPointRef = useRef<ScratchpadPoint | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const rotateStateRef = useRef<RotateState | null>(null);
  const strokesBeforeInteractionRef = useRef<ScratchpadStroke[] | null>(null);
  const selectionMovedRef = useRef(false);
  const strokesRef = useRef<ScratchpadStroke[]>([]);
  const dirtyRef = useRef(false);
  const localDraftTimerRef = useRef<number | null>(null);
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

  const [open, setOpen] = useState(initiallyOpen);
  const [pages, setPages] = useState<ScratchpadPage[]>(() => [createScratchpadPage(1)]);
  const [activePageId, setActivePageId] = useState(() => pages[0]?.id ?? "page-1");
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
  const [fullscreenPanel, setFullscreenPanel] = useState<FullscreenPanel>(null);
  const [view, setView] = useState<CanvasView>(viewRef.current);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);
  const [localStatus, setLocalStatus] = useState("");
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState<ScratchpadListItem[]>([]);

  const canSave = Boolean(persistence || (userId && questionId));

  const title = useMemo(() => {
    return titleOverride ?? (questionCode ? `Rascunho da questão ${questionCode}` : "Rascunho da questão");
  }, [questionCode, titleOverride]);

  const selectedBounds = useMemo(
    () => getSelectedBounds(strokes, selectedIds),
    [selectedIds, strokes]
  );

  function refreshLocalNotesPanel() {
    setLocalNotes(getLocalDraftIndexes());
  }

  const replaceStrokes = useCallback((nextStrokes: ScratchpadStroke[]) => {
    strokesRef.current = nextStrokes;
    committedLayerDirtyRef.current = true;
    setStrokesState(nextStrokes);
  }, []);

  function getPagesForPersistence(
    nextStrokes = strokesRef.current,
    nextBackground = backgroundTypeRef.current
  ) {
    return pages.map((page) =>
      page.id === activePageId
        ? {
            ...page,
            strokes: cloneStrokes(nextStrokes),
            backgroundType: nextBackground,
          }
        : clonePage(page)
    );
  }

  function resetPageHistory() {
    historyRef.current = [];
    redoHistoryRef.current = [];
    setHistoryDepth(0);
    setRedoDepth(0);
  }

  function openPage(pageId: string) {
    const targetPage = pages.find((page) => page.id === pageId);
    if (!targetPage || targetPage.id === activePageId) return;

    const currentPages = getPagesForPersistence();
    const nextTargetPage = currentPages.find((page) => page.id === pageId);

    if (!nextTargetPage) return;

    setPages(currentPages);
    setActivePageId(pageId);
    replaceStrokes(cloneStrokes(nextTargetPage.strokes));
    setBackgroundType(nextTargetPage.backgroundType);
    backgroundTypeRef.current = nextTargetPage.backgroundType;
    setSelectedIds([]);
    resetPageHistory();
    resetZoom();
  }

  function addPage() {
    const nextPages = [...getPagesForPersistence(), createScratchpadPage(pages.length + 1)];
    const nextPage = nextPages[nextPages.length - 1];

    setPages(nextPages);
    setActivePageId(nextPage.id);
    replaceStrokes([]);
    setBackgroundType(nextPage.backgroundType);
    backgroundTypeRef.current = nextPage.backgroundType;
    setSelectedIds([]);
    resetPageHistory();
    markDirty("Nova página criada. Clique em Salvar para guardar.");
  }

  function duplicateCurrentPage() {
    const currentPages = getPagesForPersistence();
    const currentPage = currentPages.find((page) => page.id === activePageId);

    if (!currentPage) return;

    const copy: ScratchpadPage = {
      ...clonePage(currentPage),
      id: createPageId(),
      title: `${currentPage.title} cópia`,
      strokes: currentPage.strokes.map((stroke) => ({
        ...stroke,
        id: createStrokeId(),
        points: stroke.points.map((point) => ({ ...point, x: point.x + 24, y: point.y + 24 })),
      })),
    };

    const nextPages = [...currentPages, copy];

    setPages(nextPages);
    setActivePageId(copy.id);
    replaceStrokes(cloneStrokes(copy.strokes));
    setBackgroundType(copy.backgroundType);
    backgroundTypeRef.current = copy.backgroundType;
    setSelectedIds([]);
    resetPageHistory();
    markDirty("Página duplicada. Clique em Salvar para guardar.");
  }

  function deleteCurrentPage() {
    if (pages.length <= 1) {
      handleClear();
      return;
    }

    const shouldDelete = window.confirm("Excluir esta página do rascunho?");
    if (!shouldDelete) return;

    const currentPages = getPagesForPersistence();
    const currentIndex = currentPages.findIndex((page) => page.id === activePageId);
    const nextPages = currentPages.filter((page) => page.id !== activePageId);
    const nextPage = nextPages[Math.max(0, currentIndex - 1)] ?? nextPages[0];

    setPages(nextPages);
    setActivePageId(nextPage.id);
    replaceStrokes(cloneStrokes(nextPage.strokes));
    setBackgroundType(nextPage.backgroundType);
    backgroundTypeRef.current = nextPage.backgroundType;
    setSelectedIds([]);
    resetPageHistory();
    markDirty("Página excluída. Clique em Salvar para guardar.");
  }

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

  function markCommittedLayerDirty() {
    committedLayerDirtyRef.current = true;
  }

  function getCommittedInkLayer(pixelRatio: number) {
    const width = Math.round(CANVAS_WIDTH * pixelRatio);
    const height = Math.round(CANVAS_HEIGHT * pixelRatio);

    let layer = committedLayerRef.current;

    if (!layer) {
      layer = document.createElement("canvas");
      committedLayerRef.current = layer;
      committedLayerDirtyRef.current = true;
    }

    if (layer.width !== width || layer.height !== height) {
      layer.width = width;
      layer.height = height;
      committedLayerDirtyRef.current = true;
    }

    if (committedLayerDirtyRef.current) {
      const layerCtx = layer.getContext("2d");

      if (!layerCtx) return layer;

      layerCtx.setTransform(1, 0, 0, 1, 0, 0);
      layerCtx.clearRect(0, 0, layer.width, layer.height);
      layerCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      layerCtx.imageSmoothingEnabled = true;
      layerCtx.imageSmoothingQuality = "high";

      layerCtx.save();
      applyView(layerCtx, viewRef.current);

      for (const stroke of strokesRef.current) {
        drawStroke(layerCtx, stroke);
      }

      layerCtx.restore();
      committedLayerDirtyRef.current = false;
    }

    return layer;
  }

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

      const committedLayer = getCommittedInkLayer(pixelRatio);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(committedLayer, 0, 0);

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.save();
      applyView(ctx, viewRef.current);

      if (extraStroke) {
        drawStroke(ctx, extraStroke);
      }

      if (eraserPreview) {
        drawEraserPreview(ctx, eraserPreview);
      }

      if (lassoPreview) {
        drawLassoPreview(ctx, lassoPreview, viewRef.current);
      }

      drawSelectionBox(
        ctx,
        getSelectedBounds(strokesRef.current, selectedIds),
        viewRef.current
      );

      ctx.restore();
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
    markCommittedLayerDirty();
    redrawCanvas();
  }, [view, redrawCanvas]);

  useEffect(() => {
    strokesRef.current = strokes;
    markCommittedLayerDirty();
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  useEffect(() => {
    backgroundTypeRef.current = backgroundType;
    redrawCanvas();
  }, [backgroundType, redrawCanvas]);

  useEffect(() => {
    if (!backgroundOverride || backgroundOverride === backgroundTypeRef.current) return;
    handleBackgroundChange(backgroundOverride);
  }, [backgroundOverride]);


  useEffect(() => {
    if (!loaded) return;

    setPages((previous) =>
      previous.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              strokes,
              backgroundType,
            }
          : page
      )
    );
  }, [activePageId, backgroundType, loaded, strokes]);

  useEffect(() => {
    if (!loaded || !questionId || !dirtyRef.current) return;
    if (disableLocalDraft) return;

    if (localDraftTimerRef.current !== null) {
      window.clearTimeout(localDraftTimerRef.current);
    }

    localDraftTimerRef.current = window.setTimeout(() => {
      const pagesForDraft = getPagesForPersistence(strokesRef.current, backgroundTypeRef.current);

      const draft = writeLocalDraft({
        userId,
        questionId,
        pages: pagesForDraft,
        activePageId,
        backgroundType: backgroundTypeRef.current,
      });

      if (draft) {
        setLocalStatus("Backup local salvo no navegador.");
        refreshLocalNotesPanel();
      }

      localDraftTimerRef.current = null;
    }, 650);

    return () => {
      if (localDraftTimerRef.current !== null) {
        window.clearTimeout(localDraftTimerRef.current);
        localDraftTimerRef.current = null;
      }
    };
  }, [activePageId, backgroundType, disableLocalDraft, loaded, pages, questionId, strokes, userId]);

  useEffect(() => {
    redrawCanvas();
  }, [selectedIds, redrawCanvas]);

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      setLoaded(false);
      setStatus("");
      setError("");

      function isLocalDraftNewer(
        localDraft: LocalScratchpadDraft | null,
        remoteUpdatedAt?: string | null
      ) {
        if (!localDraft?.updatedAt) return false;
        if (!remoteUpdatedAt) return true;

        const localTime = new Date(localDraft.updatedAt).getTime();
        const remoteTime = new Date(remoteUpdatedAt).getTime();

        return Number.isFinite(localTime) && (!Number.isFinite(remoteTime) || localTime > remoteTime);
      }

      function loadPagesFromDraft(localDraft: LocalScratchpadDraft | null) {
        if (localDraft?.pages?.length) {
          const normalized = normalizePages(localDraft.pages, localDraft.backgroundType ?? "grid");
          const active = localDraft.activePageId && normalized.some((page) => page.id === localDraft.activePageId)
            ? localDraft.activePageId
            : normalized[0].id;

          return { pages: normalized, activePageId: active };
        }

        if (Array.isArray(localDraft?.strokes)) {
          const page = createScratchpadPage(1);
          page.id = "page-1";
          page.strokes = localDraft.strokes;
          page.backgroundType = localDraft.backgroundType ?? "grid";
          return { pages: [page], activePageId: page.id };
        }

        return null;
      }

      if (persistence) {
        try {
          const stored = await persistence.load();
          if (cancelled) return;
          const normalized = normalizePages(stored?.pages ?? [], "grid");
          const activePage = normalized.find((page) => page.id === stored?.activePageId) ?? normalized[0];
          setPages(normalized.map(clonePage));
          setActivePageId(activePage.id);
          replaceStrokes(cloneStrokes(activePage.strokes));
          setBackgroundType(activePage.backgroundType);
          backgroundTypeRef.current = activePage.backgroundType;
          setSelectedIds([]);
          resetPageHistory();
          dirtyRef.current = false;
          setDirty(false);
        } catch (loadError) {
          console.error("Erro ao carregar documento do editor:", loadError);
          if (!cancelled) setError("Não foi possível carregar este documento.");
        } finally {
          if (!cancelled) setLoaded(true);
        }
        return;
      }

      if (!userId || !questionId) {
        const page = createScratchpadPage(1);
        page.id = "page-1";
        setPages([page]);
        setActivePageId(page.id);
        replaceStrokes([]);
        setBackgroundType("grid");
        backgroundTypeRef.current = "grid";
        setSelectedIds([]);
        resetPageHistory();
        dirtyRef.current = false;
        setDirty(false);
        setLoaded(true);
        return;
      }

      try {
        const note = await getQuestionNote({ userId, questionId });
        const localDraft = readLocalDraft(userId, questionId);

        if (cancelled) return;

        const remoteBackground = isValidBackground(note?.background_type)
          ? note.background_type
          : "grid";
        const remotePages = decodePagesFromStorage({
          storedStrokes: Array.isArray(note?.strokes) ? note.strokes : [],
          backgroundType: remoteBackground,
        });
        const localPages = loadPagesFromDraft(localDraft);
        const shouldUseLocal = isLocalDraftNewer(localDraft, note?.updated_at);
        const loadedPages = shouldUseLocal && localPages ? localPages : remotePages;
        const activePage = loadedPages.pages.find((page) => page.id === loadedPages.activePageId) ?? loadedPages.pages[0];

        setPages(loadedPages.pages.map(clonePage));
        setActivePageId(activePage.id);
        replaceStrokes(cloneStrokes(activePage.strokes));
        setBackgroundType(activePage.backgroundType);
        backgroundTypeRef.current = activePage.backgroundType;
        setSelectedIds([]);
        resetPageHistory();
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
          const localPages = loadPagesFromDraft(localDraft);

          if (localPages) {
            const activePage = localPages.pages.find((page) => page.id === localPages.activePageId) ?? localPages.pages[0];

            setPages(localPages.pages.map(clonePage));
            setActivePageId(activePage.id);
            replaceStrokes(cloneStrokes(activePage.strokes));
            setBackgroundType(activePage.backgroundType);
            backgroundTypeRef.current = activePage.backgroundType;
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
  }, [persistence, questionId, replaceStrokes, userId]);

  const handleSave = useCallback(
    async (nextStrokes = strokesRef.current) => {
      if (!canSave || (!persistence && !userId)) {
        setError("Entre na sua conta para salvar o rascunho.");
        return;
      }

      const pagesForSave = getPagesForPersistence(nextStrokes, backgroundTypeRef.current);
      const storageStrokes = encodePagesForStorage(pagesForSave, activePageId);

      try {
        setSaving(true);
        setError("");

        if (persistence) {
          await persistence.save({ pages: pagesForSave, activePageId });
        } else if (userId) {
          await saveQuestionNote({
            userId,
            questionId,
            strokes: storageStrokes,
            canvasWidth: CANVAS_WIDTH,
            canvasHeight: CANVAS_HEIGHT,
            backgroundType: backgroundTypeRef.current,
            title,
          });
          if (!disableLocalDraft) {
            writeLocalDraft({ userId, questionId, pages: pagesForSave, activePageId, backgroundType: backgroundTypeRef.current });
          }
        }
        setPages(pagesForSave);
        dirtyRef.current = false;
        setDirty(false);
        setLocalStatus(persistence ? "" : "Backup local e nuvem sincronizados.");
        setStatus(persistence ? "Salvo no Google Drive." : "Rascunho salvo.");
      } catch (saveError) {
        const readableMessage = getReadableErrorMessage(saveError);
        console.error("Erro ao salvar rascunho:", saveError);
        setError(`Não foi possível salvar o rascunho. Detalhe: ${readableMessage}`);
      } finally {
        setSaving(false);
      }
    },
    [activePageId, canSave, disableLocalDraft, pages, persistence, questionId, title, userId]
  );

  useEffect(() => {
    onStateChange?.({ dirty, saving, error });
  }, [dirty, error, onStateChange, saving]);

  useEffect(() => {
    if (!autosaveIntervalMs || !persistence) return;
    const timer = window.setInterval(() => {
      if (dirtyRef.current) void handleSave();
    }, autosaveIntervalMs);
    return () => window.clearInterval(timer);
  }, [autosaveIntervalMs, handleSave, persistence]);

  useEffect(() => {
    if (saveRequest > 0) void handleSave();
  }, [handleSave, saveRequest]);

  useEffect(() => {
    return () => {
      if (!dirtyRef.current || !canSave) return;

      if (persistence) {
        void persistence.save({
          pages: getPagesForPersistence(strokesRef.current, backgroundTypeRef.current),
          activePageId,
        }).catch((saveError) => console.error("Erro ao salvar documento ao sair:", saveError));
        return;
      }
      if (!userId) return;

      const pagesForSave = getPagesForPersistence(strokesRef.current, backgroundTypeRef.current);

      void saveQuestionNote({
        userId,
        questionId,
        strokes: encodePagesForStorage(pagesForSave, activePageId),
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundType: backgroundTypeRef.current,
        title,
      }).catch((saveError) => {
        console.error("Erro ao salvar rascunho ao sair da questão:", saveError);
      });
    };
  }, [activePageId, canSave, pages, persistence, questionId, title, userId]);

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
    const interactionBase = strokesBeforeInteractionRef.current;
    if (interactionBase && didStrokeCollectionChange(interactionBase, strokesRef.current)) {
      replaceStrokes(cloneStrokes(interactionBase));
    }
    strokesBeforeInteractionRef.current = null;
    selectionMovedRef.current = false;
    currentStrokeRef.current = null;
    shapeStrokeRef.current = null;
    if (eraserFrameRef.current !== null) {
      window.cancelAnimationFrame(eraserFrameRef.current);
      eraserFrameRef.current = null;
    }

    if (inkPreviewFrameRef.current !== null) {
      window.cancelAnimationFrame(inkPreviewFrameRef.current);
      inkPreviewFrameRef.current = null;
    }

    eraserPathRef.current = [];
    lassoPathRef.current = [];
    panLastRawPointRef.current = null;
    selectionLastPointRef.current = null;
    resizeStateRef.current = null;
    rotateStateRef.current = null;
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

  function getOptimizedEraserPath(path: ScratchpadPoint[]) {
    if (path.length <= 180) return path;

    const step = Math.ceil(path.length / 180);
    const optimized = path.filter((_, index) => index % step === 0);
    const lastPoint = path[path.length - 1];

    if (optimized[optimized.length - 1] !== lastPoint) {
      optimized.push(lastPoint);
    }

    return optimized;
  }

  function getEraserResultFromBase(path: ScratchpadPoint[]) {
    const base = strokesBeforeInteractionRef.current ?? strokesRef.current;
    const optimizedPath = getOptimizedEraserPath(path);

    if (tool === "areaEraser") {
      return eraseStrokesByArea(base, optimizedPath, eraserSize);
    }

    if (tool === "strokeEraser") {
      return eraseWholeStrokes(base, optimizedPath, eraserSize);
    }

    return base;
  }

  function flushLiveEraser() {
    if (eraserFrameRef.current !== null) {
      window.cancelAnimationFrame(eraserFrameRef.current);
      eraserFrameRef.current = null;
    }

    if (eraserPathRef.current.length === 0) return;

    const nextStrokes = getEraserResultFromBase(eraserPathRef.current);
    replaceStrokes(nextStrokes);

    const lastPoint = eraserPathRef.current[eraserPathRef.current.length - 1];
    redrawCanvas(null, { point: lastPoint, radius: eraserSize });
  }

  function scheduleLiveEraser() {
    if (eraserFrameRef.current !== null) return;

    eraserFrameRef.current = window.requestAnimationFrame(() => {
      eraserFrameRef.current = null;

      if (interactionModeRef.current !== "erase") return;

      const lastPoint = eraserPathRef.current[eraserPathRef.current.length - 1];

      if (!lastPoint) return;

      const now = performance.now();
      const canApplyLive = now - eraserLastApplyAtRef.current >= ERASER_LIVE_APPLY_MS;

      if (!canApplyLive) {
        redrawCanvas(null, { point: lastPoint, radius: eraserSize });
        return;
      }

      eraserLastApplyAtRef.current = now;

      const nextStrokes = getEraserResultFromBase(eraserPathRef.current);
      replaceStrokes(nextStrokes);
      redrawCanvas(null, { point: lastPoint, radius: eraserSize });
    });
  }

  function scheduleInkPreview(extraStrokeGetter: () => ScratchpadStroke | null) {
    if (inkPreviewFrameRef.current !== null) return;

    inkPreviewFrameRef.current = window.requestAnimationFrame(() => {
      inkPreviewFrameRef.current = null;

      const extraStroke = extraStrokeGetter();
      redrawCanvas(extraStroke);
    });
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

    const hasTwoTouchPointers = isMultitouchGesture(activePointersRef.current.values());

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
          if (selectedHandle === "rotate") {
            beginInteraction(event, "selectionRotate");
            rotateStateRef.current = {
              baseBounds: currentSelectedBounds,
              baseStrokes: cloneStrokes(strokesRef.current),
              startAngle: getAngleFromCenter(getBoundsCenter(currentSelectedBounds), point),
            };
          } else {
            beginInteraction(event, "selectionResize");
            resizeStateRef.current = {
              handle: selectedHandle,
              baseBounds: currentSelectedBounds,
              baseStrokes: cloneStrokes(strokesRef.current),
            };
          }

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

    if (tool === "text") {
      const text = window.prompt("Digite o texto que você quer inserir no rascunho:");

      if (!text?.trim()) return;

      const previous = strokesRef.current;
      const textStroke: ScratchpadStroke = {
        id: createStrokeId(),
        tool: "text",
        color,
        size,
        points: [point],
        text: text.trim(),
        opacity: 1,
      };

      commitStrokes([...previous, textStroke], previous);
      setSelectedIds([textStroke.id]);
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
    eraserLastApplyAtRef.current = 0;
    currentStrokeRef.current = null;
    eraserPathRef.current = [point];
    setSelectedIds([]);
    redrawCanvas(null, { point, radius: eraserSize });
    scheduleLiveEraser();
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

    const hasTwoTouchPointers = isMultitouchGesture(activePointersRef.current.values());

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

    if (mode === "selectionRotate") {
      const rotateState = rotateStateRef.current;
      const currentPoint = points[points.length - 1];

      if (!rotateState) return;

      const center = getBoundsCenter(rotateState.baseBounds);
      const currentAngle = getAngleFromCenter(center, currentPoint);
      const deltaAngle = currentAngle - rotateState.startAngle;
      const selectedSet = new Set(selectedIds);
      const nextStrokes = rotateState.baseStrokes.map((stroke) => {
        if (!selectedSet.has(stroke.id)) return stroke;
        return rotateStroke(stroke, center, deltaAngle);
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

      scheduleInkPreview(() => shapeStrokeRef.current);
      return;
    }

    if (mode === "stroke" && currentStrokeRef.current) {
      appendPointsToCurrentStroke(points);
      scheduleInkPreview(() => currentStrokeRef.current);
      return;
    }

    if (mode === "erase") {
      const nextPoints = points.filter((point) =>
        shouldAppendPoint(eraserPathRef.current[eraserPathRef.current.length - 1], point)
      );

      if (nextPoints.length === 0) return;

      eraserPathRef.current = [...eraserPathRef.current, ...nextPoints];

      const lastPoint = eraserPathRef.current[eraserPathRef.current.length - 1];
      redrawCanvas(null, { point: lastPoint, radius: eraserSize });
      scheduleLiveEraser();
    }
  }

  function didStrokeChange(previous: ScratchpadStroke, current: ScratchpadStroke) {
    if (
      previous.id !== current.id ||
      previous.tool !== current.tool ||
      previous.color !== current.color ||
      previous.size !== current.size ||
      previous.brush !== current.brush ||
      previous.shape !== current.shape ||
      previous.opacity !== current.opacity ||
      previous.rotation !== current.rotation ||
      previous.text !== current.text ||
      previous.imageData !== current.imageData ||
      previous.points.length !== current.points.length
    ) {
      return true;
    }

    const indexes = [
      0,
      Math.floor(previous.points.length / 2),
      previous.points.length - 1,
    ].filter((index, position, list) => index >= 0 && list.indexOf(index) === position);

    return indexes.some((index) => {
      const a = previous.points[index];
      const b = current.points[index];

      return (
        !a ||
        !b ||
        a.x !== b.x ||
        a.y !== b.y ||
        a.width !== b.width ||
        a.pressure !== b.pressure
      );
    });
  }

  function didStrokeCollectionChange(previous: ScratchpadStroke[], current: ScratchpadStroke[]) {
    if (previous === current) return false;
    if (previous.length !== current.length) return true;

    for (let index = 0; index < previous.length; index += 1) {
      if (didStrokeChange(previous[index], current[index])) {
        return true;
      }
    }

    return false;
  }

  function finalizeHistoryIfChanged() {
    const base = strokesBeforeInteractionRef.current;
    strokesBeforeInteractionRef.current = null;

    if (!base) return;

    const changed = didStrokeCollectionChange(base, strokesRef.current);

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
      let finishedStroke = smoothFreehandStroke(currentStrokeRef.current);
      const previous = strokesRef.current;
      const pointerUpTime = event?.nativeEvent.timeStamp;

      if (shouldAutoPerfectStroke(finishedStroke, pointerUpTime)) {
        finishedStroke = transformStrokeToPerfectShape(finishedStroke, guessPerfectShape(finishedStroke));
      }

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
      flushLiveEraser();
      finalizeHistoryIfChanged();
    } else if (mode === "selectionMove" || mode === "selectionResize" || mode === "selectionRotate") {
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
    rotateStateRef.current = null;
    activePointerIdRef.current = null;
    interactionModeRef.current = "none";
    selectionMovedRef.current = false;
    setIsDrawing(false);
    redrawCanvas();
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    removeActivePointer(event);

    if (event.pointerId === activePointerIdRef.current) {
      cancelCurrentInkInteraction();
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

  function applyPenPreset(preset: PenPreset) {
    setTool(preset.tool);

    if (preset.brush) {
      setBrush(preset.brush);
    }

    if (preset.color) {
      setColor(preset.color);
    }

    if (typeof preset.size === "number") {
      setSize(preset.size);
    }

    if (typeof preset.eraserSize === "number") {
      setEraserSize(preset.eraserSize);
    }

    setStatus(`Preset aplicado: ${preset.label}.`);
  }

  function toggleFullscreenPanel(panel: Exclude<FullscreenPanel, null>) {
    setFullscreenPanel((current) => (current === panel ? null : panel));
  }

  function getCurrentToolLabel() {
    if (tool === "pen" && brush === "pen") return "Caneta";
    if (tool === "pen" && brush === "brush") return "Pincel";
    if (tool === "pen" && brush === "highlighter") return "Marca";
    if (tool === "select") return "Selecionar";
    if (tool === "pan") return "Mover";
    if (tool === "text") return "Texto";
    if (tool === "areaEraser") return "Borracha";
    if (tool === "strokeEraser") return "Traço";
    if (tool === "shape") return "Forma";
    return "Ferramenta";
  }

  function getCurrentShapeLabel() {
    if (shapeTool === "line") return "Reta";
    if (shapeTool === "arrow") return "Seta";
    if (shapeTool === "rectangle") return "Retângulo";
    if (shapeTool === "ellipse") return "Círculo";
    if (shapeTool === "triangle") return "Triângulo";
    return "Forma";
  }

  function getBackgroundLabel() {
    return BACKGROUNDS.find((item) => item.value === backgroundType)?.label ?? "Fundo";
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
        1
      )
    );
  }

  function rotateSelectionBy(angle: number) {
    const bounds = getSelectedBounds(strokesRef.current, selectedIds);
    if (!bounds) return;

    const center = getBoundsCenter(bounds);

    applyTransformToSelection((stroke) => rotateStroke(stroke, center, angle));
  }

  function adjustSelectionThickness(factor: number) {
    applyTransformToSelection((stroke) => ({
      ...stroke,
      size: clamp(stroke.size * factor, 1, 60),
      points: stroke.points.map((point) => ({
        ...point,
        width: typeof point.width === "number" ? clamp(point.width * factor, 0.6, 90) : point.width,
      })),
    }));
  }

  function setSelectionThickness(nextSize: number) {
    applyTransformToSelection((stroke) => {
      const safeSize = clamp(nextSize, 1, 60);
      const factor = stroke.size > 0 ? safeSize / stroke.size : 1;

      return {
        ...stroke,
        size: safeSize,
        points: stroke.points.map((point) => ({
          ...point,
          width: typeof point.width === "number" ? clamp(point.width * factor, 0.6, 90) : point.width,
        })),
      };
    });
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

  function renderPageToDataUrl(page: ScratchpadPage, pixelRatio = 2) {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_WIDTH * pixelRatio;
    exportCanvas.height = CANVAS_HEIGHT * pixelRatio;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return "";

    const exportView: CanvasView = { zoom: 1, offsetX: 0, offsetY: 0 };
    drawPaper(ctx, exportView, page.backgroundType, pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    for (const stroke of page.strokes) {
      drawStroke(ctx, stroke);
    }

    return exportCanvas.toDataURL("image/png");
  }

  function getActivePageForExport(): ScratchpadPage {
    return {
      id: activePageId,
      title: pages.find((page) => page.id === activePageId)?.title ?? "Página atual",
      strokes: cloneStrokes(strokesRef.current),
      backgroundType: backgroundTypeRef.current,
    };
  }

  function exportAsPng() {
    const url = renderPageToDataUrl(getActivePageForExport(), 2);

    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `${questionCode ?? "rascunho"}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }

  function exportAsPdf() {
    const pagesForExport = getPagesForPersistence(strokesRef.current, backgroundTypeRef.current);
    const images = pagesForExport.map((page) => ({
      title: page.title,
      url: renderPageToDataUrl(page, 2),
    }));

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("O navegador bloqueou a janela de exportação. Libere pop-ups para exportar PDF.");
      return;
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { margin: 0; font-family: Arial, sans-serif; background: #fff; }
            .page { page-break-after: always; padding: 8mm; }
            .page:last-child { page-break-after: auto; }
            h1 { font-size: 14px; margin: 0 0 8px; color: #111827; }
            img { width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
          </style>
        </head>
        <body>
          ${images
            .map(
              (image, index) => `
                <section class="page">
                  <h1>${title} - ${image.title || `Página ${index + 1}`}</h1>
                  <img src="${image.url}" />
                </section>
              `
            )
            .join("")}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function editSelectedText() {
    if (selectedIds.length !== 1) return;

    const selectedId = selectedIds[0];
    const selectedStroke = strokesRef.current.find((stroke) => stroke.id === selectedId);

    if (!selectedStroke || selectedStroke.tool !== "text") return;

    const nextText = window.prompt("Editar texto:", selectedStroke.text ?? "");

    if (nextText === null) return;

    const previous = cloneStrokes(strokesRef.current);
    const next = strokesRef.current.map((stroke) =>
      stroke.id === selectedId
        ? {
            ...stroke,
            text: nextText.trim(),
          }
        : stroke
    );

    commitStrokes(next, previous);
  }

  function importImageFile(file: File) {
    if (file.type === "application/pdf") {
      setError("Importação direta de PDF precisa de PDF.js. Por enquanto, exportação em PDF já está pronta e importação aceita imagens.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Envie uma imagem em PNG, JPG, WEBP ou SVG.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result ?? "");
      if (!imageData) return;

      const previous = strokesRef.current;
      const imageStroke: ScratchpadStroke = {
        id: createStrokeId(),
        tool: "image",
        color: "#0f172a",
        size: 2,
        points: [
          { x: 120, y: 90, pressure: 0.6 },
          { x: 520, y: 390, pressure: 0.6 },
        ],
        imageData,
        opacity: 1,
      };

      commitStrokes([...previous, imageStroke], previous);
      setSelectedIds([imageStroke.id]);

      setTimeout(() => {
        redrawCanvas();
      }, 180);
    };

    reader.readAsDataURL(file);
  }



  function handleCanvasDoubleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== "select") return;

    const point = getCanvasPointFromNative(event.nativeEvent, "mouse");
    const clickedStroke = findStrokeAtPoint(strokesRef.current, point);

    if (!clickedStroke) return;

    setSelectedIds([clickedStroke.id]);

    if (clickedStroke.tool === "text") {
      const nextText = window.prompt("Editar texto:", clickedStroke.text ?? "");

      if (nextText === null) return;

      const previous = cloneStrokes(strokesRef.current);
      const next = strokesRef.current.map((stroke) =>
        stroke.id === clickedStroke.id
          ? {
              ...stroke,
              text: nextText.trim(),
            }
          : stroke
      );

      commitStrokes(next, previous);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      const isBrowserFullscreen = Boolean(document.fullscreenElement);

      if (!isBrowserFullscreen && fullscreen) {
        setFullscreen(false);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [fullscreen]);

  function enterScratchpadFullscreen() {
    setOpen(true);
    setFullscreen(true);
    setNotesPanelOpen(false);
    updateView({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });

    window.setTimeout(() => {
      const element = fullscreenRootRef.current;

      if (element?.requestFullscreen && !document.fullscreenElement) {
        void element.requestFullscreen().catch(() => {
          // Se o navegador negar fullscreen real, o modo fixed ainda funciona.
        });
      }

      redrawCanvas();
    }, 80);
  }

  function exitScratchpadFullscreen() {
    setFullscreen(false);
    setFullscreenPanel(null);

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Navegador sendo navegador. O estado visual já sai.
      });
    }

    window.setTimeout(() => {
      redrawCanvas();
    }, 80);
  }

  function toggleScratchpadFullscreen() {
    if (fullscreen) {
      exitScratchpadFullscreen();
      return;
    }

    enterScratchpadFullscreen();
  }

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;

      const tag = target.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        void handleSave();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (((event.ctrlKey || event.metaKey) && event.shiftKey && key === "z") || ((event.ctrlKey || event.metaKey) && key === "y")) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (key === "delete" || key === "backspace") {
        if (selectedIds.length > 0) {
          event.preventDefault();
          deleteSelection();
        }
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (key === "p") activatePen("pen");
      if (key === "b") activatePen("brush");
      if (key === "h") activatePen("highlighter");
      if (key === "e") setTool("areaEraser");
      if (key === "s") setTool("select");
      if (key === "m") setTool("pan");
      if (key === "t") setTool("text");
      if (key === "l") activateShape("line");
      if (key === "a") activateShape("arrow");
      if (key === "r") activateShape("rectangle");
      if (key === "c") activateShape("ellipse");
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave, selectedIds.length]);

  useEffect(() => {
    if (selectedIds.length === 0 && fullscreenPanel === "selection") {
      setFullscreenPanel(null);
    }
  }, [fullscreenPanel, selectedIds.length]);

  const selectedAverageSize = useMemo(() => {
    if (selectedIds.length === 0) return size;

    const selectedSet = new Set(selectedIds);
    const selectedStrokes = strokes.filter((stroke) => selectedSet.has(stroke.id));

    if (selectedStrokes.length === 0) return size;

    const total = selectedStrokes.reduce((sum, stroke) => sum + stroke.size, 0);
    return Math.round(total / selectedStrokes.length);
  }, [selectedIds, size, strokes]);

  const containerClassName = fullscreen
    ? "fixed inset-0 z-[100] flex h-dvh w-dvw flex-col overflow-hidden bg-black text-slate-100"
    : "mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm";

  const canvasWrapperClassName = fullscreen
    ? "flex min-h-0 flex-1 items-stretch justify-stretch overflow-hidden rounded-none border-0 bg-black p-0"
    : "rounded-2xl border border-slate-200 bg-white p-2 shadow-inner";

  const canvasCursorClass =
    tool === "pen"
      ? "cursor-crosshair"
      : tool === "pan"
        ? "cursor-grab active:cursor-grabbing"
        : tool === "select" || tool === "text"
          ? "cursor-pointer"
          : tool === "shape"
            ? "cursor-crosshair"
            : "cursor-cell";

  return (
    <div ref={fullscreenRootRef} className={containerClassName}>
      <button
        type="button"
        onClick={() => {
          if (!fullscreen) setOpen((value) => !value);
        }}
        className={`${hideLauncher ? "hidden" : "flex"} w-full items-center justify-between gap-4 px-5 py-4 text-left transition md:px-6 ${
          fullscreen ? "shrink-0 border-b border-slate-800 bg-slate-950 text-white" : "hover:bg-white/60"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${fullscreen ? "bg-violet-500" : "bg-violet-600"}`}>
            <PenLine className="h-5 w-5" />
          </div>

          <div>
            <p className={`font-black ${fullscreen ? "text-white" : "text-slate-950"}`}>
              {fullscreen ? "Rascunho" : "Rascunho manuscrito"}
            </p>
            <p className={`mt-1 text-sm leading-6 ${fullscreen ? "text-slate-400" : "text-slate-600"}`}>
              {fullscreen ? "Modo tela cheia: escreva em toda a área, como um caderno digital." : "Use presets, atalhos, páginas, texto, imagem, formas perfeitas e borracha em tempo real."}
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
        <div className={`${fullscreen ? "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden bg-black p-0" : "border-t border-violet-100 p-4 md:p-5"}`}>
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

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                importImageFile(file);
              }
              event.currentTarget.value = "";
            }}
          />

          <div className={`${fullscreen ? "mb-0 flex-nowrap overflow-x-auto border-b border-slate-800 bg-slate-950 px-3 py-2 text-slate-100" : "mb-4 flex-wrap rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"} flex shrink-0 items-center gap-2`}>
            <span className="px-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
              Páginas
            </span>

            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => openPage(page.id)}
                className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                  page.id === activePageId
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={page.title}
              >
                {getPageNumberLabel(index)}
              </button>
            ))}

            <button type="button" onClick={addPage} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
              + Nova
            </button>

            <button type="button" onClick={duplicateCurrentPage} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
              Duplicar página
            </button>

            <button type="button" onClick={deleteCurrentPage} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100">
              Excluir página
            </button>
          </div>

          <div className={`${fullscreen ? "mb-0 max-h-36 shrink-0 overflow-y-auto border-b border-slate-800 bg-slate-900 p-2 text-slate-100" : "mb-4 rounded-2xl border border-slate-200 bg-white p-2"} ${notesPanelOpen ? "block" : "hidden"}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="px-2 text-xs font-black uppercase tracking-wide text-slate-400">Meus rascunhos locais</p>
              <button
                type="button"
                onClick={refreshLocalNotesPanel}
                className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Atualizar
              </button>
            </div>

            {localNotes.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">Nenhum backup local encontrado neste navegador.</p>
            ) : (
              <div className="grid max-h-36 gap-2 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
                {localNotes.map((note) => (
                  <div key={note.key} className={`${fullscreen ? "bg-slate-950 ring-slate-800" : "bg-slate-50 ring-slate-200"} rounded-xl p-3 ring-1`}>
                    <p className="truncate text-sm font-black">{note.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {note.pagesCount} página(s) • {formatLocalDate(note.updatedAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        deleteLocalDraftByKey(note.key);
                        refreshLocalNotesPanel();
                      }}
                      className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Remover backup local
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fullscreen ? (
            <div className="shrink-0 border-b border-slate-800 bg-[#202020] text-white">
              <div className="flex h-[50px] items-center gap-2 overflow-x-auto px-3">
                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("tools")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "tools" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Ferramentas"
                >
                  <PenLine className="h-4 w-4" />
                  {getCurrentToolLabel()}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("colors")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "colors" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Cores"
                >
                  <span className="h-5 w-5 rounded-full ring-2 ring-white/60" style={{ backgroundColor: color }} />
                  Cor
                </button>

                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("size")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "size" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Grossura da caneta e borracha"
                >
                  <Minus className="h-4 w-4" />
                  {tool === "areaEraser" || tool === "strokeEraser" ? `Borracha ${eraserSize}` : `Esp. ${size}`}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("shapes")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "shapes" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Formas"
                >
                  {shapeTool === "ellipse" ? <Circle className="h-4 w-4" /> : shapeTool === "triangle" ? <Triangle className="h-4 w-4" /> : shapeTool === "rectangle" ? <Square className="h-4 w-4" /> : shapeTool === "arrow" ? <ArrowRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {getCurrentShapeLabel()}
                </button>

                {selectedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleFullscreenPanel("selection")}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                      fullscreenPanel === "selection" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    }`}
                    title="Ajustar seleção"
                  >
                    <MousePointer2 className="h-4 w-4" />
                    Seleção {selectedIds.length}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("view")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "view" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Zoom e fundo"
                >
                  <Move className="h-4 w-4" />
                  {Math.round(view.zoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => toggleFullscreenPanel("actions")}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${
                    fullscreenPanel === "actions" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                  title="Ações"
                >
                  <Save className="h-4 w-4" />
                  Ações
                </button>

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyDepth === 0}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 text-sm font-bold text-slate-100 transition hover:bg-slate-700 disabled:opacity-40"
                  title="Desfazer"
                >
                  <Undo2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoDepth === 0}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 text-sm font-bold text-slate-100 transition hover:bg-slate-700 disabled:opacity-40"
                  title="Refazer"
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={!canSave || saving}
                  className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-black text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>

                <button
                  type="button"
                  onClick={exitScratchpadFullscreen}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-900 transition hover:bg-white"
                >
                  <Minimize2 className="h-4 w-4" />
                  Sair
                </button>
              </div>

              {fullscreenPanel ? (
                <div className="flex min-h-[44px] items-center gap-2 overflow-x-auto border-t border-slate-700 bg-[#2b2b2b] px-3 py-2">
                  {fullscreenPanel === "tools" ? (
                    <>
                      <button type="button" onClick={() => { activatePen("pen"); setFullscreenPanel("size"); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-500"><PenLine className="h-4 w-4" />Caneta</button>
                      <button type="button" onClick={() => { activatePen("brush"); setFullscreenPanel("size"); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><PenLine className="h-4 w-4" />Pincel</button>
                      <button type="button" onClick={() => { activatePen("highlighter"); setFullscreenPanel("size"); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><PenLine className="h-4 w-4" />Marca-texto</button>
                      <button type="button" onClick={() => { setTool("select"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><MousePointer2 className="h-4 w-4" />Selecionar</button>
                      <button type="button" onClick={() => { setTool("text"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Type className="h-4 w-4" />Texto</button>
                      <button type="button" onClick={() => { setTool("pan"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Move className="h-4 w-4" />Mover</button>
                      <button type="button" onClick={() => { setTool("areaEraser"); setFullscreenPanel("size"); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Eraser className="h-4 w-4" />Borracha</button>
                      <button type="button" onClick={() => { setTool("strokeEraser"); setFullscreenPanel("size"); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Eraser className="h-4 w-4" />Traço inteiro</button>
                    </>
                  ) : null}

                  {fullscreenPanel === "colors" ? (
                    <>
                      {(brush === "highlighter" ? HIGHLIGHTER_COLORS : COLORS).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setColor(item);
                            if (brush !== "highlighter") setTool("pen");
                            setFullscreenPanel(null);
                          }}
                          className={`h-8 w-8 shrink-0 rounded-full border-2 transition ${
                            color === item ? "border-white ring-2 ring-violet-400" : "border-slate-600"
                          }`}
                          style={{ backgroundColor: item }}
                          aria-label={`Cor ${item}`}
                        />
                      ))}
                    </>
                  ) : null}

                  {fullscreenPanel === "size" ? (
                    <>
                      <label className="flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">
                        Espessura
                        <input type="range" min={2} max={18} value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-36 accent-violet-500" />
                        <span className="w-6 text-right">{size}</span>
                      </label>

                      <label className="flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">
                        Borracha
                        <input type="range" min={8} max={70} value={eraserSize} onChange={(event) => setEraserSize(Number(event.target.value))} className="w-36 accent-violet-500" />
                        <span className="w-7 text-right">{eraserSize}</span>
                      </label>
                    </>
                  ) : null}

                  {fullscreenPanel === "shapes" ? (
                    <>
                      <button type="button" onClick={() => { activateShape("line"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Minus className="h-4 w-4" />Reta</button>
                      <button type="button" onClick={() => { activateShape("arrow"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><ArrowRight className="h-4 w-4" />Seta</button>
                      <button type="button" onClick={() => { activateShape("rectangle"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Square className="h-4 w-4" />Retângulo</button>
                      <button type="button" onClick={() => { activateShape("ellipse"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Circle className="h-4 w-4" />Círculo</button>
                      <button type="button" onClick={() => { activateShape("triangle"); setFullscreenPanel(null); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700"><Triangle className="h-4 w-4" />Triângulo</button>
                    </>
                  ) : null}

                  {fullscreenPanel === "selection" ? (
                    <>
                      {selectedIds.length === 1 && strokes.find((stroke) => stroke.id === selectedIds[0])?.tool === "text" ? (
                        <button type="button" onClick={editSelectedText} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Editar texto</button>
                      ) : null}
                      <button type="button" onClick={() => scaleSelection(1.15)} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Aumentar</button>
                      <button type="button" onClick={() => scaleSelection(0.87)} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Diminuir</button>
                      <label className="flex shrink-0 items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">
                        Grossura
                        <input type="range" min={1} max={40} value={selectedAverageSize} onChange={(event) => setSelectionThickness(Number(event.target.value))} className="w-28 accent-violet-500" />
                        <span className="w-6 text-right">{selectedAverageSize}</span>
                      </label>
                      <button type="button" onClick={straightenSelection} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Endireitar</button>
                      <button type="button" onClick={autoPerfectSelection} className="shrink-0 rounded-full bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-500">Forma perfeita</button>
                      <button type="button" onClick={() => transformSelectionToPerfectShape("line")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Reta</button>
                      <button type="button" onClick={() => transformSelectionToPerfectShape("arrow")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Seta</button>
                      <button type="button" onClick={() => transformSelectionToPerfectShape("rectangle")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Retângulo</button>
                      <button type="button" onClick={() => transformSelectionToPerfectShape("ellipse")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Círculo</button>
                      <button type="button" onClick={() => transformSelectionToPerfectShape("triangle")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Triângulo</button>
                      <button type="button" onClick={() => rotateSelectionBy(-Math.PI / 18)} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Girar -</button>
                      <button type="button" onClick={() => rotateSelectionBy(Math.PI / 18)} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Girar +</button>
                      <button type="button" onClick={duplicateSelection} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Duplicar</button>
                      <button type="button" onClick={deleteSelection} className="shrink-0 rounded-full bg-red-950 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-900">Excluir</button>
                      <button type="button" onClick={() => { setSelectedIds([]); setFullscreenPanel(null); }} className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900 hover:bg-white">Tirar seleção</button>
                    </>
                  ) : null}

                  {fullscreenPanel === "view" ? (
                    <>
                      <select value={backgroundType} onChange={(event) => handleBackgroundChange(event.target.value as ScratchpadBackground)} className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-100">
                        {BACKGROUNDS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>

                      <button type="button" onClick={() => handleZoomButton("out")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Zoom -</button>
                      <button type="button" onClick={() => handleZoomButton("in")} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Zoom +</button>
                      <button type="button" onClick={resetZoom} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">100%</button>
                      <span className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">{getBackgroundLabel()}</span>
                    </>
                  ) : null}

                  {fullscreenPanel === "actions" ? (
                    <>
                      <button type="button" onClick={exportAsPng} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">PNG</button>
                      <button type="button" onClick={exportAsPdf} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">PDF</button>
                      <button type="button" onClick={() => imageInputRef.current?.click()} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Imagem</button>
                      <button type="button" onClick={handleClear} disabled={strokes.length === 0} className="shrink-0 rounded-full bg-red-950 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-900 disabled:opacity-40">Limpar</button>
                      <button type="button" onClick={() => { refreshLocalNotesPanel(); setNotesPanelOpen((value) => !value); }} className="shrink-0 rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-700">Meus rascunhos</button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={fullscreen ? "hidden" : "mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"}>
            <ToolbarGroup label="Favoritos">
              {PEN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPenPreset(preset)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    (preset.tool === tool && (!preset.brush || preset.brush === brush))
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={`Atalho rápido: ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </ToolbarGroup>

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
              <button type="button" onClick={() => setTool("text")} className={toolButtonClass(tool === "text")}> 
                <Type className="h-4 w-4" /> Texto
              </button>
              <button type="button" onClick={() => setTool("pan")} className={toolButtonClass(tool === "pan")}> 
                <Move className="h-4 w-4" /> Mover
              </button>
              <button type="button" onClick={() => setTool("areaEraser")} className={toolButtonClass(tool === "areaEraser")}> 
                <Eraser className="h-4 w-4" /> Borracha
              </button>
              <button type="button" onClick={() => setTool("strokeEraser")} className={toolButtonClass(tool === "strokeEraser")}> 
                <Eraser className="h-4 w-4" /> Traço inteiro
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
              <button type="button" onClick={() => activateShape("triangle")} className={toolButtonClass(tool === "shape" && shapeTool === "triangle")}> 
                <Triangle className="h-4 w-4" /> Triângulo
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
              <button type="button" onClick={toggleScratchpadFullscreen} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? "Sair" : "Tela cheia"}
              </button>
              <button type="button" onClick={exportAsPng} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <Download className="h-4 w-4" /> PNG
              </button>
              <button type="button" onClick={exportAsPdf} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <FileText className="h-4 w-4" /> PDF
              </button>
              <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <ImagePlus className="h-4 w-4" /> Imagem
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
              <button type="button" onClick={() => { refreshLocalNotesPanel(); setNotesPanelOpen((value) => !value); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                <FileText className="h-4 w-4" /> Meus rascunhos
              </button>
              <button type="button" onClick={() => handleSave()} disabled={!canSave || saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </ToolbarGroup>
          </div>

          {selectedIds.length > 0 && !fullscreen ? (
            <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm">
              <span className="font-black text-violet-900">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              {selectedIds.length === 1 && strokes.find((stroke) => stroke.id === selectedIds[0])?.tool === "text" ? (
                <button type="button" onClick={editSelectedText} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                  Editar texto
                </button>
              ) : null}
              <button type="button" onClick={() => scaleSelection(1.15)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Aumentar tamanho
              </button>
              <button type="button" onClick={() => scaleSelection(0.87)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Diminuir tamanho
              </button>
              <button type="button" onClick={() => adjustSelectionThickness(0.85)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Afinar linha
              </button>
              <button type="button" onClick={() => adjustSelectionThickness(1.18)} className="rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                Engrossar linha
              </button>
              <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200">
                Grossura
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={selectedAverageSize}
                  onChange={(event) => setSelectionThickness(Number(event.target.value))}
                  className="w-24 accent-violet-600"
                />
                <span className="w-6 text-right text-xs text-violet-500">{selectedAverageSize}</span>
              </label>
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
              <button type="button" onClick={() => transformSelectionToPerfectShape("triangle")} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <Triangle className="h-4 w-4" /> Triângulo
              </button>
              <button type="button" onClick={() => rotateSelectionBy(-Math.PI / 18)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <RotateCw className="h-4 w-4 -scale-x-100" /> Girar -
              </button>
              <button type="button" onClick={() => rotateSelectionBy(Math.PI / 18)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                <RotateCw className="h-4 w-4" /> Girar +
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
                onPointerLeave={handlePointerCancel}
                onWheel={handleWheel}
                onDoubleClick={handleCanvasDoubleClick}
                className={`${fullscreen ? "block h-full w-full rounded-none bg-white" : "block w-full rounded-xl bg-white"} ${canvasCursorClass}`}
                style={{
                  aspectRatio: fullscreen ? undefined : `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  touchAction: "none",
                }}
              />
            )}
          </div>

          <div className={fullscreen ? "hidden" : "mt-3 flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between"}>
            <p>
              Atalhos: P caneta, B pincel, H marca-texto, E borracha, S selecionar, M mover, T texto, L reta, A seta, Ctrl+S salvar. A borracha apaga em tempo real e “Forma perfeita” agora distingue melhor círculo e retângulo.
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
