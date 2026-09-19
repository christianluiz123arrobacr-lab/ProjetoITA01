import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Grid3X3,
  LocateFixed,
  LockKeyhole,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  UnlockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  compileFunctionExpression,
  createDefaultGraphViewport,
  DEFAULT_FUNCTION_SIMULATOR_FUNCTIONS,
  parseFunctionSimulatorStorage,
  safeEvaluate,
  shouldBreakCurve,
  type CompiledFunction,
  type FunctionSimulatorStoredState,
  type GraphViewport,
} from "@/lib/functionExpressionParser";

const STORAGE_KEY = "projeto-vetor:function-simulator:v1";
const COLORS = ["#2563eb", "#dc2626", "#059669", "#9333ea", "#ea580c"];
const COLOR_NAMES = ["azul", "vermelho", "verde", "roxo", "laranja"];
const FUNCTION_NAMES = ["f", "g", "h", "p", "q"];
const EXAMPLES = {
  Básicas: ["x", "2x + 3", "x^2", "x^3"],
  Transformações: ["(x - 2)^2 + 1", "abs(x)", "sqrt(x)"],
  Racionais: ["1/x", "(x + 1)/(x - 2)"],
  "Exponenciais e logarítmicas": ["2^x", "(1/2)^x", "log(x)", "ln(x)"],
  Trigonométricas: ["sen(x)", "cos(x)", "tan(x)", "2sen(x)"],
} as const;

type FunctionRow = { expression: string; color: string; visible: boolean };
type View = GraphViewport;

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "não definida";
  if (Math.abs(value) < 1e-10) return "0";
  const rounded = Number(value.toPrecision(6));
  return Math.abs(rounded) >= 1e6 ? rounded.toExponential(3) : String(rounded);
}

function niceStep(scale: number) {
  const target = 80 / scale;
  const power = 10 ** Math.floor(Math.log10(target));
  const ratio = target / power;
  return (ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * power;
}

function loadInitialState(): FunctionSimulatorStoredState {
  if (typeof window === "undefined") return parseFunctionSimulatorStorage(null);
  try {
    return parseFunctionSimulatorStorage(
      window.localStorage.getItem(STORAGE_KEY)
    );
  } catch {
    return parseFunctionSimulatorStorage(null);
  }
}

export function FunctionSimulator() {
  const initial = useMemo(loadInitialState, []);
  const [functions, setFunctions] = useState<FunctionRow[]>(initial.functions);
  const [view, setView] = useState<View>(initial.view);
  const [showGrid, setShowGrid] = useState(initial.showGrid);
  const [equalScale, setEqualScale] = useState(initial.equalScale);
  const [selectedIndex, setSelectedIndex] = useState(initial.selectedIndex);
  const [trackerX, setTrackerX] = useState(0);
  const [notice, setNotice] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 520 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const dragRef = useRef<{
    x: number;
    y: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const touchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    distance: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);
  const trackerFrame = useRef<number | undefined>(undefined);

  const parsed = useMemo(
    () =>
      functions.map(item => {
        if (!item.expression.trim())
          return { compiled: null, error: "Expressão incompleta." };
        try {
          return {
            compiled: compileFunctionExpression(item.expression),
            error: "",
          };
        } catch (error) {
          return {
            compiled: null,
            error:
              error instanceof Error ? error.message : "Expressão inválida.",
          };
        }
      }),
    [functions]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          functions,
          view,
          showGrid,
          equalScale,
          selectedIndex,
        } satisfies FunctionSimulatorStoredState)
      );
    } catch (error) {
      console.warn(
        "Não foi possível salvar o estado local do simulador.",
        error
      );
    }
  }, [functions, view, showGrid, equalScale, selectedIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;
    const observer = new ResizeObserver(entries => {
      if (!mounted) return;
      const rect = entries[0]?.contentRect;
      if (rect)
        setCanvasSize({
          width: Math.max(280, rect.width),
          height: Math.max(380, rect.height),
        });
    });
    observer.observe(canvas);
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvasSize.width;
    const height = canvasSize.height;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    const toScreenX = (x: number) =>
      width / 2 + (x - view.centerX) * view.scaleX;
    const toScreenY = (y: number) =>
      height / 2 - (y - view.centerY) * view.scaleY;
    const minX = view.centerX - width / (2 * view.scaleX);
    const maxX = view.centerX + width / (2 * view.scaleX);
    const minY = view.centerY - height / (2 * view.scaleY);
    const maxY = view.centerY + height / (2 * view.scaleY);
    const stepX = niceStep(view.scaleX);
    const stepY = niceStep(view.scaleY);
    context.font = "12px system-ui";
    context.lineWidth = 1;
    if (showGrid) {
      context.strokeStyle = "#e2e8f0";
      context.fillStyle = "#64748b";
      for (
        let x = Math.ceil(minX / stepX) * stepX, count = 0;
        x <= maxX && count < 30;
        x += stepX, count++
      ) {
        const sx = Math.round(toScreenX(x)) + 0.5;
        context.beginPath();
        context.moveTo(sx, 0);
        context.lineTo(sx, height);
        context.stroke();
        if (
          Math.abs(x) > stepX / 100 &&
          toScreenY(0) > 15 &&
          toScreenY(0) < height - 5
        )
          context.fillText(
            formatNumber(x),
            sx + 3,
            Math.min(height - 5, Math.max(14, toScreenY(0) + 15))
          );
      }
      for (
        let y = Math.ceil(minY / stepY) * stepY, count = 0;
        y <= maxY && count < 30;
        y += stepY, count++
      ) {
        const sy = Math.round(toScreenY(y)) + 0.5;
        context.beginPath();
        context.moveTo(0, sy);
        context.lineTo(width, sy);
        context.stroke();
        if (
          Math.abs(y) > stepY / 100 &&
          toScreenX(0) > 5 &&
          toScreenX(0) < width - 30
        )
          context.fillText(
            formatNumber(y),
            Math.min(width - 35, Math.max(5, toScreenX(0) + 5)),
            sy - 4
          );
      }
    }
    context.strokeStyle = "#334155";
    context.fillStyle = "#334155";
    context.lineWidth = 1.5;
    const axisX = toScreenX(0);
    const axisY = toScreenY(0);
    if (axisY >= 0 && axisY <= height) {
      context.beginPath();
      context.moveTo(0, axisY);
      context.lineTo(width, axisY);
      context.stroke();
      context.beginPath();
      context.moveTo(width - 9, axisY - 5);
      context.lineTo(width, axisY);
      context.lineTo(width - 9, axisY + 5);
      context.fill();
      context.fillText("x", width - 18, axisY - 8);
    }
    if (axisX >= 0 && axisX <= width) {
      context.beginPath();
      context.moveTo(axisX, height);
      context.lineTo(axisX, 0);
      context.stroke();
      context.beginPath();
      context.moveTo(axisX - 5, 9);
      context.lineTo(axisX, 0);
      context.lineTo(axisX + 5, 9);
      context.fill();
      context.fillText("y", axisX + 8, 14);
    }

    parsed.forEach((entry, index) => {
      if (!functions[index].visible || !entry.compiled) return;
      context.strokeStyle = functions[index].color;
      context.lineWidth = 2.5;
      context.lineJoin = "round";
      context.beginPath();
      let previous: { x: number; y: number } | null = null;
      const samples = Math.min(1400, Math.max(320, Math.ceil(width * 1.25)));
      for (let sample = 0; sample <= samples; sample++) {
        const screenX = (sample * width) / samples;
        const x = minX + (sample / samples) * (maxX - minX);
        const y = safeEvaluate(entry.compiled, x);
        const current = y === null ? null : { x, y };
        if (!current) {
          previous = null;
          continue;
        }
        const sy = toScreenY(current.y);
        if (sy < -height * 4 || sy > height * 5) {
          previous = null;
          continue;
        }
        if (!previous || shouldBreakCurve(previous, current, maxY - minY))
          context.moveTo(screenX, sy);
        else context.lineTo(screenX, sy);
        previous = current;
      }
      context.stroke();
      const tracked = safeEvaluate(entry.compiled, trackerX);
      if (tracked !== null) {
        const sx = toScreenX(trackerX);
        const sy = toScreenY(tracked);
        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          context.fillStyle = functions[index].color;
          context.beginPath();
          context.arc(sx, sy, 4.5, 0, Math.PI * 2);
          context.fill();
        }
      }
    });
    const trackerScreen = toScreenX(trackerX);
    if (trackerScreen >= 0 && trackerScreen <= width) {
      context.strokeStyle = "#0f172a55";
      context.lineWidth = 1;
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(trackerScreen, 0);
      context.lineTo(trackerScreen, height);
      context.stroke();
      context.setLineDash([]);
    }
  }, [canvasSize, functions, parsed, showGrid, trackerX, view]);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  const zoom = useCallback(
    (
      factor: number,
      anchorX = canvasSize.width / 2,
      anchorY = canvasSize.height / 2
    ) => {
      setView(current => {
        const nextX = Math.min(500, Math.max(8, current.scaleX * factor));
        const nextY = Math.min(500, Math.max(8, current.scaleY * factor));
        const worldX =
          current.centerX + (anchorX - canvasSize.width / 2) / current.scaleX;
        const worldY =
          current.centerY - (anchorY - canvasSize.height / 2) / current.scaleY;
        return {
          centerX: worldX - (anchorX - canvasSize.width / 2) / nextX,
          centerY: worldY + (anchorY - canvasSize.height / 2) / nextY,
          scaleX: nextX,
          scaleY: equalScale ? nextX : nextY,
        };
      });
    },
    [canvasSize, equalScale]
  );

  const updateTracker = (clientX: number) => {
    if (trackerFrame.current) return;
    trackerFrame.current = requestAnimationFrame(() => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect)
        setTrackerX(
          view.centerX + (clientX - rect.left - rect.width / 2) / view.scaleX
        );
      trackerFrame.current = undefined;
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    touchRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (touchRef.current.size === 1)
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        centerX: view.centerX,
        centerY: view.centerY,
      };
    if (touchRef.current.size === 2) {
      const points = Array.from(touchRef.current.values());
      pinchRef.current = {
        distance: Math.hypot(
          points[1].x - points[0].x,
          points[1].y - points[0].y
        ),
        scaleX: view.scaleX,
        scaleY: view.scaleY,
      };
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateTracker(event.clientX);
    if (!touchRef.current.has(event.pointerId)) return;
    touchRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const pinch = pinchRef.current;
    if (touchRef.current.size === 2 && pinch) {
      const points = Array.from(touchRef.current.values());
      const distance = Math.hypot(
        points[1].x - points[0].x,
        points[1].y - points[0].y
      );
      const factor = distance / Math.max(1, pinch.distance);
      setView(current => ({
        ...current,
        scaleX: Math.min(500, Math.max(8, pinch.scaleX * factor)),
        scaleY: Math.min(
          500,
          Math.max(8, (equalScale ? pinch.scaleX : pinch.scaleY) * factor)
        ),
      }));
      return;
    }
    const drag = dragRef.current;
    if (drag)
      setView(current => ({
        ...current,
        centerX: drag.centerX - (event.clientX - drag.x) / current.scaleX,
        centerY: drag.centerY + (event.clientY - drag.y) / current.scaleY,
      }));
  };
  const releasePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    touchRef.current.delete(event.pointerId);
    dragRef.current = null;
    pinchRef.current = null;
  };

  const setFunction = (index: number, patch: Partial<FunctionRow>) =>
    setFunctions(current =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  const addFunction = (expression = "") => {
    if (functions.length >= 5) {
      setNotice("O limite de 5 funções foi atingido.");
      return;
    }
    setFunctions(current => [
      ...current,
      { expression, color: COLORS[current.length], visible: true },
    ]);
    setSelectedIndex(functions.length);
    setNotice("");
  };
  const useExample = (expression: string) => {
    const empty = functions.findIndex(item => !item.expression.trim());
    if (empty >= 0) {
      setFunction(empty, { expression, visible: true });
      setSelectedIndex(empty);
      setNotice("");
    } else addFunction(expression);
  };
  const clearAll = () => {
    const filled = functions.filter(item => item.expression.trim()).length;
    if (filled > 1 && !window.confirm("Apagar todas as funções preenchidas?"))
      return;
    setFunctions(
      DEFAULT_FUNCTION_SIMULATOR_FUNCTIONS.map(item => ({
        ...item,
        expression: "",
      }))
    );
    setSelectedIndex(0);
    setNotice("");
  };
  const selected = parsed[selectedIndex]?.compiled as CompiledFunction | null;
  const tableValues = [-2, -1, 0, 1, 2].map(x => ({
    x,
    y: selected ? safeEvaluate(selected, x) : null,
  }));
  const visibleDomainIssue = selected
    ? Array.from(
        { length: 25 },
        (_, index) =>
          view.centerX +
          (((index - 12) / 12) * canvasSize.width) / (2 * view.scaleX)
      ).some(x => safeEvaluate(selected, x) === null)
    : false;
  const trend = selected
    ? (() => {
        const left = safeEvaluate(selected, view.centerX - 2 / view.scaleX);
        const right = safeEvaluate(selected, view.centerX + 2 / view.scaleX);
        if (left === null || right === null || Math.abs(right - left) < 1e-6)
          return null;
        return right > left
          ? "Crescente próximo ao centro visível"
          : "Decrescente próximo ao centro visível";
      })()
    : null;

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900 dark:text-slate-100">Funções</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Até cinco gráficos simultâneos
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Limpar
          </Button>
        </div>
        <div className="space-y-3">
          {functions.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl border p-3 ${selectedIndex === index ? "border-blue-300 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/40" : "border-slate-200 dark:border-slate-700 dark:bg-slate-800/60"}`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="font-black text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-100"
                  aria-label={`Selecionar ${FUNCTION_NAMES[index]} de x`}
                >
                  <span style={{ color: item.color }}>
                    {FUNCTION_NAMES[index]}(x)
                  </span>
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  — {COLOR_NAMES[index]}
                </span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={() =>
                      setFunction(index, { visible: !item.visible })
                    }
                    aria-label={`${item.visible ? "Ocultar" : "Mostrar"} ${FUNCTION_NAMES[index]}(x)`}
                  >
                    {item.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  {functions.length > 1 && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-950/50"
                      onClick={() => {
                        setFunctions(current =>
                          current.filter((_, i) => i !== index)
                        );
                        setSelectedIndex(current =>
                          Math.max(0, Math.min(current, functions.length - 2))
                        );
                      }}
                      aria-label={`Remover ${FUNCTION_NAMES[index]}(x)`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <label
                className="mt-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
                htmlFor={`function-${index}`}
              >
                Expressão de {FUNCTION_NAMES[index]}(x)
              </label>
              <input
                id={`function-${index}`}
                value={item.expression}
                onFocus={() => setSelectedIndex(index)}
                onChange={event =>
                  setFunction(index, { expression: event.target.value })
                }
                aria-invalid={Boolean(parsed[index].error)}
                aria-describedby={
                  parsed[index].error ? `function-error-${index}` : undefined
                }
                placeholder="Ex.: sen(x) + 2"
                className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
              />
              {parsed[index].error && (
                <p
                  id={`function-error-${index}`}
                  className="mt-1 text-xs font-semibold text-rose-600"
                >
                  {parsed[index].error}
                </p>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={() => addFunction()}
          disabled={functions.length >= 5}
          className="w-full rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar função
        </Button>
        {notice && (
          <p role="status" className="text-sm font-semibold text-amber-700">
            {notice}
          </p>
        )}
        <details className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-800/60" open>
          <summary className="cursor-pointer font-bold text-slate-800 dark:text-slate-100">
            Exemplos
          </summary>
          <div className="mt-3 space-y-3">
            {Object.entries(EXAMPLES).map(([group, examples]) => (
              <div key={group}>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {examples.map(example => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => useExample(example)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Aumentar zoom"
              onClick={() => zoom(1.2)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Diminuir zoom"
              onClick={() => zoom(1 / 1.2)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setView(current => ({ ...current, centerX: 0, centerY: 0 }))
              }
            >
              <LocateFixed className="mr-2 h-4 w-4" />
              Centralizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setView(createDefaultGraphViewport())}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar visualização
            </Button>
            <Button
              size="icon"
              variant={showGrid ? "default" : "outline"}
              aria-label={`${showGrid ? "Ocultar" : "Mostrar"} grade`}
              onClick={() => setShowGrid(value => !value)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={equalScale ? "default" : "outline"}
              aria-label={`${equalScale ? "Desbloquear" : "Manter"} proporção dos eixos`}
              onClick={() => setEqualScale(value => !value)}
            >
              {equalScale ? (
                <LockKeyhole className="h-4 w-4" />
              ) : (
                <UnlockKeyhole className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="relative h-[420px] min-h-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-600 sm:h-[560px]">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none cursor-crosshair"
              aria-label="Plano cartesiano interativo com os gráficos das funções"
              onWheel={event => {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                zoom(
                  event.deltaY < 0 ? 1.12 : 1 / 1.12,
                  event.clientX - rect.left,
                  event.clientY - rect.top
                );
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={releasePointer}
              onPointerCancel={releasePointer}
            />
          </div>
          <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              Rastrear x ={" "}
              <input
                type="number"
                step="any"
                value={Number(trackerX.toFixed(4))}
                onChange={event => setTrackerX(Number(event.target.value) || 0)}
                className="h-10 w-28 rounded-lg border border-slate-300 bg-white px-2 font-mono font-normal text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {parsed.map(
                (entry, index) =>
                  functions[index].visible && (
                    <span
                      key={index}
                      className="font-semibold"
                      style={{ color: functions[index].color }}
                    >
                      {FUNCTION_NAMES[index]}({formatNumber(trackerX)}) ={" "}
                      {entry.compiled
                        ? formatNumber(safeEvaluate(entry.compiled, trackerX))
                        : "inválida"}
                    </span>
                  )
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Leitura didática de {FUNCTION_NAMES[selectedIndex]}(x)
          </h2>
          <p className="mt-1 break-words font-mono text-sm text-blue-700">
            {functions[selectedIndex]?.expression || "Digite uma expressão"}
          </p>
          {selected ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <p>
                  <strong>f(0):</strong>{" "}
                  {formatNumber(safeEvaluate(selected, 0))}
                </p>
                <p>
                  <strong>Interseção com y:</strong>{" "}
                  {safeEvaluate(selected, 0) === null
                    ? "não existe nesse ponto"
                    : `(0, ${formatNumber(safeEvaluate(selected, 0))})`}
                </p>
                {visibleDomainIssue && (
                  <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                    A função não está definida em parte do intervalo atual.
                  </p>
                )}
                {trend && (
                  <p>
                    <strong>Comportamento local:</strong> {trend}.
                  </p>
                )}
              </div>
              <table className="w-full overflow-hidden rounded-xl text-sm">
                <caption className="sr-only">
                  Valores aproximados da função selecionada
                </caption>
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <th className="p-2 text-left">x</th>
                    <th className="p-2 text-left">
                      {FUNCTION_NAMES[selectedIndex]}(x)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableValues.map(row => (
                    <tr key={row.x} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-2">{row.x}</td>
                      <td className="p-2">{formatNumber(row.y)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Corrija a expressão para ver os valores.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
