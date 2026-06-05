import { useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  CircleDot,
  Eye,
  Glasses,
  Lightbulb,
  Orbit,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success" | "danger";
type DiagramKind =
  | "concaveMirror"
  | "convexMirror"
  | "convergingLens"
  | "divergingLens"
  | "gaussSigns"
  | "eyeDefects";

type DiagramData = {
  kind: DiagramKind;
  title: string;
  caption: string;
};

type FormulaPanel = {
  title: string;
  formula: string;
  description: string;
  terms: string[];
  interpretation: string[];
  warning?: string;
};

type TheorySection = {
  id: number;
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  diagram?: DiagramData;
  bullets?: string[];
  numbered?: string[];
  formulas?: FormulaPanel[];
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

type Example = {
  id: string;
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: string[];
  formulas: string[];
  conclusion: string;
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function NoteCard({
  title,
  type,
  body,
}: {
  title: string;
  type: NoteType;
  body: string;
}) {
  const styles = {
    info: {
      wrap: "border-blue-200 bg-blue-50",
      icon: "text-blue-700",
      Icon: Lightbulb,
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50",
      icon: "text-amber-700",
      Icon: AlertTriangle,
    },
    success: {
      wrap: "border-emerald-200 bg-emerald-50",
      icon: "text-emerald-700",
      Icon: CheckCircle2,
    },
    danger: {
      wrap: "border-red-200 bg-red-50",
      icon: "text-red-700",
      Icon: AlertTriangle,
    },
  }[type];

  const Icon = styles.Icon;

  return (
    <div className={`rounded-2xl border p-5 ${styles.wrap}`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${styles.icon}`} />
        <h4 className="text-base font-black text-slate-950">{title}</h4>
      </div>
      <p className="text-justify text-[1.02rem] leading-8 text-slate-700">{body}</p>
    </div>
  );
}

function TheorySectionCard({ section }: { section: TheorySection }) {
  const Icon = section.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className={`${section.accent} px-7 py-6 text-white md:px-9`}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            {section.id}. {section.title}
          </h2>
        </div>
      </div>

      <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-justify text-[1.06rem] leading-9 text-slate-700">
            {paragraph}
          </p>
        ))}

        {section.diagram ? <OpticsDiagram diagram={section.diagram} /> : null}

        {section.bullets ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3">
              {section.bullets.map((bullet, index) => (
                <li key={index} className="flex gap-3 text-[1.02rem] leading-8 text-slate-700">
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.numbered ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-4">
              {section.numbered.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="pt-0.5 text-[1.02rem] leading-8 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {section.formulas ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {section.formulas.map((panel) => (
              <FormulaPanelCard key={panel.title} panel={panel} />
            ))}
          </div>
        ) : null}

        {section.notes ? (
          <div className="grid gap-4 md:grid-cols-2">
            {section.notes.map((note, index) => (
              <NoteCard key={index} title={note.title} type={note.type} body={note.body} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FormulaPanelCard({ panel }: { panel: FormulaPanel }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-black text-slate-950">{panel.title}</h3>
      </div>
      <div className="p-6">
        <FormulaBlock formula={panel.formula} />
        <p className="text-justify text-[1.02rem] leading-8 text-slate-700">{panel.description}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Termo a termo
            </h4>
            <ul className="space-y-2">
              {panel.terms.map((term, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Interpretação
            </h4>
            <ul className="space-y-2">
              {panel.interpretation.map((line, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {panel.warning ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            {panel.warning}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function OpticsDiagram({ diagram }: { diagram: DiagramData }) {
  return (
    <div className="my-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">Diagrama visual: {diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>
      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[720px] rounded-2xl bg-white p-5">
          {diagram.kind === "concaveMirror" && <ConcaveMirrorDiagram />}
          {diagram.kind === "convexMirror" && <ConvexMirrorDiagram />}
          {diagram.kind === "convergingLens" && <ConvergingLensDiagram />}
          {diagram.kind === "divergingLens" && <DivergingLensDiagram />}
          {diagram.kind === "gaussSigns" && <GaussSignsDiagram />}
          {diagram.kind === "eyeDefects" && <EyeDefectsDiagram />}
        </div>
      </div>
    </div>
  );
}

function DiagramDefs() {
  return (
    <defs>
      <marker id="arrowBlue" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
      </marker>
      <marker id="arrowRed" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
      </marker>
      <marker id="arrowGreen" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#16a34a" />
      </marker>
    </defs>
  );
}

function ConcaveMirrorDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <DiagramDefs />
      <line x1="60" y1="165" x2="760" y2="165" stroke="#94a3b8" strokeWidth="3" />
      <path d="M650 70 Q590 165 650 260" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
      <line x1="200" y1="95" x2="200" y2="165" stroke="#0f172a" strokeWidth="5" />
      <polygon points="200,95 188,120 212,120" fill="#0f172a" />
      <text x="182" y="190" className="fill-slate-700 text-[15px] font-black">objeto</text>
      <circle cx="390" cy="165" r="7" fill="#9333ea" />
      <text x="380" y="190" className="fill-purple-700 text-[16px] font-black">C</text>
      <circle cx="520" cy="165" r="7" fill="#2563eb" />
      <text x="510" y="190" className="fill-blue-700 text-[16px] font-black">F</text>
      <circle cx="650" cy="165" r="7" fill="#0f172a" />
      <text x="642" y="190" className="fill-slate-700 text-[16px] font-black">V</text>
      <line x1="200" y1="95" x2="650" y2="95" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="650" y1="95" x2="520" y2="165" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="200" y1="95" x2="390" y2="165" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      <line x1="390" y1="165" x2="650" y2="260" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowGreen)" />
      <line x1="480" y1="128" x2="480" y2="165" stroke="#dc2626" strokeWidth="5" />
      <polygon points="480,165 468,140 492,140" fill="#dc2626" />
      <text x="432" y="118" className="fill-red-700 text-[14px] font-bold">imagem real invertida</text>
      <text x="85" y="45" className="fill-slate-950 text-[20px] font-black">Espelho côncavo: raios podem se encontrar de verdade</text>
    </svg>
  );
}

function ConvexMirrorDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <DiagramDefs />
      <line x1="60" y1="165" x2="760" y2="165" stroke="#94a3b8" strokeWidth="3" />
      <path d="M580 70 Q650 165 580 260" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
      <line x1="180" y1="90" x2="180" y2="165" stroke="#0f172a" strokeWidth="5" />
      <polygon points="180,90 168,115 192,115" fill="#0f172a" />
      <text x="162" y="190" className="fill-slate-700 text-[15px] font-black">objeto</text>
      <circle cx="580" cy="165" r="7" fill="#0f172a" />
      <text x="572" y="190" className="fill-slate-700 text-[16px] font-black">V</text>
      <circle cx="675" cy="165" r="7" fill="#2563eb" />
      <text x="666" y="190" className="fill-blue-700 text-[16px] font-black">F</text>
      <circle cx="750" cy="165" r="7" fill="#9333ea" />
      <text x="740" y="190" className="fill-purple-700 text-[16px] font-black">C</text>
      <line x1="180" y1="90" x2="580" y2="90" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="580" y1="90" x2="370" y2="55" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="580" y1="90" x2="675" y2="165" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <line x1="180" y1="120" x2="580" y2="165" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowGreen)" />
      <line x1="580" y1="165" x2="675" y2="165" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <line x1="635" y1="138" x2="635" y2="165" stroke="#dc2626" strokeWidth="5" />
      <polygon points="635,138 623,160 647,160" fill="#dc2626" />
      <text x="610" y="122" className="fill-red-700 text-[14px] font-bold">virtual direita menor</text>
      <text x="85" y="45" className="fill-slate-950 text-[20px] font-black">Espelho convexo: prolongamentos se cruzam atrás do espelho</text>
    </svg>
  );
}

function ConvergingLensDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <DiagramDefs />
      <line x1="60" y1="165" x2="760" y2="165" stroke="#94a3b8" strokeWidth="3" />
      <path d="M415 55 Q455 165 415 275 Q375 165 415 55" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <circle cx="415" cy="165" r="6" fill="#0f172a" />
      <text x="405" y="195" className="fill-slate-700 text-[15px] font-black">O</text>
      <circle cx="270" cy="165" r="7" fill="#2563eb" />
      <text x="260" y="192" className="fill-blue-700 text-[16px] font-black">F</text>
      <circle cx="560" cy="165" r="7" fill="#2563eb" />
      <text x="550" y="192" className="fill-blue-700 text-[16px] font-black">F'</text>
      <line x1="160" y1="85" x2="160" y2="165" stroke="#0f172a" strokeWidth="5" />
      <polygon points="160,85 148,112 172,112" fill="#0f172a" />
      <text x="142" y="192" className="fill-slate-700 text-[15px] font-black">objeto</text>
      <line x1="160" y1="85" x2="415" y2="85" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="415" y1="85" x2="560" y2="165" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="160" y1="85" x2="415" y2="165" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      <line x1="415" y1="165" x2="670" y2="245" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowGreen)" />
      <line x1="625" y1="205" x2="625" y2="165" stroke="#dc2626" strokeWidth="5" />
      <polygon points="625,205 613,180 637,180" fill="#dc2626" />
      <text x="590" y="232" className="fill-red-700 text-[14px] font-bold">imagem real invertida</text>
      <text x="85" y="45" className="fill-slate-950 text-[20px] font-black">Lente convergente: pode formar imagem real ou virtual</text>
    </svg>
  );
}

function DivergingLensDiagram() {
  return (
    <svg viewBox="0 0 820 330" className="h-auto w-full">
      <DiagramDefs />
      <line x1="60" y1="165" x2="760" y2="165" stroke="#94a3b8" strokeWidth="3" />
      <path d="M390 55 Q430 165 390 275 M440 55 Q400 165 440 275" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="415" cy="165" r="6" fill="#0f172a" />
      <text x="405" y="195" className="fill-slate-700 text-[15px] font-black">O</text>
      <circle cx="275" cy="165" r="7" fill="#2563eb" />
      <text x="265" y="192" className="fill-blue-700 text-[16px] font-black">F</text>
      <circle cx="555" cy="165" r="7" fill="#2563eb" />
      <text x="545" y="192" className="fill-blue-700 text-[16px] font-black">F'</text>
      <line x1="150" y1="85" x2="150" y2="165" stroke="#0f172a" strokeWidth="5" />
      <polygon points="150,85 138,112 162,112" fill="#0f172a" />
      <line x1="150" y1="85" x2="415" y2="85" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="415" y1="85" x2="635" y2="40" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="415" y1="85" x2="275" y2="165" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <line x1="150" y1="85" x2="415" y2="165" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      <line x1="415" y1="165" x2="635" y2="245" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowGreen)" />
      <line x1="245" y1="122" x2="245" y2="165" stroke="#dc2626" strokeWidth="5" />
      <polygon points="245,122 233,148 257,148" fill="#dc2626" />
      <text x="205" y="110" className="fill-red-700 text-[14px] font-bold">virtual direita menor</text>
      <text x="85" y="45" className="fill-slate-950 text-[20px] font-black">Lente divergente: espalha raios e gera imagem virtual</text>
    </svg>
  );
}

function GaussSignsDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="h-auto w-full">
      <rect x="60" y="50" width="320" height="200" rx="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
      <rect x="440" y="50" width="320" height="200" rx="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
      <text x="170" y="85" className="fill-slate-950 text-[22px] font-black">Espelhos</text>
      <text x="555" y="85" className="fill-slate-950 text-[22px] font-black">Lentes</text>
      <line x1="95" y1="150" x2="345" y2="150" stroke="#94a3b8" strokeWidth="3" />
      <path d="M295 90 Q250 150 295 210" fill="none" stroke="#0f172a" strokeWidth="5" />
      <text x="98" y="130" className="fill-emerald-700 text-[15px] font-bold">imagem real: p' &gt; 0</text>
      <text x="250" y="235" className="fill-red-700 text-[15px] font-bold">virtual: p' &lt; 0</text>
      <line x1="475" y1="150" x2="725" y2="150" stroke="#94a3b8" strokeWidth="3" />
      <path d="M600 80 Q640 150 600 220 Q560 150 600 80" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <text x="640" y="130" className="fill-emerald-700 text-[15px] font-bold">real: p' &gt; 0</text>
      <text x="475" y="235" className="fill-red-700 text-[15px] font-bold">virtual: p' &lt; 0</text>
      <text x="90" y="280" className="fill-slate-700 text-[15px] font-bold">Em ambos: convergente tem f &gt; 0; divergente tem f &lt; 0.</text>
    </svg>
  );
}

function EyeDefectsDiagram() {
  return (
    <svg viewBox="0 0 820 320" className="h-auto w-full">
      <DiagramDefs />
      <text x="140" y="35" className="fill-slate-950 text-[20px] font-black">Miopia</text>
      <text x="535" y="35" className="fill-slate-950 text-[20px] font-black">Hipermetropia</text>
      <ellipse cx="220" cy="160" rx="130" ry="80" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <path d="M330 95 Q365 160 330 225" fill="none" stroke="#0f172a" strokeWidth="5" />
      <line x1="70" y1="120" x2="245" y2="160" stroke="#2563eb" strokeWidth="4" markerEnd="url(#arrowBlue)" />
      <line x1="70" y1="200" x2="245" y2="160" stroke="#2563eb" strokeWidth="4" markerEnd="url(#arrowBlue)" />
      <circle cx="245" cy="160" r="7" fill="#dc2626" />
      <text x="205" y="255" className="fill-red-700 text-[14px] font-bold">foco antes da retina</text>
      <text x="145" y="285" className="fill-slate-700 text-[14px] font-bold">corrige com lente divergente</text>
      <ellipse cx="610" cy="160" rx="115" ry="78" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <path d="M708 98 Q735 160 708 222" fill="none" stroke="#0f172a" strokeWidth="5" />
      <line x1="470" y1="120" x2="760" y2="180" stroke="#16a34a" strokeWidth="4" markerEnd="url(#arrowGreen)" />
      <line x1="470" y1="200" x2="760" y2="140" stroke="#16a34a" strokeWidth="4" markerEnd="url(#arrowGreen)" />
      <circle cx="760" cy="160" r="7" fill="#dc2626" />
      <text x="655" y="255" className="fill-red-700 text-[14px] font-bold">foco depois da retina</text>
      <text x="535" y="285" className="fill-slate-700 text-[14px] font-bold">corrige com lente convergente</text>
    </svg>
  );
}

function ExampleCard({ example, index }: { example: Example; index: number }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
              Exemplo {index + 1} · {example.level}
            </p>
            <h3 className="mt-1 text-2xl font-black">{example.title}</h3>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black">
            resolvido
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 md:px-8 md:py-8">
        <div>
          <h4 className="text-base font-black text-slate-950">Enunciado</h4>
          <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-justify text-[1.02rem] leading-8 text-slate-700">
            {example.statement}
          </p>
        </div>

        <NoteCard title="Ideia antes da conta" type="info" body={example.idea} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="mb-4 text-base font-black text-slate-950">Desenvolvimento</h4>
          <div className="space-y-4">
            {example.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                  {stepIndex + 1}
                </div>
                <p className="pt-0.5 text-[1.02rem] leading-8 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {example.formulas.map((formula, formulaIndex) => (
            <FormulaBlock key={formulaIndex} formula={formula} />
          ))}
        </div>

        {example.notes ? (
          <div className="grid gap-4 md:grid-cols-2">
            {example.notes.map((note, noteIndex) => (
              <NoteCard key={noteIndex} title={note.title} type={note.type} body={note.body} />
            ))}
          </div>
        ) : null}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-8 text-emerald-950">
          {example.conclusion}
        </div>
      </div>
    </article>
  );
}

const mainFormulas: FormulaPanel[] = [
  {
    title: "Equação de Gauss",
    formula: String.raw`\frac{1}{f}=\frac{1}{p}+\frac{1}{p'}`,
    description:
      "Relaciona distância focal, posição do objeto e posição da imagem para espelhos gaussianos e lentes delgadas.",
    terms: [
      "f: distância focal do sistema óptico.",
      "p: distância do objeto ao espelho ou lente.",
      "p': distância da imagem ao espelho ou lente.",
    ],
    interpretation: [
      "p' positivo indica imagem real na convenção usual.",
      "p' negativo indica imagem virtual.",
      "O sinal de f separa sistemas convergentes e divergentes.",
    ],
    warning: "Use sinais desde o começo. A fórmula não perdoa chute otimista.",
  },
  {
    title: "Aumento linear transversal",
    formula: String.raw`A=\frac{i}{o}=-\frac{p'}{p}`,
    description:
      "Mede a orientação e o tamanho relativo da imagem em relação ao objeto.",
    terms: [
      "A: aumento linear transversal.",
      "i: tamanho da imagem.",
      "o: tamanho do objeto.",
      "p e p': posições do objeto e da imagem.",
    ],
    interpretation: [
      "A > 0: imagem direita.",
      "A < 0: imagem invertida.",
      "|A| > 1: imagem maior; |A| < 1: imagem menor.",
    ],
    warning: "Aumento positivo não significa imagem maior. O sinal indica orientação; o módulo indica tamanho.",
  },
  {
    title: "Vergência",
    formula: String.raw`V=\frac{1}{f}`,
    description:
      "Mede o poder óptico de uma lente. É o que aparece como grau dos óculos.",
    terms: [
      "V: vergência, em dioptrias.",
      "f: distância focal em metros.",
      "1 di = 1 m^{-1}.",
    ],
    interpretation: [
      "Lente convergente tem V positivo.",
      "Lente divergente tem V negativo.",
      "Quanto menor o módulo de f, maior o módulo da vergência.",
    ],
    warning: "Na vergência, f precisa estar em metros. Centímetros aqui fabricam desastre.",
  },
  {
    title: "Equação dos fabricantes de lentes",
    formula: String.raw`\frac{1}{f}=\left(\frac{n_{\text{lente}}}{n_{\text{meio}}}-1\right)\left(\frac{1}{R_1}-\frac{1}{R_2}\right)`,
    description:
      "Mostra como a distância focal depende do material da lente, do meio externo e da curvatura das faces.",
    terms: [
      "n_lente: índice de refração da lente.",
      "n_meio: índice de refração do meio externo.",
      "R1 e R2: raios de curvatura das faces.",
    ],
    interpretation: [
      "Lentes mais curvas tendem a ter maior vergência.",
      "Se o índice do meio se aproxima do índice da lente, o desvio diminui.",
      "A lente depende do conjunto: material + meio + geometria.",
    ],
  },
];

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "Contexto físico e importância do tema",
    accent: "bg-purple-700",
    paragraphs: [
      "Espelhos e lentes são sistemas ópticos usados para controlar a trajetória da luz. Eles aparecem em retrovisores, espelhos de maquiagem, projetores, câmeras, lupas, microscópios, telescópios, óculos, lentes de contato, olho humano e instrumentos ópticos de laboratório.",
      "O tema é central porque transforma as ideias básicas da Óptica Geométrica em sistemas capazes de formar imagens. Reflexão e refração deixam de ser leis isoladas e passam a produzir imagens reais, virtuais, direitas, invertidas, ampliadas ou reduzidas.",
      "Em provas difíceis, esse conteúdo cobra três camadas ao mesmo tempo: geometria dos raios, interpretação física da imagem e matemática da equação de Gauss. Quem tenta resolver só por fórmula acaba descobrindo que sinal também reprova gente, o que é triste, mas eficiente.",
    ],
    notes: [
      {
        title: "Pré-requisito natural",
        type: "info",
        body: "Esta página deve vir depois de fundamentos da Óptica: raio luminoso, imagem real e virtual, normal, reflexão, refração e Lei de Snell.",
      },
      {
        title: "Ideia-mãe",
        type: "success",
        body: "Espelhos e lentes reorganizam raios luminosos. A imagem é o resultado geométrico e físico dessa reorganização.",
      },
    ],
  },
  {
    id: 2,
    icon: Eye,
    title: "Formar imagem é reorganizar raios",
    accent: "bg-slate-950",
    paragraphs: [
      "Uma imagem se forma quando os raios vindos de um objeto chegam ao observador como se viessem de uma determinada posição. Se os raios realmente se cruzam, a imagem é real. Se apenas seus prolongamentos se cruzam, a imagem é virtual.",
      "Em espelhos, a imagem nasce da reflexão. A luz atinge a superfície refletora e volta para o mesmo meio. Em lentes, a imagem nasce da refração. A luz atravessa a lente, muda de meio e sofre desvios sucessivos.",
      "A pergunta mais importante é: os raios se cruzam de verdade ou apenas seus prolongamentos? Essa pergunta é melhor do que decorar frases soltas, porque funciona para espelhos, lentes e sistemas combinados.",
    ],
    bullets: [
      "Imagem real: raios reais se encontram; pode ser projetada em tela.",
      "Imagem virtual: apenas prolongamentos se encontram; pode ser vista, mas não projetada diretamente.",
      "Imagem direita: mantém a orientação do objeto.",
      "Imagem invertida: aparece do lado oposto do eixo em relação ao objeto.",
      "O módulo do aumento mede tamanho; o sinal do aumento mede orientação.",
    ],
  },
  {
    id: 3,
    icon: Orbit,
    title: "Espelhos esféricos: elementos e aproximação de Gauss",
    accent: "bg-blue-700",
    paragraphs: [
      "Um espelho esférico é uma parte de uma superfície esférica refletora. Se a superfície refletora está voltada para dentro, o espelho é côncavo. Se está voltada para fora, o espelho é convexo.",
      "Os elementos principais são o vértice V, o centro de curvatura C, o raio de curvatura R, o foco F, a distância focal f e o eixo principal. Para espelhos esféricos gaussianos, vale f = R/2.",
      "Essa relação não é mágica universal para qualquer raio. Ela vale na aproximação de Gauss, isto é, para raios próximos do eixo principal e com pequenos ângulos. Raios muito afastados geram aberração esférica.",
    ],
    formulas: [
      {
        title: "Relação entre foco e raio de curvatura",
        formula: String.raw`f=\frac{R}{2}`,
        description:
          "Em espelhos esféricos gaussianos, o foco fica no ponto médio entre o vértice e o centro de curvatura.",
        terms: ["f: distância focal.", "R: raio de curvatura do espelho.", "C: centro da esfera que origina o espelho."],
        interpretation: ["Vale para raios paraxiais.", "Ajuda a marcar F e C corretamente nos desenhos."],
      },
    ],
  },
  {
    id: 4,
    icon: CircleDot,
    title: "Espelho côncavo",
    accent: "bg-indigo-800",
    paragraphs: [
      "O espelho côncavo é convergente. Raios paralelos ao eixo principal refletem passando pelo foco real, localizado na frente do espelho. Por isso, na convenção de Gauss, seu foco é positivo.",
      "Ele é conceitualmente perigoso porque muda completamente o tipo de imagem conforme a posição do objeto. Pode formar imagem real, virtual, maior, menor, igual, direita ou invertida.",
      "Os raios notáveis são: raio paralelo reflete pelo foco; raio que passa pelo foco reflete paralelo; raio que passa pelo centro de curvatura volta sobre si mesmo; raio no vértice reflete simetricamente em relação ao eixo principal.",
    ],
    diagram: {
      kind: "concaveMirror",
      title: "espelho côncavo",
      caption: "Quando os raios refletidos se cruzam na frente do espelho, a imagem é real e invertida.",
    },
    bullets: [
      "Objeto além de C: imagem real, invertida e menor, entre C e F.",
      "Objeto em C: imagem real, invertida e igual, em C.",
      "Objeto entre C e F: imagem real, invertida e maior, além de C.",
      "Objeto em F: raios saem paralelos; imagem no infinito.",
      "Objeto entre F e V: imagem virtual, direita e maior, atrás do espelho.",
    ],
    notes: [
      {
        title: "Aplicação típica",
        type: "success",
        body: "Espelhos de maquiagem e barbear usam o objeto dentro da distância focal para formar imagem virtual, direita e ampliada.",
      },
    ],
  },
  {
    id: 5,
    icon: CircleDot,
    title: "Espelho convexo",
    accent: "bg-cyan-700",
    paragraphs: [
      "O espelho convexo é divergente. Raios paralelos ao eixo principal refletem se afastando, como se viessem de um foco virtual atrás do espelho. Seu foco é negativo na convenção de Gauss.",
      "Para objeto real, o espelho convexo sempre forma imagem virtual, direita e menor. Isso acontece porque os raios refletidos divergem; apenas seus prolongamentos se encontram atrás do espelho.",
      "Ele é usado quando queremos aumentar o campo visual, como em retrovisores, corredores, lojas, garagens e esquinas. Campo visual maior, porém, não significa imagem maior. O espelho convexo mostra mais região, mas reduz os objetos.",
    ],
    diagram: {
      kind: "convexMirror",
      title: "espelho convexo",
      caption: "A imagem de um objeto real fica atrás do espelho, entre o foco virtual e o vértice.",
    },
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Retrovisor convexo aumenta o campo visual, mas diminui o tamanho aparente dos objetos. Por isso objetos podem parecer mais distantes do que realmente estão.",
      },
    ],
  },
  {
    id: 6,
    icon: Glasses,
    title: "Lentes delgadas: convergentes e divergentes",
    accent: "bg-emerald-700",
    paragraphs: [
      "Uma lente é um sistema transparente limitado por duas superfícies, das quais pelo menos uma é curva. Ela modifica a trajetória da luz por refração, não por reflexão.",
      "A lente delgada é uma aproximação em que a espessura da lente é pequena diante das distâncias relevantes. Isso permite usar raios notáveis, equação de Gauss e aumento linear com boa precisão para raios paraxiais.",
      "Uma lente convergente aproxima raios e tem foco positivo. Uma lente divergente espalha raios e tem foco negativo. Mas esse comportamento depende do índice da lente em relação ao meio externo, não apenas do formato visual.",
    ],
    notes: [
      {
        title: "Dependência do meio",
        type: "info",
        body: "Uma lente pode ter sua potência reduzida ou até mudar de comportamento se for colocada em um meio cujo índice de refração se aproxime ou ultrapasse o índice da lente.",
      },
    ],
  },
  {
    id: 7,
    icon: Glasses,
    title: "Lente convergente",
    accent: "bg-blue-800",
    paragraphs: [
      "A lente convergente tende a aproximar os raios luminosos. No ar, geralmente é mais espessa no centro do que nas bordas. Para objeto real, ela pode formar imagem real ou virtual, dependendo da posição do objeto.",
      "Os raios notáveis são: raio paralelo ao eixo refrata passando pelo foco imagem; raio que passa pelo foco objeto emerge paralelo; raio que passa pelo centro óptico segue praticamente sem desvio.",
      "Quando o objeto está além do foco, a imagem costuma ser real e invertida. Quando o objeto está entre o foco e a lente, a imagem é virtual, direita e ampliada. Esse é o caso da lupa.",
    ],
    diagram: {
      kind: "convergingLens",
      title: "lente convergente",
      caption: "Para objeto além da distância focal, os raios refratados podem se cruzar do outro lado da lente.",
    },
    bullets: [
      "Objeto além de 2f: imagem real, invertida e menor.",
      "Objeto em 2f: imagem real, invertida e igual.",
      "Objeto entre 2f e f: imagem real, invertida e maior.",
      "Objeto em f: imagem no infinito; raios emergem paralelos.",
      "Objeto entre f e a lente: imagem virtual, direita e maior.",
    ],
  },
  {
    id: 8,
    icon: Glasses,
    title: "Lente divergente",
    accent: "bg-slate-950",
    paragraphs: [
      "A lente divergente espalha os raios luminosos. Para objeto real, ela sempre forma imagem virtual, direita e menor, localizada do mesmo lado do objeto.",
      "Os raios emergentes não se cruzam do outro lado da lente. O observador prolonga esses raios para trás, e os prolongamentos indicam a posição da imagem virtual.",
      "Esse comportamento é usado na correção da miopia. A lente divergente espalha previamente os raios, permitindo que o olho focalize a imagem sobre a retina.",
    ],
    diagram: {
      kind: "divergingLens",
      title: "lente divergente",
      caption: "Para objeto real, a imagem fica virtual, direita e menor no mesmo lado do objeto.",
    },
  },
  {
    id: 9,
    icon: Calculator,
    title: "Referencial de Gauss, sinais e fórmulas principais",
    accent: "bg-red-700",
    paragraphs: [
      "A equação de Gauss é curta. O problema é o sinal. Em espelhos e lentes, o aluno precisa interpretar p, p', f e A com consistência. Trocar convenção no meio da questão é o jeito mais elegante de produzir uma resposta errada com aparência de matemática séria.",
      "Para espelhos: objeto real na frente do espelho tem p > 0; imagem real na frente tem p' > 0; imagem virtual atrás tem p' < 0; espelho côncavo tem f > 0; espelho convexo tem f < 0.",
      "Para lentes: objeto real antes da lente tem p > 0; imagem real do outro lado tem p' > 0; imagem virtual do mesmo lado do objeto tem p' < 0; lente convergente tem f > 0; lente divergente tem f < 0.",
    ],
    diagram: {
      kind: "gaussSigns",
      title: "sinais de Gauss",
      caption: "Os sinais indicam natureza da imagem e tipo de sistema. O desenho ajuda a não se perder.",
    },
    formulas: mainFormulas,
  },
  {
    id: 10,
    icon: ScanEye,
    title: "Equação dos fabricantes e vergência",
    accent: "bg-purple-700",
    paragraphs: [
      "A vergência mede o poder óptico de uma lente. Quanto menor a distância focal em módulo, maior a capacidade da lente de convergir ou divergir raios. É a ideia por trás do grau dos óculos.",
      "A equação dos fabricantes mostra que a distância focal depende do material da lente, do meio externo e da curvatura das faces. Isso impede aquela ideia preguiçosa de que lente é convergente apenas porque parece convexa.",
      "Em geral, lentes mais curvas têm maior vergência. Se o índice do meio externo se aproxima do índice da lente, a refração diminui e a lente perde potência.",
    ],
    formulas: [mainFormulas[2], mainFormulas[3]],
  },
  {
    id: 11,
    icon: Eye,
    title: "Olho humano, miopia e hipermetropia",
    accent: "bg-indigo-800",
    paragraphs: [
      "O olho humano funciona como um sistema óptico convergente. A córnea e o cristalino refratam a luz para formar uma imagem real, invertida e reduzida sobre a retina.",
      "O cristalino realiza acomodação visual: altera sua curvatura para ajustar a distância focal do olho. Para objetos distantes, fica menos curvo. Para objetos próximos, fica mais curvo.",
      "Na miopia, a imagem de objetos distantes se forma antes da retina. Corrige-se com lente divergente. Na hipermetropia, a imagem tenderia a se formar depois da retina. Corrige-se com lente convergente.",
    ],
    diagram: {
      kind: "eyeDefects",
      title: "miopia e hipermetropia",
      caption: "A lente corretiva desloca a formação da imagem para a retina.",
    },
    bullets: [
      "Miopia: dificuldade para longe; imagem antes da retina; lente divergente; vergência negativa.",
      "Hipermetropia: dificuldade para perto; imagem depois da retina; lente convergente; vergência positiva.",
      "Presbiopia: perda de acomodação com a idade; geralmente exige lente convergente para perto.",
      "Astigmatismo: curvaturas diferentes em direções diferentes; correção com lentes cilíndricas.",
    ],
  },
  {
    id: 12,
    icon: Telescope,
    title: "Instrumentos ópticos",
    accent: "bg-cyan-700",
    paragraphs: [
      "Instrumentos ópticos usam lentes e espelhos para formar imagens com finalidades específicas. O objetivo aqui não é estudar cada instrumento com profundidade máxima, mas entender como o conteúdo desta página vira tecnologia.",
      "A lupa usa lente convergente com objeto dentro da distância focal e forma imagem virtual, direita e ampliada. A câmera usa lente convergente para formar imagem real, invertida e reduzida no sensor. O projetor usa lente convergente para formar imagem real, invertida e ampliada em uma tela.",
      "Microscópios combinam lentes convergentes para ampliar objetos pequenos. Telescópios usam lentes ou espelhos para coletar luz de objetos distantes e ampliar a imagem angular. Espelhos côncavos são muito usados em telescópios refletores porque evitam problemas cromáticos típicos de lentes grandes.",
    ],
    bullets: [
      "Lupa: lente convergente; imagem virtual, direita e ampliada.",
      "Câmera: lente convergente; imagem real, invertida e reduzida.",
      "Projetor: lente convergente; imagem real, invertida e ampliada.",
      "Microscópio: objetiva forma imagem real ampliada; ocular atua como lupa.",
      "Telescópio: lentes ou espelhos para coletar luz e ampliar imagem angular.",
    ],
  },
];

const examples: Example[] = [
  {
    id: "espelho-concavo",
    title: "Espelho côncavo simples",
    level: "Gauss + classificação",
    statement:
      "Um objeto é colocado a 30 cm de um espelho côncavo de distância focal 10 cm. Determine a posição da imagem e classifique-a.",
    idea:
      "Como o espelho é côncavo, f é positivo. O objeto está além de 2f, então esperamos imagem real, invertida e menor entre F e C.",
    steps: [
      "Use f = 10 cm e p = 30 cm.",
      "Pela equação de Gauss: 1/f = 1/p + 1/p'.",
      "Substituindo: 1/10 = 1/30 + 1/p'.",
      "Logo: 1/p' = 1/10 - 1/30 = 2/30 = 1/15.",
      "Portanto, p' = 15 cm.",
      "Como p' > 0, a imagem é real. Como o objeto está além de C, a imagem é invertida e menor.",
    ],
    formulas: [String.raw`\frac{1}{10}=\frac{1}{30}+\frac{1}{p'}`, String.raw`p'=15\,\text{cm}`],
    conclusion: "A imagem se forma a 15 cm na frente do espelho. Ela é real, invertida e menor.",
  },
  {
    id: "espelho-convexo",
    title: "Espelho convexo",
    level: "sinal de f e aumento",
    statement:
      "Um objeto é colocado a 40 cm de um espelho convexo cuja distância focal tem módulo 20 cm. Determine a posição da imagem e classifique-a.",
    idea:
      "Espelho convexo tem f negativo. Para objeto real, esperamos imagem virtual, direita e menor atrás do espelho.",
    steps: [
      "Use f = -20 cm e p = 40 cm.",
      "Pela equação de Gauss: 1/(-20) = 1/40 + 1/p'.",
      "Então: 1/p' = -1/20 - 1/40 = -3/40.",
      "Logo: p' = -40/3 cm, aproximadamente -13,3 cm.",
      "O aumento é A = -p'/p = -(-13,3)/40 ≈ 0,33.",
      "Como p' < 0, a imagem é virtual. Como A > 0, é direita. Como |A| < 1, é menor.",
    ],
    formulas: [String.raw`p'=-\frac{40}{3}\,\text{cm}`, String.raw`A\approx 0{,}33`],
    conclusion: "A imagem está cerca de 13,3 cm atrás do espelho. Ela é virtual, direita e menor.",
  },
  {
    id: "lente-convergente",
    title: "Lente convergente",
    level: "posição, tamanho e orientação",
    statement:
      "Um objeto de altura 4 cm é colocado a 30 cm de uma lente convergente de distância focal 10 cm. Determine a posição, o tamanho e a orientação da imagem.",
    idea:
      "A lente é convergente, então f > 0. Como p > 2f, esperamos imagem real, invertida e menor do outro lado da lente.",
    steps: [
      "Use f = 10 cm, p = 30 cm e o = 4 cm.",
      "Pela equação de Gauss: 1/10 = 1/30 + 1/p'.",
      "Logo: 1/p' = 1/15, então p' = 15 cm.",
      "O aumento é A = -p'/p = -15/30 = -0,5.",
      "Como i = Ao, temos i = (-0,5)(4) = -2 cm.",
      "O sinal negativo indica imagem invertida; o módulo 2 cm indica altura da imagem.",
    ],
    formulas: [String.raw`p'=15\,\text{cm}`, String.raw`A=-0{,}5`, String.raw`i=-2\,\text{cm}`],
    conclusion: "A imagem se forma 15 cm do outro lado da lente. Ela é real, invertida e menor, com altura de 2 cm.",
  },
  {
    id: "lente-divergente",
    title: "Lente divergente",
    level: "imagem virtual",
    statement:
      "Um objeto é colocado a 30 cm de uma lente divergente de distância focal -15 cm. Determine a posição da imagem e sua classificação.",
    idea:
      "Lente divergente tem f negativo. Para objeto real, a imagem deve ser virtual, direita e menor.",
    steps: [
      "Use f = -15 cm e p = 30 cm.",
      "Pela equação de Gauss: 1/(-15) = 1/30 + 1/p'.",
      "Então: 1/p' = -1/15 - 1/30 = -3/30 = -1/10.",
      "Logo: p' = -10 cm.",
      "O aumento é A = -p'/p = -(-10)/30 = 1/3.",
      "Como p' < 0, a imagem é virtual. Como A > 0, é direita. Como |A| < 1, é menor.",
    ],
    formulas: [String.raw`p'=-10\,\text{cm}`, String.raw`A=\frac{1}{3}`],
    conclusion: "A imagem se forma 10 cm da lente, do mesmo lado do objeto. Ela é virtual, direita e menor.",
  },
  {
    id: "lupa",
    title: "Lupa: objeto dentro do foco",
    level: "caso que aluno mais confunde",
    statement:
      "Uma lente convergente de distância focal 12 cm é usada como lupa. Um objeto é colocado a 8 cm da lente. Determine a posição da imagem e classifique-a.",
    idea:
      "Como o objeto está entre o foco e a lente, a lente convergente forma imagem virtual, direita e ampliada. Esse é o caso típico da lupa.",
    steps: [
      "Use f = 12 cm e p = 8 cm.",
      "Pela equação de Gauss: 1/12 = 1/8 + 1/p'.",
      "Então: 1/p' = 1/12 - 1/8 = 2/24 - 3/24 = -1/24.",
      "Logo: p' = -24 cm.",
      "O aumento é A = -p'/p = -(-24)/8 = 3.",
      "Como p' < 0, a imagem é virtual. Como A > 0, é direita. Como |A| > 1, é ampliada.",
    ],
    formulas: [String.raw`p'=-24\,\text{cm}`, String.raw`A=3`],
    conclusion: "A imagem fica 24 cm do mesmo lado do objeto. Ela é virtual, direita e três vezes maior.",
  },
  {
    id: "oculos-vergencia",
    title: "Óculos e vergência",
    level: "aplicação direta",
    statement:
      "Uma lente corretiva possui vergência V = -2,5 di. Determine sua distância focal e diga que tipo de defeito visual ela pode corrigir.",
    idea:
      "Vergência negativa indica lente divergente. Lentes divergentes corrigem miopia.",
    steps: [
      "Use V = 1/f, com f em metros.",
      "Como V = -2,5 m^{-1}, temos f = 1/V.",
      "Logo: f = 1/(-2,5) = -0,4 m.",
      "O sinal negativo indica lente divergente.",
      "Como lente divergente corrige miopia, essa lente pode ser usada para um olho míope.",
    ],
    formulas: [String.raw`f=\frac{1}{-2{,}5}`, String.raw`f=-0{,}4\,\text{m}`],
    conclusion: "A distância focal é -0,4 m. A lente é divergente e pode corrigir miopia.",
  },
];

const traps = [
  "Esquecer que espelho convexo e lente divergente têm f negativo.",
  "Achar que p' negativo significa que a conta deu errado. Na verdade, indica imagem virtual.",
  "Confundir imagem virtual com imagem inexistente.",
  "Achar que aumento positivo significa imagem maior. O sinal indica orientação; o módulo indica tamanho.",
  "Usar centímetros na vergência. Em V = 1/f, o foco deve estar em metros.",
  "Achar que lente convergente sempre forma imagem real. A lupa é o contraexemplo clássico.",
  "Achar que espelho côncavo sempre forma imagem real. Dentro do foco, ele forma imagem virtual e ampliada.",
  "Confundir foco com centro de curvatura. Em espelhos esféricos, f = R/2.",
  "Resolver sem desenho. Em Óptica, isso é pedir para o sinal te humilhar.",
];

const checklist = [
  "Sei diferenciar imagem real e virtual pelos raios?",
  "Sei desenhar raios notáveis em espelhos e lentes?",
  "Sei classificar espelho côncavo e convexo?",
  "Sei classificar lente convergente e divergente?",
  "Sei usar a equação de Gauss com sinais?",
  "Sei interpretar p', f e A?",
  "Sei calcular vergência com f em metros?",
  "Sei explicar miopia e hipermetropia?",
  "Sei resolver o caso da lupa?",
  "Sei conferir se o resultado combina com o desenho?",
];

export default function OpticaTopicLentes() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-5">
            <Link href="/optica" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:text-blue-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                ÓPTICA
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Lentes e Espelhos Esféricos
              </h1>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {[
              { id: "teoria", label: "Teoria" },
              { id: "exemplos", label: "Exemplos" },
              { id: "resumo", label: "Resumo" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`rounded-full px-7 py-3 text-lg font-black transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container py-10 md:py-12">
        <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                <Sparkles className="h-4 w-4" />
                teoria completa
              </div>

              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                Imagem não é mágica: é encontro de raios ou de prolongamentos.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Espelhos formam imagens por reflexão. Lentes formam imagens por refração. A equação de Gauss organiza as contas, mas o desenho dos raios decide o sentido físico.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções" },
                { value: String(examples.length), label: "Exemplos" },
                { value: "6", label: "Diagramas" },
                { value: "ITA", label: "Foco" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <p className="text-4xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-3 overflow-x-auto md:hidden">
          {[
            { id: "teoria", label: "Teoria" },
            { id: "exemplos", label: "Exemplos" },
            { id: "resumo", label: "Resumo" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
                activeTab === tab.id ? "bg-slate-950 text-white" : "bg-white text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "teoria" ? (
          <div className="mt-10 space-y-8">
            {theorySections.map((section) => (
              <TheorySectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : null}

        {activeTab === "exemplos" ? (
          <div className="mt-10 space-y-8">
            {examples.map((example, index) => (
              <ExampleCard key={example.id} example={example} index={index} />
            ))}
          </div>
        ) : null}

        {activeTab === "resumo" ? (
          <div className="mt-10 space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-slate-950 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Target className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Resumo estratégico</h2>
                </div>
              </div>

              <div className="space-y-7 px-7 py-7 md:px-9 md:py-9">
                <p className="text-justify text-[1.06rem] leading-9 text-slate-700">
                  Lentes e espelhos esféricos reorganizam raios luminosos. Se os raios realmente se cruzam, a imagem é real. Se apenas os prolongamentos se cruzam, a imagem é virtual. A equação de Gauss calcula posições; o aumento interpreta orientação e tamanho; a vergência mede poder óptico.
                </p>

                <div className="grid gap-6 lg:grid-cols-2">
                  {mainFormulas.map((panel) => (
                    <FormulaPanelCard key={panel.title} panel={panel} />
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-red-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Armadilhas clássicas</h2>
                </div>
              </div>
              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {traps.map((trap, index) => (
                  <div key={index} className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-700" />
                    <p className="text-[1.01rem] leading-7 text-slate-700">{trap}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-blue-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-7 w-7" />
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">Checklist de domínio</h2>
                </div>
              </div>
              <div className="grid gap-4 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {checklist.map((item, index) => (
                  <div key={index} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                    <p className="text-[1.01rem] leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
