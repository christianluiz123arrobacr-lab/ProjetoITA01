import type { CSSProperties, ReactNode, RefObject } from "react";

export function PaperViewport({
  fullscreen,
  frameStyle,
  viewportRef,
  children,
}: {
  fullscreen: boolean;
  frameStyle: CSSProperties;
  viewportRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={viewportRef}
      data-testid="paper-viewport"
      className={`min-h-0 flex-1 overflow-auto overscroll-contain ${fullscreen ? "bg-slate-950" : "bg-slate-200/70"}`}
    >
      <div className="flex min-h-full min-w-full items-start justify-center p-5 sm:p-8">
        <div
          data-testid="paper-frame"
          className="relative overflow-hidden bg-white shadow-[0_12px_36px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/10"
          style={frameStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
