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
  Compass,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";

type NoteType = "info" | "warning" | "success" | "dark" | "danger";

type DiagramKind =
  | "chargeStates"
  | "attractionRepulsion"
  | "friction"
  | "contact"
  | "induction"
  | "polarization"
  | "coulomb"
  | "superposition"
  | "fieldCharge"
  | "fieldLines"
  | "uniformField"
  | "potential"
  | "conductor"
  | "faraday"
  | "pointEffect"
  | "graphs";

type DiagramData = {
  kind: DiagramKind;
  title: string;
  caption: string;
};

type DerivationStepData = {
  title: string;
  body?: string[];
  formulas?: string[];
};

type EquationPanelData = {
  title: string;
  formula: string;
  terms: string[];
  structure: string[];
  steps: DerivationStepData[];
};

type TheorySection = {
  id: number;
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  diagram?: DiagramData;
  numbered?: string[];
  bullets?: string[];
  panels?: EquationPanelData[];
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

type Example = {
  id: string;
  title: string;
  statement: string;
  explanation: string[];
  formulas: string[];
  notes?: {
    title: string;
    type: NoteType;
    body: string;
  }[];
};

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
};

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function MiniInfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-800/55 p-5">
      <h4 className="mb-3 text-base font-black text-blue-300">{title}</h4>
      <div className="space-y-3 text-sm leading-7 text-slate-300">
        {children}
      </div>
    </div>
  );
}

function DerivationStep({
  title,
  body,
  formulas,
}: {
  title: string;
  body?: string[];
  formulas?: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <h5 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-blue-300">
        {title}
      </h5>

      <div className="space-y-4 text-sm leading-7 text-slate-300 [&_.katex]:text-slate-100">
        {body?.map((paragraph, index) => (
          <p key={`body-${index}`}>{paragraph}</p>
        ))}

        {formulas?.map((formula, index) => (
          <MathFormula key={`formula-${index}`} formula={formula} display={true} />
        ))}
      </div>
    </div>
  );
}

function EquationPanel({ panel }: { panel: EquationPanelData }) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.28)] md:p-8">
      <h3 className="mb-8 text-lg font-black tracking-wide text-blue-300 md:text-xl">
        {panel.title}
      </h3>

      <div className="flex min-h-[150px] items-center justify-center overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-10">
        <div className="min-w-max text-center text-slate-100 [&_.katex]:text-2xl [&_.katex]:text-slate-100 [&_.katex-display]:my-0 md:[&_.katex]:text-5xl">
          <MathFormula formula={panel.formula} display={true} />
        </div>
      </div>

      <div className="mt-8 grid gap-5 border-t border-slate-700 pt-8 md:grid-cols-2">
        <MiniInfoCard title="Termo a termo">
          <ul className="space-y-3">
            {panel.terms.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MiniInfoCard>

        <MiniInfoCard title="Por que essa estrutura?">
          <ul className="space-y-3">
            {panel.structure.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MiniInfoCard>
      </div>

      <div className="mt-8 border-t border-slate-700 pt-8">
        <h4 className="mb-5 text-base font-black text-blue-300 md:text-lg">
          📐 Dedução física e interpretação
        </h4>

        <div className="space-y-4">
          {panel.steps.map((step, index) => (
            <DerivationStep
              key={index}
              title={step.title}
              body={step.body}
              formulas={step.formulas}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = "from-indigo-600 to-purple-700",
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className={`bg-gradient-to-r ${accent} px-7 py-5`}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/15 p-2">
            <Icon className="h-6 w-6 text-white" />
          </div>

          <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
            {title}
          </h2>
        </div>
      </div>

      <div className="space-y-5 p-6 leading-8 text-slate-700 md:p-8">
        {children}
      </div>
    </section>
  );
}

function CompactTabHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  accent = "from-slate-950 via-slate-900 to-slate-800",
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-gradient-to-br ${accent} p-6 shadow-[0_18px_55px_rgba(15,23,42,0.18)] md:p-8`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.16),transparent_32%)]" />

      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-300">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">
          {title}
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          {description}
        </p>
      </div>
    </section>
  );
}

function NoteBox({
  title,
  children,
  type = "info",
}: {
  title: string;
  children: ReactNode;
  type?: NoteType;
}) {
  const styles = {
    info: "bg-indigo-50 border-indigo-200 text-indigo-950",
    warning: "bg-amber-50 border-amber-200 text-amber-950",
    success: "bg-emerald-50 border-emerald-200 text-emerald-950",
    danger: "bg-red-50 border-red-200 text-red-950",
    dark: "bg-slate-950 border-slate-800 text-slate-200",
  };

  const Icon =
    type === "warning"
      ? AlertTriangle
      : type === "success"
        ? ShieldCheck
        : type === "danger"
          ? AlertTriangle
          : type === "dark"
            ? Brain
            : Lightbulb;

  return (
    <div className={`rounded-2xl border p-5 ${styles[type]}`}>
      <div className="mb-2 flex items-center gap-2 font-black">
        <Icon className="h-5 w-5 shrink-0" />
        {title}
      </div>

      <div className="text-sm leading-7 md:text-base">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function FormulaSummaryCard({ item }: { item: FormulaSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-black text-slate-950">{item.title}</h3>
      <FormulaBlock formula={item.formula} />
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {item.description}
      </p>
    </div>
  );
}

function ExampleAccordion({ example }: { example: Example }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.07)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full p-6 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              {example.title}
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {example.statement}
            </p>
          </div>

          <div className="flex-shrink-0 rounded-full bg-slate-950 p-2 text-white">
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-slate-100 p-6 leading-8 text-slate-700 md:p-7">
          {example.explanation.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}

          {example.formulas.map((formula, index) => (
            <FormulaBlock key={index} formula={formula} />
          ))}

          {example.notes?.map((note, index) => (
            <NoteBox key={index} title={note.title} type={note.type}>
              {note.body}
            </NoteBox>
          ))}
        </div>
      )}
    </article>
  );
}

function CircuitDiagram({ diagram }: { diagram: DiagramData }) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">{diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[700px]">
          {diagram.kind === "chargeStates" && <ChargeStatesDiagram />}
          {diagram.kind === "attractionRepulsion" && <AttractionRepulsionDiagram />}
          {diagram.kind === "friction" && <FrictionDiagram />}
          {diagram.kind === "contact" && <ContactDiagram />}
          {diagram.kind === "induction" && <InductionDiagram />}
          {diagram.kind === "polarization" && <PolarizationDiagram />}
          {diagram.kind === "coulomb" && <CoulombDiagram />}
          {diagram.kind === "superposition" && <SuperpositionDiagram />}
          {diagram.kind === "fieldCharge" && <FieldChargeDiagram />}
          {diagram.kind === "fieldLines" && <FieldLinesDiagram />}
          {diagram.kind === "uniformField" && <UniformFieldDiagram />}
          {diagram.kind === "potential" && <PotentialDiagram />}
          {diagram.kind === "conductor" && <ConductorDiagram />}
          {diagram.kind === "faraday" && <FaradayDiagram />}
          {diagram.kind === "pointEffect" && <PointEffectDiagram />}
          {diagram.kind === "graphs" && <GraphsDiagram />}
        </div>
      </div>
    </div>
  );
}

function ChargeCircle({
  x,
  y,
  label,
  fill = "#eef2ff",
}: {
  x: number;
  y: number;
  label: string;
  fill?: string;
}) {
  return (
    <>
      <circle cx={x} cy={y} r="46" fill={fill} stroke="#0f172a" strokeWidth="4" />
      <text
        x={x}
        y={y + 8}
        textAnchor="middle"
        className="fill-slate-950 text-[24px] font-black"
      >
        {label}
      </text>
    </>
  );
}

function ArrowLine({
  x1,
  y1,
  x2,
  y2,
  color = "#0f172a",
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  const ax1 = x2 - size * Math.cos(angle - Math.PI / 6);
  const ay1 = y2 - size * Math.sin(angle - Math.PI / 6);
  const ax2 = x2 - size * Math.cos(angle + Math.PI / 6);
  const ay2 = y2 - size * Math.sin(angle + Math.PI / 6);

  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d={`M ${x2} ${y2} L ${ax1} ${ay1} L ${ax2} ${ay2} Z`} fill={color} />
    </>
  );
}

function DiagramLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="fill-slate-700 text-[15px] font-bold"
    >
      {children}
    </text>
  );
}

function ChargeStatesDiagram() {
  return (
    <svg viewBox="0 0 760 300" className="h-[300px] w-full">
      <rect x="15" y="15" width="730" height="270" rx="26" fill="#ffffff" />

      <ChargeCircle x={150} y={145} label="0" fill="#f8fafc" />
      <text x={150} y={225} textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        neutro
      </text>
      <DiagramLabel x={150} y={252}>prótons = elétrons</DiagramLabel>

      <ChargeCircle x={380} y={145} label="+" fill="#fee2e2" />
      <text x={380} y={225} textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        positivo
      </text>
      <DiagramLabel x={380} y={252}>perdeu elétrons</DiagramLabel>

      <ChargeCircle x={610} y={145} label="−" fill="#dbeafe" />
      <text x={610} y={225} textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        negativo
      </text>
      <DiagramLabel x={610} y={252}>ganhou elétrons</DiagramLabel>

      <DiagramLabel x={380} y={60}>nos processos comuns, quem se move são os elétrons</DiagramLabel>
    </svg>
  );
}

function AttractionRepulsionDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />

      <ChargeCircle x={170} y={100} label="+" fill="#fee2e2" />
      <ChargeCircle x={310} y={100} label="+" fill="#fee2e2" />
      <ArrowLine x1={210} y1={100} x2={245} y2={100} color="#dc2626" />
      <ArrowLine x1={270} y1={100} x2={235} y2={100} color="#dc2626" />
      <DiagramLabel x={240} y={170}>mesmo sinal: repulsão</DiagramLabel>

      <ChargeCircle x={455} y={100} label="+" fill="#fee2e2" />
      <ChargeCircle x={595} y={100} label="−" fill="#dbeafe" />
      <ArrowLine x1={505} y1={100} x2={545} y2={100} color="#2563eb" />
      <ArrowLine x1={545} y1={100} x2={505} y2={100} color="#2563eb" />
      <DiagramLabel x={525} y={170}>sinais opostos: atração</DiagramLabel>

      <ChargeCircle x={300} y={240} label="−" fill="#dbeafe" />
      <ChargeCircle x={460} y={240} label="−" fill="#dbeafe" />
      <ArrowLine x1={340} y1={240} x2={375} y2={240} color="#dc2626" />
      <ArrowLine x1={420} y1={240} x2={385} y2={240} color="#dc2626" />
      <DiagramLabel x={380} y={295}>negativo com negativo também se repele</DiagramLabel>
    </svg>
  );
}

function FrictionDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />

      <rect x="80" y="110" width="180" height="70" rx="18" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x="170" y="153" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        corpo A
      </text>

      <rect x="500" y="110" width="180" height="70" rx="18" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x="590" y="153" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        corpo B
      </text>

      <ArrowLine x1={285} y1={145} x2={475} y2={145} color="#2563eb" />
      <text x="380" y="125" textAnchor="middle" className="fill-blue-700 text-[16px] font-black">
        elétrons transferidos
      </text>

      <ChargeCircle x={170} y={245} label="+" fill="#fee2e2" />
      <ChargeCircle x={590} y={245} label="−" fill="#dbeafe" />

      <DiagramLabel x={170} y={305}>perde elétrons</DiagramLabel>
      <DiagramLabel x={590} y={305}>ganha elétrons</DiagramLabel>
      <DiagramLabel x={380} y={65}>atrito entre materiais diferentes pode transferir elétrons</DiagramLabel>
    </svg>
  );
}

function ContactDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />

      <ChargeCircle x={145} y={120} label="+6" fill="#fee2e2" />
      <ChargeCircle x={295} y={120} label="−2" fill="#dbeafe" />
      <DiagramLabel x={220} y={195}>antes do contato</DiagramLabel>

      <ArrowLine x1={360} y1={120} x2={430} y2={120} color="#0f172a" />
      <text x="395" y="95" textAnchor="middle" className="fill-slate-950 text-[15px] font-black">
        contato
      </text>

      <ChargeCircle x={515} y={120} label="+2" fill="#fee2e2" />
      <ChargeCircle x={645} y={120} label="+2" fill="#fee2e2" />
      <DiagramLabel x={580} y={195}>depois, se forem idênticas</DiagramLabel>

      <text x="380" y="265" textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        carga total: +6 − 2 = +4 μC
      </text>
      <text x="380" y="295" textAnchor="middle" className="fill-slate-700 text-[16px] font-bold">
        esferas idênticas dividem igualmente: +2 μC em cada uma
      </text>
    </svg>
  );
}

function InductionDiagram() {
  return (
    <svg viewBox="0 0 760 420" className="h-[420px] w-full">
      <rect x="15" y="15" width="730" height="390" rx="26" fill="#ffffff" />

      <rect x="65" y="80" width="110" height="40" rx="12" fill="#dbeafe" stroke="#0f172a" strokeWidth="3" />
      <text x="120" y="107" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        bastão −
      </text>
      <circle cx="265" cy="100" r="46" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x="238" y="106" className="fill-red-700 text-[20px] font-black">+</text>
      <text x="282" y="106" className="fill-blue-700 text-[20px] font-black">−</text>
      <DiagramLabel x={265} y={168}>1. separação de cargas</DiagramLabel>

      <rect x="440" y="80" width="110" height="40" rx="12" fill="#dbeafe" stroke="#0f172a" strokeWidth="3" />
      <text x="495" y="107" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        bastão −
      </text>
      <circle cx="640" cy="100" r="46" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x="610" y="106" className="fill-red-700 text-[20px] font-black">+</text>
      <text x="654" y="106" className="fill-blue-700 text-[20px] font-black">−</text>
      <line x1="640" y1="146" x2="640" y2="190" stroke="#0f172a" strokeWidth="4" />
      <line x1="615" y1="190" x2="665" y2="190" stroke="#0f172a" strokeWidth="4" />
      <line x1="623" y1="205" x2="657" y2="205" stroke="#0f172a" strokeWidth="4" />
      <line x1="631" y1="220" x2="649" y2="220" stroke="#0f172a" strokeWidth="4" />
      <ArrowLine x1={670} y1={110} x2={710} y2={150} color="#2563eb" />
      <DiagramLabel x={640} y={258}>2. aterramento: elétrons saem</DiagramLabel>

      <circle cx="250" cy="315" r="46" fill="#fee2e2" stroke="#0f172a" strokeWidth="4" />
      <text x="250" y="323" textAnchor="middle" className="fill-red-700 text-[26px] font-black">+</text>
      <DiagramLabel x={250} y={385}>3. retira terra e afasta o bastão</DiagramLabel>

      <circle cx="545" cy="315" r="46" fill="#fee2e2" stroke="#0f172a" strokeWidth="4" />
      <text x="545" y="323" textAnchor="middle" className="fill-red-700 text-[26px] font-black">+</text>
      <DiagramLabel x={545} y={385}>4. esfera fica positiva</DiagramLabel>
    </svg>
  );
}

function PolarizationDiagram() {
  return (
    <svg viewBox="0 0 760 310" className="h-[310px] w-full">
      <rect x="15" y="15" width="730" height="280" rx="26" fill="#ffffff" />

      <rect x="80" y="120" width="120" height="50" rx="14" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <text x="140" y="152" textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        bastão −
      </text>

      <circle cx="460" cy="145" r="70" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x="412" y="152" className="fill-red-700 text-[24px] font-black">+</text>
      <text x="445" y="152" className="fill-red-700 text-[24px] font-black">+</text>
      <text x="492" y="152" className="fill-blue-700 text-[24px] font-black">−</text>
      <text x="525" y="152" className="fill-blue-700 text-[24px] font-black">−</text>

      <ArrowLine x1={390} y1={145} x2={225} y2={145} color="#2563eb" />
      <DiagramLabel x={460} y={245}>corpo neutro polarizado</DiagramLabel>
      <DiagramLabel x={380} y={70}>a atração pode ocorrer mesmo sem carga líquida no corpo</DiagramLabel>
    </svg>
  );
}

function CoulombDiagram() {
  return (
    <svg viewBox="0 0 760 300" className="h-[300px] w-full">
      <rect x="15" y="15" width="730" height="270" rx="26" fill="#ffffff" />

      <ChargeCircle x={210} y={145} label="q₁" fill="#fee2e2" />
      <ChargeCircle x={550} y={145} label="q₂" fill="#fee2e2" />

      <ArrowLine x1={250} y1={145} x2={320} y2={145} color="#dc2626" />
      <ArrowLine x1={510} y1={145} x2={440} y2={145} color="#dc2626" />

      <line x1="210" y1="225" x2="550" y2="225" stroke="#0f172a" strokeWidth="3" strokeDasharray="8 8" />
      <text x="380" y="250" textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        distância d
      </text>

      <text x="380" y="75" textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        forças iguais em módulo e opostas em sentido
      </text>
    </svg>
  );
}

function SuperpositionDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />

      <ChargeCircle x={190} y={235} label="q₁" fill="#fee2e2" />
      <ChargeCircle x={570} y={235} label="q₂" fill="#fee2e2" />
      <ChargeCircle x={380} y={105} label="q" fill="#dbeafe" />

      <ArrowLine x1={380} y1={105} x2={300} y2={160} color="#2563eb" />
      <ArrowLine x1={380} y1={105} x2={460} y2={160} color="#16a34a" />
      <ArrowLine x1={380} y1={105} x2={380} y2={205} color="#dc2626" />

      <text x="292" y="150" textAnchor="middle" className="fill-blue-700 text-[16px] font-black">F₁</text>
      <text x="468" y="150" textAnchor="middle" className="fill-emerald-700 text-[16px] font-black">F₂</text>
      <text x="405" y="190" className="fill-red-700 text-[16px] font-black">Fᵣ</text>

      <DiagramLabel x={380} y={55}>a força resultante é a soma vetorial das forças individuais</DiagramLabel>
      <DiagramLabel x={380} y={310}>em duas dimensões, decomponha em eixos e some componentes</DiagramLabel>
    </svg>
  );
}

function FieldChargeDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />

      <ChargeCircle x={250} y={160} label="Q" fill="#fee2e2" />
      <ChargeCircle x={520} y={160} label="+q" fill="#f8fafc" />

      <ArrowLine x1={295} y1={160} x2={465} y2={160} color="#dc2626" />
      <ArrowLine x1={520} y1={160} x2={610} y2={160} color="#2563eb" />

      <text x="380" y="135" textAnchor="middle" className="fill-red-700 text-[18px] font-black">campo criado por Q</text>
      <text x="600" y="145" textAnchor="middle" className="fill-blue-700 text-[18px] font-black">força em +q</text>

      <DiagramLabel x={380} y={255}>campo é propriedade do espaço; força é efeito sobre uma carga colocada ali</DiagramLabel>
    </svg>
  );
}

function FieldLinesDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <ChargeCircle x={210} y={165} label="+" fill="#fee2e2" />
      <ChargeCircle x={550} y={165} label="−" fill="#dbeafe" />

      {[-60, -30, 0, 30, 60].map((offset) => (
        <path
          key={`line-${offset}`}
          d={`M 255 ${165 + offset} C 350 ${95 + offset}, 425 ${95 + offset}, 505 ${165 + offset}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}

      <ArrowLine x1={350} y1={115} x2={420} y2={115} color="#2563eb" />
      <ArrowLine x1={350} y1={165} x2={420} y2={165} color="#2563eb" />
      <ArrowLine x1={350} y1={215} x2={420} y2={215} color="#2563eb" />

      <DiagramLabel x={210} y={270}>linhas saem da carga positiva</DiagramLabel>
      <DiagramLabel x={550} y={270}>linhas entram na carga negativa</DiagramLabel>
      <DiagramLabel x={380} y={55}>linhas de campo indicam direção e sentido do campo elétrico</DiagramLabel>
    </svg>
  );
}

function UniformFieldDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />

      <rect x="160" y="70" width="440" height="24" rx="8" fill="#dc2626" />
      <rect x="160" y="230" width="440" height="24" rx="8" fill="#2563eb" />

      <text x="120" y="90" className="fill-red-700 text-[22px] font-black">+</text>
      <text x="120" y="250" className="fill-blue-700 text-[22px] font-black">−</text>

      {[220, 300, 380, 460, 540].map((x) => (
        <ArrowLine key={x} x1={x} y1={105} x2={x} y2={215} color="#0f172a" />
      ))}

      <DiagramLabel x={380} y={45}>campo uniforme entre placas paralelas</DiagramLabel>
      <DiagramLabel x={380} y={292}>linhas retas, paralelas e igualmente espaçadas</DiagramLabel>
    </svg>
  );
}

function PotentialDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle cx="160" cy="170" r="48" fill="#fee2e2" stroke="#0f172a" strokeWidth="4" />
      <text x="160" y="178" textAnchor="middle" className="fill-slate-950 text-[24px] font-black">Q</text>

      <circle cx="340" cy="170" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
      <text x="340" y="132" textAnchor="middle" className="fill-slate-950 text-[17px] font-black">A</text>

      <circle cx="570" cy="170" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
      <text x="570" y="132" textAnchor="middle" className="fill-slate-950 text-[17px] font-black">B</text>

      <line x1="160" y1="245" x2="340" y2="245" stroke="#0f172a" strokeWidth="3" strokeDasharray="8 8" />
      <line x1="160" y1="275" x2="570" y2="275" stroke="#0f172a" strokeWidth="3" strokeDasharray="8 8" />

      <text x="250" y="238" textAnchor="middle" className="fill-slate-700 text-[15px] font-bold">r_A</text>
      <text x="365" y="268" textAnchor="middle" className="fill-slate-700 text-[15px] font-bold">r_B</text>

      <DiagramLabel x={380} y={70}>para carga positiva, o potencial diminui com a distância</DiagramLabel>
      <DiagramLabel x={380} y={305}>V = kQ/r</DiagramLabel>
    </svg>
  );
}

function ConductorDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle cx="380" cy="165" r="95" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
      {[
        [310, 105],
        [450, 105],
        [300, 190],
        [460, 190],
        [380, 75],
        [380, 255],
        [285, 150],
        [475, 150],
      ].map(([x, y], index) => (
        <text key={index} x={x} y={y} textAnchor="middle" className="fill-red-700 text-[22px] font-black">
          +
        </text>
      ))}

      <text x="380" y="172" textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        E = 0
      </text>

      <DiagramLabel x={380} y={55}>condutor em equilíbrio eletrostático</DiagramLabel>
      <DiagramLabel x={380} y={295}>cargas em excesso ficam na superfície; campo interno é nulo</DiagramLabel>
    </svg>
  );
}

function FaradayDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <rect x="280" y="85" width="210" height="160" rx="22" fill="#e2e8f0" stroke="#0f172a" strokeWidth="5" />
      <rect x="325" y="120" width="120" height="90" rx="18" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />

      {[80, 130, 180, 230].map((y) => (
        <ArrowLine key={y} x1={95} y1={y} x2={245} y2={y} color="#2563eb" />
      ))}

      <text x="385" y="172" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">
        interior protegido
      </text>

      <DiagramLabel x={380} y={55}>blindagem eletrostática</DiagramLabel>
      <DiagramLabel x={380} y={292}>as cargas se redistribuem na superfície externa do condutor</DiagramLabel>
    </svg>
  );
}

function PointEffectDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle cx="230" cy="170" r="70" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
      {[
        [180, 130],
        [220, 105],
        [270, 130],
        [170, 190],
        [230, 235],
        [285, 190],
      ].map(([x, y], index) => (
        <text key={index} x={x} y={y} textAnchor="middle" className="fill-red-700 text-[20px] font-black">
          +
        </text>
      ))}

      <path d="M500 240 L610 240 L555 75 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
      {[
        [555, 95],
        [545, 125],
        [565, 125],
        [535, 170],
        [575, 170],
        [520, 220],
        [590, 220],
      ].map(([x, y], index) => (
        <text key={index} x={x} y={y} textAnchor="middle" className="fill-red-700 text-[20px] font-black">
          +
        </text>
      ))}

      <ArrowLine x1={555} y1={75} x2={555} y2={35} color="#dc2626" />
      <DiagramLabel x={230} y={285}>superfície arredondada: campo menor</DiagramLabel>
      <DiagramLabel x={555} y={285}>ponta: campo mais intenso</DiagramLabel>
    </svg>
  );
}

function GraphsDiagram() {
  return (
    <svg viewBox="0 0 760 350" className="h-[350px] w-full">
      <rect x="15" y="15" width="730" height="320" rx="26" fill="#ffffff" />

      <line x1="100" y1="270" x2="300" y2="270" stroke="#0f172a" strokeWidth="4" />
      <line x1="100" y1="270" x2="100" y2="80" stroke="#0f172a" strokeWidth="4" />
      <path d="M115 95 C150 180, 230 240, 290 260" fill="none" stroke="#2563eb" strokeWidth="5" />
      <text x="105" y="70" className="fill-slate-950 text-[16px] font-black">E</text>
      <text x="310" y="275" className="fill-slate-950 text-[16px] font-black">r</text>
      <DiagramLabel x={200} y={310}>E ∝ 1/r²</DiagramLabel>

      <line x1="460" y1="270" x2="660" y2="270" stroke="#0f172a" strokeWidth="4" />
      <line x1="460" y1="270" x2="460" y2="80" stroke="#0f172a" strokeWidth="4" />
      <path d="M475 100 C520 165, 590 225, 650 260" fill="none" stroke="#dc2626" strokeWidth="5" />
      <text x="465" y="70" className="fill-slate-950 text-[16px] font-black">V</text>
      <text x="670" y="275" className="fill-slate-950 text-[16px] font-black">r</text>
      <DiagramLabel x={560} y={310}>V ∝ 1/r</DiagramLabel>

      <DiagramLabel x={380} y={45}>campo cai mais rapidamente que potencial</DiagramLabel>
    </svg>
  );
}

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "1. Contexto físico e histórico",
    accent: "from-indigo-600 to-purple-700",
    paragraphs: [
      "A Eletrostática é a parte da Eletricidade que estuda as cargas elétricas em repouso e os efeitos produzidos por elas. Quando falamos em cargas em repouso, o foco não está em correntes elétricas atravessando circuitos, nem em motores, resistores ou geradores funcionando. O foco está em entender como corpos eletrizados interagem, como produzem forças, como criam campos elétricos, como armazenam energia e como se comportam quando estão em equilíbrio.",
      "A palavra eletrostática pode ser dividida em duas ideias: eletro, relacionada a fenômenos elétricos, e estática, relacionada a uma situação sem movimento macroscópico de cargas. Isso não significa que nada microscópico aconteça. Em um metal, elétrons livres podem se reorganizar rapidamente até o equilíbrio.",
      "Historicamente, fenômenos elétricos foram observados desde a Antiguidade, como o âmbar atritado atraindo pequenos corpos. Com o desenvolvimento experimental e matemático, especialmente com Coulomb, Faraday e outros, a eletricidade deixou de ser curiosidade e passou a ser uma teoria física poderosa.",
      "A Eletrostática é base para campo elétrico, potencial elétrico, energia potencial elétrica, capacitores, corrente elétrica, eletrodinâmica, eletromagnetismo e Física Moderna. Reduzir esse conteúdo a uma fórmula solta seria uma forma elegante de estudar errado, esse hobby antigo da civilização.",
    ],
    numbered: [
      "A matéria possui cargas elétricas.",
      "Cargas podem estar equilibradas ou em excesso.",
      "Corpos eletrizados interagem por forças.",
      "Cargas criam campos elétricos no espaço.",
      "Campos podem realizar trabalho sobre cargas.",
      "Configurações de cargas armazenam energia.",
      "Condutores se comportam de modo especial porque possuem cargas livres.",
    ],
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "Eletrostática estuda como cargas em repouso organizam forças, campos, potenciais, energia e equilíbrio elétrico.",
      },
    ],
  },
  {
    id: 2,
    icon: Zap,
    title: "2. Ideia intuitiva de carga elétrica",
    accent: "from-purple-600 to-indigo-700",
    paragraphs: [
      "Carga elétrica é uma propriedade da matéria associada às interações elétricas. Assim como a massa está associada à interação gravitacional, a carga elétrica está associada à interação elétrica.",
      "Na estrutura básica da matéria, os prótons possuem carga positiva, os elétrons possuem carga negativa e os nêutrons não possuem carga elétrica resultante. A carga elementar é representada por e e vale aproximadamente 1,6 × 10⁻¹⁹ C.",
      "Um corpo eletricamente neutro não é um corpo sem cargas. Ele possui cargas positivas e negativas em quantidades equivalentes. Um corpo positivo perdeu elétrons. Um corpo negativo ganhou elétrons.",
      "Nos processos comuns de eletrização, normalmente quem se move são os elétrons, não os prótons. Os prótons ficam presos no núcleo. Então, quando um corpo fica positivo, ele não ganhou prótons; ele perdeu elétrons.",
    ],
    diagram: {
      kind: "chargeStates",
      title: "Diagrama visual: corpo neutro, positivo e negativo",
      caption:
        "O corpo neutro tem equilíbrio entre cargas. O positivo perdeu elétrons. O negativo ganhou elétrons.",
    },
    panels: [
      {
        title: "Carga elementar",
        formula: String.raw`e = 1{,}6 \times 10^{-19} \ \text{C}`,
        terms: [
          "e: módulo da carga elementar.",
          "próton: carga +e.",
          "elétron: carga −e.",
          "nêutron: carga elétrica resultante nula.",
        ],
        structure: [
          "A carga elétrica aparece em múltiplos da carga elementar.",
          "O sinal indica excesso ou falta de elétrons.",
          "O corpo neutro possui cargas, mas a soma algébrica é zero.",
        ],
        steps: [
          {
            title: "Corpo neutro",
            formulas: [
              String.raw`Q = N(+e) + N(-e)`,
              String.raw`Q = 0`,
            ],
          },
          {
            title: "Corpo positivo",
            body: ["Perde elétrons e fica com falta relativa de carga negativa."],
          },
          {
            title: "Corpo negativo",
            body: ["Ganha elétrons e fica com excesso de carga negativa."],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "3. Princípios fundamentais da carga elétrica",
    accent: "from-slate-950 to-indigo-800",
    paragraphs: [
      "A Eletrostática se apoia em três ideias fundamentais: atração e repulsão, conservação da carga elétrica e quantização da carga elétrica.",
      "Cargas de mesmo sinal se repelem. Cargas de sinais opostos se atraem. Porém, cuidado: se um corpo eletrizado atrai um corpo neutro, isso não significa obrigatoriamente que o neutro tenha carga oposta. Ele pode ter sido polarizado.",
      "A carga elétrica total de um sistema isolado se conserva. Isso significa que carga não é criada nem destruída nos processos comuns; ela é transferida ou redistribuída.",
      "A carga elétrica é quantizada. Em processos comuns, ela aparece como múltiplo inteiro da carga elementar.",
    ],
    diagram: {
      kind: "attractionRepulsion",
      title: "Diagrama visual: atração e repulsão",
      caption:
        "Cargas de mesmo sinal se repelem. Cargas de sinais opostos se atraem.",
    },
    panels: [
      {
        title: "Conservação da carga elétrica",
        formula: String.raw`\sum Q_{\text{antes}} = \sum Q_{\text{depois}}`,
        terms: [
          "ΣQ_antes: soma das cargas antes do processo.",
          "ΣQ_depois: soma das cargas depois do processo.",
          "Sistema isolado: sistema que não troca carga com o exterior.",
        ],
        structure: [
          "A carga total não é criada nem destruída.",
          "O que muda é a distribuição das cargas.",
          "Se um corpo ganha elétrons, outro deve ter perdido elétrons dentro do sistema.",
        ],
        steps: [
          {
            title: "Antes",
            formulas: [String.raw`Q_{\text{total, antes}} = 0`],
          },
          {
            title: "Depois do atrito",
            formulas: [
              String.raw`Q_{\text{total, depois}} = (+Q) + (-Q)`,
              String.raw`Q_{\text{total, depois}} = 0`,
            ],
          },
        ],
      },
      {
        title: "Quantização da carga elétrica",
        formula: String.raw`Q = \pm ne`,
        terms: [
          "Q: carga elétrica total.",
          "n: número inteiro.",
          "e: carga elementar.",
        ],
        structure: [
          "Elétrons são transferidos em unidades inteiras.",
          "Não existe transferência de meio elétron em processos comuns.",
          "A carga total deve ser múltiplo inteiro de e.",
        ],
        steps: [
          {
            title: "Número de elétrons",
            formulas: [String.raw`n = \frac{|Q|}{e}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Atração não prova, sozinha, que dois corpos possuem cargas de sinais opostos. Um corpo neutro polarizável também pode ser atraído por um corpo eletrizado.",
      },
    ],
  },
  {
    id: 4,
    icon: Layers,
    title: "4. Condutores, isolantes e semicondutores",
    accent: "from-indigo-700 to-blue-700",
    paragraphs: [
      "A resposta de um material a fenômenos elétricos depende da liberdade de movimento de suas cargas internas.",
      "Condutores possuem cargas elétricas livres para se movimentar com relativa facilidade. Nos metais, essas cargas móveis são principalmente elétrons livres. Exemplos comuns são cobre, alumínio, prata, ouro, ferro, grafite, soluções iônicas e gases ionizados.",
      "Isolantes são materiais nos quais as cargas não se movem livremente por grandes distâncias. Vidro, borracha, plástico, madeira seca, ar seco e porcelana são exemplos típicos.",
      "Semicondutores têm comportamento intermediário entre condutores e isolantes. Silício e germânio são exemplos importantes, especialmente na eletrônica moderna.",
    ],
    notes: [
      {
        title: "Ponto importante",
        type: "info",
        body: "Isolante não significa material sem carga. Todo material comum possui prótons e elétrons. A diferença está na mobilidade das cargas.",
      },
    ],
  },
  {
    id: 5,
    icon: Flame,
    title: "5. Eletrização por atrito",
    accent: "from-blue-700 to-cyan-700",
    paragraphs: [
      "A eletrização por atrito ocorre quando dois corpos, inicialmente neutros e de materiais diferentes, são atritados entre si e trocam elétrons.",
      "Após o atrito, um corpo perde elétrons e fica positivo, enquanto o outro ganha elétrons e fica negativo. Se o sistema estiver isolado, as cargas adquiridas têm mesmo módulo e sinais opostos.",
      "A série triboelétrica organiza materiais de acordo com sua tendência de perder ou ganhar elétrons quando atritados. O importante não é decorar uma lista infinita, mas entender que materiais diferentes seguram elétrons com intensidades diferentes.",
    ],
    diagram: {
      kind: "friction",
      title: "Diagrama visual: eletrização por atrito",
      caption:
        "Durante o atrito, elétrons podem ser transferidos de um material para outro.",
    },
    panels: [
      {
        title: "Conservação no atrito",
        formula: String.raw`(+Q) + (-Q) = 0`,
        terms: [
          "+Q: carga do corpo que perdeu elétrons.",
          "−Q: carga do corpo que ganhou elétrons.",
          "0: carga total do sistema inicialmente neutro.",
        ],
        structure: [
          "Os corpos começam neutros.",
          "O atrito transfere elétrons.",
          "A carga total do sistema isolado permanece constante.",
        ],
        steps: [
          {
            title: "Antes",
            formulas: [String.raw`Q_{\text{antes}} = 0`],
          },
          {
            title: "Depois",
            formulas: [String.raw`Q_{\text{depois}} = (+Q) + (-Q) = 0`],
          },
        ],
      },
    ],
  },
  {
    id: 6,
    icon: Gauge,
    title: "6. Eletrização por contato",
    accent: "from-cyan-700 to-teal-700",
    paragraphs: [
      "A eletrização por contato ocorre quando um corpo eletrizado toca outro corpo condutor. Durante o contato, cargas se redistribuem entre os corpos até que o sistema atinja equilíbrio eletrostático.",
      "Se os corpos forem condutores idênticos, a carga total se divide igualmente. Essa frase é importante: a divisão igual só vale diretamente para corpos idênticos.",
      "Se os corpos não forem idênticos, a divisão depende das dimensões, formas e capacitâncias. Em uma descrição mais avançada, no equilíbrio eles ficam no mesmo potencial, não necessariamente com cargas iguais.",
    ],
    diagram: {
      kind: "contact",
      title: "Diagrama visual: eletrização por contato",
      caption:
        "Duas esferas condutoras idênticas compartilham a carga total igualmente depois do contato.",
    },
    panels: [
      {
        title: "Contato entre duas esferas idênticas",
        formula: String.raw`Q_f = \frac{Q_1 + Q_2}{2}`,
        terms: [
          "Q_f: carga final de cada esfera.",
          "Q₁ e Q₂: cargas iniciais.",
          "2: número de esferas idênticas.",
        ],
        structure: [
          "Somamos a carga total do sistema.",
          "A carga total se conserva.",
          "Como as esferas são idênticas, a carga se divide igualmente.",
        ],
        steps: [
          {
            title: "Carga total",
            formulas: [String.raw`Q_{\text{total}} = Q_1 + Q_2`],
          },
          {
            title: "Divisão entre esferas idênticas",
            formulas: [String.raw`Q_f = \frac{Q_{\text{total}}}{2}`],
          },
        ],
      },
    ],
  },
  {
    id: 7,
    icon: Brain,
    title: "7. Eletrização por indução",
    accent: "from-teal-700 to-emerald-700",
    paragraphs: [
      "A eletrização por indução é uma das partes mais importantes e mais confundidas da Eletrostática. Na indução, não é necessário contato entre o corpo carregado e o corpo que será eletrizado.",
      "O corpo carregado que provoca a separação de cargas é chamado de indutor. O corpo que sofre a influência é chamado de induzido.",
      "Um corpo eletrizado, ao ser aproximado de um condutor neutro, reorganiza as cargas livres desse condutor. Se houver aterramento e a ordem correta for seguida, o condutor pode ficar eletrizado com sinal oposto ao indutor.",
      "A ordem é crucial: aproxima o indutor, aterra, retira o aterramento e só depois afasta o indutor. Trocar essa sequência é uma forma eficiente de errar a questão com personalidade.",
    ],
    diagram: {
      kind: "induction",
      title: "Diagrama visual: eletrização por indução",
      caption:
        "Na indução com bastão negativo, elétrons são repelidos e podem sair pelo aterramento. A esfera fica positiva.",
    },
    numbered: [
      "Aproxima-se o indutor eletrizado.",
      "As cargas livres do condutor se redistribuem.",
      "Conecta-se o condutor à Terra.",
      "Elétrons entram ou saem pelo aterramento, dependendo do sinal do indutor.",
      "Retira-se o aterramento mantendo o indutor próximo.",
      "Afasta-se o indutor.",
      "O condutor fica eletrizado.",
    ],
    notes: [
      {
        title: "Como isso cai em prova",
        type: "dark",
        body: "Questões costumam perguntar o sinal final do induzido e testar a ordem das etapas. A ordem correta muda tudo.",
      },
    ],
  },
  {
    id: 8,
    icon: Lightbulb,
    title: "8. Polarização",
    accent: "from-emerald-700 to-lime-700",
    paragraphs: [
      "Polarização é a separação ou deformação da distribuição de cargas em um corpo neutro sob a influência de um corpo eletrizado.",
      "Em um condutor, cargas livres se deslocam pelo material. Em um isolante, as cargas não se deslocam livremente por longas distâncias, mas podem sofrer pequenos deslocamentos ou orientações microscópicas.",
      "A polarização explica por que um corpo eletrizado pode atrair um corpo neutro. O lado mais próximo fica com carga efetiva de sinal oposto ao indutor e, por estar mais perto, a atração pode superar a repulsão do lado distante.",
    ],
    diagram: {
      kind: "polarization",
      title: "Diagrama visual: polarização de corpo neutro",
      caption:
        "O corpo neutro continua com carga total zero, mas suas cargas se reorganizam localmente.",
    },
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Se um corpo eletrizado atrai outro corpo, não conclua automaticamente que o outro tem carga oposta. Ele pode estar neutro e polarizado.",
      },
    ],
  },
  {
    id: 9,
    icon: Calculator,
    title: "9. Lei de Coulomb",
    accent: "from-lime-700 to-amber-700",
    paragraphs: [
      "A Lei de Coulomb descreve a força elétrica entre duas cargas puntiformes em repouso. Ela mostra que a força elétrica depende do produto dos módulos das cargas e diminui com o quadrado da distância entre elas.",
      "A força elétrica é uma força de ação à distância. Cada carga exerce força sobre a outra. Essas forças têm mesmo módulo, mesma direção e sentidos opostos, de acordo com a terceira lei de Newton.",
      "Se as cargas têm mesmo sinal, a força é repulsiva. Se têm sinais opostos, a força é atrativa.",
    ],
    diagram: {
      kind: "coulomb",
      title: "Diagrama visual: força elétrica entre duas cargas",
      caption:
        "As forças formam um par de ação e reação: mesmo módulo, mesma direção e sentidos opostos.",
    },
    panels: [
      {
        title: "Lei de Coulomb",
        formula: String.raw`F = k\frac{|q_1q_2|}{d^2}`,
        terms: [
          "F: módulo da força elétrica.",
          "k: constante eletrostática do meio.",
          "q₁ e q₂: cargas elétricas.",
          "d: distância entre as cargas.",
        ],
        structure: [
          "A força cresce com o produto das cargas.",
          "A força diminui com o quadrado da distância.",
          "O módulo é sempre positivo; o sentido depende dos sinais das cargas.",
        ],
        steps: [
          {
            title: "Dobrar uma carga",
            body: ["Se uma das cargas dobra, a força dobra."],
          },
          {
            title: "Dobrar a distância",
            formulas: [String.raw`F' = k\frac{|q_1q_2|}{(2d)^2} = \frac{F}{4}`],
          },
          {
            title: "Constante no vácuo",
            formulas: [String.raw`k_0 \approx 9{,}0 \times 10^9 \ \text{N}\cdot\text{m}^2/\text{C}^2`],
          },
        ],
      },
    ],
  },
  {
    id: 10,
    icon: Compass,
    title: "10. Princípio da superposição",
    accent: "from-amber-700 to-orange-700",
    paragraphs: [
      "Quando uma carga sofre a influência de várias outras cargas, a força elétrica resultante é a soma vetorial das forças individuais.",
      "Isso é o princípio da superposição. Cada carga produz seu efeito como se as outras não existissem, e depois somamos vetorialmente todos esses efeitos.",
      "Em problemas unidimensionais, a soma pode ser feita com sinais. Em problemas bidimensionais, o caminho mais seguro é decompor as forças ou campos em componentes.",
    ],
    diagram: {
      kind: "superposition",
      title: "Diagrama visual: superposição de forças",
      caption:
        "A resultante sobre a carga central é obtida somando vetorialmente as forças individuais.",
    },
    numbered: [
      "Desenhe as cargas.",
      "Determine se cada interação é atrativa ou repulsiva.",
      "Desenhe os vetores força ou campo.",
      "Calcule os módulos separadamente.",
      "Escolha eixos convenientes.",
      "Decomponha os vetores quando necessário.",
      "Some as componentes.",
      "Determine módulo e direção da resultante.",
    ],
    panels: [
      {
        title: "Força resultante",
        formula: String.raw`\vec{F}_{\text{R}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`,
        terms: [
          "F_R: força elétrica resultante.",
          "F₁, F₂, F₃: forças individuais.",
          "Setas: indicam que a soma é vetorial.",
        ],
        structure: [
          "A força elétrica tem direção e sentido.",
          "Não se somam apenas módulos em problemas vetoriais.",
          "O desenho dos vetores é parte da resolução.",
        ],
        steps: [
          {
            title: "Componentes",
            formulas: [
              String.raw`F_{Rx} = F_{1x} + F_{2x} + \cdots`,
              String.raw`F_{Ry} = F_{1y} + F_{2y} + \cdots`,
            ],
          },
          {
            title: "Módulo",
            formulas: [String.raw`F_R = \sqrt{F_{Rx}^2 + F_{Ry}^2}`],
          },
        ],
      },
    ],
  },
  {
    id: 11,
    icon: Zap,
    title: "11. Campo elétrico",
    accent: "from-orange-700 to-red-700",
    paragraphs: [
      "Campo elétrico é uma grandeza vetorial que descreve a influência elétrica que uma carga fonte produz no espaço ao seu redor.",
      "A ideia é separar causa e efeito. A carga fonte cria campo elétrico no espaço. Uma carga de prova colocada nesse campo sofre força elétrica.",
      "Campo elétrico não é a força. A força depende da carga colocada no ponto. O campo existe no ponto devido às cargas fontes.",
    ],
    diagram: {
      kind: "fieldCharge",
      title: "Diagrama visual: campo elétrico e força elétrica",
      caption:
        "A carga Q cria campo no espaço. A carga de prova +q sofre força por estar nesse campo.",
    },
    panels: [
      {
        title: "Definição de campo elétrico",
        formula: String.raw`\vec{E} = \frac{\vec{F}}{q}`,
        terms: [
          "E: campo elétrico.",
          "F: força elétrica sobre a carga de prova.",
          "q: carga de prova.",
        ],
        structure: [
          "O campo mede força por unidade de carga.",
          "A unidade pode ser N/C.",
          "A força sobre uma carga colocada no campo é F = qE.",
        ],
        steps: [
          {
            title: "Definição",
            formulas: [String.raw`\vec{E} = \frac{\vec{F}}{q}`],
          },
          {
            title: "Força elétrica",
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
          {
            title: "Carga negativa",
            body: ["Se q é negativa, a força tem sentido oposto ao campo."],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Diferença essencial",
        type: "warning",
        body: "Campo elétrico é propriedade do ponto do espaço. Força elétrica é o efeito sobre uma carga colocada naquele ponto.",
      },
    ],
  },
  {
    id: 12,
    icon: Target,
    title: "12. Campo elétrico de uma carga puntiforme",
    accent: "from-red-700 to-rose-700",
    paragraphs: [
      "Uma carga puntiforme Q cria um campo elétrico ao seu redor. O módulo do campo depende do módulo da carga fonte e da distância até ela.",
      "Se Q é positiva, o campo aponta para fora da carga. Se Q é negativa, o campo aponta para a carga.",
      "O campo elétrico de uma carga puntiforme diminui com o quadrado da distância, assim como a força elétrica de Coulomb.",
    ],
    panels: [
      {
        title: "Campo de carga puntiforme",
        formula: String.raw`E = k\frac{|Q|}{d^2}`,
        terms: [
          "E: módulo do campo elétrico.",
          "k: constante eletrostática.",
          "Q: carga fonte.",
          "d: distância até a carga fonte.",
        ],
        structure: [
          "O campo cresce com o módulo da carga fonte.",
          "O campo diminui com o quadrado da distância.",
          "O sentido depende do sinal de Q.",
        ],
        steps: [
          {
            title: "Partindo de Coulomb",
            formulas: [
              String.raw`F = k\frac{|Qq|}{d^2}`,
              String.raw`E = \frac{F}{|q|}`,
            ],
          },
          {
            title: "Cancelando a carga de prova",
            formulas: [String.raw`E = k\frac{|Q|}{d^2}`],
          },
        ],
      },
    ],
  },
  {
    id: 13,
    icon: BarChart3,
    title: "13. Linhas de campo elétrico",
    accent: "from-rose-700 to-pink-700",
    paragraphs: [
      "Linhas de campo são uma representação visual do campo elétrico. A direção da linha indica a direção do campo, e o sentido da linha indica o sentido do campo.",
      "Por convenção, as linhas de campo saem das cargas positivas e entram nas cargas negativas.",
      "A densidade de linhas indica intensidade: onde as linhas estão mais próximas, o campo é mais intenso. Linhas de campo nunca se cruzam, pois isso indicaria dois sentidos diferentes para o campo no mesmo ponto.",
    ],
    diagram: {
      kind: "fieldLines",
      title: "Diagrama visual: linhas de campo",
      caption:
        "As linhas saem do positivo e entram no negativo. Quanto mais concentradas, maior o campo.",
    },
    bullets: [
      "linhas saem de cargas positivas;",
      "linhas entram em cargas negativas;",
      "linhas mais próximas indicam campo mais intenso;",
      "linhas de campo não se cruzam;",
      "o vetor campo é tangente à linha em cada ponto.",
    ],
  },
  {
    id: 14,
    icon: Layers,
    title: "14. Campo elétrico uniforme",
    accent: "from-pink-700 to-fuchsia-700",
    paragraphs: [
      "Campo elétrico uniforme é aquele que possui mesmo módulo, mesma direção e mesmo sentido em todos os pontos de uma região.",
      "Um exemplo importante ocorre entre duas placas paralelas extensas, carregadas com sinais opostos. Longe das bordas, as linhas de campo são aproximadamente retas, paralelas e igualmente espaçadas.",
      "No campo uniforme, a força sobre uma carga é constante enquanto ela permanece na região do campo.",
    ],
    diagram: {
      kind: "uniformField",
      title: "Diagrama visual: campo elétrico uniforme",
      caption:
        "Entre placas paralelas, o campo é aproximadamente uniforme longe das bordas.",
    },
    panels: [
      {
        title: "Campo uniforme entre placas",
        formula: String.raw`E = \frac{U}{d}`,
        terms: [
          "E: campo elétrico uniforme.",
          "U: diferença de potencial entre as placas.",
          "d: distância entre as placas.",
        ],
        structure: [
          "Quanto maior a tensão, maior o campo.",
          "Quanto maior a distância, menor o campo.",
          "O campo aponta da placa positiva para a placa negativa.",
        ],
        steps: [
          {
            title: "Relação entre tensão e campo",
            formulas: [String.raw`U = Ed`],
          },
          {
            title: "Isolando o campo",
            formulas: [String.raw`E = \frac{U}{d}`],
          },
        ],
      },
    ],
  },
  {
    id: 15,
    icon: Flame,
    title: "15. Trabalho da força elétrica",
    accent: "from-fuchsia-700 to-violet-700",
    paragraphs: [
      "A força elétrica pode realizar trabalho quando desloca uma carga em um campo elétrico.",
      "Em eletrostática, a força elétrica é conservativa. Isso significa que o trabalho realizado pela força elétrica entre dois pontos não depende do caminho percorrido, mas apenas dos pontos inicial e final.",
      "Essa propriedade permite definir energia potencial elétrica e potencial elétrico de maneira consistente.",
    ],
    panels: [
      {
        title: "Trabalho em diferença de potencial",
        formula: String.raw`\tau = q(V_A - V_B)`,
        terms: [
          "τ: trabalho da força elétrica.",
          "q: carga deslocada.",
          "V_A e V_B: potenciais elétricos nos pontos A e B.",
        ],
        structure: [
          "O trabalho depende da carga.",
          "O trabalho depende da diferença de potencial.",
          "O trabalho não depende do caminho em campo eletrostático.",
        ],
        steps: [
          {
            title: "Diferença de potencial",
            formulas: [String.raw`U_{AB} = V_A - V_B`],
          },
          {
            title: "Trabalho",
            formulas: [String.raw`\tau = qU_{AB}`],
          },
        ],
      },
    ],
  },
  {
    id: 16,
    icon: Gauge,
    title: "16. Energia potencial elétrica",
    accent: "from-violet-700 to-indigo-800",
    paragraphs: [
      "Energia potencial elétrica é a energia associada à configuração de cargas elétricas.",
      "Duas cargas interagem eletricamente. Dependendo dos sinais e da distância entre elas, o sistema pode ter energia potencial positiva ou negativa.",
      "Cargas de mesmo sinal possuem energia potencial positiva quando usamos o infinito como referência zero. Cargas de sinais opostos possuem energia potencial negativa.",
    ],
    panels: [
      {
        title: "Energia potencial elétrica entre duas cargas",
        formula: String.raw`E_p = k\frac{q_1q_2}{d}`,
        terms: [
          "E_p: energia potencial elétrica.",
          "k: constante eletrostática.",
          "q₁ e q₂: cargas elétricas com sinal.",
          "d: distância entre as cargas.",
        ],
        structure: [
          "Aqui os sinais das cargas importam.",
          "Cargas de mesmo sinal geram energia potencial positiva.",
          "Cargas de sinais opostos geram energia potencial negativa.",
        ],
        steps: [
          {
            title: "Mesmo sinal",
            formulas: [String.raw`q_1q_2 > 0 \Rightarrow E_p > 0`],
          },
          {
            title: "Sinais opostos",
            formulas: [String.raw`q_1q_2 < 0 \Rightarrow E_p < 0`],
          },
        ],
      },
    ],
  },
  {
    id: 17,
    icon: Calculator,
    title: "17. Potencial elétrico",
    accent: "from-indigo-800 to-slate-950",
    paragraphs: [
      "Potencial elétrico é uma grandeza escalar que mede energia potencial elétrica por unidade de carga.",
      "Enquanto o campo elétrico é vetor, o potencial elétrico é escalar. Isso muda muito a forma de resolver problemas. Campos precisam ser somados vetorialmente; potenciais são somados algebricamente.",
      "Uma carga fonte cria potencial elétrico no espaço ao seu redor. Uma carga colocada nesse ponto terá energia potencial elétrica associada ao potencial daquele ponto.",
    ],
    diagram: {
      kind: "potential",
      title: "Diagrama visual: potencial elétrico",
      caption:
        "Para uma carga positiva, o potencial diminui conforme a distância aumenta.",
    },
    panels: [
      {
        title: "Potencial elétrico de carga puntiforme",
        formula: String.raw`V = k\frac{Q}{d}`,
        terms: [
          "V: potencial elétrico.",
          "k: constante eletrostática.",
          "Q: carga fonte com sinal.",
          "d: distância até a carga fonte.",
        ],
        structure: [
          "Potencial é escalar.",
          "O sinal de Q importa.",
          "Potenciais de várias cargas são somados algebricamente.",
        ],
        steps: [
          {
            title: "Potencial e energia",
            formulas: [String.raw`V = \frac{E_p}{q}`],
          },
          {
            title: "Energia da carga q em um ponto",
            formulas: [String.raw`E_p = qV`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Diferença decisiva",
        type: "warning",
        body: "Campo elétrico é vetor. Potencial elétrico é escalar. Campo pode se anular por simetria enquanto potencial não se anula.",
      },
    ],
  },
  {
    id: 18,
    icon: Zap,
    title: "18. Diferença de potencial elétrico",
    accent: "from-slate-950 to-indigo-900",
    paragraphs: [
      "Diferença de potencial, ou ddp, é a diferença entre os potenciais elétricos de dois pontos.",
      "Ela mede a energia por unidade de carga envolvida no deslocamento entre esses pontos. Por isso, ddp aparece diretamente em trabalho elétrico, capacitores e, mais tarde, circuitos elétricos.",
      "Uma carga positiva abandonada tende a se mover espontaneamente no sentido de diminuição do potencial elétrico. Uma carga negativa tende a responder no sentido oposto.",
    ],
    panels: [
      {
        title: "Diferença de potencial",
        formula: String.raw`U_{AB} = V_A - V_B`,
        terms: [
          "U_AB: diferença de potencial entre A e B.",
          "V_A: potencial no ponto A.",
          "V_B: potencial no ponto B.",
        ],
        structure: [
          "A ddp depende de dois pontos.",
          "Ela está ligada ao trabalho por unidade de carga.",
          "Pontos equipotenciais possuem ddp nula entre si.",
        ],
        steps: [
          {
            title: "Trabalho e ddp",
            formulas: [String.raw`\tau_{AB} = qU_{AB}`],
          },
          {
            title: "Ddp nula",
            formulas: [String.raw`V_A = V_B \Rightarrow U_{AB} = 0`],
          },
        ],
      },
    ],
  },
  {
    id: 19,
    icon: Layers,
    title: "19. Condutores em equilíbrio eletrostático",
    accent: "from-indigo-900 to-purple-900",
    paragraphs: [
      "Um condutor está em equilíbrio eletrostático quando suas cargas livres não apresentam movimento ordenado.",
      "Se houvesse campo elétrico no interior do condutor, as cargas livres sofreriam força e se moveriam. Como em equilíbrio elas não se movem macroscopicamente, o campo elétrico interno deve ser nulo.",
      "O excesso de carga em um condutor em equilíbrio fica na superfície externa. Além disso, o potencial é constante em todo o condutor, e o campo elétrico na superfície é perpendicular a ela.",
    ],
    diagram: {
      kind: "conductor",
      title: "Diagrama visual: condutor em equilíbrio",
      caption:
        "No equilíbrio eletrostático, o campo interno é nulo e a carga em excesso fica na superfície.",
    },
    bullets: [
      "campo elétrico interno nulo;",
      "potencial constante em todo o condutor;",
      "carga em excesso na superfície externa;",
      "campo elétrico perpendicular à superfície;",
      "maior concentração de cargas em regiões de maior curvatura.",
    ],
    notes: [
      {
        title: "Raciocínio físico",
        type: "success",
        body: "Se existisse campo dentro do condutor, cargas livres se moveriam. Se elas ainda se movem, não há equilíbrio. Logo, em equilíbrio, o campo interno é nulo.",
      },
    ],
  },
  {
    id: 20,
    icon: ShieldCheck,
    title: "20. Blindagem eletrostática",
    accent: "from-purple-900 to-slate-950",
    paragraphs: [
      "Blindagem eletrostática é o fenômeno pelo qual o interior de um condutor em equilíbrio fica protegido de campos elétricos externos.",
      "Quando um condutor é colocado em uma região com campo externo, suas cargas livres se redistribuem na superfície de modo que o campo resultante no interior seja nulo.",
      "A gaiola de Faraday é a aplicação clássica desse princípio. Ela ajuda a explicar por que o interior de um carro pode ser uma região relativamente segura durante uma tempestade elétrica.",
    ],
    diagram: {
      kind: "faraday",
      title: "Diagrama visual: blindagem eletrostática",
      caption:
        "As cargas se redistribuem na superfície e anulam o campo elétrico no interior do condutor.",
    },
  },
  {
    id: 21,
    icon: AlertTriangle,
    title: "21. Poder das pontas",
    accent: "from-red-700 to-red-950",
    paragraphs: [
      "Em condutores eletrizados, as cargas tendem a se concentrar mais intensamente em regiões pontiagudas, onde o raio de curvatura é menor.",
      "Nessas regiões, o campo elétrico nas proximidades pode ficar muito intenso. Esse fenômeno é chamado de poder das pontas.",
      "O poder das pontas está relacionado ao funcionamento de para-raios e também a descargas elétricas em pontas metálicas.",
    ],
    diagram: {
      kind: "pointEffect",
      title: "Diagrama visual: poder das pontas",
      caption:
        "Na ponta, a concentração de cargas é maior e o campo elétrico nas proximidades fica mais intenso.",
    },
    notes: [
      {
        title: "Aplicação",
        type: "info",
        body: "Para-raios usam o poder das pontas para favorecer descargas elétricas controladas e conduzi-las para a Terra.",
      },
    ],
  },
  {
    id: 22,
    icon: BarChart3,
    title: "22. Gráficos importantes",
    accent: "from-blue-900 to-indigo-900",
    paragraphs: [
      "Gráficos em Eletrostática ajudam a enxergar como campo, potencial e energia variam com a distância.",
      "Para uma carga puntiforme, o campo elétrico diminui com o quadrado da distância, enquanto o potencial diminui com a distância de forma inversamente proporcional.",
      "Isso significa que o campo cai mais rapidamente que o potencial quando nos afastamos da carga fonte.",
    ],
    diagram: {
      kind: "graphs",
      title: "Diagrama visual: gráficos qualitativos",
      caption:
        "O campo de carga puntiforme varia como 1/r². O potencial varia como 1/r.",
    },
    panels: [
      {
        title: "Campo e potencial de carga puntiforme",
        formula: String.raw`E \propto \frac{1}{r^2} \qquad V \propto \frac{1}{r}`,
        terms: [
          "E: campo elétrico.",
          "V: potencial elétrico.",
          "r: distância até a carga fonte.",
        ],
        structure: [
          "O campo depende do inverso do quadrado da distância.",
          "O potencial depende do inverso da distância.",
          "O campo diminui mais rapidamente que o potencial.",
        ],
        steps: [
          {
            title: "Campo",
            formulas: [String.raw`E = k\frac{|Q|}{r^2}`],
          },
          {
            title: "Potencial",
            formulas: [String.raw`V = k\frac{Q}{r}`],
          },
        ],
      },
    ],
  },
  {
    id: 23,
    icon: Calculator,
    title: "23. Análise dimensional",
    accent: "from-indigo-900 to-slate-950",
    paragraphs: [
      "Análise dimensional é uma forma de verificar se uma fórmula faz sentido em termos de unidades. Ela não substitui o raciocínio físico, mas evita erros grosseiros.",
      "Em Eletrostática, aparecem unidades como coulomb, newton, volt, joule, metro e newton por coulomb.",
    ],
    panels: [
      {
        title: "Unidades importantes",
        formula: String.raw`\text{C}, \ \text{N}, \ \text{V}, \ \text{J}, \ \frac{\text{N}}{\text{C}}`,
        terms: [
          "C: coulomb, unidade de carga elétrica.",
          "N: newton, unidade de força.",
          "V: volt, unidade de potencial elétrico.",
          "J: joule, unidade de energia.",
          "N/C: unidade de campo elétrico.",
        ],
        structure: [
          "Campo elétrico pode ser medido em N/C.",
          "Potencial elétrico pode ser medido em J/C.",
          "Energia potencial elétrica é medida em joule.",
        ],
        steps: [
          {
            title: "Campo elétrico",
            formulas: [
              String.raw`E = \frac{F}{q}`,
              String.raw`[E] = \frac{\text{N}}{\text{C}}`,
            ],
          },
          {
            title: "Potencial elétrico",
            formulas: [
              String.raw`V = \frac{E_p}{q}`,
              String.raw`[V] = \frac{\text{J}}{\text{C}}`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: 24,
    icon: AlertTriangle,
    title: "24. Armadilhas e erros comuns",
    accent: "from-red-700 to-red-950",
    paragraphs: [
      "Eletrostática tem muitas fórmulas simples, mas as armadilhas conceituais são brutais. A maioria dos erros aparece quando o aluno tenta decorar sinais e fórmulas sem desenhar forças, campos e potenciais.",
    ],
    bullets: [
      "achar que corpo neutro não possui cargas;",
      "achar que corpo positivo ganhou prótons;",
      "concluir que atração sempre significa cargas opostas;",
      "esquecer que na eletrização comum quem se move são elétrons;",
      "trocar a ordem das etapas na indução;",
      "somar campos como escalares quando são vetores;",
      "somar potenciais como vetores quando são escalares;",
      "confundir campo elétrico com força elétrica;",
      "confundir potencial elétrico com energia potencial elétrica;",
      "achar que campo nulo implica potencial nulo;",
      "achar que potencial nulo implica campo nulo;",
      "usar módulo em energia potencial elétrica sem considerar sinais.",
    ],
    notes: [
      {
        title: "Resumo da tragédia",
        type: "warning",
        body: "Campo é vetor. Potencial é escalar. Força depende da carga colocada. Campo pertence ao ponto do espaço. Potencial não é energia, é energia por carga.",
      },
    ],
  },
  {
    id: 25,
    icon: Target,
    title: "25. Pontos importantes para ITA/IME",
    accent: "from-slate-950 to-purple-900",
    paragraphs: [
      "Em provas difíceis, Eletrostática aparece com superposição vetorial, simetria, pontos de campo nulo, pontos de potencial nulo, condutores em equilíbrio, indução, blindagem, gráficos e energia potencial.",
      "O aluno forte não começa substituindo fórmula. Ele desenha o sistema, identifica sinais, direções, simetrias, grandezas vetoriais e grandezas escalares.",
    ],
    bullets: [
      "superposição de forças e campos;",
      "decomposição vetorial em duas dimensões;",
      "pontos onde o campo elétrico é nulo;",
      "pontos onde o potencial elétrico é nulo;",
      "diferença entre campo nulo e potencial nulo;",
      "condutores em equilíbrio eletrostático;",
      "blindagem eletrostática;",
      "eletrização por indução;",
      "poder das pontas;",
      "energia potencial elétrica com sinais;",
      "gráficos de E e V em função da distância.",
    ],
    notes: [
      {
        title: "Roteiro mental de prova",
        type: "dark",
        body: "Antes de calcular, pergunte: isso é vetor ou escalar? O sinal importa? Há simetria? O ponto é equipotencial? O condutor está em equilíbrio? O problema pede campo, força, potencial ou energia?",
      },
    ],
  },
];

const examples: Example[] = [
  {
    id: "ex1",
    title: "Exemplo 1 — Quantização da carga",
    statement:
      "Um corpo perdeu 5,0 × 10¹² elétrons. Determine sua carga elétrica.",
    explanation: [
      "Se o corpo perdeu elétrons, ficou positivo. A carga adquirida é o número de elétrons multiplicado pela carga elementar.",
    ],
    formulas: [
      String.raw`Q = ne`,
      String.raw`Q = 5{,}0 \times 10^{12}\cdot 1{,}6 \times 10^{-19}`,
      String.raw`Q = 8{,}0 \times 10^{-7} \ \text{C}`,
      String.raw`Q = +8{,}0 \times 10^{-7} \ \text{C}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A carga é positiva porque o corpo perdeu elétrons.",
      },
    ],
  },
  {
    id: "ex2",
    title: "Exemplo 2 — Contato entre esferas idênticas",
    statement:
      "Duas esferas metálicas idênticas têm cargas +6 μC e −2 μC. Após contato e separação, qual a carga final de cada uma?",
    explanation: [
      "Como as esferas são idênticas, a carga total se divide igualmente após o contato.",
    ],
    formulas: [
      String.raw`Q_{\text{total}} = +6 - 2 = +4 \ \mu\text{C}`,
      String.raw`Q_f = \frac{Q_{\text{total}}}{2}`,
      String.raw`Q_f = \frac{+4}{2} = +2 \ \mu\text{C}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "Cada esfera fica com +2 μC.",
      },
    ],
  },
  {
    id: "ex3",
    title: "Exemplo 3 — Lei de Coulomb",
    statement:
      "Duas cargas de módulos 2 μC e 3 μC estão separadas por 0,30 m no vácuo. Determine o módulo da força elétrica.",
    explanation: [
      "Usamos a Lei de Coulomb. Como a questão pede módulo, usamos os módulos das cargas.",
    ],
    formulas: [
      String.raw`F = k\frac{|q_1q_2|}{d^2}`,
      String.raw`F = 9{,}0\times10^9\cdot\frac{(2\times10^{-6})(3\times10^{-6})}{(0{,}30)^2}`,
      String.raw`F = 0{,}60 \ \text{N}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "O módulo da força elétrica é 0,60 N.",
      },
    ],
  },
  {
    id: "ex4",
    title: "Exemplo 4 — Campo elétrico",
    statement:
      "Uma carga de prova +2 μC sofre força elétrica de 0,40 N em um ponto. Determine o campo elétrico nesse ponto.",
    explanation: [
      "Campo elétrico é força por unidade de carga. Como a carga de prova é positiva, a força tem o mesmo sentido do campo.",
    ],
    formulas: [
      String.raw`E = \frac{F}{q}`,
      String.raw`E = \frac{0{,}40}{2\times10^{-6}}`,
      String.raw`E = 2{,}0\times10^5 \ \text{N/C}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "O campo elétrico vale 2,0 × 10⁵ N/C.",
      },
    ],
  },
  {
    id: "ex5",
    title: "Exemplo 5 — Potencial elétrico",
    statement:
      "Uma carga Q = +4 μC está no vácuo. Determine o potencial elétrico a 0,20 m da carga.",
    explanation: [
      "O potencial elétrico de uma carga puntiforme é escalar e depende do sinal da carga fonte.",
    ],
    formulas: [
      String.raw`V = k\frac{Q}{d}`,
      String.raw`V = 9{,}0\times10^9\cdot\frac{4\times10^{-6}}{0{,}20}`,
      String.raw`V = 1{,}8\times10^5 \ \text{V}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "O potencial é positivo e vale 1,8 × 10⁵ V.",
      },
    ],
  },
  {
    id: "ex6",
    title: "Exemplo 6 — Campo nulo e potencial não nulo",
    statement:
      "No ponto médio entre duas cargas iguais positivas, o campo elétrico pode ser nulo? E o potencial?",
    explanation: [
      "Os campos elétricos produzidos pelas duas cargas têm mesmo módulo e sentidos opostos no ponto médio, então se anulam. Já o potencial é escalar e as contribuições positivas se somam.",
    ],
    formulas: [
      String.raw`\vec{E}_1 + \vec{E}_2 = 0`,
      String.raw`V = V_1 + V_2`,
      String.raw`V > 0`,
    ],
    notes: [
      {
        title: "Conclusão",
        type: "warning",
        body: "Campo nulo não significa potencial nulo. Essa é uma das pegadinhas mais bonitas e irritantes da Eletrostática.",
      },
    ],
  },
];

const formulaSummary: FormulaSummary[] = [
  {
    title: "Carga elementar",
    formula: String.raw`e = 1{,}6 \times 10^{-19} \ \text{C}`,
    description: "Módulo da carga do próton e do elétron.",
  },
  {
    title: "Quantização da carga",
    formula: String.raw`Q = \pm ne`,
    description: "Carga elétrica aparece em múltiplos inteiros de e.",
  },
  {
    title: "Conservação da carga",
    formula: String.raw`\sum Q_{\text{antes}} = \sum Q_{\text{depois}}`,
    description: "Carga total de sistema isolado se conserva.",
  },
  {
    title: "Lei de Coulomb",
    formula: String.raw`F = k\frac{|q_1q_2|}{d^2}`,
    description: "Força elétrica entre cargas puntiformes.",
  },
  {
    title: "Campo elétrico",
    formula: String.raw`\vec{E} = \frac{\vec{F}}{q}`,
    description: "Força elétrica por unidade de carga.",
  },
  {
    title: "Força elétrica",
    formula: String.raw`\vec{F} = q\vec{E}`,
    description: "Força sofrida por uma carga em um campo elétrico.",
  },
  {
    title: "Campo de carga puntiforme",
    formula: String.raw`E = k\frac{|Q|}{d^2}`,
    description: "Campo produzido por uma carga fonte puntiforme.",
  },
  {
    title: "Campo uniforme",
    formula: String.raw`E = \frac{U}{d}`,
    description: "Campo entre placas paralelas.",
  },
  {
    title: "Trabalho elétrico",
    formula: String.raw`\tau = qU`,
    description: "Trabalho da força elétrica em uma ddp.",
  },
  {
    title: "Energia potencial elétrica",
    formula: String.raw`E_p = k\frac{q_1q_2}{d}`,
    description: "Energia associada à configuração de duas cargas.",
  },
  {
    title: "Potencial elétrico",
    formula: String.raw`V = k\frac{Q}{d}`,
    description: "Potencial criado por carga puntiforme.",
  },
  {
    title: "Energia e potencial",
    formula: String.raw`E_p = qV`,
    description: "Energia potencial de uma carga em um ponto de potencial V.",
  },
  {
    title: "Diferença de potencial",
    formula: String.raw`U_{AB} = V_A - V_B`,
    description: "Diferença entre os potenciais de dois pontos.",
  },
  {
    title: "Superposição de forças",
    formula: String.raw`\vec{F}_R = \vec{F}_1 + \vec{F}_2 + \cdots`,
    description: "Força resultante como soma vetorial.",
  },
  {
    title: "Superposição de campos",
    formula: String.raw`\vec{E}_R = \vec{E}_1 + \vec{E}_2 + \cdots`,
    description: "Campo resultante como soma vetorial.",
  },
  {
    title: "Superposição de potenciais",
    formula: String.raw`V_R = V_1 + V_2 + \cdots`,
    description: "Potencial resultante como soma algébrica.",
  },
];

export default function EletricidadeTopicEletrostatica() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/eletricidade">
              <a className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </a>
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Eletricidade
              </p>

              <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                Eletrostática
              </h1>
            </div>
          </div>

          <div className="hidden gap-2 md:flex">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-black capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-4 md:hidden">
          {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-black capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        {activeTab === "teoria" && (
          <>
            <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 shadow-[0_24px_75px_rgba(15,23,42,0.35)] md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.28),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_34%)]" />

              <div className="relative grid items-end gap-8 lg:grid-cols-[1.35fr_0.65fr]">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    <Zap className="h-4 w-4" />
                    Teoria completa
                  </div>

                  <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                    Cargas em repouso. Forças, campos, potenciais e energia.
                  </h2>

                  <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                    Uma abordagem completa de Eletrostática, agora fora do
                    Markdown renderizado e organizada em layout React com
                    diagramas visuais, painéis de fórmula, exemplos, armadilhas
                    e foco em ITA/IME.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["25", "tópicos"],
                    ["16", "fórmulas"],
                    ["ITA", "foco"],
                    ["IME", "nível"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur"
                    >
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {theorySections.map((section) => (
              <SectionCard
                key={section.id}
                icon={section.icon}
                title={section.title}
                accent={section.accent}
              >
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`paragraph-${index}`}>{paragraph}</p>
                ))}

                {section.diagram ? <CircuitDiagram diagram={section.diagram} /> : null}

                {section.numbered ? <NumberedList items={section.numbered} /> : null}

                {section.panels?.map((panel, index) => (
                  <EquationPanel key={`panel-${index}`} panel={panel} />
                ))}

                {section.bullets ? <BulletList items={section.bullets} /> : null}

                {section.notes?.map((note, index) => (
                  <NoteBox key={`note-${index}`} title={note.title} type={note.type}>
                    {note.body}
                  </NoteBox>
                ))}
              </SectionCard>
            ))}
          </>
        )}

        {activeTab === "exemplos" && (
          <>
            <CompactTabHeader
              icon={Target}
              eyebrow="Treino comentado"
              title="Exemplos resolvidos"
              description="Exercícios essenciais para fixar quantização da carga, contato, Lei de Coulomb, campo elétrico, potencial e diferença entre campo nulo e potencial não nulo."
              accent="from-slate-950 via-indigo-950 to-purple-950"
            />

            <div className="space-y-5">
              {examples.map((example) => (
                <ExampleAccordion key={example.id} example={example} />
              ))}
            </div>
          </>
        )}

        {activeTab === "resumo" && (
          <>
            <CompactTabHeader
              icon={Brain}
              eyebrow="Mapa final"
              title="Resumo de Eletrostática"
              description="As fórmulas principais e os significados físicos que seguram o conteúdo inteiro."
              accent="from-slate-950 via-slate-900 to-indigo-950"
            />

            <SectionCard
              icon={Zap}
              title="Fórmulas essenciais"
              accent="from-indigo-600 to-purple-700"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {formulaSummary.map((item, index) => (
                  <FormulaSummaryCard key={index} item={item} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="Diferenças essenciais"
              accent="from-slate-950 to-indigo-900"
            >
              <BulletList
                items={[
                  "corpo neutro possui cargas, mas a soma algébrica é zero;",
                  "corpo positivo perdeu elétrons; corpo negativo ganhou elétrons;",
                  "força elétrica é vetor; energia potencial elétrica é escalar;",
                  "campo elétrico é vetor; potencial elétrico é escalar;",
                  "campos elétricos são somados vetorialmente;",
                  "potenciais elétricos são somados algebricamente;",
                  "campo nulo não implica potencial nulo;",
                  "potencial nulo não implica campo nulo;",
                  "em condutor em equilíbrio, o campo elétrico interno é nulo;",
                  "em condutor em equilíbrio, a carga em excesso fica na superfície;",
                  "na indução, a ordem das etapas é decisiva;",
                  "atração não prova necessariamente cargas opostas.",
                ]}
              />

              <NoteBox title="Ideia final" type="dark">
                Eletrostática não é uma coleção de continhas com Coulomb. É a
                base para entender campo, potencial, energia, condutores,
                indução, blindagem e praticamente todo o resto da eletricidade.
              </NoteBox>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}
