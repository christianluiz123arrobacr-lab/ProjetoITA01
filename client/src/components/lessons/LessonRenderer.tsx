import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AlertTriangle, Brain, CheckCircle2, Info, KeyRound, Lightbulb, TriangleAlert } from "lucide-react";
import { MathFormula } from "@/components/MathFormula";
import type { LessonBlock, LessonJSON } from "@shared/lessonSchema";
import "katex/dist/katex.min.css";

type RendererProps = { lesson: LessonJSON; mode?: "student" | "preview" };
type BoundaryProps = { blockId: string; preview: boolean; children: ReactNode };

class LessonBlockBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    console.error(`[LessonRenderer] falha ao renderizar bloco ${this.props.blockId}`);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
      {this.props.preview ? `Não foi possível renderizar o bloco “${this.props.blockId}”.` : "Uma parte desta aula está temporariamente indisponível."}
    </div>;
  }
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="leading-7 text-slate-700 dark:text-slate-200">{children}</p>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="ml-5 list-disc space-y-2">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="ml-5 list-decimal space-y-2">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="pl-1 text-slate-700 dark:text-slate-200">{children}</li>,
};

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, trust: false }]]} skipHtml disallowedElements={["a", "img", "script", "iframe", "object", "embed", "table", "video", "audio"]} unwrapDisallowed components={markdownComponents}>{children}</ReactMarkdown>;
}

const highlightStyle = {
  info: [Info, "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"],
  attention: [TriangleAlert, "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"],
  important: [AlertTriangle, "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"],
  tip: [Lightbulb, "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"],
  key_concept: [KeyRound, "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100"],
  observation: [Brain, "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100"],
} as const;

function imageUrl(path: string) {
  if (path.startsWith("brand/")) return `/${path}`;
  const base = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/lesson-images/${encoded}`;
}

function renderBlock(block: LessonBlock): ReactNode {
  if (block.type === "text") return <section>{block.title && <h2 className="mb-3 text-2xl font-bold text-slate-950 dark:text-white">{block.title}</h2>}<Markdown>{block.content}</Markdown></section>;
  if (block.type === "formula") return <figure className={`overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 ${{ left: "text-left", center: "text-center", right: "text-right" }[block.align]}`}><MathFormula formula={block.latex} /><figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption></figure>;
  if (block.type === "highlight") {
    const [Icon, style] = highlightStyle[block.variant];
    return <aside className={`rounded-2xl border p-5 ${style}`}><div className="flex gap-3"><Icon className="mt-1 h-5 w-5 shrink-0" /><div className="min-w-0">{block.title && <h3 className="mb-2 font-bold">{block.title}</h3>}<Markdown>{block.content}</Markdown></div></div></aside>;
  }
  if (block.type === "intuition") return <aside className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-indigo-900 dark:from-indigo-950/50 dark:to-slate-900"><h3 className="mb-2 flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-100"><Brain className="h-5 w-5" />{block.title ?? "Intuição"}</h3><Markdown>{block.content}</Markdown></aside>;
  if (block.type === "common_mistake") return <aside className="rounded-2xl border-l-4 border-red-500 bg-red-50 p-5 dark:bg-red-950/35"><h3 className="mb-2 flex items-center gap-2 font-bold text-red-900 dark:text-red-100"><AlertTriangle className="h-5 w-5" />{block.title ?? "Erro comum"}</h3><Markdown>{block.content}</Markdown></aside>;
  if (block.type === "example") return <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"><div className="bg-slate-100 px-5 py-3 font-bold text-slate-900 dark:bg-slate-800 dark:text-white">Exemplo resolvido</div><div className="space-y-5 p-5"><div><h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Problema</h4><Markdown>{block.problem}</Markdown></div><div className="border-t border-slate-200 pt-5 dark:border-slate-700"><h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Resolução</h4><Markdown>{block.solution}</Markdown></div>{block.conclusion && <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40"><Markdown>{block.conclusion}</Markdown></div>}</div></section>;
  if (block.type === "image") {
    const width = { small: "max-w-xs", medium: "max-w-lg", large: "max-w-3xl", full: "max-w-full" }[block.size];
    const alignment = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[block.align];
    return <figure className={`${width} ${alignment}`}><img src={imageUrl(block.storagePath)} alt={block.alt} loading="lazy" className="h-auto max-w-full rounded-2xl border border-slate-200 bg-white object-contain dark:border-slate-700" />{block.caption && <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption>}</figure>;
  }
  if (block.type === "summary") return <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"><h2 className="mb-4 text-xl font-bold text-emerald-950 dark:text-emerald-100">{block.title ?? "Resumo"}</h2><ul className="space-y-3">{block.points.map((point, index) => <li key={index} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><div><Markdown>{point}</Markdown></div></li>)}</ul></section>;
  return null;
}

export function LessonRenderer({ lesson, mode = "student" }: RendererProps) {
  return <div className="space-y-7 overflow-x-hidden">{lesson.blocks.filter(block => block.visible).map(block => <LessonBlockBoundary key={block.id} blockId={block.id} preview={mode === "preview"}>{renderBlock(block)}</LessonBlockBoundary>)}</div>;
}

export function UnsafeLessonRenderer({ lesson, mode = "student" }: { lesson: { blocks?: unknown[] }; mode?: "student" | "preview" }) {
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
  return <div className="space-y-7">{blocks.map((raw, index) => {
    const block = raw as Partial<LessonBlock>;
    if (!block || typeof block !== "object" || typeof block.id !== "string" || !("visible" in block) || block.visible === false) return null;
    const known = ["text","formula","highlight","intuition","common_mistake","example","image","summary"].includes(String(block.type));
    if (!known) return <div key={block.id || index} role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{mode === "preview" ? `Tipo de bloco desconhecido em “${block.id}”.` : "Uma parte desta aula está temporariamente indisponível."}</div>;
    return <LessonBlockBoundary key={block.id} blockId={block.id} preview={mode === "preview"}>{renderBlock(block as LessonBlock)}</LessonBlockBoundary>;
  })}</div>;
}
