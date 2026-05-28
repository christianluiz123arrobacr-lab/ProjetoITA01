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

type Example = {
  id: string;
  title: string;
  statement: string;
  content: ReactNode;
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <h5 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-blue-300">
        {title}
      </h5>

      <div className="space-y-4 text-sm leading-7 text-slate-300 [&_.katex]:text-slate-100">
        {children}
      </div>
    </div>
  );
}

function EquationPanel({
  title,
  formula,
  terms,
  structure,
  children,
}: {
  title: string;
  formula: string;
  terms?: ReactNode[];
  structure?: ReactNode[];
  children?: ReactNode;
}) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.28)] md:p-8">
      <h3 className="mb-8 text-lg font-black tracking-wide text-blue-300 md:text-xl">
        {title}
      </h3>

      <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-10">
        <div className="text-center text-slate-100 [&_.katex]:text-3xl [&_.katex]:text-slate-100 [&_.katex-display]:my-0 md:[&_.katex]:text-5xl">
          <MathFormula formula={formula} display={true} />
        </div>
      </div>

      {(terms?.length || structure?.length) && (
        <div className="mt-8 grid gap-5 border-t border-slate-700 pt-8 md:grid-cols-2">
          {terms?.length ? (
            <MiniInfoCard title="Termo a termo">
              <ul className="space-y-3">
                {terms.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MiniInfoCard>
          ) : null}

          {structure?.length ? (
            <MiniInfoCard title="Por que essa estrutura?">
              <ul className="space-y-3">
                {structure.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MiniInfoCard>
          ) : null}
        </div>
      )}

      {children ? (
        <div className="mt-8 border-t border-slate-700 pt-8">
          <h4 className="mb-5 text-base font-black text-blue-300 md:text-lg">
            📐 Dedução física da equação
          </h4>

          <div className="space-y-4">{children}</div>
        </div>
      ) : null}
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
  type?: "info" | "warning" | "success" | "dark" | "danger";
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

function BulletList({ items }: { items: ReactNode[] }) {
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

function NumberedList({ items }: { items: ReactNode[] }) {
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

function FormulaSummaryCard({
  title,
  formula,
  description,
}: {
  title: string;
  formula: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-black text-slate-950">{title}</h3>
      <FormulaBlock formula={formula} />
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
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
          {example.content}
        </div>
      )}
    </article>
  );
}

export default function EletricidadeTopicEletrodinamica() {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");

  const examples: Example[] = [
    {
      id: "ex1",
      title: "Exemplo 1 — Corrente elétrica a partir da carga e do tempo",
      statement:
        "Uma carga de 24 C atravessa uma seção de um fio em 6 s. Determine a corrente média.",
      content: (
        <>
          <p>
            Corrente mede quanta carga atravessa uma seção do condutor por unidade
            de tempo.
          </p>

          <FormulaBlock formula={String.raw`i = \frac{\Delta Q}{\Delta t}`} />
          <FormulaBlock formula={String.raw`i = \frac{24}{6}`} />
          <FormulaBlock formula={String.raw`i = 4 \ \text{A}`} />

          <NoteBox title="Resposta" type="success">
            A corrente média é{" "}
            <InlineFormula formula={String.raw`4 \ \text{A}`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex2",
      title: "Exemplo 2 — Número de elétrons atravessando uma seção",
      statement:
        "Uma corrente de 3,2 A atravessa um fio durante 5 s. Quantos elétrons atravessam uma seção nesse intervalo?",
      content: (
        <>
          <FormulaBlock formula={String.raw`Q = i\Delta t`} />
          <FormulaBlock formula={String.raw`Q = 3{,}2 \cdot 5 = 16 \ \text{C}`} />
          <FormulaBlock formula={String.raw`Q = ne`} />
          <FormulaBlock
            formula={String.raw`n = \frac{Q}{e} = \frac{16}{1{,}6 \times 10^{-19}}`}
          />
          <FormulaBlock formula={String.raw`n = 1{,}0 \times 10^{20}`} />

          <NoteBox title="Resposta" type="success">
            Atravessam a seção aproximadamente{" "}
            <InlineFormula formula={String.raw`1{,}0 \times 10^{20}`} /> elétrons.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex3",
      title: "Exemplo 3 — Primeira Lei de Ohm",
      statement:
        "Um resistor de 8 Ω é submetido a uma tensão de 24 V. Determine a corrente.",
      content: (
        <>
          <FormulaBlock formula={String.raw`U = Ri`} />
          <FormulaBlock formula={String.raw`i = \frac{U}{R} = \frac{24}{8}`} />
          <FormulaBlock formula={String.raw`i = 3 \ \text{A}`} />

          <NoteBox title="Resposta" type="success">
            A corrente elétrica vale{" "}
            <InlineFormula formula={String.raw`3 \ \text{A}`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex4",
      title: "Exemplo 4 — Segunda Lei de Ohm",
      statement:
        "Um fio tem comprimento 10 m, área 2,0 × 10⁻⁶ m² e resistividade 2,0 × 10⁻⁸ Ω·m. Determine sua resistência.",
      content: (
        <>
          <FormulaBlock formula={String.raw`R = \rho\frac{L}{A}`} />
          <FormulaBlock
            formula={String.raw`R = 2{,}0 \times 10^{-8}\cdot\frac{10}{2{,}0 \times 10^{-6}}`}
          />
          <FormulaBlock formula={String.raw`R = 0{,}10 \ \Omega`} />

          <NoteBox title="Resposta" type="success">
            A resistência do fio é{" "}
            <InlineFormula formula={String.raw`0{,}10 \ \Omega`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex5",
      title: "Exemplo 5 — Associação em série",
      statement:
        "Três resistores de 2 Ω, 3 Ω e 5 Ω estão em série ligados a uma fonte de 20 V.",
      content: (
        <>
          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3`}
          />
          <FormulaBlock formula={String.raw`R_{\text{eq}} = 2 + 3 + 5 = 10 \ \Omega`} />
          <FormulaBlock formula={String.raw`i = \frac{U}{R_{\text{eq}}} = \frac{20}{10}`} />
          <FormulaBlock formula={String.raw`i = 2 \ \text{A}`} />

          <NoteBox title="Ideia importante" type="warning">
            Em série, a corrente é a mesma em todos os resistores. A tensão é que
            se divide.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Associação em paralelo",
      statement:
        "Dois resistores de 6 Ω e 3 Ω estão em paralelo ligados a uma fonte de 12 V.",
      content: (
        <>
          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`}
          />
          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{6\cdot 3}{6 + 3} = 2 \ \Omega`}
          />
          <FormulaBlock formula={String.raw`i = \frac{12}{2} = 6 \ \text{A}`} />

          <NoteBox title="Ideia importante" type="info">
            Em paralelo, a resistência equivalente é menor que a menor resistência
            individual.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex7",
      title: "Exemplo 7 — Associação mista",
      statement:
        "Um resistor de 4 Ω está em série com uma associação em paralelo de 6 Ω e 3 Ω. O circuito é ligado a 18 V.",
      content: (
        <>
          <FormulaBlock formula={String.raw`R_p = \frac{6\cdot 3}{6 + 3} = 2 \ \Omega`} />
          <FormulaBlock formula={String.raw`R_{\text{eq}} = 4 + 2 = 6 \ \Omega`} />
          <FormulaBlock formula={String.raw`i = \frac{18}{6} = 3 \ \text{A}`} />

          <NoteBox title="Leitura do circuito" type="warning">
            Em associação mista, primeiro identifique nós, depois reduza série e
            paralelo por etapas.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex8",
      title: "Exemplo 8 — Potência elétrica",
      statement:
        "Um aparelho ligado a 220 V é atravessado por corrente de 5 A. Determine a potência elétrica.",
      content: (
        <>
          <FormulaBlock formula={String.raw`P = Ui`} />
          <FormulaBlock formula={String.raw`P = 220\cdot 5 = 1100 \ \text{W}`} />
          <FormulaBlock formula={String.raw`P = 1{,}1 \ \text{kW}`} />

          <NoteBox title="Resposta" type="success">
            O aparelho possui potência de{" "}
            <InlineFormula formula={String.raw`1100 \ \text{W}`} />, ou{" "}
            <InlineFormula formula={String.raw`1{,}1 \ \text{kW}`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex9",
      title: "Exemplo 9 — Consumo em kWh",
      statement:
        "Um chuveiro de 5500 W funciona por 30 minutos por dia durante 20 dias.",
      content: (
        <>
          <FormulaBlock
            formula={String.raw`5500 \ \text{W} = 5{,}5 \ \text{kW}`}
          />
          <FormulaBlock
            formula={String.raw`30 \ \text{min} = 0{,}5 \ \text{h}`}
          />
          <FormulaBlock formula={String.raw`\Delta t = 0{,}5\cdot 20 = 10 \ \text{h}`} />
          <FormulaBlock formula={String.raw`E = P\Delta t = 5{,}5\cdot 10`} />
          <FormulaBlock formula={String.raw`E = 55 \ \text{kWh}`} />

          <NoteBox title="Erro comum" type="warning">
            kW é unidade de potência. kWh é unidade de energia.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex10",
      title: "Exemplo 10 — Efeito Joule",
      statement:
        "Um resistor de 10 Ω é atravessado por corrente de 2 A durante 5 min. Determine a energia dissipada.",
      content: (
        <>
          <FormulaBlock formula={String.raw`E = Ri^2\Delta t`} />
          <FormulaBlock formula={String.raw`5 \ \text{min} = 300 \ \text{s}`} />
          <FormulaBlock formula={String.raw`E = 10\cdot 2^2\cdot 300`} />
          <FormulaBlock formula={String.raw`E = 1{,}2 \times 10^4 \ \text{J}`} />

          <NoteBox title="Ideia física" type="info">
            O aquecimento cresce com o quadrado da corrente.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex11",
      title: "Exemplo 11 — Gerador real",
      statement:
        "Um gerador possui ε = 12 V e resistência interna r = 1 Ω. Ele fornece corrente de 2 A.",
      content: (
        <>
          <FormulaBlock formula={String.raw`U = \varepsilon - ri`} />
          <FormulaBlock formula={String.raw`U = 12 - 1\cdot 2 = 10 \ \text{V}`} />

          <NoteBox title="Resposta" type="success">
            A tensão nos terminais do gerador é{" "}
            <InlineFormula formula={String.raw`10 \ \text{V}`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex12",
      title: "Exemplo 12 — Receptor real",
      statement:
        "Um motor possui força contraeletromotriz ε' = 20 V e resistência interna r' = 2 Ω. Ele é atravessado por corrente de 3 A.",
      content: (
        <>
          <FormulaBlock formula={String.raw`U = \varepsilon' + r'i`} />
          <FormulaBlock formula={String.raw`U = 20 + 2\cdot 3 = 26 \ \text{V}`} />

          <NoteBox title="Diferença essencial" type="info">
            Gerador real:{" "}
            <InlineFormula formula={String.raw`U = \varepsilon - ri`} />.
            Receptor real:{" "}
            <InlineFormula formula={String.raw`U = \varepsilon' + r'i`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex13",
      title: "Exemplo 13 — Amperímetro e voltímetro",
      statement:
        "Deseja-se medir a corrente que passa por um resistor e a tensão em seus terminais. Como ligar os instrumentos?",
      content: (
        <>
          <p>
            O amperímetro mede corrente e deve ficar em série. O voltímetro mede
            tensão e deve ficar em paralelo.
          </p>

          <FormulaBlock formula={String.raw`R_A = 0`} />
          <FormulaBlock formula={String.raw`R_V \to \infty`} />

          <NoteBox title="Erro perigoso" type="danger">
            Amperímetro em paralelo pode causar curto-circuito. Voltímetro em
            série pode quase interromper o circuito.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex14",
      title: "Exemplo 14 — Kirchhoff com uma malha",
      statement:
        "Uma bateria ideal de 12 V alimenta resistores de 2 Ω e 4 Ω em série.",
      content: (
        <>
          <FormulaBlock formula={String.raw`+12 - 2i - 4i = 0`} />
          <FormulaBlock formula={String.raw`12 - 6i = 0`} />
          <FormulaBlock formula={String.raw`i = 2 \ \text{A}`} />

          <NoteBox title="Interpretação" type="success">
            A soma das quedas de tensão nos resistores iguala a tensão fornecida
            pela fonte.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex15",
      title: "Exemplo 15 — Kirchhoff com duas malhas",
      statement:
        "Duas malhas compartilham um resistor de 2 Ω. Na esquerda há fonte de 10 V e resistor de 3 Ω. Na direita há fonte de 8 V e resistor de 4 Ω.",
      content: (
        <>
          <p>
            Escolhemos correntes de malha{" "}
            <InlineFormula formula={String.raw`i_1`} /> e{" "}
            <InlineFormula formula={String.raw`i_2`} /> no sentido horário.
          </p>

          <FormulaBlock
            formula={String.raw`10 - 3i_1 - 2(i_1 - i_2) = 0`}
          />
          <FormulaBlock formula={String.raw`5i_1 - 2i_2 = 10`} />

          <FormulaBlock
            formula={String.raw`8 - 4i_2 - 2(i_2 - i_1) = 0`}
          />
          <FormulaBlock formula={String.raw`-2i_1 + 6i_2 = 8`} />

          <FormulaBlock
            formula={String.raw`\begin{cases}5i_1 - 2i_2 = 10\\-2i_1 + 6i_2 = 8\end{cases}`}
          />

          <FormulaBlock formula={String.raw`i_1 = \frac{38}{13} \ \text{A}`} />
          <FormulaBlock formula={String.raw`i_2 = \frac{30}{13} \ \text{A}`} />

          <NoteBox title="Resposta final" type="success">
            Como as correntes deram positivas, os sentidos escolhidos estavam
            corretos.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex16",
      title: "Exemplo 16 — Ponte de Wheatstone",
      statement:
        "Uma ponte possui R₁ = 2 Ω, R₂ = 4 Ω, R₃ = 3 Ω e R₄ desconhecido. Determine R₄ para equilíbrio.",
      content: (
        <>
          <FormulaBlock
            formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
          />
          <FormulaBlock formula={String.raw`\frac{2}{4} = \frac{3}{R_4}`} />
          <FormulaBlock formula={String.raw`R_4 = 6 \ \Omega`} />

          <NoteBox title="Resposta" type="success">
            Para equilíbrio,{" "}
            <InlineFormula formula={String.raw`R_4 = 6 \ \Omega`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex17",
      title: "Exemplo 17 — Potência máxima transferida",
      statement:
        "Um gerador real de força eletromotriz ε e resistência interna r alimenta um resistor externo variável R.",
      content: (
        <>
          <FormulaBlock formula={String.raw`i = \frac{\varepsilon}{R + r}`} />
          <FormulaBlock
            formula={String.raw`P_R = R\left(\frac{\varepsilon}{R + r}\right)^2`}
          />
          <FormulaBlock
            formula={String.raw`P_R = \frac{R\varepsilon^2}{(R + r)^2}`}
          />
          <FormulaBlock formula={String.raw`P_{\max} \Rightarrow R = r`} />
          <FormulaBlock formula={String.raw`P_{\max} = \frac{\varepsilon^2}{4r}`} />

          <NoteBox title="Ideia de prova difícil" type="warning">
            Potência máxima e rendimento máximo não são a mesma coisa. Quando{" "}
            <InlineFormula formula={String.raw`R = r`} />, o rendimento é 50%.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex18",
      title: "Exemplo 18 — Simetria e ponto equipotencial",
      statement:
        "Em uma rede simétrica, dois pontos possuem o mesmo potencial. O que acontece com um resistor ligado entre esses pontos?",
      content: (
        <>
          <FormulaBlock formula={String.raw`V_A = V_B`} />
          <FormulaBlock formula={String.raw`U_{AB} = V_A - V_B = 0`} />
          <FormulaBlock formula={String.raw`i = \frac{U_{AB}}{R} = 0`} />

          <NoteBox title="Conclusão" type="success">
            Um resistor ligado entre pontos equipotenciais não é atravessado por
            corrente.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex19",
      title: "Exemplo 19 — Voltímetro real alterando a medida",
      statement:
        "Um divisor de tensão possui dois resistores de 10 kΩ ligados a 12 V. Um voltímetro real de 10 kΩ mede a tensão no segundo resistor.",
      content: (
        <>
          <p>
            O voltímetro real fica em paralelo com o resistor medido, alterando a
            resistência equivalente daquele trecho.
          </p>

          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{10\,000\cdot 10\,000}{10\,000 + 10\,000}`}
          />
          <FormulaBlock formula={String.raw`R_{\text{eq}} = 5\,000 \ \Omega`} />
          <FormulaBlock
            formula={String.raw`U_{\text{medido}} = 12\cdot\frac{5}{10 + 5} = 4 \ \text{V}`}
          />

          <NoteBox title="Moral da história" type="warning">
            Instrumento real pode alterar o circuito.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex20",
      title: "Exemplo 20 — Potência em série e paralelo",
      statement:
        "Compare o comportamento da potência quando a corrente é fixa e quando a tensão é fixa.",
      content: (
        <>
          <p>Se a corrente é a mesma:</p>
          <FormulaBlock formula={String.raw`P = Ri^2`} />

          <p>Se a tensão é a mesma:</p>
          <FormulaBlock formula={String.raw`P = \frac{U^2}{R}`} />

          <NoteBox title="Erro clássico" type="danger">
            Primeiro veja qual grandeza está fixa: corrente ou tensão.
          </NoteBox>
        </>
      ),
    },
  ];

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
                    A Eletrodinâmica explica como cargas se movem, como a tensão
                    fornece energia, como resistores dissipam potência e como
                    circuitos reais funcionam com geradores, receptores,
                    instrumentos e leis de Kirchhoff.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["28", "tópicos"],
                    ["20", "exemplos"],
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

            <SectionCard
              icon={BookOpen}
              title="1. Contexto físico e histórico"
              accent="from-indigo-600 to-purple-700"
            >
              <p>
                A Eletrodinâmica é a parte da Eletricidade que estuda as cargas
                elétricas em movimento e os efeitos associados a esse movimento.
                Enquanto a Eletrostática analisa cargas em repouso, campos
                elétricos, potencial e equilíbrio eletrostático, a
                Eletrodinâmica começa quando essas cargas passam a se deslocar de
                maneira ordenada, produzindo corrente elétrica.
              </p>

              <p>
                Ela não substitui a Eletrostática. Ela nasce dela. Para haver
                corrente elétrica em um condutor, normalmente existe uma
                diferença de potencial entre dois pontos. Essa diferença de
                potencial cria um campo elétrico dentro do condutor, e esse campo
                exerce força elétrica sobre os portadores de carga livres.
              </p>

              <NumberedList
                items={[
                  "uma fonte estabelece diferença de potencial;",
                  "a diferença de potencial produz campo elétrico no condutor;",
                  "o campo elétrico exerce força sobre cargas livres;",
                  "as cargas passam a ter movimento ordenado;",
                  "esse movimento ordenado é a corrente elétrica;",
                  "a energia elétrica pode ser transformada em calor, luz, movimento, som e processamento de informação.",
                ]}
              />

              <p>
                Historicamente, o estudo da eletricidade avançou quando se tornou
                possível manter uma corrente contínua em circuitos, especialmente
                com o desenvolvimento das pilhas. A partir disso, a eletricidade
                deixou de ser apenas faísca e choque ocasional e passou a ser uma
                tecnologia controlável.
              </p>

              <BulletList
                items={[
                  "circuitos elétricos simples;",
                  "instalações residenciais;",
                  "lâmpadas e chuveiros elétricos;",
                  "motores elétricos;",
                  "baterias e carregadores;",
                  "linhas de transmissão;",
                  "fusíveis e disjuntores;",
                  "instrumentos de medida;",
                  "sistemas eletrônicos e redes de energia.",
                ]}
              />

              <NoteBox title="Ideia central" type="success">
                A Eletrodinâmica estuda como as cargas se movem em circuitos e
                como a energia elétrica é transferida, transformada e dissipada.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="2. Ideia intuitiva de corrente elétrica"
              accent="from-purple-600 to-indigo-700"
            >
              <p>
                Corrente elétrica é o fluxo ordenado de cargas elétricas. Dentro
                de um metal, existem elétrons livres. Mesmo sem uma bateria
                ligada, eles já se movem de forma aleatória por causa da agitação
                térmica. Só que esse movimento não forma corrente resultante,
                porque não há direção preferencial.
              </p>

              <p>
                Quando ligamos o fio a uma fonte, estabelece-se uma diferença de
                potencial entre os extremos do condutor. Essa diferença cria um
                campo elétrico interno, e o campo organiza o movimento médio dos
                elétrons livres. Esse movimento médio ordenado é chamado de
                movimento de deriva.
              </p>

              <NoteBox title="Movimento de deriva" type="info">
                A corrente elétrica em metais não significa que os elétrons saem
                voando pelo fio como foguetes microscópicos. Eles continuam com
                movimento térmico caótico, mas passam a ter uma pequena tendência
                média em uma direção.
              </NoteBox>

              <EquationPanel
                title="Sentido real e sentido convencional"
                formula={String.raw`\text{sentido dos elétrons} = \text{oposto ao sentido convencional}`}
                terms={[
                  <span>
                    <strong>Sentido real dos elétrons:</strong> em metais, vai do
                    polo negativo para o polo positivo.
                  </span>,
                  <span>
                    <strong>Sentido convencional:</strong> é o sentido em que
                    cargas positivas se moveriam.
                  </span>,
                  <span>
                    <strong>Campo elétrico:</strong> aponta no sentido da força
                    sobre uma carga positiva.
                  </span>,
                ]}
                structure={[
                  <span>
                    A convenção foi criada antes de se saber que, nos metais, os
                    portadores móveis eram elétrons.
                  </span>,
                  <span>
                    Como o elétron tem carga negativa, sua força elétrica tem
                    sentido oposto ao campo elétrico.
                  </span>,
                  <span>
                    Em circuitos, mantemos o sentido convencional por padrão
                    histórico e por consistência matemática.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: força elétrica sobre uma carga">
                  <MathFormula formula={String.raw`\vec{F} = q\vec{E}`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 2: carga positiva">
                  <MathFormula
                    formula={String.raw`q > 0 \Rightarrow \vec{F} \parallel \vec{E}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 3: elétron">
                  <MathFormula
                    formula={String.raw`q < 0 \Rightarrow \vec{F} \text{ oposta a } \vec{E}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Corrente contínua e alternada" type="info">
                Na corrente contínua, o sentido convencional permanece o mesmo ao
                longo do tempo. Na corrente alternada, o sentido muda
                periodicamente.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Gauge}
              title="3. Definição formal de corrente elétrica"
              accent="from-slate-950 to-indigo-800"
            >
              <p>
                A definição formal de corrente elétrica transforma a ideia
                intuitiva de fluxo de cargas em uma grandeza mensurável. Em vez
                de apenas dizer que cargas estão passando por um fio, perguntamos:
                quanta carga atravessa uma seção do condutor em certo intervalo
                de tempo?
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`i = \frac{\Delta Q}{\Delta t}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente elétrica
                    média, medida em ampère.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta Q`} />: carga que
                    atravessa uma seção do condutor.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta t`} />: intervalo
                    de tempo observado.
                  </span>,
                ]}
                structure={[
                  <span>
                    A corrente compara carga transportada com tempo gasto.
                  </span>,
                  <span>
                    Se a mesma carga passa em menos tempo, a corrente é maior.
                  </span>,
                  <span>
                    Se menos carga passa no mesmo tempo, a corrente é menor.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: escolher uma seção do condutor">
                  <p>
                    A seção transversal funciona como uma porta de contagem. Ela
                    não armazena carga; apenas define onde medimos a passagem das
                    cargas.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 2: contar a carga que atravessa">
                  <p>
                    Chamamos essa carga total de{" "}
                    <InlineFormula formula={String.raw`\Delta Q`} />.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 3: dividir pelo tempo">
                  <MathFormula
                    formula={String.raw`i = \frac{\Delta Q}{\Delta t}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 4: interpretar a unidade">
                  <MathFormula
                    formula={String.raw`1 \ \text{A} = 1 \ \text{C/s}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Corrente instantânea"
                formula={String.raw`i = \frac{dQ}{dt}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente no
                    instante analisado.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`dQ`} />: variação
                    infinitesimal de carga.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`dt`} />: intervalo
                    infinitesimal de tempo.
                  </span>,
                ]}
                structure={[
                  <span>
                    É a versão instantânea da corrente média.
                  </span>,
                  <span>
                    Surge quando a carga transportada é dada por uma função{" "}
                    <InlineFormula formula={String.raw`Q(t)`} />.
                  </span>,
                  <span>
                    Em termos matemáticos, corrente é a derivada da carga em
                    relação ao tempo.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: partir da corrente média">
                  <MathFormula
                    formula={String.raw`i_m = \frac{\Delta Q}{\Delta t}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: fazer o intervalo tender a zero">
                  <MathFormula
                    formula={String.raw`i = \lim_{\Delta t \to 0}\frac{\Delta Q}{\Delta t} = \frac{dQ}{dt}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Corrente e número de elétrons"
                formula={String.raw`Q = ne`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`Q`} />: carga total
                    transportada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`n`} />: número de elétrons.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`e`} />: carga elementar,
                    com módulo{" "}
                    <InlineFormula
                      formula={String.raw`1{,}6 \times 10^{-19} \ \text{C}`}
                    />.
                  </span>,
                ]}
                structure={[
                  <span>
                    Cada elétron carrega uma quantidade fixa de carga em módulo.
                  </span>,
                  <span>
                    A carga total é o número de elétrons vezes a carga elementar.
                  </span>,
                  <span>
                    Depois de achar{" "}
                    <InlineFormula formula={String.raw`Q`} />, usamos{" "}
                    <InlineFormula formula={String.raw`i = Q/\Delta t`} />.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: carga de um elétron">
                  <MathFormula
                    formula={String.raw`|q_e| = e = 1{,}6 \times 10^{-19} \ \text{C}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: muitos elétrons">
                  <MathFormula formula={String.raw`Q = ne`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 3: corrente associada">
                  <MathFormula
                    formula={String.raw`i = \frac{ne}{\Delta t}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Leitura correta" type="warning">
                Em metais, os portadores são elétrons, que possuem carga
                negativa. Em problemas de corrente, normalmente usamos o módulo
                da carga transportada.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="4. Condições para existir corrente elétrica"
              accent="from-indigo-700 to-blue-700"
            >
              <p>
                Para existir corrente elétrica em um circuito, não basta haver
                cargas elétricas. Todo material comum possui cargas. O que
                diferencia um circuito funcionando de um objeto qualquer é a
                presença de portadores móveis e uma causa capaz de organizar o
                movimento desses portadores.
              </p>

              <NumberedList
                items={[
                  "existência de portadores de carga livres;",
                  "existência de diferença de potencial;",
                  "existência de campo elétrico no condutor;",
                  "caminho fechado para manutenção da corrente;",
                  "presença de uma fonte ou gerador.",
                ]}
              />

              <EquationPanel
                title="A cadeia física da corrente elétrica"
                formula={String.raw`\Delta V \Rightarrow \vec{E} \Rightarrow \vec{F} = q\vec{E} \Rightarrow \text{movimento ordenado} \Rightarrow i`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`\Delta V`} />: diferença
                    de potencial criada pela fonte.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\vec{E}`} />: campo
                    elétrico estabelecido no condutor.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\vec{F} = q\vec{E}`} />:
                    força elétrica sobre os portadores livres.
                  </span>,
                ]}
                structure={[
                  <span>
                    A fonte mantém diferença de potencial.
                  </span>,
                  <span>
                    A diferença de potencial cria campo elétrico.
                  </span>,
                  <span>
                    O campo organiza o movimento dos portadores livres.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: fonte">
                  <p>
                    A fonte mantém seus terminais em potenciais diferentes.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 2: campo elétrico">
                  <p>
                    Com o circuito fechado, estabelece-se campo elétrico ao longo
                    dos condutores.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 3: força elétrica">
                  <MathFormula formula={String.raw`\vec{F} = q\vec{E}`} display={true} />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Circuito fechado, aberto e curto-circuito"
                formula={String.raw`i = \frac{U}{R}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente elétrica.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão aplicada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência
                    equivalente do caminho.
                  </span>,
                ]}
                structure={[
                  <span>
                    Circuito aberto equivale a resistência efetiva enorme.
                  </span>,
                  <span>
                    Circuito fechado permite corrente em regime estacionário.
                  </span>,
                  <span>
                    Curto-circuito é caminho de resistência muito baixa.
                  </span>,
                ]}
              >
                <DerivationStep title="Circuito aberto">
                  <MathFormula
                    formula={String.raw`R \to \infty \Rightarrow i \to 0`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Curto-circuito">
                  <MathFormula
                    formula={String.raw`R \to 0 \Rightarrow i \text{ muito grande}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Curto-circuito" type="danger">
                Curto-circuito não é só caminho pequeno no desenho. É caminho de
                resistência muito baixa entre pontos com diferença de potencial.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Flame}
              title="5. Tensão elétrica, diferença de potencial e energia"
              accent="from-blue-700 to-cyan-700"
            >
              <p>
                Tensão elétrica, ou diferença de potencial, mede energia por
                unidade de carga. Ela não é corrente. Ela não é “quantidade de
                eletricidade”. Ela responde a uma pergunta física bem direta:
                quanta energia está associada a cada coulomb de carga?
              </p>

              <NoteBox title="Ideia intuitiva" type="info">
                Pense na tensão como uma diferença de nível energético. Ela não é
                o fluxo das cargas. Ela é a razão energética para que as cargas
                possam ganhar ou perder energia ao atravessar um trecho do
                circuito.
              </NoteBox>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`U = \frac{W}{q}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão elétrica ou
                    diferença de potencial.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`W`} />: trabalho ou energia
                    transferida.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`q`} />: carga elétrica.
                  </span>,
                ]}
                structure={[
                  <span>
                    A tensão compara energia com carga.
                  </span>,
                  <span>
                    O volt é joule por coulomb.
                  </span>,
                  <span>
                    Se a tensão dobra, cada coulomb recebe ou perde o dobro de
                    energia.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: energia por carga">
                  <MathFormula
                    formula={String.raw`U = \frac{W}{q}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: energia transferida">
                  <MathFormula formula={String.raw`W = qU`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 3: unidade">
                  <MathFormula
                    formula={String.raw`1 \ \text{V} = 1 \ \text{J/C}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <p>
                Uma bateria de <InlineFormula formula={String.raw`12 \ \text{V}`} />{" "}
                fornece, idealmente,{" "}
                <InlineFormula formula={String.raw`12 \ \text{J}`} /> para cada
                coulomb de carga que passa por ela.
              </p>

              <BulletList
                items={[
                  "tensão é energia por unidade de carga;",
                  "corrente é carga por unidade de tempo;",
                  "uma fonte fornece energia às cargas;",
                  "um resistor transforma parte dessa energia em calor;",
                  "um motor transforma parte dessa energia em movimento.",
                ]}
              />

              <NoteBox title="Não confunda" type="warning">
                Tensão alta não significa automaticamente corrente alta. A
                corrente também depende da resistência do caminho.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="6. Resistência elétrica"
              accent="from-cyan-700 to-teal-700"
            >
              <p>
                Resistência elétrica é a oposição que um elemento oferece à
                passagem da corrente elétrica. Microscopicamente, em um metal, os
                elétrons livres interagem com a rede cristalina, sofrem
                espalhamentos e transferem energia ao material, geralmente como
                aquecimento.
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`R = \frac{U}{i}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência
                    elétrica.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão aplicada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente elétrica.
                  </span>,
                ]}
                structure={[
                  <span>
                    A resistência mede quanta tensão é necessária para sustentar
                    certa corrente.
                  </span>,
                  <span>
                    Para a mesma tensão, maior resistência implica menor corrente.
                  </span>,
                  <span>
                    Para a mesma corrente, maior resistência implica maior queda
                    de tensão.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: definição">
                  <MathFormula
                    formula={String.raw`R = \frac{U}{i}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: unidade">
                  <MathFormula
                    formula={String.raw`1 \ \Omega = 1 \ \frac{\text{V}}{\text{A}}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <p>
                Dizer que um resistor tem{" "}
                <InlineFormula formula={String.raw`10 \ \Omega`} /> significa que
                ele exige{" "}
                <InlineFormula formula={String.raw`10 \ \text{V}`} /> para cada{" "}
                <InlineFormula formula={String.raw`1 \ \text{A}`} /> de corrente,
                se operar como resistor ôhmico.
              </p>
            </SectionCard>

            <SectionCard
              icon={Calculator}
              title="7. Primeira Lei de Ohm"
              accent="from-teal-700 to-emerald-700"
            >
              <p>
                A Primeira Lei de Ohm descreve uma relação linear entre tensão e
                corrente em resistores ôhmicos. Se a resistência permanece
                constante, dobrar a tensão dobra a corrente.
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`U = Ri`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão ou queda de
                    potencial.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência
                    elétrica.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente elétrica.
                  </span>,
                ]}
                structure={[
                  <span>
                    A equação é linear porque a resistência permanece constante.
                  </span>,
                  <span>
                    Se a corrente aumenta, a tensão aumenta na mesma proporção.
                  </span>,
                  <span>
                    No gráfico{" "}
                    <InlineFormula formula={String.raw`U \times i`} />, a
                    inclinação é a resistência.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: definição de resistência">
                  <MathFormula
                    formula={String.raw`R = \frac{U}{i}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: isolar a tensão">
                  <MathFormula formula={String.raw`U = Ri`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 3: inclinação do gráfico">
                  <MathFormula
                    formula={String.raw`R = \frac{\Delta U}{\Delta i}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Resistor não ôhmico" type="warning">
                Nem todo componente obedece a essa relação linear. Diodos,
                lâmpadas e termistores podem ter resistência variável.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Compass}
              title="8. Segunda Lei de Ohm"
              accent="from-emerald-700 to-lime-700"
            >
              <p>
                A Segunda Lei de Ohm explica de onde vem o valor da resistência
                de um fio. A resistência depende do material, do comprimento e da
                área da seção transversal.
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`R = \rho\frac{L}{A}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência do
                    condutor.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\rho`} />: resistividade do
                    material.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`L`} />: comprimento do fio.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`A`} />: área da seção
                    transversal.
                  </span>,
                ]}
                structure={[
                  <span>
                    Fio mais comprido oferece mais caminho e maior resistência.
                  </span>,
                  <span>
                    Fio mais grosso oferece mais espaço e menor resistência.
                  </span>,
                  <span>
                    A resistividade diz se o material conduz bem ou mal.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: comprimento">
                  <MathFormula formula={String.raw`R \propto L`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 2: área">
                  <MathFormula
                    formula={String.raw`R \propto \frac{1}{A}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 3: material">
                  <MathFormula
                    formula={String.raw`R = \rho\frac{L}{A}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 4: unidade da resistividade">
                  <MathFormula
                    formula={String.raw`\rho = R\frac{A}{L}`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`[\rho] = \Omega\cdot\text{m}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="9. Resistividade e temperatura"
              accent="from-lime-700 to-amber-700"
            >
              <p>
                Em metais, quando a temperatura aumenta, a rede cristalina vibra
                mais intensamente, dificultando o movimento ordenado dos elétrons.
                Por isso, a resistência geralmente aumenta.
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`R = R_0(1 + \alpha \Delta T)`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência final.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R_0`} />: resistência
                    inicial.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\alpha`} />: coeficiente de
                    temperatura.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta T`} />: variação de
                    temperatura.
                  </span>,
                ]}
                structure={[
                  <span>
                    É uma aproximação linear.
                  </span>,
                  <span>
                    A variação relativa da resistência é proporcional à variação
                    de temperatura.
                  </span>,
                  <span>
                    Em metais, normalmente{" "}
                    <InlineFormula formula={String.raw`\alpha > 0`} />.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: variação relativa">
                  <MathFormula
                    formula={String.raw`\frac{R - R_0}{R_0} = \alpha \Delta T`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: reorganizar">
                  <MathFormula
                    formula={String.raw`R = R_0(1 + \alpha\Delta T)`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Cuidado" type="warning">
                Essa fórmula é uma aproximação para intervalos moderados de
                temperatura, não uma lei universal para qualquer situação.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="10. Associação de resistores em série"
              accent="from-amber-700 to-orange-700"
            >
              <p>
                Resistores estão em série quando são atravessados pela mesma
                corrente elétrica. As cargas passam por um resistor e depois pelo
                outro, sem divisão de caminho.
              </p>

              <EquationPanel
                title="Associação em série"
                formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R_{\text{eq}}`} />:
                    resistência equivalente.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R_1, R_2, R_3`} />:
                    resistores em sequência.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: mesma corrente em
                    todos.
                  </span>,
                ]}
                structure={[
                  <span>
                    A corrente não se divide.
                  </span>,
                  <span>
                    A tensão total é a soma das quedas de tensão.
                  </span>,
                  <span>
                    Resistências em sequência se somam.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: mesma corrente">
                  <MathFormula
                    formula={String.raw`i_1 = i_2 = i_3 = \cdots = i`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: soma das tensões">
                  <MathFormula
                    formula={String.raw`U = U_1 + U_2 + U_3 + \cdots`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 3: aplicar U = Ri">
                  <MathFormula
                    formula={String.raw`U = R_1i + R_2i + R_3i + \cdots`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Divisor de tensão" type="info">
                Em série, o resistor maior recebe maior parcela da tensão total.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="11. Associação de resistores em paralelo"
              accent="from-orange-700 to-red-700"
            >
              <p>
                Resistores estão em paralelo quando seus terminais estão ligados
                aos mesmos dois nós. Nesse caso, todos ficam submetidos à mesma
                tensão.
              </p>

              <EquationPanel
                title="Associação em paralelo"
                formula={String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R_{\text{eq}}`} />:
                    resistência equivalente.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R_1, R_2, R_3`} />:
                    resistores ligados aos mesmos dois nós.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão comum a
                    todos os ramos.
                  </span>,
                ]}
                structure={[
                  <span>
                    A tensão é a mesma em todos os resistores.
                  </span>,
                  <span>
                    A corrente total se divide entre os ramos.
                  </span>,
                  <span>
                    Cada novo ramo cria um novo caminho para a corrente.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: mesma tensão">
                  <MathFormula
                    formula={String.raw`U_1 = U_2 = U_3 = \cdots = U`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: soma das correntes">
                  <MathFormula
                    formula={String.raw`i = i_1 + i_2 + i_3 + \cdots`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 3: aplicar a Lei de Ohm">
                  <MathFormula
                    formula={String.raw`i = \frac{U}{R_1} + \frac{U}{R_2} + \frac{U}{R_3} + \cdots`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 4: comparar com o equivalente">
                  <MathFormula
                    formula={String.raw`i = \frac{U}{R_{\text{eq}}}`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <FormulaBlock
                formula={String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`}
              />

              <FormulaBlock formula={String.raw`R_{\text{eq}} = \frac{R}{n}`} />

              <NoteBox title="Ideia intuitiva" type="success">
                Em paralelo, adicionar resistor cria mais um caminho para a
                corrente, então a resistência equivalente diminui.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="12. Associação mista e leitura de nós"
              accent="from-red-700 to-rose-700"
            >
              <p>
                Associação mista combina resistores em série e em paralelo. O
                erro comum é tentar resolver pela aparência do desenho. Em
                circuito, quem manda são os nós.
              </p>

              <EquationPanel
                title="Critério físico de série e paralelo"
                formula={String.raw`\text{mesmos nós} \Rightarrow \text{paralelo}`}
                terms={[
                  <span>
                    <strong>Nó:</strong> região condutora equipotencial em fio
                    ideal.
                  </span>,
                  <span>
                    <strong>Série:</strong> mesma corrente e ausência de
                    ramificação intermediária.
                  </span>,
                  <span>
                    <strong>Paralelo:</strong> mesmos dois nós e mesma tensão.
                  </span>,
                ]}
                structure={[
                  <span>
                    O desenho não manda; as conexões mandam.
                  </span>,
                  <span>
                    Fios ideais unem pontos em um mesmo nó.
                  </span>,
                  <span>
                    Dois componentes desenhados longe podem estar em paralelo.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: identificar fios ideais">
                  <p>
                    Pontos ligados diretamente por fio ideal pertencem ao mesmo
                    nó.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 2: procurar paralelos">
                  <p>
                    Se dois resistores ligam o mesmo par de nós, estão em
                    paralelo.
                  </p>
                </DerivationStep>

                <DerivationStep title="Passo 3: procurar séries">
                  <p>
                    Se dois resistores estão em sequência sem ramificação entre
                    eles, estão em série.
                  </p>
                </DerivationStep>
              </EquationPanel>

              <NumberedList
                items={[
                  "identifique os nós do circuito;",
                  "marque pontos ligados por fios ideais como o mesmo nó;",
                  "procure resistores ligados aos mesmos dois nós;",
                  "procure resistores em sequência sem ramificação;",
                  "substitua cada grupo por sua resistência equivalente;",
                  "redesenhe o circuito simplificado;",
                  "repita até chegar à resistência equivalente total.",
                ]}
              />
            </SectionCard>

            <SectionCard
              icon={Flame}
              title="13. Potência elétrica"
              accent="from-rose-700 to-pink-700"
            >
              <p>
                Potência mede a rapidez com que energia é transferida ou
                transformada. Em circuitos, ela indica a taxa com que energia
                elétrica é fornecida, consumida ou dissipada.
              </p>

              <EquationPanel
                title="A Equação e Seus Termos"
                formula={String.raw`P = Ui`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`P`} />: potência elétrica.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão elétrica.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente elétrica.
                  </span>,
                ]}
                structure={[
                  <span>
                    Tensão é energia por carga.
                  </span>,
                  <span>
                    Corrente é carga por tempo.
                  </span>,
                  <span>
                    Multiplicando as duas, sobra energia por tempo.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: potência">
                  <MathFormula
                    formula={String.raw`P = \frac{\Delta E}{\Delta t}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: energia elétrica">
                  <MathFormula formula={String.raw`E = qU`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 3: substituir">
                  <MathFormula
                    formula={String.raw`P = \frac{qU}{\Delta t}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 4: reconhecer corrente">
                  <MathFormula
                    formula={String.raw`i = \frac{q}{\Delta t}`}
                    display={true}
                  />
                  <MathFormula formula={String.raw`P = Ui`} display={true} />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Potência em resistor"
                formula={String.raw`P = Ri^2 = \frac{U^2}{R}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`P = Ui`} />: forma geral.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`P = Ri^2`} />: útil quando
                    a corrente é conhecida.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`P = U^2/R`} />: útil
                    quando a tensão é conhecida.
                  </span>,
                ]}
                structure={[
                  <span>
                    As duas formas vêm da Lei de Ohm.
                  </span>,
                  <span>
                    Em série, a corrente é comum.
                  </span>,
                  <span>
                    Em paralelo, a tensão é comum.
                  </span>,
                ]}
              >
                <DerivationStep title="Dedução de P = Ri²">
                  <MathFormula
                    formula={String.raw`P = Ui = (Ri)i = Ri^2`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Dedução de P = U²/R">
                  <MathFormula
                    formula={String.raw`P = Ui = U\left(\frac{U}{R}\right) = \frac{U^2}{R}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Armadilha clássica" type="warning">
                Se a corrente é a mesma, potência cresce com a resistência. Se a
                tensão é a mesma, potência diminui com a resistência.
              </NoteBox>

              <FormulaBlock formula={String.raw`E = P\Delta t`} />
              <FormulaBlock
                formula={String.raw`1 \ \text{kWh} = 3{,}6 \times 10^6 \ \text{J}`}
              />
            </SectionCard>

            <SectionCard
              icon={Flame}
              title="14. Efeito Joule"
              accent="from-pink-700 to-fuchsia-700"
            >
              <p>
                O efeito Joule é a transformação de energia elétrica em energia
                térmica devido à passagem de corrente por um resistor ou condutor
                real.
              </p>

              <EquationPanel
                title="Energia dissipada por efeito Joule"
                formula={String.raw`E = Ri^2\Delta t`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`E`} />: energia dissipada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta t`} />: intervalo
                    de tempo.
                  </span>,
                ]}
                structure={[
                  <span>
                    O aquecimento cresce com a resistência.
                  </span>,
                  <span>
                    O aquecimento cresce com o quadrado da corrente.
                  </span>,
                  <span>
                    Quanto maior o tempo, maior a energia dissipada.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: potência dissipada">
                  <MathFormula formula={String.raw`P = Ri^2`} display={true} />
                </DerivationStep>

                <DerivationStep title="Passo 2: energia">
                  <MathFormula
                    formula={String.raw`E = P\Delta t`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 3: substituição">
                  <MathFormula
                    formula={String.raw`E = Ri^2\Delta t`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <BulletList
                items={[
                  "chuveiro elétrico;",
                  "ferro de passar;",
                  "secador de cabelo;",
                  "aquecedores elétricos;",
                  "torradeiras;",
                  "lâmpadas incandescentes;",
                  "fusíveis.",
                ]}
              />

              <NoteBox title="Perigo físico" type="danger">
                Corrente alta é perigosa porque o aquecimento cresce com{" "}
                <InlineFormula formula={String.raw`i^2`} />.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="15. Geradores elétricos"
              accent="from-fuchsia-700 to-violet-700"
            >
              <p>
                Gerador elétrico transforma alguma forma de energia em energia
                elétrica. A grandeza central é a força eletromotriz{" "}
                <InlineFormula formula={String.raw`\varepsilon`} />, que mede
                energia fornecida por unidade de carga.
              </p>

              <EquationPanel
                title="Força eletromotriz"
                formula={String.raw`\varepsilon = \frac{W}{q}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon`} />: força
                    eletromotriz.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`W`} />: energia fornecida.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`q`} />: carga que atravessa
                    o gerador.
                  </span>,
                ]}
                structure={[
                  <span>
                    Mede energia fornecida por unidade de carga.
                  </span>,
                  <span>
                    Não é força, apesar do nome.
                  </span>,
                  <span>
                    Em gerador ideal,{" "}
                    <InlineFormula formula={String.raw`U = \varepsilon`} />.
                  </span>,
                ]}
              >
                <DerivationStep title="Gerador ideal">
                  <MathFormula formula={String.raw`U = \varepsilon`} display={true} />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Gerador real"
                formula={String.raw`U = \varepsilon - ri`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão nos
                    terminais.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon`} />: força
                    eletromotriz.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`r`} />: resistência
                    interna.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente fornecida.
                  </span>,
                ]}
                structure={[
                  <span>
                    Parte da energia é perdida dentro do gerador.
                  </span>,
                  <span>
                    A queda interna vale{" "}
                    <InlineFormula formula={String.raw`ri`} />.
                  </span>,
                  <span>
                    Quanto maior a corrente, menor a tensão útil nos terminais.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: perda interna">
                  <MathFormula
                    formula={String.raw`U_{\text{interna}} = ri`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: tensão útil">
                  <MathFormula
                    formula={String.raw`U = \varepsilon - ri`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Potências no gerador real"
                formula={String.raw`P_{\text{útil}} = P_{\text{total}} - P_{\text{dissipada}}`}
                terms={[
                  <span>
                    <InlineFormula
                      formula={String.raw`P_{\text{total}} = \varepsilon i`}
                    />
                    : potência total.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`P_{\text{útil}} = Ui`} />:
                    potência útil.
                  </span>,
                  <span>
                    <InlineFormula
                      formula={String.raw`P_{\text{dissipada}} = ri^2`}
                    />
                    : potência dissipada internamente.
                  </span>,
                ]}
                structure={[
                  <span>
                    Multiplicar tensão por corrente dá potência.
                  </span>,
                  <span>
                    A potência total se divide entre parte útil e perdas.
                  </span>,
                  <span>
                    O rendimento compara o útil com o total.
                  </span>,
                ]}
              >
                <DerivationStep title="Multiplicando a equação por i">
                  <MathFormula
                    formula={String.raw`U = \varepsilon - ri`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`Ui = \varepsilon i - ri^2`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Rendimento">
                  <MathFormula
                    formula={String.raw`\eta = \frac{P_{\text{útil}}}{P_{\text{total}}} = \frac{U}{\varepsilon}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>
            </SectionCard>

            <SectionCard
              icon={Gauge}
              title="16. Receptores elétricos"
              accent="from-violet-700 to-indigo-800"
            >
              <p>
                Receptor elétrico recebe energia elétrica e transforma parte dela
                em outra forma útil, como movimento em um motor ou energia
                química em uma bateria sendo carregada.
              </p>

              <EquationPanel
                title="Receptor real"
                formula={String.raw`U = \varepsilon' + r'i`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão aplicada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon'`} />: força
                    contraeletromotriz.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`r'`} />: resistência
                    interna.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente.
                  </span>,
                ]}
                structure={[
                  <span>
                    A tensão aplicada alimenta a conversão útil de energia.
                  </span>,
                  <span>
                    Também compensa a perda interna por efeito Joule.
                  </span>,
                  <span>
                    Por isso o termo interno aparece somando.
                  </span>,
                ]}
              >
                <DerivationStep title="Parte útil">
                  <p>
                    A força contraeletromotriz representa a energia útil por
                    unidade de carga.
                  </p>
                </DerivationStep>

                <DerivationStep title="Queda interna">
                  <MathFormula
                    formula={String.raw`U_{\text{interna}} = r'i`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Tensão total aplicada">
                  <MathFormula
                    formula={String.raw`U = \varepsilon' + r'i`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Comparação fundamental" type="info">
                Gerador real:{" "}
                <InlineFormula formula={String.raw`U = \varepsilon - ri`} />.
                Receptor real:{" "}
                <InlineFormula formula={String.raw`U = \varepsilon' + r'i`} />.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Calculator}
              title="17. Instrumentos de medida"
              accent="from-indigo-800 to-slate-950"
            >
              <p>
                Instrumentos de medida precisam ser ligados de acordo com a
                grandeza que medem. Um erro de ligação altera o circuito e pode
                até danificar o instrumento.
              </p>

              <EquationPanel
                title="Amperímetro e voltímetro ideais"
                formula={String.raw`R_A = 0 \qquad \text{e} \qquad R_V \to \infty`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R_A`} />: resistência
                    interna do amperímetro.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R_V`} />: resistência
                    interna do voltímetro.
                  </span>,
                  <span>
                    <strong>Amperímetro:</strong> mede corrente e fica em série.
                  </span>,
                  <span>
                    <strong>Voltímetro:</strong> mede tensão e fica em paralelo.
                  </span>,
                ]}
                structure={[
                  <span>
                    O amperímetro ideal não deve alterar a corrente medida.
                  </span>,
                  <span>
                    O voltímetro ideal não deve desviar corrente significativa.
                  </span>,
                  <span>
                    Por isso um tem resistência ideal nula e o outro resistência
                    ideal infinita.
                  </span>,
                ]}
              >
                <DerivationStep title="Amperímetro">
                  <MathFormula formula={String.raw`R_A = 0`} display={true} />
                </DerivationStep>

                <DerivationStep title="Voltímetro">
                  <MathFormula formula={String.raw`R_V \to \infty`} display={true} />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Erro comum que destrói questão" type="danger">
                Amperímetro em paralelo pode causar curto. Voltímetro em série
                pode quase interromper o circuito.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="18. Leis de Kirchhoff"
              accent="from-slate-950 to-indigo-900"
            >
              <p>
                As Leis de Kirchhoff analisam circuitos que não podem ser
                reduzidos apenas por série e paralelo. A Lei dos Nós vem da
                conservação da carga. A Lei das Malhas vem da conservação da
                energia.
              </p>

              <EquationPanel
                title="Lei dos nós"
                formula={String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`i_{\text{entrando}}`} />:
                    correntes que chegam ao nó.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i_{\text{saindo}}`} />:
                    correntes que saem do nó.
                  </span>,
                  <span>
                    <strong>Nó:</strong> região onde ramos se encontram.
                  </span>,
                ]}
                structure={[
                  <span>
                    Expressa conservação da carga.
                  </span>,
                  <span>
                    Carga não se acumula indefinidamente no nó.
                  </span>,
                  <span>
                    O que entra deve sair.
                  </span>,
                ]}
              >
                <DerivationStep title="Balanço de correntes">
                  <MathFormula
                    formula={String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Lei das malhas"
                formula={String.raw`\sum U = 0`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`\sum U`} />: soma
                    algébrica das variações de potencial.
                  </span>,
                  <span>
                    <strong>Malha:</strong> caminho fechado no circuito.
                  </span>,
                  <span>
                    <strong>Variação de potencial:</strong> aumento ou queda de
                    tensão.
                  </span>,
                ]}
                structure={[
                  <span>
                    Expressa conservação da energia.
                  </span>,
                  <span>
                    Ao dar uma volta completa, voltamos ao mesmo potencial.
                  </span>,
                  <span>
                    Subidas e quedas de potencial se compensam.
                  </span>,
                ]}
              >
                <DerivationStep title="Soma das variações">
                  <MathFormula formula={String.raw`\sum U = 0`} display={true} />
                </DerivationStep>

                <DerivationStep title="Sinais em resistores">
                  <MathFormula
                    formula={String.raw`\text{sentido da corrente} \Rightarrow -Ri`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`\text{contra a corrente} \Rightarrow +Ri`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Sinais em geradores">
                  <MathFormula
                    formula={String.raw`- \to + \Rightarrow +\varepsilon`}
                    display={true}
                  />
                  <MathFormula
                    formula={String.raw`+ \to - \Rightarrow -\varepsilon`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Corrente negativa" type="warning">
                Corrente negativa não significa conta errada. Significa que o
                sentido real é oposto ao escolhido.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Compass}
              title="19. Ponte de Wheatstone"
              accent="from-indigo-900 to-purple-900"
            >
              <p>
                A Ponte de Wheatstone é usada para comparar resistências e medir
                resistências desconhecidas. A ponte está equilibrada quando não
                passa corrente pelo galvanômetro.
              </p>

              <EquationPanel
                title="Condição de equilíbrio da ponte"
                formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`R_1, R_2, R_3, R_4`} />:
                    resistores da ponte.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i_G`} />: corrente no
                    galvanômetro.
                  </span>,
                  <span>
                    <strong>Equilíbrio:</strong>{" "}
                    <InlineFormula formula={String.raw`i_G = 0`} />.
                  </span>,
                ]}
                structure={[
                  <span>
                    Os pontos intermediários têm mesmo potencial.
                  </span>,
                  <span>
                    Sem diferença de potencial, não há corrente no galvanômetro.
                  </span>,
                  <span>
                    A igualdade de razões vem dos divisores de tensão.
                  </span>,
                ]}
              >
                <DerivationStep title="Passo 1: corrente nula">
                  <MathFormula
                    formula={String.raw`i_G = 0 \Rightarrow V_A = V_B`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Passo 2: condição final">
                  <MathFormula
                    formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <NoteBox title="Uso estratégico" type="success">
                Quando a ponte está equilibrada, o ramo do galvanômetro pode ser
                ignorado na análise.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={AlertTriangle}
              title="20. Curto-circuito, fusíveis e disjuntores"
              accent="from-red-700 to-slate-950"
            >
              <p>
                Curto-circuito ocorre quando pontos com diferença de potencial
                são conectados por um caminho de resistência muito baixa.
              </p>

              <EquationPanel
                title="Por que curto-circuito é perigoso?"
                formula={String.raw`i = \frac{U}{R}`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão mantida
                    pela fonte.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência muito
                    pequena.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente que pode
                    crescer muito.
                  </span>,
                ]}
                structure={[
                  <span>
                    Se a tensão existe e a resistência cai muito, a corrente
                    cresce.
                  </span>,
                  <span>
                    O aquecimento depende fortemente da corrente.
                  </span>,
                  <span>
                    Fusíveis e disjuntores interrompem o circuito em situações
                    perigosas.
                  </span>,
                ]}
              >
                <DerivationStep title="Corrente pela Lei de Ohm">
                  <MathFormula
                    formula={String.raw`i = \frac{U}{R}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Resistência muito pequena">
                  <MathFormula
                    formula={String.raw`R \to 0 \Rightarrow i \text{ muito grande}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Aquecimento por efeito Joule">
                  <MathFormula formula={String.raw`P = Ri^2`} display={true} />
                </DerivationStep>
              </EquationPanel>

              <BulletList
                items={[
                  "fusível: derrete e abre o circuito quando a corrente passa do limite;",
                  "disjuntor: interrompe o circuito e pode ser rearmado;",
                  "DR: ajuda na proteção contra choques por fuga de corrente;",
                  "aterramento: fornece caminho seguro para correntes indesejadas.",
                ]}
              />
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="21. Capacitores em corrente contínua"
              accent="from-slate-900 to-blue-900"
            >
              <p>
                Capacitores armazenam carga elétrica e energia em um campo
                elétrico entre suas placas. Em corrente contínua, depois de muito
                tempo, um capacitor ideal carregado se comporta como circuito
                aberto.
              </p>

              <EquationPanel
                title="Carga armazenada em capacitor"
                formula={String.raw`Q = CU`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`Q`} />: carga armazenada.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`C`} />: capacitância.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão entre as
                    placas.
                  </span>,
                ]}
                structure={[
                  <span>
                    Para mesma capacitância, maior tensão armazena mais carga.
                  </span>,
                  <span>
                    Para mesma tensão, maior capacitância armazena mais carga.
                  </span>,
                  <span>
                    Em CC estacionária, capacitor carregado bloqueia corrente
                    contínua.
                  </span>,
                ]}
              >
                <DerivationStep title="Definição de capacitância">
                  <MathFormula
                    formula={String.raw`C = \frac{Q}{U}`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Isolando a carga">
                  <MathFormula formula={String.raw`Q = CU`} display={true} />
                </DerivationStep>

                <DerivationStep title="Regime estacionário">
                  <MathFormula
                    formula={String.raw`\text{capacitor carregado em CC estacionária} \Rightarrow \text{circuito aberto}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="22. Gráficos importantes"
              accent="from-blue-900 to-indigo-900"
            >
              <p>
                Gráficos mostram relações físicas e permitem extrair resistência,
                força eletromotriz, resistência interna e comportamento ôhmico.
              </p>

              <EquationPanel
                title="Gráfico U × i para resistor ôhmico"
                formula={String.raw`U = Ri`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`U`} />: eixo vertical.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: eixo horizontal.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: inclinação.
                  </span>,
                ]}
                structure={[
                  <span>
                    A equação tem forma linear.
                  </span>,
                  <span>
                    A reta passa pela origem.
                  </span>,
                  <span>
                    Maior inclinação significa maior resistência.
                  </span>,
                ]}
              >
                <DerivationStep title="Comparação com função linear">
                  <MathFormula formula={String.raw`U = Ri`} display={true} />
                  <MathFormula formula={String.raw`y = ax`} display={true} />
                </DerivationStep>

                <DerivationStep title="Inclinação">
                  <MathFormula
                    formula={String.raw`R = \frac{\Delta U}{\Delta i}`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Gráfico P × i para resistor"
                formula={String.raw`P = Ri^2`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`P`} />: potência.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} />: corrente.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R`} />: resistência.
                  </span>,
                ]}
                structure={[
                  <span>
                    O gráfico é parabólico.
                  </span>,
                  <span>
                    A potência cresce com o quadrado da corrente.
                  </span>,
                  <span>
                    Corrente dobrada implica potência quatro vezes maior.
                  </span>,
                ]}
              >
                <DerivationStep title="Corrente dobrada">
                  <MathFormula
                    formula={String.raw`P' = R(2i)^2 = 4Ri^2 = 4P`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Gráfico U × i para gerador real"
                formula={String.raw`U = \varepsilon - ri`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon`} />:
                    intercepto vertical.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`-r`} />: inclinação.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão nos
                    terminais.
                  </span>,
                ]}
                structure={[
                  <span>
                    A reta é decrescente.
                  </span>,
                  <span>
                    Quando{" "}
                    <InlineFormula formula={String.raw`i = 0`} />,{" "}
                    <InlineFormula formula={String.raw`U = \varepsilon`} />.
                  </span>,
                  <span>
                    Quanto maior a resistência interna, maior a queda da reta.
                  </span>,
                ]}
              >
                <DerivationStep title="Circuito aberto">
                  <MathFormula
                    formula={String.raw`i = 0 \Rightarrow U = \varepsilon`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Inclinação">
                  <MathFormula
                    formula={String.raw`\frac{\Delta U}{\Delta i} = -r`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>

              <EquationPanel
                title="Gráfico U × i para receptor real"
                formula={String.raw`U = \varepsilon' + r'i`}
                terms={[
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon'`} />:
                    intercepto vertical.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`r'`} />: inclinação.
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} />: tensão aplicada.
                  </span>,
                ]}
                structure={[
                  <span>
                    A reta é crescente.
                  </span>,
                  <span>
                    O intercepto representa a energia útil por unidade de carga.
                  </span>,
                  <span>
                    A inclinação representa a resistência interna.
                  </span>,
                ]}
              >
                <DerivationStep title="Intercepto">
                  <MathFormula
                    formula={String.raw`i = 0 \Rightarrow U = \varepsilon'`}
                    display={true}
                  />
                </DerivationStep>

                <DerivationStep title="Inclinação">
                  <MathFormula
                    formula={String.raw`\frac{\Delta U}{\Delta i} = r'`}
                    display={true}
                  />
                </DerivationStep>
              </EquationPanel>
            </SectionCard>

            <SectionCard
              icon={Calculator}
              title="23. Análise dimensional"
              accent="from-indigo-900 to-slate-950"
            >
              <FormulaBlock formula={String.raw`i = \frac{\Delta Q}{\Delta t}`} />
              <FormulaBlock
                formula={String.raw`[i] = \frac{\text{C}}{\text{s}} = \text{A}`}
              />
              <FormulaBlock formula={String.raw`R = \frac{U}{i}`} />
              <FormulaBlock
                formula={String.raw`[R] = \frac{\text{V}}{\text{A}} = \Omega`}
              />
              <FormulaBlock formula={String.raw`P = Ui`} />
              <FormulaBlock
                formula={String.raw`[P] = \frac{\text{J}}{\text{C}}\cdot\frac{\text{C}}{\text{s}} = \text{W}`}
              />
              <FormulaBlock formula={String.raw`[\rho] = \Omega\cdot\text{m}`} />
              <FormulaBlock formula={String.raw`[E] = \text{J}`} />
            </SectionCard>

            <SectionCard
              icon={Lightbulb}
              title="24. Aplicações práticas"
              accent="from-amber-600 to-orange-700"
            >
              <p>
                O chuveiro elétrico usa efeito Joule. A corrente atravessa uma
                resistência e a energia elétrica é transformada em energia
                térmica, aquecendo a água.
              </p>

              <FormulaBlock formula={String.raw`P = \frac{U^2}{R}`} />

              <p>
                Para tensão fixa, diminuir a resistência aumenta a potência. Por
                isso, em muitos chuveiros, a posição “inverno” corresponde a
                menor resistência elétrica.
              </p>

              <p>
                Linhas de transmissão transportam energia elétrica por longas
                distâncias. As perdas por efeito Joule nos fios são:
              </p>

              <FormulaBlock formula={String.raw`P_{\text{perdida}} = Ri^2`} />
              <FormulaBlock formula={String.raw`P = Ui`} />
              <FormulaBlock formula={String.raw`i = \frac{P}{U}`} />

              <NoteBox title="Por que alta tensão?" type="success">
                Para a mesma potência transmitida, aumentar a tensão reduz a
                corrente. Como as perdas dependem de{" "}
                <InlineFormula formula={String.raw`i^2`} />, transmitir em alta
                tensão reduz muito as perdas.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={AlertTriangle}
              title="25. Armadilhas e erros comuns"
              accent="from-red-700 to-red-950"
            >
              <BulletList
                items={[
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
                  "não perceber curto-circuito.",
                ]}
              />

              <NoteBox title="Resumo da confusão humana" type="warning">
                Corrente não é energia. Tensão não é corrente. Potência não é
                energia. Resistência não é resistividade. Série não é paralelo.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="26. Pontos importantes para ITA/IME"
              accent="from-slate-950 to-purple-900"
            >
              <p>
                Em provas difíceis, Eletrodinâmica raramente é só aplicar{" "}
                <InlineFormula formula={String.raw`U = Ri`} />. O conteúdo
                aparece misturado com simetria, gráficos, energia, instrumentos e
                modelagem de circuitos reais.
              </p>

              <BulletList
                items={[
                  "circuitos com simetria e pontos equipotenciais;",
                  "associações não evidentes de resistores;",
                  "potência máxima transferida;",
                  "resistência equivalente em redes;",
                  "geradores e receptores reais;",
                  "análise gráfica;",
                  "Kirchhoff com sinais;",
                  "ponte de Wheatstone;",
                  "instrumentos ideais e reais;",
                  "conservação de energia em circuitos.",
                ]}
              />

              <NoteBox title="Roteiro mental de prova" type="dark">
                Antes de calcular, pergunte: quais elementos estão em série?
                Quais estão em paralelo? Há pontos equipotenciais? A corrente se
                divide? A tensão é comum? Há resistência interna? O instrumento
                altera o circuito?
              </NoteBox>
            </SectionCard>
          </>
        )}

        {activeTab === "exemplos" && (
          <>
            <CompactTabHeader
              icon={Target}
              eyebrow="Treino comentado"
              title="Exemplos resolvidos"
              description="Exercícios em ordem crescente: corrente, Ohm, associações, potência, Joule, geradores, receptores, instrumentos, Kirchhoff, ponte, simetria e potência máxima."
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
              description="As fórmulas principais e as diferenças conceituais que seguram o conteúdo inteiro."
              accent="from-slate-950 via-slate-900 to-indigo-950"
            />

            <SectionCard
              icon={Zap}
              title="Fórmulas essenciais"
              accent="from-indigo-600 to-purple-700"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormulaSummaryCard
                  title="Corrente média"
                  formula={String.raw`i = \frac{\Delta Q}{\Delta t}`}
                  description="Carga que atravessa uma seção por unidade de tempo."
                />

                <FormulaSummaryCard
                  title="Corrente instantânea"
                  formula={String.raw`i = \frac{dQ}{dt}`}
                  description="Taxa instantânea de passagem de carga."
                />

                <FormulaSummaryCard
                  title="Carga quantizada"
                  formula={String.raw`Q = ne`}
                  description="Carga total associada a n elétrons."
                />

                <FormulaSummaryCard
                  title="Tensão elétrica"
                  formula={String.raw`U = \frac{W}{q}`}
                  description="Energia por unidade de carga."
                />

                <FormulaSummaryCard
                  title="Resistência elétrica"
                  formula={String.raw`R = \frac{U}{i}`}
                  description="Oposição à passagem da corrente."
                />

                <FormulaSummaryCard
                  title="Primeira Lei de Ohm"
                  formula={String.raw`U = Ri`}
                  description="Relação entre tensão, resistência e corrente."
                />

                <FormulaSummaryCard
                  title="Segunda Lei de Ohm"
                  formula={String.raw`R = \rho\frac{L}{A}`}
                  description="Resistência em função do material e da geometria."
                />

                <FormulaSummaryCard
                  title="Série"
                  formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`}
                  description="Mesma corrente em todos os resistores."
                />

                <FormulaSummaryCard
                  title="Paralelo"
                  formula={String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \cdots`}
                  description="Mesma tensão em todos os ramos."
                />

                <FormulaSummaryCard
                  title="Potência elétrica"
                  formula={String.raw`P = Ui`}
                  description="Taxa de transformação de energia elétrica."
                />

                <FormulaSummaryCard
                  title="Potência em resistor"
                  formula={String.raw`P = Ri^2 = \frac{U^2}{R}`}
                  description="Formas úteis usando a Lei de Ohm."
                />

                <FormulaSummaryCard
                  title="Efeito Joule"
                  formula={String.raw`E = Ri^2\Delta t`}
                  description="Energia elétrica dissipada como calor."
                />

                <FormulaSummaryCard
                  title="Gerador real"
                  formula={String.raw`U = \varepsilon - ri`}
                  description="Tensão terminal menor que a fem."
                />

                <FormulaSummaryCard
                  title="Receptor real"
                  formula={String.raw`U = \varepsilon' + r'i`}
                  description="Tensão alimenta conversão útil e dissipação interna."
                />

                <FormulaSummaryCard
                  title="Lei dos nós"
                  formula={String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`}
                  description="Conservação da carga."
                />

                <FormulaSummaryCard
                  title="Lei das malhas"
                  formula={String.raw`\sum U = 0`}
                  description="Conservação da energia."
                />

                <FormulaSummaryCard
                  title="Wheatstone"
                  formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
                  description="Condição de equilíbrio da ponte."
                />

                <FormulaSummaryCard
                  title="Potência máxima"
                  formula={String.raw`R = r`}
                  description="Máxima potência externa em gerador real."
                />
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
                  "voltímetro mede tensão e fica em paralelo.",
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
