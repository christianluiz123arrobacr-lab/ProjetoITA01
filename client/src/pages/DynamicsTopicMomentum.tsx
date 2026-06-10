import { useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Compass,
  Gauge,
  GitBranch,
  Layers,
  Lightbulb,
  MoveRight,
  Repeat,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success" | "danger";
type DiagramKind =
  | "momentumVector"
  | "impulseGraph"
  | "inelastic"
  | "elastic"
  | "explosion"
  | "bidimensional"
  | "wall"
  | "ballistic"
  | "systemChoice";

type FormulaSummary = {
  title: string;
  formula: string;
  explanation: string[];
  warning?: string;
};

type TheorySection = {
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  bullets?: string[];
  formulas?: FormulaSummary[];
  diagram?: {
    kind: DiagramKind;
    title: string;
    caption: string;
  };
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

type ExampleStep = {
  text?: string;
  formula?: string;
};

type ExampleItem = {
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: ExampleStep[];
  answer: string;
  test: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "teoria", label: "Teoria" },
  { id: "exemplos", label: "Exemplos" },
  { id: "resumo", label: "Resumo" },
];

function MathDisplay({ formula }: { formula: string }) {
  return (
    <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
      <MathFormula formula={formula} display={true} />
    </div>
  );
}

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <MathDisplay formula={formula} />
    </div>
  );
}

function InlineFormula({ formula }: { formula: string }) {
  return (
    <span className="mx-1 inline-flex items-center rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 align-middle text-slate-100 [&_.katex]:text-slate-100">
      <MathFormula formula={formula} inline={true} />
    </span>
  );
}

function NoteBox({
  title,
  body,
  type,
}: {
  title: string;
  body: string;
  type: NoteType;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    danger: "border-rose-200 bg-rose-50 text-rose-950",
  } as const;

  return (
    <div className={`rounded-2xl border p-5 ${styles[type]}`}>
      <p className="mb-2 font-black">{title}</p>
      <p className="leading-7">{body}</p>
    </div>
  );
}

function FormulaCard({ formula }: { formula: FormulaSummary }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-black text-slate-950">{formula.title}</h3>
      <FormulaBlock formula={formula.formula} />
      <div className="space-y-3 leading-7 text-slate-700">
        {formula.explanation.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
      {formula.warning && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Cuidado:</strong> {formula.warning}
        </div>
      )}
    </div>
  );
}

function DiagramShell({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-inner md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-violet-600" />
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">
          {title}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
        {children}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{caption}</p>
    </div>
  );
}

function Diagram({ kind, title, caption }: { kind: DiagramKind; title: string; caption: string }) {
  if (kind === "momentumVector") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 280" className="h-auto w-full" role="img" aria-label="Momentum vetorial">
          <defs>
            <marker id="arrowMomentum" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
            </marker>
            <marker id="arrowNegative" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#e11d48" />
            </marker>
          </defs>
          <rect x="45" y="135" width="670" height="6" rx="3" fill="#cbd5e1" />
          <text x="690" y="123" fill="#475569" fontSize="18" fontWeight="700">+x</text>
          <circle cx="210" cy="138" r="34" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
          <text x="190" y="145" fill="#4c1d95" fontSize="18" fontWeight="900">m</text>
          <line x1="250" y1="138" x2="405" y2="138" stroke="#7c3aed" strokeWidth="8" markerEnd="url(#arrowMomentum)" />
          <text x="286" y="116" fill="#4c1d95" fontSize="20" fontWeight="900">v &gt; 0</text>
          <text x="278" y="180" fill="#4c1d95" fontSize="20" fontWeight="900">p = +mv</text>

          <circle cx="565" cy="138" r="34" fill="#ffe4e6" stroke="#e11d48" strokeWidth="4" />
          <text x="546" y="145" fill="#881337" fontSize="18" fontWeight="900">m</text>
          <line x1="525" y1="138" x2="375" y2="138" stroke="#e11d48" strokeWidth="8" markerEnd="url(#arrowNegative)" />
          <text x="410" y="95" fill="#881337" fontSize="20" fontWeight="900">v &lt; 0</text>
          <text x="405" y="222" fill="#881337" fontSize="20" fontWeight="900">p = -mv</text>
          <text x="75" y="55" fill="#0f172a" fontSize="24" fontWeight="900">O sinal não é detalhe: é direção física.</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "impulseGraph") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 320" className="h-auto w-full" role="img" aria-label="Impulso como área no gráfico F por t">
          <defs>
            <marker id="axisArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
            </marker>
          </defs>
          <line x1="90" y1="260" x2="690" y2="260" stroke="#334155" strokeWidth="3" markerEnd="url(#axisArrow)" />
          <line x1="90" y1="260" x2="90" y2="50" stroke="#334155" strokeWidth="3" markerEnd="url(#axisArrow)" />
          <text x="700" y="266" fill="#334155" fontSize="18" fontWeight="900">t</text>
          <text x="70" y="45" fill="#334155" fontSize="18" fontWeight="900">F</text>
          <path d="M 130 260 L 340 80 L 550 260 Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="5" />
          <text x="285" y="178" fill="#4c1d95" fontSize="24" fontWeight="900">área = impulso</text>
          <text x="292" y="210" fill="#4c1d95" fontSize="22" fontWeight="900">I = Δp</text>
          <line x1="340" y1="260" x2="340" y2="80" stroke="#a78bfa" strokeDasharray="8 8" strokeWidth="3" />
          <text x="320" y="55" fill="#4c1d95" fontSize="18" fontWeight="900">Fmáx</text>
          <text x="118" y="285" fill="#334155" fontSize="16" fontWeight="800">0</text>
          <text x="525" y="285" fill="#334155" fontSize="16" fontWeight="800">Δt</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "inelastic") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 330" className="h-auto w-full" role="img" aria-label="Colisão perfeitamente inelástica">
          <defs>
            <marker id="purpleArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
            </marker>
          </defs>
          <text x="70" y="50" fill="#0f172a" fontSize="24" fontWeight="900">Antes</text>
          <rect x="80" y="105" width="110" height="70" rx="14" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
          <text x="115" y="147" fill="#4c1d95" fontSize="19" fontWeight="900">m₁</text>
          <line x1="205" y1="140" x2="320" y2="140" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#purpleArrow)" />
          <text x="230" y="120" fill="#4c1d95" fontSize="18" fontWeight="900">v₁ᵢ</text>
          <rect x="395" y="105" width="120" height="70" rx="14" fill="#ecfeff" stroke="#0891b2" strokeWidth="4" />
          <text x="430" y="147" fill="#155e75" fontSize="19" fontWeight="900">m₂</text>
          <text x="422" y="198" fill="#155e75" fontSize="16" fontWeight="800">parado</text>

          <line x1="80" y1="232" x2="680" y2="232" stroke="#cbd5e1" strokeWidth="4" />
          <text x="70" y="286" fill="#0f172a" fontSize="24" fontWeight="900">Depois</text>
          <rect x="345" y="242" width="200" height="62" rx="14" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="4" />
          <text x="385" y="280" fill="#4c1d95" fontSize="20" fontWeight="900">m₁ + m₂</text>
          <line x1="560" y1="273" x2="675" y2="273" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#purpleArrow)" />
          <text x="595" y="252" fill="#4c1d95" fontSize="18" fontWeight="900">vf</text>
          <text x="300" y="220" fill="#881337" fontSize="18" fontWeight="900">grudam: mesma velocidade final</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "elastic") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 320" className="h-auto w-full" role="img" aria-label="Colisão elástica com massas iguais">
          <defs>
            <marker id="blueArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
            </marker>
          </defs>
          <text x="70" y="50" fill="#0f172a" fontSize="24" fontWeight="900">Massas iguais: troca de velocidades</text>
          <circle cx="170" cy="125" r="36" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
          <circle cx="470" cy="125" r="36" fill="#f1f5f9" stroke="#64748b" strokeWidth="4" />
          <text x="158" y="132" fill="#1e3a8a" fontSize="20" fontWeight="900">m</text>
          <text x="458" y="132" fill="#334155" fontSize="20" fontWeight="900">m</text>
          <line x1="215" y1="125" x2="335" y2="125" stroke="#2563eb" strokeWidth="7" markerEnd="url(#blueArrow)" />
          <text x="245" y="100" fill="#1e3a8a" fontSize="18" fontWeight="900">v</text>
          <text x="435" y="185" fill="#334155" fontSize="16" fontWeight="800">repouso</text>

          <line x1="80" y1="218" x2="680" y2="218" stroke="#cbd5e1" strokeWidth="4" />
          <circle cx="245" cy="255" r="34" fill="#f1f5f9" stroke="#64748b" strokeWidth="4" />
          <circle cx="470" cy="255" r="34" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
          <text x="232" y="262" fill="#334155" fontSize="20" fontWeight="900">m</text>
          <text x="458" y="262" fill="#1e3a8a" fontSize="20" fontWeight="900">m</text>
          <line x1="515" y1="255" x2="645" y2="255" stroke="#2563eb" strokeWidth="7" markerEnd="url(#blueArrow)" />
          <text x="552" y="238" fill="#1e3a8a" fontSize="18" fontWeight="900">v</text>
          <text x="208" y="302" fill="#334155" fontSize="16" fontWeight="800">parou</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "explosion") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 320" className="h-auto w-full" role="img" aria-label="Explosão com momentum total zero">
          <defs>
            <marker id="redLeft" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#e11d48" />
            </marker>
            <marker id="greenRight" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
            </marker>
          </defs>
          <text x="75" y="55" fill="#0f172a" fontSize="24" fontWeight="900">Sistema inicialmente em repouso</text>
          <rect x="320" y="90" width="120" height="80" rx="18" fill="#f8fafc" stroke="#64748b" strokeWidth="4" />
          <text x="345" y="137" fill="#334155" fontSize="20" fontWeight="900">Ptotal=0</text>
          <path d="M 360 192 L 340 225 L 378 213 L 400 245 L 410 207 L 448 220 L 425 190" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
          <circle cx="265" cy="250" r="32" fill="#ffe4e6" stroke="#e11d48" strokeWidth="4" />
          <circle cx="500" cy="250" r="42" fill="#dcfce7" stroke="#059669" strokeWidth="4" />
          <line x1="235" y1="250" x2="105" y2="250" stroke="#e11d48" strokeWidth="7" markerEnd="url(#redLeft)" />
          <line x1="545" y1="250" x2="675" y2="250" stroke="#059669" strokeWidth="7" markerEnd="url(#greenRight)" />
          <text x="100" y="228" fill="#881337" fontSize="18" fontWeight="900">p₁</text>
          <text x="642" y="228" fill="#065f46" fontSize="18" fontWeight="900">p₂</text>
          <text x="275" y="304" fill="#0f172a" fontSize="19" fontWeight="900">p₁ + p₂ = 0</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "bidimensional") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 340" className="h-auto w-full" role="img" aria-label="Colisão bidimensional">
          <defs>
            <marker id="axis2D" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
            </marker>
            <marker id="vec2D" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
            </marker>
          </defs>
          <line x1="110" y1="270" x2="690" y2="270" stroke="#334155" strokeWidth="3" markerEnd="url(#axis2D)" />
          <line x1="160" y1="300" x2="160" y2="45" stroke="#334155" strokeWidth="3" markerEnd="url(#axis2D)" />
          <text x="700" y="276" fill="#334155" fontSize="18" fontWeight="900">x</text>
          <text x="145" y="40" fill="#334155" fontSize="18" fontWeight="900">y</text>
          <circle cx="235" cy="270" r="26" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
          <line x1="265" y1="270" x2="400" y2="270" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#vec2D)" />
          <text x="295" y="248" fill="#4c1d95" fontSize="18" fontWeight="900">p antes</text>
          <circle cx="430" cy="180" r="24" fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
          <circle cx="445" cy="300" r="24" fill="#fee2e2" stroke="#dc2626" strokeWidth="4" />
          <line x1="405" y1="270" x2="545" y2="150" stroke="#2563eb" strokeWidth="7" markerEnd="url(#vec2D)" />
          <line x1="405" y1="270" x2="560" y2="318" stroke="#dc2626" strokeWidth="7" markerEnd="url(#vec2D)" />
          <line x1="545" y1="150" x2="545" y2="270" stroke="#93c5fd" strokeDasharray="8 8" strokeWidth="3" />
          <line x1="560" y1="318" x2="560" y2="270" stroke="#fecaca" strokeDasharray="8 8" strokeWidth="3" />
          <text x="575" y="150" fill="#1e3a8a" fontSize="18" fontWeight="900">p₁</text>
          <text x="590" y="318" fill="#991b1b" fontSize="18" fontWeight="900">p₂</text>
          <text x="245" y="85" fill="#0f172a" fontSize="22" fontWeight="900">Conserve x e y separadamente.</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "wall") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 300" className="h-auto w-full" role="img" aria-label="Colisão com parede e restituição">
          <defs>
            <marker id="towall" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
            </marker>
            <marker id="fromwall" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#e11d48" />
            </marker>
          </defs>
          <rect x="615" y="45" width="28" height="210" fill="#475569" />
          <g stroke="#94a3b8" strokeWidth="4">
            <line x1="640" y1="55" x2="690" y2="25" />
            <line x1="640" y1="95" x2="690" y2="65" />
            <line x1="640" y1="135" x2="690" y2="105" />
            <line x1="640" y1="175" x2="690" y2="145" />
            <line x1="640" y1="215" x2="690" y2="185" />
            <line x1="640" y1="255" x2="690" y2="225" />
          </g>
          <circle cx="205" cy="120" r="34" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
          <line x1="250" y1="120" x2="520" y2="120" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#towall)" />
          <text x="350" y="95" fill="#4c1d95" fontSize="20" fontWeight="900">vi</text>
          <circle cx="500" cy="215" r="34" fill="#ffe4e6" stroke="#e11d48" strokeWidth="4" />
          <line x1="460" y1="215" x2="190" y2="215" stroke="#e11d48" strokeWidth="7" markerEnd="url(#fromwall)" />
          <text x="300" y="245" fill="#881337" fontSize="20" fontWeight="900">vf = -evi</text>
          <text x="90" y="55" fill="#0f172a" fontSize="23" fontWeight="900">Parede parada: a velocidade volta com sinal oposto.</text>
        </svg>
      </DiagramShell>
    );
  }

  if (kind === "ballistic") {
    return (
      <DiagramShell title={title} caption={caption}>
        <svg viewBox="0 0 760 330" className="h-auto w-full" role="img" aria-label="Pêndulo balístico">
          <defs>
            <marker id="bulletArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
            </marker>
          </defs>
          <line x1="150" y1="55" x2="150" y2="230" stroke="#334155" strokeWidth="4" />
          <rect x="115" y="225" width="70" height="55" rx="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
          <circle cx="55" cy="252" r="12" fill="#7c3aed" />
          <line x1="70" y1="252" x2="105" y2="252" stroke="#7c3aed" strokeWidth="6" markerEnd="url(#bulletArrow)" />
          <text x="50" y="220" fill="#4c1d95" fontSize="18" fontWeight="900">bala</text>
          <text x="110" y="307" fill="#92400e" fontSize="17" fontWeight="900">colisão: momentum</text>

          <line x1="430" y1="55" x2="520" y2="205" stroke="#334155" strokeWidth="4" />
          <rect x="493" y="200" width="80" height="58" rx="10" fill="#fde68a" stroke="#f59e0b" strokeWidth="4" transform="rotate(-12 533 229)" />
          <path d="M 430 255 C 470 250 500 230 530 195" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />
          <line x1="585" y1="230" x2="585" y2="175" stroke="#059669" strokeWidth="4" />
          <text x="595" y="200" fill="#065f46" fontSize="18" fontWeight="900">h</text>
          <text x="390" y="307" fill="#065f46" fontSize="17" fontWeight="900">subida: energia mecânica</text>
          <text x="210" y="88" fill="#0f172a" fontSize="22" fontWeight="900">Não conserve energia durante a colisão.</text>
          <text x="250" y="120" fill="#0f172a" fontSize="18" fontWeight="700">Use energia só depois, na subida.</text>
        </svg>
      </DiagramShell>
    );
  }

  return (
    <DiagramShell title={title} caption={caption}>
      <svg viewBox="0 0 760 300" className="h-auto w-full" role="img" aria-label="Escolha do sistema">
        <rect x="85" y="75" width="250" height="150" rx="24" fill="#f8fafc" stroke="#64748b" strokeWidth="4" />
        <rect x="425" y="75" width="250" height="150" rx="24" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
        <text x="125" y="125" fill="#334155" fontSize="24" fontWeight="900">Corpo isolado</text>
        <text x="110" y="162" fill="#334155" fontSize="18" fontWeight="700">força externa muda p</text>
        <text x="455" y="125" fill="#4c1d95" fontSize="24" fontWeight="900">Sistema completo</text>
        <text x="455" y="162" fill="#4c1d95" fontSize="18" fontWeight="700">forças internas se cancelam</text>
        <text x="150" y="270" fill="#0f172a" fontSize="22" fontWeight="900">Escolher o sistema certo é metade da questão.</text>
      </svg>
    </DiagramShell>
  );
}

function formatNumber(value: number, digits = 2) {
  const fixed = value.toFixed(digits);
  return fixed.replace("-0.00", "0.00").replace("-0.0", "0.0");
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-900">{label}</span>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
          {formatNumber(value, step < 1 ? 2 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-violet-700"
      />
      <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </label>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function CompareBar({
  label,
  before,
  after,
  unit,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
}) {
  const maxValue = Math.max(Math.abs(before), Math.abs(after), 1);
  const beforeWidth = Math.max(8, (Math.abs(before) / maxValue) * 100);
  const afterWidth = Math.max(8, (Math.abs(after) / maxValue) * 100);
  const difference = Math.abs(after - before);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Compare antes e depois sem confiar só no número, porque aparentemente olhos também precisam estudar Física.
          </p>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
          Δ = {formatNumber(difference)} {unit}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <span>Antes</span>
            <span>{formatNumber(before)} {unit}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-600" style={{ width: `${beforeWidth}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <span>Depois</span>
            <span>{formatNumber(after)} {unit}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${afterWidth}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CollisionSimulator() {
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(4);
  const [v1i, setV1i] = useState(6);
  const [v2i, setV2i] = useState(0);
  const [e, setE] = useState(0.5);

  const delta = v1i - v2i;
  const totalMass = m1 + m2;
  const pBefore = m1 * v1i + m2 * v2i;
  const v1f = (pBefore - m2 * e * delta) / totalMass;
  const v2f = v1f + e * delta;
  const pAfter = m1 * v1f + m2 * v2f;
  const kBefore = 0.5 * m1 * v1i ** 2 + 0.5 * m2 * v2i ** 2;
  const kAfter = 0.5 * m1 * v1f ** 2 + 0.5 * m2 * v2f ** 2;
  const dissipated = kBefore - kAfter;

  const collisionType =
    e <= 0.001
      ? "perfeitamente inelástica"
      : e >= 0.999
        ? "perfeitamente elástica"
        : "parcialmente inelástica";

  const body1X = 95 + Math.max(0, Math.min(1, (v1f + 10) / 20)) * 220;
  const body2X = 445 + Math.max(0, Math.min(1, (v2f + 10) / 20)) * 220;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-[0_22px_70px_rgba(124,58,237,0.16)]">
      <div className="bg-slate-950 px-7 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/15 p-2">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight md:text-2xl">Simulador de colisões em uma dimensão</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Use logo depois da teoria de restituição: mexa em massas, velocidades e e para enxergar momentum conservado e energia cinética mudando.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberSlider label="Massa do corpo 1" value={m1} min={1} max={10} step={0.5} unit="kg" onChange={setM1} />
            <NumberSlider label="Massa do corpo 2" value={m2} min={1} max={10} step={0.5} unit="kg" onChange={setM2} />
            <NumberSlider label="Velocidade inicial 1" value={v1i} min={-10} max={10} step={0.5} unit="m/s" onChange={setV1i} />
            <NumberSlider label="Velocidade inicial 2" value={v2i} min={-10} max={10} step={0.5} unit="m/s" onChange={setV2i} />
          </div>

          <NumberSlider label="Coeficiente de restituição" value={e} min={0} max={1} step={0.05} unit="" onChange={setE} />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 leading-7 text-amber-950">
            <p className="mb-2 font-black">Como ler o simulador</p>
            <p>
              O simulador assume uma colisão unidimensional em sistema isolado. Por isso o momentum total deve permanecer igual antes e depois. O coeficiente e controla a velocidade relativa de afastamento: quando e = 1, a colisão é elástica; quando e = 0, os corpos não se afastam; entre esses valores, parte da energia cinética vira deformação, som, calor e energia interna.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Antes e depois</p>
            <svg viewBox="0 0 760 330" className="h-auto w-full rounded-2xl border border-slate-200 bg-white" role="img" aria-label="Simulação de colisão unidimensional">
              <defs>
                <marker id="simArrow1" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                </marker>
                <marker id="simArrow2" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
                </marker>
              </defs>
              <text x="60" y="44" fill="#0f172a" fontSize="22" fontWeight="900">Antes</text>
              <line x1="60" y1="112" x2="700" y2="112" stroke="#cbd5e1" strokeWidth="4" />
              <circle cx="225" cy="112" r="28" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
              <text x="213" y="119" fill="#4c1d95" fontSize="17" fontWeight="900">1</text>
              <circle cx="515" cy="112" r="28" fill="#ffe4e6" stroke="#e11d48" strokeWidth="4" />
              <text x="503" y="119" fill="#881337" fontSize="17" fontWeight="900">2</text>
              <line x1="225" y1="112" x2={225 + v1i * 16} y2="112" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#simArrow1)" />
              <line x1="515" y1="112" x2={515 + v2i * 16} y2="112" stroke="#e11d48" strokeWidth="7" markerEnd="url(#simArrow2)" />
              <text x="170" y="165" fill="#4c1d95" fontSize="16" fontWeight="900">v1i = {formatNumber(v1i, 1)} m/s</text>
              <text x="465" y="165" fill="#881337" fontSize="16" fontWeight="900">v2i = {formatNumber(v2i, 1)} m/s</text>

              <text x="60" y="218" fill="#0f172a" fontSize="22" fontWeight="900">Depois</text>
              <line x1="60" y1="282" x2="700" y2="282" stroke="#cbd5e1" strokeWidth="4" />
              <circle cx={body1X} cy="282" r="28" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4" />
              <text x={body1X - 12} y="289" fill="#4c1d95" fontSize="17" fontWeight="900">1</text>
              <circle cx={body2X} cy="282" r="28" fill="#ffe4e6" stroke="#e11d48" strokeWidth="4" />
              <text x={body2X - 12} y="289" fill="#881337" fontSize="17" fontWeight="900">2</text>
              <line x1={body1X} y1="282" x2={body1X + v1f * 16} y2="282" stroke="#7c3aed" strokeWidth="7" markerEnd="url(#simArrow1)" />
              <line x1={body2X} y1="282" x2={body2X + v2f * 16} y2="282" stroke="#e11d48" strokeWidth="7" markerEnd="url(#simArrow2)" />
            </svg>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Tipo de colisão" value={collisionType} detail={`e = ${formatNumber(e, 2)}`} />
            <MetricCard label="Velocidades finais" value={`v1f = ${formatNumber(v1f)} | v2f = ${formatNumber(v2f)}`} detail="valores com sinal, em m/s" />
            <MetricCard label="Momentum total" value={`${formatNumber(pBefore)} → ${formatNumber(pAfter)}`} detail="kg·m/s antes e depois" />
            <MetricCard label="Energia cinética" value={`${formatNumber(kBefore)} J → ${formatNumber(kAfter)} J`} detail={`dissipada: ${formatNumber(Math.max(0, dissipated))} J`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CompareBar label="Momentum total" before={pBefore} after={pAfter} unit="kg·m/s" />
            <CompareBar label="Energia cinética" before={kBefore} after={kAfter} unit="J" />
          </div>
        </div>
      </div>
    </section>
  );
}

const mainFormulas: FormulaSummary[] = [
  {
    title: "Quantidade de movimento",
    formula: String.raw`\vec{p}=m\vec{v}`,
    explanation: [
      "Essa é a definição de momentum. Ela junta massa e velocidade em uma única grandeza vetorial. Dois corpos com a mesma velocidade podem ter momenta muito diferentes se suas massas forem diferentes.",
      "Use quando a questão pedir estado de movimento, colisão, recuo, explosão ou comparação entre corpos. Em uma dimensão, trate o sinal da velocidade como parte da resposta física.",
      "A unidade é kg·m/s. Como a velocidade é vetorial, p também é vetorial e aponta no mesmo sentido de v.",
    ],
    warning: "Não trate momentum como escalar em colisão frontal. Sinal errado transforma questão simples em velório algébrico.",
  },
  {
    title: "Segunda Lei em termos de momentum",
    formula: String.raw`\vec{F}_{\text{res}}=\frac{d\vec{p}}{dt}`,
    explanation: [
      "A força resultante mede a taxa de variação da quantidade de movimento. Quando a massa é constante, essa forma vira F = ma.",
      "Essa leitura é mais geral e explica por que uma força durante certo tempo altera o momentum. Ela é a ponte natural para o conceito de impulso.",
      "Use essa ideia quando o problema envolve colisões rápidas, força variável, impulso ou mudança brusca de velocidade.",
    ],
  },
  {
    title: "Impulso e teorema do impulso",
    formula: String.raw`\vec{I}=\vec{F}_{\text{média}}\Delta t=\Delta\vec{p}`,
    explanation: [
      "O impulso mede o efeito acumulado de uma força ao longo do tempo. Ele não é só força e não é só tempo: é a combinação dos dois.",
      "Pelo teorema do impulso, o impulso resultante é igual à variação de momentum. Por isso airbag, colchão e luva de boxe reduzem força média ao aumentar o tempo de interação para uma mesma variação de momentum.",
      "A unidade N·s é equivalente a kg·m/s, exatamente porque impulso e variação de momentum são a mesma grandeza física expressa de modos diferentes.",
    ],
    warning: "Se a força varia no tempo, use área no gráfico F × t. FΔt só vale diretamente para força constante ou força média.",
  },
  {
    title: "Conservação da quantidade de movimento",
    formula: String.raw`\sum \vec{p}_{\text{antes}}=\sum \vec{p}_{\text{depois}}`,
    explanation: [
      "A quantidade de movimento total de um sistema se conserva quando o impulso externo total é nulo ou desprezível.",
      "Forças internas podem ser enormes durante uma colisão, mas elas redistribuem momentum entre os corpos. Elas não mudam o momentum total do sistema completo.",
      "Use em colisões, explosões, recuos e separações quando o enunciado indicar superfície sem atrito, sistema isolado ou impulso externo desprezível.",
    ],
    warning: "Conservar momentum não autoriza conservar energia cinética. Essa confusão alimenta metade dos erros nesse assunto.",
  },
  {
    title: "Colisão perfeitamente inelástica",
    formula: String.raw`m_1v_{1i}+m_2v_{2i}=(m_1+m_2)v_f`,
    explanation: [
      "Use quando os corpos ficam grudados ou seguem juntos depois da colisão. A velocidade final é comum aos dois corpos.",
      "O momentum se conserva se o sistema for isolado, mas a energia cinética não se conserva. Parte dela vira deformação, som, calor ou energia interna.",
      "Depois de encontrar vf, calcule energia antes e depois se a questão pedir perda de energia.",
    ],
  },
  {
    title: "Coeficiente de restituição",
    formula: String.raw`e=\frac{v_{2f}-v_{1f}}{v_{1i}-v_{2i}}`,
    explanation: [
      "O coeficiente de restituição compara a velocidade relativa de afastamento depois da colisão com a velocidade relativa de aproximação antes da colisão.",
      "Se e = 1, a colisão é elástica. Se e = 0, os corpos não se afastam depois e a colisão é perfeitamente inelástica. Se 0 < e < 1, a colisão é parcialmente inelástica.",
      "Em uma dimensão, essa fórmula costuma ser usada junto da conservação do momentum para determinar as duas velocidades finais.",
    ],
    warning: "A forma escrita depende de manter a ordem dos corpos e os sinais das velocidades de maneira consistente. Quando estiver em dúvida, pense em afastamento dividido por aproximação.",
  },
  {
    title: "Colisão elástica",
    formula: String.raw`E_{c,\text{antes}}=E_{c,\text{depois}}`,
    explanation: [
      "Na colisão elástica, o momentum total e a energia cinética total se conservam. Isso não significa que cada corpo fica com a mesma energia; a energia pode ser transferida entre eles.",
      "Em uma dimensão, você também pode usar a relação de velocidade relativa: v1i − v2i = v2f − v1f, que vem de e = 1.",
      "Caso clássico: massas iguais, uma parada, colisão elástica frontal. Os corpos trocam velocidades.",
    ],
  },
  {
    title: "Momentum total e centro de massa",
    formula: String.raw`\vec{P}_{\text{total}}=M\vec{v}_{CM}`,
    explanation: [
      "Essa relação mostra que o movimento do centro de massa está ligado ao momentum total do sistema.",
      "Se o sistema é isolado, o momentum total é constante. Como a massa total é constante, a velocidade do centro de massa também permanece constante.",
      "Use como leitura física para explosões e colisões: partes podem se mover, mas o centro de massa mantém seu movimento quando não há impulso externo.",
    ],
  },
];

const theorySections: TheorySection[] = [
  {
    icon: Brain,
    title: "Por que precisamos de uma nova grandeza",
    accent: "bg-violet-700",
    paragraphs: [
      "Nas Leis de Newton, estudamos forças, massas e acelerações. Isso resolve muitos problemas, mas fica pouco prático quando a interação é muito rápida e intensa, como em uma colisão, um chute, uma explosão ou o disparo de um projétil.",
      "Durante uma colisão real, a força entre os corpos varia muito em um intervalo minúsculo. Descrever essa força instante por instante seria uma tortura experimental, matemática e espiritual. Em vez disso, buscamos uma grandeza que capture o efeito global da interação.",
      "A quantidade de movimento, ou momentum, mede o estado de movimento considerando massa e velocidade ao mesmo tempo. Uma bola de tênis e um caminhão podem ter a mesma velocidade, mas não carregam o mesmo estado de movimento. A massa importa, e muito.",
    ],
    bullets: [
      "Colisões rápidas pedem uma análise por mudança de movimento, não por força detalhada em cada instante.",
      "Explosões e recuos são melhor entendidos conservando momentum do sistema.",
      "A pergunta central deixa de ser apenas 'qual é a força?' e passa a ser 'como o momentum total muda?'.",
    ],
    diagram: {
      kind: "systemChoice",
      title: "Escolha do sistema",
      caption: "Em colisões, a grande jogada é escolher o sistema completo. As forças internas podem ser enormes, mas não mudam o momentum total do sistema.",
    },
  },
  {
    icon: MoveRight,
    title: "Quantidade de movimento",
    accent: "bg-slate-900",
    paragraphs: [
      "A quantidade de movimento de um corpo é o produto da massa pela velocidade. Ela é uma grandeza vetorial, porque herda direção e sentido da velocidade.",
      "Se a massa aumenta, mantendo a velocidade, o momentum aumenta. Se a velocidade aumenta, mantendo a massa, o momentum também aumenta. A grandeza junta inércia e movimento em uma única informação física.",
      "Em uma dimensão, o uso de sinais é indispensável. Escolha um sentido positivo e respeite essa escolha até o fim. Velocidade para o lado oposto entra negativa, sem drama. O sinal é a direção falando com você.",
    ],
    formulas: [mainFormulas[0]],
    diagram: {
      kind: "momentumVector",
      title: "Momentum em uma dimensão",
      caption: "Com a direita positiva, movimento para a direita gera momentum positivo. Movimento para a esquerda gera momentum negativo.",
    },
    notes: [
      {
        title: "Unidade",
        type: "info",
        body: "A unidade de momentum é kg·m/s. Ela também é equivalente a N·s, conexão que aparece naturalmente no estudo de impulso.",
      },
    ],
  },
  {
    icon: Compass,
    title: "Momentum é vetorial",
    accent: "bg-indigo-700",
    paragraphs: [
      "Momentum não é apenas um número. Ele possui módulo, direção e sentido. Esse detalhe decide o resultado de colisões frontais, explosões e problemas em duas dimensões.",
      "Em uma dimensão, usamos sinais. Em duas dimensões, decompomos em componentes. Se o sistema for isolado, a conservação deve valer separadamente para cada eixo.",
      "Isso significa que não existe uma única soma escalar mágica em colisões com ângulos. A banca coloca o ângulo exatamente para obrigar o aluno a tratar momentum como vetor, e não como enfeite no enunciado.",
    ],
    formulas: [
      {
        title: "Componentes do momentum",
        formula: String.raw`p_x=mv_x \qquad p_y=mv_y`,
        explanation: [
          "Quando o movimento ocorre em duas dimensões, decompomos a velocidade em componentes e fazemos o mesmo com o momentum.",
          "Se o sistema é isolado, conservamos p_x e p_y separadamente. Um eixo não resolve o outro por solidariedade.",
        ],
      },
      {
        title: "Conservação em duas dimensões",
        formula: String.raw`\sum p_{x,\text{antes}}=\sum p_{x,\text{depois}} \qquad \sum p_{y,\text{antes}}=\sum p_{y,\text{depois}}`,
        explanation: [
          "Essas duas equações são a forma vetorial da conservação do momentum em problemas planos.",
          "Se o momentum vertical inicial é zero, as componentes verticais finais precisam se cancelar.",
        ],
      },
    ],
    diagram: {
      kind: "bidimensional",
      title: "Colisão em duas dimensões",
      caption: "Em colisões oblíquas, a conservação não é uma soma única: as componentes horizontais e verticais obedecem a equações separadas.",
    },
  },
  {
    icon: Zap,
    title: "Impulso e teorema do impulso",
    accent: "bg-emerald-700",
    paragraphs: [
      "O impulso mede o efeito de uma força agindo durante certo intervalo de tempo. Uma força grande por pouco tempo pode produzir o mesmo impulso que uma força menor por mais tempo.",
      "A forma mais geral da Segunda Lei é F_res = dp/dt. Quando analisamos um intervalo de tempo, essa relação leva ao teorema do impulso: o impulso resultante é igual à variação de momentum.",
      "Essa ideia explica airbags, luvas de boxe, colchões e sistemas de proteção: se a variação de momentum é inevitável, aumentar o tempo de parada reduz a força média.",
    ],
    formulas: [mainFormulas[1], mainFormulas[2]],
    notes: [
      {
        title: "Leitura física",
        type: "success",
        body: "Impulso não é força. Força é interação; impulso é o efeito acumulado dessa interação ao longo do tempo.",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Impulso em gráfico força por tempo",
    accent: "bg-cyan-700",
    paragraphs: [
      "Quando a força é constante, o impulso é FΔt. Quando a força varia, o impulso é a área sob o gráfico F × t.",
      "Isso aparece muito em provas militares. Às vezes o gráfico é triangular, trapezoidal ou por partes. A conta vira geometria plana: área de retângulo, triângulo e trapézio.",
      "O sinal da área também importa. Se a força está abaixo do eixo do tempo, o impulso é negativo na convenção escolhida.",
    ],
    formulas: [
      {
        title: "Força variável",
        formula: String.raw`I=\int F\,dt`,
        explanation: [
          "A integral representa a área sob a curva força versus tempo. No nível da maior parte das provas, você calcula essa área por geometria.",
          "Em um gráfico triangular, por exemplo, I = base · altura / 2. O valor máximo da força não pode ser usado sozinho como se fosse força média.",
        ],
      },
    ],
    diagram: {
      kind: "impulseGraph",
      title: "Área no gráfico",
      caption: "A área do gráfico F × t é o impulso. Pelo teorema do impulso, essa área também é a variação de momentum.",
    },
  },
  {
    icon: ShieldCheck,
    title: "Conservação da quantidade de movimento",
    accent: "bg-blue-800",
    paragraphs: [
      "A quantidade de movimento total de um sistema se conserva quando o impulso externo total é nulo ou desprezível. Essa é a frase que manda no tema inteiro.",
      "Durante uma colisão, as forças internas entre os corpos podem ser enormes. Mesmo assim, elas aparecem em pares de ação e reação. Elas mudam o momentum individual dos corpos, mas não mudam o momentum total do sistema completo.",
      "Forças externas, por outro lado, podem alterar o momentum total. Por isso a questão costuma dizer: sem atrito, sistema isolado, impulso externo desprezível ou superfície horizontal ideal. Essas frases são autorização para conservar momentum.",
    ],
    formulas: [mainFormulas[3]],
    notes: [
      {
        title: "Condição correta",
        type: "warning",
        body: "O que precisa ser nulo ou desprezível é o impulso externo na direção analisada. Não é obrigatório que não exista nenhuma força no universo, felizmente.",
      },
    ],
  },
  {
    icon: Layers,
    title: "Colisões e tipos principais",
    accent: "bg-violet-800",
    paragraphs: [
      "Colisões são interações intensas e rápidas. Em um sistema isolado, o momentum total se conserva em qualquer colisão. A energia cinética, porém, só se conserva nas colisões elásticas.",
      "Na colisão perfeitamente inelástica, os corpos ficam juntos e saem com a mesma velocidade final. É o caso de carrinhos que grudam, massas de modelar ou uma bala que se aloja em um bloco.",
      "Na colisão parcialmente inelástica, os corpos se separam, mas a energia cinética diminui. Na colisão elástica, tanto o momentum quanto a energia cinética total se conservam.",
    ],
    formulas: [mainFormulas[4], mainFormulas[6]],
    diagram: {
      kind: "inelastic",
      title: "Colisão perfeitamente inelástica",
      caption: "Se os corpos ficam grudados, a velocidade final é comum. Momentum conserva, energia cinética não.",
    },
  },
  {
    icon: Repeat,
    title: "Coeficiente de restituição e colisão com parede",
    accent: "bg-rose-700",
    paragraphs: [
      "O coeficiente de restituição mede quão bem a colisão preserva a velocidade relativa. Ele compara afastamento depois com aproximação antes.",
      "Em colisões unidimensionais, usamos conservação do momentum junto com a relação de restituição para encontrar velocidades finais. O perigo é tratar a fórmula sem sinais. O eixo escolhido precisa ser respeitado do começo ao fim.",
      "Um caso clássico é a colisão com parede. Se a parede está parada e a bola retorna com coeficiente e, a velocidade final tem sentido oposto. Se ela chega com velocidade positiva em direção à parede, pode voltar com vf = -evi.",
    ],
    formulas: [mainFormulas[5]],
    diagram: {
      kind: "wall",
      title: "Parede e restituição",
      caption: "Na colisão com parede parada, a velocidade volta no sentido oposto. Se e = 1, volta com mesmo módulo; se e < 1, volta mais lenta.",
    },
    notes: [
      {
        title: "Cuidado com seno algébrico disfarçado de Física",
        type: "danger",
        body: "O coeficiente de restituição não perdoa sinal mal colocado. Pense sempre em velocidade relativa de afastamento sobre aproximação.",
      },
    ],
  },
  {
    icon: Rocket,
    title: "Explosões, separações e recuo",
    accent: "bg-orange-700",
    paragraphs: [
      "Explosões são como o inverso de colisões perfeitamente inelásticas. Um sistema inicialmente junto se separa em partes por forças internas.",
      "Se o sistema estava em repouso e não há impulso externo, o momentum total final também deve ser zero. As partes podem se mover, mas seus momenta se compensam.",
      "Isso explica recuo de armas e canhões, pessoa pulando de um barco e carrinhos que se separam. O corpo mais leve tende a sair com maior velocidade para que o momentum compense o do corpo mais pesado.",
    ],
    formulas: [
      {
        title: "Explosão a partir do repouso",
        formula: String.raw`m_1v_1+m_2v_2=0 \quad \Rightarrow \quad m_1v_1=-m_2v_2`,
        explanation: [
          "Se o momentum inicial era zero, a soma dos momenta finais precisa continuar zero.",
          "Os fragmentos saem em sentidos opostos com momenta de mesmo módulo. A velocidade maior geralmente fica com a massa menor.",
        ],
      },
      mainFormulas[7],
    ],
    diagram: {
      kind: "explosion",
      title: "Momentum total zero",
      caption: "Em uma explosão interna, a energia cinética pode aumentar, mas o momentum total continua conservado se o sistema for isolado.",
    },
  },
  {
    icon: Scale,
    title: "Momentum e energia cinética",
    accent: "bg-slate-800",
    paragraphs: [
      "Momentum e energia cinética não são a mesma coisa. Momentum é vetorial e depende linearmente da velocidade. Energia cinética é escalar e depende do quadrado da velocidade.",
      "Se a velocidade troca de sinal, o momentum troca de sinal. A energia cinética não, porque depende de v². Essa diferença é uma das maiores armadilhas em colisões.",
      "Em sistema isolado, momentum se conserva em colisões. Energia cinética só se conserva se a colisão for elástica. Em explosões, a energia cinética pode até aumentar, pois energia interna vira movimento.",
    ],
    formulas: [
      {
        title: "Comparação essencial",
        formula: String.raw`p=mv \qquad E_c=\frac{1}{2}mv^2`,
        explanation: [
          "p é vetor; Ec é escalar. p pode ser positivo ou negativo em uma dimensão; Ec é sempre não negativa.",
          "A conservação de uma grandeza não implica a conservação da outra. Momentum e energia têm unidades diferentes e papéis diferentes.",
        ],
        warning: "Colisão inelástica não significa que momentum deixou de conservar. Significa que energia cinética não conservou.",
      },
    ],
  },

  {
    icon: AlertTriangle,
    title: "Quando a quantidade de movimento NÃO se conserva",
    accent: "bg-rose-800",
    paragraphs: [
      "Conservar momentum não é um reflexo automático. A quantidade de movimento total só se conserva quando o impulso externo total é nulo ou desprezível na direção analisada.",
      "Se um bloco desliza por muito tempo sobre uma superfície com atrito, o bloco recebe impulso externo do atrito. Nesse caso, o momentum do bloco muda e não faz sentido escrever p_antes = p_depois para o bloco sozinho.",
      "Em colisões rápidas, algumas forças externas podem ser desprezadas porque atuam durante um tempo muito pequeno. Mas em processos longos, como frenagem, empurrão prolongado ou queda sob ação do peso, o impulso externo geralmente importa.",
    ],
    formulas: [
      {
        title: "Critério real de conservação",
        formula: String.raw`\vec{I}_{\text{externo}}=\Delta\vec{p}_{\text{sistema}}`,
        explanation: [
          "Se o impulso externo é zero, a variação do momentum total também é zero. Aí podemos conservar momentum.",
          "Se o impulso externo não é zero, o momentum total do sistema muda. Nesse caso, usar conservação de momentum vira chute com notação bonita.",
          "A análise pode valer só em uma direção. Por exemplo, em uma mesa horizontal sem atrito, o momentum horizontal pode conservar mesmo que existam peso e normal na vertical.",
        ],
      },
    ],
    notes: [
      {
        title: "Pergunta de segurança",
        type: "warning",
        body: "Antes de conservar momentum, pergunte: existe impulso externo relevante na direção que estou analisando? Se existe, pare. A fórmula não assinou autorização para ser usada.",
      },
    ],
  },
  {
    icon: GitBranch,
    title: "Pêndulo balístico em duas etapas",
    accent: "bg-amber-700",
    paragraphs: [
      "O pêndulo balístico é uma das aplicações mais importantes porque obriga o aluno a separar etapas. Primeiro ocorre uma colisão rápida e perfeitamente inelástica: a bala entra no bloco e fica presa. Depois, o conjunto bala-bloco sobe como um pêndulo.",
      "Na colisão, a energia cinética não se conserva. Parte dela vira deformação, calor, som e energia interna. Porém, como a colisão é rápida, o impulso externo horizontal costuma ser desprezível, então conservamos momentum horizontal.",
      "Na subida, a colisão já acabou. Agora o conjunto se move sob ação do peso e a energia mecânica pode ser usada, se desprezarmos perdas. A regra é simples: momentum na colisão, energia depois. Misturar as duas etapas é pedir para a questão te atropelar com educação militar.",
    ],
    formulas: [
      {
        title: "Etapa da colisão",
        formula: String.raw`mv=(M+m)V`,
        explanation: [
          "A bala de massa m chega com velocidade v e fica presa no bloco de massa M. Logo após a colisão, os dois seguem juntos com velocidade V.",
          "Essa etapa conserva momentum horizontal, mas não conserva energia cinética. É colisão perfeitamente inelástica.",
        ],
      },
      {
        title: "Etapa da subida",
        formula: String.raw`\frac{1}{2}(M+m)V^2=(M+m)gh`,
        explanation: [
          "Depois da colisão, o conjunto sobe até altura h. A energia cinética logo após a colisão vira energia potencial gravitacional.",
          "Daqui vem V = √(2gh). Juntando com a etapa anterior, obtemos a velocidade inicial da bala.",
        ],
      },
      {
        title: "Resultado clássico",
        formula: String.raw`v=\frac{M+m}{m}\sqrt{2gh}`,
        explanation: [
          "Essa expressão mostra por que a velocidade da bala costuma ser muito maior que a velocidade do conjunto após a colisão.",
          "Ela só vale dentro das hipóteses do modelo: bala fica alojada, impulso externo horizontal desprezível na colisão e perdas desprezíveis na subida.",
        ],
      },
    ],
    diagram: {
      kind: "ballistic",
      title: "Duas etapas, duas conservações",
      caption: "Durante a colisão use momentum. Na subida use energia mecânica. O erro clássico é tentar conservar energia cinética na colisão inelástica.",
    },
  },
  {
    icon: Compass,
    title: "Referencial do centro de massa: visão mais forte",
    accent: "bg-indigo-900",
    paragraphs: [
      "Uma leitura mais avançada é observar a colisão no referencial do centro de massa. Nesse referencial, o momentum total do sistema é zero. Antes da colisão, os corpos se aproximam com momenta opostos; depois, se afastam ainda com momenta opostos.",
      "Em colisões elásticas unidimensionais, no referencial do centro de massa, as velocidades dos corpos simplesmente invertem o sentido mantendo o módulo. Essa visão explica por que a velocidade relativa de afastamento tem o mesmo módulo da velocidade relativa de aproximação quando e = 1.",
      "Você não precisa usar isso em toda questão, mas entender essa ideia fortalece muito a interpretação de colisões elásticas e do coeficiente de restituição.",
    ],
    formulas: [
      {
        title: "Velocidade do centro de massa",
        formula: String.raw`v_{CM}=\frac{m_1v_1+m_2v_2}{m_1+m_2}`,
        explanation: [
          "Essa velocidade é a velocidade do referencial em que o momentum total do sistema é zero.",
          "Se o sistema é isolado, v_CM permanece constante durante a colisão.",
          "Em problemas avançados, mudar para esse referencial pode simplificar a leitura física da colisão.",
        ],
      },
    ],
    notes: [
      {
        title: "Sem exagerar",
        type: "info",
        body: "Isso é uma visão complementar, não obrigação para toda questão. Use quando a colisão elástica ou a simetria do problema sugerir esse caminho.",
      },
    ],
  },
  {
    icon: Target,
    title: "Mapa de decisão: qual ferramenta usar?",
    accent: "bg-emerald-800",
    paragraphs: [
      "Questão de colisão não se resolve escolhendo fórmula por palpite. Primeiro escolha o sistema, depois veja o que se conserva e só então faça contas.",
      "Se o enunciado descreve uma interação rápida, pense em impulso e momentum. Se descreve uma subida, mola, altura, queda ou velocidade em uma posição posterior, energia provavelmente entra na etapa seguinte.",
      "O segredo é não usar a mesma conservação no problema inteiro por preguiça. Uma questão pode ter uma etapa de momentum e outra de energia. É exatamente isso que as bancas gostam de cobrar, porque aparentemente raciocínio sequencial virou esporte radical.",
    ],
    bullets: [
      "Apareceu colisão rápida: pense em conservação de momentum.",
      "Corpos grudam: momentum sim, energia cinética não.",
      "Colisão elástica: momentum + energia cinética ou restituição com e = 1.",
      "Explosão: momentum conserva; energia cinética pode aumentar se houver energia liberada.",
      "Força variável no tempo: impulso é área no gráfico F × t.",
      "Apareceu coeficiente de restituição: use momentum + velocidade relativa.",
      "Tem ângulo: decomponha momentum em x e y.",
      "Depois da colisão há altura ou mola: use energia na etapa posterior, não durante uma colisão inelástica.",
      "Existe força externa por tempo relevante: não conserve momentum sem analisar o impulso externo.",
    ],
  },
];

const examples: ExampleItem[] = [
  {
    title: "Cálculo simples de momentum",
    level: "básico",
    statement: "Um corpo de massa 4 kg move-se com velocidade 3 m/s. Calcule sua quantidade de movimento.",
    idea: "Use a definição p = mv. Como não há informação de sentido, calculamos o módulo.",
    steps: [
      { formula: String.raw`p=mv` },
      { formula: String.raw`p=4\cdot 3` },
      { formula: String.raw`p=12\,\mathrm{kg\cdot m/s}` },
    ],
    answer: "O momentum tem módulo 12 kg·m/s.",
    test: "A questão queria testar a definição direta de quantidade de movimento.",
  },
  {
    title: "Momentum com sentido negativo",
    level: "sinais em 1D",
    statement: "Um corpo de massa 2 kg move-se para a esquerda com velocidade de módulo 5 m/s. Adote a direita como positiva. Calcule o momentum.",
    idea: "Se a direita é positiva, velocidade para a esquerda entra negativa.",
    steps: [
      { formula: String.raw`v=-5\,\mathrm{m/s}` },
      { formula: String.raw`p=mv=2\cdot(-5)` },
      { formula: String.raw`p=-10\,\mathrm{kg\cdot m/s}` },
    ],
    answer: "O momentum é -10 kg·m/s. O sinal negativo indica sentido para a esquerda.",
    test: "A questão queria testar o caráter vetorial do momentum.",
  },
  {
    title: "Impulso por força constante",
    level: "impulso direto",
    statement: "Uma força média de 80 N atua sobre um corpo durante 0,25 s. Calcule o impulso e a variação de momentum.",
    idea: "Para força média constante, I = FΔt. Pelo teorema do impulso, I = Δp.",
    steps: [
      { formula: String.raw`I=F\Delta t` },
      { formula: String.raw`I=80\cdot0{,}25=20\,\mathrm{N\cdot s}` },
      { formula: String.raw`\Delta p=20\,\mathrm{kg\cdot m/s}` },
    ],
    answer: "O impulso é 20 N·s e a variação de momentum é 20 kg·m/s no sentido da força.",
    test: "A questão queria ligar impulso e variação de momentum.",
  },
  {
    title: "Impulso por gráfico triangular",
    level: "gráfico F × t",
    statement: "Uma força cresce linearmente de 0 a 120 N durante 0,5 s. Calcule o impulso.",
    idea: "Como a força varia, o impulso é a área sob o gráfico. O gráfico é triangular.",
    steps: [
      { formula: String.raw`I=\frac{\text{base}\cdot\text{altura}}{2}` },
      { formula: String.raw`I=\frac{0{,}5\cdot120}{2}` },
      { formula: String.raw`I=30\,\mathrm{N\cdot s}` },
    ],
    answer: "O impulso é 30 N·s.",
    test: "A questão queria testar que impulso em F × t é área, não força máxima vezes tempo.",
  },
  {
    title: "Teorema do impulso com inversão de sentido",
    level: "mudança vetorial",
    statement: "Uma bola de massa 0,2 kg muda sua velocidade de 10 m/s para -6 m/s. Calcule a variação de momentum e o impulso recebido.",
    idea: "A variação de momentum é final menos inicial. Como a velocidade inverteu, os sinais precisam entrar.",
    steps: [
      { formula: String.raw`\Delta p=m(v_f-v_i)` },
      { formula: String.raw`\Delta p=0{,}2(-6-10)` },
      { formula: String.raw`\Delta p=-3{,}2\,\mathrm{kg\cdot m/s}` },
      { formula: String.raw`I=\Delta p=-3{,}2\,\mathrm{N\cdot s}` },
    ],
    answer: "A variação de momentum e o impulso são -3,2 nas unidades correspondentes.",
    test: "A questão queria testar Δp vetorial, especialmente quando há inversão de movimento.",
  },
  {
    title: "Colisão perfeitamente inelástica",
    level: "colisão clássica",
    statement: "Um carrinho de 2 kg a 6 m/s colide com outro de 4 kg parado. Após a colisão, eles ficam juntos. Calcule a velocidade final.",
    idea: "Corpos juntos depois da colisão indicam colisão perfeitamente inelástica. Conservamos momentum, não energia cinética.",
    steps: [
      { formula: String.raw`m_1v_{1i}+m_2v_{2i}=(m_1+m_2)v_f` },
      { formula: String.raw`2\cdot6+4\cdot0=(2+4)v_f` },
      { formula: String.raw`12=6v_f` },
      { formula: String.raw`v_f=2\,\mathrm{m/s}` },
    ],
    answer: "A velocidade final comum é 2 m/s.",
    test: "A questão queria testar conservação de momentum em colisão perfeitamente inelástica.",
  },
  {
    title: "Explosão de sistema em repouso",
    level: "separação",
    statement: "Dois fragmentos de massas 2 kg e 3 kg se separam a partir do repouso. O fragmento de 2 kg sai a 6 m/s para a direita. Calcule a velocidade do outro fragmento.",
    idea: "O momentum inicial é zero. O momentum final também precisa ser zero, se não houver impulso externo.",
    steps: [
      { formula: String.raw`m_1v_1+m_2v_2=0` },
      { formula: String.raw`2\cdot6+3v_2=0` },
      { formula: String.raw`12+3v_2=0` },
      { formula: String.raw`v_2=-4\,\mathrm{m/s}` },
    ],
    answer: "O outro fragmento sai a 4 m/s para a esquerda.",
    test: "A questão queria mostrar que explosões conservam momentum, embora a energia cinética aumente.",
  },
  {
    title: "Recuo de canhão",
    level: "recuo",
    statement: "Um canhão de 500 kg dispara um projétil de 5 kg a 200 m/s para a direita. Antes do disparo, o sistema estava em repouso. Determine a velocidade de recuo do canhão.",
    idea: "Antes, o momentum total é zero. Depois, projétil e canhão precisam ter momenta opostos.",
    steps: [
      { formula: String.raw`m_pv_p+m_cv_c=0` },
      { formula: String.raw`5\cdot200+500v_c=0` },
      { formula: String.raw`1000+500v_c=0` },
      { formula: String.raw`v_c=-2\,\mathrm{m/s}` },
    ],
    answer: "O canhão recua a 2 m/s para a esquerda.",
    test: "A questão queria testar conservação de momentum em recuo.",
  },
  {
    title: "Colisão elástica com massas iguais",
    level: "caso clássico",
    statement: "Um corpo de massa m com velocidade v colide elasticamente com outro idêntico em repouso. Mostre que eles trocam velocidades.",
    idea: "Para colisão elástica, usamos momentum e velocidade relativa. Para massas iguais, o resultado é troca de velocidades.",
    steps: [
      { formula: String.raw`mv=mv_{1f}+mv_{2f}\Rightarrow v=v_{1f}+v_{2f}` },
      { formula: String.raw`v_{1i}-v_{2i}=v_{2f}-v_{1f}` },
      { formula: String.raw`v=v_{2f}-v_{1f}` },
      { text: "Comparando as duas equações, obtemos:" },
      { formula: String.raw`v_{1f}=0 \qquad v_{2f}=v` },
    ],
    answer: "O primeiro corpo para e o segundo sai com velocidade v.",
    test: "A questão queria testar colisão elástica unidimensional entre massas iguais.",
  },
  {
    title: "Coeficiente de restituição",
    level: "sistema de equações",
    statement: "Um corpo de 2 kg a 6 m/s colide com outro de 4 kg parado. O coeficiente de restituição é e = 0,5. Determine as velocidades finais.",
    idea: "Use conservação do momentum e a relação de restituição. Mantenha sinais com cuidado.",
    steps: [
      { formula: String.raw`2\cdot6=2v_{1f}+4v_{2f}` },
      { formula: String.raw`6=v_{1f}+2v_{2f}` },
      { formula: String.raw`0{,}5=\frac{v_{2f}-v_{1f}}{6}` },
      { formula: String.raw`v_{2f}-v_{1f}=3` },
      { formula: String.raw`v_{2f}=v_{1f}+3` },
      { formula: String.raw`6=v_{1f}+2(v_{1f}+3)` },
      { formula: String.raw`v_{1f}=0 \qquad v_{2f}=3\,\mathrm{m/s}` },
    ],
    answer: "O corpo 1 para e o corpo 2 sai a 3 m/s.",
    test: "A questão queria testar o uso conjunto de momentum e restituição.",
  },
  {
    title: "Colisão com parede",
    level: "restituição e sinal",
    statement: "Uma bola se move para a direita com 12 m/s e colide com uma parede vertical parada. O coeficiente de restituição é e = 0,75. Adote a direita como positiva. Determine a velocidade após a colisão.",
    idea: "A parede parada faz a bola retornar em sentido oposto. O módulo da velocidade de retorno é e vezes o módulo da velocidade de chegada.",
    steps: [
      { formula: String.raw`v_f=-ev_i` },
      { formula: String.raw`v_f=-0{,}75\cdot12` },
      { formula: String.raw`v_f=-9\,\mathrm{m/s}` },
    ],
    answer: "A bola retorna a 9 m/s para a esquerda.",
    test: "A questão queria testar restituição com parede e interpretação de sinal.",
  },
  {
    title: "Pêndulo balístico",
    level: "aplicação clássica",
    statement: "Uma bala de massa m e velocidade v atinge um bloco de massa M em repouso e fica alojada nele. Após a colisão, o conjunto sobe até uma altura h. Explique como resolver o problema.",
    idea: "Há duas etapas: colisão inelástica e subida. Durante a colisão, conserve momentum. Na subida, use energia mecânica.",
    steps: [
      { text: "Na colisão bala-bloco:" },
      { formula: String.raw`mv=(M+m)V` },
      { text: "Na subida do conjunto:" },
      { formula: String.raw`\frac{1}{2}(M+m)V^2=(M+m)gh` },
      { formula: String.raw`V=\sqrt{2gh}` },
      { formula: String.raw`v=\frac{M+m}{m}\sqrt{2gh}` },
    ],
    answer: "A velocidade inicial da bala é v = ((M+m)/m)√(2gh).",
    test: "A questão queria testar quando usar momentum e quando usar energia. Não se conserva energia mecânica durante a colisão inelástica.",
  },
  {
    title: "Colisão bidimensional simples",
    level: "vetores",
    statement: "Uma partícula de massa m move-se inicialmente no eixo x com velocidade v0. Após uma colisão, duas partículas saem com velocidades v1 e v2 formando ângulos θ1 e θ2 com o eixo x. Monte as equações de conservação.",
    idea: "Em duas dimensões, conserve p_x e p_y separadamente.",
    steps: [
      { formula: String.raw`mv_0=m_1v_1\cos\theta_1+m_2v_2\cos\theta_2` },
      { formula: String.raw`0=m_1v_1\sin\theta_1-m_2v_2\sin\theta_2` },
    ],
    answer: "Essas são as equações típicas quando uma partícula sai acima e outra abaixo do eixo x.",
    test: "A questão queria testar decomposição vetorial do momentum.",
  },
  {
    title: "Questão estilo prova militar: colisão e perda de energia",
    level: "militar",
    statement: "Um bloco de 3 kg a 8 m/s colide com outro de 5 kg parado em superfície sem atrito. Após a colisão, ficam unidos. Determine a velocidade final, a energia cinética antes, depois e dissipada.",
    idea: "Use momentum para achar a velocidade final. Depois calcule energia cinética antes e depois.",
    steps: [
      { formula: String.raw`3\cdot8=(3+5)v_f` },
      { formula: String.raw`v_f=3\,\mathrm{m/s}` },
      { formula: String.raw`E_{antes}=\frac{1}{2}\cdot3\cdot8^2=96\,\mathrm{J}` },
      { formula: String.raw`E_{depois}=\frac{1}{2}\cdot8\cdot3^2=36\,\mathrm{J}` },
      { formula: String.raw`E_{dissipada}=96-36=60\,\mathrm{J}` },
    ],
    answer: "vf = 3 m/s, energia antes = 96 J, depois = 36 J e dissipada = 60 J.",
    test: "A questão queria testar a diferença entre conservar momentum e não conservar energia cinética.",
  },
  {
    title: "Quando não conservar momentum",
    level: "impulso externo",
    statement: "Um bloco de 2 kg desliza sobre uma superfície horizontal rugosa. Ele passa de 6 m/s para 2 m/s por causa do atrito durante um intervalo longo. Explique por que não podemos conservar o momentum do bloco sozinho.",
    idea: "O atrito é força externa sobre o sistema bloco. Como atua durante tempo relevante, produz impulso externo e altera o momentum.",
    steps: [
      { formula: String.raw`I_{\text{externo}}=\Delta p` },
      { formula: String.raw`\Delta p=m(v_f-v_i)` },
      { formula: String.raw`\Delta p=2(2-6)` },
      { formula: String.raw`\Delta p=-8\,\mathrm{kg\cdot m/s}` },
      { text: "Como houve variação de momentum, houve impulso externo resultante. Portanto, p_antes não é igual a p_depois para o bloco." },
    ],
    answer: "Não se conserva o momentum do bloco, porque o atrito externo produziu impulso e reduziu sua quantidade de movimento.",
    test: "A questão queria testar que conservação de momentum exige impulso externo nulo ou desprezível.",
  },
  {
    title: "Colisão bidimensional numérica com ângulos simétricos",
    level: "2D com trigonometria",
    statement: "Um corpo de massa 2m move-se com velocidade v0 no eixo x e explode em dois fragmentos iguais de massa m. Os fragmentos saem simetricamente formando ângulos de 60° e -60° com o eixo x. Determine o módulo da velocidade de cada fragmento.",
    idea: "Como os ângulos são simétricos, as componentes verticais dos momenta se cancelam. Conservamos o momentum horizontal.",
    steps: [
      { formula: String.raw`p_{x,\text{antes}}=2mv_0` },
      { formula: String.raw`p_{x,\text{depois}}=mv\cos60^\circ+mv\cos60^\circ` },
      { formula: String.raw`2mv_0=2mv\cos60^\circ` },
      { formula: String.raw`2mv_0=2mv\cdot\frac{1}{2}` },
      { formula: String.raw`2mv_0=mv` },
      { formula: String.raw`v=2v_0` },
    ],
    answer: "Cada fragmento sai com velocidade de módulo 2v0.",
    test: "A questão queria testar conservação vetorial: componentes em y se cancelam, componentes em x determinam a velocidade.",
  },
  {
    title: "Questão estilo ITA/IME base: explosão com energia liberada",
    level: "ITA/IME base",
    statement: "Um sistema em repouso explode em duas partes de massas 2 kg e 6 kg. A energia liberada, convertida em energia cinética, é 48 J. Determine os módulos das velocidades.",
    idea: "Momentum total inicial zero. As velocidades são opostas. A energia cinética final total é 48 J.",
    steps: [
      { formula: String.raw`2v_1+6v_2=0` },
      { formula: String.raw`v_1=-3v_2` },
      { formula: String.raw`\frac{1}{2}\cdot2\cdot v_1^2+\frac{1}{2}\cdot6\cdot v_2^2=48` },
      { formula: String.raw`v_1^2+3v_2^2=48` },
      { formula: String.raw`9v_2^2+3v_2^2=48` },
      { formula: String.raw`v_2=2\,\mathrm{m/s} \qquad v_1=6\,\mathrm{m/s}` },
    ],
    answer: "A parte de 2 kg sai com 6 m/s e a de 6 kg sai com 2 m/s, em sentidos opostos.",
    test: "A questão queria misturar conservação de momentum com energia liberada na explosão.",
  },
];

const survivalItems = [
  "Momentum é vetor: use sinais em uma dimensão e componentes em duas dimensões.",
  "Impulso é variação de momentum: I = Δp.",
  "Em gráfico F × t, impulso é área.",
  "Momentum conserva se o impulso externo for nulo ou desprezível.",
  "Forças internas mudam momenta individuais, não o momentum total do sistema.",
  "Colisão perfeitamente inelástica: corpos juntos, mesma velocidade final.",
  "Colisão elástica: conserva momentum e energia cinética.",
  "Colisão inelástica: conserva momentum se o sistema for isolado, mas não conserva energia cinética.",
  "Explosão em repouso: momenta finais se compensam.",
  "Pêndulo balístico: momentum na colisão, energia na subida.",
  "Parede parada com restituição: a velocidade volta com sentido oposto.",
  "Em 2D, conserve p_x e p_y separadamente.",
  "Se existe impulso externo relevante, momentum do sistema analisado não conserva.",
  "Referencial do centro de massa ajuda a entender colisões elásticas e velocidades relativas.",
];

const traps = [
  "Usar velocidades sem sinal em colisões frontais.",
  "Achar que colisão inelástica não conserva momentum.",
  "Conservar energia cinética em colisão perfeitamente inelástica.",
  "Aplicar conservação de momentum sem verificar impulso externo.",
  "Usar m1v1 = m2v2 como se fosse fórmula universal.",
  "Errar a ordem ou os sinais no coeficiente de restituição.",
  "Tratar força máxima de um gráfico como força média sem calcular área.",
  "Confundir impulso com força.",
  "Confundir momentum com energia cinética.",
  "Esquecer de decompor vetores em colisões bidimensionais.",
  "Usar a mesma conservação em todas as etapas de uma questão composta.",
  "Achar que todo problema com colisão permite ignorar força externa sem justificativa.",
];

function Hero({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/dinamica">
            <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-700">
              Dinâmica
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
              Momentum e Colisões
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              A quantidade de movimento e como os objetos interagem em colisões, explosões, recuos e sistemas isolados.
            </p>
          </div>
        </div>

        <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-black transition md:px-5 ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntroPanel() {
  const stats = [
    ["18", "seções"],
    ["22", "fórmulas"],
    ["9", "diagramas"],
    ["SIM", "simulador"],
  ];

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
      <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1.08fr_0.92fr] lg:p-12">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-violet-100">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            Foco ITA · IME · Militares
          </div>

          <div>
            <h2 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Momentum: escolha o sistema certo antes de sair conservando tudo.
            </h2>
            <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-300">
              Uma página completa sobre quantidade de movimento, impulso, gráficos força-tempo, colisões, explosões, recuo, restituição, pêndulo balístico e conservação vetorial. O objetivo é simples: fazer o aluno parar de tratar sinal como decoração e sistema isolado como fé religiosa.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Impulso", "área em F × t"],
              ["Colisão", "antes e depois"],
              ["Explosão", "momentos opostos"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid content-center gap-5 sm:grid-cols-2">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-7 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
              <p className="text-4xl font-black tracking-tight text-white md:text-5xl">{value}</p>
              <p className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SimulatorStudyBlock() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-violet-50 shadow-[0_18px_55px_rgba(124,58,237,0.10)]">
      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-700 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
            <Calculator className="h-4 w-4" />
            Laboratório da restituição
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Agora mexa no simulador exatamente onde a teoria faz sentido.
          </h2>
          <p className="mt-4 leading-8 text-slate-700">
            Depois de estudar conservação de momentum e coeficiente de restituição, o simulador deixa de ser brinquedo e vira experimento controlado. Mude o valor de e, observe as velocidades finais e compare momentum com energia. É aqui que a diferença entre conservar quantidade de movimento e conservar energia cinética fica visual.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["e = 1", "colisão elástica: momentum e energia cinética se conservam"],
            ["0 < e < 1", "colisão parcialmente inelástica: energia cinética diminui"],
            ["e = 0", "caso limite: sem afastamento relativo depois da colisão"],
            ["sinais", "velocidades negativas indicam sentido oposto ao eixo escolhido"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-violet-200 bg-white p-4">
              <p className="font-black text-violet-900">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TheoryView() {
  return (
    <div className="space-y-8">
      <IntroPanel />
      {theorySections.map((section) => {
        const Icon = section.icon;
        const showSimulatorAfterSection = section.title === "Coeficiente de restituição e colisão com parede";

        return (
          <div key={section.title} className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
              <div className={`${section.accent} px-7 py-5 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/15 p-2">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight md:text-2xl">{section.title}</h2>
                </div>
              </div>

              <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5 leading-8 text-slate-700">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.bullets && (
                    <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
                      <p className="mb-3 font-black text-violet-950">Leitura de prova</p>
                      <ul className="space-y-2 text-sm leading-6 text-violet-950">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className="mt-2 h-2 w-2 flex-none rounded-full bg-violet-600" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.notes?.map((note) => (
                    <NoteBox key={note.title} title={note.title} body={note.body} type={note.type} />
                  ))}
                </div>

                <div className="space-y-5">
                  {section.diagram && <Diagram {...section.diagram} />}
                  {section.formulas?.map((formula) => (
                    <FormulaCard key={formula.title} formula={formula} />
                  ))}
                </div>
              </div>
            </section>

            {showSimulatorAfterSection && (
              <>
                <SimulatorStudyBlock />
                <CollisionSimulator />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExampleAccordion({ example, index }: { example: ExampleItem; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left md:p-6"
      >
        <div>
          <div className="mb-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-800">
            {example.level}
          </div>
          <h3 className="text-xl font-black text-slate-950">
            Exemplo {index + 1} — {example.title}
          </h3>
          <p className="mt-3 leading-7 text-slate-600">{example.statement}</p>
        </div>
        <div className="rounded-full bg-slate-950 p-2 text-white">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 leading-7 text-blue-950">
                <p className="mb-2 font-black">Ideia antes da conta</p>
                <p>{example.idea}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 leading-7 text-emerald-950">
                <p className="mb-2 font-black">Conclusão</p>
                <p>{example.answer}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 leading-7 text-amber-950">
                <p className="mb-2 font-black">O que a questão queria testar?</p>
                <p>{example.test}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-black text-slate-950">Desenvolvimento</p>
              {example.steps.map((step, stepIndex) => (
                <div key={`${example.title}-${stepIndex}`}>
                  {step.text && <p className="leading-7 text-slate-700">{step.text}</p>}
                  {step.formula && <FormulaBlock formula={step.formula} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ExamplesView() {
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-700 p-3 text-white">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Exemplos resolvidos</h2>
            <p className="mt-1 text-slate-600">
              Os exemplos sobem de leitura direta até colisões com energia, parede, pêndulo balístico, caso sem conservação e decomposição vetorial numérica.
            </p>
          </div>
        </div>
      </section>

      {examples.map((example, index) => (
        <ExampleAccordion key={example.title} example={example} index={index} />
      ))}
    </div>
  );
}

function SummaryView() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-7 py-5 text-white">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-violet-300" />
            <h2 className="text-2xl font-black">Quadro de sobrevivência</h2>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-7">
          {survivalItems.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700">
              <CircleDot className="mt-1 h-5 w-5 flex-none text-violet-700" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-violet-700 px-7 py-5 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-2xl font-black">Fórmulas essenciais</h2>
          </div>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-7">
          {mainFormulas.map((formula) => (
            <FormulaCard key={formula.title} formula={formula} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 md:p-7">
          <div className="mb-5 flex items-center gap-3 text-rose-950">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-2xl font-black">Armadilhas clássicas</h2>
          </div>
          <ul className="space-y-3 leading-7 text-rose-950">
            {traps.map((trap) => (
              <li key={trap} className="flex gap-3">
                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-rose-600" />
                <span>{trap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 md:p-7">
          <div className="mb-5 flex items-center gap-3 text-emerald-950">
            <BookOpen className="h-6 w-6" />
            <h2 className="text-2xl font-black">Estratégia de prova</h2>
          </div>
          <ol className="space-y-3 leading-7 text-emerald-950">
            {[
              "Escolha o sistema.",
              "Verifique se o impulso externo é nulo ou desprezível.",
              "Escolha o eixo positivo.",
              "Coloque sinais nas velocidades.",
              "Escreva a conservação do momentum.",
              "Identifique se a colisão é elástica, parcialmente inelástica ou perfeitamente inelástica.",
              "Use energia cinética apenas quando for colisão elástica ou quando o enunciado pedir perda de energia.",
              "Separe etapas: colisão, subida, mola e explosão podem pedir ferramentas diferentes.",
              "Use restituição quando o coeficiente e aparecer.",
              "Em duas dimensões, decomponha em x e y.",
              "Se houver impulso externo relevante, não conserve momentum sem ajustar a análise.",
              "Interprete sinal negativo como sentido oposto, não como erro automático.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-violet-600 p-3">
            <Gauge className="h-6 w-6" />
          </div>
          <div className="space-y-4 leading-8 text-slate-300">
            <h2 className="text-2xl font-black text-white">Ideia final</h2>
            <p>
              Momentum e colisões não são um amontoado de fórmulas. O centro do tema é escolher o sistema, respeitar o caráter vetorial e saber o que se conserva em cada etapa.
            </p>
            <p>
              Se a interação é rápida, pense em impulso e momentum. Se depois aparece altura, mola ou energia dissipada, separe as etapas. A Física até tolera conta longa; o que ela não tolera é conservar energia cinética em colisão inelástica e fingir que nada aconteceu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DynamicsTopicMomentum() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="sticky top-0 z-40">
        <Hero activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 lg:px-8">
        {activeTab === "teoria" && <TheoryView />}
        {activeTab === "exemplos" && <ExamplesView />}
        {activeTab === "resumo" && <SummaryView />}
      </main>
    </div>
  );
}
