import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Circle,
  Download,
  Eraser,
  Highlighter,
  Minus,
  PenLine,
  Plus,
  Redo2,
  Save,
  Square,
  Triangle,
  Type,
  Undo2,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  NOTEBOOK_AUTOSAVE_MS,
  paperDimensions,
  type NotebookDocument,
  type NotebookElement,
  type NotebookPaperSize,
  type NotebookPoint,
} from "@/lib/notebookDocument";

type Tool = NotebookElement["type"] | "eraser" | "pan";
const COLORS = [
  "#0f172a",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#f59e0b",
];
function id() {
  return crypto.randomUUID();
}

export default function NotebookEditorPage() {
  const [, params] = useRoute("/caderno/:documentId");
  const documentId = params?.documentId ?? "";
  const query = trpc.notebooks.get.useQuery(
    { documentId },
    { enabled: Boolean(documentId), retry: false }
  );
  const update = trpc.notebooks.update.useMutation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<NotebookElement | null>(null);
  const [document, setDocument] = useState<NotebookDocument | null>(null);
  const [modifiedTime, setModifiedTime] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<
    "saved" | "saving" | "dirty" | "offline" | "error" | "conflict"
  >("saved");
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<NotebookElement[][]>([]);
  const [future, setFuture] = useState<NotebookElement[][]>([]);
  const dirtyRef = useRef(false);
  const saveRef = useRef<(force?: boolean) => Promise<void>>(
    async () => undefined
  );
  useEffect(() => {
    if (query.data) {
      setDocument(query.data.document as NotebookDocument);
      setModifiedTime(query.data.modifiedTime);
      setDirty(false);
      setStatus("saved");
    }
  }, [query.data]);
  const elements = document?.pages[0]?.elements ?? [];
  const changeElements = (next: NotebookElement[]) => {
    if (!document) return;
    setHistory(current => [...current.slice(-49), elements]);
    setFuture([]);
    setDocument({
      ...document,
      pages: document.pages.map((page, index) =>
        index === 0 ? { ...page, elements: next } : page
      ),
    });
    setDirty(true);
    setStatus("dirty");
  };
  const save = useCallback(
    async (force = false) => {
      if (!document || !dirty || update.isPending) return;
      setStatus("saving");
      try {
        const result = await update.mutateAsync({
          documentId,
          document: { ...document, modifiedAt: new Date().toISOString() },
          expectedModifiedTime: modifiedTime,
          force,
        });
        setDocument(result.document as NotebookDocument);
        setModifiedTime(result.modifiedTime);
        setDirty(false);
        setStatus("saved");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setStatus(
          message.includes("outro dispositivo")
            ? "conflict"
            : navigator.onLine
              ? "error"
              : "offline"
        );
      }
    },
    [dirty, document, documentId, modifiedTime, update]
  );
  useEffect(() => {
    dirtyRef.current = dirty;
    saveRef.current = save;
  }, [dirty, save]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dirtyRef.current) void saveRef.current();
    }, NOTEBOOK_AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const dimensions = useMemo(
    () => paperDimensions(document?.paper.size ?? "a4"),
    [document?.paper.size]
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !document) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    if (document.paper.lined) {
      ctx.strokeStyle = "#dbeafe";
      ctx.lineWidth = 1;
      for (let y = 40; y < dimensions.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
      }
    }
    for (const item of elements) {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.globalAlpha = item.type === "highlighter" ? 0.35 : 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const first = item.points[0];
      const last = item.points[item.points.length - 1];
      if (!first || !last) continue;
      if (item.type === "pen" || item.type === "highlighter") {
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        item.points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      } else if (item.type === "text") {
        ctx.globalAlpha = 1;
        ctx.font = `${Math.max(14, item.width * 4)}px sans-serif`;
        ctx.fillText(item.text ?? "", first.x, first.y);
      } else {
        ctx.beginPath();
        if (item.type === "rectangle")
          ctx.rect(first.x, first.y, last.x - first.x, last.y - first.y);
        else if (item.type === "circle")
          ctx.ellipse(
            (first.x + last.x) / 2,
            (first.y + last.y) / 2,
            Math.abs(last.x - first.x) / 2,
            Math.abs(last.y - first.y) / 2,
            0,
            0,
            Math.PI * 2
          );
        else if (item.type === "triangle") {
          ctx.moveTo((first.x + last.x) / 2, first.y);
          ctx.lineTo(last.x, last.y);
          ctx.lineTo(first.x, last.y);
          ctx.closePath();
        } else {
          ctx.moveTo(first.x, first.y);
          ctx.lineTo(last.x, last.y);
          if (item.type === "arrow") {
            const angle = Math.atan2(last.y - first.y, last.x - first.x);
            ctx.lineTo(
              last.x - 14 * Math.cos(angle - 0.5),
              last.y - 14 * Math.sin(angle - 0.5)
            );
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(
              last.x - 14 * Math.cos(angle + 0.5),
              last.y - 14 * Math.sin(angle + 0.5)
            );
          }
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }, [dimensions, document, elements]);
  const point = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): NotebookPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * dimensions.width) / rect.width,
      y: ((event.clientY - rect.top) * dimensions.height) / rect.height,
    };
  };
  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!document) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    if (tool === "eraser") {
      changeElements(
        elements.filter(
          item =>
            !item.points.some(
              p => Math.hypot(p.x - start.x, p.y - start.y) < 24
            )
        )
      );
      return;
    }
    if (tool === "text") {
      const text = window.prompt("Texto");
      if (text)
        changeElements([
          ...elements,
          { id: id(), type: "text", color, width, points: [start], text },
        ]);
      return;
    }
    if (tool === "pan") return;
    drawing.current = { id: id(), type: tool, color, width, points: [start] };
  };
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const current = point(event);
    drawing.current = {
      ...drawing.current,
      points:
        drawing.current.type === "pen" || drawing.current.type === "highlighter"
          ? [...drawing.current.points, current]
          : [drawing.current.points[0], current],
    };
    const preview = drawing.current;
    if (document)
      setDocument({
        ...document,
        pages: document.pages.map((page, index) =>
          index === 0 ? { ...page, elements: [...elements, preview] } : page
        ),
      });
  };
  const pointerUp = () => {
    const finished = drawing.current;
    drawing.current = null;
    if (finished)
      changeElements([
        ...elements.filter(item => item.id !== finished.id),
        finished,
      ]);
  };
  const setPaper = (patch: Partial<NotebookDocument["paper"]>) => {
    if (!document) return;
    setDocument({ ...document, paper: { ...document.paper, ...patch } });
    setDirty(true);
    setStatus("dirty");
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture(current => [elements, ...current]);
    setHistory(current => current.slice(0, -1));
    if (document)
      setDocument({
        ...document,
        pages: document.pages.map((page, i) =>
          i === 0 ? { ...page, elements: previous } : page
        ),
      });
    setDirty(true);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory(current => [...current, elements]);
    setFuture(current => current.slice(1));
    if (document)
      setDocument({
        ...document,
        pages: document.pages.map((page, i) =>
          i === 0 ? { ...page, elements: next } : page
        ),
      });
    setDirty(true);
  };
  const exportPng = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document?.name ?? "caderno"}.png`;
    link.click();
  };
  if (query.isLoading || !document)
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        Carregando caderno...
      </main>
    );
  const statusText = {
    saved: "Salvo no Google Drive",
    saving: "Salvando...",
    dirty: "Alterações não salvas",
    offline: "Sem conexão",
    error: "Falha ao salvar",
    conflict: "Conflito com a versão do Drive",
  }[status];
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border bg-white p-4">
          <div>
            <Link href="/caderno">
              <a
                className="inline-flex items-center text-sm font-bold text-blue-700"
                onClick={async event => {
                  if (!dirty) return;
                  event.preventDefault();
                  await saveRef.current();
                  window.location.href = "/caderno";
                }}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Meus cadernos
              </a>
            </Link>
            <h1 className="text-xl font-black">{document.name}</h1>
            <p className="text-xs font-semibold text-slate-500">{statusText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void save()}
              disabled={!dirty || status === "saving"}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar agora
            </Button>
            <Button variant="outline" onClick={exportPng}>
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Exportar PDF
            </Button>
          </div>
        </header>
        {status === "conflict" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">
              Este arquivo foi alterado em outro dispositivo.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => query.refetch()}>
                Recarregar versão do Drive
              </Button>
              <Button onClick={() => void save(true)}>
                Manter minhas alterações e substituir
              </Button>
            </div>
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border bg-white p-4">
            <h2 className="font-black">Ferramentas</h2>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: "pen", icon: PenLine },
                  { value: "highlighter", icon: Highlighter },
                  { value: "eraser", icon: Eraser },
                  { value: "line", icon: Minus },
                  { value: "arrow", icon: Download },
                  { value: "rectangle", icon: Square },
                  { value: "circle", icon: Circle },
                  { value: "triangle", icon: Triangle },
                  { value: "text", icon: Type },
                ] as const
              ).map(item => (
                <button
                  key={item.value}
                  aria-label={item.value}
                  onClick={() => setTool(item.value)}
                  className={`flex h-11 items-center justify-center rounded-xl border ${tool === item.value ? "bg-blue-600 text-white" : "bg-white"}`}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={undo}
                aria-label="Desfazer"
              >
                <Undo2 />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={redo}
                aria-label="Refazer"
              >
                <Redo2 />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setZoom(value => Math.max(0.4, value - 0.1))}
                aria-label="Diminuir zoom"
              >
                <Minus />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setZoom(value => Math.min(2.5, value + 0.1))}
                aria-label="Aumentar zoom"
              >
                <Plus />
              </Button>
            </div>
            <label className="block text-sm font-bold">
              Espessura
              <input
                type="range"
                min="1"
                max="30"
                value={width}
                onChange={event => setWidth(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(value => (
                <button
                  key={value}
                  aria-label={`Cor ${value}`}
                  onClick={() => setColor(value)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    backgroundColor: value,
                    borderColor: color === value ? "#0ea5e9" : "white",
                  }}
                />
              ))}
            </div>
            <fieldset className="rounded-2xl border p-3">
              <legend className="font-black">Configurar folha</legend>
              <label className="mt-2 block text-sm">
                Tamanho
                <select
                  value={document.paper.size}
                  onChange={event =>
                    setPaper({ size: event.target.value as NotebookPaperSize })
                  }
                  className="mt-1 h-10 w-full rounded-lg border px-2"
                >
                  <option value="a5">A5</option>
                  <option value="a4">A4</option>
                  <option value="a3">A3</option>
                  <option value="infinite">Folha infinita</option>
                </select>
              </label>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={document.paper.lined}
                  onChange={event => setPaper({ lined: event.target.checked })}
                />
                Com linhas
              </label>
            </fieldset>
          </aside>
          <section className="min-w-0 overflow-auto rounded-3xl border bg-slate-200 p-4">
            <div
              className="mx-auto origin-top transition-transform motion-reduce:transition-none"
              style={{
                width: dimensions.width,
                transform: `scale(${zoom})`,
                marginBottom: dimensions.height * (zoom - 1),
              }}
            >
              <canvas
                ref={canvasRef}
                className="block touch-none bg-white shadow-xl"
                style={{ width: dimensions.width, height: dimensions.height }}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
