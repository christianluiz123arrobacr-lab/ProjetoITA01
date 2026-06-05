import { useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  Eye,
  Layers,
  Lightbulb,
  MousePointer2,
  Rainbow,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  Waves,
} from "lucide-react";
import { Link } from "wouter";
import { MathFormula } from "@/components/MathFormula";

type Tab = "teoria" | "exemplos" | "resumo";
type NoteType = "info" | "warning" | "success";

type DiagramKind =
  | "beams"
  | "realVirtualImage"
  | "normalReflectionRefraction"
  | "cameraObscura";

type TheorySection = {
  id: number;
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  bullets?: string[];
  numbered?: string[];
  formulas?: string[];
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

type FormulaSummary = {
  title: string;
  formula: string;
  description: string;
  terms: string[];
  interpretation: string[];
  warning?: string;
};

type Example = {
  id: string;
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: string[];
  answer: string;
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
      title: "text-slate-950",
      text: "text-slate-700",
      Icon: Lightbulb,
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50",
      icon: "text-amber-700",
      title: "text-slate-950",
      text: "text-slate-700",
      Icon: AlertTriangle,
    },
    success: {
      wrap: "border-emerald-200 bg-emerald-50",
      icon: "text-emerald-700",
      title: "text-slate-950",
      text: "text-slate-700",
      Icon: CheckCircle2,
    },
  }[type];

  const Icon = styles.Icon;

  return (
    <div className={`rounded-2xl border p-5 ${styles.wrap}`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${styles.icon}`} />
        <h4 className={`text-base font-black ${styles.title}`}>{title}</h4>
      </div>
      <p className={`text-justify text-[1.02rem] leading-8 ${styles.text}`}>{body}</p>
    </div>
  );
}


function OpticsDiagram({ diagram }: { diagram: NonNullable<TheorySection["diagram"]> }) {
  return (
    <div className="my-7 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4">
        <h3 className="text-lg font-black text-white">Diagrama visual: {diagram.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{diagram.caption}</p>
      </div>

      <div className="overflow-x-auto p-5 md:p-7">
        <div className="min-w-[680px] rounded-2xl bg-white p-5">
          {diagram.kind === "beams" && <BeamsDiagram />}
          {diagram.kind === "realVirtualImage" && <RealVirtualImageDiagram />}
          {diagram.kind === "normalReflectionRefraction" && <NormalReflectionRefractionDiagram />}
          {diagram.kind === "cameraObscura" && <CameraObscuraDiagram />}
        </div>
      </div>
    </div>
  );
}

function ArrowLine({
  x1,
  y1,
  x2,
  y2,
  color = "#0f172a",
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray={dashed ? "10 10" : undefined}
      markerEnd="url(#arrow)"
    />
  );
}

function DiagramDefs() {
  return (
    <defs>
      <marker
        id="arrow"
        markerWidth="12"
        markerHeight="12"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#0f172a" />
      </marker>
      <marker
        id="arrowBlue"
        markerWidth="12"
        markerHeight="12"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
      </marker>
      <marker
        id="arrowRed"
        markerWidth="12"
        markerHeight="12"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
      </marker>
    </defs>
  );
}

function BeamsDiagram() {
  return (
    <svg viewBox="0 0 760 260" className="h-auto w-full">
      <DiagramDefs />

      <text x="80" y="35" className="fill-slate-950 text-[18px] font-black">Paralelo</text>
      <text x="330" y="35" className="fill-slate-950 text-[18px] font-black">Convergente</text>
      <text x="585" y="35" className="fill-slate-950 text-[18px] font-black">Divergente</text>

      {[78, 112, 146].map((y) => (
        <line key={y} x1="35" y1={y} x2="215" y2={y} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      ))}

      <line x1="285" y1="72" x2="480" y2="130" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow)" />
      <line x1="285" y1="130" x2="480" y2="130" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow)" />
      <line x1="285" y1="188" x2="480" y2="130" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow)" />
      <circle cx="490" cy="130" r="7" fill="#16a34a" />
      <text x="450" y="160" className="fill-slate-700 text-[14px] font-bold">ponto de encontro</text>

      <circle cx="570" cy="130" r="7" fill="#dc2626" />
      <line x1="578" y1="130" x2="725" y2="72" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="578" y1="130" x2="725" y2="130" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="578" y1="130" x2="725" y2="188" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <text x="540" y="160" className="fill-slate-700 text-[14px] font-bold">fonte ou origem aparente</text>

      <rect x="20" y="48" width="220" height="170" rx="18" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="270" y="48" width="240" height="170" rx="18" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="530" y="48" width="215" height="170" rx="18" fill="none" stroke="#cbd5e1" strokeWidth="2" />
    </svg>
  );
}

function RealVirtualImageDiagram() {
  return (
    <svg viewBox="0 0 760 300" className="h-auto w-full">
      <DiagramDefs />

      <text x="120" y="32" className="fill-slate-950 text-[18px] font-black">Imagem real</text>
      <text x="500" y="32" className="fill-slate-950 text-[18px] font-black">Imagem virtual</text>

      <line x1="70" y1="220" x2="300" y2="95" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="70" y1="70" x2="300" y2="95" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <circle cx="300" cy="95" r="8" fill="#2563eb" />
      <line x1="300" y1="55" x2="300" y2="250" stroke="#64748b" strokeWidth="2" strokeDasharray="8 8" />
      <text x="262" y="275" className="fill-slate-700 text-[14px] font-bold">raios se encontram</text>

      <line x1="430" y1="80" x2="560" y2="130" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="430" y1="220" x2="560" y2="130" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="560" y1="130" x2="700" y2="75" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="560" y1="130" x2="700" y2="185" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="560" y1="130" x2="430" y2="80" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <line x1="560" y1="130" x2="430" y2="220" stroke="#94a3b8" strokeWidth="3" strokeDasharray="9 9" />
      <circle cx="430" cy="150" r="7" fill="#94a3b8" />
      <text x="385" y="275" className="fill-slate-700 text-[14px] font-bold">prolongamentos indicam origem aparente</text>

      <rect x="35" y="48" width="320" height="220" rx="18" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="390" y="48" width="335" height="220" rx="18" fill="none" stroke="#cbd5e1" strokeWidth="2" />
    </svg>
  );
}

function NormalReflectionRefractionDiagram() {
  return (
    <svg viewBox="0 0 760 320" className="h-auto w-full">
      <DiagramDefs />

      <rect x="40" y="160" width="680" height="90" fill="#dbeafe" />
      <line x1="40" y1="160" x2="720" y2="160" stroke="#0f172a" strokeWidth="4" />
      <line x1="380" y1="40" x2="380" y2="285" stroke="#64748b" strokeWidth="3" strokeDasharray="8 8" />
      <text x="392" y="62" className="fill-slate-700 text-[14px] font-black">normal</text>
      <text x="55" y="145" className="fill-slate-700 text-[15px] font-bold">meio 1</text>
      <text x="55" y="215" className="fill-slate-700 text-[15px] font-bold">meio 2</text>

      <line x1="210" y1="70" x2="380" y2="160" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="380" y1="160" x2="545" y2="70" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowRed)" />
      <line x1="380" y1="160" x2="500" y2="250" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrow)" />

      <path d="M350 145 A45 45 0 0 1 380 115" fill="none" stroke="#2563eb" strokeWidth="3" />
      <text x="326" y="128" className="fill-blue-700 text-[18px] font-black">i</text>

      <path d="M380 115 A45 45 0 0 1 410 145" fill="none" stroke="#dc2626" strokeWidth="3" />
      <text x="418" y="128" className="fill-red-700 text-[18px] font-black">r</text>

      <path d="M392 190 A45 45 0 0 0 415 220" fill="none" stroke="#16a34a" strokeWidth="3" />
      <text x="424" y="219" className="fill-green-700 text-[18px] font-black">r'</text>

      <text x="185" y="55" className="fill-blue-700 text-[15px] font-black">raio incidente</text>
      <text x="520" y="55" className="fill-red-700 text-[15px] font-black">raio refletido</text>
      <text x="505" y="270" className="fill-green-700 text-[15px] font-black">raio refratado</text>
    </svg>
  );
}

function CameraObscuraDiagram() {
  return (
    <svg viewBox="0 0 760 300" className="h-auto w-full">
      <DiagramDefs />

      <line x1="115" y1="70" x2="115" y2="230" stroke="#0f172a" strokeWidth="5" />
      <polygon points="115,70 105,95 125,95" fill="#0f172a" />
      <text x="80" y="260" className="fill-slate-700 text-[15px] font-bold">objeto</text>

      <rect x="335" y="50" width="40" height="200" fill="#0f172a" rx="8" />
      <circle cx="355" cy="150" r="7" fill="#facc15" />
      <text x="323" y="275" className="fill-slate-700 text-[15px] font-bold">orifício</text>

      <rect x="610" y="55" width="20" height="190" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
      <line x1="620" y1="215" x2="620" y2="95" stroke="#dc2626" strokeWidth="5" />
      <polygon points="620,215 610,190 630,190" fill="#dc2626" />
      <text x="590" y="275" className="fill-slate-700 text-[15px] font-bold">imagem invertida</text>

      <line x1="115" y1="70" x2="355" y2="150" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
      <line x1="355" y1="150" x2="620" y2="215" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowBlue)" />
      <line x1="115" y1="230" x2="355" y2="150" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      <line x1="355" y1="150" x2="620" y2="95" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow)" />

      <line x1="115" y1="250" x2="355" y2="250" stroke="#64748b" strokeWidth="2" />
      <line x1="355" y1="250" x2="620" y2="250" stroke="#64748b" strokeWidth="2" />
      <text x="210" y="242" className="fill-slate-700 text-[14px] font-black">p</text>
      <text x="480" y="242" className="fill-slate-700 text-[14px] font-black">p'</text>
    </svg>
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

        {section.formulas ? (
          <div className="space-y-4">
            {section.formulas.map((formula, index) => (
              <FormulaBlock key={index} formula={formula} />
            ))}
          </div>
        ) : null}

        {section.bullets ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ul className="space-y-3">
              {section.bullets.map((bullet, index) => (
                <li key={index} className="flex gap-3 text-[1.02rem] leading-8 text-slate-700">
                  <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
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

        {section.notes ? (
          <div className="space-y-4">
            {section.notes.map((note, index) => (
              <NoteCard key={index} title={note.title} type={note.type} body={note.body} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FormulaCard({ item }: { item: FormulaSummary }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
      </div>
      <div className="p-6">
        <FormulaBlock formula={item.formula} />
        <p className="text-justify text-[1.02rem] leading-8 text-slate-700">{item.description}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950">
              Termo a termo
            </h4>
            <ul className="space-y-2">
              {item.terms.map((term, index) => (
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
              {item.interpretation.map((line, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {item.warning ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            {item.warning}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ExampleCard({ example, index }: { example: Example; index: number }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-100">
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

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-8 text-emerald-950">
          {example.answer}
        </div>
      </div>
    </article>
  );
}

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "O papel desta página",
    accent: "bg-purple-700",
    paragraphs: [
      "Fundamentos da Óptica não é uma página para despejar tudo sobre espelhos, lentes, instrumentos ópticos e ondulatória. Ela tem uma função mais importante: construir o vocabulário e o modo de pensar que serão usados em todo o restante do conteúdo.",
      "A maior parte dos erros em Óptica não começa na fórmula. Começa antes: o aluno não identifica de onde a luz vem, não desenha os raios, mede ângulo pela superfície em vez da normal, confunde imagem real com virtual ou aplica Snell em uma situação que era apenas semelhança de triângulos.",
      "Por isso, esta página trabalha a base: raio luminoso, feixe, fonte, objeto, observador, imagem, propagação retilínea, reversibilidade, reflexão, refração, frequência na mudança de meio e câmara escura. É o alicerce antes de entrar em espelhos esféricos, lentes delgadas e instrumentos ópticos.",
    ],
    notes: [
      {
        title: "O que precisa sair daqui dominado",
        type: "success",
        body: "O aluno deve conseguir olhar para uma situação óptica e responder: quem emite ou reflete luz, para onde os raios caminham, onde está a normal, se a imagem é real ou virtual, se há reflexão, refração, sombra ou semelhança de triângulos.",
      },
      {
        title: "O que fica para outras páginas",
        type: "warning",
        body: "Espelhos esféricos, lentes delgadas, equação de Gauss, aumento linear, vergência, instrumentos ópticos, olho humano, interferência, difração e polarização devem aparecer em páginas próprias. Colocar tudo aqui deixaria a página inchada e menos útil.",
      },
    ],
  },
  {
    id: 2,
    icon: Eye,
    title: "O que a Óptica Geométrica realmente modela",
    accent: "bg-slate-950",
    paragraphs: [
      "A Óptica Geométrica representa a luz por raios luminosos. Um raio luminoso é uma linha orientada que indica a direção e o sentido de propagação da luz. Ele não é um fio material, não é uma partícula desenhada, nem uma trilha física visível no espaço. É um modelo geométrico.",
      "Esse modelo funciona muito bem quando as dimensões dos obstáculos, aberturas, espelhos e lentes são muito maiores que o comprimento de onda da luz. Nessa condição, efeitos como difração e interferência ficam pouco relevantes para a maioria das situações analisadas em Óptica Geométrica.",
      "O grande poder desse modelo é transformar fenômenos ópticos em geometria. Sombras, imagens, espelhos, lentes, câmaras escuras e refração passam a ser estudados com retas, ângulos, triângulos semelhantes e relações trigonométricas. A Física não some; ela aparece traduzida em desenho.",
    ],
    notes: [
      {
        title: "Ideia central",
        type: "info",
        body: "A Óptica Geométrica não afirma que a luz é apenas um raio. Ela usa raios como ferramenta para descrever a propagação quando os efeitos ondulatórios não são dominantes.",
      },
    ],
  },
  {
    id: 3,
    icon: ScanLine,
    title: "Raios luminosos e feixes de luz",
    accent: "bg-blue-700",
    paragraphs: [
      "Um único raio luminoso indica uma direção de propagação. Um feixe luminoso é um conjunto de raios. A forma desse feixe diz muito sobre o comportamento da luz em espelhos e lentes.",
      "Um feixe paralelo é formado por raios que seguem lado a lado. Ele aparece em aproximações envolvendo objetos muito distantes, como a luz solar chegando à Terra. Um feixe convergente tem raios que se aproximam e tendem a encontrar-se. Um feixe divergente tem raios que se afastam a partir de uma região.",
      "Essa classificação é útil porque espelhos e lentes modificam feixes. Uma lente convergente pode transformar um feixe paralelo em convergente. Uma lente divergente tende a espalhar os raios. Se o aluno entende o comportamento dos feixes, a formação de imagens deixa de parecer uma tabela decorada por castigo.",
    ],
    bullets: [
      "Feixe paralelo: raios seguem paralelos, como idealização comum para luz vinda de objetos muito distantes.",
      "Feixe convergente: raios se aproximam e podem encontrar-se em um ponto ou região.",
      "Feixe divergente: raios se afastam a partir de uma fonte, de uma imagem virtual ou de uma região aparente.",
      "Em espelhos e lentes, acompanhar a mudança do feixe é mais importante do que decorar frases soltas.",
    ],
    diagram: {
      kind: "beams",
      title: "feixes luminosos",
      caption: "Feixes paralelos, convergentes e divergentes aparecem o tempo todo na formação de imagens.",
    },
  },
  {
    id: 4,
    icon: Lightbulb,
    title: "Fonte, objeto e observador",
    accent: "bg-cyan-700",
    paragraphs: [
      "Em Óptica, uma fonte é aquilo que fornece luz ao sistema. Ela pode ser primária ou secundária. Fonte primária emite luz própria, como o Sol, uma lâmpada acesa ou uma chama. Fonte secundária não emite luz própria; ela reflete luz recebida, como uma parede iluminada, uma folha de papel ou uma pessoa.",
      "O objeto óptico é aquilo de onde partem os raios que chegam ao sistema óptico analisado. Em muitos problemas, o objeto não é fonte primária; ele apenas reflete luz. Mesmo assim, para o espelho ou a lente, ele funciona como origem dos raios que formarão a imagem.",
      "O observador é quem recebe os raios luminosos. Ver um objeto significa receber luz proveniente dele. Ver uma imagem significa receber raios que chegam ao olho como se partissem de determinada posição, real ou aparente.",
    ],
    bullets: [
      "Fonte primária: emite luz própria.",
      "Fonte secundária: reflete luz recebida.",
      "Objeto óptico: região de onde partem os raios considerados no sistema.",
      "Observador: recebe os raios e interpreta sua origem aparente.",
    ],
    notes: [
      {
        title: "Por que isso importa?",
        type: "info",
        body: "Muitas questões ficam mais simples quando você pergunta: de onde os raios estão saindo, por onde passam e onde chegam ao observador?",
      },
    ],
  },
  {
    id: 5,
    icon: Eye,
    title: "Imagem real e imagem virtual sem decoreba",
    accent: "bg-indigo-800",
    paragraphs: [
      "Uma das maiores confusões em Óptica é tratar imagem como se fosse sempre algo projetado em uma tela. Em Física, imagem é o ponto ou região de onde os raios parecem vir ou para onde eles realmente convergem.",
      "A imagem real é formada pelo encontro efetivo dos raios luminosos. Os raios passam de verdade pela região da imagem. Por isso, uma imagem real pode ser projetada em uma tela. É o que acontece, por exemplo, quando um projetor forma uma imagem em uma parede.",
      "A imagem virtual é formada pelo encontro dos prolongamentos dos raios. Os raios não passam realmente pelo ponto onde a imagem parece estar. Eles chegam ao olho com uma direção tal que o cérebro interpreta como se viessem daquele ponto.",
      "O espelho plano é o caso clássico. Você vê sua imagem atrás do espelho, mas não existe um encontro real de raios atrás dele. Os raios refletem no espelho e chegam ao olho; os prolongamentos desses raios parecem vir de trás da superfície refletora.",
    ],
    diagram: {
      kind: "realVirtualImage",
      title: "imagem real e imagem virtual",
      caption: "Imagem real vem do encontro efetivo dos raios; imagem virtual vem do encontro dos prolongamentos.",
    },
    notes: [
      {
        title: "Teste mental útil",
        type: "success",
        body: "Se os próprios raios se encontram, a imagem é real. Se apenas os prolongamentos se encontram, a imagem é virtual.",
      },
      {
        title: "Erro comum",
        type: "warning",
        body: "Não confunda 'imagem vista pelo olho' com 'imagem real'. Imagens virtuais também são vistas, mas não podem ser projetadas diretamente em uma tela.",
      },
    ],
  },
  {
    id: 6,
    icon: Compass,
    title: "Os três princípios fundamentais",
    accent: "bg-purple-700",
    paragraphs: [
      "A Óptica Geométrica se apoia em três princípios básicos: propagação retilínea da luz, independência dos raios luminosos e reversibilidade dos raios. Eles parecem simples, mas sustentam uma quantidade enorme de questões.",
      "A propagação retilínea afirma que, em um meio homogêneo e transparente, a luz se propaga em linha reta. É esse princípio que explica sombras, penumbras e a formação de imagens em câmaras escuras.",
      "A independência dos raios diz que raios luminosos podem se cruzar sem alterar suas trajetórias. Um raio não 'empurra' o outro nem muda seu caminho por causa do cruzamento. Já a reversibilidade afirma que, se a luz pode percorrer um caminho de A para B, ela também pode percorrer o mesmo caminho de B para A.",
    ],
    bullets: [
      "Propagação retilínea: em meio homogêneo e transparente, a luz se propaga em linha reta.",
      "Independência dos raios: raios que se cruzam continuam seus caminhos sem se modificar.",
      "Reversibilidade: o caminho óptico pode ser percorrido nos dois sentidos.",
    ],
    notes: [
      {
        title: "Como isso aparece em prova",
        type: "info",
        body: "Câmara escura, sombras, espelhos planos, trajetórias reversas e construção de imagens usam esses princípios o tempo todo, mesmo quando o enunciado não cita seus nomes.",
      },
    ],
  },
  {
    id: 7,
    icon: Layers,
    title: "Normal, reflexão e refração",
    accent: "bg-emerald-700",
    paragraphs: [
      "Em reflexão e refração, a reta mais importante do desenho é a normal. A normal é a reta perpendicular à superfície no ponto de incidência. Os ângulos de incidência, reflexão e refração são medidos em relação a ela.",
      "Na reflexão, a luz atinge uma superfície e retorna ao meio de origem. A lei da reflexão afirma que o ângulo de incidência é igual ao ângulo de reflexão. Essa igualdade só é verdadeira quando os dois ângulos são medidos em relação à normal.",
      "Na refração, a luz passa de um meio para outro e muda sua velocidade. Se a incidência não for perpendicular, essa mudança de velocidade vem acompanhada de desvio na trajetória. A lei de Snell-Descartes relaciona esse desvio aos índices de refração dos meios.",
    ],
    formulas: [
      String.raw`i = r`,
      String.raw`n_1\sin i = n_2\sin r`,
    ],
    diagram: {
      kind: "normalReflectionRefraction",
      title: "normal, reflexão e refração",
      caption: "Os ângulos são medidos pela normal. O raio refletido retorna ao meio de origem; o refratado atravessa a interface.",
    },
    notes: [
      {
        title: "Regra de ouro",
        type: "success",
        body: "Antes de escrever qualquer seno, desenhe a normal. Sem ela, a chance de medir o ângulo errado é enorme.",
      },
      {
        title: "Previsão qualitativa",
        type: "info",
        body: "Ao entrar em meio de maior índice de refração, a luz fica mais lenta e o raio aproxima-se da normal. Ao entrar em meio de menor índice, a luz fica mais rápida e o raio afasta-se da normal.",
      },
    ],
  },
  {
    id: 8,
    icon: Waves,
    title: "Por que a frequência não muda na refração",
    accent: "bg-blue-800",
    paragraphs: [
      "Quando a luz muda de meio, sua velocidade muda. Como vale a relação v = λf, se a velocidade muda, alguma outra grandeza deve se ajustar. A grandeza que muda é o comprimento de onda, não a frequência.",
      "A frequência é determinada pela fonte emissora. Se uma fonte emite luz com certa frequência, essa oscilação não é refeita do zero em cada meio atravessado. O meio modifica a velocidade de propagação e, com isso, modifica o comprimento de onda dentro dele.",
      "Essa ideia é essencial em refração e dispersão. Cores diferentes correspondem a frequências diferentes. Em certos materiais, índices de refração dependem da frequência da luz, por isso diferentes cores podem desviar de maneiras diferentes em prismas.",
    ],
    formulas: [
      String.raw`v = \lambda f`,
      String.raw`n = \frac{c}{v}`,
    ],
    notes: [
      {
        title: "Resumo rápido",
        type: "success",
        body: "Na mudança de meio: frequência permanece constante; velocidade muda; comprimento de onda muda.",
      },
      {
        title: "Erro clássico",
        type: "warning",
        body: "Não diga que a luz mudou de cor apenas porque entrou em outro meio. A cor está ligada à frequência, e a frequência permanece a mesma na refração.",
      },
    ],
  },
  {
    id: 9,
    icon: ScanLine,
    title: "Câmara escura e semelhança de triângulos",
    accent: "bg-red-700",
    paragraphs: [
      "A câmara escura é uma caixa fechada com um pequeno orifício em uma face e uma tela na face oposta. A luz vinda do objeto atravessa o orifício e forma uma imagem invertida na tela.",
      "A imagem fica invertida porque o raio que sai do topo do objeto passa pelo orifício e chega à parte inferior da tela. O raio que sai da base do objeto passa pelo mesmo orifício e chega à parte superior da tela. O cruzamento no orifício inverte a orientação da imagem.",
      "A fórmula da câmara escura vem diretamente da semelhança de triângulos. O triângulo formado pelo objeto e sua distância ao orifício é semelhante ao triângulo formado pela imagem e pela profundidade da câmara.",
    ],
    formulas: [
      String.raw`\frac{i}{o} = \frac{p'}{p}`,
    ],
    diagram: {
      kind: "cameraObscura",
      title: "câmara escura",
      caption: "A imagem invertida nasce da propagação retilínea e da semelhança entre triângulos.",
    },
    numbered: [
      "Desenhe o objeto, o orifício e a tela.",
      "Trace um raio saindo do topo do objeto até a parte inferior da tela.",
      "Trace outro raio saindo da base do objeto até a parte superior da tela.",
      "Identifique os triângulos semelhantes.",
      "Monte a proporção entre tamanhos e distâncias.",
    ],
    notes: [
      {
        title: "Interpretação dos símbolos",
        type: "info",
        body: "i é o tamanho da imagem, o é o tamanho do objeto, p' é a distância da imagem ao orifício e p é a distância do objeto ao orifício.",
      },
    ],
  },
  {
    id: 10,
    icon: Target,
    title: "Como começar qualquer questão de Óptica",
    accent: "bg-slate-950",
    paragraphs: [
      "Uma questão de Óptica raramente deve começar pela fórmula. O caminho mais seguro é transformar o enunciado em desenho. A fórmula entra depois, quando você já sabe qual fenômeno está acontecendo.",
      "Esse método evita os erros mais comuns: medir ângulo pela superfície, trocar imagem real por virtual, esquecer que a frequência não muda, aplicar Snell sem identificar os meios ou usar fórmula de lente em problema que era apenas semelhança de triângulos.",
    ],
    numbered: [
      "Identifique quem emite ou reflete luz.",
      "Desenhe os raios principais ou a trajetória indicada.",
      "Marque a normal se houver reflexão ou refração.",
      "Decida se o problema envolve imagem, sombra, reflexão, refração ou semelhança de triângulos.",
      "Faça uma previsão qualitativa antes da conta.",
      "Aplique a fórmula adequada.",
      "Confira se o resultado faz sentido fisicamente.",
    ],
  },
];

const formulas: FormulaSummary[] = [
  {
    title: "Relação fundamental da onda",
    formula: String.raw`v = \lambda f`,
    description:
      "Liga velocidade de propagação, comprimento de onda e frequência. Em mudança de meio, a frequência permanece constante; mudam velocidade e comprimento de onda.",
    terms: [
      "v: velocidade de propagação da luz no meio.",
      "λ: comprimento de onda da luz naquele meio.",
      "f: frequência da luz, determinada pela fonte.",
    ],
    interpretation: [
      "Se a frequência permanece e a velocidade muda, o comprimento de onda precisa mudar.",
      "Essa relação conecta Óptica Geométrica com a natureza ondulatória da luz.",
    ],
    warning: "Não trate frequência como se mudasse na refração. Esse é um erro clássico.",
  },
  {
    title: "Índice de refração absoluto",
    formula: String.raw`n = \frac{c}{v}`,
    description:
      "Mede o quanto a luz fica mais lenta em um meio em comparação com o vácuo. Quanto maior o índice, menor a velocidade da luz no meio.",
    terms: [
      "n: índice de refração absoluto do meio.",
      "c: velocidade da luz no vácuo.",
      "v: velocidade da luz no meio considerado.",
    ],
    interpretation: [
      "Meio com índice maior é mais refringente.",
      "Quanto maior n, menor é v.",
    ],
  },
  {
    title: "Lei da reflexão",
    formula: String.raw`i = r`,
    description:
      "O ângulo de incidência é igual ao ângulo de reflexão, ambos medidos pela normal.",
    terms: [
      "i: ângulo entre o raio incidente e a normal.",
      "r: ângulo entre o raio refletido e a normal.",
      "normal: reta perpendicular à superfície no ponto de incidência.",
    ],
    interpretation: [
      "A reflexão é simétrica em relação à normal.",
      "A superfície não é a referência para medir o ângulo.",
    ],
    warning: "Se medir pela superfície, a conta até pode parecer bonita, mas estará olhando para o ângulo errado.",
  },
  {
    title: "Lei de Snell-Descartes",
    formula: String.raw`n_1\sin i = n_2\sin r`,
    description:
      "Relaciona o desvio do raio luminoso aos índices de refração dos meios. É a ponte entre geometria e mudança de velocidade da luz.",
    terms: [
      "n₁: índice de refração do meio de incidência.",
      "n₂: índice de refração do meio para onde a luz passa.",
      "i: ângulo de incidência medido pela normal.",
      "r: ângulo de refração medido pela normal.",
    ],
    interpretation: [
      "Se n₂ > n₁, o raio aproxima-se da normal.",
      "Se n₂ < n₁, o raio afasta-se da normal.",
      "Se i = 0°, não há desvio angular, embora a velocidade mude.",
    ],
  },
  {
    title: "Câmara escura",
    formula: String.raw`\frac{i}{o} = \frac{p'}{p}`,
    description:
      "Vem diretamente da semelhança de triângulos. A imagem é invertida e seu tamanho depende da razão entre a profundidade da câmara e a distância do objeto.",
    terms: [
      "i: tamanho da imagem formada na tela.",
      "o: tamanho do objeto.",
      "p': distância entre o orifício e a tela.",
      "p: distância entre o objeto e o orifício.",
    ],
    interpretation: [
      "Aumentar a profundidade da câmara aumenta o tamanho da imagem.",
      "Afastar o objeto diminui o tamanho da imagem.",
      "A imagem é invertida pela propagação retilínea dos raios.",
    ],
  },
  {
    title: "Ângulo limite",
    formula: String.raw`\sin L = \frac{n_2}{n_1}`,
    description:
      "Usado para reflexão total quando a luz tenta passar do meio mais refringente para o menos refringente.",
    terms: [
      "L: ângulo limite.",
      "n₁: índice do meio mais refringente, de onde a luz vem.",
      "n₂: índice do meio menos refringente, para onde a luz tentaria passar.",
    ],
    interpretation: [
      "Só existe reflexão total quando n₁ > n₂.",
      "No ângulo limite, o raio refratado sairia rasante à superfície.",
    ],
    warning: "Só faz sentido se n₁ > n₂. Sem isso, não há reflexão total por esse critério.",
  },
];

const examples: Example[] = [
  {
    id: "camara-escura",
    title: "Câmara escura",
    level: "básico com semelhança",
    statement:
      "Um objeto de 1,80 m está a 4,0 m do orifício de uma câmara escura. A tela está a 20 cm do orifício. Determine o tamanho da imagem.",
    idea:
      "A luz se propaga em linha reta. O raio que sai do topo do objeto passa pelo orifício e chega à parte inferior da tela, formando triângulos semelhantes.",
    steps: [
      "Converta a profundidade da câmara: 20 cm = 0,20 m.",
      "Use a semelhança: i/o = p'/p.",
      "Substitua: i/1,80 = 0,20/4,0.",
      "Logo: i = 1,80 · 0,05 = 0,09 m.",
    ],
    answer: "A imagem tem 0,09 m, ou seja, 9 cm, e é invertida.",
  },
  {
    id: "refracao-vidro",
    title: "Refração do ar para o vidro",
    level: "intermediário",
    statement:
      "Um raio passa do ar para um vidro de índice 1,5 com ângulo de incidência de 30°. Considere n_ar = 1. Determine sen r.",
    idea:
      "Como o vidro tem índice maior, a luz diminui sua velocidade e se aproxima da normal. Antes da conta, já esperamos r < 30°.",
    steps: [
      "Pela lei de Snell: n_1 sen i = n_2 sen r.",
      "Substituindo: 1 · sen 30° = 1,5 · sen r.",
      "Como sen 30° = 0,5, temos: 0,5 = 1,5 sen r.",
      "Então: sen r = 1/3.",
    ],
    answer: "sen r = 1/3. O ângulo refratado é menor que 30°, como esperado fisicamente.",
  },
  {
    id: "reflexao-total",
    title: "Reflexão total",
    level: "nível vestibular",
    statement:
      "Um raio está no vidro de índice 1,5 e tenta sair para o ar. Calcule o seno do ângulo limite.",
    idea:
      "Reflexão total só pode ocorrer do meio mais refringente para o menos refringente. No ângulo limite, o raio refratado sairia rasante, com r = 90°.",
    steps: [
      "Use sen L = n_2/n_1.",
      "Aqui, n_1 = 1,5 e n_2 = 1.",
      "Logo: sen L = 1/1,5 = 2/3.",
      "Para incidências maiores que L, ocorre reflexão total.",
    ],
    answer: "sen L = 2/3.",
  },
];

const checklist = [
  "desenhar a normal antes de escrever qualquer seno;",
  "verificar se o ângulo foi dado em relação à normal ou à superfície;",
  "prever qualitativamente se o raio aproxima ou afasta da normal;",
  "lembrar que frequência não muda na passagem entre meios;",
  "separar imagem real de imagem virtual pelo caminho dos raios, não por chute visual;",
  "usar semelhança de triângulos em câmara escura, sombra e ampliações simples;",
  "não misturar fundamentos de Óptica Geométrica com fenômenos ondulatórios sem necessidade.",
];

export default function OpticaTopicConceitos() {
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
                Fundamentos da Óptica
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                teoria completa
              </div>

              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                Antes da fórmula, vem o raio. Antes do raio, vem o fenômeno.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Esta página organiza a base da Óptica: raios luminosos, fontes, imagens,
                princípios, normal, reflexão, refração, câmara escura, frequência na refração
                e o método seguro para começar questões.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: String(theorySections.length), label: "Seções centrais" },
                { value: String(formulas.length), label: "Fórmulas úteis" },
                { value: String(examples.length), label: "Exemplos" },
                { value: "ITA", label: "Foco de treino" },
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

        {activeTab === "teoria" ? (
          <div className="mt-10 space-y-8">
            {theorySections.map((section) => (
              <TheorySectionCard key={section.id} section={section} />
            ))}

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="bg-red-700 px-7 py-6 text-white md:px-9">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Waves className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    6. Fórmulas essenciais
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 px-7 py-7 md:grid-cols-2 md:px-9 md:py-9">
                {formulas.map((item) => (
                  <FormulaCard key={item.title} item={item} />
                ))}
              </div>
            </section>
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
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Resumo estratégico
                  </h2>
                </div>
              </div>

              <div className="space-y-6 px-7 py-7 md:px-9 md:py-9">
                <p className="text-justify text-[1.06rem] leading-9 text-slate-700">
                  Em fundamentos de Óptica, o mais importante não é sair colecionando fórmulas. O núcleo da matéria está em interpretar a luz como raio, desenhar corretamente a situação, marcar a normal e entender se a questão está pedindo reflexão, refração, imagem real, imagem virtual ou semelhança de triângulos. Antes da conta, vem o desenho. Antes do desenho, vem a leitura física do fenômeno. Antes da conta, vem o desenho. Antes do desenho, vem a leitura física do fenômeno.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                      <p className="text-[1.01rem] leading-8 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>


                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-red-700 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      <h3 className="text-2xl font-black">Armadilhas clássicas</h3>
                    </div>
                  </div>

                  <div className="grid gap-4 p-6 md:grid-cols-2">
                    {[
                      "Medir ângulo em relação à superfície em vez da normal.",
                      "Achar que toda imagem vista pelo olho é imagem real.",
                      "Esquecer que imagem virtual vem de prolongamentos.",
                      "Dizer que a frequência muda quando a luz muda de meio.",
                      "Aplicar Snell sem identificar corretamente meio 1 e meio 2.",
                      "Usar câmara escura sem inverter a imagem.",
                      "Confundir raio luminoso real com prolongamento geométrico.",
                      "Tentar resolver Óptica só por fórmula, sem desenho.",
                    ].map((trap, index) => (
                      <div key={index} className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-700" />
                        <p className="text-[1.01rem] leading-7 text-slate-700">{trap}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 md:grid-cols-3">
                  <NoteCard
                    title="Ideia central"
                    type="success"
                    body="Óptica Geométrica é, antes de tudo, interpretação do caminho da luz. O desenho costuma vir antes da conta."
                  />
                  <NoteCard
                    title="Ponto mais cobrado"
                    type="info"
                    body="Ângulos de reflexão e refração são medidos pela normal, e não pela superfície."
                  />
                  <NoteCard
                    title="Erro clássico"
                    type="warning"
                    body="Achar que a frequência muda na passagem de um meio para outro, ou que imagem virtual pode ser projetada em tela."
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              href: "/optica/topic/fenomenos",
              icon: Rainbow,
              title: "Fenômenos ópticos",
              text: "refração, reflexão total, dispersão, prismas e aplicações.",
            },
            {
              href: "/optica/topic/lentes",
              icon: Telescope,
              title: "Espelhos e lentes",
              text: "formação de imagens, Gauss, aumento, vergência e visão.",
            },
            {
              href: "/optica/quiz",
              icon: Brain,
              title: "Treino rápido",
              text: "questões para testar se os fundamentos estão firmes.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-[1.01rem] leading-7 text-slate-600">{item.text}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
