import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Loader2,
  PenLine,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  getQuestionNote,
  saveQuestionNote,
  type ScratchpadPoint,
  type ScratchpadStroke,
} from "@/services/question-notes.service";

type QuestionScratchpadProps = {
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

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

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;

  const smallStep = 25;

  for (let x = 0; x <= CANVAS_WIDTH; x += smallStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_HEIGHT; y += smallStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.4;

  const bigStep = 100;

  for (let x = 0; x <= CANVAS_WIDTH; x += bigStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_HEIGHT; y += bigStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: ScratchpadStroke) {
  if (stroke.points.length === 0) return;

  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.tool === "eraser" ? stroke.size * 4 : stroke.size;
  ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;

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

export function QuestionScratchpad({
  userId,
  questionId,
  questionCode,
}: QuestionScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<ScratchpadStroke | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(4);
  const [strokes, setStrokes] = useState<ScratchpadStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const canSave = Boolean(userId && questionId);

  const title = useMemo(() => {
    return questionCode ? `Rascunho da questão ${questionCode}` : "Rascunho da questão";
  }, [questionCode]);

  const redrawCanvas = useCallback(
    (extraStroke?: ScratchpadStroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawGrid(ctx);

      for (const stroke of strokes) {
        drawStroke(ctx, stroke);
      }

      if (extraStroke) {
        drawStroke(ctx, extraStroke);
      }
    },
    [strokes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    redrawCanvas();
  }, [open, redrawCanvas]);

  useEffect(() => {
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
        setLoaded(true);
        return;
      }

      try {
        const note = await getQuestionNote({ userId, questionId });

        if (cancelled) return;

        setStrokes(Array.isArray(note?.strokes) ? note.strokes : []);
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

        setStatus("Rascunho salvo.");
      } catch (saveError) {
        console.error("Erro ao salvar rascunho:", saveError);
        setError("Não foi possível salvar o rascunho.");
      } finally {
        setSaving(false);
      }
    },
    [canSave, questionId, strokes, title, userId]
  );

  useEffect(() => {
    if (!loaded || !canSave) return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      handleSave(strokes);
    }, 1800);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [strokes, loaded, canSave, handleSave]);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): ScratchpadPoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: event.pressure };

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
      pressure: event.pressure,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);

    const point = getCanvasPoint(event);

    const stroke: ScratchpadStroke = {
      id: createStrokeId(),
      tool,
      color,
      size,
      points: [point],
    };

    currentStrokeRef.current = stroke;
    setIsDrawing(true);
    setStatus("");

    redrawCanvas(stroke);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentStrokeRef.current) return;

    event.preventDefault();

    const point = getCanvasPoint(event);

    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, point],
    };

    redrawCanvas(currentStrokeRef.current);
  }

  function finishStroke(event?: React.PointerEvent<HTMLCanvasElement>) {
    if (event) {
      event.preventDefault();
    }

    if (!currentStrokeRef.current) {
      setIsDrawing(false);
      return;
    }

    const finishedStroke = currentStrokeRef.current;

    currentStrokeRef.current = null;
    setIsDrawing(false);

    setStrokes((previous) => [...previous, finishedStroke]);
  }

  function handleUndo() {
    setStatus("");
    setStrokes((previous) => previous.slice(0, -1));
  }

  function handleClear() {
    const shouldClear = window.confirm("Limpar todo o rascunho desta questão?");

    if (!shouldClear) return;

    setStatus("");
    setStrokes([]);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/60 md:px-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
            <PenLine className="h-5 w-5" />
          </div>

          <div>
            <p className="font-black text-slate-950">Rascunho manuscrito</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Abra uma área para resolver a questão com mouse, dedo, caneta do tablet ou mesa digitalizadora.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {saving ? (
            <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 md:inline-flex">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              salvando
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
        <div className="border-t border-violet-100 p-4 md:p-5">
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
              onClick={() => setTool("pen")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "pen"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PenLine className="h-4 w-4" />
              Caneta
            </button>

            <button
              type="button"
              onClick={() => setTool("eraser")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tool === "eraser"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Borracha
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
                max={14}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="w-28 accent-violet-600"
              />
              <span className="w-6 text-right text-xs text-slate-500">{size}</span>
            </label>

            <div className="ml-auto flex flex-wrap gap-2">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-inner">
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
                onPointerCancel={finishStroke}
                onPointerLeave={() => {
                  if (isDrawing) {
                    finishStroke();
                  }
                }}
                className="block w-full cursor-crosshair rounded-xl bg-white"
                style={{
                  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                  touchAction: "none",
                }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              Dica: use caneta, dedo ou mesa digitalizadora. A área salva automaticamente depois de alguns segundos.
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
