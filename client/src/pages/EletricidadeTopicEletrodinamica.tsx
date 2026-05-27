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
            Corrente mede quanta carga atravessa uma seção do condutor por
            unidade de tempo.
          </p>

          <FormulaBlock formula={String.raw`i = \frac{\Delta Q}{\Delta t}`} />

          <p>Substituindo os dados:</p>

          <FormulaBlock formula={String.raw`i = \frac{24}{6}`} />
          <FormulaBlock formula={String.raw`i = 4 \ \text{A}`} />

          <NoteBox title="Resposta" type="success">
            A corrente média é{" "}
            <InlineFormula formula={String.raw`4 \ \text{A}`} />. Isso significa
            que passam, em média,{" "}
            <InlineFormula formula={String.raw`4 \ \text{C}`} /> por segundo
            pela seção do fio.
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
          <p>
            Primeiro calculamos a carga total que passou pela seção. Depois
            relacionamos essa carga ao número de elétrons.
          </p>

          <FormulaBlock formula={String.raw`Q = i\Delta t`} />

          <FormulaBlock formula={String.raw`Q = 3{,}2 \cdot 5`} />
          <FormulaBlock formula={String.raw`Q = 16 \ \text{C}`} />

          <p>Agora usamos a quantização da carga:</p>

          <FormulaBlock formula={String.raw`Q = ne`} />

          <FormulaBlock formula={String.raw`n = \frac{Q}{e}`} />

          <FormulaBlock
            formula={String.raw`n = \frac{16}{1{,}6 \times 10^{-19}}`}
          />

          <FormulaBlock formula={String.raw`n = 1{,}0 \times 10^{20}`} />

          <NoteBox title="Resposta" type="success">
            Atravessam a seção aproximadamente{" "}
            <InlineFormula formula={String.raw`1{,}0 \times 10^{20}`} />{" "}
            elétrons.
          </NoteBox>

          <NoteBox title="Erro comum" type="warning">
            Não use a carga elementar como{" "}
            <InlineFormula formula={String.raw`1{,}6 \times 10^{19}`} />. O
            expoente correto é negativo:{" "}
            <InlineFormula formula={String.raw`1{,}6 \times 10^{-19}`} />.
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
          <p>
            A resistência limita a corrente para uma dada tensão. Como o resistor
            é considerado ôhmico, usamos a Primeira Lei de Ohm.
          </p>

          <FormulaBlock formula={String.raw`U = Ri`} />

          <FormulaBlock formula={String.raw`i = \frac{U}{R}`} />

          <FormulaBlock formula={String.raw`i = \frac{24}{8}`} />

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
          <p>
            A resistência aumenta com o comprimento e diminui com a área da
            seção transversal.
          </p>

          <FormulaBlock formula={String.raw`R = \rho\frac{L}{A}`} />

          <FormulaBlock
            formula={String.raw`R = 2{,}0 \times 10^{-8}\cdot\frac{10}{2{,}0 \times 10^{-6}}`}
          />

          <FormulaBlock
            formula={String.raw`R = \frac{2{,}0 \times 10^{-7}}{2{,}0 \times 10^{-6}}`}
          />

          <FormulaBlock formula={String.raw`R = 1{,}0 \times 10^{-1}`} />
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
        "Três resistores de 2 Ω, 3 Ω e 5 Ω estão em série ligados a uma fonte de 20 V. Determine a resistência equivalente e a corrente total.",
      content: (
        <>
          <p>
            Em série, a corrente é a mesma em todos os resistores e as
            resistências se somam.
          </p>

          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3`}
          />

          <FormulaBlock formula={String.raw`R_{\text{eq}} = 2 + 3 + 5`} />
          <FormulaBlock formula={String.raw`R_{\text{eq}} = 10 \ \Omega`} />

          <p>Agora calculamos a corrente total:</p>

          <FormulaBlock formula={String.raw`i = \frac{U}{R_{\text{eq}}}`} />
          <FormulaBlock formula={String.raw`i = \frac{20}{10}`} />
          <FormulaBlock formula={String.raw`i = 2 \ \text{A}`} />

          <NoteBox title="Erro comum" type="warning">
            Em série, a corrente não vai diminuindo de resistor em resistor. A
            corrente é a mesma em todos; a tensão é que se divide.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex6",
      title: "Exemplo 6 — Associação em paralelo",
      statement:
        "Dois resistores de 6 Ω e 3 Ω estão em paralelo ligados a uma fonte de 12 V. Determine a resistência equivalente e a corrente total.",
      content: (
        <>
          <p>
            Em paralelo, os resistores estão submetidos à mesma tensão e a
            corrente total se divide entre os ramos.
          </p>

          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`}
          />

          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{6\cdot 3}{6 + 3}`}
          />

          <FormulaBlock formula={String.raw`R_{\text{eq}} = 2 \ \Omega`} />

          <p>Corrente total:</p>

          <FormulaBlock formula={String.raw`i = \frac{12}{2}`} />
          <FormulaBlock formula={String.raw`i = 6 \ \text{A}`} />

          <NoteBox title="Ideia importante" type="info">
            Em paralelo, a resistência equivalente é menor que a menor
            resistência do conjunto, porque novos ramos criam novos caminhos
            para a corrente.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex7",
      title: "Exemplo 7 — Associação mista",
      statement:
        "Um resistor de 4 Ω está em série com uma associação em paralelo de 6 Ω e 3 Ω. O circuito é ligado a uma fonte de 18 V.",
      content: (
        <>
          <p>
            Primeiro resolvemos o paralelo. Depois somamos com o resistor em
            série.
          </p>

          <FormulaBlock
            formula={String.raw`R_p = \frac{6\cdot 3}{6 + 3}`}
          />
          <FormulaBlock formula={String.raw`R_p = 2 \ \Omega`} />

          <p>Agora em série com o resistor de 4 Ω:</p>

          <FormulaBlock formula={String.raw`R_{\text{eq}} = 4 + 2`} />
          <FormulaBlock formula={String.raw`R_{\text{eq}} = 6 \ \Omega`} />

          <p>Corrente total:</p>

          <FormulaBlock formula={String.raw`i = \frac{18}{6}`} />
          <FormulaBlock formula={String.raw`i = 3 \ \text{A}`} />

          <NoteBox title="Leitura do circuito" type="warning">
            Em associação mista, a parte difícil quase nunca é a conta. A parte
            difícil é reconhecer quais resistores realmente estão em série ou em
            paralelo.
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
          <p>Potência é a taxa de transformação de energia.</p>

          <FormulaBlock formula={String.raw`P = Ui`} />

          <FormulaBlock formula={String.raw`P = 220\cdot 5`} />
          <FormulaBlock formula={String.raw`P = 1100 \ \text{W}`} />
          <FormulaBlock formula={String.raw`P = 1{,}1 \ \text{kW}`} />

          <NoteBox title="Resposta" type="success">
            O aparelho possui potência de{" "}
            <InlineFormula formula={String.raw`1100 \ \text{W}`} />, ou{" "}
            <InlineFormula formula={String.raw`1{,}1 \ \text{kW`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex9",
      title: "Exemplo 9 — Consumo em kWh",
      statement:
        "Um chuveiro de 5500 W funciona por 30 minutos por dia durante 20 dias. Determine o consumo em kWh.",
      content: (
        <>
          <p>
            Consumo de energia é potência multiplicada pelo tempo. Aqui usamos
            potência em kW e tempo em horas.
          </p>

          <FormulaBlock formula={String.raw`5500 \ \text{W} = 5{,}5 \ \text{kW}`} />
          <FormulaBlock formula={String.raw`30 \ \text{min} = 0{,}5 \ \text{h}`} />
          <FormulaBlock formula={String.raw`\Delta t = 0{,}5\cdot 20 = 10 \ \text{h}`} />

          <FormulaBlock formula={String.raw`E = P\Delta t`} />
          <FormulaBlock formula={String.raw`E = 5{,}5\cdot 10`} />
          <FormulaBlock formula={String.raw`E = 55 \ \text{kWh}`} />

          <NoteBox title="Erro comum" type="warning">
            kW é unidade de potência. kWh é unidade de energia. Confundir isso é
            quase uma tradição nacional nas contas de eletricidade.
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
          <p>
            A energia elétrica é transformada em energia térmica no resistor.
          </p>

          <FormulaBlock formula={String.raw`E = Ri^2\Delta t`} />

          <FormulaBlock formula={String.raw`5 \ \text{min} = 300 \ \text{s}`} />

          <FormulaBlock formula={String.raw`E = 10\cdot 2^2\cdot 300`} />
          <FormulaBlock formula={String.raw`E = 12000 \ \text{J}`} />
          <FormulaBlock formula={String.raw`E = 1{,}2 \times 10^4 \ \text{J}`} />

          <NoteBox title="Ideia física" type="info">
            O aquecimento cresce com o quadrado da corrente. Se a corrente
            dobra, a potência dissipada por efeito Joule quadruplica.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex11",
      title: "Exemplo 11 — Gerador real",
      statement:
        "Um gerador possui ε = 12 V e resistência interna r = 1 Ω. Ele fornece corrente de 2 A. Determine a tensão nos terminais.",
      content: (
        <>
          <p>
            Em um gerador real, parte da energia é dissipada internamente. Por
            isso, a tensão nos terminais é menor que a força eletromotriz.
          </p>

          <FormulaBlock formula={String.raw`U = \varepsilon - ri`} />

          <FormulaBlock formula={String.raw`U = 12 - 1\cdot 2`} />
          <FormulaBlock formula={String.raw`U = 10 \ \text{V}`} />

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
          <p>
            A tensão aplicada precisa alimentar a conversão útil de energia e
            ainda vencer a dissipação interna.
          </p>

          <FormulaBlock formula={String.raw`U = \varepsilon' + r'i`} />

          <FormulaBlock formula={String.raw`U = 20 + 2\cdot 3`} />
          <FormulaBlock formula={String.raw`U = 26 \ \text{V}`} />

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
            O amperímetro deve medir a corrente do ramo, portanto precisa ser
            atravessado por essa corrente.
          </p>

          <FormulaBlock formula={String.raw`R_A = 0`} />

          <p>
            Por isso, o amperímetro ideal é ligado em série e tem resistência
            interna idealmente nula.
          </p>

          <p>
            O voltímetro mede diferença de potencial entre dois pontos, por isso
            é ligado em paralelo.
          </p>

          <FormulaBlock formula={String.raw`R_V \to \infty`} />

          <NoteBox title="Erro perigoso" type="danger">
            Ligar amperímetro em paralelo pode causar curto-circuito. Ligar
            voltímetro em série pode quase interromper o circuito.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex14",
      title: "Exemplo 14 — Kirchhoff com uma malha",
      statement:
        "Uma bateria ideal de 12 V alimenta resistores de 2 Ω e 4 Ω em série. Use a Lei das Malhas para determinar a corrente.",
      content: (
        <>
          <p>
            A energia fornecida pela bateria é dissipada nos resistores. Vamos
            percorrer a malha no sentido da corrente.
          </p>

          <FormulaBlock formula={String.raw`+12 - R_1i - R_2i = 0`} />

          <FormulaBlock formula={String.raw`12 - 2i - 4i = 0`} />
          <FormulaBlock formula={String.raw`12 - 6i = 0`} />
          <FormulaBlock formula={String.raw`i = 2 \ \text{A}`} />

          <NoteBox title="Interpretação" type="success">
            A corrente é de{" "}
            <InlineFormula formula={String.raw`2 \ \text{A}`} />. A soma das
            quedas de tensão nos resistores iguala a tensão fornecida pela fonte.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex15",
      title: "Exemplo 15 — Kirchhoff com duas malhas resolvido até o fim",
      statement:
        "Duas malhas compartilham um resistor de 2 Ω. Na esquerda há fonte de 10 V e resistor de 3 Ω. Na direita há fonte de 8 V e resistor de 4 Ω.",
      content: (
        <>
          <p>
            Escolhemos as correntes de malha{" "}
            <InlineFormula formula={String.raw`i_1`} /> e{" "}
            <InlineFormula formula={String.raw`i_2`} /> no sentido horário. No
            resistor compartilhado, as correntes passam em sentidos opostos.
          </p>

          <p>Malha esquerda:</p>

          <FormulaBlock
            formula={String.raw`10 - 3i_1 - 2(i_1 - i_2) = 0`}
          />

          <FormulaBlock formula={String.raw`5i_1 - 2i_2 = 10`} />

          <p>Malha direita:</p>

          <FormulaBlock
            formula={String.raw`8 - 4i_2 - 2(i_2 - i_1) = 0`}
          />

          <FormulaBlock formula={String.raw`-2i_1 + 6i_2 = 8`} />

          <p>O sistema fica:</p>

          <FormulaBlock
            formula={String.raw`\begin{cases}5i_1 - 2i_2 = 10\\-2i_1 + 6i_2 = 8\end{cases}`}
          />

          <p>
            Multiplicando a primeira equação por 3 e somando com a segunda:
          </p>

          <FormulaBlock formula={String.raw`15i_1 - 6i_2 = 30`} />
          <FormulaBlock formula={String.raw`-2i_1 + 6i_2 = 8`} />
          <FormulaBlock formula={String.raw`13i_1 = 38`} />
          <FormulaBlock formula={String.raw`i_1 = \frac{38}{13} \ \text{A}`} />

          <p>Agora substituímos em uma das equações:</p>

          <FormulaBlock
            formula={String.raw`5\cdot\frac{38}{13} - 2i_2 = 10`}
          />

          <FormulaBlock formula={String.raw`\frac{190}{13} - 2i_2 = \frac{130}{13}`} />
          <FormulaBlock formula={String.raw`2i_2 = \frac{60}{13}`} />
          <FormulaBlock formula={String.raw`i_2 = \frac{30}{13} \ \text{A}`} />

          <NoteBox title="Resposta final" type="success">
            As correntes são{" "}
            <InlineFormula formula={String.raw`i_1 = \frac{38}{13} \ \text{A}`} />{" "}
            e{" "}
            <InlineFormula formula={String.raw`i_2 = \frac{30}{13} \ \text{A}`} />.
            Como ambas deram positivas, os sentidos escolhidos estavam corretos.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex16",
      title: "Exemplo 16 — Ponte de Wheatstone com resistor desconhecido",
      statement:
        "Uma ponte possui R₁ = 2 Ω, R₂ = 4 Ω, R₃ = 3 Ω e R₄ desconhecido. Determine R₄ para equilíbrio.",
      content: (
        <>
          <p>
            A ponte está em equilíbrio quando não passa corrente pelo
            galvanômetro.
          </p>

          <FormulaBlock
            formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
          />

          <FormulaBlock formula={String.raw`\frac{2}{4} = \frac{3}{R_4}`} />

          <FormulaBlock formula={String.raw`\frac{1}{2} = \frac{3}{R_4}`} />

          <FormulaBlock formula={String.raw`R_4 = 6 \ \Omega`} />

          <NoteBox title="Resposta" type="success">
            Para a ponte ficar equilibrada, o resistor desconhecido deve ser{" "}
            <InlineFormula formula={String.raw`6 \ \Omega`} />.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex17",
      title: "Exemplo 17 — Potência máxima transferida",
      statement:
        "Um gerador real de força eletromotriz ε e resistência interna r alimenta um resistor externo variável R. Determine R para potência externa máxima.",
      content: (
        <>
          <p>
            A corrente no circuito é determinada pela resistência total{" "}
            <InlineFormula formula={String.raw`R + r`} />.
          </p>

          <FormulaBlock formula={String.raw`i = \frac{\varepsilon}{R + r}`} />

          <p>A potência dissipada no resistor externo é:</p>

          <FormulaBlock formula={String.raw`P_R = Ri^2`} />

          <p>Substituindo a corrente:</p>

          <FormulaBlock
            formula={String.raw`P_R = R\left(\frac{\varepsilon}{R + r}\right)^2`}
          />

          <FormulaBlock
            formula={String.raw`P_R = \frac{R\varepsilon^2}{(R + r)^2}`}
          />

          <p>
            Ao maximizar essa função em relação a{" "}
            <InlineFormula formula={String.raw`R`} />, obtemos:
          </p>

          <FormulaBlock formula={String.raw`R = r`} />

          <p>Nesse caso:</p>

          <FormulaBlock formula={String.raw`i = \frac{\varepsilon}{2r}`} />

          <FormulaBlock formula={String.raw`U_R = \frac{\varepsilon}{2}`} />

          <FormulaBlock formula={String.raw`P_{\max} = \frac{\varepsilon^2}{4r}`} />

          <p>O rendimento nesse ponto é:</p>

          <FormulaBlock formula={String.raw`\eta = \frac{P_{\text{útil}}}{P_{\text{total}}}`} />
          <FormulaBlock formula={String.raw`\eta = \frac{1}{2}`} />

          <NoteBox title="Ideia de prova difícil" type="warning">
            A potência útil máxima ocorre quando{" "}
            <InlineFormula formula={String.raw`R = r`} />, mas o rendimento nesse
            ponto é apenas 50%. Potência máxima e rendimento máximo não são a
            mesma coisa.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex18",
      title: "Exemplo 18 — Simetria e ponto equipotencial",
      statement:
        "Em uma rede simétrica de resistores iguais, dois pontos possuem o mesmo potencial. O que acontece com um resistor ligado entre esses pontos?",
      content: (
        <>
          <p>
            Em circuitos simétricos, alguns pontos podem ficar no mesmo
            potencial elétrico. Se dois pontos têm mesmo potencial, a diferença
            de potencial entre eles é zero.
          </p>

          <FormulaBlock formula={String.raw`U_{AB} = V_A - V_B`} />

          <p>Se:</p>

          <FormulaBlock formula={String.raw`V_A = V_B`} />

          <p>então:</p>

          <FormulaBlock formula={String.raw`U_{AB} = 0`} />

          <p>A corrente no resistor entre A e B será:</p>

          <FormulaBlock formula={String.raw`i = \frac{U_{AB}}{R}`} />

          <FormulaBlock formula={String.raw`i = 0`} />

          <NoteBox title="Conclusão" type="success">
            Um resistor ligado entre pontos equipotenciais não é atravessado por
            corrente. Em muitos circuitos de ITA/IME, perceber isso simplifica
            uma rede aparentemente horrível.
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
            Sem o voltímetro, os dois resistores iguais dividiriam igualmente a
            tensão.
          </p>

          <FormulaBlock formula={String.raw`U_2 = 6 \ \text{V}`} />

          <p>
            Mas o voltímetro real tem resistência finita e fica em paralelo com o
            resistor medido.
          </p>

          <FormulaBlock
            formula={String.raw`R_{\text{eq}} = \frac{10\,000\cdot 10\,000}{10\,000 + 10\,000}`}
          />

          <FormulaBlock formula={String.raw`R_{\text{eq}} = 5\,000 \ \Omega`} />

          <p>Agora o divisor é formado por 10 kΩ em série com 5 kΩ.</p>

          <FormulaBlock
            formula={String.raw`U_{\text{medido}} = 12\cdot\frac{5}{10 + 5}`}
          />

          <FormulaBlock formula={String.raw`U_{\text{medido}} = 4 \ \text{V}`} />

          <NoteBox title="Moral da história" type="warning">
            Um voltímetro ideal não altera o circuito, mas um voltímetro real
            pode alterar a resistência equivalente do trecho medido e mudar a
            leitura.
          </NoteBox>
        </>
      ),
    },
    {
      id: "ex20",
      title: "Exemplo 20 — Comparação de potência em série e paralelo",
      statement:
        "Compare o comportamento da potência quando a corrente é fixa e quando a tensão é fixa.",
      content: (
        <>
          <p>
            Se a corrente é a mesma, como ocorre em resistores em série, a
            potência dissipada é:
          </p>

          <FormulaBlock formula={String.raw`P = Ri^2`} />

          <p>
            Com corrente fixa, maior resistência significa maior potência
            dissipada.
          </p>

          <p>
            Se a tensão é a mesma, como ocorre em resistores em paralelo, usamos:
          </p>

          <FormulaBlock formula={String.raw`P = \frac{U^2}{R}`} />

          <p>
            Com tensão fixa, maior resistência significa menor potência
            dissipada.
          </p>

          <NoteBox title="Erro clássico" type="danger">
            Não escolha fórmula de potência no automático. Primeiro veja qual
            grandeza está fixa no circuito: corrente ou tensão.
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
                elétricos produzidos por distribuições estáticas de carga,
                potencial elétrico e equilíbrio eletrostático, a Eletrodinâmica
                começa quando essas cargas passam a se deslocar de maneira
                ordenada, produzindo corrente elétrica e permitindo o
                funcionamento de circuitos.
              </p>

              <BulletList
                items={[
                  "na Eletrostática, estudamos cargas em repouso ou em equilíbrio;",
                  "na Eletrodinâmica, estudamos cargas em movimento ordenado;",
                  "na Eletrostática, o foco está em força elétrica, campo elétrico, potencial e energia potencial elétrica;",
                  "na Eletrodinâmica, esses conceitos aparecem aplicados a circuitos, correntes, resistores, geradores, receptores e potência elétrica.",
                ]}
              />

              <p>
                A Eletrodinâmica não substitui a Eletrostática. Ela nasce dela.
                Para haver corrente elétrica em um condutor, normalmente existe
                uma diferença de potencial entre dois pontos. Essa diferença de
                potencial cria um campo elétrico dentro do condutor. Esse campo
                exerce força elétrica sobre os portadores de carga livres. Com
                isso, cargas começam a se deslocar de maneira ordenada.
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
                Historicamente, o estudo da eletricidade passou por uma longa
                evolução. Primeiro vieram observações eletrostáticas, como corpos
                atritados atraindo pequenos objetos. Depois, com o
                desenvolvimento de pilhas, baterias e instrumentos de medição,
                tornou-se possível manter cargas em movimento contínuo em
                circuitos.
              </p>

              <p>
                A pilha de Volta, no início do século XIX, foi um marco
                importante porque permitiu obter uma fonte relativamente estável
                de corrente elétrica. A partir daí, a eletricidade deixou de ser
                apenas um fenômeno de faíscas e choques ocasionais e passou a ser
                uma ferramenta controlável.
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
                de um metal, como cobre ou alumínio, existem elétrons livres.
                Esses elétrons não ficam parados. Mesmo quando não há bateria
                ligada ao fio, eles possuem movimento térmico aleatório,
                movendo-se em várias direções por causa da agitação
                microscópica.
              </p>

              <p>
                Esse movimento térmico, porém, não constitui corrente elétrica
                resultante, porque é desordenado. Em média, para cada elétron
                indo para um lado, há outro indo para outro lado. Não existe
                fluxo líquido de carga atravessando uma seção do fio em uma
                direção preferencial.
              </p>

              <p>
                Quando ligamos o fio a uma fonte, como uma pilha ou bateria,
                estabelece-se uma diferença de potencial entre os extremos do
                condutor. Essa diferença de potencial cria um campo elétrico
                dentro do fio. O campo elétrico exerce força sobre os elétrons
                livres, fazendo com que, além do movimento térmico aleatório,
                eles passem a ter um pequeno movimento médio ordenado.
              </p>

              <NoteBox title="Movimento de deriva" type="info">
                Esse movimento médio ordenado é chamado de movimento de deriva.
                A corrente elétrica em metais está associada justamente a esse
                deslocamento coletivo dos elétrons livres.
              </NoteBox>

              <BulletList
                items={[
                  "movimento térmico aleatório: existe mesmo sem corrente resultante;",
                  "movimento ordenado de deriva: aparece quando há campo elétrico e gera corrente elétrica.",
                ]}
              />

              <p>
                Em metais, os portadores móveis são elétrons. Como os elétrons
                têm carga negativa, eles se movem, em média, do polo negativo
                para o polo positivo da fonte. Esse é o sentido real do
                movimento eletrônico nos metais.
              </p>

              <p>
                Por convenção histórica, definimos o sentido convencional da
                corrente como o sentido em que cargas positivas se moveriam.
              </p>

              <FormulaBlock
                formula={String.raw`\text{sentido convencional da corrente} = \text{sentido do movimento de cargas positivas}`}
              />

              <FormulaBlock
                formula={String.raw`\text{sentido dos elétrons} = \text{sentido oposto ao da corrente convencional}`}
              />

              <NoteBox title="Corrente contínua e alternada" type="info">
                Na corrente contínua, o sentido convencional permanece o mesmo ao
                longo do tempo. Na corrente alternada, o sentido muda
                periodicamente. Neste estudo inicial, o foco principal é corrente
                contínua em regime estacionário.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Gauge}
              title="3. Definição formal de corrente elétrica"
              accent="from-slate-950 to-indigo-800"
            >
              <p>
                A corrente elétrica média mede a quantidade de carga elétrica que
                atravessa uma seção transversal de um condutor por unidade de
                tempo.
              </p>

              <FormulaBlock formula={String.raw`i = \frac{\Delta Q}{\Delta t}`} />

              <BulletList
                items={[
                  <span>
                    <InlineFormula formula={String.raw`i`} /> é a corrente
                    elétrica média;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta Q`} /> é a
                    quantidade de carga que atravessa a seção;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta t`} /> é o
                    intervalo de tempo considerado.
                  </span>,
                ]}
              />

              <p>
                A unidade de corrente elétrica no Sistema Internacional é o
                ampère, símbolo <InlineFormula formula={String.raw`\text{A}`} />
                .
              </p>

              <FormulaBlock formula={String.raw`1 \ \text{A} = 1 \ \text{C/s}`} />

              <p>
                Quando a corrente varia ao longo do tempo, usamos a definição
                instantânea:
              </p>

              <FormulaBlock formula={String.raw`i = \frac{dQ}{dt}`} />

              <p>
                Em ITA/IME, pode aparecer uma função{" "}
                <InlineFormula formula={String.raw`Q(t)`} /> e ser necessário
                derivar para encontrar a corrente.
              </p>

              <FormulaBlock formula={String.raw`Q = ne`} />

              <NoteBox title="Leitura correta" type="warning">
                Como elétrons têm carga negativa, o sinal algébrico da carga
                seria negativo se estivéssemos acompanhando os elétrons. Em
                problemas de corrente, normalmente se trabalha com o módulo da
                carga que atravessa a seção.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="4. Condições para existir corrente elétrica"
              accent="from-indigo-700 to-blue-700"
            >
              <p>
                Para existir corrente elétrica em um circuito, não basta haver
                cargas. Todo material comum tem cargas elétricas. O que importa é
                haver portadores de carga livres e uma causa capaz de produzir
                movimento ordenado desses portadores.
              </p>

              <NumberedList
                items={[
                  "existência de portadores de carga livres;",
                  "existência de diferença de potencial;",
                  "existência de campo elétrico no condutor;",
                  "caminho fechado para manutenção da corrente em regime estacionário;",
                  "presença de uma fonte ou gerador que mantenha a diferença de potencial.",
                ]}
              />

              <p>
                Em metais, os portadores livres são elétrons. Em soluções
                eletrolíticas, são íons positivos e negativos. Em gases
                ionizados, podem ser elétrons e íons. Em semicondutores, há
                elétrons e lacunas.
              </p>

              <p>
                A diferença de potencial é necessária para manter o movimento
                ordenado das cargas. Sem diferença de potencial, os elétrons
                livres em um metal continuam em agitação térmica, mas não há
                corrente líquida.
              </p>

              <p>
                Em um circuito ligado, existe campo elétrico dentro do condutor.
                Esse campo exerce força sobre os portadores livres.
              </p>

              <FormulaBlock formula={String.raw`\vec{F} = q\vec{E}`} />

              <p>
                O gerador é o dispositivo que mantém a diferença de potencial
                entre dois pontos do circuito. Uma pilha, uma bateria ou uma
                fonte elétrica realiza trabalho sobre as cargas, fornecendo
                energia ao circuito.
              </p>

              <FormulaBlock
                formula={String.raw`\text{circuito fechado} \Rightarrow \text{pode haver corrente}`}
              />

              <FormulaBlock
                formula={String.raw`\text{circuito aberto} \Rightarrow \text{não há corrente estacionária no ramo interrompido}`}
              />

              <NoteBox title="Curto-circuito" type="danger">
                Curto-circuito ocorre quando dois pontos entre os quais há
                diferença de potencial são ligados por um caminho de resistência
                muito baixa. Se a tensão é mantida e a resistência fica muito
                pequena, a corrente pode se tornar muito alta.
              </NoteBox>

              <FormulaBlock formula={String.raw`i = \frac{U}{R}`} />
            </SectionCard>

            <SectionCard
              icon={Flame}
              title="5. Tensão elétrica, diferença de potencial e energia"
              accent="from-blue-700 to-cyan-700"
            >
              <p>
                Tensão elétrica, ou diferença de potencial, é uma medida de
                energia por unidade de carga. Se uma fonte fornece energia{" "}
                <InlineFormula formula={String.raw`W`} /> para uma carga{" "}
                <InlineFormula formula={String.raw`q`} />, a tensão associada é:
              </p>

              <FormulaBlock formula={String.raw`U = \frac{W}{q}`} />
              <FormulaBlock formula={String.raw`W = qU`} />

              <p>
                A unidade de tensão elétrica é o volt, símbolo{" "}
                <InlineFormula formula={String.raw`\text{V}`} />.
              </p>

              <FormulaBlock formula={String.raw`1 \ \text{V} = 1 \ \text{J/C}`} />

              <p>
                Uma bateria de{" "}
                <InlineFormula formula={String.raw`12 \ \text{V}`} /> fornece,
                idealmente,{" "}
                <InlineFormula formula={String.raw`12 \ \text{J}`} /> de energia
                para cada coulomb de carga que atravessa a fonte.
              </p>

              <BulletList
                items={[
                  "tensão é energia por unidade de carga;",
                  "corrente é carga por unidade de tempo;",
                  "uma tomada pode ter tensão mesmo sem corrente significativa, se o circuito estiver aberto;",
                  "quando um aparelho é conectado, o circuito se fecha e a corrente pode circular.",
                ]}
              />

              <NoteBox title="Não confunda" type="warning">
                Tensão não é corrente. A tensão representa uma diferença de nível
                energético por carga. A corrente é o fluxo de carga que passa
                quando existe caminho condutor.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="6. Resistência elétrica"
              accent="from-cyan-700 to-teal-700"
            >
              <p>
                Resistência elétrica é a oposição que um elemento oferece à
                passagem da corrente elétrica. Em um metal real, os elétrons
                livres interagem com a rede cristalina, sofrem espalhamentos e
                transferem energia para o material. Esse processo está ligado ao
                aquecimento e à dissipação.
              </p>

              <FormulaBlock formula={String.raw`R = \frac{U}{i}`} />

              <BulletList
                items={[
                  <span>
                    <InlineFormula formula={String.raw`R`} /> é a resistência
                    elétrica;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`U`} /> é a tensão aplicada
                    entre os terminais;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} /> é a corrente que
                    atravessa o elemento.
                  </span>,
                ]}
              />

              <FormulaBlock formula={String.raw`1 \ \Omega = 1 \ \frac{\text{V}}{\text{A}}`} />

              <p>
                A resistência não deve ser vista como uma barreira absoluta. Ela
                é uma relação entre tensão e corrente. Para uma mesma tensão,
                maior resistência implica menor corrente. Para uma mesma
                resistência, maior tensão implica maior corrente.
              </p>
            </SectionCard>

            <SectionCard
              icon={Calculator}
              title="7. Primeira Lei de Ohm"
              accent="from-teal-700 to-emerald-700"
            >
              <p>
                A Primeira Lei de Ohm afirma que, para determinados condutores
                mantidos em condições físicas constantes, a tensão aplicada é
                diretamente proporcional à corrente elétrica.
              </p>

              <FormulaBlock formula={String.raw`U = Ri`} />

              <p>
                Um resistor que obedece a essa relação com resistência constante
                é chamado de resistor ôhmico. Para um resistor ôhmico, se
                dobramos a tensão aplicada, a corrente dobra. Se triplicamos a
                tensão, a corrente triplica. A razão{" "}
                <InlineFormula formula={String.raw`U/i`} /> permanece constante.
              </p>

              <NoteBox title="Resistor não ôhmico" type="info">
                Lâmpadas incandescentes, diodos, termistores e vários
                componentes eletrônicos podem ser não ôhmicos. Neles, a
                resistência pode variar com temperatura, tensão ou corrente.
              </NoteBox>

              <p>
                Para um resistor ôhmico, o gráfico{" "}
                <InlineFormula formula={String.raw`U \times i`} /> é uma reta
                que passa pela origem. A inclinação da reta é a resistência.
              </p>

              <FormulaBlock formula={String.raw`R = \frac{U}{i}`} />
            </SectionCard>

            <SectionCard
              icon={Compass}
              title="8. Segunda Lei de Ohm"
              accent="from-emerald-700 to-lime-700"
            >
              <p>
                A Segunda Lei de Ohm relaciona a resistência de um condutor com o
                material e a geometria.
              </p>

              <FormulaBlock formula={String.raw`R = \rho\frac{L}{A}`} />

              <BulletList
                items={[
                  <span>
                    <InlineFormula formula={String.raw`R`} /> é a resistência do
                    condutor;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\rho`} /> é a
                    resistividade do material;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`L`} /> é o comprimento do
                    condutor;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`A`} /> é a área da seção
                    transversal.
                  </span>,
                ]}
              />

              <p>
                Um fio mais comprido oferece maior resistência porque os
                portadores de carga precisam atravessar um caminho maior. Um fio
                mais grosso oferece menor resistência porque há mais área
                disponível para o fluxo de carga.
              </p>

              <FormulaBlock formula={String.raw`R \propto L`} />
              <FormulaBlock formula={String.raw`R \propto \frac{1}{A}`} />

              <p>Da fórmula, isolando a resistividade:</p>

              <FormulaBlock formula={String.raw`\rho = R\frac{A}{L}`} />

              <FormulaBlock formula={String.raw`[\rho] = \Omega\cdot\text{m}`} />
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="9. Resistividade e temperatura"
              accent="from-lime-700 to-amber-700"
            >
              <p>
                A resistência elétrica de um condutor pode depender da
                temperatura. Em metais, normalmente a resistência aumenta quando a
                temperatura aumenta, porque a rede cristalina vibra mais
                intensamente e aumenta os espalhamentos sofridos pelos elétrons.
              </p>

              <FormulaBlock formula={String.raw`R = R_0(1 + \alpha \Delta T)`} />

              <BulletList
                items={[
                  <span>
                    <InlineFormula formula={String.raw`R`} /> é a resistência na
                    temperatura final;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`R_0`} /> é a resistência
                    na temperatura inicial de referência;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\alpha`} /> é o
                    coeficiente de temperatura;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\Delta T`} /> é a variação
                    de temperatura.
                  </span>,
                ]}
              />

              <FormulaBlock formula={String.raw`\Delta T = T - T_0`} />

              <NoteBox title="Metais e semicondutores" type="info">
                Em metais, geralmente{" "}
                <InlineFormula formula={String.raw`\alpha > 0`} />. Em
                semicondutores, a resistência pode diminuir com a temperatura
                porque o aumento térmico libera mais portadores de carga.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="10. Associação de resistores em série"
              accent="from-amber-700 to-orange-700"
            >
              <p>
                Resistores estão em série quando são atravessados pela mesma
                corrente elétrica.
              </p>

              <FormulaBlock formula={String.raw`i_1 = i_2 = i_3 = \cdots = i`} />

              <p>A tensão total se divide entre eles:</p>

              <FormulaBlock formula={String.raw`U = U_1 + U_2 + U_3 + \cdots`} />

              <p>
                Como <InlineFormula formula={String.raw`U = Ri`} />, temos:
              </p>

              <FormulaBlock
                formula={String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`}
              />

              <NoteBox title="Divisor de tensão" type="info">
                Em série, a tensão se divide proporcionalmente às resistências. O
                resistor maior recebe maior parcela da tensão total.
              </NoteBox>

              <FormulaBlock
                formula={String.raw`U_1 = U\frac{R_1}{R_1 + R_2}`}
              />

              <FormulaBlock
                formula={String.raw`U_2 = U\frac{R_2}{R_1 + R_2}`}
              />
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

              <FormulaBlock formula={String.raw`U_1 = U_2 = U_3 = \cdots = U`} />

              <p>A corrente total se divide entre os ramos:</p>

              <FormulaBlock formula={String.raw`i = i_1 + i_2 + i_3 + \cdots`} />

              <FormulaBlock
                formula={String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`}
              />

              <p>Para dois resistores:</p>

              <FormulaBlock
                formula={String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`}
              />

              <p>Para resistores iguais:</p>

              <FormulaBlock formula={String.raw`R_{\text{eq}} = \frac{R}{n}`} />

              <NoteBox title="Ideia intuitiva" type="success">
                Em paralelo, a resistência equivalente fica menor que a menor
                resistência do conjunto porque novos ramos criam novos caminhos
                para a corrente.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="12. Associação mista e leitura de nós"
              accent="from-red-700 to-rose-700"
            >
              <p>
                Uma associação mista possui resistores em série e em paralelo no
                mesmo circuito. O método seguro é simplificar o circuito passo a
                passo.
              </p>

              <NumberedList
                items={[
                  "identificar nós do circuito;",
                  "procurar resistores claramente em série;",
                  "procurar resistores claramente em paralelo;",
                  "substituir cada grupo por uma resistência equivalente;",
                  "redesenhar mentalmente ou no papel o circuito simplificado;",
                  "repetir o processo até chegar à resistência equivalente total;",
                  "calcular corrente total;",
                  "voltar pelo circuito para encontrar tensões e correntes específicas.",
                ]}
              />

              <NoteBox title="Regra de ouro" type="warning">
                Dois resistores estão em série se são atravessados pela mesma
                corrente e o nó entre eles não tem ramificação. Dois resistores
                estão em paralelo se estão ligados aos mesmos dois nós e possuem
                a mesma tensão.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Flame}
              title="13. Potência elétrica"
              accent="from-rose-700 to-pink-700"
            >
              <p>
                Potência mede a rapidez com que energia é transferida ou
                transformada.
              </p>

              <FormulaBlock formula={String.raw`P = \frac{\Delta E}{\Delta t}`} />

              <p>Em circuitos elétricos:</p>

              <FormulaBlock formula={String.raw`P = Ui`} />

              <p>Usando a Lei de Ohm, podemos obter:</p>

              <FormulaBlock formula={String.raw`P = Ri^2`} />
              <FormulaBlock formula={String.raw`P = \frac{U^2}{R}`} />

              <NoteBox title="Quando usar cada fórmula" type="info">
                Use <InlineFormula formula={String.raw`P = Ui`} /> quando conhece
                tensão e corrente. Use{" "}
                <InlineFormula formula={String.raw`P = Ri^2`} /> quando conhece
                resistência e corrente. Use{" "}
                <InlineFormula formula={String.raw`P = U^2/R`} /> quando conhece
                tensão e resistência.
              </NoteBox>

              <NoteBox title="Armadilha clássica" type="warning">
                Se a corrente é a mesma, como em série, potência cresce com a
                resistência. Se a tensão é a mesma, como em paralelo, potência
                diminui com a resistência.
              </NoteBox>

              <FormulaBlock formula={String.raw`E = P\Delta t`} />
              <FormulaBlock formula={String.raw`1 \ \text{kWh} = 3{,}6 \times 10^6 \ \text{J}`} />
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

              <FormulaBlock formula={String.raw`P = Ri^2`} />

              <FormulaBlock formula={String.raw`E = Ri^2\Delta t`} />

              <p>
                Essa fórmula mostra que o aquecimento cresce com o quadrado da
                corrente. Se a corrente dobra, a potência dissipada quadruplica.
              </p>

              <FormulaBlock formula={String.raw`i' = 2i`} />
              <FormulaBlock formula={String.raw`P' = R(2i)^2 = 4Ri^2`} />
              <FormulaBlock formula={String.raw`P' = 4P`} />

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
                Corrente alta é perigosa porque pequenos aumentos de corrente
                podem causar grandes aumentos de aquecimento.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="15. Geradores elétricos"
              accent="from-fuchsia-700 to-violet-700"
            >
              <p>
                Gerador elétrico é um dispositivo que transforma alguma forma de
                energia em energia elétrica. Pilhas e baterias transformam energia
                química em elétrica. Alternadores transformam energia mecânica em
                elétrica.
              </p>

              <p>
                A grandeza que caracteriza a energia fornecida pelo gerador por
                unidade de carga é a força eletromotriz, representada por{" "}
                <InlineFormula formula={String.raw`\varepsilon`} />. Apesar do
                nome, força eletromotriz não é força. É energia por unidade de
                carga, medida em volts.
              </p>

              <p>Gerador ideal:</p>

              <FormulaBlock formula={String.raw`U = \varepsilon`} />

              <p>Gerador real:</p>

              <FormulaBlock formula={String.raw`U = \varepsilon - ri`} />

              <BulletList
                items={[
                  <span>
                    <InlineFormula formula={String.raw`U`} /> é a tensão nos
                    terminais;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`\varepsilon`} /> é a força
                    eletromotriz;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`r`} /> é a resistência
                    interna;
                  </span>,
                  <span>
                    <InlineFormula formula={String.raw`i`} /> é a corrente.
                  </span>,
                ]}
              />

              <FormulaBlock formula={String.raw`P_{\text{total}} = \varepsilon i`} />
              <FormulaBlock formula={String.raw`P_{\text{útil}} = Ui`} />
              <FormulaBlock formula={String.raw`P_{\text{dissipada}} = ri^2`} />

              <FormulaBlock
                formula={String.raw`\eta = \frac{P_{\text{útil}}}{P_{\text{total}}}`}
              />

              <FormulaBlock formula={String.raw`\eta = \frac{U}{\varepsilon}`} />
            </SectionCard>

            <SectionCard
              icon={Gauge}
              title="16. Receptores elétricos"
              accent="from-violet-700 to-indigo-800"
            >
              <p>
                Receptor elétrico é um dispositivo que transforma energia
                elétrica em outra forma de energia que não seja exclusivamente
                térmica.
              </p>

              <BulletList
                items={[
                  "motor elétrico: transforma energia elétrica em energia mecânica;",
                  "bateria sendo carregada: transforma energia elétrica em energia química;",
                  "aparelho eletrônico: transforma energia elétrica em processamento, som, luz ou movimento.",
                ]}
              />

              <p>
                Em motores, aparece a força contraeletromotriz, representada por{" "}
                <InlineFormula formula={String.raw`\varepsilon'`} />. Ela está
                associada à transformação de energia elétrica em energia mecânica.
              </p>

              <FormulaBlock formula={String.raw`U = \varepsilon' + r'i`} />

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
              <p>O amperímetro mede corrente elétrica.</p>

              <BulletList
                items={[
                  "deve ser ligado em série;",
                  "mede a corrente que passa em determinado ramo;",
                  "resistência interna idealmente nula.",
                ]}
              />

              <FormulaBlock formula={String.raw`R_A = 0`} />

              <p>O voltímetro mede tensão elétrica entre dois pontos.</p>

              <BulletList
                items={[
                  "deve ser ligado em paralelo;",
                  "mede diferença de potencial;",
                  "resistência interna idealmente infinita.",
                ]}
              />

              <FormulaBlock formula={String.raw`R_V \to \infty`} />

              <p>
                O ohmímetro mede resistência elétrica e deve ser usado com o
                circuito desligado.
              </p>

              <NoteBox title="Erro comum que destrói questão" type="danger">
                Amperímetro em paralelo pode causar curto. Voltímetro em série
                pode praticamente interromper o circuito.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Brain}
              title="18. Leis de Kirchhoff"
              accent="from-slate-950 to-indigo-900"
            >
              <p>
                As Leis de Kirchhoff são usadas para analisar circuitos mais
                complexos, especialmente quando não é possível reduzir tudo por
                associações simples.
              </p>

              <p>
                Elas se baseiam em dois princípios: conservação da carga e
                conservação da energia.
              </p>

              <p>Lei dos nós:</p>

              <FormulaBlock
                formula={String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`}
              />

              <p>
                Essa lei expressa conservação da carga. Carga não se acumula
                indefinidamente em um nó em regime estacionário.
              </p>

              <p>Lei das malhas:</p>

              <FormulaBlock formula={String.raw`\sum U = 0`} />

              <p>
                Essa lei expressa conservação da energia. Ao dar uma volta
                completa em uma malha, retornamos ao mesmo ponto, portanto ao
                mesmo potencial.
              </p>

              <NoteBox title="Convenção de sinais" type="warning">
                Em resistores, ao percorrer no sentido da corrente, ocorre queda
                de potencial: <InlineFormula formula={String.raw`-Ri`} />. Contra
                o sentido da corrente, ocorre aumento:{" "}
                <InlineFormula formula={String.raw`+Ri`} />.
              </NoteBox>

              <NoteBox title="Corrente negativa" type="info">
                Se uma corrente calculada der negativa, isso não significa que a
                conta está errada. Significa que o sentido real é oposto ao
                sentido escolhido inicialmente.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Compass}
              title="19. Ponte de Wheatstone"
              accent="from-indigo-900 to-purple-900"
            >
              <p>
                A Ponte de Wheatstone é um circuito usado para comparar
                resistências e medir resistências desconhecidas. Ela possui
                quatro resistores formando dois ramos e um galvanômetro ligando
                pontos intermediários.
              </p>

              <p>
                A ponte está em equilíbrio quando não passa corrente pelo
                galvanômetro.
              </p>

              <FormulaBlock
                formula={String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`}
              />

              <FormulaBlock formula={String.raw`i_G = 0`} />

              <p>
                A interpretação é que os divisores de tensão dos dois ramos
                produzem o mesmo potencial nos pontos intermediários. Sem
                diferença de potencial entre esses pontos, não passa corrente
                pelo galvanômetro.
              </p>
            </SectionCard>

            <SectionCard
              icon={AlertTriangle}
              title="20. Curto-circuito, fusíveis e disjuntores"
              accent="from-red-700 to-slate-950"
            >
              <p>
                Curto-circuito ocorre quando dois pontos com diferença de
                potencial são conectados por um caminho de resistência muito
                baixa.
              </p>

              <FormulaBlock formula={String.raw`i = \frac{U}{R}`} />

              <p>
                Se <InlineFormula formula={String.raw`R`} /> tende a um valor
                muito pequeno, a corrente pode se tornar muito grande.
              </p>

              <FormulaBlock formula={String.raw`P = Ri^2`} />

              <p>
                Mesmo que a resistência do fio seja pequena, o valor enorme de{" "}
                <InlineFormula formula={String.raw`i^2`} /> pode produzir
                aquecimento suficiente para derreter isolantes e causar incêndios.
              </p>

              <BulletList
                items={[
                  "fusível: derrete e abre o circuito quando a corrente ultrapassa o limite;",
                  "disjuntor: interrompe o circuito e pode ser rearmado;",
                  "DR e aterramento: proteções ligadas a choque elétrico, não apenas sobrecorrente.",
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
                elétrico entre suas placas.
              </p>

              <FormulaBlock formula={String.raw`Q = CU`} />

              <p>
                Em corrente contínua, no instante em que um capacitor descarregado
                é ligado a uma fonte, pode haver corrente durante o processo de
                carga. Conforme o capacitor carrega, a corrente diminui.
              </p>

              <p>
                Em regime estacionário de corrente contínua, depois de totalmente
                carregado, o capacitor ideal se comporta como circuito aberto.
              </p>

              <FormulaBlock
                formula={String.raw`\text{capacitor carregado em CC estacionária} \Rightarrow \text{circuito aberto}`}
              />

              <NoteBox title="Limite deste tópico" type="info">
                Carga, descarga, constante de tempo e energia armazenada merecem
                um estudo próprio. Aqui, o ponto essencial é reconhecer o
                comportamento qualitativo em corrente contínua.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={BarChart3}
              title="22. Gráficos importantes"
              accent="from-blue-900 to-indigo-900"
            >
              <p>Para resistor ôhmico:</p>

              <FormulaBlock formula={String.raw`U = Ri`} />

              <p>
                O gráfico <InlineFormula formula={String.raw`U \times i`} /> é
                uma reta que passa pela origem. A inclinação é a resistência.
              </p>

              <FormulaBlock formula={String.raw`R = \frac{\Delta U}{\Delta i}`} />

              <p>Para potência em resistor:</p>

              <FormulaBlock formula={String.raw`P = Ri^2`} />

              <p>
                O gráfico <InlineFormula formula={String.raw`P \times i`} /> é
                uma parábola.
              </p>

              <p>Para gerador real:</p>

              <FormulaBlock formula={String.raw`U = \varepsilon - ri`} />

              <p>
                O gráfico <InlineFormula formula={String.raw`U \times i`} /> é
                uma reta decrescente. O intercepto vertical é{" "}
                <InlineFormula formula={String.raw`\varepsilon`} /> e a
                inclinação é <InlineFormula formula={String.raw`-r`} />.
              </p>

              <p>Para receptor real:</p>

              <FormulaBlock formula={String.raw`U = \varepsilon' + r'i`} />

              <p>
                O gráfico é uma reta crescente. O intercepto vertical é{" "}
                <InlineFormula formula={String.raw`\varepsilon'`} /> e a
                inclinação é <InlineFormula formula={String.raw`r'`} />.
              </p>
            </SectionCard>

            <SectionCard
              icon={Calculator}
              title="23. Análise dimensional"
              accent="from-indigo-900 to-slate-950"
            >
              <p>Corrente elétrica:</p>

              <FormulaBlock formula={String.raw`i = \frac{\Delta Q}{\Delta t}`} />
              <FormulaBlock formula={String.raw`[i] = \frac{\text{C}}{\text{s}} = \text{A}`} />

              <p>Resistência elétrica:</p>

              <FormulaBlock formula={String.raw`R = \frac{U}{i}`} />
              <FormulaBlock formula={String.raw`[R] = \frac{\text{V}}{\text{A}} = \Omega`} />

              <p>Potência elétrica:</p>

              <FormulaBlock formula={String.raw`P = Ui`} />
              <FormulaBlock
                formula={String.raw`[P] = \frac{\text{J}}{\text{C}}\cdot\frac{\text{C}}{\text{s}} = \text{W}`}
              />

              <p>Segunda Lei de Ohm:</p>

              <FormulaBlock formula={String.raw`R = \rho\frac{L}{A}`} />
              <FormulaBlock formula={String.raw`[\rho] = \Omega\cdot\text{m}`} />

              <p>Lei de Joule:</p>

              <FormulaBlock formula={String.raw`E = Ri^2\Delta t`} />
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
                Instalações residenciais usam associações em paralelo. Isso
                permite que os aparelhos recebam a mesma tensão e funcionem
                independentemente.
              </p>

              <p>
                Baterias funcionam como geradores durante a descarga e como
                receptores durante o carregamento.
              </p>

              <p>
                Linhas de transmissão transportam energia elétrica por longas
                distâncias. As perdas por efeito Joule nos fios são:
              </p>

              <FormulaBlock formula={String.raw`P_{\text{perdida}} = Ri^2`} />

              <p>Para transmitir uma potência:</p>

              <FormulaBlock formula={String.raw`P = Ui`} />

              <FormulaBlock formula={String.raw`i = \frac{P}{U}`} />

              <NoteBox title="Por que alta tensão?" type="success">
                Para a mesma potência transmitida, aumentar a tensão reduz a
                corrente. Como as perdas dependem de{" "}
                <InlineFormula formula={String.raw`i^2`} />, transmitir energia
                em alta tensão reduz muito as perdas.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={AlertTriangle}
              title="26. Armadilhas e erros comuns"
              accent="from-red-700 to-red-950"
            >
              <BulletList
                items={[
                  "confundir tensão com corrente;",
                  "achar que corrente é “gasta” no resistor;",
                  "achar que a corrente diminui ao passar por resistores em série;",
                  "inverter série e paralelo;",
                  "usar P = U²/R sem perceber qual grandeza está fixa;",
                  "esquecer resistência interna do gerador;",
                  "errar sinal em Kirchhoff;",
                  "ligar amperímetro em paralelo;",
                  "ligar voltímetro em série;",
                  "achar que elétrons se movem no sentido da corrente convencional;",
                  "esquecer conversões de unidade;",
                  "confundir kW com kWh;",
                  "achar que alta tensão sempre significa alta corrente;",
                  "não perceber curto-circuito.",
                ]}
              />

              <NoteBox title="Resumo da confusão humana" type="warning">
                Corrente não é energia. Tensão não é corrente. Potência não é
                energia. Resistência não é resistividade. Série não é paralelo. O
                conteúdo é bonito, mas o aluno faz questão de transformar em sopa.
              </NoteBox>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="27. Pontos importantes para ITA/IME"
              accent="from-slate-950 to-purple-900"
            >
              <p>
                Em provas difíceis, Eletrodinâmica raramente é só aplicar{" "}
                <InlineFormula formula={String.raw`U = Ri`} /> de forma direta. O
                conteúdo aparece misturado com raciocínio de circuito, simetria,
                gráficos, energia e modelagem.
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
                altera o circuito? O problema pede potência máxima ou rendimento?
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
                  "receptor transforma energia elétrica em outra forma útil de energia;",
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
