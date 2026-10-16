import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { QuestionScratchpad } from "./QuestionScratchpad";

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
  const [mobileTab, setMobileTab] = useState<"question" | "draft">("question");
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 900px)").matches
  );
  const launch = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
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
            ? "flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
            : "mb-3 flex justify-end"
        }
      >
        {open ? (
          <>
            <h2 className="font-bold">
              Resolvendo {questionCode || "questão"}
            </h2>
            <button
              ref={close}
              type="button"
              className="rounded-lg border px-3 py-2 font-semibold"
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
      <ResizablePanelGroup
        direction="horizontal"
        className={open ? "min-h-0 flex-1" : "!h-auto"}
      >
        <ResizablePanel
          id="question"
          order={1}
          defaultSize={45}
          minSize={35}
          className={
            open
              ? `min-w-0 ${mobileTab === "question" ? "block" : "hidden min-[900px]:block"}`
              : "min-w-0"
          }
        >
          <div
            data-testid="question-resolution-panel"
            className={
              open ? "h-full overflow-y-auto overscroll-contain p-2 sm:p-4" : ""
            }
          >
            {children}
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          aria-label="Ajustar largura entre questão e rascunho"
          className={
            open
              ? "hidden !w-3 bg-slate-200 focus-visible:ring-violet-500 min-[900px]:flex dark:bg-slate-700"
              : "hidden"
          }
        />
        <ResizablePanel
          id="draft"
          order={2}
          defaultSize={55}
          minSize={35}
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
    </section>
  );
}
