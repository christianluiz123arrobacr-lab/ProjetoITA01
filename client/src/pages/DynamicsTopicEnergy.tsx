import { useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BatteryCharging,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Compass,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  Mountain,
  Repeat,
  Rocket,
  Scale,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success" | "dark" | "danger";

type DiagramKind =
  | "workAngle"
  | "workSigns"
  | "kineticTheorem"
  | "energyBars"
  | "dissipation"
  | "forceGraph"
  | "spring"
  | "power"
  | "inclinedEnergy"
  | "normalWork";

type DiagramData = {
  kind: DiagramKind;
  title: string;
  caption: string;
};

type EquationPanelData = {
  title: string;
  formula: string;
  terms: string[];
  interpretation: string[];
  derivation?: {
    title: string;
    paragraphs?: string[];
    formulas?: string[];
  }[];
};

type TheorySection = {
  id: string;
  icon: ElementType;
  title: string;
  accent: string;
  intro: string[];
  diagram?: DiagramData;
  equations?: EquationPanelData[];
  bullets?: string[];
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
  solution: ReactNode;
};

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
};

function MathDisplay({ formula }: { formula: string }) {
  return (
    <div className="text-slate-100 [&_.katex]:text-slate-100 [&_.katex-display]:my-0">
      <MathFormula formula={formula} display={true} />
    </div>
  );
}

function InlineFormula({ formula }: { formula: string }) {
  return (
    <span className="mx-1 inline-flex items-center rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 align-middle text-slate-100 [&_.katex]:text-slate-100">
      <MathFormula formula={formula} />
    </span>
  );
}

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
      <MathDisplay formula={formula} />
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

      <div className="space-y-7 p-6 leading-8 text-slate-700 md:p-8">
        {children}
      </div>
    </section>
  );
}

function ConnectedText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-sm md:p-7">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-600 via-blue-500 to-cyan-400" />
      <div className="space-y-5 pl-3 leading-8 text-slate-700 md:pl-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
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
    info: "border-indigo-200 bg-indigo-50 text-indigo-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    danger: "border-red-200 bg-red-50 text-red-950",
    dark: "border-slate-800 bg-slate-950 text-slate-200",
  };

  const Icon =
    type === "warning" ? AlertTriangle : type === "danger" ? AlertTriangle : type === "success" ? Target : Lightbulb;

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
          <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MiniInfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-800/55 p-5">
      <h4 className="mb-3 text-base font-black text-blue-300">{title}</h4>
      <div className="space-y-3 text-sm leading-7 text-slate-300">{children}</div>
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
            {panel.interpretation.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MiniInfoCard>
      </div>

      {panel.derivation && (
        <div className="mt-8 border-t border-slate-700 pt-8">
          <h4 className="mb-5 text-base font-black text-blue-300 md:text-lg">
            Dedução física e interpretação
          </h4>

          <div className="space-y-4">
            {panel.derivation.map((step, index) => (
              <div key={index} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                <h5 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-blue-300">
                  {step.title}
                </h5>
                <div className="space-y-4 text-sm leading-7 text-slate-300 [&_.katex]:text-slate-100">
                  {step.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                  {step.formulas?.map((formula, formulaIndex) => (
                    <MathFormula key={formulaIndex} formula={formula} display={true} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
    <section className={`relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-gradient-to-br ${accent} p-6 shadow-[0_18px_55px_rgba(15,23,42,0.18)] md:p-8`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.16),transparent_32%)]" />
      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-300">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">{description}</p>
      </div>
    </section>
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
            <p className="mt-2 text-sm leading-7 text-slate-600">{example.statement}</p>
          </div>
          <div className="shrink-0 rounded-full bg-slate-950 p-2 text-white">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {open && <div className="space-y-5 border-t border-slate-100 p-6 leading-8 text-slate-700 md:p-7">{example.solution}</div>}
    </article>
  );
}

function DiagramCard({ diagram }: { diagram: DiagramData }) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">{diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[760px]">
          {diagram.kind === "workAngle" && <WorkAngleDiagram />}
          {diagram.kind === "workSigns" && <WorkSignsDiagram />}
          {diagram.kind === "kineticTheorem" && <KineticTheoremDiagram />}
          {diagram.kind === "energyBars" && <EnergyBarsDiagram />}
          {diagram.kind === "dissipation" && <DissipationDiagram />}
          {diagram.kind === "forceGraph" && <ForceGraphDiagram />}
          {diagram.kind === "spring" && <SpringDiagram />}
          {diagram.kind === "power" && <PowerDiagram />}
          {diagram.kind === "inclinedEnergy" && <InclinedEnergyDiagram />}
          {diagram.kind === "normalWork" && <NormalWorkDiagram />}
        </div>
      </div>
    </div>
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
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${ax1} ${ay1} L ${ax2} ${ay2} Z`} fill={color} />
    </>
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

function Block({ x, y, fill = "#dbeafe", label = "m" }: { x: number; y: number; fill?: string; label?: string }) {
  return (
    <>
      <rect x={x} y={y} width="96" height="64" rx="14" fill={fill} stroke="#0f172a" strokeWidth="4" />
      <text x={x + 48} y={y + 39} textAnchor="middle" className="fill-slate-950 text-[22px] font-black">
        {label}
      </text>
    </>
  );
}

function Bar({ x, y, height, fill, label, value }: { x: number; y: number; height: number; fill: string; label: string; value: string }) {
  return (
    <>
      <rect x={x} y={y + (150 - height)} width="54" height={height} rx="8" fill={fill} stroke="#0f172a" strokeWidth="3" />
      <text x={x + 27} y={y + 180} textAnchor="middle" className="fill-slate-950 text-[15px] font-black">
        {label}
      </text>
      <text x={x + 27} y={y + 202} textAnchor="middle" className="fill-slate-600 text-[13px] font-bold">
        {value}
      </text>
    </>
  );
}

function WorkAngleDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="h-[360px] w-full">
      <rect x="18" y="18" width="764" height="324" rx="26" fill="#ffffff" />
      <line x1="95" y1="260" x2="705" y2="260" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={290} y={196} fill="#dbeafe" label="m" />
      <Arrow x1={338} y1={190} x2={520} y2={98} color="#2563eb" />
      <Arrow x1={338} y1={228} x2={555} y2={228} color="#16a34a" />
      <Arrow x1={338} y1={228} x2={338} y2={118} color="#f59e0b" width={4} />
      <Arrow x1={240} y1={286} x2={570} y2={286} color="#0f172a" width={4} />
      <path d="M 390 228 A 55 55 0 0 0 386 203" fill="none" stroke="#0f172a" strokeWidth="3" />
      <SvgLabel x={438} y={91} tone="blue">F</SvgLabel>
      <SvgLabel x={475} y={214} tone="green">F cos θ</SvgLabel>
      <SvgLabel x={318} y={107} tone="amber">F sen θ</SvgLabel>
      <SvgLabel x={405} y={206}>θ</SvgLabel>
      <SvgLabel x={405} y={320}>deslocamento d</SvgLabel>
      <SvgLabel x={400} y={62}>só a componente paralela ao deslocamento realiza trabalho</SvgLabel>
    </svg>
  );
}

function WorkSignsDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="h-[360px] w-full">
      <rect x="18" y="18" width="764" height="324" rx="26" fill="#ffffff" />
      {[125, 390, 655].map((x) => (
        <line key={x} x1={x - 95} y1="245" x2={x + 95} y2="245" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      ))}
      <Block x={80} y={181} fill="#dcfce7" label="m" />
      <Arrow x1={128} y1={170} x2={205} y2={170} color="#16a34a" />
      <Arrow x1={128} y1={218} x2={205} y2={218} color="#0f172a" width={4} />
      <SvgLabel x={165} y={154} tone="green">F</SvgLabel>
      <SvgLabel x={165} y={285} tone="green">W positivo</SvgLabel>
      <SvgLabel x={165} y={310}>força ajuda o movimento</SvgLabel>

      <Block x={345} y={181} fill="#fee2e2" label="m" />
      <Arrow x1={393} y1={170} x2={316} y2={170} color="#dc2626" />
      <Arrow x1={393} y1={218} x2={470} y2={218} color="#0f172a" width={4} />
      <SvgLabel x={350} y={154} tone="red">F</SvgLabel>
      <SvgLabel x={390} y={285} tone="red">W negativo</SvgLabel>
      <SvgLabel x={390} y={310}>força retira energia cinética</SvgLabel>

      <Block x={610} y={181} fill="#e0f2fe" label="m" />
      <Arrow x1={658} y1={220} x2={735} y2={220} color="#0f172a" width={4} />
      <Arrow x1={658} y1={205} x2={658} y2={115} color="#2563eb" />
      <SvgLabel x={685} y={110} tone="blue">F</SvgLabel>
      <SvgLabel x={655} y={285} tone="blue">W nulo</SvgLabel>
      <SvgLabel x={655} y={310}>força perpendicular</SvgLabel>
      <SvgLabel x={400} y={62}>o sinal do trabalho depende do ângulo entre força e deslocamento</SvgLabel>
    </svg>
  );
}

function KineticTheoremDiagram() {
  return (
    <svg viewBox="0 0 800 340" className="h-[340px] w-full">
      <rect x="18" y="18" width="764" height="304" rx="26" fill="#ffffff" />
      <Block x={120} y={190} fill="#dbeafe" label="vᵢ" />
      <Block x={575} y={150} fill="#dcfce7" label="v𝒇" />
      <Arrow x1={220} y1={222} x2={560} y2={182} color="#2563eb" width={6} />
      <Arrow x1={310} y1={250} x2={490} y2={250} color="#16a34a" />
      <SvgLabel x={400} y={143} tone="blue">trabalho resultante</SvgLabel>
      <SvgLabel x={400} y={272} tone="green">transferência de energia para o movimento</SvgLabel>
      <SvgLabel x={160} y={290}>energia cinética inicial</SvgLabel>
      <SvgLabel x={620} y={290}>energia cinética final</SvgLabel>
      <SvgLabel x={400} y={64}>Wres mede exatamente quanto a energia cinética mudou</SvgLabel>
    </svg>
  );
}

function EnergyBarsDiagram() {
  return (
    <svg viewBox="0 0 800 390" className="h-[390px] w-full">
      <rect x="18" y="18" width="764" height="354" rx="26" fill="#ffffff" />
      <path d="M 90 300 C 210 190, 310 100, 420 110 C 540 120, 610 230, 710 300" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
      <circle cx="190" cy="210" r="20" fill="#2563eb" stroke="#0f172a" strokeWidth="3" />
      <circle cx="420" cy="110" r="20" fill="#2563eb" stroke="#0f172a" strokeWidth="3" />
      <circle cx="630" cy="250" r="20" fill="#2563eb" stroke="#0f172a" strokeWidth="3" />
      <Bar x={105} y={64} height={105} fill="#f59e0b" label="Ep" value="maior" />
      <Bar x={165} y={64} height={45} fill="#16a34a" label="Ec" value="menor" />
      <Bar x={335} y={64} height={140} fill="#f59e0b" label="Ep" value="máx." />
      <Bar x={395} y={64} height={15} fill="#16a34a" label="Ec" value="mín." />
      <Bar x={565} y={64} height={55} fill="#f59e0b" label="Ep" value="menor" />
      <Bar x={625} y={64} height={95} fill="#16a34a" label="Ec" value="maior" />
      <SvgLabel x={400} y={340}>sem dissipação: a soma Ec + Ep permanece constante</SvgLabel>
    </svg>
  );
}

function DissipationDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="h-[360px] w-full">
      <rect x="18" y="18" width="764" height="324" rx="26" fill="#ffffff" />
      <Bar x={130} y={80} height={145} fill="#2563eb" label="Em,i" value="inicial" />
      <Arrow x1={250} y1={180} x2={365} y2={180} color="#0f172a" />
      <Bar x={420} y={80} height={85} fill="#16a34a" label="Em,f" value="final" />
      <Bar x={485} y={80} height={58} fill="#ef4444" label="Eth" value="calor" />
      <path d="M 575 175 C 610 125, 650 215, 690 160" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" />
      <SvgLabel x={250} y={105}>atrito</SvgLabel>
      <SvgLabel x={510} y={285} tone="red">energia mecânica não some: parte vira energia interna/térmica</SvgLabel>
      <SvgLabel x={400} y={58}>forças dissipativas reduzem a energia mecânica</SvgLabel>
    </svg>
  );
}

function ForceGraphDiagram() {
  return (
    <svg viewBox="0 0 800 390" className="h-[390px] w-full">
      <rect x="18" y="18" width="764" height="354" rx="26" fill="#ffffff" />
      <line x1="100" y1="300" x2="700" y2="300" stroke="#0f172a" strokeWidth="4" />
      <line x1="100" y1="300" x2="100" y2="70" stroke="#0f172a" strokeWidth="4" />
      <text x="88" y="65" className="fill-slate-950 text-[18px] font-black">F</text>
      <text x="710" y="307" className="fill-slate-950 text-[18px] font-black">x</text>
      <rect x="145" y="140" width="150" height="160" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" opacity="0.85" />
      <line x1="145" y1="140" x2="295" y2="140" stroke="#2563eb" strokeWidth="5" />
      <polygon points="395,300 585,300 585,120" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" opacity="0.9" />
      <line x1="395" y1="300" x2="585" y2="120" stroke="#16a34a" strokeWidth="5" />
      <SvgLabel x={220} y={125} tone="blue">força constante</SvgLabel>
      <SvgLabel x={490} y={105} tone="green">força variável</SvgLabel>
      <SvgLabel x={220} y={335}>retângulo: W = Fd</SvgLabel>
      <SvgLabel x={495} y={335}>triângulo: W = área</SvgLabel>
      <SvgLabel x={400} y={55}>a área sob o gráfico F × x representa o trabalho</SvgLabel>
    </svg>
  );
}

function SpringDiagram() {
  return (
    <svg viewBox="0 0 800 350" className="h-[350px] w-full">
      <rect x="18" y="18" width="764" height="314" rx="26" fill="#ffffff" />
      <line x1="80" y1="245" x2="720" y2="245" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <rect x="80" y="130" width="30" height="115" fill="#334155" />
      <path d="M 110 185 C 130 145, 150 225, 170 185 C 190 145, 210 225, 230 185 C 250 145, 270 225, 290 185 C 310 145, 330 225, 350 185" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      <Block x={350} y={153} fill="#fef3c7" label="m" />
      <Arrow x1={398} y1={143} x2={505} y2={143} color="#2563eb" />
      <Arrow x1={398} y1={153} x2={300} y2={153} color="#dc2626" />
      <line x1="350" y1="285" x2="500" y2="285" stroke="#0f172a" strokeWidth="3" strokeDasharray="7 7" />
      <SvgLabel x={425} y={310}>deformação x</SvgLabel>
      <SvgLabel x={535} y={137} tone="blue">força externa</SvgLabel>
      <SvgLabel x={282} y={137} tone="red">força elástica</SvgLabel>
      <SvgLabel x={400} y={65}>a energia elástica cresce com o quadrado da deformação</SvgLabel>
    </svg>
  );
}

function PowerDiagram() {
  return (
    <svg viewBox="0 0 800 360" className="h-[360px] w-full">
      <rect x="18" y="18" width="764" height="324" rx="26" fill="#ffffff" />
      <line x1="95" y1="280" x2="320" y2="280" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <line x1="480" y1="280" x2="705" y2="280" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <rect x="160" y="215" width="90" height="65" rx="12" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <rect x="545" y="215" width="90" height="65" rx="12" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
      <Arrow x1={205} y1={215} x2={205} y2={110} color="#16a34a" />
      <Arrow x1={590} y1={215} x2={590} y2={110} color="#16a34a" />
      <SvgLabel x={205} y={95} tone="green">mesmo h</SvgLabel>
      <SvgLabel x={590} y={95} tone="green">mesmo h</SvgLabel>
      <SvgLabel x={205} y={315}>tempo maior</SvgLabel>
      <SvgLabel x={590} y={315}>tempo menor</SvgLabel>
      <SvgLabel x={205} y={55} tone="blue">menor potência</SvgLabel>
      <SvgLabel x={590} y={55} tone="red">maior potência</SvgLabel>
      <SvgLabel x={400} y={180}>potência mede rapidez de transferência de energia</SvgLabel>
    </svg>
  );
}

function InclinedEnergyDiagram() {
  return (
    <svg viewBox="0 0 800 410" className="h-[410px] w-full">
      <rect x="18" y="18" width="764" height="374" rx="26" fill="#ffffff" />
      <polygon points="120,320 660,320 660,110" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
      <line x1="120" y1="320" x2="660" y2="110" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(330 238) rotate(-21)">
        <rect x="-48" y="-32" width="96" height="64" rx="14" fill="#dbeafe" stroke="#0f172a" strokeWidth="4" />
        <text x="0" y="8" textAnchor="middle" className="fill-slate-950 text-[22px] font-black">m</text>
      </g>
      <Arrow x1={330} y1={238} x2={258} y2={267} color="#ef4444" />
      <Arrow x1={330} y1={238} x2={410} y2={207} color="#16a34a" />
      <line x1="665" y1="110" x2="665" y2="320" stroke="#2563eb" strokeWidth="4" strokeDasharray="8 8" />
      <SvgLabel x={698} y={220} tone="blue">h</SvgLabel>
      <SvgLabel x={242} y={280} tone="red">atrito</SvgLabel>
      <SvgLabel x={445} y={200} tone="green">deslocamento</SvgLabel>
      <SvgLabel x={405} y={360}>com atrito: parte da energia mecânica é dissipada</SvgLabel>
      <SvgLabel x={400} y={62}>energia resolve muitos problemas sem precisar calcular o tempo</SvgLabel>
    </svg>
  );
}

function NormalWorkDiagram() {
  return (
    <svg viewBox="0 0 800 340" className="h-[340px] w-full">
      <rect x="18" y="18" width="764" height="304" rx="26" fill="#ffffff" />
      <line x1="100" y1="245" x2="700" y2="245" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <Block x={345} y={181} fill="#dbeafe" label="m" />
      <Arrow x1={393} y1={181} x2={393} y2={92} color="#2563eb" />
      <Arrow x1={393} y1={213} x2={540} y2={213} color="#0f172a" width={4} />
      <path d="M 435 213 A 45 45 0 0 0 393 168" fill="none" stroke="#0f172a" strokeWidth="3" />
      <SvgLabel x={420} y={82} tone="blue">N</SvgLabel>
      <SvgLabel x={485} y={203}>d</SvgLabel>
      <SvgLabel x={460} y={165}>90°</SvgLabel>
      <SvgLabel x={400} y={285}>em superfície fixa e horizontal, a normal é perpendicular ao deslocamento</SvgLabel>
      <SvgLabel x={400} y={62}>por isso, nesse caso, o trabalho da normal é nulo</SvgLabel>
    </svg>
  );
}

const theorySections: TheorySection[] = [
  {
    id: "contexto",
    icon: BookOpen,
    title: "Contexto físico e ideia central",
    accent: "from-indigo-600 to-purple-700",
    intro: [
      "Trabalho e Energia é uma das partes mais inteligentes da Dinâmica porque muda a pergunta do problema. Em vez de perguntar detalhadamente como a força atua a cada instante, muitas vezes perguntamos apenas quanto de energia foi transferida entre dois estados. Isso permite resolver situações em que o caminho é complicado, o tempo não aparece ou as forças variam ao longo do deslocamento.",
      "A ideia física por trás do conteúdo é simples, mas poderosa: forças podem transferir energia para um corpo ou retirar energia dele. Quando uma força atua sobre um corpo e há deslocamento na direção dessa força, dizemos que essa força realiza trabalho. Esse trabalho altera alguma forma de energia do sistema, como energia cinética, energia potencial gravitacional, energia potencial elástica ou energia interna associada a dissipações.",
      "O grande erro é tratar trabalho como apenas mais uma fórmula. Trabalho não é um objeto, não é força, não é energia guardada no corpo. Trabalho é um processo de transferência de energia. Se a força ajuda o deslocamento, ela transfere energia para o movimento. Se a força se opõe ao deslocamento, ela retira energia cinética ou transforma energia mecânica em outra forma. Se a força é perpendicular ao deslocamento, ela não realiza trabalho naquele deslocamento específico.",
      "Por isso, este assunto conecta Dinâmica, Cinemática e Conservação de Energia. A Segunda Lei diz que força resultante produz aceleração. O Teorema da Energia Cinética diz que o trabalho da força resultante mede a variação da energia cinética. São duas formas diferentes de olhar para a mesma física. Uma olha força e aceleração; a outra olha transferência de energia entre estados.",
    ],
    bullets: [
      "Força é uma interação entre corpos.",
      "Trabalho é transferência de energia por uma força ao longo de um deslocamento.",
      "Energia cinética está ligada ao movimento.",
      "Energia potencial está ligada à configuração do sistema.",
      "Energia mecânica é a soma das energias cinética e potencial.",
      "Potência mede a rapidez com que energia é transferida ou transformada.",
    ],
  },
  {
    id: "trabalho",
    icon: Zap,
    title: "Trabalho de uma força constante",
    accent: "from-blue-700 to-cyan-700",
    intro: [
      "O trabalho de uma força constante depende de três coisas: o módulo da força, o módulo do deslocamento e o ângulo entre a força e o deslocamento. Não basta existir força. Também não basta existir deslocamento. Para haver trabalho, precisa existir uma componente da força na direção do deslocamento.",
      "Quando a força aponta exatamente no sentido do deslocamento, ela realiza trabalho positivo. Quando aponta no sentido oposto, realiza trabalho negativo. Quando é perpendicular, o trabalho é nulo. Isso explica por que a força normal, em muitos problemas de bloco sobre superfície fixa, não realiza trabalho: a normal é vertical e o deslocamento é horizontal.",
      "A fórmula não aparece por mágica. Ela nasce da decomposição vetorial da força. Se a força faz um ângulo θ com o deslocamento, apenas a componente paralela ao deslocamento contribui para a transferência de energia. Essa componente vale F cosθ. Multiplicando pela distância percorrida, obtemos o trabalho.",
    ],
    diagram: {
      kind: "workAngle",
      title: "Diagrama visual: componente da força que realiza trabalho",
      caption: "A componente paralela ao deslocamento realiza trabalho. A componente perpendicular não contribui para o trabalho nesse deslocamento.",
    },
    equations: [
      {
        title: "Trabalho de força constante",
        formula: String.raw`W = Fd\cos\theta`,
        terms: [
          "W é o trabalho realizado pela força.",
          "F é o módulo da força aplicada.",
          "d é o módulo do deslocamento.",
          "θ é o ângulo entre a força e o deslocamento.",
        ],
        interpretation: [
          "O produto F cosθ representa a componente da força na direção do deslocamento.",
          "Se θ = 0°, a força ajuda totalmente o deslocamento.",
          "Se θ = 90°, a força é perpendicular e não realiza trabalho.",
          "Se θ = 180°, a força se opõe ao deslocamento e o trabalho é negativo.",
        ],
        derivation: [
          {
            title: "Decomposição da força",
            paragraphs: ["A força pode ser separada em uma componente paralela e uma componente perpendicular ao deslocamento."],
            formulas: [String.raw`F_{\parallel} = F\cos\theta`],
          },
          {
            title: "Trabalho da componente paralela",
            paragraphs: ["Como somente a componente paralela atua na direção do deslocamento, o trabalho é essa componente multiplicada pela distância."],
            formulas: [String.raw`W = F_{\parallel}d`, String.raw`W = Fd\cos\theta`],
          },
        ],
      },
    ],
  },
  {
    id: "sinal",
    icon: Compass,
    title: "Trabalho positivo, negativo e nulo",
    accent: "from-cyan-700 to-emerald-700",
    intro: [
      "O sinal do trabalho é uma das partes mais importantes do conteúdo. Ele indica se a força está transferindo energia para o movimento, retirando energia do movimento ou não alterando diretamente a energia cinética naquele deslocamento.",
      "Trabalho positivo geralmente aumenta a energia cinética do corpo, se estivermos pensando no trabalho resultante. Trabalho negativo geralmente reduz a energia cinética ou transforma energia mecânica em outra forma. Trabalho nulo significa que aquela força específica não transfere energia por meio daquele deslocamento.",
      "A palavra 'geralmente' aparece porque é preciso tomar cuidado: uma força isolada pode fazer trabalho positivo ou negativo, mas o que determina a variação da energia cinética é o trabalho resultante, isto é, a soma dos trabalhos de todas as forças que atuam no corpo.",
    ],
    diagram: {
      kind: "workSigns",
      title: "Diagrama visual: sinal do trabalho",
      caption: "O trabalho depende do ângulo entre força e deslocamento. Esse detalhe salva a alma da questão, coisa rara neste mundo.",
    },
    bullets: [
      "Se 0° ≤ θ < 90°, o trabalho é positivo.",
      "Se θ = 90°, o trabalho é nulo.",
      "Se 90° < θ ≤ 180°, o trabalho é negativo.",
      "Força no mesmo sentido do deslocamento tende a aumentar a energia cinética.",
      "Força no sentido oposto ao deslocamento tende a reduzir a energia cinética.",
      "Força perpendicular ao deslocamento não realiza trabalho nesse deslocamento.",
    ],
    notes: [
      {
        title: "Observações",
        type: "warning",
        body: "Não diga que normal nunca realiza trabalho. Em superfície fixa e deslocamento tangencial, normalmente ela não realiza. Mas se a superfície se move, como em elevadores ou plataformas móveis, a normal pode realizar trabalho.",
      },
    ],
  },
  {
    id: "trabalho-resultante",
    icon: Brain,
    title: "Trabalho resultante e energia cinética",
    accent: "from-emerald-700 to-green-800",
    intro: [
      "O Teorema da Energia Cinética é o coração do capítulo. Ele afirma que o trabalho da força resultante é igual à variação da energia cinética do corpo. Isso significa que a soma energética dos efeitos de todas as forças determina quanto a energia associada ao movimento mudou.",
      "A Segunda Lei diz que força resultante gera aceleração. A aceleração muda a velocidade. E como a energia cinética depende da velocidade, o trabalho da força resultante mede exatamente a variação da energia cinética. É a mesma física vista por outro caminho.",
      "Quando o trabalho resultante é positivo, a energia cinética aumenta. Quando é negativo, diminui. Quando é nulo, a energia cinética permanece constante, mesmo que existam forças atuando. Um corpo em movimento circular uniforme, por exemplo, pode ter força centrípeta, mas a energia cinética fica constante porque a força é perpendicular à velocidade em cada instante.",
    ],
    diagram: {
      kind: "kineticTheorem",
      title: "Diagrama visual: trabalho resultante muda energia cinética",
      caption: "O trabalho resultante é a ponte entre força resultante e mudança no movimento.",
    },
    equations: [
      {
        title: "Teorema da Energia Cinética",
        formula: String.raw`W_{\text{res}} = \Delta E_c`,
        terms: [
          "Wres é o trabalho da força resultante, ou a soma dos trabalhos de todas as forças.",
          "ΔEc é a variação da energia cinética.",
          "Ec depende da massa e do quadrado da velocidade.",
        ],
        interpretation: [
          "Trabalho resultante positivo aumenta Ec.",
          "Trabalho resultante negativo diminui Ec.",
          "Trabalho resultante nulo mantém Ec constante.",
        ],
        derivation: [
          {
            title: "Energia cinética inicial e final",
            formulas: [String.raw`E_{c,i}=\frac{mv_i^2}{2}`, String.raw`E_{c,f}=\frac{mv_f^2}{2}`],
          },
          {
            title: "Variação da energia cinética",
            formulas: [String.raw`\Delta E_c = E_{c,f}-E_{c,i}`, String.raw`\Delta E_c = \frac{m}{2}(v_f^2-v_i^2)`],
          },
          {
            title: "Ligação com Cinemática",
            paragraphs: ["Para força resultante constante na direção do movimento, podemos usar a equação de Torricelli."],
            formulas: [String.raw`v_f^2-v_i^2=2ad`, String.raw`\Delta E_c = \frac{m}{2}\cdot 2ad = mad`],
          },
          {
            title: "Ligação com a Segunda Lei",
            formulas: [String.raw`F_{\text{res}}=ma`, String.raw`\Delta E_c = F_{\text{res}}d = W_{\text{res}}`],
          },
        ],
      },
      {
        title: "Energia cinética",
        formula: String.raw`E_c = \frac{mv^2}{2}`,
        terms: [
          "m é a massa do corpo.",
          "v é o módulo da velocidade.",
          "Ec é sempre não negativa, pois depende de v².",
        ],
        interpretation: [
          "Se a velocidade dobra, a energia cinética quadruplica.",
          "Um corpo parado tem Ec = 0.",
          "Dois corpos com mesma velocidade podem ter energias cinéticas diferentes se tiverem massas diferentes.",
        ],
      },
    ],
  },
  {
    id: "forcas",
    icon: Layers,
    title: "Trabalho das forças mais importantes",
    accent: "from-green-800 to-lime-700",
    intro: [
      "Em questões, não basta saber a fórmula geral do trabalho. É preciso reconhecer como cada força costuma atuar. Peso, normal, atrito, tração e força elástica têm comportamentos diferentes. Algumas são conservativas, outras dissipativas, outras dependem completamente da geometria do problema.",
      "O peso é uma força conservativa: seu trabalho depende apenas da variação de altura. A força elástica ideal também é conservativa: seu trabalho se relaciona à variação da energia potencial elástica. O atrito cinético é dissipativo: geralmente transforma energia mecânica em energia interna e térmica. A normal costuma fazer trabalho nulo em superfícies fixas, mas isso não é uma lei universal escrita em pedra cósmica.",
    ],
    diagram: {
      kind: "normalWork",
      title: "Diagrama visual: quando a normal não realiza trabalho",
      caption: "Se a normal é perpendicular ao deslocamento, o trabalho dela é nulo naquele movimento.",
    },
    equations: [
      {
        title: "Trabalho do peso",
        formula: String.raw`W_P = mg(h_i-h_f)`,
        terms: [
          "m é a massa do corpo.",
          "g é a aceleração da gravidade.",
          "hi é a altura inicial.",
          "hf é a altura final.",
        ],
        interpretation: [
          "Se o corpo desce, hi > hf e o trabalho do peso é positivo.",
          "Se o corpo sobe, hi < hf e o trabalho do peso é negativo.",
          "O trabalho do peso não depende do caminho, apenas da variação de altura.",
        ],
      },
      {
        title: "Trabalho do atrito cinético",
        formula: String.raw`W_{\text{atrito}} = -f_c d`,
        terms: [
          "fc é o módulo do atrito cinético.",
          "d é a distância percorrida enquanto há deslizamento.",
          "O sinal negativo aparece quando o atrito se opõe ao deslocamento.",
        ],
        interpretation: [
          "O atrito cinético geralmente reduz a energia mecânica.",
          "A energia não desaparece; ela é transformada em energia interna/térmica.",
          "Se fc = μcN, então o trabalho depende também da normal.",
        ],
      },
      {
        title: "Trabalho da força elástica",
        formula: String.raw`W_{\text{el}} = -\Delta E_{p,el}`,
        terms: [
          "Wel é o trabalho da força elástica.",
          "ΔEp,el é a variação da energia potencial elástica.",
          "O sinal negativo indica força conservativa.",
        ],
        interpretation: [
          "Quando a mola devolve energia ao corpo, sua energia potencial elástica diminui.",
          "Quando comprimimos ou esticamos a mola contra sua força, armazenamos energia elástica.",
        ],
      },
    ],
  },
  {
    id: "conservacao",
    icon: Repeat,
    title: "Energia mecânica e conservação",
    accent: "from-lime-700 to-amber-700",
    intro: [
      "Energia mecânica é a soma das energias associadas ao movimento e à posição/configuração do sistema. Em muitos problemas de Mecânica, ela aparece como soma da energia cinética com a energia potencial gravitacional e a energia potencial elástica.",
      "Quando apenas forças conservativas realizam trabalho, a energia mecânica se conserva. Isso não significa que energia cinética e energia potencial ficam individualmente constantes. Elas podem trocar entre si. Em uma queda livre sem resistência do ar, a energia potencial gravitacional diminui enquanto a energia cinética aumenta, mantendo a soma constante.",
      "Quando há forças não conservativas, como atrito cinético ou resistência do ar, a energia mecânica não se conserva. Mas a energia total continua se conservando em sentido amplo. A energia mecânica perdida aparece como energia interna, calor, som, deformações ou outras formas menos organizadas. Como sempre, a energia não some; ela só troca de roupa e dificulta a vida do aluno.",
    ],
    diagram: {
      kind: "energyBars",
      title: "Diagrama visual: troca entre energia potencial e cinética",
      caption: "Sem dissipação, a energia mecânica total permanece constante, mas Ec e Ep podem variar bastante.",
    },
    equations: [
      {
        title: "Energia mecânica",
        formula: String.raw`E_m = E_c + E_p`,
        terms: [
          "Em é a energia mecânica.",
          "Ec é a energia cinética.",
          "Ep representa as energias potenciais envolvidas.",
        ],
        interpretation: [
          "A energia mecânica soma movimento e configuração.",
          "Em sistemas sem dissipação, essa soma se mantém constante.",
          "Em sistemas com atrito ou resistência, a energia mecânica diminui, mas a energia total não desaparece.",
        ],
      },
      {
        title: "Conservação da energia mecânica",
        formula: String.raw`E_{m,i}=E_{m,f}`,
        terms: [
          "Em,i é a energia mecânica inicial.",
          "Em,f é a energia mecânica final.",
          "A igualdade vale quando só forças conservativas realizam trabalho.",
        ],
        interpretation: [
          "Esse método resolve problemas sem precisar calcular tempo.",
          "É muito útil em queda, rampas sem atrito, molas e pêndulos ideais.",
          "Antes de usar, verifique se existe dissipação relevante.",
        ],
      },
    ],
  },
  {
    id: "dissipacao",
    icon: Flame,
    title: "Energia mecânica com forças dissipativas",
    accent: "from-amber-700 to-orange-700",
    intro: [
      "Quando forças não conservativas realizam trabalho, a energia mecânica do sistema pode mudar. O atrito cinético é o exemplo mais comum. Ele costuma retirar energia mecânica do sistema e transformá-la em energia interna das superfícies, aquecimento, som e deformações microscópicas.",
      "A frase correta não é 'a energia foi perdida'. A energia mecânica foi reduzida, mas a energia total foi transformada. Essa distinção é importante porque evita uma visão errada da conservação de energia.",
      "Em problemas práticos, uma forma muito útil é escrever que a energia mecânica inicial mais o trabalho das forças não conservativas é igual à energia mecânica final. Se o trabalho dessas forças for negativo, a energia mecânica final será menor que a inicial.",
    ],
    diagram: {
      kind: "dissipation",
      title: "Diagrama visual: dissipação de energia mecânica",
      caption: "O atrito não destrói energia. Ele transforma energia mecânica em formas menos úteis para o movimento macroscópico.",
    },
    equations: [
      {
        title: "Balanço com forças não conservativas",
        formula: String.raw`E_{m,i}+W_{\text{nc}}=E_{m,f}`,
        terms: [
          "Em,i é a energia mecânica inicial.",
          "Wnc é o trabalho das forças não conservativas.",
          "Em,f é a energia mecânica final.",
        ],
        interpretation: [
          "Se Wnc é negativo, a energia mecânica diminui.",
          "Se Wnc é positivo, forças externas podem aumentar a energia mecânica.",
          "Atrito cinético geralmente entra com trabalho negativo.",
        ],
      },
      {
        title: "Variação da energia mecânica",
        formula: String.raw`W_{\text{nc}}=\Delta E_m`,
        terms: [
          "ΔEm é a variação da energia mecânica.",
          "O trabalho não conservativo mede quanto a energia mecânica mudou.",
        ],
        interpretation: [
          "Se o atrito é a única força não conservativa, seu trabalho explica a perda de energia mecânica.",
          "Essa forma é excelente para rampas com atrito e blocos que param após deslizar.",
        ],
      },
    ],
  },
  {
    id: "potenciais",
    icon: Mountain,
    title: "Energia potencial gravitacional e elástica",
    accent: "from-orange-700 to-red-700",
    intro: [
      "Energia potencial é energia associada à configuração de um sistema. No caso gravitacional próximo à superfície da Terra, a configuração relevante é a altura em relação a um nível de referência. No caso elástico, a configuração relevante é a deformação da mola em relação ao comprimento natural.",
      "O nível zero da energia potencial gravitacional é uma escolha. Você pode escolher o chão, a mesa, o ponto mais baixo da trajetória ou outro nível conveniente. O que importa fisicamente é a variação da energia potencial, não o valor absoluto isolado.",
      "A energia potencial elástica cresce com o quadrado da deformação. Isso é crucial: dobrar a compressão de uma mola não dobra a energia armazenada; quadruplica. Essa dependência quadrática aparece porque a força elástica cresce linearmente com a deformação, e a energia corresponde à área sob o gráfico força versus deformação.",
    ],
    diagram: {
      kind: "spring",
      title: "Diagrama visual: mola e energia potencial elástica",
      caption: "A mola armazena energia quando é comprimida ou esticada. Quanto maior a deformação, maior a energia armazenada.",
    },
    equations: [
      {
        title: "Energia potencial gravitacional",
        formula: String.raw`E_{p,g}=mgh`,
        terms: [
          "m é a massa do corpo.",
          "g é a aceleração da gravidade.",
          "h é a altura em relação ao nível de referência escolhido.",
        ],
        interpretation: [
          "A energia potencial gravitacional aumenta com a altura.",
          "O zero de energia potencial é arbitrário.",
          "O trabalho do peso é o oposto da variação da energia potencial gravitacional.",
        ],
      },
      {
        title: "Energia potencial elástica",
        formula: String.raw`E_{p,el}=\frac{kx^2}{2}`,
        terms: [
          "k é a constante elástica da mola.",
          "x é a deformação em relação ao comprimento natural.",
          "Ep,el é sempre não negativa para a mola ideal.",
        ],
        interpretation: [
          "Quanto maior k, mais rígida é a mola e mais energia ela armazena para a mesma deformação.",
          "Como a energia depende de x², compressão e alongamento de mesmo módulo armazenam a mesma energia.",
          "Dobrar x quadruplica a energia elástica.",
        ],
        derivation: [
          {
            title: "Área sob o gráfico F × x",
            paragraphs: ["Na mola ideal, a força elástica tem módulo F = kx. O gráfico F × x é uma reta. A energia armazenada corresponde à área triangular sob essa reta."],
            formulas: [String.raw`E_{p,el}=\frac{\text{base}\cdot\text{altura}}{2}`, String.raw`E_{p,el}=\frac{x\cdot kx}{2}`, String.raw`E_{p,el}=\frac{kx^2}{2}`],
          },
        ],
      },
    ],
  },
  {
    id: "grafico",
    icon: BarChart3,
    title: "Gráfico força × deslocamento",
    accent: "from-red-700 to-rose-700",
    intro: [
      "Quando a força é constante, calcular trabalho com W = Fd cosθ é direto. Mas muitas forças não são constantes. A força elástica, por exemplo, depende da deformação. Em situações assim, o gráfico força versus deslocamento vira uma ferramenta essencial.",
      "A área sob o gráfico F × x representa o trabalho realizado pela força. Se a força está no mesmo sentido do deslocamento, a área entra positiva. Se está no sentido oposto, entra negativa. Para força constante, essa área é um retângulo. Para força elástica, é um triângulo. Para forças variáveis mais complicadas, pode aparecer integral.",
      "Esse tema é querido por provas difíceis porque mistura interpretação gráfica, área geométrica e física. O aluno que só decorou fórmula sofre. O aluno que entende área sob gráfico fica perigosamente funcional, um acontecimento raro e agradável.",
    ],
    diagram: {
      kind: "forceGraph",
      title: "Diagrama visual: área sob o gráfico F × x",
      caption: "A área sob a curva representa o trabalho realizado pela força no deslocamento analisado.",
    },
    equations: [
      {
        title: "Trabalho como área no gráfico F × x",
        formula: String.raw`W=\text{área sob o gráfico }F\times x`,
        terms: [
          "W é o trabalho realizado pela força.",
          "F é a força projetada na direção do deslocamento.",
          "x é a posição ou deformação ao longo do eixo escolhido.",
        ],
        interpretation: [
          "Força constante gera área retangular.",
          "Força elástica gera área triangular.",
          "Força variável geral exige soma de pequenas áreas ou integral.",
        ],
      },
      {
        title: "Trabalho por integral",
        formula: String.raw`W=\int_{x_i}^{x_f}F(x)\,dx`,
        terms: [
          "F(x) é a força como função da posição.",
          "xi e xf são as posições inicial e final.",
          "A integral representa a soma contínua de pequenos trabalhos.",
        ],
        interpretation: [
          "Essa forma é a versão geral da área sob o gráfico.",
          "Em Ensino Médio, muitas vezes a integral aparece como área geométrica.",
        ],
      },
    ],
  },
  {
    id: "potencia",
    icon: Gauge,
    title: "Potência mecânica",
    accent: "from-rose-700 to-purple-800",
    intro: [
      "Potência não é energia. Potência é a rapidez com que energia é transferida ou transformada. Duas máquinas podem realizar o mesmo trabalho, mas a que faz isso em menor tempo tem maior potência.",
      "Se duas pessoas levantam o mesmo bloco até a mesma altura, ambas realizam o mesmo trabalho contra o peso. Mas se uma faz isso em dois segundos e a outra em dez segundos, a primeira tem maior potência média. A energia transferida pode ser a mesma; o ritmo de transferência é diferente.",
      "Em movimentos com força e velocidade na mesma direção, a potência instantânea pode ser escrita como P = Fv. Isso aparece muito em motores, veículos, elevadores, rampas e problemas com velocidade constante sob resistência.",
    ],
    diagram: {
      kind: "power",
      title: "Diagrama visual: mesmo trabalho, potências diferentes",
      caption: "Potência mede rapidez. Fazer o mesmo trabalho em menos tempo exige maior potência média.",
    },
    equations: [
      {
        title: "Potência média",
        formula: String.raw`P_m=\frac{W}{\Delta t}`,
        terms: [
          "Pm é a potência média.",
          "W é o trabalho ou energia transferida.",
          "Δt é o intervalo de tempo.",
        ],
        interpretation: [
          "Para mesmo trabalho, menor tempo significa maior potência.",
          "Para mesmo tempo, maior trabalho significa maior potência.",
          "A unidade no SI é watt: 1 W = 1 J/s.",
        ],
      },
      {
        title: "Potência instantânea em força paralela à velocidade",
        formula: String.raw`P=Fv`,
        terms: [
          "F é a força na direção da velocidade.",
          "v é o módulo da velocidade.",
          "P é a potência instantânea.",
        ],
        interpretation: [
          "Quanto maior a velocidade sob mesma força, maior a potência.",
          "Quanto maior a força sob mesma velocidade, maior a potência.",
          "Se força e velocidade fazem ângulo, usa-se a componente paralela: P = Fv cosθ.",
        ],
      },
    ],
  },
  {
    id: "rampas",
    icon: Mountain,
    title: "Rampas, atrito e energia",
    accent: "from-purple-800 to-indigo-900",
    intro: [
      "Rampas são um dos ambientes naturais para usar energia. Em vez de calcular aceleração, tempo e velocidade passo a passo, muitas vezes basta comparar energia inicial e final. Isso é especialmente útil quando o problema pede velocidade em algum ponto, altura máxima, compressão de mola ou distância até parar.",
      "Sem atrito, a energia potencial gravitacional perdida vira energia cinética. Com atrito, parte dessa energia vira energia interna e térmica, então a energia cinética final é menor. O trabalho do atrito entra como termo negativo no balanço de energia.",
      "Em uma rampa, o trabalho do peso depende da altura perdida, não do comprimento da rampa. Já o trabalho do atrito depende da distância percorrida ao longo da superfície. Essa diferença é uma das pegadinhas mais bonitas e irritantes do conteúdo: peso olha altura; atrito olha caminho.",
    ],
    diagram: {
      kind: "inclinedEnergy",
      title: "Diagrama visual: rampa com energia e atrito",
      caption: "O peso depende da variação de altura. O atrito depende da distância percorrida sobre a superfície.",
    },
    equations: [
      {
        title: "Rampa sem atrito",
        formula: String.raw`mgh=\frac{mv^2}{2}`,
        terms: [
          "mgh é a energia potencial gravitacional perdida.",
          "mv²/2 é a energia cinética adquirida.",
          "A massa cancela, se não houver outras forças dependentes dela.",
        ],
        interpretation: [
          "A velocidade final depende da altura, não do formato do caminho.",
          "Esse resultado vale quando não há dissipação.",
        ],
      },
      {
        title: "Rampa com atrito cinético",
        formula: String.raw`mgh-f_cd=\frac{mv^2}{2}`,
        terms: [
          "fcd é o módulo do trabalho dissipativo do atrito.",
          "d é a distância percorrida sobre a rampa.",
          "A energia cinética final fica menor que no caso sem atrito.",
        ],
        interpretation: [
          "O peso transfere energia para o movimento.",
          "O atrito retira energia mecânica.",
          "O resultado final depende da competição entre ganho gravitacional e dissipação.",
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
      "Trabalho e Energia é um conteúdo em que muita gente erra por pressa. A fórmula parece curta, então o aluno pensa que o raciocínio também é curto. E aí vem a prova, dá uma rasteira com força inclinada, gráfico F × x, atrito, mola ou normal em superfície móvel, e o castelo de decoreba desaba com excelente acústica.",
      "A regra básica é sempre perguntar: qual força está realizando trabalho? Qual é o deslocamento? Qual é o ângulo entre eles? Essa força é conservativa? Há dissipação? A energia mecânica se conserva ou preciso incluir trabalho não conservativo? Essas perguntas evitam a maior parte das tragédias.",
    ],
    bullets: [
      "Usar W = Fd sem verificar o ângulo entre força e deslocamento.",
      "Achar que toda força realiza trabalho só porque existe força.",
      "Esquecer que força perpendicular ao deslocamento realiza trabalho nulo.",
      "Dizer que normal nunca realiza trabalho, sem analisar se a superfície se move.",
      "Confundir trabalho de uma força com trabalho resultante.",
      "Achar que trabalho resultante muda energia potencial diretamente. Ele muda energia cinética.",
      "Usar conservação de energia mecânica mesmo com atrito ou resistência do ar.",
      "Esquecer que atrito transforma energia mecânica em energia interna/térmica.",
      "Trocar energia por potência.",
      "Esquecer que energia elástica depende de x².",
      "Em gráfico F × x, calcular trabalho usando ponto final em vez de área.",
    ],
    notes: [
      {
        title: "Observações",
        type: "dark",
        body: "Antes de usar energia mecânica, pergunte se há dissipação. Antes de calcular trabalho, pergunte se a força tem componente na direção do deslocamento. Parece pouco, mas já separa aluno funcional de chutador com calculadora.",
      },
    ],
  },
  {
    id: "provas",
    icon: Target,
    title: "Pontos para ITA, IME e vestibulares difíceis",
    accent: "from-slate-950 to-indigo-900",
    intro: [
      "Em prova difícil, Trabalho e Energia costuma aparecer como ferramenta de economia. O problema pode ser grande, cheio de forças e trajetórias, mas a energia permite pular etapas que seriam dolorosas pela Cinemática ou pela Segunda Lei. Isso não significa que energia resolve tudo; significa que ela resolve muito bem problemas entre estados inicial e final.",
      "ITA e IME gostam de misturar energia com atrito, molas, rampas, vínculos, movimento circular, colisões e potência. A parte bonita é que a ideia central continua a mesma: identificar quais energias existem, quais forças realizam trabalho e se a energia mecânica se conserva.",
      "Uma estratégia forte é escrever primeiro o balanço energético geral, e só depois simplificar. Assim você não esquece termos. Comece com energia cinética, potencial gravitacional, potencial elástica e trabalho não conservativo. Depois retire o que não existe no problema. Sim, dá mais trabalho no começo. Curiosamente, evita trabalho dobrado depois, uma tecnologia chamada pensar.",
    ],
    bullets: [
      "Use energia quando a questão pedir velocidade, altura, compressão de mola ou distância até parar.",
      "Use trabalho resultante quando a pergunta envolver variação de velocidade e forças atuando ao longo de um deslocamento.",
      "Use conservação de energia mecânica somente sem dissipação relevante.",
      "Em rampas, o trabalho do peso depende da altura; o trabalho do atrito depende do caminho.",
      "Em molas, cuidado com a dependência quadrática da deformação.",
      "Em gráficos F × x, trabalho é área, não valor da força final.",
      "Em potência, cuidado para não confundir energia total com taxa de transferência.",
    ],
  },
];

const formulaSummary: FormulaSummary[] = [
  { title: "Trabalho de força constante", formula: String.raw`W=Fd\cos\theta`, description: "Só a componente da força na direção do deslocamento realiza trabalho." },
  { title: "Energia cinética", formula: String.raw`E_c=\frac{mv^2}{2}`, description: "Energia associada ao movimento do corpo." },
  { title: "Teorema da Energia Cinética", formula: String.raw`W_{\text{res}}=\Delta E_c`, description: "O trabalho resultante mede a variação da energia cinética." },
  { title: "Energia potencial gravitacional", formula: String.raw`E_{p,g}=mgh`, description: "Energia associada à altura em relação a um nível de referência." },
  { title: "Energia potencial elástica", formula: String.raw`E_{p,el}=\frac{kx^2}{2}`, description: "Energia armazenada em mola ideal deformada." },
  { title: "Energia mecânica", formula: String.raw`E_m=E_c+E_p`, description: "Soma das energias cinética e potencial." },
  { title: "Conservação mecânica", formula: String.raw`E_{m,i}=E_{m,f}`, description: "Vale quando apenas forças conservativas realizam trabalho." },
  { title: "Forças não conservativas", formula: String.raw`E_{m,i}+W_{nc}=E_{m,f}`, description: "Inclui dissipações ou trabalhos externos." },
  { title: "Potência média", formula: String.raw`P_m=\frac{W}{\Delta t}`, description: "Rapidez de transferência de energia." },
  { title: "Potência instantânea", formula: String.raw`P=Fv`, description: "Quando força e velocidade são paralelas." },
  { title: "Trabalho por gráfico", formula: String.raw`W=\text{área sob }F\times x`, description: "Usado para forças variáveis." },
  { title: "Trabalho do peso", formula: String.raw`W_P=mg(h_i-h_f)`, description: "Depende apenas da variação de altura." },
];

export default function DynamicsTopicEnergy() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  const examples: Example[] = [
    {
      id: "ex1",
      title: "Exemplo 1 — Trabalho de uma força inclinada",
      statement: "Uma força de 50 N puxa um bloco por 10 m fazendo 60° com a direção do deslocamento. Determine o trabalho realizado pela força.",
      solution: (
        <>
          <p>A força não está toda na direção do deslocamento. Apenas a componente paralela realiza trabalho.</p>
          <FormulaBlock formula={String.raw`W=Fd\cos\theta`} />
          <FormulaBlock formula={String.raw`W=50\cdot 10\cdot \cos 60^\circ`} />
          <FormulaBlock formula={String.raw`W=50\cdot 10\cdot 0{,}5=250\ \text{J}`} />
          <NoteBox title="Interpretação" type="success">A força transferiu 250 J de energia para o bloco ao longo do deslocamento.</NoteBox>
        </>
      ),
    },
    {
      id: "ex2",
      title: "Exemplo 2 — Trabalho resultante e energia cinética",
      statement: "Um corpo de 2 kg passa de 3 m/s para 7 m/s. Determine o trabalho resultante.",
      solution: (
        <>
          <p>O trabalho resultante é igual à variação da energia cinética.</p>
          <FormulaBlock formula={String.raw`W_{\text{res}}=\Delta E_c`} />
          <FormulaBlock formula={String.raw`W_{\text{res}}=\frac{m v_f^2}{2}-\frac{m v_i^2}{2}`} />
          <FormulaBlock formula={String.raw`W_{\text{res}}=\frac{2\cdot 7^2}{2}-\frac{2\cdot 3^2}{2}`} />
          <FormulaBlock formula={String.raw`W_{\text{res}}=49-9=40\ \text{J}`} />
          <NoteBox title="Interpretação" type="success">O trabalho resultante foi positivo, então a energia cinética aumentou.</NoteBox>
        </>
      ),
    },
    {
      id: "ex3",
      title: "Exemplo 3 — Queda usando conservação de energia",
      statement: "Um corpo é abandonado do repouso de uma altura de 20 m, sem resistência do ar. Use g = 10 m/s². Determine sua velocidade ao chegar ao solo.",
      solution: (
        <>
          <p>Sem resistência do ar, a energia mecânica se conserva. A energia potencial gravitacional vira energia cinética.</p>
          <FormulaBlock formula={String.raw`mgh=\frac{mv^2}{2}`} />
          <p>A massa cancela:</p>
          <FormulaBlock formula={String.raw`gh=\frac{v^2}{2}`} />
          <FormulaBlock formula={String.raw`v=\sqrt{2gh}`} />
          <FormulaBlock formula={String.raw`v=\sqrt{2\cdot 10\cdot 20}=20\ \text{m/s}`} />
          <NoteBox title="Interpretação" type="success">A velocidade depende da altura perdida, não da massa do corpo.</NoteBox>
        </>
      ),
    },
    {
      id: "ex4",
      title: "Exemplo 4 — Bloco com atrito até parar",
      statement: "Um bloco chega a uma superfície áspera com velocidade de 10 m/s. Se μc = 0,2 e g = 10 m/s², determine a distância até parar.",
      solution: (
        <>
          <p>O atrito realiza trabalho negativo e reduz a energia cinética até zero.</p>
          <FormulaBlock formula={String.raw`W_{\text{atrito}}=\Delta E_c`} />
          <FormulaBlock formula={String.raw`-f_c d = 0-\frac{mv^2}{2}`} />
          <FormulaBlock formula={String.raw`f_c=\mu_cN=\mu_cmg`} />
          <FormulaBlock formula={String.raw`-\mu_cmgd=-\frac{mv^2}{2}`} />
          <p>A massa cancela:</p>
          <FormulaBlock formula={String.raw`d=\frac{v^2}{2\mu_cg}`} />
          <FormulaBlock formula={String.raw`d=\frac{10^2}{2\cdot 0{,}2\cdot 10}=25\ \text{m}`} />
          <NoteBox title="Interpretação" type="warning">O atrito não destruiu energia. Ele transformou energia cinética em energia interna/térmica.</NoteBox>
        </>
      ),
    },
    {
      id: "ex5",
      title: "Exemplo 5 — Mola comprimida lançando bloco",
      statement: "Uma mola de constante k = 200 N/m é comprimida 0,20 m e lança um bloco de 1 kg em superfície sem atrito. Determine a velocidade do bloco ao perder contato com a mola.",
      solution: (
        <>
          <p>A energia potencial elástica inicial vira energia cinética.</p>
          <FormulaBlock formula={String.raw`\frac{kx^2}{2}=\frac{mv^2}{2}`} />
          <FormulaBlock formula={String.raw`kx^2=mv^2`} />
          <FormulaBlock formula={String.raw`v=x\sqrt{\frac{k}{m}}`} />
          <FormulaBlock formula={String.raw`v=0{,}20\sqrt{\frac{200}{1}}=2\sqrt{2}\ \text{m/s}`} />
          <NoteBox title="Interpretação" type="success">A energia elástica armazenada na mola foi convertida em movimento.</NoteBox>
        </>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Gráfico F × x",
      statement: "Uma força varia linearmente de 0 a 40 N enquanto o corpo se desloca 5 m. Determine o trabalho.",
      solution: (
        <>
          <p>O trabalho é a área sob o gráfico F × x. Como a força cresce linearmente de 0 até 40 N, a área é um triângulo.</p>
          <FormulaBlock formula={String.raw`W=\frac{\text{base}\cdot\text{altura}}{2}`} />
          <FormulaBlock formula={String.raw`W=\frac{5\cdot 40}{2}=100\ \text{J}`} />
          <NoteBox title="Interpretação" type="success">Não se usa apenas a força final. Usa-se a área sob o gráfico.</NoteBox>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/dinamica">
              <a className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </a>
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Dinâmica</p>
              <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">Trabalho e Energia</h1>
            </div>
          </div>

          <div className="hidden gap-2 md:flex">
            {(["teoria", "exemplos", "resumo"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-black capitalize transition-colors ${
                  activeTab === tab ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
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
                activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
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
                    Trabalho, energia, conservação e potência.
                  </h2>
                  <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                    Uma aula visual e detalhada para entender transferência de energia, trabalho resultante, conservação mecânica, dissipação, molas, gráficos e potência.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["10", "blocos"],
                    ["9", "diagramas"],
                    ["12", "fórmulas"],
                    ["ITA", "nível"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {theorySections.map((section) => (
              <SectionCard key={section.id} icon={section.icon} title={section.title} accent={section.accent}>
                <ConnectedText paragraphs={section.intro} />

                {section.diagram ? <DiagramCard diagram={section.diagram} /> : null}

                {section.equations?.map((panel, index) => (
                  <EquationPanel key={index} panel={panel} />
                ))}

                {section.bullets ? <BulletList items={section.bullets} /> : null}

                {section.notes?.map((note, index) => (
                  <NoteBox key={index} title={note.title} type={note.type}>
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
              icon={Calculator}
              eyebrow="Treino comentado"
              title="Exemplos resolvidos"
              description="Questões fundamentais usando trabalho, energia cinética, conservação, atrito, mola, gráfico F × x e potência. Sem aquela covardia de jogar fórmula e fugir."
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
              title="Resumo de Trabalho e Energia"
              description="As fórmulas principais e a interpretação física que precisa ficar na cabeça antes da prova inventar moda."
              accent="from-slate-950 via-slate-900 to-indigo-950"
            />

            <SectionCard icon={Zap} title="Fórmulas essenciais" accent="from-indigo-600 to-purple-700">
              <div className="grid gap-4 md:grid-cols-2">
                {formulaSummary.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-base font-black text-slate-950">{item.title}</h3>
                    <FormulaBlock formula={item.formula} />
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Erros que mais derrubam" accent="from-red-700 to-red-950">
              <BulletList
                items={[
                  "Usar W = Fd sem considerar o ângulo.",
                  "Achar que força perpendicular realiza trabalho.",
                  "Confundir trabalho de uma força com trabalho resultante.",
                  "Usar conservação de energia mecânica em sistema com atrito sem colocar o termo dissipativo.",
                  "Calcular trabalho em gráfico F × x usando força final em vez de área.",
                  "Esquecer que energia elástica depende de x².",
                  "Confundir potência com energia.",
                  "Dizer que a energia desapareceu quando houve atrito.",
                ]}
              />
              <NoteBox title="Regra mental" type="dark">
                Trabalho é transferência de energia. Energia mecânica só se conserva sem dissipação. Potência é rapidez de transferência. Se separar essas três ideias, metade do capítulo para de parecer feitiçaria.
              </NoteBox>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}
