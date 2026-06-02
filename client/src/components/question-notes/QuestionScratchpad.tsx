import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Loader2,
  Maximize2,
  Minimize2,
  Move,
  PenLine,
  Redo2,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getQuestionNote,
  saveQuestionNote,
  type ScratchpadBrush,
  type ScratchpadPoint,
  type ScratchpadStroke,
} from "@/services/question-notes.service";

type QuestionScratchpadProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
};

type ScratchpadTool = "pen" | "areaEraser" | "strokeEraser" | "pan";

type CanvasView = {
  zoom: number;
  offsetX: number;
  offsetY: number;
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

type PanState = {
  pointerId: number;
  startRaw: { x: number; y: number };
  startView: CanvasView;
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
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.25;
const PAN_MARGIN = 90;
const PALM_REJECTION_MS = 900;

const COLORS = [
  "#0f172a",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#f59e0b",
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

function isStrokeTouchedByPath(
  stroke: ScratchpadStroke,
  path: ScratchpadPoint[],
  radius: number
) {
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
  return strokes.filter((stroke) => {
    if (stroke.tool !== "pen") return true;
    return !isStrokeTouchedByPath(stroke, path, radius);
  });
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

  return clamp(stroke.size * (0.45 + pressure * 0.85), 0.7, stroke.size * 1.35);
}

function getPointWidth(point: ScratchpadPoint, stroke: ScratchpadStroke) {
  if (typeof point.width === "number" && Number.isFinite(point.width)) {
    return clamp(point.width, 0.6, stroke.size * 2.2);
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

  return distance(previousPoint, nextPoint) >= 0.75;
}

function drawGridLines(ctx: CanvasRenderingContext2D, view: CanvasView) {
  ctx.save();

  const left = -view.offsetX / view.zoom;
  const top = -view.offsetY / view.zoom;
  const right = (CANVAS_WIDTH - view.offsetX) / view.zoom;
  const bottom = (CANVAS_HEIGHT - view.offsetY) / view.zoom;

  const drawLines = (step: number, strokeStyle: string, lineWidth: number) => {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth / view.zoom;

    const startX = Math.floor(left / step) * step;
    const endX = Math.ceil(right / step) * step;
    const startY = Math.floor(top / step) * step;
    const endY = Math.ceil(bottom / step) * step;

    for (let x = startX; x <= endX; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += step) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }
  };

  drawLines(25, "#e2e8f0", 1);
  drawLines(100, "#cbd5e1", 1.4);

  ctx.restore();
}

function drawPaper(
  ctx: CanvasRenderingContext2D,
  view: CanvasView,
  pixelRatio = 1
) {
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.zoom, view.zoom);
  drawGridLines(ctx, view);

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
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;

  if (stroke.brush === "brush") {
    ctx.globalAlpha = 0.98;
  }

  if (stroke.points.length === 1) {
    drawRoundDot(ctx, firstPoint, getPointWidth(firstPoint, stroke) / 2, stroke.color);
    ctx.restore();
    return;
  }

  for (let i = 1; i < stroke.points.length; i += 1) {
    const previousPrevious = stroke.points[i - 2];
    const previous = stroke.points[i - 1];
    const current = stroke.points[i];

    const startPoint = previousPrevious
      ? midpoint(previousPrevious, previous)
      : previous;

    const endPoint = i === stroke.points.length - 1
      ? current
      : midpoint(previous, current);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.quadraticCurveTo(previous.x, previous.y, endPoint.x, endPoint.y);
    ctx.lineWidth = (getPointWidth(previous, stroke) + getPointWidth(current, stroke)) / 2;
    ctx.stroke();
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

function getTwoTouchPointers(activePointers: Map<number, PointerSnapshot>) {
  return Array.from(activePointers.values())
    .filter((pointer) => pointer.pointerType === "touch")
    .slice(0, 2);
}

export function QuestionScratchpad({
  userId,
  questionId,
  questionCode,
}: QuestionScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<ScratchpadStroke | null>(null);
  const eraserPathRef = useRef<ScratchpadPoint[]>([]);
  const strokesRef = useRef<ScratchpadStroke[]>([]);
  const dirtyRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointersRef = useRef<Map<number, PointerSnapshot>>(new Map());
  const panStateRef = useRef<PanState | null>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const lastPenInteractionAtRef = useRef(0);
  const viewRef = useRef<CanvasView>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<ScratchpadTool>("pen");
  const [brush, setBrush] = useState<ScratchpadBrush>("pen");
  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(24);
  const [strokes, setStrokes] = useState<ScratchpadStroke[]>([]);
  const [redoStack, setRedoStack] = useState<ScratchpadStroke[]>([]);
  const [dirty, setDirty] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<CanvasView>(viewRef.current);

  const canSave = Boolean(userId && questionId);

  const title = useMemo(() => {
    return questionCode ? `Rascunho da questão ${questionCode}` : "Rascunho da questão";
  }, [questionCode]);

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
    (extraStroke?: ScratchpadStroke | null, eraserPreview?: EraserPreview | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pixelRatio = ensureCanvasBitmap(canvas);

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      drawPaper(ctx, viewRef.current, pixelRatio);

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

      for (const stroke of strokes) {
        drawStroke(inkCtx, stroke);
      }

      if (extraStroke) {
        drawStroke(inkCtx, extraStroke);
      }

      if (eraserPreview) {
        drawEraserPreview(inkCtx, eraserPreview);
      }

      inkCtx.restore();

      ctx.drawImage(inkLayer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },
    [strokes]
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
    let cancelled = false;

    async function loadNote() {
      setLoaded(false);
      setStatus("");
      setError("");

      if (!userId || !questionId) {
        setStrokes([]);
        setRedoStack([]);
        dirtyRef.current = false;
        setDirty(false);
        setLoaded(true);
        return;
      }

      try {
        const note = await getQuestionNote({ userId, questionId });

        if (cancelled) return;

        setStrokes(Array.isArray(note?.strokes) ? note.strokes : []);
        setRedoStack([]);
        dirtyRef.current = false;
        setDirty(false);
      } catch (loadError) {
        console.error("Erro ao carregar rascunho:", loadError);

        if (!cancelled) {
          setError("Não foi possível carregar o rascunho desta questão.");
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
  }, [userId, questionId]);

  const handleSave = useCallback(
    async (nextStrokes = strokes) => {
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
          backgroundType: "grid",
          title,
        });

        dirtyRef.current = false;
        setDirty(false);
        setStatus("Rascunho salvo.");
      } catch (saveError) {
        const readableMessage = getReadableErrorMessage(saveError);
        console.error("Erro ao salvar rascunho:", saveError);
        setError(`Não foi possível salvar o rascunho. Detalhe: ${readableMessage}`);
      } finally {
        setSaving(false);
      }
    },
    [canSave, questionId, strokes, title, userId]
  );

  function markDirty() {
    dirtyRef.current = true;
    setDirty(true);
    setStatus("Alterações não salvas.");
    setError("");
  }

  useEffect(() => {
    return () => {
      if (!dirtyRef.current || !canSave || !userId) return;

      void saveQuestionNote({
        userId,
        questionId,
        strokes: strokesRef.current,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundType: "grid",
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
    eraserPathRef.current = [];
    panStateRef.current = null;
    activePointerIdRef.current = null;
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
      setRedoStack([]);
      markDirty();
      setStrokes((previous) => eraseStrokesByArea(previous, path, eraserSize));
      return;
    }

    if (tool === "strokeEraser") {
      setRedoStack([]);
      markDirty();
      setStrokes((previous) => eraseWholeStrokes(previous, path, eraserSize));
    }
  }

  function appendPointsToCurrentStroke(points: ScratchpadPoint[]) {
    if (!currentStrokeRef.current) return;

    const nextPoints = [...currentStrokeRef.current.points];

    for (const rawPoint of points) {
      const previousPoint = nextPoints[nextPoints.length - 1];

      if (!shouldAppendPoint(previousPoint, rawPoint)) {
        continue;
      }

      const smoothing = (currentStrokeRef.current.brush ?? "pen") === "brush" ? 0.16 : 0.2;
      const smoothedPoint = previousPoint
        ? {
            ...rawPoint,
            x: previousPoint.x * smoothing + rawPoint.x * (1 - smoothing),
            y: previousPoint.y * smoothing + rawPoint.y * (1 - smoothing),
          }
        : rawPoint;

      const pointWithWidth = {
        ...smoothedPoint,
        width: calculatePointWidth({
          point: smoothedPoint,
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

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Alguns navegadores reclamam quando o ponteiro já foi solto. Drama de API web.
    }

    const point = getCanvasPointFromNative(event.nativeEvent, event.pointerType);
    const rawPoint = getRawCanvasPoint(event.clientX, event.clientY);

    activePointerIdRef.current = event.pointerId;
    setIsDrawing(true);
    setStatus("");

    if (tool === "pan") {
      panStateRef.current = {
        pointerId: event.pointerId,
        startRaw: rawPoint,
        startView: viewRef.current,
      };
      return;
    }

    if (tool === "pen") {
      const pointWithWidth = {
        ...point,
        width: calculatePointWidth({
          point,
          size,
          brush,
        }),
      };

      const stroke: ScratchpadStroke = {
        id: createStrokeId(),
        tool: "pen",
        color,
        size,
        brush,
        points: [pointWithWidth],
      };

      currentStrokeRef.current = stroke;
      redrawCanvas(stroke);
      return;
    }

    currentStrokeRef.current = null;
    eraserPathRef.current = [point];
    applyEraser(eraserPathRef.current);
    redrawCanvas(null, { point, radius: eraserSize });
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

    if (panStateRef.current && event.pointerId === panStateRef.current.pointerId) {
      event.preventDefault();

      const rawPoint = getRawCanvasPoint(event.clientX, event.clientY);
      const panState = panStateRef.current;

      updateView({
        zoom: panState.startView.zoom,
        offsetX: panState.startView.offsetX + rawPoint.x - panState.startRaw.x,
        offsetY: panState.startView.offsetY + rawPoint.y - panState.startRaw.y,
      });
      return;
    }

    if (!isDrawing || event.pointerId !== activePointerIdRef.current) return;

    event.preventDefault();

    const points = getCanvasPointsFromEvent(event);

    if (tool === "pen" && currentStrokeRef.current) {
      appendPointsToCurrentStroke(points);
      redrawCanvas(currentStrokeRef.current);
      return;
    }

    if (tool === "areaEraser" || tool === "strokeEraser") {
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

    if (panStateRef.current && (!event || event.pointerId === panStateRef.current.pointerId)) {
      panStateRef.current = null;
      activePointerIdRef.current = null;
      setIsDrawing(false);
      return;
    }

    if (currentStrokeRef.current) {
      const finishedStroke = currentStrokeRef.current;

      currentStrokeRef.current = null;
      activePointerIdRef.current = null;
      setIsDrawing(false);
      setRedoStack([]);
      markDirty();
      setStrokes((previous) => [...previous, finishedStroke]);
      return;
    }

    eraserPathRef.current = [];
    activePointerIdRef.current = null;
    setIsDrawing(false);
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    removeActivePointer(event);

    if (event.pointerId === activePointerIdRef.current) {
      currentStrokeRef.current = null;
      eraserPathRef.current = [];
      panStateRef.current = null;
      activePointerIdRef.current = null;
      setIsDrawing(false);
      redrawCanvas();
    }

    if (getTwoTouchPointers(activePointersRef.current).length < 2) {
      gestureRef.current = null;
    }
  }

  function handleUndo() {
    if (strokes.length === 0) return;

    const removedStroke = strokes[strokes.length - 1];

    setStatus("");
    setRedoStack((previous) => [...previous, removedStroke]);
    setStrokes((previous) => previous.slice(0, -1));
    markDirty();
  }

  function handleRedo() {
    if (redoStack.length === 0) return;

    const restoredStroke = redoStack[redoStack.length - 1];

    setStatus("");
    setRedoStack((previous) => previous.slice(0, -1));
    setStrokes((previous) => [...previous, restoredStroke]);
    markDirty();
  }

  function handleClear() {
    const shouldClear = window.confirm("Limpar todo o rascunho desta questão?");

    if (!shouldClear) return;

    setStatus("");
    setRedoStack([]);
    markDirty();
    setStrokes([]);
  }

  function activatePen(nextBrush: ScratchpadBrush) {
    setTool("pen");
    setBrush(nextBrush);
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

  const containerClassName = fullscreen
    ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-white p-3 md:p-5"
    : "mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm";

  const canvasWrapperClassName = fullscreen
    ? "flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-inner"
    : "rounded-2xl border border-slate-200 bg-white p-2 shadow-inner";

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
              Escreva com mouse, dedo, caneta do tablet ou mesa digitalizadora. Use dois dedos ou o modo Mover para navegar.
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

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => activatePen("pen")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "pen" && brush === "pen"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PenLine className="h-4 w-4" />
              Caneta
            </button>

            <button
              type="button"
              onClick={() => activatePen("brush")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "pen" && brush === "brush"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PenLine className="h-4 w-4" />
              Pincel
            </button>

            <button
              type="button"
              onClick={() => setTool("areaEraser")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "areaEraser"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Borracha livre
            </button>

            <button
              type="button"
              onClick={() => setTool("strokeEraser")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "strokeEraser"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Apagar traço
            </button>

            <button
              type="button"
              onClick={() => setTool("pan")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "pan"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Move className="h-4 w-4" />
              Mover
            </button>

            <div className="mx-1 h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setColor(item);
                    setTool("pen");
                  }}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === item && tool === "pen"
                      ? "border-violet-600 ring-2 ring-violet-200"
                      : "border-white ring-1 ring-slate-200"
                  }`}
                  style={{ backgroundColor: item }}
                  aria-label={`Cor ${item}`}
                />
              ))}
            </div>

            <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              Espessura
              <input
                type="range"
                min={2}
                max={18}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="w-28 accent-violet-600"
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
                className="w-28 accent-violet-600"
              />
              <span className="w-7 text-right text-xs text-slate-500">{eraserSize}</span>
            </label>

            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleZoomButton("out")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <ZoomOut className="h-4 w-4" />
                Zoom
              </button>

              <button
                type="button"
                onClick={() => handleZoomButton("in")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <ZoomIn className="h-4 w-4" />
                {Math.round(view.zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={resetZoom}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <Move className="h-4 w-4" />
                100%
              </button>

              <button
                type="button"
                onClick={() => setFullscreen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {fullscreen ? "Sair" : "Tela cheia"}
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" />
                Desfazer
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Redo2 className="h-4 w-4" />
                Refazer
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={!canSave || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar
              </button>
            </div>
          </div>

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
                className={`block w-full rounded-xl bg-white ${
                  tool === "pen"
                    ? "cursor-crosshair"
                    : tool === "pan"
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-cell"
                } ${fullscreen ? "max-h-full flex-1 object-contain" : ""}`}
                style={{
                  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  touchAction: "none",
                }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              Caneta e pincel usam renderização em alta resolução e suavização extra. Dois dedos movem/dão zoom no touch; no notebook, use o botão Mover. O rascunho só salva no botão Salvar ou ao sair/trocar de questão.
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
