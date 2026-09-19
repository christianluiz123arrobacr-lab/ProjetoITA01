import React, { Component, useState, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AlertTriangle, Brain, CheckCircle2, ChevronDown, Info, KeyRound, Lightbulb, Sigma, TriangleAlert } from "lucide-react";
import { MathFormula } from "@/components/MathFormula";
import { lessonBlockSchema, type LessonBlock, type LessonJSON } from "@shared/lessonSchema";
import "katex/dist/katex.min.css";

type RendererProps = { lesson: LessonJSON; mode?: "student" | "preview" };
type BoundaryProps = { blockId: string; preview: boolean; children: ReactNode };

class LessonBlockBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { console.error("[LessonRenderer] falha ao renderizar um bloco de aula"); }
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
  em: ({ children }: { children?: ReactNode }) => <em className="text-slate-800 dark:text-slate-100">{children}</em>,
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

const formulaCardStyles = {
  default: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
  primary: "border-cyan-200 bg-cyan-50/70 dark:border-cyan-900 dark:bg-cyan-950/30",
  success: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30",
  warning: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30",
} as const;

function imageUrl(path: string) {
  if (path.startsWith("brand/")) return `/${path}`;
  const base = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/lesson-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}

type DerivationData = Extract<LessonBlock, { type: "derivation" }> | NonNullable<Extract<LessonBlock, { type: "formula_card" }>["derivation"]>;

function DerivationContent({ data, embedded = false }: { data: DerivationData; embedded?: boolean }) {
  const [open, setOpen] = useState(data.initiallyOpen);
  return <section className={`${embedded ? "mt-5" : "rounded-2xl border border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20"} overflow-hidden`}>
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-bold text-slate-950 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-white dark:hover:bg-white/5">
      <span>{data.title}</span><ChevronDown className={`h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="space-y-5 border-t border-current/10 px-5 py-5">
      {data.introduction && <Markdown>{data.introduction}</Markdown>}
      <ol className="space-y-5">
        {data.steps.map((step, index) => <li key={step.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">{index + 1}</span>
          <div className="min-w-0 space-y-3">
            {step.title && <h4 className="font-bold text-slate-900 dark:text-white">{step.title}</h4>}
            {step.text && <Markdown>{step.text}</Markdown>}
            {step.latex && <div className="max-w-full overflow-x-auto rounded-xl bg-white/70 p-3 text-center dark:bg-slate-950/60"><MathFormula formula={step.latex} /></div>}
            {step.observation && <div className="rounded-lg border-l-2 border-violet-400 pl-3 text-sm"><Markdown>{step.observation}</Markdown></div>}
          </div>
        </li>)}
      </ol>
      {data.conclusion && <div className="rounded-xl bg-violet-100/70 p-4 dark:bg-violet-950/50"><Markdown>{data.conclusion}</Markdown></div>}
    </div>}
  </section>;
}

const gridClasses = {
  one: "grid-cols-1",
  two: "grid-cols-1 md:grid-cols-2",
  three: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  four: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  one_third_two_thirds: "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
  two_thirds_one_third: "grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
} as const;

function FormulaCard({ block }: { block: Extract<LessonBlock, { type: "formula_card" }> }) {
  return <section className={`overflow-hidden rounded-2xl border p-5 ${formulaCardStyles[block.variant]}`}>
    <div className="mb-4 flex items-center gap-2">{block.title && <h3 className="text-xl font-bold text-slate-950 dark:text-white">{block.title}</h3>}<Sigma className="ml-auto h-5 w-5 text-cyan-600 dark:text-cyan-300" /></div>
    <div className="max-w-full overflow-x-auto rounded-xl bg-white/80 p-5 text-center dark:bg-slate-950/70"><MathFormula formula={block.latex} /></div>
    {block.description && <div className="mt-4"><Markdown>{block.description}</Markdown></div>}
    {(block.terms.length > 0 || block.siUnit) && <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[28rem] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-300 dark:border-slate-700"><th className="p-2">Símbolo</th><th className="p-2">Significado</th><th className="p-2">Unidade</th><th className="p-2">Observação</th></tr></thead><tbody>{block.terms.map((term, index) => <tr key={`${term.symbol}-${index}`} className="border-b border-slate-200/80 dark:border-slate-800"><td className="p-2 font-semibold"><MathFormula formula={term.symbol} /></td><td className="p-2">{term.meaning}</td><td className="p-2">{term.unit ?? "—"}</td><td className="p-2">{term.note ?? "—"}</td></tr>)}</tbody></table>{block.siUnit && <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Unidade SI: {block.siUnit}</p>}</div>}
    {block.validityConditions.length > 0 && <aside className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"><h4 className="mb-2 font-bold text-amber-950 dark:text-amber-100">Condições de validade</h4><ul className="ml-5 list-disc space-y-1">{block.validityConditions.map((condition, index) => <li key={index}><Markdown>{condition}</Markdown></li>)}</ul></aside>}
    {block.observations.length > 0 && <div className="mt-4 space-y-2">{block.observations.map((observation, index) => <div key={index} className="rounded-lg border-l-2 border-cyan-500 pl-3 text-sm"><Markdown>{observation}</Markdown></div>)}</div>}
    {block.derivation && <DerivationContent data={block.derivation} embedded />}
  </section>;
}

function RenderBlocks({ blocks, preview }: { blocks: LessonBlock[]; preview: boolean }) {
  return <div className="space-y-7">{blocks.filter(block => block.visible).map(block => <LessonBlockBoundary key={block.id} blockId={block.id} preview={preview}>{renderBlock(block, preview)}</LessonBlockBoundary>)}</div>;
}

function renderBlock(block: LessonBlock, preview: boolean): ReactNode {
  if (block.type === "section") return <section id={block.anchor} className="scroll-mt-24 space-y-5"><header><h2 className="text-2xl font-black text-slate-950 dark:text-white">{block.title}</h2>{block.description && <div className="mt-2"><Markdown>{block.description}</Markdown></div>}</header><RenderBlocks blocks={block.blocks} preview={preview} /></section>;
  if (block.type === "grid") return <div className={`grid items-start gap-5 ${gridClasses[block.preset]}`}>{block.columns.map(column => <div key={column.id} className="min-w-0"><RenderBlocks blocks={column.blocks} preview={preview} /></div>)}</div>;
  if (block.type === "formula_card") return <FormulaCard block={block} />;
  if (block.type === "derivation") return <DerivationContent data={block} />;
  if (block.type === "text") return <section>{block.title && <h2 className="mb-3 text-2xl font-bold text-slate-950 dark:text-white">{block.title}</h2>}<Markdown>{block.content}</Markdown></section>;
  if (block.type === "formula") return <figure className={`max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 ${{ left: "text-left", center: "text-center", right: "text-right" }[block.align]}`}><MathFormula formula={block.latex} />{block.caption && <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption>}</figure>;
  if (block.type === "highlight") { const [Icon, style] = highlightStyle[block.variant]; return <aside className={`rounded-2xl border p-5 ${style}`}><div className="flex gap-3"><Icon className="mt-1 h-5 w-5 shrink-0" /><div className="min-w-0">{block.title && <h3 className="mb-2 font-bold">{block.title}</h3>}<Markdown>{block.content}</Markdown></div></div></aside>; }
  if (block.type === "intuition") return <aside className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-indigo-900 dark:from-indigo-950/50 dark:to-slate-900"><h3 className="mb-2 flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-100"><Brain className="h-5 w-5" />{block.title ?? "Intuição"}</h3><Markdown>{block.content}</Markdown></aside>;
  if (block.type === "common_mistake") return <aside className="rounded-2xl border-l-4 border-red-500 bg-red-50 p-5 dark:bg-red-950/35"><h3 className="mb-2 flex items-center gap-2 font-bold text-red-900 dark:text-red-100"><AlertTriangle className="h-5 w-5" />{block.title ?? "Erro comum"}</h3><Markdown>{block.content}</Markdown></aside>;
  if (block.type === "example") return <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"><div className="bg-slate-100 px-5 py-3 font-bold text-slate-900 dark:bg-slate-800 dark:text-white">Exemplo resolvido</div><div className="space-y-5 p-5"><div><h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Problema</h4><Markdown>{block.problem}</Markdown></div><div className="border-t border-slate-200 pt-5 dark:border-slate-700"><h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Resolução</h4><Markdown>{block.solution}</Markdown></div>{block.conclusion && <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40"><Markdown>{block.conclusion}</Markdown></div>}</div></section>;
  if (block.type === "image") { const width = { small: "max-w-xs", medium: "max-w-lg", large: "max-w-3xl", full: "max-w-full" }[block.size]; const alignment = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[block.align]; return <figure className={`${width} ${alignment}`}><img src={imageUrl(block.storagePath)} alt={block.alt} loading="lazy" className="h-auto max-w-full rounded-2xl border border-slate-200 bg-white object-contain dark:border-slate-700" />{block.caption && <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption>}</figure>; }
  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"><h2 className="mb-4 text-xl font-bold text-emerald-950 dark:text-emerald-100">{block.title ?? "Resumo"}</h2><ul className="space-y-3">{block.points.map((point, index) => <li key={index} className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><div><Markdown>{point}</Markdown></div></li>)}</ul></section>;
}

export function LessonRenderer({ lesson, mode = "student" }: RendererProps) {
  return <div className="overflow-x-hidden"><RenderBlocks blocks={lesson.blocks} preview={mode === "preview"} /></div>;
}

export function UnsafeLessonRenderer({ lesson, mode = "student" }: { lesson: { blocks?: unknown[] }; mode?: "student" | "preview" }) {
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
  return <div className="space-y-7">{blocks.map((raw, index) => {
    const parsed = lessonBlockSchema.safeParse(raw);
    const id = raw && typeof raw === "object" && "id" in raw && typeof raw.id === "string" ? raw.id : String(index);
    if (!parsed.success) return <div key={id} role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{mode === "preview" ? `Tipo de bloco desconhecido ou inválido em “${id}”.` : "Uma parte desta aula está temporariamente indisponível."}</div>;
    if (!parsed.data.visible) return null;
    return <LessonBlockBoundary key={parsed.data.id} blockId={parsed.data.id} preview={mode === "preview"}>{renderBlock(parsed.data, mode === "preview")}</LessonBlockBoundary>;
  })}</div>;
}
