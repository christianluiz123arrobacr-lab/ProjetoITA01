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

type ConceptBlockData = {
  title: string;
  icon?: ElementType;
  paragraphs: string[];
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
  id: string;
  icon: ElementType;
  title: string;
  accent: string;
  intro?: string[];
  concepts?: ConceptBlockData[];
  diagram?: DiagramData;
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
          <MathFormula
            key={`formula-${index}`}
            formula={formula}
            display={true}
          />
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

        <MiniInfoCard title="Interpretação da estrutura">
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
          Construção física e matemática
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

      <div className="space-y-6 p-6 leading-8 text-slate-700 md:p-8">
        {children}
      </div>
    </section>
  );
}

function ConnectedTheoryText({
  intro,
  concepts,
}: {
  intro?: string[];
  concepts?: ConceptBlockData[];
}) {
  const allParagraphs = [
    ...(intro ?? []),
    ...(concepts?.flatMap((concept) => concept.paragraphs) ?? []),
  ];

  if (allParagraphs.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-sm md:p-7">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-600 via-blue-500 to-cyan-400" />

      <div className="space-y-5 pl-3 leading-8 text-slate-700 md:pl-4">
        {allParagraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
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
    <ul className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FormulaSummaryCard({ item }: { item: FormulaSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-black text-slate-950">
        {item.title}
      </h3>

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

        <p className="mt-1 text-sm leading-6 text-slate-300">
          {diagram.caption}
        </p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[700px]">
          {diagram.kind === "chargeStates" && <ChargeStatesDiagram />}
          {diagram.kind === "attractionRepulsion" && (
            <AttractionRepulsionDiagram />
          )}
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
      <circle
        cx={x}
        cy={y}
        r="46"
        fill={fill}
        stroke="#0f172a"
        strokeWidth="4"
      />

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

      <path
        d={`M ${x2} ${y2} L ${ax1} ${ay1} L ${ax2} ${ay2} Z`}
        fill={color}
      />
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
      <text
        x={150}
        y={225}
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        neutro
      </text>
      <DiagramLabel x={150} y={252}>
        prótons = elétrons
      </DiagramLabel>

      <ChargeCircle x={380} y={145} label="+" fill="#fee2e2" />
      <text
        x={380}
        y={225}
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        positivo
      </text>
      <DiagramLabel x={380} y={252}>
        perdeu elétrons
      </DiagramLabel>

      <ChargeCircle x={610} y={145} label="−" fill="#dbeafe" />
      <text
        x={610}
        y={225}
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        negativo
      </text>
      <DiagramLabel x={610} y={252}>
        ganhou elétrons
      </DiagramLabel>

      <DiagramLabel x={380} y={60}>
        nos processos comuns, quem se move são os elétrons
      </DiagramLabel>
    </svg>
  );
}

function AttractionRepulsionDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />

      <ChargeCircle x={170} y={100} label="+" fill="#fee2e2" />
      <ChargeCircle x={310} y={100} label="+" fill="#fee2e2" />
      <ArrowLine x1={220} y1={100} x2={250} y2={100} color="#dc2626" />
      <ArrowLine x1={260} y1={100} x2={230} y2={100} color="#dc2626" />
      <DiagramLabel x={240} y={170}>
        mesmo sinal: repulsão
      </DiagramLabel>

      <ChargeCircle x={455} y={100} label="+" fill="#fee2e2" />
      <ChargeCircle x={595} y={100} label="−" fill="#dbeafe" />
      <ArrowLine x1={505} y1={100} x2={545} y2={100} color="#2563eb" />
      <ArrowLine x1={545} y1={100} x2={505} y2={100} color="#2563eb" />
      <DiagramLabel x={525} y={170}>
        sinais opostos: atração
      </DiagramLabel>

      <ChargeCircle x={300} y={240} label="−" fill="#dbeafe" />
      <ChargeCircle x={460} y={240} label="−" fill="#dbeafe" />
      <ArrowLine x1={350} y1={240} x2={380} y2={240} color="#dc2626" />
      <ArrowLine x1={410} y1={240} x2={380} y2={240} color="#dc2626" />
      <DiagramLabel x={380} y={295}>
        negativo com negativo também se repele
      </DiagramLabel>
    </svg>
  );
}

function FrictionDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />

      <rect
        x="80"
        y="110"
        width="180"
        height="70"
        rx="18"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="170"
        y="153"
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        corpo A
      </text>

      <rect
        x="500"
        y="110"
        width="180"
        height="70"
        rx="18"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="590"
        y="153"
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        corpo B
      </text>

      <ArrowLine x1={285} y1={145} x2={475} y2={145} color="#2563eb" />
      <text
        x="380"
        y="125"
        textAnchor="middle"
        className="fill-blue-700 text-[16px] font-black"
      >
        elétrons transferidos
      </text>

      <ChargeCircle x={170} y={245} label="+" fill="#fee2e2" />
      <ChargeCircle x={590} y={245} label="−" fill="#dbeafe" />

      <DiagramLabel x={170} y={305}>
        perde elétrons
      </DiagramLabel>
      <DiagramLabel x={590} y={305}>
        ganha elétrons
      </DiagramLabel>
      <DiagramLabel x={380} y={65}>
        materiais diferentes podem ter tendências diferentes de reter elétrons
      </DiagramLabel>
    </svg>
  );
}

function ContactDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />

      <ChargeCircle x={145} y={120} label="+6" fill="#fee2e2" />
      <ChargeCircle x={295} y={120} label="−2" fill="#dbeafe" />
      <DiagramLabel x={220} y={195}>
        antes do contato
      </DiagramLabel>

      <ArrowLine x1={360} y1={120} x2={430} y2={120} color="#0f172a" />
      <text
        x="395"
        y="95"
        textAnchor="middle"
        className="fill-slate-950 text-[15px] font-black"
      >
        contato
      </text>

      <ChargeCircle x={515} y={120} label="+2" fill="#fee2e2" />
      <ChargeCircle x={645} y={120} label="+2" fill="#fee2e2" />
      <DiagramLabel x={580} y={195}>
        depois, se forem idênticas
      </DiagramLabel>

      <text
        x="380"
        y="265"
        textAnchor="middle"
        className="fill-slate-950 text-[20px] font-black"
      >
        carga total: +6 − 2 = +4 μC
      </text>
      <text
        x="380"
        y="295"
        textAnchor="middle"
        className="fill-slate-700 text-[16px] font-bold"
      >
        esferas idênticas dividem igualmente: +2 μC em cada uma
      </text>
    </svg>
  );
}

function InductionDiagram() {
  return (
    <svg viewBox="0 0 760 420" className="h-[420px] w-full">
      <rect x="15" y="15" width="730" height="390" rx="26" fill="#ffffff" />

      <rect
        x="65"
        y="80"
        width="110"
        height="40"
        rx="12"
        fill="#dbeafe"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text
        x="120"
        y="107"
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        bastão −
      </text>

      <circle
        cx="265"
        cy="100"
        r="46"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text x="238" y="106" className="fill-red-700 text-[20px] font-black">
        +
      </text>
      <text x="282" y="106" className="fill-blue-700 text-[20px] font-black">
        −
      </text>
      <DiagramLabel x={265} y={168}>
        separação de cargas
      </DiagramLabel>

      <rect
        x="440"
        y="80"
        width="110"
        height="40"
        rx="12"
        fill="#dbeafe"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text
        x="495"
        y="107"
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        bastão −
      </text>

      <circle
        cx="640"
        cy="100"
        r="46"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text x="610" y="106" className="fill-red-700 text-[20px] font-black">
        +
      </text>
      <text x="654" y="106" className="fill-blue-700 text-[20px] font-black">
        −
      </text>

      <line x1="640" y1="146" x2="640" y2="190" stroke="#0f172a" strokeWidth="4" />
      <line x1="615" y1="190" x2="665" y2="190" stroke="#0f172a" strokeWidth="4" />
      <line x1="623" y1="205" x2="657" y2="205" stroke="#0f172a" strokeWidth="4" />
      <line x1="631" y1="220" x2="649" y2="220" stroke="#0f172a" strokeWidth="4" />

      <ArrowLine x1={670} y1={110} x2={710} y2={150} color="#2563eb" />
      <DiagramLabel x={640} y={258}>
        aterramento: elétrons saem
      </DiagramLabel>

      <circle
        cx="250"
        cy="315"
        r="46"
        fill="#fee2e2"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="250"
        y="323"
        textAnchor="middle"
        className="fill-red-700 text-[26px] font-black"
      >
        +
      </text>
      <DiagramLabel x={250} y={385}>
        retira o aterramento
      </DiagramLabel>

      <circle
        cx="545"
        cy="315"
        r="46"
        fill="#fee2e2"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="545"
        y="323"
        textAnchor="middle"
        className="fill-red-700 text-[26px] font-black"
      >
        +
      </text>
      <DiagramLabel x={545} y={385}>
        afasta o bastão: esfera positiva
      </DiagramLabel>
    </svg>
  );
}

function PolarizationDiagram() {
  return (
    <svg viewBox="0 0 760 310" className="h-[310px] w-full">
      <rect x="15" y="15" width="730" height="280" rx="26" fill="#ffffff" />

      <rect
        x="80"
        y="120"
        width="120"
        height="50"
        rx="14"
        fill="#dbeafe"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="140"
        y="152"
        textAnchor="middle"
        className="fill-slate-950 text-[20px] font-black"
      >
        bastão −
      </text>

      <circle
        cx="460"
        cy="145"
        r="70"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text x="412" y="152" className="fill-red-700 text-[24px] font-black">
        +
      </text>
      <text x="445" y="152" className="fill-red-700 text-[24px] font-black">
        +
      </text>
      <text x="492" y="152" className="fill-blue-700 text-[24px] font-black">
        −
      </text>
      <text x="525" y="152" className="fill-blue-700 text-[24px] font-black">
        −
      </text>

      <ArrowLine x1={390} y1={145} x2={225} y2={145} color="#2563eb" />
      <DiagramLabel x={460} y={245}>
        corpo neutro polarizado
      </DiagramLabel>
      <DiagramLabel x={380} y={70}>
        a atração pode ocorrer mesmo sem carga líquida no corpo
      </DiagramLabel>
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

      <line
        x1="210"
        y1="225"
        x2="550"
        y2="225"
        stroke="#0f172a"
        strokeWidth="3"
        strokeDasharray="8 8"
      />
      <text
        x="380"
        y="250"
        textAnchor="middle"
        className="fill-slate-950 text-[20px] font-black"
      >
        distância d
      </text>

      <text
        x="380"
        y="75"
        textAnchor="middle"
        className="fill-slate-950 text-[20px] font-black"
      >
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

      <text
        x="292"
        y="150"
        textAnchor="middle"
        className="fill-blue-700 text-[16px] font-black"
      >
        F₁
      </text>
      <text
        x="468"
        y="150"
        textAnchor="middle"
        className="fill-emerald-700 text-[16px] font-black"
      >
        F₂
      </text>
      <text x="405" y="190" className="fill-red-700 text-[16px] font-black">
        Fᵣ
      </text>

      <DiagramLabel x={380} y={55}>
        a resultante é soma vetorial dos efeitos individuais
      </DiagramLabel>
      <DiagramLabel x={380} y={310}>
        em duas dimensões, decomponha em eixos e some componentes
      </DiagramLabel>
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

      <text
        x="380"
        y="135"
        textAnchor="middle"
        className="fill-red-700 text-[18px] font-black"
      >
        campo criado por Q
      </text>
      <text
        x="600"
        y="145"
        textAnchor="middle"
        className="fill-blue-700 text-[18px] font-black"
      >
        força em +q
      </text>

      <DiagramLabel x={380} y={255}>
        campo é propriedade do espaço; força é efeito sobre uma carga colocada ali
      </DiagramLabel>
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

      <DiagramLabel x={210} y={270}>
        linhas saem da carga positiva
      </DiagramLabel>
      <DiagramLabel x={550} y={270}>
        linhas entram na carga negativa
      </DiagramLabel>
      <DiagramLabel x={380} y={55}>
        linhas indicam direção, sentido e intensidade relativa do campo
      </DiagramLabel>
    </svg>
  );
}

function UniformFieldDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />

      <rect x="160" y="70" width="440" height="24" rx="8" fill="#dc2626" />
      <rect x="160" y="230" width="440" height="24" rx="8" fill="#2563eb" />

      <text x="120" y="90" className="fill-red-700 text-[22px] font-black">
        +
      </text>
      <text x="120" y="250" className="fill-blue-700 text-[22px] font-black">
        −
      </text>

      {[220, 300, 380, 460, 540].map((x) => (
        <ArrowLine key={x} x1={x} y1={105} x2={x} y2={215} color="#0f172a" />
      ))}

      <DiagramLabel x={380} y={45}>
        campo aproximadamente uniforme entre placas paralelas
      </DiagramLabel>
      <DiagramLabel x={380} y={292}>
        linhas retas, paralelas e igualmente espaçadas
      </DiagramLabel>
    </svg>
  );
}

function PotentialDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle
        cx="160"
        cy="170"
        r="48"
        fill="#fee2e2"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x="160"
        y="178"
        textAnchor="middle"
        className="fill-slate-950 text-[24px] font-black"
      >
        Q
      </text>

      <circle
        cx="340"
        cy="170"
        r="16"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text
        x="340"
        y="132"
        textAnchor="middle"
        className="fill-slate-950 text-[17px] font-black"
      >
        A
      </text>

      <circle
        cx="570"
        cy="170"
        r="16"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text
        x="570"
        y="132"
        textAnchor="middle"
        className="fill-slate-950 text-[17px] font-black"
      >
        B
      </text>

      <line
        x1="160"
        y1="245"
        x2="340"
        y2="245"
        stroke="#0f172a"
        strokeWidth="3"
        strokeDasharray="8 8"
      />
      <line
        x1="160"
        y1="275"
        x2="570"
        y2="275"
        stroke="#0f172a"
        strokeWidth="3"
        strokeDasharray="8 8"
      />

      <text
        x="250"
        y="238"
        textAnchor="middle"
        className="fill-slate-700 text-[15px] font-bold"
      >
        r_A
      </text>
      <text
        x="365"
        y="268"
        textAnchor="middle"
        className="fill-slate-700 text-[15px] font-bold"
      >
        r_B
      </text>

      <DiagramLabel x={380} y={70}>
        para carga positiva, o potencial diminui com a distância
      </DiagramLabel>
      <DiagramLabel x={380} y={305}>
        potencial é escalar: soma-se algebricamente
      </DiagramLabel>
    </svg>
  );
}

function ConductorDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle
        cx="380"
        cy="165"
        r="95"
        fill="#e2e8f0"
        stroke="#0f172a"
        strokeWidth="4"
      />

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
        <text
          key={index}
          x={x}
          y={y}
          textAnchor="middle"
          className="fill-red-700 text-[22px] font-black"
        >
          +
        </text>
      ))}

      <text
        x="380"
        y="172"
        textAnchor="middle"
        className="fill-slate-950 text-[20px] font-black"
      >
        E = 0
      </text>

      <DiagramLabel x={380} y={55}>
        condutor em equilíbrio eletrostático
      </DiagramLabel>
      <DiagramLabel x={380} y={295}>
        cargas em excesso ficam na superfície; campo interno é nulo
      </DiagramLabel>
    </svg>
  );
}

function FaradayDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <rect
        x="280"
        y="85"
        width="210"
        height="160"
        rx="22"
        fill="#e2e8f0"
        stroke="#0f172a"
        strokeWidth="5"
      />
      <rect
        x="325"
        y="120"
        width="120"
        height="90"
        rx="18"
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="3"
      />

      {[80, 130, 180, 230].map((y) => (
        <ArrowLine key={y} x1={95} y1={y} x2={245} y2={y} color="#2563eb" />
      ))}

      <text
        x="385"
        y="172"
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        interior protegido
      </text>

      <DiagramLabel x={380} y={55}>
        blindagem eletrostática
      </DiagramLabel>
      <DiagramLabel x={380} y={292}>
        as cargas se redistribuem na superfície do condutor
      </DiagramLabel>
    </svg>
  );
}

function PointEffectDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle
        cx="230"
        cy="170"
        r="70"
        fill="#e2e8f0"
        stroke="#0f172a"
        strokeWidth="4"
      />

      {[
        [180, 130],
        [220, 105],
        [270, 130],
        [170, 190],
        [230, 235],
        [285, 190],
      ].map(([x, y], index) => (
        <text
          key={index}
          x={x}
          y={y}
          textAnchor="middle"
          className="fill-red-700 text-[20px] font-black"
        >
          +
        </text>
      ))}

      <path
        d="M500 240 L610 240 L555 75 Z"
        fill="#e2e8f0"
        stroke="#0f172a"
        strokeWidth="4"
      />

      {[
        [555, 95],
        [545, 125],
        [565, 125],
        [535, 170],
        [575, 170],
        [520, 220],
        [590, 220],
      ].map(([x, y], index) => (
        <text
          key={index}
          x={x}
          y={y}
          textAnchor="middle"
          className="fill-red-700 text-[20px] font-black"
        >
          +
        </text>
      ))}

      <ArrowLine x1={555} y1={75} x2={555} y2={35} color="#dc2626" />
      <DiagramLabel x={230} y={285}>
        superfície arredondada: campo menos intenso
      </DiagramLabel>
      <DiagramLabel x={555} y={285}>
        ponta: campo mais intenso
      </DiagramLabel>
    </svg>
  );
}

function GraphsDiagram() {
  return (
    <svg viewBox="0 0 760 350" className="h-[350px] w-full">
      <rect x="15" y="15" width="730" height="320" rx="26" fill="#ffffff" />

      <line x1="100" y1="270" x2="300" y2="270" stroke="#0f172a" strokeWidth="4" />
      <line x1="100" y1="270" x2="100" y2="80" stroke="#0f172a" strokeWidth="4" />
      <path
        d="M115 95 C150 180, 230 240, 290 260"
        fill="none"
        stroke="#2563eb"
        strokeWidth="5"
      />

      <text x="105" y="70" className="fill-slate-950 text-[16px] font-black">
        E
      </text>
      <text x="310" y="275" className="fill-slate-950 text-[16px] font-black">
        r
      </text>
      <DiagramLabel x={200} y={310}>
        E ∝ 1/r²
      </DiagramLabel>

      <line x1="460" y1="270" x2="660" y2="270" stroke="#0f172a" strokeWidth="4" />
      <line x1="460" y1="270" x2="460" y2="80" stroke="#0f172a" strokeWidth="4" />
      <path
        d="M475 100 C520 165, 590 225, 650 260"
        fill="none"
        stroke="#dc2626"
        strokeWidth="5"
      />

      <text x="465" y="70" className="fill-slate-950 text-[16px] font-black">
        V
      </text>
      <text x="670" y="275" className="fill-slate-950 text-[16px] font-black">
        r
      </text>
      <DiagramLabel x={560} y={310}>
        V ∝ 1/r
      </DiagramLabel>

      <DiagramLabel x={380} y={45}>
        campo cai mais rapidamente que potencial
      </DiagramLabel>
    </svg>
  );
}

const theorySections: TheorySection[] = [
  {
    id: "contexto",
    icon: BookOpen,
    title: "Contexto físico e histórico",
    accent: "from-indigo-600 to-purple-700",
    intro: [
      "A Eletrostática é a parte da Eletricidade que estuda as cargas elétricas em repouso e os efeitos produzidos por elas. Quando dizemos repouso, não estamos afirmando que nada se move no nível microscópico. Em um metal, por exemplo, elétrons livres podem se reorganizar rapidamente até que o equilíbrio eletrostático seja atingido. O que não existe, nesse estado final, é uma corrente elétrica permanente atravessando o condutor.",
      "Esse conteúdo é a base de praticamente toda a Eletricidade. Antes de estudar corrente, resistores, capacitores em circuito, geradores, motores e eletromagnetismo, é preciso entender o que é carga, como ela se distribui, como cria força, como cria campo, como armazena energia e como se comporta em condutores.",
    ],
    concepts: [
      {
        title: "ideia",
        paragraphs: [
          "A Eletrostática começa com fenômenos simples: um pente atritado atraindo pedacinhos de papel, um balão grudando na parede, o cabelo arrepiando, um choque ao tocar uma maçaneta em dia seco. Esses fenômenos parecem pequenos, mas todos apontam para uma mesma ideia: a matéria possui cargas elétricas, e o desequilíbrio ou a redistribuição dessas cargas produz efeitos observáveis.",
          "O grande salto da Física foi perceber que esses efeitos não são mágicos nem isolados. Eles obedecem a leis quantitativas. A mesma lógica que explica o balão grudado na parede também ajuda a entender campo elétrico, capacitores, blindagem eletrostática, para-raios e instrumentos elétricos. A natureza, por algum motivo, gosta de usar as mesmas regras em brinquedos de criança e em engenharia pesada.",
          "Assim, estudar Eletrostática não é decorar uma fórmula isolada. É construir uma sequência de ideias: a matéria possui cargas, essas cargas podem estar equilibradas ou em excesso, corpos eletrizados interagem, essa interação pode ser descrita por forças, cargas criam campos elétricos, campos podem realizar trabalho, configurações de cargas armazenam energia e condutores respondem de maneira especial por possuírem cargas livres.",
          "O erro mais pobre aqui é achar que Eletrostática é só a Lei de Coulomb. Coulomb é uma parte importante, mas o conteúdo real envolve carga elétrica, conservação, quantização, eletrização, polarização, força, campo, potencial, energia, condutores em equilíbrio, blindagem e poder das pontas.",
          "Uma boa teoria de Eletrostática precisa separar grandezas vetoriais de grandezas escalares desde o começo. Força e campo são vetores. Energia potencial e potencial elétrico são escalares. Essa diferença parece detalhe até a primeira questão em que o campo se anula e o potencial não.",
        ],
      },
    ],
    bullets: [
      "A matéria possui cargas elétricas.",
      "Corpos podem estar neutros ou eletrizados.",
      "Cargas elétricas interagem por forças elétricas.",
      "Cargas criam campos elétricos no espaço ao redor.",
      "Campos elétricos podem realizar trabalho sobre cargas.",
      "Configurações de cargas podem armazenar energia potencial elétrica.",
      "Condutores em equilíbrio possuem propriedades especiais.",
      "Blindagem, indução e poder das pontas nascem da redistribuição das cargas.",
    ],
  },
  {
    id: "carga",
    icon: Zap,
    title: "Carga elétrica",
    accent: "from-purple-600 to-indigo-700",
    intro: [
      "Carga elétrica é uma propriedade fundamental da matéria associada às interações elétricas. Assim como a massa está ligada à interação gravitacional, a carga elétrica está ligada à interação elétrica. A diferença é que, enquanto a gravidade clássica é sempre atrativa, a interação elétrica pode ser atrativa ou repulsiva.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Um corpo neutro não é um corpo sem cargas. Essa frase precisa entrar na cabeça com força. Um corpo neutro possui prótons e elétrons em quantidades equilibradas. A soma algébrica das cargas é zero, mas as cargas estão lá.",
          "Quando um corpo fica eletrizado, geralmente não é porque prótons foram arrancados do núcleo. Nos processos comuns de eletrização, quem se movimenta são elétrons. Se um corpo perde elétrons, fica positivo. Se ganha elétrons, fica negativo. O sinal da carga revela excesso ou falta relativa de elétrons.",
          "A carga elétrica elementar é representada por e e possui módulo aproximadamente igual a 1,6 × 10⁻¹⁹ C. O próton possui carga +e, o elétron possui carga −e e o nêutron possui carga elétrica resultante nula. A carga total de um corpo é a soma algébrica das cargas positivas e negativas que ele possui.",
          "Pense em um corpo neutro como uma sala com a mesma quantidade de pessoas vestidas de vermelho e azul. A sala não está vazia; ela só está equilibrada. Se algumas pessoas azuis saem, passa a sobrar vermelho. Em eletrização, o corpo positivo não ganhou prótons; ele perdeu elétrons.",
          "As questões mais básicas cobram o sinal final do corpo após perda ou ganho de elétrons. As questões intermediárias misturam número de elétrons com carga elementar. As mais perigosas perguntam se um corpo neutro pode ser atraído por um corpo carregado, e a resposta é sim, por polarização.",
          "A carga elétrica não é uma substância escorrendo pelo material. Ela é uma propriedade das partículas. Quando dizemos que um corpo tem carga total positiva, estamos falando do balanço entre cargas positivas e negativas, não de uma tinta positiva espalhada pela superfície.",
        ],
      },
    ],
    diagram: {
      kind: "chargeStates",
      title: "Diagrama visual: corpo neutro, positivo e negativo",
      caption:
        "O corpo neutro possui equilíbrio entre cargas. O corpo positivo perdeu elétrons. O corpo negativo ganhou elétrons.",
    },
    panels: [
      {
        title: "Carga elementar",
        formula: String.raw`e = 1{,}6 \times 10^{-19} \ \text{C}`,
        terms: [
          "e é o módulo da carga elementar.",
          "O próton possui carga +e.",
          "O elétron possui carga −e.",
          "O nêutron possui carga elétrica resultante nula.",
        ],
        structure: [
          "A carga elétrica aparece em unidades discretas.",
          "A carga total de um corpo depende do balanço entre prótons e elétrons.",
          "O sinal da carga indica excesso ou falta relativa de elétrons.",
        ],
        steps: [
          {
            title: "Corpo neutro",
            body: [
              "Se um corpo possui o mesmo número de prótons e elétrons, as contribuições positivas e negativas se cancelam.",
            ],
            formulas: [
              String.raw`Q = N(+e) + N(-e)`,
              String.raw`Q = 0`,
            ],
          },
          {
            title: "Corpo positivo",
            body: [
              "Quando perde elétrons, o corpo fica com falta relativa de carga negativa. A carga total passa a ser positiva.",
            ],
          },
          {
            title: "Corpo negativo",
            body: [
              "Quando ganha elétrons, o corpo passa a ter excesso de carga negativa. A carga total passa a ser negativa.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "principios",
    icon: ShieldCheck,
    title: "Princípios fundamentais da carga elétrica",
    accent: "from-slate-950 to-indigo-800",
    intro: [
      "A Eletrostática se apoia em princípios que parecem simples, mas sustentam quase todas as questões do conteúdo: atração e repulsão, conservação da carga elétrica e quantização da carga elétrica.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Cargas de mesmo sinal se repelem porque cada uma tende a afastar a outra. Cargas de sinais opostos se atraem porque a interação elétrica favorece a aproximação entre sinais contrários. Esse é o primeiro filtro mental em qualquer questão de força elétrica.",
          "A conservação da carga diz que, em um sistema isolado, a carga total não surge do nada nem desaparece. Ela é transferida ou redistribuída. Se um corpo ganha elétrons, outro corpo, dentro do sistema, perdeu elétrons.",
          "A quantização da carga afirma que a carga elétrica aparece em pacotes discretos. Em processos comuns, um corpo pode ganhar um elétron, dois elétrons, bilhões de elétrons, mas não meio elétron. Por isso, a carga total de um corpo eletrizado aparece como múltiplo inteiro da carga elementar.",
          "Esses três princípios devem ser usados juntos. Em uma eletrização por atrito, por exemplo, as cargas finais têm sinais opostos, a carga total do sistema se conserva e o valor de cada carga deve respeitar a quantização.",
          "A armadilha mais comum é concluir que atração sempre significa cargas opostas. Isso só é seguro quando os dois corpos são puntiformes e eletrizados. Corpos neutros extensos podem ser atraídos por polarização.",
          "Em problemas de contato entre esferas idênticas, a conservação da carga dá a carga total, mas a simetria das esferas idênticas permite dividir igualmente. Se as esferas não forem idênticas, não existe obrigação de cargas iguais no final.",
        ],
      },
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
          "ΣQ_antes é a soma das cargas antes do processo.",
          "ΣQ_depois é a soma das cargas depois do processo.",
          "O sistema deve estar eletricamente isolado para que a carga total se conserve.",
        ],
        structure: [
          "A carga total não é criada nem destruída.",
          "O que muda é a distribuição das cargas.",
          "A conservação vale para atrito, contato, indução com sistema corretamente considerado e redistribuições internas.",
        ],
        steps: [
          {
            title: "Sistema inicialmente neutro",
            formulas: [String.raw`Q_{\text{total, antes}} = 0`],
          },
          {
            title: "Após transferência de elétrons",
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
          "Q é a carga elétrica total do corpo.",
          "n é um número inteiro.",
          "e é a carga elementar.",
          "O sinal depende de o corpo estar com falta ou excesso de elétrons.",
        ],
        structure: [
          "A carga vem em múltiplos inteiros de e.",
          "O módulo da carga permite calcular o número de elétrons transferidos.",
          "O sinal precisa ser interpretado fisicamente.",
        ],
        steps: [
          {
            title: "Número de elétrons transferidos",
            formulas: [String.raw`n = \frac{|Q|}{e}`],
          },
          {
            title: "Sinal da carga final",
            body: [
              "Se o corpo perdeu elétrons, a carga final é positiva. Se ganhou elétrons, a carga final é negativa.",
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Atração não prova, sozinha, que dois corpos possuem cargas de sinais opostos. Um corpo neutro polarizável também pode ser atraído por um corpo eletrizado.",
      },
    ],
  },
  {
    id: "materiais",
    icon: Layers,
    title: "Condutores, isolantes e semicondutores",
    accent: "from-indigo-700 to-blue-700",
    intro: [
      "A forma como um material responde a fenômenos eletrostáticos depende da mobilidade das cargas em seu interior. Essa diferença é fundamental para entender contato, indução, polarização, blindagem e equilíbrio eletrostático.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Em um condutor, existem cargas livres que podem se deslocar com facilidade. Nos metais, essas cargas são elétrons livres. Quando um condutor é eletrizado ou colocado perto de um corpo carregado, esses elétrons se reorganizam rapidamente.",
          "Em um isolante, as cargas não conseguem se deslocar livremente por grandes distâncias. Isso não significa que o isolante não tenha cargas. Ele tem prótons e elétrons, como qualquer matéria comum. A diferença é que essas cargas ficam muito mais presas às estruturas microscópicas do material.",
          "Semicondutores ficam no meio do caminho. Eles não se comportam como metais comuns nem como isolantes perfeitos. Sua condutividade pode ser controlada, o que explica por que eles são a base de diodos, transistores, sensores, chips e praticamente toda a eletrônica moderna.",
          "Condutores são materiais com portadores de carga livres para se moverem com relativa facilidade. Isolantes são materiais em que as cargas não se deslocam livremente por grandes distâncias. Semicondutores possuem condutividade intermediária e controlável.",
          "Questões costumam perguntar por que uma carga em excesso fica na superfície de um condutor em equilíbrio, por que a indução funciona melhor em condutores e por que isolantes podem ser atraídos apesar de não conduzirem carga livremente.",
          "Nunca confunda isolante com material sem carga. Isolante possui cargas; ele apenas não permite que elas se movimentem livremente pelo material.",
        ],
      },
    ],
    bullets: [
      "Condutores comuns: cobre, alumínio, prata, ouro, ferro, grafite, soluções iônicas e gases ionizados.",
      "Isolantes comuns: vidro, borracha, plástico, madeira seca, ar seco, porcelana, lã, seda e isopor.",
      "Semicondutores importantes: silício e germânio.",
      "A mobilidade das cargas define a resposta elétrica do material.",
    ],
  },
  {
    id: "atrito",
    icon: Flame,
    title: "Eletrização por atrito",
    accent: "from-blue-700 to-cyan-700",
    intro: [
      "A eletrização por atrito ocorre quando dois corpos de materiais diferentes são atritados e há transferência de elétrons entre eles.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Quando dois materiais diferentes são atritados, suas superfícies entram em contato repetidamente. Dependendo da natureza dos materiais, um deles pode ter maior tendência a perder elétrons, enquanto o outro pode ter maior tendência a recebê-los.",
          "Depois do atrito, um corpo fica com falta de elétrons e se torna positivo. O outro fica com excesso de elétrons e se torna negativo. Se o sistema estiver isolado, as cargas adquiridas têm mesmo módulo e sinais opostos.",
          "Esse é o caso típico do pente plástico atraindo pedacinhos de papel após ser esfregado no cabelo, do balão grudando na parede depois de ser atritado e da roupa grudando no corpo em dias secos.",
          "O atrito não cria carga do nada. Ele favorece transferência de elétrons. A carga total do conjunto continua sendo a mesma. Por isso, se dois corpos inicialmente neutros são atritados e um fica com carga +Q, o outro fica com carga −Q.",
          "As questões podem fornecer o sinal de um dos corpos e pedir o sinal do outro. Se os dois começaram neutros e o sistema está isolado, as cargas finais terão mesmo módulo e sinais opostos.",
          "Também é comum aparecer a série triboelétrica. Ela indica tendências relativas de materiais a perder ou ganhar elétrons. A ideia importante não é decorar uma lista sem sentido, mas entender quem cede elétrons e quem recebe elétrons.",
        ],
      },
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
          "+Q representa o corpo que perdeu elétrons.",
          "−Q representa o corpo que ganhou elétrons.",
          "A soma continua zero quando o sistema começou neutro e permaneceu isolado.",
        ],
        structure: [
          "A eletrização altera a distribuição de cargas.",
          "A carga total do sistema não muda.",
          "Os sinais finais são opostos porque elétrons saíram de um corpo e foram para o outro.",
        ],
        steps: [
          {
            title: "Antes do atrito",
            formulas: [String.raw`Q_{\text{total}} = 0`],
          },
          {
            title: "Depois do atrito",
            formulas: [String.raw`Q_{\text{total}} = (+Q) + (-Q) = 0`],
          },
        ],
      },
    ],
  },
  {
    id: "contato",
    icon: Gauge,
    title: "Eletrização por contato",
    accent: "from-cyan-700 to-teal-700",
    intro: [
      "A eletrização por contato ocorre quando um corpo eletrizado toca outro corpo condutor, permitindo redistribuição de cargas.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Quando dois condutores entram em contato, as cargas livres podem se mover de um para o outro. Esse movimento ocorre até que os corpos atinjam uma condição de equilíbrio elétrico.",
          "Se as esferas forem idênticas, a simetria obriga que, no final, elas tenham cargas iguais. A carga total se conserva e é dividida igualmente. É por isso que, em duas esferas idênticas, usamos a média aritmética das cargas iniciais.",
          "Se os corpos não forem idênticos, a situação muda. O equilíbrio não exige cargas iguais; exige mesmo potencial elétrico. A divisão de carga depende da geometria e da capacitância dos corpos.",
          "A carga total sempre se conserva no sistema isolado, mas a forma como ela se divide depende do sistema. Conservação da carga não significa divisão igual automaticamente.",
          "Questões básicas usam duas esferas idênticas. Questões intermediárias usam três ou mais contatos sucessivos, exigindo que você atualize a carga após cada contato. Questões mais maldosas misturam contato com aterramento ou com esferas de tamanhos diferentes.",
          "O erro mais comum é usar a fórmula da média para corpos que não são idênticos. A fórmula Qf = (Q1 + Q2)/2 só vale diretamente para duas esferas condutoras idênticas.",
        ],
      },
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
          "Qf é a carga final de cada esfera.",
          "Q1 e Q2 são as cargas iniciais.",
          "A divisão por 2 aparece porque são duas esferas idênticas.",
        ],
        structure: [
          "Primeiro se calcula a carga total.",
          "A carga total se conserva.",
          "Como as esferas são idênticas, a carga total se divide igualmente.",
        ],
        steps: [
          {
            title: "Carga total",
            formulas: [String.raw`Q_{\text{total}} = Q_1 + Q_2`],
          },
          {
            title: "Divisão simétrica",
            formulas: [String.raw`Q_f = \frac{Q_{\text{total}}}{2}`],
          },
        ],
      },
    ],
  },
  {
    id: "inducao",
    icon: Brain,
    title: "Eletrização por indução",
    accent: "from-teal-700 to-emerald-700",
    intro: [
      "A eletrização por indução é um processo em que um corpo eletrizado provoca redistribuição de cargas em outro corpo sem precisar tocá-lo.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Na indução, o corpo carregado atua à distância por meio do campo elétrico. Ao se aproximar de um condutor neutro, ele empurra ou puxa os elétrons livres desse condutor, produzindo separação de cargas.",
          "Se um bastão negativo é aproximado de uma esfera metálica neutra, os elétrons da esfera são repelidos para o lado oposto. O lado próximo ao bastão fica com falta relativa de elétrons, portanto positivo, e o lado distante fica negativo.",
          "Nesse primeiro momento, a esfera como um todo ainda pode estar neutra. O que ocorreu foi apenas uma separação interna de cargas. A eletrização líquida só aparece quando há troca de cargas com a Terra ou com outro corpo.",
          "Se a esfera for aterrada enquanto o bastão está próximo, elétrons podem escapar para a Terra. Quando o aterramento é retirado e depois o bastão é afastado, a esfera fica com carga líquida positiva.",
          "A ordem do procedimento é decisiva. Aproxima-se o indutor, aterra-se o condutor, retira-se o aterramento mantendo o indutor próximo e, por fim, afasta-se o indutor. Se a ordem for trocada, o resultado pode mudar.",
          "A Terra funciona como um enorme reservatório de cargas. Ela pode receber ou fornecer elétrons sem sofrer alteração significativa em seu potencial. No procedimento clássico com aterramento, o induzido termina com sinal oposto ao sinal do indutor.",
        ],
      },
    ],
    diagram: {
      kind: "induction",
      title: "Diagrama visual: eletrização por indução",
      caption:
        "Na indução com bastão negativo, elétrons são repelidos e podem sair pelo aterramento. A esfera fica positiva.",
    },
    bullets: [
      "Aproxima-se o indutor eletrizado.",
      "As cargas livres do condutor se redistribuem.",
      "O condutor é conectado à Terra.",
      "Elétrons entram ou saem pelo aterramento, dependendo do sinal do indutor.",
      "O aterramento é retirado enquanto o indutor ainda está próximo.",
      "O indutor é afastado.",
      "O condutor fica eletrizado com sinal oposto ao do indutor.",
    ],
    notes: [
      {
        title: "Observações",
        type: "dark",
        body: "Na indução, o detalhe que manda é a ordem. Se retirar o indutor antes de retirar o aterramento, o sistema pode se neutralizar novamente.",
      },
    ],
  },
  {
    id: "polarizacao",
    icon: Lightbulb,
    title: "Polarização",
    accent: "from-emerald-700 to-lime-700",
    intro: [
      "Polarização é a reorganização interna de cargas em um corpo neutro devido à influência de um corpo eletrizado próximo.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Um corpo neutro pode ser atraído por um corpo eletrizado. Isso parece contraditório só se você imaginar que neutro significa sem cargas. Mas neutro significa cargas equilibradas, não ausência de cargas.",
          "Quando um corpo carregado se aproxima, as cargas no corpo neutro podem se reorganizar. O lado mais próximo fica com predominância de carga de sinal oposto ao corpo carregado, enquanto o lado mais distante fica com predominância do mesmo sinal.",
          "Como o lado de sinal oposto está mais perto, a atração pode ser maior que a repulsão do lado distante. O resultado é uma força líquida de atração mesmo que o corpo total continue neutro.",
          "Em condutores, essa separação ocorre pelo movimento de cargas livres. Em isolantes, ocorre por deslocamentos microscópicos ou orientação de dipolos elétricos.",
          "Questões conceituais gostam de afirmar que, se dois corpos se atraem, necessariamente têm cargas opostas. Isso é falso em situações com corpos neutros polarizáveis.",
          "Polarização não é necessariamente eletrização líquida. O corpo pode continuar neutro, com carga total zero, mas apresentar separação interna de cargas.",
        ],
      },
    ],
    diagram: {
      kind: "polarization",
      title: "Diagrama visual: polarização de corpo neutro",
      caption:
        "O corpo neutro continua com carga total zero, mas suas cargas se reorganizam localmente.",
    },
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Atração não garante cargas opostas. Um corpo neutro polarizado pode ser atraído por um corpo eletrizado.",
      },
    ],
  },
  {
    id: "coulomb",
    icon: Calculator,
    title: "Lei de Coulomb",
    accent: "from-lime-700 to-amber-700",
    intro: [
      "A Lei de Coulomb descreve a força elétrica entre duas cargas puntiformes em repouso.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Duas cargas elétricas interagem mesmo sem contato direto. Essa interação pode atrair ou repelir, dependendo dos sinais das cargas. Quanto maiores as cargas, maior a interação. Quanto maior a distância, menor a interação.",
          "O módulo da força elétrica entre duas cargas puntiformes é diretamente proporcional ao produto dos módulos das cargas e inversamente proporcional ao quadrado da distância entre elas.",
          "A dependência com o quadrado da distância é uma das partes mais importantes. Se a distância dobra, a força não cai pela metade; cai para um quarto. Se a distância triplica, cai para um nono.",
          "A direção da força é a reta que une as cargas. O sentido depende dos sinais: repulsão para sinais iguais e atração para sinais opostos.",
          "Na fórmula do módulo, usamos valores absolutos das cargas. O sinal não entra no módulo da força; o sinal serve para decidir se a interação é atrativa ou repulsiva.",
          "Questões diretas pedem o módulo da força. Questões intermediárias alteram carga ou distância e perguntam como a força muda. Questões mais fortes misturam Coulomb com superposição vetorial.",
        ],
      },
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
          "F é o módulo da força elétrica.",
          "k é a constante eletrostática do meio.",
          "q1 e q2 são as cargas elétricas.",
          "d é a distância entre as cargas.",
        ],
        structure: [
          "A força cresce com o produto das cargas.",
          "A força diminui com o quadrado da distância.",
          "O sentido da força depende dos sinais das cargas.",
        ],
        steps: [
          {
            title: "Alterando uma carga",
            body: [
              "Se uma das cargas dobra e a distância permanece constante, a força dobra.",
            ],
          },
          {
            title: "Alterando as duas cargas",
            body: [
              "Se as duas cargas dobram, o produto das cargas fica quatro vezes maior, então a força quadruplica.",
            ],
          },
          {
            title: "Alterando a distância",
            formulas: [
              String.raw`F' = k\frac{|q_1q_2|}{(2d)^2}`,
              String.raw`F' = \frac{F}{4}`,
            ],
          },
          {
            title: "Constante no vácuo",
            formulas: [
              String.raw`k_0 \approx 9{,}0 \times 10^9 \ \text{N}\cdot\text{m}^2/\text{C}^2`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: "superposicao",
    icon: Compass,
    title: "Princípio da superposição",
    accent: "from-amber-700 to-orange-700",
    intro: [
      "Quando uma carga sofre influência de várias outras cargas, o efeito total é obtido pela soma dos efeitos individuais.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Cada carga fonte age sobre a carga analisada como se produzisse seu próprio efeito. A força ou campo resultante não substitui os efeitos individuais; ele é a soma deles.",
          "Se tudo está em uma linha, a análise pode ser feita com sinais. Se os vetores formam ângulos, a soma precisa ser vetorial. Isso significa desenhar, decompor, somar componentes e só depois calcular módulo e direção.",
          "O princípio da superposição afirma que a força elétrica resultante sobre uma carga é a soma vetorial das forças elétricas exercidas individualmente pelas demais cargas.",
          "O mesmo vale para o campo elétrico: o campo resultante em um ponto é a soma vetorial dos campos produzidos por cada carga fonte.",
          "A prova pode colocar cargas nos vértices de triângulos, quadrados ou pontos alinhados. O objetivo normalmente é testar direção, sentido, decomposição e simetria.",
          "Forças e campos são vetores. Potenciais elétricos são escalares. Portanto, não use o mesmo procedimento para tudo. Campo resultante exige soma vetorial. Potencial resultante exige soma algébrica.",
        ],
      },
    ],
    diagram: {
      kind: "superposition",
      title: "Diagrama visual: superposição de forças",
      caption:
        "A resultante sobre a carga central é obtida somando vetorialmente as forças individuais.",
    },
    panels: [
      {
        title: "Força elétrica resultante",
        formula: String.raw`\vec{F}_{\text{R}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`,
        terms: [
          "FR é a força elétrica resultante.",
          "F1, F2 e F3 são forças individuais.",
          "As setas indicam que a soma é vetorial.",
        ],
        structure: [
          "A direção e o sentido importam.",
          "Módulos não devem ser somados sem analisar os vetores.",
          "Em duas dimensões, o método das componentes costuma ser o mais seguro.",
        ],
        steps: [
          {
            title: "Componentes da resultante",
            formulas: [
              String.raw`F_{Rx} = F_{1x} + F_{2x} + F_{3x} + \cdots`,
              String.raw`F_{Ry} = F_{1y} + F_{2y} + F_{3y} + \cdots`,
            ],
          },
          {
            title: "Módulo da resultante",
            formulas: [String.raw`F_R = \sqrt{F_{Rx}^2 + F_{Ry}^2}`],
          },
          {
            title: "Direção da resultante",
            formulas: [String.raw`\tan\theta = \frac{F_{Ry}}{F_{Rx}}`],
          },
        ],
      },
    ],
  },
  {
    id: "campo",
    icon: Zap,
    title: "Campo elétrico",
    accent: "from-orange-700 to-red-700",
    intro: [
      "Campo elétrico é uma grandeza vetorial que descreve a influência elétrica criada por cargas no espaço.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "A ideia de campo serve para evitar imaginar que uma carga precisa tocar outra para interagir com ela. Uma carga fonte modifica o espaço ao seu redor. Quando uma carga de prova é colocada em algum ponto desse espaço, ela sofre força elétrica.",
          "O campo elétrico pertence ao ponto do espaço. A força elétrica aparece quando uma carga é colocada naquele ponto. Essa diferença é essencial.",
          "Pense no campo como uma informação presente no espaço: se uma carga positiva fosse colocada aqui, para onde ela seria empurrada? A resposta a essa pergunta dá a direção e o sentido do campo elétrico naquele ponto.",
          "Campo elétrico em um ponto é definido como a força elétrica por unidade de carga de prova positiva colocada naquele ponto. Como é uma grandeza vetorial, o campo possui módulo, direção e sentido.",
          "Por convenção, seu sentido é o sentido da força que atuaria sobre uma carga de prova positiva. Se a carga colocada no campo for positiva, a força tem o mesmo sentido do campo. Se for negativa, a força tem sentido oposto.",
          "Uma armadilha comum é dizer que o campo depende da carga de prova. A carga de prova é usada para definir ou medir o campo, mas o campo naquele ponto é produzido pelas cargas fontes.",
        ],
      },
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
          "E é o campo elétrico.",
          "F é a força elétrica sobre a carga de prova.",
          "q é a carga de prova usada na definição.",
        ],
        structure: [
          "O campo mede força por unidade de carga.",
          "O campo é vetorial.",
          "A força sobre uma carga em um campo é obtida por F = qE.",
        ],
        steps: [
          {
            title: "Campo como força por carga",
            formulas: [String.raw`\vec{E} = \frac{\vec{F}}{q}`],
          },
          {
            title: "Força sobre uma carga",
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
          {
            title: "Carga negativa",
            body: [
              "Se q é negativa, a força tem sentido oposto ao campo elétrico.",
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Campo elétrico não é a mesma coisa que força elétrica. O campo existe no ponto por causa das cargas fontes. A força depende da carga que for colocada ali.",
      },
    ],
  },
  {
    id: "campo-carga",
    icon: Target,
    title: "Campo elétrico de uma carga puntiforme",
    accent: "from-red-700 to-rose-700",
    intro: [
      "Uma carga puntiforme cria campo elétrico ao seu redor. O módulo desse campo depende do módulo da carga fonte e da distância até ela.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Quanto maior a carga fonte, mais intenso é o campo que ela cria. Quanto mais longe estamos da carga, menor é o campo. A queda com a distância também é quadrática, assim como na Lei de Coulomb.",
          "Se a carga fonte é positiva, o campo aponta para fora dela. Se a carga fonte é negativa, o campo aponta para ela. Essa convenção vem do uso de uma carga de prova positiva para definir o campo.",
          "O módulo do campo elétrico criado por uma carga puntiforme Q, a uma distância d, é dado por E = k|Q|/d². A direção do campo é radial.",
          "É comum comparar campos em diferentes distâncias. Se a distância dobra, o campo cai para um quarto. Se a distância triplica, cai para um nono.",
          "Também é comum calcular campo resultante criado por várias cargas. Nesse caso, cada campo individual deve ser desenhado e somado vetorialmente.",
          "O campo de uma carga puntiforme independe da carga de prova. A carga de prova apenas sentiria força se fosse colocada naquele ponto.",
        ],
      },
    ],
    panels: [
      {
        title: "Campo de carga puntiforme",
        formula: String.raw`E = k\frac{|Q|}{d^2}`,
        terms: [
          "E é o módulo do campo elétrico.",
          "k é a constante eletrostática.",
          "Q é a carga fonte.",
          "d é a distância até a carga fonte.",
        ],
        structure: [
          "O campo cresce com o módulo da carga fonte.",
          "O campo diminui com o quadrado da distância.",
          "O sentido depende do sinal da carga fonte.",
        ],
        steps: [
          {
            title: "Partindo da Lei de Coulomb",
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
    id: "linhas",
    icon: BarChart3,
    title: "Linhas de campo elétrico",
    accent: "from-rose-700 to-pink-700",
    intro: [
      "Linhas de campo são representações visuais usadas para indicar direção, sentido e intensidade relativa do campo elétrico.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Uma linha de campo mostra o caminho que uma carga de prova positiva tenderia a seguir se fosse abandonada sob ação do campo elétrico. Por isso, as linhas saem de cargas positivas e entram em cargas negativas.",
          "Onde as linhas estão mais próximas, o campo é mais intenso. Onde estão mais afastadas, o campo é mais fraco. A densidade de linhas é uma representação qualitativa da intensidade.",
          "Linhas de campo não se cruzam. Se duas linhas se cruzassem, haveria duas direções possíveis para o campo no mesmo ponto. Isso seria fisicamente absurdo.",
          "Em cada ponto de uma linha de campo, o vetor campo elétrico é tangente à linha. O sentido da linha é o sentido do campo elétrico.",
          "Questões pedem para identificar sinais das cargas a partir do desenho das linhas, comparar intensidade do campo em regiões com maior ou menor densidade de linhas e reconhecer padrões de dipolos ou placas paralelas.",
          "Linhas de campo são uma representação, não objetos físicos materiais. Não existe um fio invisível saindo da carga positiva. O desenho é uma ferramenta para visualizar o campo.",
        ],
      },
    ],
    diagram: {
      kind: "fieldLines",
      title: "Diagrama visual: linhas de campo",
      caption:
        "As linhas saem do positivo e entram no negativo. Quanto mais concentradas, maior o campo.",
    },
    bullets: [
      "Linhas saem de cargas positivas.",
      "Linhas entram em cargas negativas.",
      "Linhas mais próximas indicam campo mais intenso.",
      "Linhas de campo não se cruzam.",
      "O vetor campo é tangente à linha em cada ponto.",
    ],
  },
  {
    id: "uniforme",
    icon: Layers,
    title: "Campo elétrico uniforme",
    accent: "from-pink-700 to-fuchsia-700",
    intro: [
      "Campo elétrico uniforme é aquele que possui mesmo módulo, mesma direção e mesmo sentido em todos os pontos de uma região.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Entre duas placas paralelas extensas, carregadas com sinais opostos, o campo elétrico na região central é aproximadamente uniforme. As linhas são retas, paralelas e igualmente espaçadas.",
          "Isso significa que uma carga colocada nessa região sofre uma força constante, desde que sua carga seja constante. A situação fica parecida com problemas de movimento sob aceleração constante, mas agora a força responsável é elétrica.",
          "Se uma partícula carregada entra em um campo uniforme com velocidade perpendicular ao campo, ela pode sofrer desvio semelhante ao de um lançamento horizontal. A Cinemática aparece novamente porque os modelos físicos se conectam.",
          "Campo uniforme é aquele em que o vetor campo elétrico é constante em todos os pontos analisados. Entre placas paralelas, a relação entre campo elétrico, diferença de potencial e distância é E = U/d, desconsiderando efeitos de borda.",
          "Questões podem pedir força elétrica, aceleração de uma partícula, movimento dentro do campo, energia adquirida ao atravessar uma ddp ou relação entre campo e tensão.",
          "A fórmula E = U/d vale para campo uniforme. Não use essa relação em qualquer campo elétrico sem verificar o contexto.",
        ],
      },
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
          "E é o campo elétrico uniforme.",
          "U é a diferença de potencial entre as placas.",
          "d é a distância entre as placas.",
        ],
        structure: [
          "Campo maior quando a ddp é maior.",
          "Campo menor quando a distância entre placas é maior.",
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
    id: "trabalho",
    icon: Flame,
    title: "Trabalho da força elétrica",
    accent: "from-fuchsia-700 to-violet-700",
    intro: [
      "A força elétrica pode realizar trabalho quando desloca uma carga em um campo elétrico.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Se uma carga se move sob ação da força elétrica, há transferência de energia. A força elétrica pode acelerar a carga, desacelerá-la ou alterar sua energia potencial elétrica.",
          "Em Eletrostática, a força elétrica é conservativa. Isso significa que o trabalho realizado entre dois pontos depende apenas dos pontos inicial e final, não do caminho percorrido.",
          "Essa propriedade é poderosa porque permite definir potencial elétrico. Se o trabalho dependesse do caminho, potencial elétrico como função de ponto perderia sentido.",
          "O trabalho da força elétrica no deslocamento de uma carga q entre dois pontos A e B pode ser escrito em função da diferença de potencial entre esses pontos.",
          "Questões podem pedir trabalho em função da carga e da ddp, energia adquirida por uma partícula ou velocidade final após atravessar uma região com diferença de potencial.",
          "O sinal do trabalho depende do sinal da carga e do sentido do deslocamento em relação ao potencial. Carga positiva se move espontaneamente para potenciais menores. Carga negativa responde de forma oposta.",
        ],
      },
    ],
    panels: [
      {
        title: "Trabalho em diferença de potencial",
        formula: String.raw`\tau = q(V_A - V_B)`,
        terms: [
          "τ é o trabalho da força elétrica.",
          "q é a carga deslocada.",
          "VA e VB são os potenciais elétricos nos pontos A e B.",
        ],
        structure: [
          "O trabalho depende da carga.",
          "O trabalho depende da diferença de potencial.",
          "O trabalho não depende do caminho em um campo eletrostático.",
        ],
        steps: [
          {
            title: "Diferença de potencial",
            formulas: [String.raw`U_{AB} = V_A - V_B`],
          },
          {
            title: "Trabalho elétrico",
            formulas: [String.raw`\tau = qU_{AB}`],
          },
        ],
      },
    ],
  },
  {
    id: "energia",
    icon: Gauge,
    title: "Energia potencial elétrica",
    accent: "from-violet-700 to-indigo-800",
    intro: [
      "Energia potencial elétrica é a energia associada à configuração de cargas elétricas.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Quando duas cargas estão próximas, o sistema formado por elas possui energia associada à interação elétrica. Essa energia depende dos sinais das cargas e da distância entre elas.",
          "Cargas de mesmo sinal se repelem. Para aproximá-las, geralmente é necessário realizar trabalho contra a repulsão, armazenando energia no sistema. Por isso, com referência no infinito, a energia potencial de cargas de mesmo sinal é positiva.",
          "Cargas de sinais opostos se atraem. Separá-las exige trabalho externo. Com referência no infinito, a energia potencial elétrica entre cargas opostas é negativa.",
          "A energia potencial elétrica entre duas cargas puntiformes q1 e q2, separadas por uma distância d, é dada por Ep = kq1q2/d. Diferentemente da fórmula do módulo da força de Coulomb, aqui os sinais das cargas devem ser mantidos.",
          "Questões costumam misturar energia potencial elétrica com conservação de energia mecânica. Uma carga pode perder energia potencial elétrica e ganhar energia cinética.",
          "Energia potencial elétrica é escalar. Ela pode ser positiva, negativa ou nula dependendo da configuração e da referência adotada. Usar módulo automaticamente aqui pode destruir a interpretação do problema.",
        ],
      },
    ],
    panels: [
      {
        title: "Energia potencial elétrica entre duas cargas",
        formula: String.raw`E_p = k\frac{q_1q_2}{d}`,
        terms: [
          "Ep é a energia potencial elétrica.",
          "k é a constante eletrostática.",
          "q1 e q2 são as cargas elétricas com sinal.",
          "d é a distância entre as cargas.",
        ],
        structure: [
          "Os sinais das cargas importam.",
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
    id: "potencial",
    icon: Calculator,
    title: "Potencial elétrico",
    accent: "from-indigo-800 to-slate-950",
    intro: [
      "Potencial elétrico é uma grandeza escalar que mede energia potencial elétrica por unidade de carga.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Potencial elétrico é uma forma de descrever o estado energético de um ponto do espaço. Ele responde à pergunta: se uma carga fosse colocada aqui, quanta energia potencial elétrica existiria por unidade de carga?",
          "Campo elétrico é vetor. Potencial elétrico é escalar. Essa diferença muda completamente a estratégia de resolução. Campos são somados vetorialmente. Potenciais são somados algebricamente.",
          "Uma carga positiva cria potencial positivo ao redor. Uma carga negativa cria potencial negativo. Quando várias cargas contribuem para o mesmo ponto, os potenciais podem se somar ou se cancelar.",
          "O potencial elétrico em um ponto é a energia potencial elétrica por unidade de carga de prova colocada nesse ponto. Para uma carga puntiforme Q, o potencial a uma distância d é V = kQ/d. Aqui o sinal de Q deve ser considerado.",
          "Questões fortes exploram a diferença entre campo e potencial. Um ponto pode ter campo elétrico nulo e potencial não nulo. Também pode ter potencial nulo e campo não nulo.",
          "Potencial elétrico não é energia potencial elétrica. Potencial é energia por carga. Energia potencial depende da carga que é colocada no ponto. A relação Ep = qV mostra a diferença: V pertence ao ponto devido às fontes; Ep depende também da carga colocada ali.",
        ],
      },
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
          "V é o potencial elétrico.",
          "k é a constante eletrostática.",
          "Q é a carga fonte com sinal.",
          "d é a distância até a carga fonte.",
        ],
        structure: [
          "Potencial é escalar.",
          "O sinal da carga fonte importa.",
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
          {
            title: "Potencial de carga puntiforme",
            formulas: [String.raw`V = k\frac{Q}{d}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Campo elétrico é vetor. Potencial elétrico é escalar. Campo pode se anular por simetria enquanto potencial não se anula.",
      },
    ],
  },
  {
    id: "ddp",
    icon: Zap,
    title: "Diferença de potencial elétrico",
    accent: "from-slate-950 to-indigo-900",
    intro: [
      "Diferença de potencial, ou ddp, é a diferença entre os potenciais elétricos de dois pontos.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "A diferença de potencial mede o desnível energético por unidade de carga entre dois pontos. Se uma carga se desloca entre esses pontos, há uma variação de energia potencial elétrica associada.",
          "É parecido, por analogia, com altura gravitacional. Um objeto em uma altura maior possui maior energia potencial gravitacional. Em eletricidade, uma carga em um potencial elétrico diferente possui uma energia potencial elétrica diferente.",
          "A ddp não pertence a um ponto isolado. Ela é comparação entre dois pontos. Falar em tensão de um ponto sem referência não faz sentido físico completo.",
          "A diferença de potencial entre os pontos A e B é UAB = VA − VB. Ela representa o trabalho por unidade de carga associado ao deslocamento entre esses pontos.",
          "A ddp aparece em trabalho elétrico, energia adquirida por partículas, campo uniforme e, mais tarde, circuitos elétricos.",
          "Pontos equipotenciais possuem mesma diferença de potencial nula entre si. Uma carga deslocada ao longo de uma superfície equipotencial não sofre trabalho da força elétrica.",
        ],
      },
    ],
    panels: [
      {
        title: "Diferença de potencial",
        formula: String.raw`U_{AB} = V_A - V_B`,
        terms: [
          "UAB é a diferença de potencial entre A e B.",
          "VA é o potencial no ponto A.",
          "VB é o potencial no ponto B.",
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
    id: "condutores",
    icon: Layers,
    title: "Condutores em equilíbrio eletrostático",
    accent: "from-indigo-900 to-purple-900",
    intro: [
      "Um condutor está em equilíbrio eletrostático quando suas cargas livres não apresentam movimento ordenado.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Em um condutor, existem cargas livres. Se houvesse campo elétrico no interior do condutor, essas cargas sofreriam força elétrica e se moveriam. Se elas se movem de forma ordenada, o condutor ainda não está em equilíbrio eletrostático.",
          "Portanto, quando o equilíbrio é atingido, o campo elétrico interno deve ser nulo. Essa é uma das ideias mais importantes do conteúdo.",
          "Além disso, qualquer excesso de carga fica na superfície externa. As cargas se repelem e se afastam tanto quanto possível, ocupando a superfície do condutor.",
          "Em um condutor em equilíbrio eletrostático, o campo elétrico no interior do material condutor é nulo, o potencial elétrico é constante em todo o condutor e o excesso de carga fica distribuído na superfície externa.",
          "Na superfície do condutor, o campo elétrico resultante deve ser perpendicular à superfície. Se houvesse componente tangencial, as cargas livres se moveriam sobre a superfície.",
          "Condutor em equilíbrio é um pacote de propriedades. Quando o enunciado disser isso, acenda o alerta: campo interno nulo, potencial constante, carga na superfície e campo perpendicular à superfície.",
        ],
      },
    ],
    diagram: {
      kind: "conductor",
      title: "Diagrama visual: condutor em equilíbrio",
      caption:
        "No equilíbrio eletrostático, o campo interno é nulo e a carga em excesso fica na superfície.",
    },
    bullets: [
      "Campo elétrico interno nulo.",
      "Potencial constante em todo o condutor.",
      "Carga em excesso na superfície externa.",
      "Campo elétrico perpendicular à superfície.",
      "Maior concentração de cargas em regiões de maior curvatura.",
    ],
    notes: [
      {
        title: "Observações",
        type: "success",
        body: "Se existisse campo dentro do condutor, cargas livres se moveriam. Se elas ainda se movem, não há equilíbrio. Logo, em equilíbrio eletrostático, o campo interno é nulo.",
      },
    ],
  },
  {
    id: "blindagem",
    icon: ShieldCheck,
    title: "Blindagem eletrostática",
    accent: "from-purple-900 to-slate-950",
    intro: [
      "Blindagem eletrostática é o fenômeno pelo qual o interior de um condutor em equilíbrio fica protegido de campos elétricos externos.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Quando um condutor é colocado em uma região com campo elétrico externo, suas cargas livres se redistribuem. Essa redistribuição cria um campo induzido que cancela o campo externo no interior do material condutor.",
          "O resultado é que, no equilíbrio eletrostático, o campo elétrico no interior do condutor é nulo. Essa é a base da gaiola de Faraday.",
          "Por isso, o interior de estruturas metálicas pode ficar protegido de certos campos elétricos externos. A proteção não ocorre porque o metal destrói o campo externo, mas porque as cargas livres se reorganizam de modo que o campo resultante interno seja nulo.",
          "Blindagem eletrostática ocorre quando uma superfície condutora redistribui suas cargas de modo a tornar nulo o campo elétrico no interior da região protegida.",
          "Questões podem perguntar por que o campo dentro de uma casca condutora é nulo, por que uma pessoa dentro de um carro pode estar protegida durante uma tempestade ou como cargas se distribuem em cavidades.",
          "Blindagem eletrostática vale para situações eletrostáticas ou aproximadamente estáticas. Campos variáveis no tempo entram em temas mais avançados de eletromagnetismo.",
        ],
      },
    ],
    diagram: {
      kind: "faraday",
      title: "Diagrama visual: blindagem eletrostática",
      caption:
        "As cargas se redistribuem na superfície e anulam o campo elétrico no interior do condutor.",
    },
  },
  {
    id: "pontas",
    icon: AlertTriangle,
    title: "Poder das pontas",
    accent: "from-red-700 to-red-950",
    intro: [
      "Poder das pontas é o fenômeno pelo qual cargas elétricas se concentram mais em regiões pontiagudas de um condutor.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Em uma superfície pontiaguda, o raio de curvatura é pequeno. Nessa região, as cargas ficam mais concentradas, e o campo elétrico nas proximidades pode se tornar muito intenso.",
          "Quando o campo fica suficientemente intenso, pode ionizar o ar ao redor e favorecer descargas elétricas. Esse é o princípio associado ao funcionamento de para-raios.",
          "Uma esfera distribui melhor suas cargas. Uma ponta concentra mais. A geometria do condutor altera a distribuição de cargas e o campo próximo à superfície.",
          "Em condutores em equilíbrio, a densidade superficial de carga tende a ser maior em regiões de menor raio de curvatura.",
          "Como o campo elétrico próximo à superfície está relacionado à densidade de carga, regiões pontiagudas apresentam campo mais intenso.",
          "Questões podem relacionar poder das pontas a para-raios, descargas elétricas, ionização do ar e concentração de cargas em regiões pontiagudas.",
        ],
      },
    ],
    diagram: {
      kind: "pointEffect",
      title: "Diagrama visual: poder das pontas",
      caption:
        "Na ponta, a concentração de cargas é maior e o campo elétrico nas proximidades fica mais intenso.",
    },
  },
  {
    id: "graficos",
    icon: BarChart3,
    title: "Gráficos importantes",
    accent: "from-blue-900 to-indigo-900",
    intro: [
      "Gráficos em Eletrostática ajudam a visualizar como campo, potencial e energia variam com a distância.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "Para uma carga puntiforme, tanto o campo quanto o potencial diminuem quando nos afastamos da carga. Mas eles não diminuem do mesmo jeito.",
          "O campo elétrico cai com o quadrado da distância. O potencial cai com a distância. Por isso, o campo diminui mais rapidamente que o potencial.",
          "Esse detalhe é muito importante em gráficos. Uma curva de 1/r² desce mais rápido que uma curva de 1/r. Se o aluno ignora isso, troca gráfico de campo por gráfico de potencial.",
          "Para uma carga puntiforme, o módulo do campo elétrico é proporcional a 1/r², enquanto o potencial elétrico é proporcional a 1/r.",
          "A energia potencial elétrica entre duas cargas também varia como 1/r, mas seu sinal depende do produto das cargas.",
          "Questões podem pedir identificação de gráficos E × r, V × r e Ep × r. Também podem perguntar comportamento assintótico, sinal das curvas e comparação entre queda de campo e potencial.",
        ],
      },
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
          "E é o campo elétrico.",
          "V é o potencial elétrico.",
          "r é a distância até a carga fonte.",
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
    id: "dimensional",
    icon: Calculator,
    title: "Análise dimensional",
    accent: "from-indigo-900 to-slate-950",
    intro: [
      "Análise dimensional verifica se uma fórmula faz sentido em termos de unidades.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "A análise dimensional é uma ferramenta de controle de qualidade. Ela não substitui o raciocínio físico, mas ajuda a detectar erros grosseiros antes que eles se transformem em uma resolução inteira errada.",
          "Em Eletrostática, as unidades carregam significado físico. Campo elétrico em N/C significa força por unidade de carga. Potencial em J/C significa energia por unidade de carga.",
          "A coerência dimensional exige que os dois lados de uma equação tenham as mesmas unidades físicas. Se uma expressão para força não resulta em newton, ou uma expressão para potencial não resulta em volt, há algo errado na montagem da fórmula.",
          "Em provas difíceis, a análise dimensional também pode ajudar a eliminar alternativas. Mesmo sem resolver tudo, uma alternativa com unidade incompatível pode ser descartada.",
          "Só não confunda checagem dimensional com prova completa. Uma fórmula pode ter unidade correta e ainda estar fisicamente errada.",
        ],
      },
    ],
    panels: [
      {
        title: "Unidades importantes",
        formula: String.raw`\text{C}, \ \text{N}, \ \text{V}, \ \text{J}, \ \frac{\text{N}}{\text{C}}`,
        terms: [
          "C é coulomb, unidade de carga elétrica.",
          "N é newton, unidade de força.",
          "V é volt, unidade de potencial elétrico.",
          "J é joule, unidade de energia.",
          "N/C é uma unidade de campo elétrico.",
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
              String.raw`[V] = \frac{\text{J}}{\text{C}} = \text{V}`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: "armadilhas",
    icon: AlertTriangle,
    title: "Armadilhas e erros comuns",
    accent: "from-red-700 to-red-950",
    intro: [
      "Eletrostática tem muitas fórmulas simples, mas as armadilhas conceituais são brutais. A maioria dos erros nasce quando o aluno tenta decorar sinais e fórmulas sem desenhar forças, campos e potenciais.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "A maior dificuldade da Eletrostática não é decorar Coulomb. É saber quando somar vetorialmente, quando somar algebricamente, quando usar sinal, quando usar módulo, quando o corpo está neutro, quando está polarizado e quando o condutor está em equilíbrio.",
          "O aluno que trata tudo como número positivo perde metade do conteúdo. O aluno que trata tudo como vetor também erra. A arte está em saber a natureza de cada grandeza.",
          "Campo elétrico é vetor. Força elétrica é vetor. Potencial elétrico é escalar. Energia potencial elétrica é escalar. Essa separação resolve mais questão do que muita fórmula decorada.",
          "Campo nulo não implica potencial nulo. Potencial nulo não implica campo nulo. Essa dupla precisa ficar muito clara, porque aparece em questões de simetria e em sistemas com várias cargas.",
        ],
      },
    ],
    bullets: [
      "Achar que corpo neutro não possui cargas.",
      "Achar que corpo positivo ganhou prótons.",
      "Concluir que atração sempre significa cargas opostas.",
      "Esquecer que, na eletrização comum, quem se move são elétrons.",
      "Trocar a ordem das etapas na indução.",
      "Somar campos como escalares quando são vetores.",
      "Somar potenciais como vetores quando são escalares.",
      "Confundir campo elétrico com força elétrica.",
      "Confundir potencial elétrico com energia potencial elétrica.",
      "Achar que campo nulo implica potencial nulo.",
      "Achar que potencial nulo implica campo nulo.",
      "Usar módulo em energia potencial elétrica sem considerar sinais.",
    ],
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Campo é vetor. Potencial é escalar. Força depende da carga colocada. Campo pertence ao ponto do espaço. Potencial não é energia; é energia por carga.",
      },
    ],
  },
  {
    id: "provas",
    icon: Target,
    title: "Pontos importantes para provas difíceis",
    accent: "from-slate-950 to-purple-900",
    intro: [
      "Em provas difíceis, Eletrostática raramente aparece como aplicação direta de uma fórmula isolada. O conteúdo costuma vir misturado com simetria, vetores, energia, condutores em equilíbrio e interpretação gráfica.",
    ],
    concepts: [
      {
        title: "explicacao",
        paragraphs: [
          "O aluno forte não começa substituindo fórmula. Ele desenha o sistema, identifica sinais, verifica simetrias, separa grandezas vetoriais e escalares, escolhe eixos e só depois calcula.",
          "Em problemas de campo e força, a direção importa. Em problemas de potencial e energia, o sinal e a soma algébrica importam. Em problemas com condutores, as propriedades de equilíbrio mandam mais do que a aparência do desenho.",
          "Superposição vetorial, pontos de campo nulo, pontos de potencial nulo, condutores em equilíbrio, blindagem e indução são temas com forte potencial de aparecer em questões mais elaboradas.",
          "A pergunta mental mais útil é: a grandeza pedida é vetor ou escalar? Se for vetor, desenhe e some componentes. Se for escalar, cuide dos sinais e some algebricamente.",
        ],
      },
    ],
    bullets: [
      "Superposição de forças e campos.",
      "Decomposição vetorial em duas dimensões.",
      "Pontos onde o campo elétrico é nulo.",
      "Pontos onde o potencial elétrico é nulo.",
      "Diferença entre campo nulo e potencial nulo.",
      "Condutores em equilíbrio eletrostático.",
      "Blindagem eletrostática.",
      "Eletrização por indução.",
      "Poder das pontas.",
      "Energia potencial elétrica com sinais.",
      "Gráficos de campo e potencial em função da distância.",
    ],
    notes: [
      {
        title: "Observações",
        type: "dark",
        body: "Antes de calcular, pergunte: isso é vetor ou escalar? O sinal importa? Há simetria? O ponto é equipotencial? O condutor está em equilíbrio? O problema pede campo, força, potencial ou energia?",
      },
    ],
  },
];

const examples: Example[] = [
  {
    id: "quantizacao",
    title: "Exemplo — Quantização da carga",
    statement:
      "Um corpo perdeu 5,0 × 10¹² elétrons. Determine sua carga elétrica.",
    explanation: [
      "Se o corpo perdeu elétrons, ficou positivo. O módulo da carga adquirida é o número de elétrons multiplicado pela carga elementar.",
    ],
    formulas: [
      String.raw`Q = ne`,
      String.raw`Q = 5{,}0 \times 10^{12}\cdot 1{,}6 \times 10^{-19}`,
      String.raw`Q = 8{,}0 \times 10^{-7} \ \text{C}`,
      String.raw`Q = +8{,}0 \times 10^{-7} \ \text{C}`,
    ],
    notes: [
      {
        title: "Observações",
        type: "success",
        body: "A carga é positiva porque o corpo perdeu elétrons.",
      },
    ],
  },
  {
    id: "contato",
    title: "Exemplo — Contato entre esferas idênticas",
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
        title: "Observações",
        type: "success",
        body: "Cada esfera fica com +2 μC. Isso só vale diretamente porque elas são idênticas.",
      },
    ],
  },
  {
    id: "coulomb",
    title: "Exemplo — Lei de Coulomb",
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
        title: "Observações",
        type: "success",
        body: "O módulo da força elétrica é 0,60 N. O sentido dependeria dos sinais das cargas.",
      },
    ],
  },
  {
    id: "campo",
    title: "Exemplo — Campo elétrico",
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
        title: "Observações",
        type: "success",
        body: "O campo elétrico vale 2,0 × 10⁵ N/C.",
      },
    ],
  },
  {
    id: "potencial",
    title: "Exemplo — Potencial elétrico",
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
        title: "Observações",
        type: "success",
        body: "O potencial é positivo porque a carga fonte é positiva.",
      },
    ],
  },
  {
    id: "campo-potencial",
    title: "Exemplo — Campo nulo e potencial não nulo",
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
        title: "Observações",
        type: "warning",
        body: "Campo nulo não significa potencial nulo. Essa diferença derruba muita gente porque campo é vetor e potencial é escalar.",
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
    description: "Carga elétrica aparece em múltiplos inteiros da carga elementar.",
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
                    Uma abordagem completa de Eletrostática com explicações
                    conectadas, fórmulas interpretadas, diagramas visuais e
                    observações de prova.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["20", "blocos"],
                    ["16", "fórmulas"],
                    ["SVG", "diagramas"],
                    ["PRO", "nível"],
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
                <ConnectedTheoryText
                  intro={section.intro}
                  concepts={section.concepts}
                />

                {section.diagram ? (
                  <CircuitDiagram diagram={section.diagram} />
                ) : null}

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
              description="As fórmulas principais e os significados físicos que sustentam o conteúdo inteiro."
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
                  "Corpo neutro possui cargas, mas a soma algébrica é zero.",
                  "Corpo positivo perdeu elétrons; corpo negativo ganhou elétrons.",
                  "Força elétrica é vetor; energia potencial elétrica é escalar.",
                  "Campo elétrico é vetor; potencial elétrico é escalar.",
                  "Campos elétricos são somados vetorialmente.",
                  "Potenciais elétricos são somados algebricamente.",
                  "Campo nulo não implica potencial nulo.",
                  "Potencial nulo não implica campo nulo.",
                  "Em condutor em equilíbrio, o campo elétrico interno é nulo.",
                  "Em condutor em equilíbrio, a carga em excesso fica na superfície.",
                  "Na indução, a ordem das etapas é decisiva.",
                  "Atração não prova necessariamente cargas opostas.",
                ]}
              />

              <NoteBox title="Observações" type="dark">
                Eletrostática não é uma coleção de continhas com Coulomb. É a
                base para entender campo, potencial, energia, condutores,
                indução, blindagem e praticamente todo o resto da Eletricidade.
              </NoteBox>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}
