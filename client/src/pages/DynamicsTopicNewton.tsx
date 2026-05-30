import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Calculator,
  Scale,
  Activity,
  Layers,
  Rocket,
  ListChecks,
  Compass,
  Brain,
  History,
  Search,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type TabId = "teoria" | "exemplos" | "resumo";

type SectionProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  gradient: string;
  children: ReactNode;
};

type NoteBoxProps = {
  title: string;
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "slate" | "indigo" | "rose";
};

type FormulaStepProps = {
  title: string;
  explanation?: ReactNode;
  formula: string;
  tone?: "blue" | "green" | "amber" | "purple" | "red" | "slate" | "rose";
};

type TopicBlockProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: "indigo" | "green" | "amber" | "rose" | "blue" | "slate" | "purple";
  icon?: LucideIcon;
};

type ExampleItem = {
  id: string;
  title: string;
  enunciado: string;
  content: ReactNode;
};

function FormulaBox({ formula, label }: { formula: string; label?: string }) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border border-slate-700/80 p-5 text-center overflow-x-auto shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />

      {label && (
        <p className="text-xs font-black uppercase tracking-[0.18em] mb-3 text-slate-400">
          {label}
        </p>
      )}

      <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:text-slate-100 [&_.katex-display]:my-0">
        <MathFormula formula={formula} display={true} />
      </div>
    </div>
  );
}

function InlineFormulaBox({ formula }: { formula: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 mx-1 align-middle text-slate-200 [&_.katex]:text-slate-200">
      <MathFormula formula={formula} />
    </span>
  );
}

function Section({ icon: Icon, title, subtitle, gradient, children }: SectionProps) {
  return (
    <section className="group bg-white rounded-[1.75rem] shadow-[0_18px_55px_rgba(15,23,42,0.10)] overflow-hidden border border-slate-200/80">
      <div className={`${gradient} relative px-8 py-6 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_35%)]" />
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 border border-white/20 p-3 shadow-inner">
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-white/85 text-sm mt-1 leading-6 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-7 bg-gradient-to-br from-white to-slate-50/60">
        {children}
      </div>
    </section>
  );
}

function NoteBox({ title, children, tone = "blue" }: NoteBoxProps) {
  const styles = {
    blue: "bg-blue-50/90 border-blue-400 text-blue-950",
    green: "bg-green-50/90 border-green-400 text-green-950",
    amber: "bg-amber-50/90 border-amber-400 text-amber-950",
    red: "bg-red-50/90 border-red-400 text-red-950",
    purple: "bg-purple-50/90 border-purple-400 text-purple-950",
    slate: "bg-slate-50/90 border-slate-400 text-slate-950",
    indigo: "bg-indigo-50/90 border-indigo-400 text-indigo-950",
    rose: "bg-rose-50/90 border-rose-400 text-rose-950",
  };

  return (
    <div className={`${styles[tone]} border-l-4 rounded-2xl p-5 shadow-sm`}>
      <p className="font-black mb-2 tracking-tight">{title}</p>
      <div className="text-slate-700 text-sm leading-7">{children}</div>
    </div>
  );
}

function FormulaStep({ title, explanation, formula, tone = "slate" }: FormulaStepProps) {
  const dotStyles = {
    blue: "bg-blue-400 shadow-blue-400/40",
    green: "bg-green-400 shadow-green-400/40",
    amber: "bg-amber-400 shadow-amber-400/40",
    purple: "bg-purple-400 shadow-purple-400/40",
    red: "bg-red-400 shadow-red-400/40",
    rose: "bg-rose-400 shadow-rose-400/40",
    slate: "bg-slate-400 shadow-slate-400/40",
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-[0_14px_35px_rgba(15,23,42,0.28)]">
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`h-3 w-3 rounded-full ${dotStyles[tone]} mt-1.5 flex-shrink-0 shadow-lg`}
        />

        <div>
          <p className="font-black text-slate-100 tracking-tight">{title}</p>
          {explanation && (
            <div className="text-sm text-slate-300 leading-7 mt-1">
              {explanation}
            </div>
          )}
        </div>
      </div>

      <FormulaBox formula={formula} />
    </div>
  );
}

function TopicBlock({
  title,
  subtitle,
  children,
  tone = "indigo",
  icon: Icon,
}: TopicBlockProps) {
  const styles = {
    indigo: "border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-white",
    green: "border-green-200/80 bg-gradient-to-br from-green-50/80 to-white",
    amber: "border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white",
    rose: "border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white",
    blue: "border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white",
    slate: "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white",
    purple: "border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-white",
  };

  const iconStyles = {
    indigo: "text-indigo-700 bg-indigo-100 border-indigo-200",
    green: "text-green-700 bg-green-100 border-green-200",
    amber: "text-amber-700 bg-amber-100 border-amber-200",
    rose: "text-rose-700 bg-rose-100 border-rose-200",
    blue: "text-blue-700 bg-blue-100 border-blue-200",
    slate: "text-slate-700 bg-slate-100 border-slate-200",
    purple: "text-purple-700 bg-purple-100 border-purple-200",
  };

  return (
    <div
      className={`rounded-3xl border ${styles[tone]} p-5 md:p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`rounded-2xl p-3 border ${iconStyles[tone]} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-xl font-black text-slate-950 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1 leading-6 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2">{children}</h4>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="text-slate-700 leading-8">{children}</p>;
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-slate-700 leading-7">
          <span className="mt-3 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedSteps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <span className="text-slate-700 text-sm leading-7">{item}</span>
        </li>
      ))}
    </ol>
  );
}

type NewtonDiagramKind =
  | "inertia"
  | "firstLaw"
  | "secondLaw"
  | "freeBody"
  | "weightNormal"
  | "inclinedPlane"
  | "elevator"
  | "actionReaction"
  | "friction"
  | "pulley";

function DiagramCard({
  title,
  caption,
  kind,
}: {
  title: string;
  caption: string;
  kind: NewtonDiagramKind;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <p className="text-lg font-black text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[720px]">
          {kind === "inertia" && <InertiaDiagram />}
          {kind === "firstLaw" && <FirstLawDiagram />}
          {kind === "secondLaw" && <SecondLawDiagram />}
          {kind === "freeBody" && <FreeBodyDiagram />}
          {kind === "weightNormal" && <WeightNormalDiagram />}
          {kind === "inclinedPlane" && <InclinedPlaneDiagram />}
          {kind === "elevator" && <ElevatorDiagram />}
          {kind === "actionReaction" && <ActionReactionDiagram />}
          {kind === "friction" && <FrictionDiagram />}
          {kind === "pulley" && <PulleyDiagram />}
        </div>
      </div>
    </div>
  );
}

function SvgLabel({
  x,
  y,
  children,
  tone = "slate",
}: {
  x: number;
  y: number;
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "red" | "amber" | "purple";
}) {
  const fill = {
    slate: "fill-slate-700",
    blue: "fill-blue-700",
    green: "fill-emerald-700",
    red: "fill-red-700",
    amber: "fill-amber-700",
    purple: "fill-purple-700",
  }[tone];

  return (
    <text x={x} y={y} textAnchor="middle" className={`${fill} text-[16px] font-black`}>
      {children}
    </text>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "#0f172a",
  width = 5,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 11;
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
        strokeWidth={width}
        strokeLinecap="round"
      />
      <path d={`M ${x2} ${y2} L ${ax1} ${ay1} L ${ax2} ${ay2} Z`} fill={color} />
    </>
  );
}

function Block({
  x,
  y,
  fill = "#e0f2fe",
  label = "m",
}: {
  x: number;
  y: number;
  fill?: string;
  label?: string;
}) {
  return (
    <>
      <rect x={x} y={y} width="90" height="64" rx="14" fill={fill} stroke="#0f172a" strokeWidth="4" />
      <text x={x + 45} y={y + 39} textAnchor="middle" className="fill-slate-950 text-[22px] font-black">
        {label}
      </text>
    </>
  );
}

function InertiaDiagram() {
  return (
    <svg viewBox="0 0 760 340" className="h-[340px] w-full">
      <rect x="15" y="15" width="730" height="310" rx="26" fill="#ffffff" />
      <line x1="70" y1="255" x2="330" y2="255" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={145} y={190} fill="#fee2e2" label="m" />
      <Arrow x1={190} y1={185} x2={250} y2={185} color="#2563eb" />
      <Arrow x1={235} y1={222} x2={165} y2={222} color="#dc2626" />
      <SvgLabel x={220} y={170} tone="blue">v</SvgLabel>
      <SvgLabel x={195} y={285} tone="red">com atrito: o corpo desacelera</SvgLabel>

      <line x1="430" y1="255" x2="690" y2="255" stroke="#64748b" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 10" />
      <Block x={505} y={190} fill="#dcfce7" label="m" />
      <Arrow x1={550} y1={185} x2={630} y2={185} color="#16a34a" />
      <SvgLabel x={590} y={170} tone="green">v constante</SvgLabel>
      <SvgLabel x={560} y={285} tone="green">sem força resultante: MRU continua</SvgLabel>
      <SvgLabel x={380} y={62}>movimento não precisa de força resultante para continuar</SvgLabel>
    </svg>
  );
}

function FirstLawDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />
      <line x1="70" y1="245" x2="690" y2="245" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={105} y={180} fill="#f8fafc" label="m" />
      <Arrow x1={150} y1={175} x2={150} y2={115} color="#2563eb" />
      <Arrow x1={150} y1={244} x2={150} y2={304} color="#dc2626" />
      <SvgLabel x={150} y={100} tone="blue">N</SvgLabel>
      <SvgLabel x={150} y={320} tone="red">P</SvgLabel>
      <SvgLabel x={150} y={150}>repouso</SvgLabel>

      <Block x={335} y={180} fill="#e0f2fe" label="m" />
      <Arrow x1={310} y1={212} x2={260} y2={212} color="#64748b" />
      <Arrow x1={425} y1={212} x2={475} y2={212} color="#64748b" />
      <Arrow x1={380} y1={166} x2={455} y2={166} color="#16a34a" />
      <SvgLabel x={380} y={150} tone="green">v constante</SvgLabel>
      <SvgLabel x={380} y={280}>equilíbrio dinâmico</SvgLabel>

      <Block x={570} y={180} fill="#dcfce7" label="m" />
      <Arrow x1={615} y1={175} x2={615} y2={115} color="#2563eb" />
      <Arrow x1={615} y1={244} x2={615} y2={304} color="#dc2626" />
      <SvgLabel x={615} y={100} tone="blue">N</SvgLabel>
      <SvgLabel x={615} y={320} tone="red">P</SvgLabel>
      <SvgLabel x={615} y={150}>Fᵣₑₛ = 0</SvgLabel>
      <SvgLabel x={380} y={62}>força resultante nula não significa ausência de forças</SvgLabel>
    </svg>
  );
}

function SecondLawDiagram() {
  return (
    <svg viewBox="0 0 760 350" className="h-[350px] w-full">
      <rect x="15" y="15" width="730" height="320" rx="26" fill="#ffffff" />
      <line x1="70" y1="155" x2="330" y2="155" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={140} y={90} fill="#dbeafe" label="m" />
      <Arrow x1={230} y1={122} x2={305} y2={122} color="#2563eb" />
      <Arrow x1={185} y1={82} x2={255} y2={82} color="#16a34a" />
      <SvgLabel x={270} y={108} tone="blue">F</SvgLabel>
      <SvgLabel x={220} y={66} tone="green">a</SvgLabel>
      <SvgLabel x={200} y={200}>mesma massa: mais força, mais aceleração</SvgLabel>

      <line x1="430" y1="155" x2="690" y2="155" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={500} y={90} fill="#fde68a" label="2m" />
      <Arrow x1={590} y1={122} x2={665} y2={122} color="#2563eb" />
      <Arrow x1={545} y1={82} x2={585} y2={82} color="#16a34a" />
      <SvgLabel x={630} y={108} tone="blue">F</SvgLabel>
      <SvgLabel x={565} y={66} tone="green">a menor</SvgLabel>
      <SvgLabel x={560} y={200}>mesma força: mais massa, menos aceleração</SvgLabel>
      <SvgLabel x={380} y={285}>a aceleração aponta no sentido da força resultante, não necessariamente no sentido da velocidade</SvgLabel>
    </svg>
  );
}

function FreeBodyDiagram() {
  return (
    <svg viewBox="0 0 760 380" className="h-[380px] w-full">
      <rect x="15" y="15" width="730" height="350" rx="26" fill="#ffffff" />
      <line x1="90" y1="270" x2="670" y2="270" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={335} y={205} fill="#e0f2fe" label="m" />
      <Arrow x1={380} y1={205} x2={380} y2={120} color="#2563eb" />
      <Arrow x1={380} y1={269} x2={380} y2={350} color="#dc2626" />
      <Arrow x1={425} y1={237} x2={545} y2={237} color="#16a34a" />
      <Arrow x1={335} y1={237} x2={225} y2={237} color="#f59e0b" />
      <SvgLabel x={400} y={105} tone="blue">N</SvgLabel>
      <SvgLabel x={400} y={350} tone="red">P = mg</SvgLabel>
      <SvgLabel x={560} y={225} tone="green">F</SvgLabel>
      <SvgLabel x={205} y={225} tone="amber">atrito</SvgLabel>
      <SvgLabel x={380} y={62}>DCL: desenhe apenas as forças que atuam no corpo escolhido</SvgLabel>
    </svg>
  );
}

function WeightNormalDiagram() {
  return (
    <svg viewBox="0 0 760 350" className="h-[350px] w-full">
      <rect x="15" y="15" width="730" height="320" rx="26" fill="#ffffff" />
      <line x1="90" y1="245" x2="330" y2="245" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={165} y={180} fill="#dbeafe" label="livro" />
      <Arrow x1={210} y1={180} x2={210} y2={110} color="#2563eb" />
      <Arrow x1={210} y1={244} x2={210} y2={310} color="#dc2626" />
      <SvgLabel x={235} y={100} tone="blue">N</SvgLabel>
      <SvgLabel x={235} y={320} tone="red">P</SvgLabel>
      <SvgLabel x={210} y={65}>forças no livro</SvgLabel>

      <circle cx="510" cy="150" r="42" fill="#fef3c7" stroke="#0f172a" strokeWidth="4" />
      <text x="510" y="158" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">Terra</text>
      <rect x="585" y="118" width="90" height="64" rx="14" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <text x="630" y="156" textAnchor="middle" className="fill-slate-950 text-[18px] font-black">livro</text>
      <Arrow x1={585} y1={150} x2={552} y2={150} color="#dc2626" />
      <Arrow x1={552} y1={185} x2={585} y2={185} color="#16a34a" />
      <SvgLabel x={610} y={230}>ação e reação atuam em corpos diferentes</SvgLabel>
      <SvgLabel x={380} y={300} tone="red">peso e normal não são par ação-reação</SvgLabel>
    </svg>
  );
}
function InclinedPlaneDiagram() {
  return (
    <svg viewBox="0 0 760 420" className="h-[420px] w-full">
      <rect x="15" y="15" width="730" height="390" rx="26" fill="#ffffff" />
      <polygon
        points="135,315 625,315 625,110"
        fill="#e2e8f0"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <line
        x1="135"
        y1="315"
        x2="625"
        y2="110"
        stroke="#334155"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <g transform="translate(350 210) rotate(-23)">
        <rect
          x="-45"
          y="-32"
          width="90"
          height="64"
          rx="14"
          fill="#dbeafe"
          stroke="#0f172a"
          strokeWidth="4"
        />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          className="fill-slate-950 text-[22px] font-black"
        >
          m
        </text>
      </g>

      <Arrow x1={350} y1={210} x2={350} y2={330} color="#dc2626" />
      <Arrow x1={350} y1={210} x2={300} y2={95} color="#2563eb" />
      <Arrow x1={350} y1={210} x2={255} y2={250} color="#16a34a" />
      <Arrow x1={350} y1={210} x2={405} y2={335} color="#f59e0b" />

      <SvgLabel x={372} y={344} tone="red">
        P = mg
      </SvgLabel>
      <SvgLabel x={285} y={85} tone="blue">
        N
      </SvgLabel>
      <SvgLabel x={230} y={255} tone="green">
        mg sen θ
      </SvgLabel>
      <SvgLabel x={435} y={345} tone="amber">
        mg cos θ
      </SvgLabel>
      <SvgLabel x={575} y={338}>
        θ
      </SvgLabel>
      <SvgLabel x={380} y={62}>
        no plano inclinado, o peso é decomposto nos eixos do plano
      </SvgLabel>
    </svg>
  );
}

function ElevatorDiagram() {
  return (
    <svg viewBox="0 0 760 360" className="h-[360px] w-full">
      <rect x="15" y="15" width="730" height="330" rx="26" fill="#ffffff" />

      {[
        { x: 95, label: "a para cima", sign: "N > P", arrow: "up" },
        { x: 335, label: "repouso ou MRU", sign: "N = P", arrow: "zero" },
        { x: 575, label: "a para baixo", sign: "N < P", arrow: "down" },
      ].map((e) => (
        <g key={e.x}>
          <rect
            x={e.x}
            y="90"
            width="130"
            height="165"
            rx="16"
            fill="#f8fafc"
            stroke="#0f172a"
            strokeWidth="4"
          />

          <circle
            cx={e.x + 65}
            cy="168"
            r="23"
            fill="#dbeafe"
            stroke="#0f172a"
            strokeWidth="3"
          />

          <line
            x1={e.x + 65}
            y1="191"
            x2={e.x + 65}
            y2="226"
            stroke="#0f172a"
            strokeWidth="5"
          />

          <Arrow
            x1={e.x + 65}
            y1={166}
            x2={e.x + 65}
            y2={122}
            color="#2563eb"
            width={4}
          />

          <Arrow
            x1={e.x + 65}
            y1={202}
            x2={e.x + 65}
            y2={244}
            color="#dc2626"
            width={4}
          />

          {e.arrow === "up" && (
            <Arrow
              x1={e.x + 110}
              y1={235}
              x2={e.x + 110}
              y2={160}
              color="#16a34a"
              width={4}
            />
          )}

          {e.arrow === "down" && (
            <Arrow
              x1={e.x + 110}
              y1={160}
              x2={e.x + 110}
              y2={235}
              color="#16a34a"
              width={4}
            />
          )}

          {e.arrow === "zero" && (
            <text
              x={e.x + 110}
              y="205"
              textAnchor="middle"
              className="fill-emerald-700 text-[20px] font-black"
            >
              a=0
            </text>
          )}

          <SvgLabel x={e.x + 65} y={290}>
            {e.label}
          </SvgLabel>

          <SvgLabel x={e.x + 65} y={320} tone="purple">
            {e.sign}
          </SvgLabel>
        </g>
      ))}
    </svg>
  );
}

function ActionReactionDiagram() {
  return (
    <svg viewBox="0 0 760 330" className="h-[330px] w-full">
      <rect x="15" y="15" width="730" height="300" rx="26" fill="#ffffff" />

      <circle
        cx="290"
        cy="170"
        r="56"
        fill="#dbeafe"
        stroke="#0f172a"
        strokeWidth="4"
      />
      <circle
        cx="470"
        cy="170"
        r="56"
        fill="#fee2e2"
        stroke="#0f172a"
        strokeWidth="4"
      />

      <text
        x="290"
        y="180"
        textAnchor="middle"
        className="fill-slate-950 text-[24px] font-black"
      >
        A
      </text>

      <text
        x="470"
        y="180"
        textAnchor="middle"
        className="fill-slate-950 text-[24px] font-black"
      >
        B
      </text>

      <Arrow x1={335} y1={145} x2={420} y2={145} color="#2563eb" />
      <Arrow x1={425} y1={195} x2={340} y2={195} color="#dc2626" />

      <SvgLabel x={380} y={125} tone="blue">
        F de A em B
      </SvgLabel>
      <SvgLabel x={380} y={230} tone="red">
        F de B em A
      </SvgLabel>
      <SvgLabel x={380} y={62}>
        mesmo módulo, mesma direção, sentidos opostos, corpos diferentes
      </SvgLabel>
      <SvgLabel x={380} y={285} tone="purple">
        por atuarem em corpos diferentes, não se cancelam no DCL de um corpo só
      </SvgLabel>
    </svg>
  );
}

function FrictionDiagram() {
  return (
    <svg viewBox="0 0 760 360" className="h-[360px] w-full">
      <rect x="15" y="15" width="730" height="330" rx="26" fill="#ffffff" />

      <line
        x1="80"
        y1="250"
        x2="680"
        y2="250"
        stroke="#64748b"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <Block x={335} y={185} fill="#fef3c7" label="m" />

      <Arrow x1={425} y1={217} x2={555} y2={217} color="#2563eb" />
      <Arrow x1={335} y1={217} x2={220} y2={217} color="#f59e0b" />

      <SvgLabel x={570} y={205} tone="blue">
        tendência de movimento
      </SvgLabel>
      <SvgLabel x={205} y={205} tone="amber">
        atrito
      </SvgLabel>
      <SvgLabel x={380} y={80}>
        o atrito se opõe à tendência de deslizamento ou ao deslizamento relativo
      </SvgLabel>
      <SvgLabel x={270} y={305} tone="amber">
        estático: ajusta até fₑ máx
      </SvgLabel>
      <SvgLabel x={520} y={305} tone="blue">
        cinético: f꜀ = μ꜀N
      </SvgLabel>
    </svg>
  );
}

function PulleyDiagram() {
  return (
    <svg viewBox="0 0 760 390" className="h-[390px] w-full">
      <rect x="15" y="15" width="730" height="360" rx="26" fill="#ffffff" />

      <line
        x1="90"
        y1="285"
        x2="420"
        y2="285"
        stroke="#64748b"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <Block x={190} y={220} fill="#dbeafe" label="m₁" />

      <circle
        cx="455"
        cy="170"
        r="44"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="4"
      />

      <line x1="235" y1="220" x2="235" y2="170" stroke="#0f172a" strokeWidth="4" />
      <line x1="235" y1="170" x2="455" y2="170" stroke="#0f172a" strokeWidth="4" />
      <line x1="499" y1="170" x2="499" y2="255" stroke="#0f172a" strokeWidth="4" />

      <Block x={454} y={255} fill="#fee2e2" label="m₂" />

      <Arrow x1={280} y1={210} x2={350} y2={210} color="#2563eb" />
      <Arrow x1={540} y1={255} x2={540} y2={315} color="#dc2626" />

      <SvgLabel x={315} y={195} tone="blue">
        T
      </SvgLabel>
      <SvgLabel x={570} y={305} tone="red">
        P₂
      </SvgLabel>
      <SvgLabel x={380} y={60}>
        em polias ideais, a corda impõe vínculos entre acelerações
      </SvgLabel>
      <SvgLabel x={385} y={340} tone="purple">
        não escreva uma única equação para tudo: faça DCL para cada corpo
      </SvgLabel>
    </svg>
  );
}

function FormulaGrid({ children }: { children: ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function ThreeGrid({ children }: { children: ReactNode }) {
  return <div className="grid md:grid-cols-3 gap-4">{children}</div>;
}

function PageHero() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-[0_22px_70px_rgba(15,23,42,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_32%)]" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-indigo-300 font-black uppercase tracking-[0.22em] text-xs mb-3">
              Dinâmica clássica
            </p>

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Leis de Newton.
            </h2>

            <p className="text-slate-300 leading-7 mt-4 max-w-2xl">
              Contexto histórico, intuição física, fórmulas explicadas, aplicações,
              armadilhas e pontos de prova.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-full md:min-w-[330px]">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">1ª</p>
              <p className="text-xs text-slate-300 mt-1">Inércia</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">2ª</p>
              <p className="text-xs text-slate-300 mt-1">F = ma</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-2xl font-black text-white">3ª</p>
              <p className="text-xs text-slate-300 mt-1">Ação/reação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                <NoteBox title="Pergunta central da Primeira Lei" tone="green">
                  O que acontece com um corpo quando a força resultante sobre ele é nula?
                </NoteBox>

                <Paragraph>
                  A resposta é: ele não acelera. Se estava parado, continua parado. Se
                  estava em movimento retilíneo uniforme, continua em movimento retilíneo
                  uniforme.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Ideia intuitiva" tone="blue" icon={Lightbulb}>
                <Paragraph>
                  Imagine um disco deslizando sobre uma mesa. Em uma mesa áspera, ele para
                  rápido. Em uma mesa mais lisa, ele vai mais longe. Em uma superfície ideal
                  sem atrito e sem resistência do ar, ele continuaria indefinidamente em
                  linha reta com velocidade constante.
                </Paragraph>

                <Paragraph>
                  Isso mostra que o movimento não precisa de força para continuar. O que
                  muda o movimento é a força resultante. Se a resultante é zero, nada altera
                  a velocidade vetorial.
                </Paragraph>

                <NoteBox title="A palavra-chave é velocidade vetorial" tone="blue">
                  Velocidade vetorial envolve módulo, direção e sentido. Se nenhum desses
                  três aspectos muda, a aceleração é zero.
                </NoteBox>

                <DiagramCard
                  kind="firstLaw"
                  title="Diagrama visual: equilíbrio estático e dinâmico"
                  caption="Força resultante nula pode significar repouso ou movimento retilíneo uniforme. O ponto é a aceleração ser nula."
                />
              </TopicBlock>

              <TopicBlock title="Enunciado formal" tone="green" icon={BookOpen}>
                <blockquote className="border-l-4 border-green-500 pl-5 py-3 bg-green-50 rounded-r-xl text-slate-700 italic leading-8">
                  Todo corpo tende a permanecer em repouso ou em movimento retilíneo
                  uniforme, a menos que uma força resultante externa atue sobre ele.
                </blockquote>

                <FormulaStep
                  title="Forma matemática da Primeira Lei"
                  explanation="Se a força resultante é nula, a aceleração é nula. Se a aceleração é nula, a velocidade vetorial permanece constante."
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="green"
                />
              </TopicBlock>

              <TopicBlock title="Explicando a fórmula com calma" tone="slate" icon={Calculator}>
                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}}`} />
                </SubTitle>
                <Paragraph>
                  Representa a soma vetorial de todas as forças que atuam no corpo. Não
                  significa “não existe força”. Significa que as forças se equilibram.
                </Paragraph>

                <FormulaStep
                  title="Resultante como soma vetorial"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`}
                  tone="blue"
                />

                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{a}`} />
                </SubTitle>
                <Paragraph>
                  Representa a aceleração vetorial. Se ela é zero, a velocidade vetorial
                  não muda. Não importa se o corpo está parado ou se movendo. O ponto é:
                  ele não altera seu estado de movimento.
                </Paragraph>

                <FormulaStep
                  title="Aceleração nula"
                  formula={String.raw`\vec{a} = \vec{0}`}
                  tone="green"
                />

                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{v} = \text{constante}`} />
                </SubTitle>
                <Paragraph>
                  Significa que a velocidade vetorial permanece a mesma. Se ela era zero,
                  continua zero. Se era diferente de zero, continua com mesmo módulo, mesma
                  direção e mesmo sentido.
                </Paragraph>

                <FormulaStep
                  title="Duas possibilidades"
                  formula={String.raw`\vec{v} = \vec{0} \quad \text{ou} \quad \vec{v} \neq \vec{0} \ \text{constante}`}
                  tone="purple"
                />
              </TopicBlock>

              <TopicBlock title="Por que essa lei funciona?" tone="purple" icon={Brain}>
                <Paragraph>
                  A Primeira Lei funciona porque a velocidade de um corpo só muda quando
                  existe aceleração. E, no modelo newtoniano, aceleração só aparece quando
                  há força resultante.
                </Paragraph>

                <Paragraph>
                  Se todas as forças se equilibram, não existe agente físico capaz de
                  alterar o movimento do corpo. O corpo simplesmente mantém aquilo que já
                  estava fazendo.
                </Paragraph>

                <FormulaStep
                  title="Ponte com a Segunda Lei"
                  explanation="A Primeira Lei pode ser vista como o caso em que a força resultante da Segunda Lei vale zero."
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a} \quad \text{e} \quad \vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0}`}
                  tone="purple"
                />

                <NoteBox title="Mas atenção" tone="amber">
                  A Primeira Lei não é inútil por parecer um caso da Segunda. Ela define o
                  tipo de referencial em que as Leis de Newton funcionam diretamente: os
                  referenciais inerciais.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Referencial inercial" tone="blue" icon={Compass}>
                <Paragraph>
                  Um referencial inercial é aquele em que um corpo livre de força resultante
                  permanece em repouso ou em movimento retilíneo uniforme.
                </Paragraph>

                <FormulaStep
                  title="Condição em um referencial inercial"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="blue"
                />

                <Paragraph>
                  Em vestibulares e no Ensino Médio, a Terra costuma ser tratada como
                  aproximadamente inercial em problemas comuns, como blocos, rampas,
                  elevadores e polias. Essa é uma aproximação, porque a Terra gira e orbita
                  o Sol, mas funciona muito bem para a maioria dos problemas.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Equilíbrio estático e equilíbrio dinâmico" tone="green" icon={Scale}>
                <FormulaGrid>
                  <NoteBox title="Equilíbrio estático" tone="green">
                    O corpo está parado e continua parado:
                    <InlineFormulaBox formula={String.raw`\vec{v} = \vec{0}`} />.
                  </NoteBox>

                  <NoteBox title="Equilíbrio dinâmico" tone="blue">
                    O corpo está em movimento retilíneo uniforme:
                    <InlineFormulaBox formula={String.raw`\vec{v} = \text{constante}`} />.
                  </NoteBox>
                </FormulaGrid>

                <Paragraph>
                  Nos dois casos, a força resultante é nula. A diferença é apenas o valor
                  da velocidade. No equilíbrio estático, ela é zero. No equilíbrio dinâmico,
                  ela é constante e diferente de zero.
                </Paragraph>

                <FormulaStep
                  title="Condição geral de equilíbrio"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`}
                  tone="green"
                />
              </TopicBlock>

              <TopicBlock title="Como reconhecer a Primeira Lei em questões?" tone="amber" icon={Search}>
                <Paragraph>
                  A Primeira Lei costuma aparecer quando a questão fala de repouso,
                  movimento retilíneo uniforme, velocidade constante, equilíbrio ou força
                  resultante nula.
                </Paragraph>

                <BulletList
                  items={[
                    <>“O corpo permanece em repouso...”</>,
                    <>“O corpo se move com velocidade constante...”</>,
                    <>“A força resultante é nula...”</>,
                    <>“O sistema está em equilíbrio...”</>,
                    <>“O objeto está em MRU...”</>,
                  ]}
                />

                <NoteBox title="O que pensar na hora da prova" tone="amber">
                  Se a velocidade não muda, a aceleração é zero. Se a aceleração é zero, a
                  força resultante é zero.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Interpretação gráfica na Primeira Lei" tone="blue" icon={Activity}>
                <Paragraph>
                  Se a força resultante é nula, a aceleração é nula. No gráfico velocidade
                  versus tempo, isso aparece como uma reta horizontal.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Força resultante"
                    formula={String.raw`\vec{F}_{\text{res}} = \vec{0}`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Aceleração"
                    formula={String.raw`\vec{a} = \vec{0}`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Velocidade"
                    formula={String.raw`\vec{v} = \text{constante}`}
                    tone="purple"
                  />
                </FormulaGrid>

                <NoteBox title="No gráfico v × t" tone="blue">
                  Uma reta horizontal significa aceleração zero. Logo, pela Dinâmica, a
                  força resultante também é zero.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Erros comuns na Primeira Lei" tone="rose" icon={AlertTriangle}>
                <FormulaGrid>
                  <NoteBox title="Achar que força mantém movimento" tone="red">
                    Errado. Força resultante altera movimento. Movimento retilíneo uniforme
                    não precisa de força resultante.
                  </NoteBox>

                  <NoteBox title="Achar que resultante nula significa repouso" tone="red">
                    Errado. Resultante nula significa velocidade constante. Essa velocidade
                    pode ser zero ou diferente de zero.
                  </NoteBox>

                  <NoteBox title="Desenhar força do movimento" tone="red">
                    Errado. Movimento não é corpo e não exerce força.
                  </NoteBox>

                  <NoteBox title="Confundir inércia com força" tone="red">
                    Errado. Inércia é propriedade da matéria, não uma força desenhada no
                    DCL.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Ponto para ITA/IME" tone="purple" icon={Target}>
                <Paragraph>
                  Em prova difícil, a Primeira Lei aparece disfarçada em problemas de
                  equilíbrio, referenciais, sistemas sem aceleração e análise conceitual. O
                  erro mais comum é enxergar movimento e inventar uma força no sentido do
                  movimento.
                </Paragraph>

                <NoteBox title="Regra mental" tone="purple">
                  Antes de perguntar “para onde o corpo se move?”, pergunte: “a velocidade
                  dele está mudando?”. Se não está, a resultante é zero.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={Calculator}
              title="Segunda Lei de Newton — Princípio Fundamental da Dinâmica"
              subtitle="A lei que explica o que acontece quando sobra força resultante."
              gradient="bg-gradient-to-r from-indigo-600 to-purple-700"
            >
              <TopicBlock title="Por que essa lei foi criada?" tone="indigo" icon={History}>
                <Paragraph>
                  A Primeira Lei responde o que acontece quando a força resultante é nula:
                  o corpo não acelera. Mas Newton precisava responder a pergunta seguinte,
                  muito mais operacional:
                </Paragraph>

                <NoteBox title="Pergunta central da Segunda Lei" tone="indigo">
                  O que acontece quando sobra força resultante sobre um corpo?
                </NoteBox>

                <Paragraph>
                  A resposta é: o corpo acelera. Mas a aceleração não depende só da força.
                  Ela depende também da massa. Um mesmo empurrão produz efeitos bem
                  diferentes em uma bola de tênis e em um caminhão carregado. A natureza,
                  aparentemente, não liga para sua vontade de simplificar.
                </Paragraph>

                <Paragraph>
                  A Segunda Lei nasceu para quantificar essa relação entre força resultante,
                  massa e aceleração.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Ideia intuitiva" tone="blue" icon={Lightbulb}>
                <Paragraph>
                  A força resultante mede o desequilíbrio das interações sobre o corpo. A
                  massa mede a resistência do corpo a mudar seu estado de movimento. A
                  aceleração é a resposta do corpo a esse desequilíbrio.
                </Paragraph>

                <ThreeGrid>
                  <NoteBox title="Força resultante" tone="blue">
                    É o que sobra depois de somar vetorialmente todas as forças.
                  </NoteBox>

                  <NoteBox title="Massa" tone="purple">
                    Mede a inércia, isto é, a resistência à mudança de movimento.
                  </NoteBox>

                  <NoteBox title="Aceleração" tone="green">
                    É a mudança da velocidade vetorial no tempo.
                  </NoteBox>
                </ThreeGrid>

                <Paragraph>
                  Se a força resultante aumenta, a aceleração aumenta. Se a massa aumenta,
                  a aceleração diminui. Esse é o núcleo da Segunda Lei.
                </Paragraph>
              </TopicBlock>

              <DiagramCard
                kind="secondLaw"
                title="Diagrama visual: força, massa e aceleração"
                caption="A mesma massa acelera mais quando a força resultante aumenta; a mesma força acelera menos quando a massa aumenta."
              />

              <TopicBlock title="Enunciado formal e fórmula principal" tone="indigo" icon={BookOpen}>
                <blockquote className="border-l-4 border-indigo-500 pl-5 py-3 bg-indigo-50 rounded-r-xl text-slate-700 italic leading-8">
                  A força resultante sobre um corpo é igual ao produto da massa do corpo
                  pela aceleração adquirida.
                </blockquote>

                <FormulaStep
                  title="Segunda Lei de Newton"
                  explanation="A equação é vetorial. Isso significa que a aceleração tem a mesma direção e o mesmo sentido da força resultante."
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />
              </TopicBlock>

              <TopicBlock title="Como essa fórmula foi construída?" tone="purple" icon={Brain}>
                <Paragraph>
                  Experimentalmente, observa-se que, para um mesmo corpo, aumentar a força
                  resultante aumenta a aceleração. Se você dobra a força resultante, a
                  aceleração também dobra, desde que a massa seja a mesma.
                </Paragraph>

                <FormulaStep
                  title="Proporcionalidade com a força"
                  formula={String.raw`a \propto F_{\text{res}}`}
                  tone="blue"
                />

                <Paragraph>
                  Também se observa que, para a mesma força resultante, corpos de massas
                  maiores aceleram menos. Se a massa dobra, a aceleração fica pela metade.
                </Paragraph>

                <FormulaStep
                  title="Proporcionalidade inversa com a massa"
                  formula={String.raw`a \propto \frac{1}{m}`}
                  tone="purple"
                />

                <Paragraph>Juntando as duas ideias:</Paragraph>

                <FormulaStep
                  title="Síntese física"
                  formula={String.raw`a \propto \frac{F_{\text{res}}}{m}`}
                  tone="green"
                />

                <Paragraph>
                  No Sistema Internacional, escolhemos as unidades de modo que a constante
                  de proporcionalidade seja 1. Assim:
                </Paragraph>

                <FormulaStep
                  title="Forma final"
                  formula={String.raw`F_{\text{res}} = ma`}
                  tone="green"
                />
              </TopicBlock>

              <TopicBlock title="Leitura termo a termo" tone="slate" icon={Eye}>
                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{F}_{\text{res}}`} />
                </SubTitle>
                <Paragraph>
                  Não é uma força qualquer. É a soma vetorial de todas as forças reais que
                  atuam no corpo escolhido. Se há 50 N para a direita e 20 N para a esquerda,
                  a resultante horizontal é 30 N para a direita.
                </Paragraph>

                <FormulaStep
                  title="Soma das forças"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \cdots`}
                  tone="blue"
                />

                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`m`} />
                </SubTitle>
                                </SubTitle>
                <Paragraph>
                  Representa a massa do corpo. Massa não é peso. Massa mede a inércia:
                  quanto maior a massa, maior a dificuldade de alterar a velocidade do
                  corpo.
                </Paragraph>

                <FormulaStep
                  title="Massa como resistência à aceleração"
                  formula={String.raw`a = \frac{F_{\text{res}}}{m}`}
                  tone="purple"
                />

                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{a}`} />
                </SubTitle>
                <Paragraph>
                  Representa a aceleração vetorial. Ela indica como a velocidade vetorial
                  muda no tempo. A aceleração não aponta necessariamente para onde o corpo
                  se move. Ela aponta no sentido da força resultante.
                </Paragraph>

                <FormulaStep
                  title="Aceleração média"
                  formula={String.raw`\vec{a} = \frac{\Delta \vec{v}}{\Delta t}`}
                  tone="green"
                />
              </TopicBlock>

              <TopicBlock
                title="Por que a aceleração aponta no sentido da força resultante?"
                tone="blue"
                icon={Compass}
              >
                <Paragraph>Pela Segunda Lei:</Paragraph>

                <FormulaStep
                  title="Isolando a aceleração"
                  formula={String.raw`\vec{a} = \frac{\vec{F}_{\text{res}}}{m}`}
                  tone="blue"
                />

                <Paragraph>
                  Como a massa é uma grandeza positiva, dividir um vetor por uma massa
                  positiva não muda sua direção nem seu sentido. Por isso, a aceleração tem
                  a mesma direção e o mesmo sentido da força resultante.
                </Paragraph>

                <NoteBox title="Exemplo clássico" tone="amber">
                  Em um lançamento vertical para cima, o corpo ainda pode estar subindo,
                  mas a força resultante é o peso para baixo. Portanto, a aceleração é para
                  baixo. Velocidade para cima, aceleração para baixo.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Análise dimensional do newton" tone="blue" icon={Scale}>
                <Paragraph>
                  A unidade de força surge da própria Segunda Lei. Como força é massa vezes
                  aceleração:
                </Paragraph>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <FormulaStep
                    title="Segunda Lei em módulo"
                    formula={String.raw`F = ma`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Dimensões"
                    formula={String.raw`[F] = [m][a]`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Massa e aceleração"
                    formula={String.raw`[m] = \text{kg} \qquad [a] = \frac{\text{m}}{\text{s}^2}`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Unidade de força"
                    formula={String.raw`[F] = \text{kg}\cdot \frac{\text{m}}{\text{s}^2}`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Definição de newton"
                    formula={String.raw`1 \ \text{N} = 1 \ \text{kg}\cdot \frac{\text{m}}{\text{s}^2}`}
                    tone="green"
                  />
                </div>

                <NoteBox title="Interpretação" tone="blue">
                  Uma força de 1 N é a força resultante capaz de produzir aceleração de
                  1 m/s² em um corpo de massa 1 kg.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="DCL: o mapa antes da fórmula" tone="slate" icon={ListChecks}>
                <DiagramCard
                  kind="freeBody"
                  title="Diagrama visual: corpo livre em superfície horizontal"
                  caption="Antes de escrever equações, escolha o corpo e desenhe apenas as forças que atuam nele."
                />

                <Paragraph>
                  O Diagrama de Corpo Livre é o desenho de todas as forças que atuam sobre
                  o corpo escolhido. Ele é obrigatório para resolver Dinâmica direito. Pular
                  o DCL é igual resolver equação sem ler o enunciado: dá para fazer, mas é
                  uma aposta contra a própria dignidade.
                </Paragraph>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                  <p className="font-bold text-indigo-900 mb-4">Sequência segura</p>

                  <NumberedSteps
                    items={[
                      <>Escolha o corpo ou sistema.</>,
                      <>Isole mentalmente esse corpo.</>,
                      <>Desenhe apenas forças que atuam nele.</>,
                      <>Não desenhe forças que ele exerce nos outros.</>,
                      <>Identifique quem exerce cada força.</>,
                      <>Escolha eixos convenientes.</>,
                      <>Decomponha forças inclinadas.</>,
                      <>
                        Aplique <InlineFormulaBox formula={String.raw`\sum F = ma`} /> em
                        cada eixo.
                      </>,
                    ]}
                  />
                </div>

                <FormulaGrid>
                  <FormulaStep title="Eixo x" formula={String.raw`\sum F_x = ma_x`} tone="blue" />
                  <FormulaStep title="Eixo y" formula={String.raw`\sum F_y = ma_y`} tone="green" />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Peso como aplicação da Segunda Lei" tone="amber" icon={Layers}>
                <Paragraph>
                  O peso é a força gravitacional que a Terra, ou outro astro, exerce sobre
                  um corpo. Ele não é massa. Massa é propriedade do corpo. Peso é força.
                </Paragraph>

                <Paragraph>
                  A fórmula do peso aparece porque, na queda livre ideal, desprezando a
                  resistência do ar, a única força sobre o corpo é a força gravitacional.
                  Como a aceleração de queda livre é{" "}
                  <InlineFormulaBox formula={String.raw`\vec{g}`} />, a força gravitacional
                  fica:
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep title="Forma vetorial" formula={String.raw`\vec{P} = m\vec{g}`} tone="blue" />
                  <FormulaStep title="Módulo" formula={String.raw`P = mg`} tone="green" />
                </FormulaGrid>

                <NoteBox title="Massa versus peso" tone="red">
                  Massa se mede em kg. Peso se mede em N. Um corpo de massa{" "}
                  <InlineFormulaBox formula={String.raw`70 \ \text{kg}`} /> tem, na Terra
                  com <InlineFormulaBox formula={String.raw`g = 10 \ \text{m/s}^2`} />,
                  peso <InlineFormulaBox formula={String.raw`P = 700 \ \text{N}`} />.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Normal como aplicação da Segunda Lei" tone="blue" icon={Layers}>
                <DiagramCard
                  kind="weightNormal"
                  title="Diagrama visual: peso, normal e pares de interação"
                  caption="Peso e normal podem se equilibrar no mesmo corpo, mas não formam par ação-reação."
                />

                <Paragraph>
                  A normal é a força de contato que uma superfície exerce sobre um corpo.
                  Ela é perpendicular à superfície. A normal não existe simplesmente porque
                  há peso; ela existe porque há compressão entre corpo e superfície.
                </Paragraph>

                <Paragraph>
                  Se a compressão aumenta, a normal aumenta. Se a compressão diminui, a
                  normal diminui. Se o corpo perde contato com a superfície, a normal vira
                  zero.
                </Paragraph>

                <NoteBox title="Regra de ouro" tone="blue">
                  A normal não tem fórmula fixa. Ela deve ser calculada pela Segunda Lei no
                  eixo perpendicular ao contato.
                </NoteBox>

                <DiagramCard
                  kind="elevator"
                  title="Diagrama visual: elevador e peso aparente"
                  caption="A balança mede a normal. Por isso, a leitura muda quando o elevador acelera."
                />

                <FormulaGrid>
                  <FormulaStep
                    title="Superfície horizontal simples"
                    explanation="Sem aceleração vertical e sem outras forças verticais."
                    formula={String.raw`N - mg = 0 \Rightarrow N = mg`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Plano inclinado"
                    explanation="A normal equilibra apenas a componente perpendicular do peso."
                    formula={String.raw`N - mg\cos\theta = 0 \Rightarrow N = mg\cos\theta`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Elevador acelerando para cima"
                    explanation="O piso precisa empurrar mais que o peso."
                    formula={String.raw`N - mg = ma \Rightarrow N = m(g+a)`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Elevador acelerando para baixo"
                    explanation="O piso empurra menos que o peso."
                    formula={String.raw`mg - N = ma \Rightarrow N = m(g-a)`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Queda livre"
                    explanation="Não há contato efetivo com o piso."
                    formula={String.raw`a = g \Rightarrow N = 0`}
                    tone="red"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Tração como aplicação da Segunda Lei" tone="slate" icon={Layers}>
                <Paragraph>
                  A tração é a força transmitida por fios, cordas ou cabos esticados. Em
                  problemas ideais, costuma-se considerar fio sem massa, fio inextensível,
                  polia sem massa e sem atrito.
                </Paragraph>

                <Paragraph>
                  Em um fio ideal, a tração tem o mesmo módulo ao longo do mesmo fio. Mas
                  isso não significa que tração seja sempre igual ao peso. Ela depende da
                  aceleração do corpo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Corpo pendurado em repouso ou MRU"
                    formula={String.raw`T - mg = 0 \Rightarrow T = mg`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Corpo subindo acelerado"
                    formula={String.raw`T - mg = ma \Rightarrow T = m(g+a)`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Corpo descendo acelerado"
                    formula={String.raw`mg - T = ma \Rightarrow T = m(g-a)`}
                    tone="amber"
                  />
                </FormulaGrid>

                <NoteBox title="Erro comum" tone="red">
                  Tração só é igual ao peso em situações específicas. Se há aceleração,
                  geralmente <InlineFormulaBox formula={String.raw`T \neq mg`} />.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Atrito como aplicação da Segunda Lei" tone="amber" icon={Layers}>
                <DiagramCard
                  kind="friction"
                  title="Diagrama visual: direção do atrito"
                  caption="O atrito se opõe à tendência de deslizamento ou ao deslizamento relativo, não necessariamente ao movimento absoluto."
                />

                <Paragraph>
                  O atrito é uma força de contato paralela à superfície. Ele se opõe à
                  tendência de deslizamento relativo entre as superfícies, não necessariamente
                  ao movimento do corpo em relação ao chão.
                </Paragraph>

                <FormulaGrid>
                  <TopicBlock title="Atrito estático" tone="amber">
                    <Paragraph>
                      Atua quando não há deslizamento relativo. Ele se ajusta conforme a
                      necessidade, até um valor máximo.
                    </Paragraph>

                    <FormulaStep
                      title="Relação geral"
                      formula={String.raw`f_e \leq \mu_e N`}
                      tone="amber"
                    />

                    <FormulaStep
                      title="Valor máximo"
                      formula={String.raw`f_{e,\text{máx}} = \mu_e N`}
                      tone="amber"
                    />

                    <NoteBox title="Cuidado" tone="red">
                      A igualdade só vale na iminência de escorregamento.
                    </NoteBox>
                  </TopicBlock>

                  <TopicBlock title="Atrito cinético" tone="blue">
                    <Paragraph>
                      Atua quando já existe deslizamento relativo entre as superfícies.
                    </Paragraph>

                    <FormulaStep
                      title="Atrito cinético"
                      formula={String.raw`f_c = \mu_c N`}
                      tone="blue"
                    />

                    <FormulaStep
                      title="Comparação usual"
                      formula={String.raw`\mu_e > \mu_c`}
                      tone="green"
                    />
                  </TopicBlock>
                </FormulaGrid>

                <NoteBox title="Exemplo importante" tone="green">
                  Ao caminhar, o atrito sobre o pé aponta para frente. O pé tende a escorregar
                  para trás em relação ao chão, então o chão exerce atrito para frente.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Plano inclinado dentro da Segunda Lei" tone="green" icon={Compass}>
                <DiagramCard
                  kind="inclinedPlane"
                  title="Diagrama visual: decomposição do peso no plano inclinado"
                  caption="A força peso continua vertical. Quem muda são os eixos escolhidos para analisar o movimento."
                />

                <Paragraph>
                  No plano inclinado, o peso continua apontando verticalmente para baixo.
                  Mas o movimento costuma ocorrer ao longo da rampa. Por isso, decompomos
                  o peso em duas componentes: uma paralela ao plano e outra perpendicular
                  ao plano.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Componente paralela"
                    explanation="É a parte do peso que tende a fazer o bloco descer a rampa."
                    formula={String.raw`P_{\parallel} = mg\sin\theta`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Componente perpendicular"
                    explanation="É a parte do peso que comprime o bloco contra a superfície."
                    formula={String.raw`P_{\perp} = mg\cos\theta`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Normal"
                    formula={String.raw`N = mg\cos\theta`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Sem atrito"
                    formula={String.raw`mg\sin\theta = ma \Rightarrow a = g\sin\theta`}
                    tone="green"
                  />
                </FormulaGrid>

                <SubTitle>Com atrito cinético, bloco descendo</SubTitle>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <FormulaStep
                    title="Atrito cinético"
                    formula={String.raw`f_c = \mu_c N = \mu_c mg\cos\theta`}
                    tone="amber"
                  />

                  <FormulaStep
                    title="Segunda Lei no eixo paralelo"
                    formula={String.raw`mg\sin\theta - f_c = ma`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Aceleração"
                    formula={String.raw`a = g(\sin\theta - \mu_c\cos\theta)`}
                    tone="purple"
                  />
                </div>

                <SubTitle>Iminência de escorregamento</SubTitle>

                <Paragraph>
                  Na iminência de o bloco começar a escorregar para baixo, o atrito estático
                  aponta para cima da rampa e atinge seu valor máximo.
                </Paragraph>

                <FormulaStep
                  title="Condição do ângulo crítico"
                  formula={String.raw`\mu_e = \tan\theta`}
                  tone="amber"
                />
              </TopicBlock>

              <TopicBlock title="Sistemas de blocos e polias" tone="purple" icon={Layers}>
                <DiagramCard
                  kind="pulley"
                  title="Diagrama visual: blocos, tração e vínculo da corda"
                  caption="Em sistemas com polias, o segredo é fazer um DCL para cada corpo e respeitar os vínculos impostos pela corda."
                />

                <SubTitle>Sistema de dois blocos</SubTitle>

                <Paragraph>
                  Para achar a aceleração de um conjunto, muitas vezes é melhor analisar
                  os corpos como um único sistema. As forças internas se cancelam no sistema
                  completo. Depois, para achar contato ou tração, isolamos um corpo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Aceleração do conjunto"
                    formula={String.raw`a = \frac{F}{m_1 + m_2}`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Força de contato"
                    formula={String.raw`C = m_2a = \frac{m_2F}{m_1 + m_2}`}
                    tone="green"
                  />
                </FormulaGrid>

                <SubTitle>Máquina de Atwood ideal</SubTitle>

                <Paragraph>
                  Dois corpos ligados por fio ideal e polia ideal têm acelerações de mesmo
                  módulo, em sentidos opostos, no caso simples.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Aceleração"
                    formula={String.raw`a = \frac{(m_2 - m_1)g}{m_1 + m_2}`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Tração"
                    formula={String.raw`T = \frac{2m_1m_2g}{m_1 + m_2}`}
                    tone="amber"
                  />
                </FormulaGrid>

                <SubTitle>Vínculo geométrico</SubTitle>

                <Paragraph>
                  Em fios inextensíveis, o comprimento total do fio é constante. Essa
                  restrição gera relações entre deslocamentos, velocidades e acelerações.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Comprimento"
                    formula={String.raw`L = x_1 + x_2 + \text{constante}`}
                    tone="blue"
                  />
                  <FormulaStep title="Velocidades" formula={String.raw`v_1 + v_2 = 0`} tone="green" />
                  <FormulaStep title="Acelerações" formula={String.raw`a_1 + a_2 = 0`} tone="purple" />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Gráficos dentro da Segunda Lei" tone="blue" icon={Activity}>
                <Paragraph>
                  Se a massa é constante, força resultante e aceleração são diretamente
                  proporcionais.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Gráfico Fᵣₑₛ × a"
                    explanation="Reta passando pela origem."
                    formula={String.raw`F_{\text{res}} = ma`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Coeficiente angular"
                    explanation="Se F está no eixo vertical e a no horizontal, a inclinação é a massa."
                    formula={String.raw`m = \frac{\Delta F_{\text{res}}}{\Delta a}`}
                    tone="green"
                  />

                  <FormulaStep
                    title="Gráfico a × Fᵣₑₛ"
                    explanation="Se a está no eixo vertical e F no horizontal, a inclinação é o inverso da massa."
                    formula={String.raw`a = \frac{1}{m}F_{\text{res}}`}
                    tone="purple"
                  />

                  <FormulaStep
                    title="Ponte com gráfico v × t"
                    explanation="A inclinação do gráfico v × t é a aceleração."
                    formula={String.raw`a = \frac{\Delta v}{\Delta t}`}
                    tone="amber"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Como reconhecer a Segunda Lei em questões?" tone="amber" icon={Search}>
                <Paragraph>
                  A Segunda Lei aparece quando a questão envolve aceleração, força resultante,
                  blocos, rampas, atrito, tração, normal, elevadores, polias ou sistemas.
                </Paragraph>

                <BulletList
                  items={[
                    <>“Determine a aceleração...”</>,
                    <>“Determine a força de tração...”</>,
                    <>“Determine a normal...”</>,
                    <>“Um bloco desce um plano inclinado...”</>,
                    <>“Um sistema de blocos é puxado...”</>,
                    <>“O elevador acelera...”</>,
                    <>“Há atrito entre as superfícies...”</>,
                  ]}
                />

                <NoteBox title="O que pensar na hora da prova" tone="amber">
                  Faça o DCL, escolha eixos, some as forças em cada eixo e aplique{" "}
                  <InlineFormulaBox formula={String.raw`\sum F = ma`} />.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Erros comuns na Segunda Lei" tone="rose" icon={AlertTriangle}>
                <FormulaGrid>
                  <NoteBox title="Usar força aplicada no lugar da resultante" tone="red">
                    A aceleração vem da força resultante, não de uma força isolada.
                  </NoteBox>

                  <NoteBox title="Achar que aceleração segue a velocidade" tone="red">
                    A aceleração segue a força resultante, não necessariamente a velocidade.
                  </NoteBox>

                  <NoteBox title="Normal sempre igual a peso" tone="red">
                    Normal depende da situação dinâmica.
                  </NoteBox>

                  <NoteBox title="Tração sempre igual a peso" tone="red">
                    Só em casos específicos de equilíbrio ou MRU.
                  </NoteBox>

                  <NoteBox title="Usar atrito estático como μN sempre" tone="red">
                    Atrito estático se ajusta. A igualdade só vale na iminência.
                  </NoteBox>

                  <NoteBox title="Errar o sentido do atrito" tone="red">
                    Atrito se opõe à tendência de deslizamento relativo.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Pontos para ITA/IME" tone="purple" icon={Target}>
                <Paragraph>
                  Em questões difíceis, a Segunda Lei raramente é difícil pela fórmula. O
                  difícil é modelar o sistema corretamente.
                </Paragraph>

                <BulletList
                  items={[
                    <>Escolha o corpo ou sistema antes de escrever equações.</>,
                    <>Forças internas somem no sistema completo, mas aparecem em corpos isolados.</>,
                    <>Em polias, deduza o vínculo pelo comprimento do fio.</>,
                    <>Em atrito estático, descubra a tendência de escorregamento antes de escolher o sentido.</>,
                    <>
                      Teste casos limites, como{" "}
                      <InlineFormulaBox formula={String.raw`\theta = 0^\circ`} /> e{" "}
                      <InlineFormulaBox formula={String.raw`\theta = 90^\circ`} /> no plano inclinado.
                    </>,
                  ]}
                />
              </TopicBlock>
            </Section>

            <Section
              icon={Scale}
              title="Terceira Lei de Newton — Ação e Reação"
              subtitle="A lei que explica como as forças aparecem em pares durante interações entre corpos."
              gradient="bg-gradient-to-r from-rose-600 to-red-700"
            >
              <TopicBlock title="Por que essa lei foi criada?" tone="rose" icon={History}>
                <Paragraph>
                  A Terceira Lei foi criada para formalizar uma ideia essencial: força não
                  aparece sozinha. Toda força nasce de uma interação entre dois corpos.
                </Paragraph>

                <Paragraph>
                  Se um corpo A interage com um corpo B, então B também interage com A.
                  Essa interação gera um par de forças: uma em cada corpo.
                </Paragraph>

                <NoteBox title="Pergunta central da Terceira Lei" tone="rose">
                  Quando um corpo exerce força sobre outro, o que acontece com o corpo que
                  exerceu essa força?
                </NoteBox>

                <Paragraph>
                  A resposta é: ele também recebe uma força de mesmo módulo, mesma direção
                  e sentido oposto.
                </Paragraph>
              </TopicBlock>
              <TopicBlock title="Ideia intuitiva" tone="blue" icon={Lightbulb}>
                <Paragraph>
                  Quando você empurra uma parede, a parede empurra você. Quando o pé empurra
                  o chão para trás, o chão empurra o pé para frente. Quando a Terra puxa uma
                  pedra, a pedra também puxa a Terra.
                </Paragraph>

                <Paragraph>
                  Parece estranho dizer que a pedra puxa a Terra com a mesma força que a
                  Terra puxa a pedra. Mas isso é exatamente o que a Terceira Lei afirma. A
                  diferença está no efeito produzido em cada corpo, e isso depende da massa.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Enunciado formal e fórmula principal" tone="rose" icon={BookOpen}>
                <blockquote className="border-l-4 border-rose-500 pl-5 py-3 bg-rose-50 rounded-r-xl text-slate-700 italic leading-8">
                  Se um corpo A exerce uma força sobre um corpo B, então o corpo B exerce
                  sobre A uma força de mesma intensidade, mesma direção e sentido oposto.
                </blockquote>

                <FormulaStep
                  title="Terceira Lei de Newton"
                  formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                  tone="red"
                />
              </TopicBlock>

              <TopicBlock title="Explicação termo a termo" tone="slate" icon={Eye}>
                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{F}_{A \to B}`} />
                </SubTitle>

                <Paragraph>
                  Representa a força que o corpo A exerce sobre o corpo B. Portanto, essa
                  força atua em B.
                </Paragraph>

                <SubTitle>
                  O termo <InlineFormulaBox formula={String.raw`\vec{F}_{B \to A}`} />
                </SubTitle>

                <Paragraph>
                  Representa a força que o corpo B exerce sobre o corpo A. Portanto, essa
                  força atua em A.
                </Paragraph>

                <SubTitle>O sinal negativo</SubTitle>

                <Paragraph>
                  Indica que as forças têm sentidos opostos. Não significa que uma é “menor”
                  ou “menos importante”.
                </Paragraph>

                <FormulaStep
                  title="Mesmo módulo"
                  formula={String.raw`|\vec{F}_{A \to B}| = |\vec{F}_{B \to A}|`}
                  tone="purple"
                />

                <BulletList
                  items={[
                    <>mesmo módulo;</>,
                    <>mesma direção;</>,
                    <>sentidos opostos;</>,
                    <>corpos diferentes;</>,
                    <>mesma natureza;</>,
                    <>forças simultâneas.</>,
                  ]}
                />
              </TopicBlock>

              <TopicBlock title="Por que os efeitos podem ser diferentes?" tone="purple" icon={Brain}>
                <Paragraph>
                  A Terceira Lei diz que as forças têm mesmo módulo. Mas a Segunda Lei diz
                  que a aceleração depende da massa. Então dois corpos podem sentir forças
                  iguais e ter acelerações muito diferentes.
                </Paragraph>

                <FormulaStep
                  title="Conexão com a Segunda Lei"
                  formula={String.raw`a = \frac{F}{m}`}
                  tone="purple"
                />

                <Paragraph>
                  A Terra puxa uma pedra para baixo. A pedra puxa a Terra para cima com
                  força de mesmo módulo. Mas a massa da Terra é gigantesca, então sua
                  aceleração é praticamente imperceptível. A pedra, com massa pequena,
                  acelera muito mais.
                </Paragraph>

                <NoteBox title="Resumo da ideia" tone="purple">
                  Mesma força não significa mesma aceleração. A aceleração depende da massa.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Peso e normal: a confusão clássica" tone="rose" icon={AlertTriangle}>
                <DiagramCard
                  kind="actionReaction"
                  title="Diagrama visual: Terceira Lei em corpos diferentes"
                  caption="Ação e reação têm mesmo módulo e sentidos opostos, mas atuam em corpos diferentes."
                />

                <Paragraph>
                  Peso e normal frequentemente têm mesmo módulo em uma superfície horizontal
                  simples, mas isso não faz deles um par de ação e reação.
                </Paragraph>

                <FormulaGrid>
                  <NoteBox title="Peso" tone="blue">
                    Peso é a força da Terra sobre o corpo:
                    <InlineFormulaBox formula={String.raw`\vec{P}_{\text{Terra} \to \text{corpo}}`} />.
                  </NoteBox>

                  <NoteBox title="Reação ao peso" tone="green">
                    A reação ao peso é a força do corpo sobre a Terra:
                    <InlineFormulaBox formula={String.raw`\vec{P}_{\text{corpo} \to \text{Terra}}`} />.
                  </NoteBox>

                  <NoteBox title="Normal" tone="purple">
                    Normal é a força da superfície sobre o corpo:
                    <InlineFormulaBox formula={String.raw`\vec{N}_{\text{ ao peso é a força do corpo sobre a Terra:
                    <InlineFormulaBox formula={String.raw`\vec{P}_{\text{corpo} \to \text{Terra}}superfície} \to \text{corpo}}`} />.
                  </NoteBox>

                  <NoteBox title="Reação à normal" tone="amber">
                    A reação à normal é a força do corpo sobre a superfície:
                    <InlineFormulaBox formula={String.raw`\vec{N}_{\text{corpo} \to \text{superfície}}`} />.
                  </NoteBox>
                </FormulaGrid>

                <NoteBox title="Por que peso e normal não são ação e reação?" tone="red">
                  Porque peso e normal atuam no mesmo corpo. Pares de ação e reação atuam
                  em corpos diferentes.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Forças internas e externas" tone="slate" icon={Layers}>
                <Paragraph>
                  Quando analisamos um sistema formado por vários corpos, forças trocadas
                  entre partes do próprio sistema são forças internas. Elas aparecem em
                  pares de ação e reação e se cancelam quando analisamos o sistema completo.
                </Paragraph>

                <FormulaGrid>
                  <FormulaStep
                    title="Par interno"
                    formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                    tone="blue"
                  />

                  <FormulaStep
                    title="Cancelamento no sistema A+B"
                    formula={String.raw`\vec{F}_{A \to B} + \vec{F}_{B \to A} = \vec{0}`}
                    tone="green"
                  />
                </FormulaGrid>

                <NoteBox title="Estratégia de resolução" tone="blue">
                  Para achar a aceleração do conjunto, analise o sistema completo. Para
                  achar forças internas, como contato ou tração, isole um corpo.
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Aplicações práticas" tone="blue" icon={Rocket}>
                <FormulaGrid>
                  <NoteBox title="Caminhar" tone="green">
                    O pé empurra o chão para trás. O chão empurra o pé para frente por
                    atrito estático.
                  </NoteBox>

                  <NoteBox title="Carro acelerando" tone="blue">
                    O pneu empurra o chão para trás. O chão empurra o pneu para frente.
                  </NoteBox>

                  <NoteBox title="Salto" tone="purple">
                    O atleta empurra o chão para baixo. O chão empurra o atleta para cima.
                  </NoteBox>

                  <NoteBox title="Livro na mesa" tone="amber">
                    O livro empurra a mesa para baixo. A mesa empurra o livro para cima.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Como reconhecer a Terceira Lei em questões?" tone="amber" icon={Search}>
                <Paragraph>
                  A Terceira Lei aparece quando a questão fala de interação entre corpos,
                  pares de força, ação e reação, força de contato, forças internas ou
                  comparação entre forças exercidas por dois corpos.
                </Paragraph>

                <BulletList
                  items={[
                    <>“Qual é o par de ação e reação?”</>,
                    <>“A força que A faz em B...”</>,
                    <>“A força que o chão faz no corpo...”</>,
                    <>“Por que o carro anda?”</>,
                    <>“Por que peso e normal não são ação e reação?”</>,
                    <>“As forças internas se cancelam?”</>,
                  ]}
                />

                <NoteBox title="O que pensar na prova" tone="amber">
                  Pergunte sempre: essa força atua em qual corpo? O par dela atua em qual
                  outro corpo?
                </NoteBox>
              </TopicBlock>

              <TopicBlock title="Erros comuns na Terceira Lei" tone="rose" icon={AlertTriangle}>
                <FormulaGrid>
                  <NoteBox title="Colocar ação e reação no mesmo DCL" tone="red">
                    Errado. Ação e reação atuam em corpos diferentes.
                  </NoteBox>

                  <NoteBox title="Achar que peso e normal são ação e reação" tone="red">
                    Errado. Peso e normal atuam no mesmo corpo.
                  </NoteBox>

                  <NoteBox title="Achar que o corpo maior faz força maior" tone="red">
                    Errado. As forças têm mesmo módulo. Os efeitos mudam por causa das
                    massas.
                  </NoteBox>

                  <NoteBox title="Achar que ação vem antes da reação" tone="red">
                    Errado. Ação e reação são simultâneas.
                  </NoteBox>
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Pontos para ITA/IME" tone="purple" icon={Target}>
                <Paragraph>
                  Em provas difíceis, a Terceira Lei aparece principalmente em sistemas de
                  corpos, contato entre blocos, forças internas, centro de massa e vínculos.
                  O aluno bom sabe escolher o sistema. O aluno que só decorou fórmula fica
                  desenhando força duplicada no mesmo corpo, um verdadeiro crime vetorial.
                </Paragraph>

                <NoteBox title="Regra mental" tone="purple">
                  Ação e reação têm mesmo módulo, mas nunca atuam no mesmo corpo. Se você
                  colocou as duas no mesmo DCL, tem algo errado.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={Rocket}
              title="Como as três leis trabalham juntas"
              subtitle="Em questão real, elas aparecem misturadas. A prova não avisa educadamente qual lei usar, obviamente."
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <TopicBlock title="Exemplo conceitual: carro freando" tone="blue" icon={Layers}>
                <Paragraph>
                  Pela Primeira Lei, o passageiro tende a manter seu movimento quando o carro
                  freia. Pela Segunda Lei, o cinto exerce força resultante para desacelerar
                  o corpo. Pela Terceira Lei, o corpo também exerce força sobre o cinto.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Exemplo conceitual: plano inclinado" tone="green" icon={Layers}>
                <Paragraph>
                  A Segunda Lei calcula a aceleração ao longo da rampa. A Primeira Lei
                  aparece se o bloco está em equilíbrio. A Terceira Lei aparece no contato
                  entre bloco e superfície.
                </Paragraph>
              </TopicBlock>

              <TopicBlock title="Exemplo conceitual: sistema de blocos" tone="purple" icon={Layers}>
                <Paragraph>
                  A Segunda Lei calcula a aceleração do sistema. A Terceira Lei explica as
                  forças internas entre os blocos. A Primeira Lei aparece se o conjunto está
                  em equilíbrio ou MRU.
                </Paragraph>
              </TopicBlock>
            </Section>
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-indigo-600" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Exemplos resolvidos
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Resoluções com DCL, força resultante, fórmula e interpretação física.
                  </p>
                </div>
              </div>
            </div>

            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100"
              >
                <button
                  onClick={() => toggleExample(ex.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-black text-slate-900">{ex.title}</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-6">
                      {ex.enunciado}
                    </p>
                  </div>

                  {openExamples[ex.id] ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>

                {openExamples[ex.id] && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-5">
                    {ex.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "resumo" && (
          <div className="space-y-10">
            <Section
              icon={Zap}
              title="Resumo final das Leis de Newton"
              subtitle="A versão compacta, sem virar decoreba de rodapé."
              gradient="bg-gradient-to-r from-indigo-700 to-purple-800"
            >
              <TopicBlock title="Primeira Lei — Inércia" tone="green" icon={Shield}>
                <Paragraph>
                  Se a força resultante sobre um corpo é nula, ele permanece em repouso ou
                  em movimento retilíneo uniforme.
                </Paragraph>

                <FormulaStep
                  title="Condição"
                  formula={String.raw`\vec{F}_{\text{res}} = \vec{0} \Rightarrow \vec{a} = \vec{0} \Rightarrow \vec{v} = \text{constante}`}
                  tone="green"
                />

                <NoteBox title="Ideia" tone="green">
                  Força resultante não mantém movimento. Força resultante altera movimento.
                </NoteBox>
              </TopicBlock>

              <TopicBlock
                title="Segunda Lei — Força resultante e aceleração"
                tone="indigo"
                icon={Calculator}
              >
                <Paragraph>
                  Se sobra força resultante, o corpo acelera. A aceleração depende da força
                  resultante e da massa.
                </Paragraph>

                <FormulaStep
                  title="Equação central"
                  formula={String.raw`\vec{F}_{\text{res}} = m\vec{a}`}
                  tone="blue"
                />

                <FormulaGrid>
                  <FormulaStep title="Peso" formula={String.raw`P = mg`} tone="amber" />
                  <FormulaStep
                    title="Normal no plano inclinado"
                    formula={String.raw`N = mg\cos\theta`}
                    tone="blue"
                  />
                  <FormulaStep
                    title="Atrito estático"
                    formula={String.raw`f_e \leq \mu_e N`}
                    tone="amber"
                  />
                  <FormulaStep
                    title="Atrito cinético"
                    formula={String.raw`f_c = \mu_c N`}
                    tone="green"
                  />
                  <FormulaStep
                    title="Plano sem atrito"
                    formula={String.raw`a = g\sin\theta`}
                    tone="purple"
                  />
                  <FormulaStep
                    title="Elevador"
                    formula={String.raw`N = m(g \pm a)`}
                    tone="blue"
                  />
                </FormulaGrid>
              </TopicBlock>

              <TopicBlock title="Terceira Lei — Ação e reação" tone="rose" icon={Scale}>
                <Paragraph>
                  Toda força nasce de uma interação entre dois corpos. Se A exerce força em
                  B, B exerce força em A.
                </Paragraph>

                <FormulaStep
                  title="Par de ação e reação"
                  formula={String.raw`\vec{F}_{A \to B} = -\vec{F}_{B \to A}`}
                  tone="red"
                />

                <NoteBox title="Ideia" tone="rose">
                  As forças têm mesmo módulo, mesma direção, sentidos opostos e atuam em
                  corpos diferentes.
                </NoteBox>
              </TopicBlock>
            </Section>

            <Section
              icon={AlertTriangle}
              title="Erros comuns"
              subtitle="A coleção de pequenas tragédias que derrubam aluno em Dinâmica."
              gradient="bg-gradient-to-r from-red-600 to-rose-700"
            >
              <FormulaGrid>
                <NoteBox title="Primeira Lei: força mantém movimento" tone="red">
                  Errado. Força resultante altera movimento.
                </NoteBox>

                <NoteBox title="Primeira Lei: equilíbrio é só repouso" tone="red">
                  Errado. MRU também é equilíbrio.
                </NoteBox>

                <NoteBox title="Segunda Lei: força aplicada igual à resultante" tone="red">
                  Errado. Resultante é soma vetorial.
                </NoteBox>

                <NoteBox title="Segunda Lei: normal sempre igual ao peso" tone="red">
                  Errado. Normal depende da compressão e da aceleração perpendicular.
                </NoteBox>

                <NoteBox title="Segunda Lei: atrito estático sempre μN" tone="red">
                  Errado. Atrito estático se ajusta até um máximo.
                </NoteBox>

                <NoteBox title="Terceira Lei: peso e normal são ação e reação" tone="red">
                  Errado. Eles atuam no mesmo corpo.
                </NoteBox>

                <NoteBox title="Terceira Lei: ação e reação no mesmo DCL" tone="red">
                  Errado. Elas atuam em corpos diferentes.
                </NoteBox>

                <NoteBox title="Polias: assumir acelerações iguais sempre" tone="red">
                  Errado. O vínculo depende da geometria do fio.
                </NoteBox>
              </FormulaGrid>
            </Section>

            <Section
              icon={ListChecks}
              title="Checklist para resolver questões"
              subtitle="Antes de sair jogando fórmula como se fosse confete matemático."
              gradient="bg-gradient-to-r from-emerald-700 to-green-800"
            >
              <NumberedSteps
                items={[
                  <>Qual corpo ou sistema estou analisando?</>,
                  <>Quais forças atuam nesse corpo?</>,
                  <>Quem exerce cada força?</>,
                  <>Há forças internas que somem no sistema completo?</>,
                  <>Qual é a força resultante em cada eixo?</>,
                  <>Existe vínculo de fio, polia ou contato?</>,
                  <>A aceleração aponta no sentido da resultante?</>,
                  <>A resposta faz sentido nos casos limites?</>,
                ]}
              />
            </Section>

            <Section
              icon={Target}
              title="Frase final para guardar"
              gradient="bg-gradient-to-r from-slate-700 to-slate-900"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-7 text-center shadow-inner">
                <p className="text-slate-900 text-2xl font-black">
                  A fórmula é curta.
                </p>
                <p className="text-green-700 text-2xl font-black mt-1">
                  O raciocínio físico é onde a questão é vencida.
                </p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
