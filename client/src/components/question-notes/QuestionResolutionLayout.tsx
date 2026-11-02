import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { QuestionScratchpad } from "./QuestionScratchpad";
import {
  containQuestionWindow,
  resizeQuestionWindow,
  type WindowBounds,
  type WindowEdge,
} from "./floatingQuestionWindow";
import "./questionResolution.css";

const edgeLabels: Record<WindowEdge, string> = {
  n: "borda superior",
  s: "borda inferior",
  e: "borda direita",
  w: "borda esquerda",
  ne: "canto superior direito",
  nw: "canto superior esquerdo",
  se: "canto inferior direito",
  sw: "canto inferior esquerdo",
};

/** A stable wrapper: panels are hidden, not reparented/remounted when modes change. */
export function QuestionResolutionLayout({
  children,
  enabled,
  userId,
  questionId,
  questionCode,
}: {
  children: ReactNode;
  enabled: boolean;
  userId?: string | null;
  questionId: string;
  questionCode?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [floating, setFloating] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [bounds, setBounds] = useState<WindowBounds>({
    x: 16,
    y: 16,
    width: 480,
    height: 500,
  });
  const area = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    start: WindowBounds;
    edge?: WindowEdge;
    latestY: number;
    moved: boolean;
  } | null>(null);
  const [mobileTab, setMobileTab] = useState<"question" | "draft">("question");
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 900px)").matches
  );
  const launch = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const floatingActive = open && wide && floating;
  function availableArea() {
    return {
      width: area.current?.clientWidth || window.innerWidth,
      height: area.current?.clientHeight || window.innerHeight,
    };
  }
  useEffect(() => {
    if (!open || !area.current) return;
    const observer = new ResizeObserver(() =>
      setBounds(previous => containQuestionWindow(previous, availableArea()))
    );
    observer.observe(area.current);
    return () => observer.disconnect();
  }, [open]);
  function startWindowGesture(
    event: ReactPointerEvent<HTMLElement>,
    edge?: WindowEdge
  ) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button"))
      return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      latestY: event.clientY,
      moved: false,
      start: bounds,
      edge,
    };
  }
  function moveWindowGesture(event: ReactPointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    current.latestY = event.clientY;
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    current.moved ||= Math.hypot(dx, dy) > 5;
    setBounds(
      current.edge
        ? resizeQuestionWindow(
            current.start,
            current.edge,
            dx,
            dy,
            availableArea()
          )
        : containQuestionWindow(
            {
              ...current.start,
              x: current.start.x + dx,
              y: current.start.y + dy,
            },
            availableArea()
          )
    );
  }
  function endWindowGesture(event: ReactPointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    if (
      event.type !== "pointercancel" &&
      !current.edge &&
      current.moved &&
      current.latestY >=
        (area.current?.getBoundingClientRect().bottom ?? window.innerHeight) -
          40
    ) {
      setMinimized(true);
      requestAnimationFrame(() => close.current?.focus());
    }
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const changed = () => setWide(query.matches);
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
        ) ?? []
      ).filter(element => element.getClientRects().length > 0);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
    };
  }, [open]);
  if (!enabled) return <>{children}</>;
  return (
    <section
      ref={root}
      aria-label="Área de resolução"
      data-resolution-open={open}
      className={
        open
          ? "fixed inset-0 z-[80] flex h-dvh min-h-0 flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
          : ""
      }
    >
      <header
        className={
          open
            ? "flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            : "mb-3 flex justify-end"
        }
      >
        {open ? (
          <>
            <h2 className="font-bold">
              Resolvendo {questionCode || "questão"}
            </h2>
            {wide ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  onClick={() => {
                    setFloating(value => !value);
                    setMinimized(false);
                  }}
                >
                  {floating ? "Lado a lado" : "Janela flutuante"}
                </button>
                {floating ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1"
                    onClick={() => setMinimized(value => !value)}
                  >
                    {minimized ? "Restaurar questão" : "Recolher questão"}
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              ref={close}
              type="button"
              className="rounded-lg border px-3 py-1 font-semibold"
              onClick={() => {
                setOpen(false);
                requestAnimationFrame(() => launch.current?.focus());
              }}
            >
              Voltar ao banco
            </button>
          </>
        ) : (
          <button
            ref={launch}
            type="button"
            className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
            onClick={() => {
              setStarted(true);
              setOpen(true);
            }}
          >
            Rascunhar
          </button>
        )}
        {open ? (
          <div
            role="group"
            aria-label="Painel exibido no celular"
            className="flex w-full gap-2 min-[900px]:hidden"
          >
            <button
              type="button"
              aria-pressed={mobileTab === "question"}
              className="flex-1 rounded-lg border p-2 aria-pressed:bg-violet-600 aria-pressed:text-white"
              onClick={() => setMobileTab("question")}
            >
              Questão
            </button>
            <button
              type="button"
              aria-pressed={mobileTab === "draft"}
              className="flex-1 rounded-lg border p-2 aria-pressed:bg-violet-600 aria-pressed:text-white"
              onClick={() => setMobileTab("draft")}
            >
              Rascunho
            </button>
          </div>
        ) : null}
      </header>
      <div ref={area} className={open ? "relative min-h-0 flex-1" : ""}>
        <ResizablePanelGroup
          direction="horizontal"
          className={open ? "relative h-full min-h-0" : "!h-auto"}
        >
          <ResizablePanel
            id="question"
            order={1}
            defaultSize={45}
            minSize={35}
            style={
              floatingActive
                ? {
                    position: "absolute",
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    zIndex: 20,
                    display: minimized ? "none" : "flex",
                    flexDirection: "column",
                    boxShadow: "0 8px 30px #0005",
                    borderRadius: 12,
                  }
                : undefined
            }
            className={
              open
                ? `min-w-0 ${mobileTab === "question" ? "block" : "hidden min-[900px]:block"}`
                : "min-w-0"
            }
          >
            <div
              hidden={!floatingActive}
              className="relative shrink-0 rounded-t-xl border border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
            >
              <div
                role="toolbar"
                aria-label="Mover janela da questão (setas do teclado)"
                title="Arraste para mover; solte perto da borda inferior para recolher. Também aceita as setas do teclado."
                tabIndex={0}
                className="flex touch-none cursor-move select-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-violet-500"
                onPointerDown={event => startWindowGesture(event)}
                onPointerMove={moveWindowGesture}
                onPointerUp={endWindowGesture}
                onPointerCancel={endWindowGesture}
                onKeyDown={event => {
                  const delta = event.shiftKey ? 40 : 10;
                  const moves: Record<string, [number, number]> = {
                    ArrowLeft: [-delta, 0],
                    ArrowRight: [delta, 0],
                    ArrowUp: [0, -delta],
                    ArrowDown: [0, delta],
                  };
                  const move = moves[event.key];
                  if (move && event.target === event.currentTarget) {
                    event.preventDefault();
                    setBounds(previous =>
                      containQuestionWindow(
                        {
                          ...previous,
                          x: previous.x + move[0],
                          y: previous.y + move[1],
                        },
                        availableArea()
                      )
                    );
                  }
                }}
              >
                <span>Questão · arraste para mover</span>
                <button
                  type="button"
                  aria-label="Minimizar questão"
                  className="rounded border px-2 py-0.5"
                  onClick={() => {
                    setMinimized(true);
                    close.current?.focus();
                  }}
                >
                  −
                </button>
              </div>
            </div>
            <div
              data-testid="question-resolution-panel"
              className={
                open
                  ? "h-full min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100 p-2 dark:bg-slate-950"
                  : ""
              }
            >
              {children}
            </div>
            {floatingActive && !minimized
              ? (
                  ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as WindowEdge[]
                ).map(edge => (
                  <div
                    key={edge}
                    role="separator"
                    tabIndex={0}
                    aria-label={`Redimensionar questão: ${edgeLabels[edge]}`}
                    aria-orientation={
                      edge.includes("e") || edge.includes("w")
                        ? "vertical"
                        : "horizontal"
                    }
                    aria-valuenow={Math.round(
                      edge.includes("e") || edge.includes("w")
                        ? bounds.width
                        : bounds.height
                    )}
                    aria-valuetext={`${Math.round(bounds.width)} por ${Math.round(bounds.height)} pixels`}
                    className={`question-window-resize question-window-resize-${edge}`}
                    onPointerDown={event => startWindowGesture(event, edge)}
                    onPointerMove={moveWindowGesture}
                    onPointerUp={endWindowGesture}
                    onPointerCancel={endWindowGesture}
                    onKeyDown={event => {
                      const delta = event.shiftKey ? 40 : 10;
                      const moves: Record<string, [number, number]> = {
                        ArrowLeft: [-delta, 0],
                        ArrowRight: [delta, 0],
                        ArrowUp: [0, -delta],
                        ArrowDown: [0, delta],
                      };
                      const move = moves[event.key];
                      if (move) {
                        event.preventDefault();
                        setBounds(previous =>
                          resizeQuestionWindow(
                            previous,
                            edge,
                            move[0],
                            move[1],
                            availableArea()
                          )
                        );
                      }
                    }}
                  />
                ))
              : null}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            aria-label="Ajustar largura entre questão e rascunho"
            className={
              open && !floatingActive
                ? "hidden !w-3 bg-slate-200 focus-visible:ring-violet-500 min-[900px]:flex dark:bg-slate-700"
                : "hidden"
            }
          />
          <ResizablePanel
            id="draft"
            order={2}
            defaultSize={55}
            minSize={35}
            style={
              floatingActive
                ? {
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                  }
                : undefined
            }
            className={
              open
                ? `min-w-0 ${mobileTab === "draft" ? "block" : "hidden min-[900px]:block"}`
                : "hidden"
            }
          >
            <div
              data-testid="draft-resolution-panel"
              className="h-full overflow-auto overscroll-contain bg-white dark:bg-slate-900"
            >
              {started ? (
                <QuestionScratchpad
                  userId={userId}
                  questionId={questionId}
                  questionCode={questionCode}
                  embedded
                  active={open && (wide || mobileTab === "draft")}
                />
              ) : null}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </section>
  );
}
