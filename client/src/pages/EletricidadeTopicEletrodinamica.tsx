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
  | "series"
  | "parallel"
  | "mixed"
  | "generator"
  | "receiver"
  | "meters"
  | "wheatstone"
  | "shortCircuit"
  | "capacitor"
  | "transmission"
  | "nodes";

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

function InlineFormula({ formula }: { formula: string }) {
  return (
    <span className="mx-1 inline-flex align-middle rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-slate-100 [&_.katex]:text-slate-100">
      <MathFormula formula={formula} />
    </span>
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

function CircuitDiagram({ diagram }: { diagram: DiagramData }) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">{diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[680px]">
          {diagram.kind === "series" && <SeriesDiagram />}
          {diagram.kind === "parallel" && <ParallelDiagram />}
          {diagram.kind === "mixed" && <MixedDiagram />}
          {diagram.kind === "generator" && <GeneratorDiagram />}
          {diagram.kind === "receiver" && <ReceiverDiagram />}
          {diagram.kind === "meters" && <MetersDiagram />}
          {diagram.kind === "wheatstone" && <WheatstoneDiagram />}
          {diagram.kind === "shortCircuit" && <ShortCircuitDiagram />}
          {diagram.kind === "capacitor" && <CapacitorDiagram />}
          {diagram.kind === "transmission" && <TransmissionDiagram />}
          {diagram.kind === "nodes" && <NodesDiagram />}
        </div>
      </div>
    </div>
  );
}

function Wire({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#0f172a"
      strokeWidth="4"
      strokeLinecap="round"
    />
  );
}

function Dot({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r="7" fill="#0f172a" />
      {label ? (
        <text
          x={x}
          y={y - 16}
          textAnchor="middle"
          className="fill-slate-950 text-[18px] font-black"
        >
          {label}
        </text>
      ) : null}
    </>
  );
}

function Resistor({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
  return (
    <>
      <rect
        x={x}
        y={y - 22}
        width="92"
        height="44"
        rx="12"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <text
        x={x + 46}
        y={y + 7}
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        {label}
      </text>
    </>
  );
}

function Battery({
  x,
  y,
  label = "Fonte",
}: {
  x: number;
  y: number;
  label?: string;
}) {
  return (
    <>
      <line x1={x} y1={y - 30} x2={x} y2={y + 30} stroke="#0f172a" strokeWidth="4" />
      <line x1={x + 18} y1={y - 18} x2={x + 18} y2={y + 18} stroke="#0f172a" strokeWidth="4" />
      <text
        x={x + 9}
        y={y - 45}
        textAnchor="middle"
        className="fill-slate-950 text-[16px] font-black"
      >
        {label}
      </text>
      <text x={x - 12} y={y - 36} className="fill-emerald-700 text-[18px] font-black">
        +
      </text>
      <text x={x + 25} y={y + 42} className="fill-red-700 text-[18px] font-black">
        -
      </text>
    </>
  );
}

function Meter({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
  return (
    <>
      <circle cx={x} cy={y} r="30" fill="#eef2ff" stroke="#0f172a" strokeWidth="4" />
      <text
        x={x}
        y={y + 7}
        textAnchor="middle"
        className="fill-slate-950 text-[22px] font-black"
      >
        {label}
      </text>
    </>
  );
}

function CapacitorSymbol({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <line x1={x} y1={y - 35} x2={x} y2={y + 35} stroke="#0f172a" strokeWidth="5" />
      <line x1={x + 20} y1={y - 35} x2={x + 20} y2={y + 35} stroke="#0f172a" strokeWidth="5" />
      <text
        x={x + 10}
        y={y - 50}
        textAnchor="middle"
        className="fill-slate-950 text-[18px] font-black"
      >
        {label}
      </text>
    </>
  );
}

function Label({
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

function SeriesDiagram() {
  return (
    <svg viewBox="0 0 760 260" className="h-[260px] w-full">
      <rect x="15" y="15" width="730" height="230" rx="26" fill="#ffffff" />
      <Battery x={90} y={130} />
      <Wire x1={108} y1={130} x2={185} y2={130} />
      <Resistor x={185} y={130} label="R₁" />
      <Wire x1={277} y1={130} x2={340} y2={130} />
      <Resistor x={340} y={130} label="R₂" />
      <Wire x1={432} y1={130} x2={495} y2={130} />
      <Resistor x={495} y={130} label="R₃" />
      <Wire x1={587} y1={130} x2={670} y2={130} />
      <Wire x1={670} y1={130} x2={670} y2={205} />
      <Wire x1={670} y1={205} x2={90} y2={205} />
      <Wire x1={90} y1={205} x2={90} y2={160} />
      <Label x={380} y={70}>mesma corrente atravessa todos os resistores</Label>
      <Label x={380} y={235}>a tensão total se divide entre R₁, R₂ e R₃</Label>
    </svg>
  );
}

function ParallelDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-[320px] w-full">
      <rect x="15" y="15" width="730" height="290" rx="26" fill="#ffffff" />
      <Battery x={85} y={160} />
      <Wire x1={103} y1={160} x2={165} y2={160} />
      <Dot x={165} y={160} label="A" />
      <Wire x1={165} y1={160} x2={165} y2={90} />
      <Wire x1={165} y1={90} x2={310} y2={90} />
      <Resistor x={310} y={90} label="R₁" />
      <Wire x1={402} y1={90} x2={595} y2={90} />
      <Wire x1={165} y1={160} x2={310} y2={160} />
      <Resistor x={310} y={160} label="R₂" />
      <Wire x1={402} y1={160} x2={595} y2={160} />
      <Wire x1={165} y1={160} x2={165} y2={230} />
      <Wire x1={165} y1={230} x2={310} y2={230} />
      <Resistor x={310} y={230} label="R₃" />
      <Wire x1={402} y1={230} x2={595} y2={230} />
      <Wire x1={595} y1={90} x2={595} y2={230} />
      <Dot x={595} y={160} label="B" />
      <Wire x1={595} y1={160} x2={675} y2={160} />
      <Wire x1={675} y1={160} x2={675} y2={270} />
      <Wire x1={675} y1={270} x2={85} y2={270} />
      <Wire x1={85} y1={270} x2={85} y2={190} />
      <Label x={380} y={55}>todos os resistores estão entre os mesmos nós A e B</Label>
      <Label x={380} y={300}>mesma tensão em cada ramo; corrente total se divide</Label>
    </svg>
  );
}

function MixedDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />
      <Battery x={85} y={165} />
      <Wire x1={103} y1={165} x2={185} y2={165} />
      <Resistor x={185} y={165} label="R₁" />
      <Wire x1={277} y1={165} x2={345} y2={165} />
      <Dot x={345} y={165} label="A" />
      <Wire x1={345} y1={165} x2={345} y2={105} />
      <Wire x1={345} y1={105} x2={455} y2={105} />
      <Resistor x={455} y={105} label="R₂" />
      <Wire x1={547} y1={105} x2={625} y2={105} />
      <Wire x1={345} y1={165} x2={455} y2={225} />
      <Resistor x={455} y={225} label="R₃" />
      <Wire x1={547} y1={225} x2={625} y2={225} />
      <Wire x1={625} y1={105} x2={625} y2={225} />
      <Dot x={625} y={165} label="B" />
      <Wire x1={625} y1={165} x2={685} y2={165} />
      <Wire x1={685} y1={165} x2={685} y2={275} />
      <Wire x1={685} y1={275} x2={85} y2={275} />
      <Wire x1={85} y1={275} x2={85} y2={195} />
      <Label x={250} y={115}>R₁ em série</Label>
      <Label x={505} y={65}>R₂ e R₃ em paralelo</Label>
      <Label x={385} y={305}>resolva primeiro o paralelo entre A e B, depois some com R₁</Label>
    </svg>
  );
}

function GeneratorDiagram() {
  return (
    <svg viewBox="0 0 760 280" className="h-[280px] w-full">
      <rect x="15" y="15" width="730" height="250" rx="26" fill="#ffffff" />
      <Battery x={90} y={140} label="ε" />
      <Wire x1={108} y1={140} x2={210} y2={140} />
      <Resistor x={210} y={140} label="r" />
      <Wire x1={302} y1={140} x2={420} y2={140} />
      <Resistor x={420} y={140} label="R" />
      <Wire x1={512} y1={140} x2={670} y2={140} />
      <Wire x1={670} y1={140} x2={670} y2={220} />
      <Wire x1={670} y1={220} x2={90} y2={220} />
      <Wire x1={90} y1={220} x2={90} y2={170} />
      <Label x={255} y={95}>resistência interna do gerador</Label>
      <Label x={465} y={95}>circuito externo</Label>
      <Label x={380} y={250}>U = ε - ri: a tensão útil é menor que a fem</Label>
    </svg>
  );
}

function ReceiverDiagram() {
  return (
    <svg viewBox="0 0 760 280" className="h-[280px] w-full">
      <rect x="15" y="15" width="730" height="250" rx="26" fill="#ffffff" />
      <Battery x={90} y={140} label="Fonte" />
      <Wire x1={108} y1={140} x2={220} y2={140} />
      <circle cx={270} cy={140} r="42" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x={270} y={147} textAnchor="middle" className="fill-slate-950 text-[20px] font-black">
        Motor
      </text>
      <Wire x1={312} y1={140} x2={395} y2={140} />
      <Resistor x={395} y={140} label="r′" />
      <Wire x1={487} y1={140} x2={670} y2={140} />
      <Wire x1={670} y1={140} x2={670} y2={220} />
      <Wire x1={670} y1={220} x2={90} y2={220} />
      <Wire x1={90} y1={220} x2={90} y2={170} />
      <Label x={270} y={85}>conversão útil: ε′</Label>
      <Label x={440} y={95}>perda interna: r′i</Label>
      <Label x={380} y={250}>U = ε′ + r′i: a fonte precisa vencer as duas partes</Label>
    </svg>
  );
}

function MetersDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />
      <Battery x={80} y={165} />
      <Wire x1={98} y1={165} x2={170} y2={165} />
      <Meter x={210} y={165} label="A" />
      <Wire x1={240} y1={165} x2={330} y2={165} />
      <Resistor x={330} y={165} label="R" />
      <Wire x1={422} y1={165} x2={625} y2={165} />
      <Wire x1={625} y1={165} x2={625} y2={260} />
      <Wire x1={625} y1={260} x2={80} y2={260} />
      <Wire x1={80} y1={260} x2={80} y2={195} />
      <Wire x1={330} y1={165} x2={330} y2={90} />
      <Wire x1={422} y1={165} x2={422} y2={90} />
      <Wire x1={330} y1={90} x2={355} y2={90} />
      <Meter x={385} y={90} label="V" />
      <Wire x1={415} y1={90} x2={422} y2={90} />
      <Label x={210} y={115}>amperímetro em série</Label>
      <Label x={385} y={45}>voltímetro em paralelo</Label>
      <Label x={380} y={300}>A mede corrente do ramo; V mede tensão nos terminais do resistor</Label>
    </svg>
  );
}

function WheatstoneDiagram() {
  return (
    <svg viewBox="0 0 760 390" className="h-[390px] w-full">
      <rect x="15" y="15" width="730" height="360" rx="26" fill="#ffffff" />
      <Battery x={80} y={195} />
      <Dot x={170} y={195} label="P" />
      <Dot x={610} y={195} label="Q" />
      <Wire x1={98} y1={195} x2={170} y2={195} />
      <Wire x1={610} y1={195} x2={680} y2={195} />
      <Wire x1={680} y1={195} x2={680} y2={320} />
      <Wire x1={680} y1={320} x2={80} y2={320} />
      <Wire x1={80} y1={320} x2={80} y2={225} />

      <Wire x1={170} y1={195} x2={270} y2={95} />
      <Resistor x={270} y={95} label="R₁" />
      <Wire x1={362} y1={95} x2={610} y2={195} />

      <Wire x1={170} y1={195} x2={270} y2={295} />
      <Resistor x={270} y={295} label="R₂" />
      <Wire x1={362} y1={295} x2={610} y2={195} />

      <Wire x1={390} y1={143} x2={500} y2={143} />
      <Resistor x={500} y={143} label="R₃" />
      <Wire x1={592} y1={143} x2={610} y2={195} />

      <Wire x1={390} y1={247} x2={500} y2={247} />
      <Resistor x={500} y={247} label="R₄" />
      <Wire x1={592} y1={247} x2={610} y2={195} />

      <Meter x={420} y={195} label="G" />
      <Wire x1={362} y1={95} x2={390} y2={143} />
      <Wire x1={362} y1={295} x2={390} y2={247} />
      <Wire x1={390} y1={143} x2={390} y2={165} />
      <Wire x1={390} y1={225} x2={390} y2={247} />

      <Label x={420} y={55}>ponte equilibrada: corrente no galvanômetro é zero</Label>
      <Label x={420} y={360}>condição: R₁/R₂ = R₃/R₄</Label>
    </svg>
  );
}

function ShortCircuitDiagram() {
  return (
    <svg viewBox="0 0 760 310" className="h-[310px] w-full">
      <rect x="15" y="15" width="730" height="280" rx="26" fill="#ffffff" />
      <Battery x={90} y={155} />
      <Wire x1={108} y1={155} x2={220} y2={155} />
      <Resistor x={220} y={155} label="R" />
      <Wire x1={312} y1={155} x2={650} y2={155} />
      <Wire x1={650} y1={155} x2={650} y2={245} />
      <Wire x1={650} y1={245} x2={90} y2={245} />
      <Wire x1={90} y1={245} x2={90} y2={185} />

      <path d="M 170 155 C 255 55, 500 55, 610 155" fill="none" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
      <text x={390} y={75} textAnchor="middle" className="fill-red-700 text-[20px] font-black">
        caminho de resistência muito baixa
      </text>

      <Label x={385} y={115}>a corrente prefere o caminho mais fácil</Label>
      <Label x={380} y={280}>curto-circuito pode gerar corrente enorme e aquecimento perigoso</Label>
    </svg>
  );
}

function CapacitorDiagram() {
  return (
    <svg viewBox="0 0 760 290" className="h-[290px] w-full">
      <rect x="15" y="15" width="730" height="260" rx="26" fill="#ffffff" />
      <Battery x={90} y={145} />
      <Wire x1={108} y1={145} x2={270} y2={145} />
      <CapacitorSymbol x={330} y={145} label="C" />
      <Wire x1={350} y1={145} x2={650} y2={145} />
      <Wire x1={650} y1={145} x2={650} y2={230} />
      <Wire x1={650} y1={230} x2={90} y2={230} />
      <Wire x1={90} y1={230} x2={90} y2={175} />
      <text x={310} y={105} className="fill-emerald-700 text-[20px] font-black">+</text>
      <text x={365} y={105} className="fill-red-700 text-[20px] font-black">−</text>
      <Label x={380} y={70}>capacitor armazena carga nas placas</Label>
      <Label x={380} y={265}>após muito tempo em corrente contínua: circuito aberto ideal</Label>
    </svg>
  );
}

function TransmissionDiagram() {
  return (
    <svg viewBox="0 0 760 300" className="h-[300px] w-full">
      <rect x="15" y="15" width="730" height="270" rx="26" fill="#ffffff" />
      <circle cx={105} cy={150} r="38" fill="#eef2ff" stroke="#0f172a" strokeWidth="4" />
      <text x={105} y={157} textAnchor="middle" className="fill-slate-950 text-[17px] font-black">
        Usina
      </text>
      <rect x={205} y={105} width="100" height="90" rx="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x={255} y={145} textAnchor="middle" className="fill-slate-950 text-[15px] font-black">
        Trafo
      </text>
      <text x={255} y={167} textAnchor="middle" className="fill-slate-950 text-[13px] font-bold">
        eleva U
      </text>
      <rect x={455} y={105} width="100" height="90" rx="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
      <text x={505} y={145} textAnchor="middle" className="fill-slate-950 text-[15px] font-black">
        Trafo
      </text>
      <text x={505} y={167} textAnchor="middle" className="fill-slate-950 text-[13px] font-bold">
        reduz U
      </text>
      <rect x={625} y={115} width="75" height="70" rx="14" fill="#ecfeff" stroke="#0f172a" strokeWidth="4" />
      <text x={662} y={157} textAnchor="middle" className="fill-slate-950 text-[16px] font-black">
        Casa
      </text>

      <Wire x1={143} y1={150} x2={205} y2={150} />
      <Wire x1={305} y1={135} x2={455} y2={135} />
      <Wire x1={305} y1={165} x2={455} y2={165} />
      <Wire x1={555} y1={150} x2={625} y2={150} />
      <Label x={380} y={105}>alta tensão na transmissão</Label>
      <Label x={380} y={220}>para mesma potência: U maior → i menor → perdas Ri² menores</Label>
    </svg>
  );
}

function NodesDiagram() {
  return (
    <svg viewBox="0 0 760 290" className="h-[290px] w-full">
      <rect x="15" y="15" width="730" height="260" rx="26" fill="#ffffff" />
      <Dot x={170} y={145} label="Nó A" />
      <Dot x={590} y={145} label="Nó B" />
      <Wire x1={170} y1={145} x2={260} y2={90} />
      <Resistor x={260} y={90} label="R₁" />
      <Wire x1={352} y1={90} x2={590} y2={145} />
      <Wire x1={170} y1={145} x2={260} y2={145} />
      <Resistor x={260} y={145} label="R₂" />
      <Wire x1={352} y1={145} x2={590} y2={145} />
      <Wire x1={170} y1={145} x2={260} y2={200} />
      <Resistor x={260} y={200} label="R₃" />
      <Wire x1={352} y1={200} x2={590} y2={145} />
      <Label x={380} y={55}>três caminhos diferentes entre os mesmos dois nós</Label>
      <Label x={380} y={250}>se compartilham A e B, estão em paralelo, mesmo desenhados de formas diferentes</Label>
    </svg>
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
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
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
            <h3 className="text-lg font-black text-slate-950">{example.title}</h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {example.statement}
            </p>
          </div>

          <div className="flex-shrink-0 rounded-full bg-slate-950 p-2 text-white">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "1. Contexto físico e histórico",
    accent: "from-indigo-600 to-purple-700",
    paragraphs: [
      "A Eletrodinâmica é a parte da Eletricidade que estuda cargas elétricas em movimento e os efeitos associados a esse movimento. Enquanto a Eletrostática analisa cargas em repouso, campos elétricos, potencial elétrico e equilíbrio eletrostático, a Eletrodinâmica começa quando essas cargas passam a se deslocar de maneira ordenada.",
      "Ela não aparece do nada. Para que exista corrente em um condutor, normalmente há uma diferença de potencial entre dois pontos. Essa diferença estabelece campo elétrico no condutor. O campo exerce força sobre portadores livres, como elétrons em metais, e esses portadores passam a apresentar movimento médio ordenado.",
      "Historicamente, a eletricidade só se tornou uma tecnologia poderosa quando foi possível manter corrente elétrica de modo contínuo. A partir de pilhas, baterias, motores e instrumentos de medição, a eletricidade deixou de ser apenas faísca e choque ocasional e virou uma linguagem técnica para controlar energia.",
      "Por isso, a Eletrodinâmica conecta conceitos abstratos a aplicações concretas: chuveiros, lâmpadas, motores, baterias, fusíveis, disjuntores, linhas de transmissão, eletrônica e redes elétricas.",
    ],
    numbered: [
      "Uma fonte estabelece diferença de potencial.",
      "A diferença de potencial estabelece campo elétrico no condutor.",
      "O campo elétrico exerce força sobre os portadores livres.",
      "Os portadores passam a ter movimento médio ordenado.",
      "Esse movimento ordenado constitui a corrente elétrica.",
      "A energia elétrica pode ser transformada em calor, luz, movimento, som, energia química ou processamento de informação.",
    ],
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "Eletrodinâmica é o estudo do movimento organizado de cargas e da transferência de energia elétrica em circuitos.",
      },
    ],
  },
  {
    id: 2,
    icon: Zap,
    title: "2. Ideia intuitiva de corrente elétrica",
    accent: "from-purple-600 to-indigo-700",
    paragraphs: [
      "Corrente elétrica é o fluxo ordenado de cargas elétricas. A palavra ordenado é essencial. Em um metal, os elétrons livres se movem o tempo todo por agitação térmica, mesmo sem pilha, bateria ou tomada ligada.",
      "Esse movimento térmico, porém, é caótico. Em média, não há direção preferencial. Um elétron vai para um lado, outro para outro, e o resultado macroscópico não é uma corrente elétrica útil.",
      "Quando uma fonte é conectada, surge uma diferença de potencial entre os extremos do condutor. Essa diferença cria campo elétrico no interior do fio. O campo atua sobre os elétrons livres, gerando um pequeno movimento médio ordenado, chamado velocidade de deriva.",
      "A velocidade de deriva dos elétrons costuma ser pequena. O circuito responde rapidamente não porque um elétron atravessa tudo correndo, mas porque o campo elétrico se estabelece ao longo do condutor com velocidade muito alta. Não é uma corrida de elétrons; é uma reorganização coletiva do sistema.",
    ],
    panels: [
      {
        title: "Sentido real e sentido convencional",
        formula: String.raw`\text{sentido dos elétrons} = \text{oposto ao sentido convencional}`,
        terms: [
          "Sentido real dos elétrons: nos metais, os elétrons se deslocam, em média, do polo negativo para o polo positivo.",
          "Sentido convencional da corrente: sentido em que cargas positivas se moveriam.",
          "Campo elétrico: aponta no sentido da força elétrica sobre uma carga positiva de prova.",
        ],
        structure: [
          "A convenção foi criada antes da identificação clara dos elétrons como portadores móveis nos metais.",
          "Como o elétron tem carga negativa, a força elétrica sobre ele tem sentido oposto ao campo elétrico.",
          "Mantemos o sentido convencional por tradição e consistência na análise dos circuitos.",
        ],
        steps: [
          {
            title: "Força elétrica",
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
          {
            title: "Carga positiva",
            formulas: [String.raw`q > 0 \Rightarrow \vec{F} \parallel \vec{E}`],
          },
          {
            title: "Elétron",
            formulas: [String.raw`q < 0 \Rightarrow \vec{F} \text{ tem sentido oposto a } \vec{E}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Movimento de deriva",
        type: "info",
        body: "A corrente elétrica em metais é o resultado do movimento médio organizado dos elétrons livres, sobreposto ao movimento térmico desordenado.",
      },
    ],
  },
  {
    id: 3,
    icon: Gauge,
    title: "3. Definição formal de corrente elétrica",
    accent: "from-slate-950 to-indigo-800",
    paragraphs: [
      "A definição formal transforma a ideia de fluxo de carga em uma grandeza mensurável. Em vez de dizer apenas que cargas passam por um fio, perguntamos quanta carga atravessa uma seção do condutor em certo intervalo de tempo.",
      "Imagine uma seção transversal do fio como uma porta invisível. As cargas passam por ela. Se muita carga passa em pouco tempo, a corrente é grande. Se pouca carga passa no mesmo tempo, a corrente é pequena.",
      "Essa seção não armazena carga. Ela é apenas o local de contagem. Parece óbvio, mas em circuito o óbvio costuma ser a primeira vítima.",
    ],
    panels: [
      {
        title: "Corrente elétrica média",
        formula: String.raw`i = \frac{\Delta Q}{\Delta t}`,
        terms: [
          "i: corrente elétrica média, medida em ampère.",
          "ΔQ: quantidade de carga elétrica que atravessa a seção do condutor.",
          "Δt: intervalo de tempo observado.",
        ],
        structure: [
          "A corrente compara carga transportada com tempo gasto.",
          "Se a mesma carga passa em menos tempo, a corrente aumenta.",
          "Se menos carga passa no mesmo tempo, a corrente diminui.",
        ],
        steps: [
          {
            title: "Escolha da seção",
            body: ["Escolhe-se uma seção transversal do condutor para contar a carga que passa por ela."],
          },
          {
            title: "Carga transportada",
            body: ["A carga total que atravessa essa seção durante o intervalo analisado é ΔQ."],
          },
          {
            title: "Taxa de passagem",
            formulas: [String.raw`i = \frac{\Delta Q}{\Delta t}`],
          },
          {
            title: "Unidade",
            formulas: [String.raw`1 \ \text{A} = 1 \ \text{C/s}`],
          },
        ],
      },
      {
        title: "Corrente elétrica instantânea",
        formula: String.raw`i = \frac{dQ}{dt}`,
        terms: [
          "i: corrente elétrica no instante considerado.",
          "dQ: variação infinitesimal de carga.",
          "dt: intervalo infinitesimal de tempo.",
        ],
        structure: [
          "É a versão instantânea da corrente média.",
          "Aparece quando a carga é dada como função do tempo.",
          "Matematicamente, corrente é derivada da carga em relação ao tempo.",
        ],
        steps: [
          {
            title: "Da média ao instante",
            formulas: [
              String.raw`i_m = \frac{\Delta Q}{\Delta t}`,
              String.raw`i = \lim_{\Delta t \to 0}\frac{\Delta Q}{\Delta t} = \frac{dQ}{dt}`,
            ],
          },
        ],
      },
      {
        title: "Corrente e número de elétrons",
        formula: String.raw`Q = ne`,
        terms: [
          "Q: carga total transportada, em módulo.",
          "n: número de elétrons transportados.",
          "e: carga elementar, cujo módulo vale 1,6 × 10⁻¹⁹ C.",
        ],
        structure: [
          "Cada elétron carrega uma quantidade fixa de carga em módulo.",
          "A carga total é o número de elétrons multiplicado pela carga elementar.",
          "Depois de encontrar Q, relacionamos essa carga com o tempo pela definição de corrente.",
        ],
        steps: [
          {
            title: "Carga elementar",
            formulas: [String.raw`|q_e| = e = 1{,}6 \times 10^{-19} \ \text{C}`],
          },
          {
            title: "Muitos elétrons",
            formulas: [String.raw`Q = ne`],
          },
          {
            title: "Corrente associada",
            formulas: [String.raw`i = \frac{ne}{\Delta t}`],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    icon: Layers,
    title: "4. Condições para existir corrente elétrica",
    accent: "from-indigo-700 to-blue-700",
    paragraphs: [
      "Para existir corrente elétrica, não basta haver carga elétrica. Todo material comum possui prótons e elétrons. O que importa é haver portadores móveis e uma causa que organize o movimento desses portadores.",
      "A fonte não despeja elétrons no fio como água em uma mangueira. A fonte mantém diferença de potencial. Essa diferença gera campo elétrico. O campo exerce força sobre os portadores livres. O movimento organizado resultante é a corrente.",
      "Em circuito aberto, o caminho é interrompido e a corrente estacionária não se mantém. Em circuito fechado, há caminho condutor contínuo. Em curto-circuito, há um caminho de resistência muito baixa, o que pode gerar corrente perigosa.",
    ],
    numbered: [
      "Portadores de carga livres.",
      "Diferença de potencial.",
      "Campo elétrico no condutor.",
      "Caminho condutor fechado.",
      "Fonte capaz de manter a diferença de potencial.",
    ],
    panels: [
      {
        title: "Cadeia física da corrente elétrica",
        formula: String.raw`\Delta V \Rightarrow \vec{E} \Rightarrow \vec{F} = q\vec{E} \Rightarrow \text{movimento ordenado} \Rightarrow i`,
        terms: [
          "ΔV: diferença de potencial mantida pela fonte.",
          "E: campo elétrico estabelecido no condutor.",
          "F = qE: força elétrica sobre os portadores livres.",
          "i: corrente elétrica resultante do movimento médio ordenado.",
        ],
        structure: [
          "A diferença de potencial é a causa energética.",
          "O campo elétrico atua localmente sobre as cargas.",
          "A corrente é a resposta coletiva dos portadores livres ao campo.",
        ],
        steps: [
          {
            title: "Fonte",
            body: ["A fonte mantém seus terminais em potenciais diferentes."],
          },
          {
            title: "Campo elétrico",
            body: ["No circuito fechado, a diferença de potencial estabelece campo elétrico ao longo dos condutores."],
          },
          {
            title: "Força sobre as cargas",
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    icon: Flame,
    title: "5. Tensão elétrica, diferença de potencial e energia",
    accent: "from-blue-700 to-cyan-700",
    paragraphs: [
      "Tensão elétrica, ou diferença de potencial, mede energia por unidade de carga. Ela não é corrente, não é quantidade de eletricidade e não é uma substância misteriosa andando pelo fio.",
      "Uma bateria de 12 V fornece, idealmente, 12 J de energia para cada coulomb de carga que passa por ela. Essa interpretação é poderosa: tensão é energia por carga.",
      "Em um resistor, a carga atravessa uma queda de potencial. Ela perde energia elétrica, e essa energia vira calor. Em um motor, parte da energia elétrica vira movimento. Em uma bateria sendo carregada, parte vira energia química.",
    ],
    panels: [
      {
        title: "Tensão como energia por carga",
        formula: String.raw`U = \frac{W}{q}`,
        terms: [
          "U: tensão elétrica ou diferença de potencial, medida em volt.",
          "W: trabalho realizado ou energia transferida, medida em joule.",
          "q: carga elétrica que atravessa o trecho, medida em coulomb.",
        ],
        structure: [
          "A tensão responde: quanta energia existe para cada coulomb?",
          "Volt é joule por coulomb.",
          "Se a tensão dobra, cada coulomb recebe ou perde o dobro de energia.",
        ],
        steps: [
          {
            title: "Energia por carga",
            formulas: [String.raw`U = \frac{W}{q}`],
          },
          {
            title: "Energia transferida",
            formulas: [String.raw`W = qU`],
          },
          {
            title: "Unidade",
            formulas: [String.raw`1 \ \text{V} = 1 \ \text{J/C}`],
          },
        ],
      },
      {
        title: "Diferença de potencial entre dois pontos",
        formula: String.raw`U_{AB} = V_A - V_B`,
        terms: [
          "U_AB: diferença de potencial entre A e B.",
          "V_A: potencial elétrico no ponto A.",
          "V_B: potencial elétrico no ponto B.",
        ],
        structure: [
          "Tensão sempre é diferença entre dois pontos.",
          "Não faz sentido falar em tensão de um ponto isolado sem referência.",
          "Se dois pontos têm mesmo potencial, a tensão entre eles é zero.",
        ],
        steps: [
          {
            title: "Potenciais diferentes",
            formulas: [String.raw`U_{AB} = V_A - V_B`],
          },
          {
            title: "Pontos equipotenciais",
            formulas: [String.raw`V_A = V_B \Rightarrow U_{AB} = 0`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Não confunda",
        type: "warning",
        body: "Tensão alta não significa automaticamente corrente alta. A corrente também depende da resistência ou impedância do caminho.",
      },
    ],
  },
  {
    id: 6,
    icon: ShieldCheck,
    title: "6. Resistência elétrica",
    accent: "from-cyan-700 to-teal-700",
    paragraphs: [
      "Resistência elétrica é a oposição que um elemento oferece à passagem da corrente. Microscopicamente, em metais, os elétrons livres são acelerados pelo campo elétrico, mas interagem com a rede cristalina do material.",
      "Essas interações transferem energia para o material, aumentando sua agitação microscópica. Macroscopicamente, isso aparece como aquecimento. Por isso resistência elétrica e efeito Joule estão profundamente ligados.",
      "Para a mesma tensão, uma resistência maior produz uma corrente menor. Para a mesma corrente, uma resistência maior exige uma queda de tensão maior.",
    ],
    panels: [
      {
        title: "Definição de resistência elétrica",
        formula: String.raw`R = \frac{U}{i}`,
        terms: [
          "R: resistência elétrica, medida em ohm.",
          "U: tensão aplicada entre os terminais.",
          "i: corrente que atravessa o elemento.",
        ],
        structure: [
          "Resistência mede quanta tensão é necessária para sustentar certa corrente.",
          "Para tensão fixa, maior resistência implica menor corrente.",
          "Para corrente fixa, maior resistência implica maior queda de tensão.",
        ],
        steps: [
          {
            title: "Definição",
            formulas: [String.raw`R = \frac{U}{i}`],
          },
          {
            title: "Unidade",
            formulas: [String.raw`1 \ \Omega = 1 \ \frac{\text{V}}{\text{A}}`],
          },
        ],
      },
    ],
  },
  {
    id: 7,
    icon: Calculator,
    title: "7. Primeira Lei de Ohm",
    accent: "from-teal-700 to-emerald-700",
    paragraphs: [
      "A Primeira Lei de Ohm descreve o comportamento de resistores ôhmicos. Em um resistor ôhmico, mantendo temperatura e condições físicas constantes, a tensão aplicada é proporcional à corrente.",
      "Se dobramos a tensão, a corrente dobra. Se triplicamos a tensão, a corrente triplica. A razão U/i permanece constante, e essa constante é a resistência elétrica.",
      "Nem todo componente é ôhmico. Diodos, lâmpadas incandescentes e termistores podem apresentar resistência variável. Nesses casos, usar U = Ri de forma ingênua é pedir para errar com convicção.",
    ],
    panels: [
      {
        title: "Primeira Lei de Ohm",
        formula: String.raw`U = Ri`,
        terms: [
          "U: tensão ou queda de potencial.",
          "R: resistência elétrica.",
          "i: corrente elétrica.",
        ],
        structure: [
          "A equação é linear porque R permanece constante.",
          "Tensão e corrente são diretamente proporcionais.",
          "No gráfico U × i, a inclinação da reta é a resistência.",
        ],
        steps: [
          {
            title: "Definição de resistência",
            formulas: [String.raw`R = \frac{U}{i}`],
          },
          {
            title: "Isolando a tensão",
            formulas: [String.raw`U = Ri`],
          },
          {
            title: "Inclinação do gráfico",
            formulas: [String.raw`R = \frac{\Delta U}{\Delta i}`],
          },
        ],
      },
    ],
  },
  {
    id: 8,
    icon: Compass,
    title: "8. Segunda Lei de Ohm",
    accent: "from-emerald-700 to-lime-700",
    paragraphs: [
      "A Segunda Lei de Ohm explica de onde vem o valor da resistência de um condutor. Ela depende do material e da geometria.",
      "Um fio mais comprido tem maior resistência porque os portadores percorrem um caminho maior. Um fio mais grosso tem menor resistência porque oferece mais caminhos microscópicos para a passagem da corrente.",
      "O material entra pela resistividade. Bons condutores têm baixa resistividade. Isolantes têm resistividade alta. Semicondutores têm comportamento intermediário e controlável.",
    ],
    panels: [
      {
        title: "Segunda Lei de Ohm",
        formula: String.raw`R = \rho\frac{L}{A}`,
        terms: [
          "R: resistência elétrica.",
          "ρ: resistividade do material.",
          "L: comprimento do condutor.",
          "A: área da seção transversal.",
        ],
        structure: [
          "Resistência é diretamente proporcional ao comprimento.",
          "Resistência é inversamente proporcional à área.",
          "Resistividade representa a influência do material.",
        ],
        steps: [
          {
            title: "Comprimento",
            formulas: [String.raw`R \propto L`],
          },
          {
            title: "Área",
            formulas: [String.raw`R \propto \frac{1}{A}`],
          },
          {
            title: "Material",
            formulas: [String.raw`R = \rho\frac{L}{A}`],
          },
          {
            title: "Unidade da resistividade",
            formulas: [
              String.raw`\rho = R\frac{A}{L}`,
              String.raw`[\rho] = \Omega\cdot\text{m}`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: 9,
    icon: BarChart3,
    title: "9. Resistividade e temperatura",
    accent: "from-lime-700 to-amber-700",
    paragraphs: [
      "A resistência elétrica pode variar com a temperatura. Em metais, quando a temperatura aumenta, a rede cristalina vibra mais intensamente, dificultando o movimento ordenado dos elétrons livres.",
      "Para intervalos moderados de temperatura, usamos uma aproximação linear. Em metais, normalmente o coeficiente de temperatura é positivo. Em semicondutores, a resistência pode diminuir com o aumento da temperatura, porque mais portadores podem ser liberados.",
    ],
    panels: [
      {
        title: "Variação da resistência com a temperatura",
        formula: String.raw`R = R_0(1 + \alpha\Delta T)`,
        terms: [
          "R: resistência final.",
          "R₀: resistência inicial.",
          "α: coeficiente de temperatura.",
          "ΔT: variação de temperatura.",
        ],
        structure: [
          "A fórmula é uma aproximação linear.",
          "A variação relativa da resistência é proporcional à variação de temperatura.",
          "O sinal de α indica se a resistência aumenta ou diminui com a temperatura.",
        ],
        steps: [
          {
            title: "Variação relativa",
            formulas: [String.raw`\frac{R - R_0}{R_0} = \alpha\Delta T`],
          },
          {
            title: "Forma usual",
            formulas: [String.raw`R = R_0(1 + \alpha\Delta T)`],
          },
        ],
      },
    ],
  },
  {
    id: 10,
    icon: Layers,
    title: "10. Associação de resistores em série",
    accent: "from-amber-700 to-orange-700",
    paragraphs: [
      "Resistores estão em série quando são atravessados pela mesma corrente elétrica. Isso acontece quando as cargas não têm escolha de caminho: passam por um resistor e depois pelo outro.",
      "Em série, a corrente é a mesma em todos os resistores. O que se divide é a tensão. Cada resistor produz uma queda de tensão proporcional à sua resistência.",
    ],
    diagram: {
      kind: "series",
      title: "Diagrama visual: resistores em série",
      caption:
        "Os resistores estão no mesmo caminho. A corrente que passa por R₁ também passa por R₂ e R₃.",
    },
    panels: [
      {
        title: "Resistência equivalente em série",
        formula: String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`,
        terms: [
          "R_eq: resistência equivalente.",
          "R₁, R₂, R₃: resistores ligados em sequência.",
          "i: corrente comum em todos os resistores.",
        ],
        structure: [
          "A corrente não se divide.",
          "A tensão total é a soma das quedas de tensão.",
          "Resistências em sequência se somam.",
        ],
        steps: [
          {
            title: "Mesma corrente",
            formulas: [String.raw`i_1 = i_2 = i_3 = \cdots = i`],
          },
          {
            title: "Soma das tensões",
            formulas: [String.raw`U = U_1 + U_2 + U_3 + \cdots`],
          },
          {
            title: "Aplicando U = Ri",
            formulas: [
              String.raw`U = R_1i + R_2i + R_3i + \cdots`,
              String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Divisor de tensão",
        type: "info",
        body: "Em série, o resistor maior recebe maior parcela da tensão total, pois todos são atravessados pela mesma corrente.",
      },
    ],
  },
  {
    id: 11,
    icon: Layers,
    title: "11. Associação de resistores em paralelo",
    accent: "from-orange-700 to-red-700",
    paragraphs: [
      "Resistores estão em paralelo quando seus terminais estão ligados aos mesmos dois nós. Essa é a definição importante. Não interessa se o desenho parece paralelo, inclinado ou desenhado por alguém em surto: mesmos dois nós significam paralelo.",
      "Em paralelo, todos os resistores estão submetidos à mesma tensão. A corrente total se divide entre os ramos. O ramo de menor resistência recebe maior corrente.",
      "A resistência equivalente em paralelo é menor que a menor resistência individual, porque cada novo ramo cria mais um caminho para a corrente.",
    ],
    diagram: {
      kind: "parallel",
      title: "Diagrama visual: resistores em paralelo",
      caption:
        "R₁, R₂ e R₃ estão ligados entre os mesmos nós A e B. Por isso, todos recebem a mesma tensão.",
    },
    panels: [
      {
        title: "Resistência equivalente em paralelo",
        formula: String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`,
        terms: [
          "R_eq: resistência equivalente.",
          "R₁, R₂, R₃: resistores entre os mesmos dois nós.",
          "U: tensão comum a todos os ramos.",
        ],
        structure: [
          "A tensão é a mesma em todos os resistores.",
          "A corrente total é a soma das correntes dos ramos.",
          "Cada ramo conduz uma corrente U/R.",
        ],
        steps: [
          {
            title: "Mesma tensão",
            formulas: [String.raw`U_1 = U_2 = U_3 = \cdots = U`],
          },
          {
            title: "Soma das correntes",
            formulas: [String.raw`i = i_1 + i_2 + i_3 + \cdots`],
          },
          {
            title: "Lei de Ohm em cada ramo",
            formulas: [
              String.raw`i = \frac{U}{R_1} + \frac{U}{R_2} + \frac{U}{R_3} + \cdots`,
              String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Casos úteis",
        type: "success",
        body: "Para dois resistores em paralelo, use R_eq = R1R2/(R1 + R2). Para n resistores iguais em paralelo, use R_eq = R/n.",
      },
    ],
  },
  {
    id: 12,
    icon: Brain,
    title: "12. Associação mista e leitura de nós",
    accent: "from-red-700 to-rose-700",
    paragraphs: [
      "Associação mista combina resistores em série e em paralelo. O erro comum é resolver pela aparência do desenho. Em circuitos, aparência é fofoca. O que manda são as conexões.",
      "Um nó é uma região condutora equipotencial quando os fios são ideais. Todos os pontos ligados diretamente por fio ideal pertencem ao mesmo nó.",
      "Dois resistores estão em paralelo se estão ligados aos mesmos dois nós. Dois resistores estão em série se são atravessados pela mesma corrente e não há ramificação entre eles.",
    ],
    diagram: {
      kind: "mixed",
      title: "Diagrama visual: associação mista",
      caption:
        "R₂ e R₃ estão em paralelo entre os nós A e B. Esse conjunto está em série com R₁.",
    },
    numbered: [
      "Identifique os nós do circuito.",
      "Marque pontos ligados por fios ideais como o mesmo nó.",
      "Procure resistores ligados aos mesmos dois nós.",
      "Procure resistores em sequência sem ramificação intermediária.",
      "Substitua cada grupo por sua resistência equivalente.",
      "Redesenhe o circuito simplificado.",
      "Repita até chegar à resistência equivalente total.",
    ],
    panels: [
      {
        title: "Critério físico de série e paralelo",
        formula: String.raw`\text{mesmos dois nós} \Rightarrow \text{paralelo}`,
        terms: [
          "Nó: região condutora equipotencial em fio ideal.",
          "Série: mesma corrente e ausência de ramificação intermediária.",
          "Paralelo: mesmos dois nós e mesma tensão.",
        ],
        structure: [
          "O desenho não manda; as conexões mandam.",
          "Fios ideais unem pontos em um mesmo nó.",
          "Dois componentes desenhados longe podem estar em paralelo.",
        ],
        steps: [
          {
            title: "Identifique fios ideais",
            body: ["Pontos ligados diretamente por fios ideais pertencem ao mesmo nó."],
          },
          {
            title: "Procure paralelos",
            body: ["Se dois resistores ligam o mesmo par de nós, estão em paralelo."],
          },
          {
            title: "Procure séries",
            body: ["Se dois resistores estão em sequência sem ramificação entre eles, estão em série."],
          },
        ],
      },
    ],
  },
  {
    id: 13,
    icon: Flame,
    title: "13. Potência elétrica",
    accent: "from-rose-700 to-pink-700",
    paragraphs: [
      "Potência mede a rapidez com que energia é transferida ou transformada. Em circuitos, ela indica a taxa com que energia elétrica é fornecida, consumida ou dissipada.",
      "A fórmula P = Ui vem de uma ideia simples: tensão é energia por carga, corrente é carga por tempo. Multiplicando as duas, a carga cancela e sobra energia por tempo.",
      "Essa interpretação é melhor do que decorar fórmula. Ela mostra por que potência elétrica mede taxa de transformação de energia.",
    ],
    panels: [
      {
        title: "Potência elétrica",
        formula: String.raw`P = Ui`,
        terms: [
          "P: potência elétrica, medida em watt.",
          "U: tensão elétrica, energia por carga.",
          "i: corrente elétrica, carga por tempo.",
        ],
        structure: [
          "Tensão é energia por unidade de carga.",
          "Corrente é carga por unidade de tempo.",
          "Multiplicando, obtemos energia por unidade de tempo.",
        ],
        steps: [
          {
            title: "Definição de potência",
            formulas: [String.raw`P = \frac{\Delta E}{\Delta t}`],
          },
          {
            title: "Energia elétrica",
            formulas: [String.raw`E = qU`],
          },
          {
            title: "Substituindo",
            formulas: [String.raw`P = \frac{qU}{\Delta t}`],
          },
          {
            title: "Reconhecendo corrente",
            formulas: [String.raw`i = \frac{q}{\Delta t}`, String.raw`P = Ui`],
          },
        ],
      },
      {
        title: "Potência em resistor",
        formula: String.raw`P = Ri^2 = \frac{U^2}{R}`,
        terms: [
          "P = Ui: forma geral.",
          "P = Ri²: útil quando a corrente é conhecida ou comum.",
          "P = U²/R: útil quando a tensão é conhecida ou comum.",
        ],
        structure: [
          "As duas formas vêm da Lei de Ohm.",
          "Em série, a corrente é comum.",
          "Em paralelo, a tensão é comum.",
        ],
        steps: [
          {
            title: "Dedução de P = Ri²",
            formulas: [String.raw`P = Ui = (Ri)i = Ri^2`],
          },
          {
            title: "Dedução de P = U²/R",
            formulas: [String.raw`P = Ui = U\left(\frac{U}{R}\right) = \frac{U^2}{R}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Se a corrente é a mesma, potência cresce com R. Se a tensão é a mesma, potência diminui com R. Primeiro veja qual grandeza está fixa.",
      },
    ],
  },
  {
    id: 14,
    icon: Flame,
    title: "14. Efeito Joule",
    accent: "from-pink-700 to-fuchsia-700",
    paragraphs: [
      "Efeito Joule é a transformação de energia elétrica em energia térmica devido à passagem de corrente por um resistor ou condutor real.",
      "Microscopicamente, os portadores de carga recebem energia do campo elétrico e transferem parte dessa energia para a rede do material. Isso aumenta a agitação microscópica do material, ou seja, sua temperatura.",
      "É por isso que chuveiros, ferros, secadores, aquecedores e fusíveis aquecem quando atravessados por corrente elétrica.",
    ],
    panels: [
      {
        title: "Energia dissipada por efeito Joule",
        formula: String.raw`E = Ri^2\Delta t`,
        terms: [
          "E: energia dissipada como calor.",
          "R: resistência elétrica.",
          "i: corrente elétrica.",
          "Δt: intervalo de tempo.",
        ],
        structure: [
          "A energia cresce com a resistência.",
          "A energia cresce com o quadrado da corrente.",
          "A energia cresce com o tempo de funcionamento.",
        ],
        steps: [
          {
            title: "Potência dissipada",
            formulas: [String.raw`P = Ri^2`],
          },
          {
            title: "Energia",
            formulas: [String.raw`E = P\Delta t`, String.raw`E = Ri^2\Delta t`],
          },
          {
            title: "Corrente dobrada",
            formulas: [String.raw`P' = R(2i)^2 = 4Ri^2 = 4P`],
          },
        ],
      },
    ],
    bullets: [
      "chuveiro elétrico;",
      "ferro de passar;",
      "secador de cabelo;",
      "aquecedores elétricos;",
      "torradeiras;",
      "lâmpadas incandescentes;",
      "fusíveis.",
    ],
    notes: [
      {
        title: "Perigo físico",
        type: "danger",
        body: "Corrente alta é perigosa porque o aquecimento cresce com i². Um pequeno aumento de corrente pode gerar grande aumento de potência dissipada.",
      },
    ],
  },
  {
    id: 15,
    icon: Zap,
    title: "15. Geradores elétricos",
    accent: "from-fuchsia-700 to-violet-700",
    paragraphs: [
      "Gerador elétrico transforma alguma forma de energia em energia elétrica. Uma pilha transforma energia química em elétrica. Um alternador transforma energia mecânica em elétrica.",
      "A grandeza central do gerador é a força eletromotriz ε. Apesar do nome, força eletromotriz não é força. É energia fornecida por unidade de carga.",
      "Em um gerador ideal, toda a energia por carga aparece como tensão nos terminais. Em um gerador real, parte da energia se perde na resistência interna.",
    ],
    diagram: {
      kind: "generator",
      title: "Diagrama visual: gerador real",
      caption:
        "O gerador possui força eletromotriz ε e resistência interna r. A tensão útil nos terminais é menor que ε.",
    },
    panels: [
      {
        title: "Força eletromotriz",
        formula: String.raw`\varepsilon = \frac{W}{q}`,
        terms: [
          "ε: força eletromotriz, medida em volt.",
          "W: energia fornecida pelo gerador.",
          "q: carga que atravessa o gerador.",
        ],
        structure: [
          "Mede energia fornecida por carga.",
          "Tem unidade de volt.",
          "Em gerador ideal, U = ε.",
        ],
        steps: [
          {
            title: "Gerador ideal",
            formulas: [String.raw`U = \varepsilon`],
          },
        ],
      },
      {
        title: "Gerador real",
        formula: String.raw`U = \varepsilon - ri`,
        terms: [
          "U: tensão nos terminais.",
          "ε: força eletromotriz.",
          "r: resistência interna.",
          "i: corrente fornecida.",
        ],
        structure: [
          "Parte da energia por carga é perdida dentro do gerador.",
          "A queda interna vale ri.",
          "Quanto maior a corrente, menor a tensão útil.",
        ],
        steps: [
          {
            title: "Queda interna",
            formulas: [String.raw`U_{\text{interna}} = ri`],
          },
          {
            title: "Tensão útil",
            formulas: [String.raw`U = \varepsilon - ri`],
          },
          {
            title: "Potências",
            formulas: [
              String.raw`Ui = \varepsilon i - ri^2`,
              String.raw`P_{\text{útil}} = P_{\text{total}} - P_{\text{dissipada}}`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: 16,
    icon: Gauge,
    title: "16. Receptores elétricos",
    accent: "from-violet-700 to-indigo-800",
    paragraphs: [
      "Receptor elétrico recebe energia elétrica e transforma parte dela em outra forma útil, como energia mecânica em um motor ou energia química em uma bateria sendo carregada.",
      "Em um receptor real, a tensão aplicada precisa alimentar a conversão útil e compensar as perdas internas. Por isso a equação tem soma.",
      "A força contraeletromotriz ε′ representa a energia útil por unidade de carga convertida pelo receptor. O termo r′i representa a queda interna.",
    ],
    diagram: {
      kind: "receiver",
      title: "Diagrama visual: receptor real",
      caption:
        "O receptor usa parte da energia de cada carga para conversão útil e parte é perdida na resistência interna.",
    },
    panels: [
      {
        title: "Receptor real",
        formula: String.raw`U = \varepsilon' + r'i`,
        terms: [
          "U: tensão aplicada ao receptor.",
          "ε′: força contraeletromotriz.",
          "r′: resistência interna.",
          "i: corrente no receptor.",
        ],
        structure: [
          "A tensão aplicada alimenta a conversão útil.",
          "Também precisa vencer a queda interna.",
          "Por isso o termo r′i aparece somando.",
        ],
        steps: [
          {
            title: "Conversão útil",
            body: ["A força contraeletromotriz mede a energia útil convertida por unidade de carga."],
          },
          {
            title: "Queda interna",
            formulas: [String.raw`U_{\text{interna}} = r'i`],
          },
          {
            title: "Tensão total",
            formulas: [String.raw`U = \varepsilon' + r'i`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Comparação essencial",
        type: "info",
        body: "Gerador real: U = ε - ri. Receptor real: U = ε′ + r′i. No gerador a perda interna reduz a tensão útil. No receptor a fonte precisa fornecer tensão para a conversão útil e para a perda interna.",
      },
    ],
  },
  {
    id: 17,
    icon: Calculator,
    title: "17. Instrumentos de medida",
    accent: "from-indigo-800 to-slate-950",
    paragraphs: [
      "Instrumentos de medida precisam ser ligados de acordo com a grandeza que medem. Um erro de ligação altera o circuito e pode danificar o instrumento.",
      "O amperímetro mede corrente. Para medir a corrente de um ramo, ele deve ser atravessado por essa mesma corrente. Por isso fica em série.",
      "O voltímetro mede diferença de potencial entre dois pontos. Por isso deve ser ligado em paralelo com o elemento cuja tensão queremos medir.",
    ],
    diagram: {
      kind: "meters",
      title: "Diagrama visual: amperímetro e voltímetro",
      caption:
        "O amperímetro fica em série com o resistor. O voltímetro fica em paralelo com seus terminais.",
    },
    panels: [
      {
        title: "Instrumentos ideais",
        formula: String.raw`R_A = 0 \qquad \text{e} \qquad R_V \to \infty`,
        terms: [
          "R_A: resistência interna do amperímetro.",
          "R_V: resistência interna do voltímetro.",
          "Amperímetro: mede corrente e fica em série.",
          "Voltímetro: mede tensão e fica em paralelo.",
        ],
        structure: [
          "O amperímetro ideal não deve alterar a corrente medida.",
          "O voltímetro ideal não deve desviar corrente significativa.",
          "Por isso um tem resistência ideal nula e o outro resistência ideal infinita.",
        ],
        steps: [
          {
            title: "Amperímetro ideal",
            formulas: [String.raw`R_A = 0`],
          },
          {
            title: "Voltímetro ideal",
            formulas: [String.raw`R_V \to \infty`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Erro perigoso",
        type: "danger",
        body: "Amperímetro em paralelo pode causar curto-circuito. Voltímetro em série pode quase interromper o circuito.",
      },
    ],
  },
  {
    id: 18,
    icon: Brain,
    title: "18. Leis de Kirchhoff",
    accent: "from-slate-950 to-indigo-900",
    paragraphs: [
      "As Leis de Kirchhoff são usadas quando o circuito não pode ser resolvido apenas por série e paralelo. Elas permitem analisar circuitos com vários ramos, fontes e malhas.",
      "A Lei dos Nós vem da conservação da carga. A Lei das Malhas vem da conservação da energia. Kirchhoff não é ritual místico com sinais; é conservação aplicada a circuitos.",
      "O método seguro é escolher sentidos para correntes, escrever equações, resolver o sistema e interpretar sinais negativos. Corrente negativa significa que o sentido real é oposto ao escolhido.",
    ],
    numbered: [
      "Escolha sentidos arbitrários para as correntes.",
      "Aplique a Lei dos Nós onde houver ramificações.",
      "Escolha malhas independentes.",
      "Percorra cada malha em um sentido escolhido.",
      "Atribua sinais corretamente para resistores e fontes.",
      "Resolva o sistema.",
      "Interprete correntes negativas.",
    ],
    panels: [
      {
        title: "Lei dos Nós",
        formula: String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`,
        terms: [
          "i_entrando: correntes que chegam ao nó.",
          "i_saindo: correntes que saem do nó.",
          "Nó: região onde ramos se encontram.",
        ],
        structure: [
          "Expressa conservação da carga.",
          "Carga não se acumula indefinidamente no nó.",
          "Tudo que entra deve sair.",
        ],
        steps: [
          {
            title: "Balanço de correntes",
            formulas: [String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`],
          },
        ],
      },
      {
        title: "Lei das Malhas",
        formula: String.raw`\sum U = 0`,
        terms: [
          "ΣU: soma algébrica das variações de potencial.",
          "Malha: caminho fechado no circuito.",
          "Variação de potencial: subida ou queda de tensão.",
        ],
        structure: [
          "Expressa conservação da energia.",
          "Ao dar uma volta completa, voltamos ao mesmo potencial.",
          "Subidas e quedas de potencial se compensam.",
        ],
        steps: [
          {
            title: "Soma das variações",
            formulas: [String.raw`\sum U = 0`],
          },
          {
            title: "Resistores",
            formulas: [
              String.raw`\text{sentido da corrente} \Rightarrow -Ri`,
              String.raw`\text{contra a corrente} \Rightarrow +Ri`,
            ],
          },
          {
            title: "Geradores",
            formulas: [
              String.raw`- \to + \Rightarrow +\varepsilon`,
              String.raw`+ \to - \Rightarrow -\varepsilon`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: 19,
    icon: Compass,
    title: "19. Ponte de Wheatstone",
    accent: "from-indigo-900 to-purple-900",
    paragraphs: [
      "A Ponte de Wheatstone é usada para comparar resistências e medir resistência desconhecida. Ela mistura divisor de tensão, equilíbrio de potenciais e análise de circuito.",
      "A ponte está equilibrada quando não passa corrente pelo galvanômetro. Isso ocorre quando os pontos intermediários ligados pelo galvanômetro têm o mesmo potencial.",
      "A fórmula da ponte não é decoreba caída do céu. Ela vem da igualdade de potenciais nos pontos médios dos dois ramos.",
    ],
    diagram: {
      kind: "wheatstone",
      title: "Diagrama visual: Ponte de Wheatstone",
      caption:
        "No equilíbrio, não passa corrente pelo galvanômetro G. Os pontos intermediários ficam equipotenciais.",
    },
    panels: [
      {
        title: "Condição de equilíbrio da ponte",
        formula: String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`,
        terms: [
          "R₁, R₂, R₃ e R₄: resistores da ponte.",
          "i_G: corrente no galvanômetro.",
          "Equilíbrio: situação em que i_G = 0.",
        ],
        structure: [
          "Os pontos intermediários têm o mesmo potencial.",
          "Sem diferença de potencial, não há corrente no galvanômetro.",
          "A igualdade de razões vem dos divisores de tensão.",
        ],
        steps: [
          {
            title: "Corrente nula",
            formulas: [String.raw`i_G = 0`],
          },
          {
            title: "Equipotenciais",
            formulas: [String.raw`V_A = V_B`],
          },
          {
            title: "Condição final",
            formulas: [String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`],
          },
        ],
      },
    ],
  },
  {
    id: 20,
    icon: AlertTriangle,
    title: "20. Curto-circuito, fusíveis e disjuntores",
    accent: "from-red-700 to-slate-950",
    paragraphs: [
      "Curto-circuito ocorre quando pontos com diferença de potencial são ligados por um caminho de resistência muito baixa. O perigo não está no caminho ser geometricamente curto, mas em ter resistência pequena demais.",
      "Pela Lei de Ohm, se a tensão é mantida e a resistência cai muito, a corrente cresce muito. Corrente alta pode aquecer fios, derreter isolantes, danificar aparelhos e causar incêndios.",
      "Pode parecer contraditório: se R é pequeno, por que esquenta tanto? Porque o efeito Joule depende de i². A corrente pode crescer tanto que o aquecimento fica perigoso mesmo em caminho de baixa resistência.",
    ],
    diagram: {
      kind: "shortCircuit",
      title: "Diagrama visual: curto-circuito",
      caption:
        "O caminho em vermelho tem resistência muito baixa e desvia a corrente do resistor.",
    },
    panels: [
      {
        title: "Por que curto-circuito é perigoso?",
        formula: String.raw`i = \frac{U}{R}`,
        terms: [
          "U: tensão mantida pela fonte.",
          "R: resistência muito baixa do caminho.",
          "i: corrente que pode crescer muito.",
        ],
        structure: [
          "Com tensão mantida, reduzir R aumenta i.",
          "O aquecimento depende fortemente da corrente.",
          "Fusíveis e disjuntores interrompem o circuito em situações perigosas.",
        ],
        steps: [
          {
            title: "Corrente",
            formulas: [String.raw`i = \frac{U}{R}`],
          },
          {
            title: "Resistência muito baixa",
            formulas: [String.raw`R \to 0 \Rightarrow i \text{ muito grande}`],
          },
          {
            title: "Aquecimento",
            formulas: [String.raw`P = Ri^2`],
          },
        ],
      },
    ],
    bullets: [
      "fusível: derrete e abre o circuito quando a corrente ultrapassa o limite;",
      "disjuntor: interrompe o circuito e pode ser rearmado;",
      "DR: ajuda na proteção contra choques por fuga de corrente;",
      "aterramento: fornece caminho seguro para correntes indesejadas.",
    ],
  },
  {
    id: 21,
    icon: Layers,
    title: "21. Capacitores em corrente contínua",
    accent: "from-slate-900 to-blue-900",
    paragraphs: [
      "Capacitores armazenam carga elétrica e energia em um campo elétrico entre suas placas. Em corrente contínua, o comportamento depende do instante analisado.",
      "No instante inicial, se o capacitor está descarregado, há corrente de carga. Durante o carregamento, a tensão no capacitor aumenta e a corrente diminui.",
      "Depois de muito tempo, em regime estacionário de corrente contínua, o capacitor ideal carregado se comporta como circuito aberto. Ele não permite passagem contínua de corrente pelo ramo.",
    ],
    diagram: {
      kind: "capacitor",
      title: "Diagrama visual: capacitor em corrente contínua",
      caption:
        "O capacitor acumula cargas opostas nas placas. Após muito tempo, comporta-se como circuito aberto ideal.",
    },
    panels: [
      {
        title: "Carga armazenada em capacitor",
        formula: String.raw`Q = CU`,
        terms: [
          "Q: carga armazenada.",
          "C: capacitância.",
          "U: tensão entre as placas.",
        ],
        structure: [
          "Maior tensão armazena mais carga para uma mesma capacitância.",
          "Maior capacitância armazena mais carga para uma mesma tensão.",
          "Em corrente contínua estacionária, capacitor carregado se comporta como circuito aberto.",
        ],
        steps: [
          {
            title: "Definição",
            formulas: [String.raw`C = \frac{Q}{U}`],
          },
          {
            title: "Isolando a carga",
            formulas: [String.raw`Q = CU`],
          },
          {
            title: "Regime estacionário",
            formulas: [String.raw`\text{capacitor carregado em CC} \Rightarrow \text{circuito aberto}`],
          },
        ],
      },
    ],
  },
  {
    id: 22,
    icon: BarChart3,
    title: "22. Gráficos importantes",
    accent: "from-blue-900 to-indigo-900",
    paragraphs: [
      "Gráficos em Eletrodinâmica carregam informação física. Em provas difíceis, o gráfico frequentemente substitui parte do enunciado.",
      "É preciso ler inclinação, intercepto, sinal da reta e significado físico de cada trecho. Gráfico U × i pode revelar resistência, força eletromotriz, resistência interna e comportamento ôhmico ou não ôhmico.",
    ],
    panels: [
      {
        title: "Gráfico U × i para resistor ôhmico",
        formula: String.raw`U = Ri`,
        terms: [
          "U: eixo vertical.",
          "i: eixo horizontal.",
          "R: inclinação da reta.",
        ],
        structure: [
          "A equação tem forma linear.",
          "A reta passa pela origem.",
          "Maior inclinação significa maior resistência.",
        ],
        steps: [
          {
            title: "Comparação com função linear",
            formulas: [String.raw`U = Ri`, String.raw`y = ax`],
          },
          {
            title: "Inclinação",
            formulas: [String.raw`R = \frac{\Delta U}{\Delta i}`],
          },
        ],
      },
      {
        title: "Gráfico U × i para gerador real",
        formula: String.raw`U = \varepsilon - ri`,
        terms: [
          "ε: intercepto vertical.",
          "-r: inclinação da reta.",
          "U: tensão terminal.",
        ],
        structure: [
          "A reta é decrescente.",
          "Quando i = 0, U = ε.",
          "A inclinação indica a resistência interna com sinal negativo.",
        ],
        steps: [
          {
            title: "Circuito aberto",
            formulas: [String.raw`i = 0 \Rightarrow U = \varepsilon`],
          },
          {
            title: "Inclinação",
            formulas: [String.raw`\frac{\Delta U}{\Delta i} = -r`],
          },
        ],
      },
      {
        title: "Gráfico U × i para receptor real",
        formula: String.raw`U = \varepsilon' + r'i`,
        terms: [
          "ε′: intercepto vertical.",
          "r′: inclinação da reta.",
          "U: tensão aplicada.",
        ],
        structure: [
          "A reta é crescente.",
          "O intercepto representa energia útil por carga.",
          "A inclinação representa resistência interna.",
        ],
        steps: [
          {
            title: "Intercepto",
            formulas: [String.raw`i = 0 \Rightarrow U = \varepsilon'`],
          },
          {
            title: "Inclinação",
            formulas: [String.raw`\frac{\Delta U}{\Delta i} = r'`],
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
      "Análise dimensional verifica se as unidades fazem sentido. Ela não resolve toda questão, mas evita erros grosseiros antes que eles virem vergonha formatada em LaTeX.",
      "Em Eletrodinâmica, ampère é coulomb por segundo, volt é joule por coulomb, watt é joule por segundo e ohm é volt por ampère.",
    ],
    panels: [
      {
        title: "Unidades fundamentais",
        formula: String.raw`\text{A}, \ \text{V}, \ \Omega, \ \text{W}, \ \text{J}`,
        terms: [
          "A: ampère, unidade de corrente.",
          "V: volt, unidade de tensão.",
          "Ω: ohm, unidade de resistência.",
          "W: watt, unidade de potência.",
          "J: joule, unidade de energia.",
        ],
        structure: [
          "As unidades revelam significado físico.",
          "Potência vem de tensão vezes corrente.",
          "Resistência vem de tensão dividida por corrente.",
        ],
        steps: [
          {
            title: "Corrente",
            formulas: [
              String.raw`i = \frac{\Delta Q}{\Delta t}`,
              String.raw`[i] = \frac{\text{C}}{\text{s}} = \text{A}`,
            ],
          },
          {
            title: "Potência",
            formulas: [
              String.raw`P = Ui`,
              String.raw`[P] = \frac{\text{J}}{\text{C}}\cdot\frac{\text{C}}{\text{s}} = \text{W}`,
            ],
          },
          {
            title: "Resistência",
            formulas: [
              String.raw`R = \frac{U}{i}`,
              String.raw`[R] = \frac{\text{V}}{\text{A}} = \Omega`,
            ],
          },
        ],
      },
    ],
  },
  {
    id: 24,
    icon: Lightbulb,
    title: "24. Aplicações práticas",
    accent: "from-amber-600 to-orange-700",
    paragraphs: [
      "O chuveiro elétrico usa efeito Joule. A corrente atravessa uma resistência e a energia elétrica é transformada em calor, aquecendo a água.",
      "Para tensão fixa, diminuir a resistência aumenta a potência, pois P = U²/R. Por isso, em muitos chuveiros, a posição de maior aquecimento corresponde a uma resistência menor.",
      "Instalações residenciais usam associação em paralelo. Isso permite que os aparelhos recebam a mesma tensão e funcionem de forma independente.",
      "Linhas de transmissão usam alta tensão para reduzir perdas. Para a mesma potência transmitida, aumentar U reduz i. Como as perdas dependem de i², reduzir corrente reduz muito a dissipação.",
    ],
    diagram: {
      kind: "transmission",
      title: "Diagrama visual: transmissão de energia elétrica",
      caption:
        "Transformadores elevam a tensão para transmitir energia com menor corrente e menores perdas por efeito Joule.",
    },
    panels: [
      {
        title: "Perdas em linhas de transmissão",
        formula: String.raw`P_{\text{perdida}} = Ri^2`,
        terms: [
          "P_perdida: potência dissipada nos fios.",
          "R: resistência dos fios.",
          "i: corrente na linha.",
        ],
        structure: [
          "As perdas crescem com o quadrado da corrente.",
          "Para mesma potência, aumentar tensão reduz corrente.",
          "Alta tensão reduz perdas na transmissão.",
        ],
        steps: [
          {
            title: "Potência transmitida",
            formulas: [String.raw`P = Ui`],
          },
          {
            title: "Corrente para potência fixa",
            formulas: [String.raw`i = \frac{P}{U}`],
          },
          {
            title: "Perdas",
            formulas: [String.raw`P_{\text{perdida}} = Ri^2`],
          },
        ],
      },
    ],
  },
  {
    id: 25,
    icon: AlertTriangle,
    title: "25. Armadilhas e erros comuns",
    accent: "from-red-700 to-red-950",
    paragraphs: [
      "Eletrodinâmica tem fórmulas simples, mas erros conceituais muito frequentes. A maioria dos problemas não vem da álgebra; vem de interpretar mal o circuito.",
    ],
    bullets: [
      "confundir tensão com corrente;",
      "achar que corrente é gasta no resistor;",
      "achar que a corrente diminui em resistores em série;",
      "inverter série e paralelo;",
      "usar P = U²/R sem perceber qual grandeza está fixa;",
      "esquecer resistência interna do gerador;",
      "errar sinal em Kirchhoff;",
      "ligar amperímetro em paralelo;",
      "ligar voltímetro em série;",
      "confundir kW com kWh;",
      "não perceber curto-circuito;",
      "não reconhecer pontos equipotenciais.",
    ],
    notes: [
      {
        title: "Resumo da confusão humana",
        type: "warning",
        body: "Corrente não é energia. Tensão não é corrente. Potência não é energia. Resistência não é resistividade. Série não é paralelo. A física é coerente; o aluno é que tenta resolver no modo superstição.",
      },
    ],
  },
  {
    id: 26,
    icon: Target,
    title: "26. Pontos importantes para ITA/IME",
    accent: "from-slate-950 to-purple-900",
    paragraphs: [
      "Em provas difíceis, Eletrodinâmica raramente aparece como aplicação direta de U = Ri. O conteúdo costuma vir misturado com simetria, energia, gráficos, geradores reais, instrumentos e circuitos não óbvios.",
      "O aluno forte não começa calculando. Ele começa interpretando a estrutura do circuito: nós, ramos, tensão comum, corrente comum, simetria, pontos equipotenciais e presença de resistência interna.",
    ],
    diagram: {
      kind: "nodes",
      title: "Diagrama visual: nós e paralelos escondidos",
      caption:
        "Mesmo que os resistores estejam desenhados de formas diferentes, se ligam os mesmos dois nós, estão em paralelo.",
    },
    bullets: [
      "circuitos com simetria e pontos equipotenciais;",
      "associações não evidentes de resistores;",
      "potência máxima transferida;",
      "resistência equivalente em redes;",
      "geradores e receptores reais;",
      "análise gráfica;",
      "Kirchhoff com sinais;",
      "ponte de Wheatstone;",
      "instrumentos ideais e reais;",
      "conservação de energia em circuitos;",
      "capacitores em regime estacionário de corrente contínua.",
    ],
    notes: [
      {
        title: "Roteiro mental de prova",
        type: "dark",
        body: "Antes de calcular, pergunte: quais elementos estão em série? Quais estão em paralelo? Há pontos equipotenciais? A corrente se divide? A tensão é comum? Há resistência interna? O instrumento altera o circuito?",
      },
    ],
  },
];

const examples: Example[] = [
  {
    id: "ex1",
    title: "Exemplo 1 — Corrente elétrica a partir da carga e do tempo",
    statement:
      "Uma carga de 24 C atravessa uma seção de um fio em 6 s. Determine a corrente média.",
    explanation: [
      "A corrente média mede a quantidade de carga que atravessa uma seção do condutor por unidade de tempo.",
    ],
    formulas: [
      String.raw`i = \frac{\Delta Q}{\Delta t}`,
      String.raw`i = \frac{24}{6}`,
      String.raw`i = 4 \ \text{A}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A corrente média é 4 A.",
      },
    ],
  },
  {
    id: "ex2",
    title: "Exemplo 2 — Número de elétrons",
    statement:
      "Uma corrente de 3,2 A atravessa um fio durante 5 s. Quantos elétrons atravessam uma seção nesse intervalo?",
    explanation: [
      "Primeiro calculamos a carga total transportada. Depois usamos a quantização da carga.",
    ],
    formulas: [
      String.raw`Q = i\Delta t`,
      String.raw`Q = 3{,}2\cdot 5 = 16 \ \text{C}`,
      String.raw`Q = ne`,
      String.raw`n = \frac{Q}{e} = \frac{16}{1{,}6 \times 10^{-19}}`,
      String.raw`n = 1{,}0 \times 10^{20}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "Atravessam a seção aproximadamente 1,0 × 10²⁰ elétrons.",
      },
    ],
  },
  {
    id: "ex3",
    title: "Exemplo 3 — Primeira Lei de Ohm",
    statement:
      "Um resistor de 8 Ω é submetido a uma tensão de 24 V. Determine a corrente.",
    explanation: ["Como o resistor é ôhmico, usamos U = Ri."],
    formulas: [
      String.raw`U = Ri`,
      String.raw`i = \frac{U}{R}`,
      String.raw`i = \frac{24}{8}`,
      String.raw`i = 3 \ \text{A}`,
    ],
  },
  {
    id: "ex4",
    title: "Exemplo 4 — Associação em paralelo",
    statement:
      "Dois resistores de 6 Ω e 3 Ω estão em paralelo ligados a uma fonte de 12 V.",
    explanation: [
      "Para dois resistores em paralelo, usamos produto dividido pela soma. Depois aplicamos a Lei de Ohm ao circuito equivalente.",
    ],
    formulas: [
      String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`,
      String.raw`R_{\text{eq}} = \frac{6\cdot 3}{6 + 3} = 2 \ \Omega`,
      String.raw`i = \frac{12}{2} = 6 \ \text{A}`,
    ],
  },
  {
    id: "ex5",
    title: "Exemplo 5 — Potência elétrica",
    statement:
      "Um aparelho ligado a 220 V é atravessado por corrente de 5 A. Determine a potência elétrica.",
    explanation: ["Potência elétrica é a taxa de transformação de energia."],
    formulas: [
      String.raw`P = Ui`,
      String.raw`P = 220\cdot 5 = 1100 \ \text{W}`,
      String.raw`P = 1{,}1 \ \text{kW}`,
    ],
  },
  {
    id: "ex6",
    title: "Exemplo 6 — Gerador real",
    statement:
      "Um gerador possui ε = 12 V e resistência interna r = 1 Ω. Ele fornece corrente de 2 A.",
    explanation: [
      "Em um gerador real, a tensão útil é menor que a força eletromotriz por causa da queda interna.",
    ],
    formulas: [
      String.raw`U = \varepsilon - ri`,
      String.raw`U = 12 - 1\cdot 2 = 10 \ \text{V}`,
    ],
  },
  {
    id: "ex7",
    title: "Exemplo 7 — Ponte de Wheatstone",
    statement:
      "Uma ponte possui R₁ = 2 Ω, R₂ = 4 Ω, R₃ = 3 Ω e R₄ desconhecido. Determine R₄ para equilíbrio.",
    explanation: [
      "Em equilíbrio, não passa corrente pelo galvanômetro, e usamos a condição da ponte.",
    ],
    formulas: [
      String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`,
      String.raw`\frac{2}{4} = \frac{3}{R_4}`,
      String.raw`R_4 = 6 \ \Omega`,
    ],
  },
  {
    id: "ex8",
    title: "Exemplo 8 — Pontos equipotenciais",
    statement:
      "Em uma rede simétrica, dois pontos possuem o mesmo potencial. O que acontece com um resistor ligado entre eles?",
    explanation: [
      "Se dois pontos têm o mesmo potencial, a diferença de potencial entre eles é nula. Sem tensão, não há corrente.",
    ],
    formulas: [
      String.raw`V_A = V_B`,
      String.raw`U_{AB} = V_A - V_B = 0`,
      String.raw`i = \frac{U_{AB}}{R} = 0`,
    ],
  },
];

const formulaSummary: FormulaSummary[] = [
  {
    title: "Corrente média",
    formula: String.raw`i = \frac{\Delta Q}{\Delta t}`,
    description: "Carga que atravessa uma seção por unidade de tempo.",
  },
  {
    title: "Corrente instantânea",
    formula: String.raw`i = \frac{dQ}{dt}`,
    description: "Taxa instantânea de passagem de carga.",
  },
  {
    title: "Carga quantizada",
    formula: String.raw`Q = ne`,
    description: "Carga total associada a n elétrons.",
  },
  {
    title: "Tensão elétrica",
    formula: String.raw`U = \frac{W}{q}`,
    description: "Energia por unidade de carga.",
  },
  {
    title: "Diferença de potencial",
    formula: String.raw`U_{AB} = V_A - V_B`,
    description: "Diferença entre potenciais elétricos de dois pontos.",
  },
  {
    title: "Resistência elétrica",
    formula: String.raw`R = \frac{U}{i}`,
    description: "Oposição à passagem da corrente.",
  },
  {
    title: "Primeira Lei de Ohm",
    formula: String.raw`U = Ri`,
    description: "Relação entre tensão, resistência e corrente.",
  },
  {
    title: "Segunda Lei de Ohm",
    formula: String.raw`R = \rho\frac{L}{A}`,
    description: "Resistência em função do material e da geometria.",
  },
  {
    title: "Série",
    formula: String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`,
    description: "Mesma corrente em todos os resistores.",
  },
  {
    title: "Paralelo",
    formula: String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \cdots`,
    description: "Mesma tensão em todos os ramos.",
  },
  {
    title: "Potência elétrica",
    formula: String.raw`P = Ui`,
    description: "Taxa de transformação de energia elétrica.",
  },
  {
    title: "Efeito Joule",
    formula: String.raw`E = Ri^2\Delta t`,
    description: "Energia elétrica dissipada como calor.",
  },
  {
    title: "Gerador real",
    formula: String.raw`U = \varepsilon - ri`,
    description: "Tensão terminal menor que a força eletromotriz.",
  },
  {
    title: "Receptor real",
    formula: String.raw`U = \varepsilon' + r'i`,
    description: "Tensão alimenta conversão útil e dissipação interna.",
  },
  {
    title: "Kirchhoff: nós",
    formula: String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`,
    description: "Conservação da carga.",
  },
  {
    title: "Kirchhoff: malhas",
    formula: String.raw`\sum U = 0`,
    description: "Conservação da energia.",
  },
  {
    title: "Wheatstone",
    formula: String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`,
    description: "Condição de equilíbrio da ponte.",
  },
  {
    title: "Capacitor",
    formula: String.raw`Q = CU`,
    description: "Carga armazenada em um capacitor.",
  },
];

export default function EletricidadeTopicEletrodinamica() {
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
                Eletrodinâmica
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
                    Corrente é carga em movimento. Circuito é energia sendo
                    transferida.
                  </h2>

                  <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                    Agora com diagramas visuais integrados às explicações de
                    série, paralelo, circuitos mistos, geradores, receptores,
                    instrumentos, ponte, curto-circuito, capacitores e
                    transmissão.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["26", "tópicos"],
                    ["8", "diagramas"],
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
              description="Exercícios essenciais para fixar corrente, resistores, potência, geradores, ponte e pontos equipotenciais."
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
              title="Resumo de Eletrodinâmica"
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
                  "corrente é fluxo de carga; tensão é energia por carga;",
                  "resistência depende do objeto; resistividade depende do material e da temperatura;",
                  "potência é taxa de transformação de energia; energia é potência acumulada no tempo;",
                  "gerador transforma outras formas de energia em energia elétrica;",
                  "receptor transforma energia elétrica em outra forma útil;",
                  "em série, a corrente é a mesma e a tensão se divide;",
                  "em paralelo, a tensão é a mesma e a corrente se divide;",
                  "amperímetro mede corrente e fica em série;",
                  "voltímetro mede tensão e fica em paralelo;",
                  "Kirchhoff é conservação de carga e energia aplicada a circuitos;",
                  "ponte equilibrada significa pontos intermediários equipotenciais;",
                  "capacitor carregado em corrente contínua estacionária se comporta como circuito aberto.",
                ]}
              />

              <NoteBox title="Ideia final" type="dark">
                Eletrodinâmica não é só fazer conta com resistor. É a linguagem
                física por trás de circuitos, energia elétrica, tecnologia e
                sistemas modernos.
              </NoteBox>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}
