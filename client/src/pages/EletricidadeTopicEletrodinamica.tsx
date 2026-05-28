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

      <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-10">
        <div className="text-center text-slate-100 [&_.katex]:text-3xl [&_.katex]:text-slate-100 [&_.katex-display]:my-0 md:[&_.katex]:text-5xl">
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

const theorySections: TheorySection[] = [
  {
    id: 1,
    icon: BookOpen,
    title: "1. Contexto físico e histórico",
    accent: "from-indigo-600 to-purple-700",
    paragraphs: [
      "A Eletrodinâmica é a parte da Eletricidade que estuda as cargas elétricas em movimento e os efeitos associados a esse movimento. Enquanto a Eletrostática se concentra em cargas em repouso, campos elétricos estáticos, potencial elétrico e equilíbrio eletrostático, a Eletrodinâmica entra em cena quando as cargas passam a se deslocar de forma ordenada, dando origem à corrente elétrica.",
      "O ponto essencial é perceber que a Eletrodinâmica não aparece do nada. Ela nasce naturalmente da Eletrostática. Para que exista corrente em um condutor, normalmente há uma diferença de potencial entre dois pontos. Essa diferença de potencial estabelece um campo elétrico no condutor. O campo exerce força elétrica sobre os portadores livres, e esses portadores passam a apresentar movimento médio ordenado.",
      "Historicamente, a eletricidade só se tornou uma ferramenta técnica poderosa quando foi possível manter corrente elétrica de forma contínua. Antes disso, muitos fenômenos elétricos eram observados como atrações, faíscas e choques. Com a pilha de Volta e o desenvolvimento posterior de circuitos, instrumentos e motores, a eletricidade passou a ser controlada, medida e aplicada.",
      "É por isso que Eletrodinâmica é uma ponte entre conceitos abstratos e aplicações concretas. Ela liga campo elétrico, energia potencial elétrica e potencial elétrico a lâmpadas, chuveiros, motores, baterias, linhas de transmissão, fusíveis, disjuntores, placas eletrônicas e praticamente toda a tecnologia moderna. Uma tragédia para quem queria só decorar fórmula, mas uma bênção para quem quer entender de verdade.",
    ],
    numbered: [
      "Uma fonte estabelece diferença de potencial.",
      "A diferença de potencial estabelece campo elétrico no condutor.",
      "O campo elétrico exerce força sobre os portadores livres.",
      "Os portadores passam a ter movimento médio ordenado.",
      "Esse movimento ordenado constitui a corrente elétrica.",
      "A energia elétrica pode ser transformada em calor, luz, movimento, som, energia química ou processamento de informação.",
    ],
    bullets: [
      "circuitos elétricos simples;",
      "instalações residenciais;",
      "lâmpadas e chuveiros elétricos;",
      "motores elétricos;",
      "baterias e carregadores;",
      "linhas de transmissão;",
      "fusíveis e disjuntores;",
      "instrumentos de medida;",
      "sistemas eletrônicos e redes de energia.",
    ],
    notes: [
      {
        title: "Ideia central",
        type: "success",
        body: "A Eletrodinâmica estuda como cargas se movem em circuitos e como a energia elétrica é transferida, transformada e dissipada.",
      },
    ],
  },
  {
    id: 2,
    icon: Zap,
    title: "2. Ideia intuitiva de corrente elétrica",
    accent: "from-purple-600 to-indigo-700",
    paragraphs: [
      "Corrente elétrica é o fluxo ordenado de cargas elétricas. A palavra mais importante aqui é ordenado. Em um metal, como cobre ou alumínio, existem elétrons livres se movimentando o tempo todo por causa da agitação térmica. Mesmo com o circuito desligado, esses elétrons já estão em movimento microscópico.",
      "Mas esse movimento térmico é caótico. Um elétron vai para um lado, outro vai para outro, outro muda de direção, e a soma média desses deslocamentos não produz um fluxo líquido de carga em uma direção específica. É movimento, mas não é corrente resultante. Natureza fazendo bagunça microscópica, como sempre.",
      "Quando conectamos uma fonte, como pilha ou bateria, criamos uma diferença de potencial entre os extremos do condutor. Essa diferença estabelece um campo elétrico no interior do fio. O campo elétrico exerce força sobre os elétrons livres, e então aparece um pequeno movimento médio ordenado sobreposto ao movimento térmico aleatório. Esse movimento médio é chamado de velocidade de deriva.",
      "É importante entender que a velocidade de deriva dos elétrons costuma ser pequena. Isso não significa que o circuito demora muito para responder. O efeito elétrico se propaga rapidamente pelo circuito porque o campo elétrico se estabelece ao longo do condutor com velocidade muito alta. Não é um único elétron saindo da tomada e correndo até o aparelho como se estivesse atrasado para o ENEM.",
    ],
    panels: [
      {
        title: "Sentido real e sentido convencional",
        formula: String.raw`\text{sentido dos elétrons} = \text{oposto ao sentido convencional}`,
        terms: [
          "Sentido real dos elétrons: nos metais, os elétrons se deslocam, em média, do polo negativo para o polo positivo.",
          "Sentido convencional da corrente: é definido como o sentido em que cargas positivas se moveriam.",
          "Campo elétrico: aponta no sentido da força elétrica sobre uma carga positiva de prova.",
        ],
        structure: [
          "A convenção de corrente foi criada antes da identificação clara dos elétrons como portadores móveis nos metais.",
          "Como o elétron tem carga negativa, a força elétrica sobre ele tem sentido oposto ao campo elétrico.",
          "Mesmo sabendo disso, mantemos o sentido convencional porque ele é historicamente adotado e funciona de forma consistente nas equações de circuito.",
        ],
        steps: [
          {
            title: "Passo 1: força elétrica sobre uma carga",
            body: [
              "A força elétrica sobre uma partícula carregada em um campo elétrico é dada pela relação abaixo.",
            ],
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
          {
            title: "Passo 2: carga positiva",
            body: [
              "Se a carga é positiva, a força elétrica tem o mesmo sentido do campo elétrico.",
            ],
            formulas: [String.raw`q > 0 \Rightarrow \vec{F} \parallel \vec{E}`],
          },
          {
            title: "Passo 3: elétron",
            body: [
              "Se a carga é negativa, como acontece com o elétron, a força elétrica tem sentido oposto ao campo elétrico.",
            ],
            formulas: [
              String.raw`q < 0 \Rightarrow \vec{F} \text{ tem sentido oposto a } \vec{E}`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Movimento de deriva",
        type: "info",
        body: "A corrente elétrica em metais não significa que os elétrons saem disparados pelo fio. Eles continuam com movimento térmico desordenado, mas passam a ter uma pequena tendência média em uma direção.",
      },
      {
        title: "Corrente contínua e alternada",
        type: "info",
        body: "Na corrente contínua, o sentido convencional permanece o mesmo ao longo do tempo. Na corrente alternada, o sentido muda periodicamente.",
      },
    ],
  },
  {
    id: 3,
    icon: Gauge,
    title: "3. Definição formal de corrente elétrica",
    accent: "from-slate-950 to-indigo-800",
    paragraphs: [
      "A definição formal de corrente elétrica transforma a ideia intuitiva de fluxo de cargas em uma grandeza mensurável. Em vez de dizer apenas que cargas estão passando por um fio, perguntamos: quanta carga atravessa uma seção do condutor em certo intervalo de tempo?",
      "Imagine cortar mentalmente o fio e observar uma seção transversal, como uma espécie de porta invisível. As cargas passam por essa seção. Se muita carga passa em pouco tempo, a corrente é grande. Se pouca carga passa em muito tempo, a corrente é pequena.",
      "Essa definição não significa que a carga fica presa na seção. A seção é apenas o ponto de contagem. É como contar quantas pessoas atravessam uma porta por segundo. A porta não guarda as pessoas, só define onde a contagem ocorre. Incrível precisar dizer isso, mas os erros de circuito mostram que sim, precisa.",
    ],
    panels: [
      {
        title: "Corrente elétrica média",
        formula: String.raw`i = \frac{\Delta Q}{\Delta t}`,
        terms: [
          "i: corrente elétrica média, medida em ampère.",
          "ΔQ: quantidade de carga elétrica que atravessa uma seção do condutor.",
          "Δt: intervalo de tempo durante o qual a passagem de carga é observada.",
        ],
        structure: [
          "A corrente compara carga transportada com tempo gasto.",
          "Se a mesma quantidade de carga passa em menos tempo, a corrente é maior.",
          "Se menos carga passa no mesmo intervalo de tempo, a corrente é menor.",
        ],
        steps: [
          {
            title: "Passo 1: escolher uma seção do condutor",
            body: [
              "A seção transversal serve como referência de contagem. Toda carga que atravessa essa seção durante o intervalo considerado entra na quantidade ΔQ.",
            ],
          },
          {
            title: "Passo 2: contar a carga transportada",
            body: [
              "A carga total que atravessa a seção é representada por ΔQ. Essa carga pode ser formada por elétrons, íons ou outros portadores, dependendo do meio.",
            ],
          },
          {
            title: "Passo 3: dividir pelo tempo",
            body: [
              "Para transformar a quantidade total de carga em uma taxa de passagem, dividimos pelo intervalo de tempo.",
            ],
            formulas: [String.raw`i = \frac{\Delta Q}{\Delta t}`],
          },
          {
            title: "Passo 4: interpretar a unidade",
            body: [
              "Um ampère significa um coulomb por segundo atravessando uma seção do condutor.",
            ],
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
          "Aparece quando a carga transportada é dada como função do tempo.",
          "Matematicamente, a corrente é a derivada da carga em relação ao tempo.",
        ],
        steps: [
          {
            title: "Passo 1: partir da corrente média",
            formulas: [String.raw`i_m = \frac{\Delta Q}{\Delta t}`],
          },
          {
            title: "Passo 2: reduzir o intervalo de tempo",
            body: [
              "Quando o intervalo Δt fica cada vez menor, a razão média se aproxima da taxa naquele instante.",
            ],
          },
          {
            title: "Passo 3: limite diferencial",
            formulas: [
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
          "e: carga elementar, cujo módulo vale aproximadamente 1,6 × 10⁻¹⁹ C.",
        ],
        structure: [
          "Cada elétron carrega uma quantidade fixa de carga em módulo.",
          "A carga total transportada é o número de elétrons multiplicado pela carga elementar.",
          "Depois de encontrar Q, usamos a definição de corrente para relacionar carga e tempo.",
        ],
        steps: [
          {
            title: "Passo 1: carga elementar",
            formulas: [
              String.raw`|q_e| = e = 1{,}6 \times 10^{-19} \ \text{C}`,
            ],
          },
          {
            title: "Passo 2: muitos elétrons",
            formulas: [String.raw`Q = ne`],
          },
          {
            title: "Passo 3: corrente associada",
            formulas: [String.raw`i = \frac{ne}{\Delta t}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Leitura correta",
        type: "warning",
        body: "Em metais, os portadores móveis são elétrons, que têm carga negativa. Em problemas básicos de corrente, geralmente usamos o módulo da carga transportada. O sinal é importante para direção física, mas a intensidade da corrente costuma ser tratada como valor positivo.",
      },
    ],
  },
  {
    id: 4,
    icon: Layers,
    title: "4. Condições para existir corrente elétrica",
    accent: "from-indigo-700 to-blue-700",
    paragraphs: [
      "Para existir corrente elétrica, não basta haver cargas. Todo material comum possui prótons e elétrons. O que importa é haver portadores de carga livres e uma causa física capaz de organizar o movimento desses portadores.",
      "Em um metal desligado, os elétrons livres se movem aleatoriamente por causa da temperatura. Sem campo elétrico resultante, não há movimento médio em uma direção preferencial. A corrente aparece quando o circuito cria uma orientação para esse movimento.",
      "A fonte não cria corrente como se despejasse elétrons no fio. O papel da fonte é manter uma diferença de potencial entre seus terminais. Essa diferença estabelece campo elétrico, o campo exerce força sobre os portadores livres, e então aparece corrente.",
    ],
    numbered: [
      "Existência de portadores de carga livres.",
      "Existência de diferença de potencial.",
      "Estabelecimento de campo elétrico no condutor.",
      "Caminho condutor fechado para manter a corrente.",
      "Presença de uma fonte capaz de manter a diferença de potencial.",
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
          "A diferença de potencial é a causa energética do processo.",
          "O campo elétrico é o agente que atua localmente sobre as cargas.",
          "A corrente aparece como resposta coletiva dos portadores livres ao campo elétrico.",
        ],
        steps: [
          {
            title: "Passo 1: fonte mantém diferença de potencial",
            body: [
              "Uma pilha ou bateria mantém seus terminais em potenciais diferentes por processos internos, geralmente químicos.",
            ],
          },
          {
            title: "Passo 2: campo elétrico no condutor",
            body: [
              "Quando o circuito é fechado, essa diferença de potencial estabelece um campo elétrico ao longo dos condutores.",
            ],
          },
          {
            title: "Passo 3: força sobre os portadores livres",
            formulas: [String.raw`\vec{F} = q\vec{E}`],
          },
          {
            title: "Passo 4: movimento ordenado",
            body: [
              "A força elétrica não elimina a agitação térmica, mas cria um pequeno movimento médio organizado. Esse movimento médio é a corrente elétrica.",
            ],
          },
        ],
      },
      {
        title: "Circuito aberto, fechado e curto-circuito",
        formula: String.raw`i = \frac{U}{R}`,
        terms: [
          "i: corrente elétrica.",
          "U: tensão aplicada.",
          "R: resistência equivalente do caminho condutor.",
        ],
        structure: [
          "Circuito aberto equivale a resistência efetiva muito grande, então a corrente estacionária é nula.",
          "Circuito fechado permite caminho condutor contínuo, então pode haver corrente.",
          "Curto-circuito é caminho de resistência muito baixa entre pontos com diferença de potencial.",
        ],
        steps: [
          {
            title: "Circuito aberto",
            formulas: [String.raw`R \to \infty \Rightarrow i = \frac{U}{R} \to 0`],
          },
          {
            title: "Circuito fechado",
            body: [
              "Quando há caminho condutor e a fonte mantém a tensão, a corrente depende da resistência total do circuito.",
            ],
          },
          {
            title: "Curto-circuito",
            formulas: [
              String.raw`R \to 0 \Rightarrow i = \frac{U}{R} \text{ muito grande}`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Curto-circuito",
        type: "danger",
        body: "Curto-circuito não significa apenas caminho pequeno no desenho. Significa caminho de resistência muito baixa entre pontos que possuem diferença de potencial. O resultado pode ser corrente altíssima e aquecimento perigoso.",
      },
    ],
  },
  {
    id: 5,
    icon: Flame,
    title: "5. Tensão elétrica, diferença de potencial e energia",
    accent: "from-blue-700 to-cyan-700",
    paragraphs: [
      "Tensão elétrica, ou diferença de potencial, é uma das grandezas mais importantes e mais confundidas da Eletrodinâmica. Ela não é corrente. Ela não é quantidade de eletricidade. Ela mede energia por unidade de carga.",
      "Quando uma carga atravessa uma fonte ou um dispositivo, ela pode ganhar ou perder energia. A tensão informa quanta energia está associada a cada coulomb de carga. Uma bateria de 12 V, por exemplo, fornece idealmente 12 J para cada coulomb que atravessa a fonte.",
      "Também é útil pensar em tensão como diferença de nível energético. Assim como uma diferença de altura pode estar associada a energia gravitacional, uma diferença de potencial elétrico está associada a energia elétrica por unidade de carga.",
      "Em um resistor, a carga atravessa uma queda de potencial: ela perde energia elétrica, e essa energia aparece como aquecimento. Em um motor, parte da energia elétrica pode virar energia mecânica. Em uma bateria carregando, parte vira energia química.",
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
          "A tensão responde à pergunta: quanta energia existe para cada coulomb?",
          "Como tensão é energia dividida por carga, o volt é joule por coulomb.",
          "Se a tensão dobra, cada coulomb transportado recebe ou perde o dobro de energia.",
        ],
        steps: [
          {
            title: "Passo 1: energia por unidade de carga",
            body: [
              "Se uma carga q recebe ou perde energia W, a energia associada a cada unidade de carga é W dividido por q.",
            ],
            formulas: [String.raw`U = \frac{W}{q}`],
          },
          {
            title: "Passo 2: isolando energia",
            body: [
              "Multiplicando a equação por q, obtemos a energia transferida quando uma carga atravessa uma diferença de potencial U.",
            ],
            formulas: [String.raw`W = qU`],
          },
          {
            title: "Passo 3: unidade",
            formulas: [String.raw`1 \ \text{V} = 1 \ \text{J/C}`],
          },
        ],
      },
      {
        title: "Diferença de potencial entre dois pontos",
        formula: String.raw`U_{AB} = V_A - V_B`,
        terms: [
          "U_AB: diferença de potencial entre os pontos A e B.",
          "V_A: potencial elétrico no ponto A.",
          "V_B: potencial elétrico no ponto B.",
        ],
        structure: [
          "A tensão sempre é uma diferença entre dois pontos.",
          "Não faz sentido falar em tensão de um ponto isolado sem referência.",
          "Se dois pontos têm mesmo potencial, a tensão entre eles é zero.",
        ],
        steps: [
          {
            title: "Passo 1: potencial elétrico",
            body: [
              "O potencial elétrico indica energia potencial elétrica por unidade de carga em um ponto.",
            ],
          },
          {
            title: "Passo 2: diferença entre pontos",
            body: [
              "A tensão entre A e B mede a diferença de potencial entre esses dois pontos.",
            ],
            formulas: [String.raw`U_{AB} = V_A - V_B`],
          },
          {
            title: "Passo 3: pontos equipotenciais",
            formulas: [String.raw`V_A = V_B \Rightarrow U_{AB} = 0`],
          },
        ],
      },
    ],
    bullets: [
      "tensão é energia por unidade de carga;",
      "corrente é carga por unidade de tempo;",
      "uma fonte de tensão fornece energia às cargas;",
      "um resistor transforma energia elétrica em calor;",
      "um motor transforma energia elétrica em movimento;",
      "uma bateria carregando transforma energia elétrica em energia química.",
    ],
    notes: [
      {
        title: "Não confunda",
        type: "warning",
        body: "Tensão alta não significa automaticamente corrente alta. A corrente também depende da resistência ou impedância do caminho. Alta tensão com resistência enorme pode gerar corrente pequena. Baixa resistência com tensão moderada pode gerar corrente perigosa.",
      },
    ],
  },
  {
    id: 6,
    icon: ShieldCheck,
    title: "6. Resistência elétrica",
    accent: "from-cyan-700 to-teal-700",
    paragraphs: [
      "Resistência elétrica é a oposição que um elemento oferece à passagem da corrente elétrica. A frase é simples, mas a ideia microscópica é muito mais rica.",
      "Em um metal, os elétrons livres são acelerados pelo campo elétrico. Porém, eles não se movem por um espaço vazio perfeito. Eles interagem com a rede cristalina do material, sofrem espalhamentos e transferem energia para essa rede. Essa energia aparece macroscopicamente como aquecimento.",
      "Assim, resistência não é uma barreira mágica. Ela mede como a tensão aplicada se relaciona com a corrente que realmente atravessa o elemento. Para uma mesma tensão, maior resistência produz menor corrente. Para a mesma corrente, maior resistência exige maior queda de tensão.",
    ],
    panels: [
      {
        title: "Definição de resistência elétrica",
        formula: String.raw`R = \frac{U}{i}`,
        terms: [
          "R: resistência elétrica, medida em ohm.",
          "U: tensão aplicada entre os terminais do elemento.",
          "i: corrente que atravessa o elemento.",
        ],
        structure: [
          "A resistência mede quanta tensão é necessária para sustentar certa corrente.",
          "Se a tensão é fixa, maior resistência reduz a corrente.",
          "Se a corrente é fixa, maior resistência aumenta a queda de tensão.",
        ],
        steps: [
          {
            title: "Passo 1: observar tensão e corrente",
            body: [
              "Aplicamos uma tensão entre os terminais de um elemento e observamos a corrente que passa por ele.",
            ],
          },
          {
            title: "Passo 2: definir oposição elétrica",
            formulas: [String.raw`R = \frac{U}{i}`],
          },
          {
            title: "Passo 3: unidade",
            formulas: [String.raw`1 \ \Omega = 1 \ \frac{\text{V}}{\text{A}}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Interpretação microscópica",
        type: "info",
        body: "Resistência está ligada à dificuldade do movimento ordenado dos portadores de carga. Em metais, essa dificuldade aparece por interações dos elétrons com a rede cristalina, impurezas, defeitos e vibrações térmicas.",
      },
    ],
  },
  {
    id: 7,
    icon: Calculator,
    title: "7. Primeira Lei de Ohm",
    accent: "from-teal-700 to-emerald-700",
    paragraphs: [
      "A Primeira Lei de Ohm descreve o comportamento de resistores ôhmicos. Em um resistor ôhmico, mantendo temperatura e condições físicas constantes, a tensão aplicada é diretamente proporcional à corrente elétrica.",
      "Isso significa que, se dobramos a tensão, a corrente dobra. Se triplicamos a tensão, a corrente triplica. A razão U/i permanece constante, e essa constante é a resistência elétrica.",
      "Essa lei não vale para qualquer componente em qualquer condição. Ela vale para condutores ou resistores que apresentam comportamento linear dentro do intervalo analisado. Diodos, lâmpadas incandescentes e termistores podem ter comportamento não ôhmico.",
    ],
    panels: [
      {
        title: "Primeira Lei de Ohm",
        formula: String.raw`U = Ri`,
        terms: [
          "U: tensão ou queda de potencial nos terminais do resistor.",
          "R: resistência elétrica do resistor.",
          "i: corrente elétrica que atravessa o resistor.",
        ],
        structure: [
          "A equação é linear porque R permanece constante.",
          "A tensão é proporcional à corrente.",
          "No gráfico U × i, a inclinação da reta representa a resistência elétrica.",
        ],
        steps: [
          {
            title: "Passo 1: definição de resistência",
            formulas: [String.raw`R = \frac{U}{i}`],
          },
          {
            title: "Passo 2: isolar tensão",
            formulas: [String.raw`U = Ri`],
          },
          {
            title: "Passo 3: comparação com função linear",
            formulas: [String.raw`U = Ri`, String.raw`y = ax`],
          },
          {
            title: "Passo 4: inclinação do gráfico",
            formulas: [String.raw`R = \frac{\Delta U}{\Delta i}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Ôhmico x não ôhmico",
        type: "warning",
        body: "Em resistor ôhmico, R é constante e o gráfico U × i é uma reta que passa pela origem. Em componente não ôhmico, R pode variar com tensão, corrente ou temperatura, e o gráfico deixa de ser linear.",
      },
    ],
  },
  {
    id: 8,
    icon: Compass,
    title: "8. Segunda Lei de Ohm",
    accent: "from-emerald-700 to-lime-700",
    paragraphs: [
      "A Primeira Lei de Ohm relaciona tensão, corrente e resistência. A Segunda Lei de Ohm explica de onde vem o valor da resistência de um condutor.",
      "A resistência depende do material e da geometria. O material entra pela resistividade. A geometria entra pelo comprimento do condutor e pela área da seção transversal.",
      "Um fio mais comprido oferece maior resistência porque os portadores precisam atravessar um caminho maior. Um fio mais grosso oferece menor resistência porque há mais caminhos microscópicos disponíveis para o fluxo de carga. É como uma estrada: mais comprimento dificulta, mais faixas facilitam. Finalmente uma analogia de trânsito servindo para algo útil.",
    ],
    panels: [
      {
        title: "Segunda Lei de Ohm",
        formula: String.raw`R = \rho\frac{L}{A}`,
        terms: [
          "R: resistência elétrica do condutor.",
          "ρ: resistividade do material.",
          "L: comprimento do condutor.",
          "A: área da seção transversal.",
        ],
        structure: [
          "A resistência é diretamente proporcional ao comprimento.",
          "A resistência é inversamente proporcional à área.",
          "A resistividade representa a influência do material.",
        ],
        steps: [
          {
            title: "Passo 1: influência do comprimento",
            body: [
              "Se o fio fica mais comprido, as cargas atravessam um percurso maior e encontram mais oportunidades de interação e dissipação.",
            ],
            formulas: [String.raw`R \propto L`],
          },
          {
            title: "Passo 2: influência da área",
            body: [
              "Se a seção transversal aumenta, há mais caminhos para a passagem dos portadores, reduzindo a resistência.",
            ],
            formulas: [String.raw`R \propto \frac{1}{A}`],
          },
          {
            title: "Passo 3: influência do material",
            body: [
              "A constante de proporcionalidade é a resistividade ρ. Materiais bons condutores têm baixa resistividade. Isolantes têm resistividade muito alta.",
            ],
            formulas: [String.raw`R = \rho\frac{L}{A}`],
          },
          {
            title: "Passo 4: unidade da resistividade",
            formulas: [
              String.raw`\rho = R\frac{A}{L}`,
              String.raw`[\rho] = \Omega\cdot\frac{\text{m}^2}{\text{m}} = \Omega\cdot\text{m}`,
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
      "A resistência elétrica também pode variar com a temperatura. Em metais, quando a temperatura aumenta, os íons da rede cristalina vibram com maior intensidade. Essas vibrações dificultam o movimento ordenado dos elétrons livres, aumentando a resistência.",
      "Para intervalos moderados de temperatura, é comum usar uma aproximação linear. Isso não significa que a fórmula funcione para qualquer temperatura absurda. É uma aproximação, não uma licença para torturar a física.",
      "Em metais, normalmente o coeficiente de temperatura é positivo. Em semicondutores, a resistência pode diminuir com o aumento da temperatura, porque o aquecimento pode liberar mais portadores de carga.",
    ],
    panels: [
      {
        title: "Variação da resistência com a temperatura",
        formula: String.raw`R = R_0(1 + \alpha\Delta T)`,
        terms: [
          "R: resistência na temperatura final.",
          "R₀: resistência na temperatura inicial de referência.",
          "α: coeficiente de temperatura do material.",
          "ΔT: variação de temperatura.",
        ],
        structure: [
          "A fórmula é linear porque é uma aproximação para variações moderadas.",
          "A variação relativa da resistência é proporcional à variação de temperatura.",
          "O sinal de α indica se a resistência aumenta ou diminui com a temperatura.",
        ],
        steps: [
          {
            title: "Passo 1: variação relativa",
            formulas: [String.raw`\frac{R - R_0}{R_0} = \alpha\Delta T`],
          },
          {
            title: "Passo 2: reorganizar",
            formulas: [
              String.raw`R - R_0 = R_0\alpha\Delta T`,
              String.raw`R = R_0 + R_0\alpha\Delta T`,
              String.raw`R = R_0(1 + \alpha\Delta T)`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Cuidado",
        type: "warning",
        body: "Essa expressão é uma aproximação linear. Em questões, use quando o enunciado fornecer α ou deixar claro que o modelo linear deve ser aplicado.",
      },
    ],
  },
  {
    id: 10,
    icon: Layers,
    title: "10. Associação de resistores em série",
    accent: "from-amber-700 to-orange-700",
    paragraphs: [
      "Resistores estão em série quando são atravessados pela mesma corrente elétrica. Isso ocorre quando as cargas não têm escolha de caminho: elas passam por um resistor e depois pelo outro, em sequência.",
      "Em série, a corrente é a mesma em todos os resistores. O que se divide é a tensão. Cada resistor produz uma queda de tensão proporcional ao seu valor de resistência.",
    ],
    panels: [
      {
        title: "Resistência equivalente em série",
        formula: String.raw`R_{\text{eq}} = R_1 + R_2 + R_3 + \cdots`,
        terms: [
          "R_eq: resistência equivalente da associação.",
          "R₁, R₂, R₃: resistores ligados em sequência.",
          "i: corrente comum que atravessa todos os resistores.",
        ],
        structure: [
          "A corrente não se divide em uma associação em série.",
          "A tensão total é a soma das quedas de tensão.",
          "Como cada resistor oferece oposição em sequência, as resistências se somam.",
        ],
        steps: [
          {
            title: "Passo 1: mesma corrente",
            formulas: [String.raw`i_1 = i_2 = i_3 = \cdots = i`],
          },
          {
            title: "Passo 2: soma das tensões",
            formulas: [String.raw`U = U_1 + U_2 + U_3 + \cdots`],
          },
          {
            title: "Passo 3: aplicar a Lei de Ohm",
            formulas: [
              String.raw`U = R_1i + R_2i + R_3i + \cdots`,
              String.raw`U = i(R_1 + R_2 + R_3 + \cdots)`,
            ],
          },
          {
            title: "Passo 4: comparar com o resistor equivalente",
            formulas: [String.raw`U = R_{\text{eq}}i`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Divisor de tensão",
        type: "info",
        body: "Em série, o resistor maior recebe maior parcela da tensão total, porque todos são atravessados pela mesma corrente e U = Ri.",
      },
    ],
  },
  {
    id: 11,
    icon: Layers,
    title: "11. Associação de resistores em paralelo",
    accent: "from-orange-700 to-red-700",
    paragraphs: [
      "Resistores estão em paralelo quando seus terminais estão ligados aos mesmos dois nós. Essa é a definição que realmente importa. Não interessa se o desenho está bonito, torto ou parecendo arquitetura feita em emergência: mesmos dois nós significam paralelo.",
      "Em paralelo, todos os resistores estão submetidos à mesma tensão. A corrente total se divide entre os ramos. O ramo de menor resistência recebe maior corrente, pois oferece menor oposição.",
      "A resistência equivalente em paralelo é menor que a menor resistência individual. Isso faz sentido: cada novo ramo cria um novo caminho para a corrente. Mais caminhos significam menor oposição total.",
    ],
    panels: [
      {
        title: "Resistência equivalente em paralelo",
        formula: String.raw`\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots`,
        terms: [
          "R_eq: resistência equivalente da associação.",
          "R₁, R₂, R₃: resistores ligados aos mesmos dois nós.",
          "U: tensão comum a todos os ramos.",
        ],
        structure: [
          "Em paralelo, a tensão é a mesma em todos os resistores.",
          "A corrente total é a soma das correntes dos ramos.",
          "A soma aparece nos inversos porque cada ramo conduz uma corrente U/R.",
        ],
        steps: [
          {
            title: "Passo 1: mesma tensão",
            formulas: [String.raw`U_1 = U_2 = U_3 = \cdots = U`],
          },
          {
            title: "Passo 2: corrente total",
            formulas: [String.raw`i = i_1 + i_2 + i_3 + \cdots`],
          },
          {
            title: "Passo 3: aplicar Lei de Ohm em cada ramo",
            formulas: [
              String.raw`i_1 = \frac{U}{R_1}, \quad i_2 = \frac{U}{R_2}, \quad i_3 = \frac{U}{R_3}`,
            ],
          },
          {
            title: "Passo 4: substituir na soma",
            formulas: [
              String.raw`i = \frac{U}{R_1} + \frac{U}{R_2} + \frac{U}{R_3} + \cdots`,
              String.raw`i = U\left(\frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \cdots\right)`,
            ],
          },
          {
            title: "Passo 5: comparar com o equivalente",
            formulas: [
              String.raw`i = \frac{U}{R_{\text{eq}}}`,
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
      "Associação mista combina resistores em série e em paralelo. O maior erro é tentar resolver pela aparência do desenho. Em circuitos, aparência é fofoca. O que manda são as conexões.",
      "Um nó é uma região condutora considerada equipotencial quando os fios são ideais. Todos os pontos ligados diretamente por fio ideal pertencem ao mesmo nó e têm o mesmo potencial. Essa ideia é a chave para reconhecer paralelos escondidos.",
      "Dois resistores estão em paralelo se estão ligados aos mesmos dois nós. Dois resistores estão em série se são atravessados pela mesma corrente e não há ramificação entre eles.",
    ],
    numbered: [
      "Identifique os nós do circuito.",
      "Marque todos os pontos ligados por fios ideais como o mesmo nó.",
      "Procure resistores ligados aos mesmos dois nós.",
      "Procure resistores em sequência sem ramificação intermediária.",
      "Substitua cada grupo por sua resistência equivalente.",
      "Redesenhe mentalmente o circuito simplificado.",
      "Repita o processo até chegar à resistência equivalente total.",
      "Volte pelo circuito, se necessário, para encontrar correntes e tensões específicas.",
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
          "Dois componentes desenhados longe podem estar em paralelo se compartilham os mesmos nós.",
        ],
        steps: [
          {
            title: "Passo 1: identificar fios ideais",
            body: [
              "Pontos ligados diretamente por fios ideais pertencem ao mesmo nó.",
            ],
          },
          {
            title: "Passo 2: procurar paralelos",
            body: [
              "Se dois resistores ligam o mesmo par de nós, eles estão em paralelo.",
            ],
          },
          {
            title: "Passo 3: procurar séries",
            body: [
              "Se dois resistores estão em sequência e não há ramificação entre eles, a mesma corrente atravessa ambos.",
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Regra de ouro",
        type: "warning",
        body: "Resistores próximos no desenho não necessariamente estão em série. Resistores distantes no desenho podem estar em paralelo. Circuito obedece conexão, não estética.",
      },
    ],
  },
  {
    id: 13,
    icon: Flame,
    title: "13. Potência elétrica",
    accent: "from-rose-700 to-pink-700",
    paragraphs: [
      "Potência mede a rapidez com que energia é transferida ou transformada. Em circuitos elétricos, ela indica a taxa com que energia elétrica é fornecida por uma fonte, consumida por um aparelho ou dissipada em um resistor.",
      "A potência elétrica nasce de uma conexão muito bonita entre tensão e corrente. Tensão é energia por carga. Corrente é carga por tempo. Multiplicando as duas, a carga cancela, e sobra energia por tempo: potência.",
      "Essa interpretação é mais importante do que decorar P = Ui. Quando você entende que tensão fala de energia por coulomb e corrente fala de coulomb por segundo, a fórmula deixa de ser mágica e vira consequência física direta.",
    ],
    panels: [
      {
        title: "Potência elétrica",
        formula: String.raw`P = Ui`,
        terms: [
          "P: potência elétrica, medida em watt.",
          "U: tensão elétrica, energia por unidade de carga.",
          "i: corrente elétrica, carga por unidade de tempo.",
        ],
        structure: [
          "Tensão é energia por carga.",
          "Corrente é carga por tempo.",
          "Multiplicando tensão por corrente, obtemos energia por tempo.",
        ],
        steps: [
          {
            title: "Passo 1: definição de potência",
            formulas: [String.raw`P = \frac{\Delta E}{\Delta t}`],
          },
          {
            title: "Passo 2: energia elétrica transferida",
            formulas: [String.raw`E = qU`],
          },
          {
            title: "Passo 3: substituir",
            formulas: [String.raw`P = \frac{qU}{\Delta t}`],
          },
          {
            title: "Passo 4: reconhecer a corrente",
            formulas: [
              String.raw`i = \frac{q}{\Delta t}`,
              String.raw`P = Ui`,
            ],
          },
          {
            title: "Passo 5: unidade",
            formulas: [
              String.raw`\text{V}\cdot\text{A} = \frac{\text{J}}{\text{C}}\cdot\frac{\text{C}}{\text{s}} = \frac{\text{J}}{\text{s}} = \text{W}`,
            ],
          },
        ],
      },
      {
        title: "Potência em resistor",
        formula: String.raw`P = Ri^2 = \frac{U^2}{R}`,
        terms: [
          "P = Ui: forma geral da potência elétrica.",
          "P = Ri²: útil quando a corrente é conhecida ou comum.",
          "P = U²/R: útil quando a tensão é conhecida ou comum.",
        ],
        structure: [
          "As duas formas vêm da Primeira Lei de Ohm.",
          "Em série, a corrente é comum; por isso P = Ri² costuma ser mais útil.",
          "Em paralelo, a tensão é comum; por isso P = U²/R costuma ser mais útil.",
        ],
        steps: [
          {
            title: "Dedução de P = Ri²",
            formulas: [String.raw`U = Ri`, String.raw`P = Ui = (Ri)i = Ri^2`],
          },
          {
            title: "Dedução de P = U²/R",
            formulas: [
              String.raw`i = \frac{U}{R}`,
              String.raw`P = Ui = U\left(\frac{U}{R}\right) = \frac{U^2}{R}`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Armadilha clássica",
        type: "warning",
        body: "Se a corrente é a mesma, como em série, potência cresce com a resistência. Se a tensão é a mesma, como em paralelo, potência diminui com a resistência. Primeiro veja qual grandeza está fixa.",
      },
    ],
  },
  {
    id: 14,
    icon: Flame,
    title: "14. Efeito Joule",
    accent: "from-pink-700 to-fuchsia-700",
    paragraphs: [
      "O efeito Joule é a transformação de energia elétrica em energia térmica devido à passagem de corrente por um resistor ou condutor real.",
      "Microscopicamente, os portadores de carga ganham energia do campo elétrico e transferem parte dessa energia para a rede do material em interações e espalhamentos. Isso aumenta a agitação microscópica do material, isto é, sua temperatura.",
      "É por isso que fios, resistores, chuveiros, ferros de passar e fusíveis aquecem quando atravessados por corrente elétrica. A eletricidade não desaparece; ela se transforma. E, muitas vezes, vira calor em lugares inconvenientes.",
    ],
    panels: [
      {
        title: "Energia dissipada por efeito Joule",
        formula: String.raw`E = Ri^2\Delta t`,
        terms: [
          "E: energia dissipada em forma de calor.",
          "R: resistência elétrica do condutor ou resistor.",
          "i: corrente elétrica.",
          "Δt: intervalo de tempo de funcionamento.",
        ],
        structure: [
          "A energia dissipada cresce com a resistência.",
          "A energia dissipada cresce com o quadrado da corrente.",
          "A energia dissipada cresce com o tempo de funcionamento.",
        ],
        steps: [
          {
            title: "Passo 1: potência dissipada",
            formulas: [String.raw`P = Ri^2`],
          },
          {
            title: "Passo 2: energia como potência vezes tempo",
            formulas: [String.raw`E = P\Delta t`],
          },
          {
            title: "Passo 3: substituir",
            formulas: [String.raw`E = Ri^2\Delta t`],
          },
          {
            title: "Passo 4: corrente dobrada",
            formulas: [
              String.raw`i' = 2i`,
              String.raw`P' = R(2i)^2 = 4Ri^2 = 4P`,
            ],
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
        body: "Corrente alta é perigosa porque o aquecimento cresce com i². Um aumento aparentemente pequeno na corrente pode gerar aumento muito grande na dissipação térmica.",
      },
    ],
  },
  {
    id: 15,
    icon: Zap,
    title: "15. Geradores elétricos",
    accent: "from-fuchsia-700 to-violet-700",
    paragraphs: [
      "Gerador elétrico é um dispositivo que transforma alguma forma de energia em energia elétrica. Uma pilha transforma energia química em elétrica. Um alternador transforma energia mecânica em elétrica. Uma célula solar transforma energia luminosa em elétrica.",
      "A grandeza central de um gerador é a força eletromotriz, representada por ε. Apesar do nome, força eletromotriz não é força. É energia por unidade de carga. O nome sobreviveu porque a tradição também comete crimes linguísticos.",
      "Em um gerador ideal, toda energia por unidade de carga fornecida internamente aparece como tensão nos terminais. Em um gerador real, parte dessa energia é dissipada na resistência interna do próprio gerador.",
    ],
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
          "A força eletromotriz mede energia fornecida por unidade de carga.",
          "Ela tem unidade de volt, pois também é joule por coulomb.",
          "Em gerador ideal, a tensão terminal é igual à força eletromotriz.",
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
          "U: tensão nos terminais do gerador.",
          "ε: força eletromotriz.",
          "r: resistência interna.",
          "i: corrente fornecida pelo gerador.",
        ],
        structure: [
          "Parte da energia por carga é perdida dentro do gerador.",
          "A queda interna vale ri.",
          "Quanto maior a corrente, menor a tensão útil nos terminais.",
        ],
        steps: [
          {
            title: "Passo 1: energia por carga produzida",
            body: [
              "O gerador fornece energia por unidade de carga igual a ε.",
            ],
          },
          {
            title: "Passo 2: queda interna",
            formulas: [String.raw`U_{\text{interna}} = ri`],
          },
          {
            title: "Passo 3: tensão útil nos terminais",
            formulas: [String.raw`U = \varepsilon - ri`],
          },
        ],
      },
      {
        title: "Potências no gerador real",
        formula: String.raw`P_{\text{útil}} = P_{\text{total}} - P_{\text{dissipada}}`,
        terms: [
          "P_total = εi: potência total produzida pelo gerador.",
          "P_útil = Ui: potência entregue ao circuito externo.",
          "P_dissipada = ri²: potência perdida na resistência interna.",
        ],
        structure: [
          "Multiplicar tensão por corrente transforma energia por carga em energia por tempo.",
          "A potência total se divide entre parte útil e perdas internas.",
          "O rendimento compara o que foi entregue ao circuito externo com o que foi produzido pelo gerador.",
        ],
        steps: [
          {
            title: "Passo 1: multiplicar a equação do gerador por i",
            formulas: [
              String.raw`U = \varepsilon - ri`,
              String.raw`Ui = \varepsilon i - ri^2`,
            ],
          },
          {
            title: "Passo 2: identificar as potências",
            formulas: [
              String.raw`P_{\text{útil}} = P_{\text{total}} - P_{\text{dissipada}}`,
            ],
          },
          {
            title: "Passo 3: rendimento",
            formulas: [
              String.raw`\eta = \frac{P_{\text{útil}}}{P_{\text{total}}} = \frac{U}{\varepsilon}`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Ideia física",
        type: "warning",
        body: "Gerador real não entrega tudo que produz. Parte da energia se perde internamente, e essa perda cresce com a corrente.",
      },
    ],
  },
  {
    id: 16,
    icon: Gauge,
    title: "16. Receptores elétricos",
    accent: "from-violet-700 to-indigo-800",
    paragraphs: [
      "Receptor elétrico é um dispositivo que recebe energia elétrica e transforma parte dessa energia em outra forma útil, diferente de calor puro. Um motor transforma energia elétrica em energia mecânica. Uma bateria sendo carregada transforma energia elétrica em energia química.",
      "Em um receptor real, a tensão aplicada precisa cumprir duas tarefas: fornecer energia para a conversão útil e compensar as perdas internas por efeito Joule. Por isso a equação do receptor real tem soma, não subtração.",
      "A força contraeletromotriz ε' representa a energia útil por unidade de carga convertida pelo receptor. Já o termo r'i representa a queda interna associada à resistência do receptor.",
    ],
    panels: [
      {
        title: "Receptor real",
        formula: String.raw`U = \varepsilon' + r'i`,
        terms: [
          "U: tensão aplicada ao receptor.",
          "ε': força contraeletromotriz.",
          "r': resistência interna do receptor.",
          "i: corrente que atravessa o receptor.",
        ],
        structure: [
          "A tensão aplicada alimenta a conversão útil de energia.",
          "Além disso, precisa compensar a queda interna por resistência.",
          "Por isso, no receptor, o termo interno aparece somando.",
        ],
        steps: [
          {
            title: "Passo 1: parte útil",
            body: [
              "A força contraeletromotriz mede a energia por unidade de carga convertida em forma útil.",
            ],
          },
          {
            title: "Passo 2: queda interna",
            formulas: [String.raw`U_{\text{interna}} = r'i`],
          },
          {
            title: "Passo 3: tensão total aplicada",
            formulas: [String.raw`U = \varepsilon' + r'i`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Comparação fundamental",
        type: "info",
        body: "Gerador real: U = ε - ri. Receptor real: U = ε' + r'i. No gerador, a resistência interna reduz a tensão útil entregue. No receptor, a fonte externa precisa fornecer tensão suficiente para a conversão útil e para a perda interna.",
      },
    ],
  },
  {
    id: 17,
    icon: Calculator,
    title: "17. Instrumentos de medida",
    accent: "from-indigo-800 to-slate-950",
    paragraphs: [
      "Instrumentos de medida precisam ser ligados de acordo com a grandeza que medem. Um erro de ligação não apenas altera a leitura: pode mudar totalmente o circuito ou danificar o instrumento.",
      "O amperímetro mede corrente. Para medir a corrente de um ramo, ele precisa ser atravessado pela mesma corrente do ramo. Por isso, é ligado em série. O amperímetro ideal tem resistência interna nula para não alterar a corrente medida.",
      "O voltímetro mede diferença de potencial entre dois pontos. Para medir a tensão nos terminais de um componente, ele deve ser ligado em paralelo com esse componente. O voltímetro ideal tem resistência interna infinita para não desviar corrente significativa.",
    ],
    panels: [
      {
        title: "Instrumentos ideais",
        formula: String.raw`R_A = 0 \qquad \text{e} \qquad R_V \to \infty`,
        terms: [
          "R_A: resistência interna do amperímetro.",
          "R_V: resistência interna do voltímetro.",
          "Amperímetro: mede corrente e deve ficar em série.",
          "Voltímetro: mede tensão e deve ficar em paralelo.",
        ],
        structure: [
          "O amperímetro ideal não deve alterar a corrente medida.",
          "O voltímetro ideal não deve puxar corrente significativa do circuito.",
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
          {
            title: "Ohmímetro",
            body: [
              "O ohmímetro mede resistência elétrica e deve ser usado com o circuito desligado, pois possui fonte interna de medição.",
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Erro comum que destrói questão",
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
      "As Leis de Kirchhoff são usadas quando o circuito não pode ser resolvido apenas por associações simples de resistores. Elas permitem analisar circuitos com vários ramos, várias fontes e várias malhas.",
      "A Lei dos Nós é consequência da conservação da carga. A Lei das Malhas é consequência da conservação da energia. Ou seja, Kirchhoff não é ritual místico com sinais: é conservação aplicada a circuitos.",
      "O método seguro é escolher sentidos arbitrários para as correntes, escrever equações de nós e malhas, resolver o sistema e interpretar sinais negativos. Corrente negativa não é fracasso; é aviso de que o sentido real é oposto ao escolhido.",
    ],
    numbered: [
      "Escolha sentidos arbitrários para as correntes.",
      "Aplique a Lei dos Nós onde houver ramificações importantes.",
      "Escolha malhas independentes.",
      "Percorra cada malha em um sentido escolhido.",
      "Atribua sinais corretamente para resistores, geradores e receptores.",
      "Resolva o sistema de equações.",
      "Interprete correntes negativas como sentido real oposto ao adotado.",
    ],
    panels: [
      {
        title: "Lei dos Nós",
        formula: String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`,
        terms: [
          "i_entrando: correntes que chegam ao nó.",
          "i_saindo: correntes que saem do nó.",
          "Nó: região onde ramos do circuito se encontram.",
        ],
        structure: [
          "A lei expressa conservação da carga.",
          "Em regime estacionário, carga não se acumula indefinidamente no nó.",
          "Tudo que entra precisa sair, considerando os sentidos adotados.",
        ],
        steps: [
          {
            title: "Passo 1: conservação da carga",
            body: [
              "Se carga se acumulasse indefinidamente em um nó, o potencial do nó mudaria continuamente. Em regime estacionário, isso não ocorre.",
            ],
          },
          {
            title: "Passo 2: balanço de correntes",
            formulas: [
              String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`,
            ],
          },
        ],
      },
      {
        title: "Lei das Malhas",
        formula: String.raw`\sum U = 0`,
        terms: [
          "ΣU: soma algébrica das variações de potencial em uma volta fechada.",
          "Malha: caminho fechado dentro do circuito.",
          "Variação de potencial: aumento ou queda de tensão ao atravessar um elemento.",
        ],
        structure: [
          "A lei expressa conservação da energia.",
          "Ao dar uma volta completa, voltamos ao mesmo ponto e ao mesmo potencial.",
          "Subidas e quedas de potencial devem se compensar.",
        ],
        steps: [
          {
            title: "Passo 1: volta fechada",
            body: [
              "Em uma malha, partimos de um ponto e retornamos ao mesmo ponto. O potencial final deve ser igual ao potencial inicial.",
            ],
          },
          {
            title: "Passo 2: soma algébrica",
            formulas: [String.raw`\sum U = 0`],
          },
          {
            title: "Passo 3: sinais em resistores",
            formulas: [
              String.raw`\text{sentido da corrente} \Rightarrow -Ri`,
              String.raw`\text{contra a corrente} \Rightarrow +Ri`,
            ],
          },
          {
            title: "Passo 4: sinais em geradores",
            formulas: [
              String.raw`- \to + \Rightarrow +\varepsilon`,
              String.raw`+ \to - \Rightarrow -\varepsilon`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Corrente negativa",
        type: "warning",
        body: "Se uma corrente calculada der negativa, não significa que a conta está errada. Significa que o sentido real da corrente é oposto ao sentido escolhido inicialmente.",
      },
    ],
  },
  {
    id: 19,
    icon: Compass,
    title: "19. Ponte de Wheatstone",
    accent: "from-indigo-900 to-purple-900",
    paragraphs: [
      "A Ponte de Wheatstone é um circuito usado para comparar resistências e medir resistências desconhecidas. Ela é muito cobrada porque mistura divisor de tensão, equilíbrio de potenciais e simplificação de circuitos.",
      "A ponte está equilibrada quando não passa corrente pelo galvanômetro. Isso ocorre quando os pontos intermediários ligados pelo galvanômetro têm o mesmo potencial elétrico.",
      "A condição da ponte não é uma fórmula caída do céu. Ela nasce da igualdade de potenciais nos pontos médios dos dois ramos. Se não há diferença de potencial no galvanômetro, não há corrente nele.",
    ],
    panels: [
      {
        title: "Condição de equilíbrio da Ponte de Wheatstone",
        formula: String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`,
        terms: [
          "R₁, R₂, R₃ e R₄: resistores da ponte.",
          "i_G: corrente no galvanômetro.",
          "Equilíbrio: situação em que i_G = 0.",
        ],
        structure: [
          "A ponte fica equilibrada quando os pontos intermediários têm o mesmo potencial.",
          "Se os potenciais são iguais, a tensão no galvanômetro é zero.",
          "Sem tensão no galvanômetro, a corrente nele é nula.",
        ],
        steps: [
          {
            title: "Passo 1: corrente nula no galvanômetro",
            formulas: [String.raw`i_G = 0`],
          },
          {
            title: "Passo 2: pontos equipotenciais",
            formulas: [String.raw`V_A = V_B`],
          },
          {
            title: "Passo 3: condição de equilíbrio",
            formulas: [String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Uso estratégico",
        type: "success",
        body: "Quando a ponte está equilibrada, o ramo do galvanômetro pode ser ignorado na análise, porque não passa corrente por ele.",
      },
      {
        title: "Cuidado",
        type: "warning",
        body: "Se a ponte não estiver equilibrada, não pode simplesmente apagar o ramo central. Nesse caso, pode ser necessário usar Kirchhoff ou outra técnica de análise.",
      },
    ],
  },
  {
    id: 20,
    icon: AlertTriangle,
    title: "20. Curto-circuito, fusíveis e disjuntores",
    accent: "from-red-700 to-slate-950",
    paragraphs: [
      "Curto-circuito ocorre quando dois pontos com diferença de potencial são conectados por um caminho de resistência muito baixa. O perigo não está no caminho ser geometricamente curto; está no fato de a resistência ser pequena demais.",
      "Pela Lei de Ohm, se a tensão é mantida e a resistência cai muito, a corrente cresce muito. Essa corrente alta pode aquecer fios, derreter isolantes, danificar aparelhos e causar incêndios.",
      "Pode parecer contraditório: se a resistência é pequena, por que esquenta tanto? A resposta está no efeito Joule. A potência dissipada depende de i². Mesmo que R seja pequeno, uma corrente enorme pode produzir dissipação perigosa.",
    ],
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
          "Com tensão mantida, reduzir muito R aumenta muito i.",
          "O aquecimento depende fortemente da corrente.",
          "Fusíveis e disjuntores interrompem o circuito antes que o aquecimento cause dano grave.",
        ],
        steps: [
          {
            title: "Passo 1: corrente pela Lei de Ohm",
            formulas: [String.raw`i = \frac{U}{R}`],
          },
          {
            title: "Passo 2: resistência muito pequena",
            formulas: [String.raw`R \to 0 \Rightarrow i \text{ muito grande}`],
          },
          {
            title: "Passo 3: aquecimento por efeito Joule",
            formulas: [String.raw`P = Ri^2`],
          },
          {
            title: "Passo 4: por que pode aquecer mesmo com R pequeno?",
            body: [
              "Porque a corrente pode ficar tão grande que o termo i² domina a dissipação. Pequena resistência não garante segurança se a corrente for enorme.",
            ],
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
      "Capacitores armazenam carga elétrica e energia em um campo elétrico entre suas placas. Em Eletrodinâmica básica, o ponto mais importante é entender o comportamento do capacitor em corrente contínua.",
      "Quando um capacitor descarregado é ligado a uma fonte, inicialmente há corrente no circuito. As placas começam a acumular cargas opostas, e a tensão entre elas aumenta.",
      "Durante o processo de carga, a corrente diminui. Após muito tempo, no regime estacionário de corrente contínua, o capacitor ideal carregado se comporta como circuito aberto. Ele não permite passagem contínua de corrente pelo ramo.",
      "Isso não significa que o capacitor sumiu do circuito. Significa apenas que, depois de carregado, ele bloqueia corrente contínua em regime permanente. Durante o transitório de carga ou descarga, a história é outra.",
    ],
    panels: [
      {
        title: "Carga armazenada em capacitor",
        formula: String.raw`Q = CU`,
        terms: [
          "Q: carga armazenada no capacitor.",
          "C: capacitância.",
          "U: tensão entre as placas.",
        ],
        structure: [
          "Para uma mesma capacitância, maior tensão permite armazenar mais carga.",
          "Para uma mesma tensão, maior capacitância significa maior capacidade de armazenar carga.",
          "Em corrente contínua estacionária, capacitor carregado se comporta como circuito aberto.",
        ],
        steps: [
          {
            title: "Passo 1: definição de capacitância",
            formulas: [String.raw`C = \frac{Q}{U}`],
          },
          {
            title: "Passo 2: isolando a carga",
            formulas: [String.raw`Q = CU`],
          },
          {
            title: "Passo 3: regime estacionário em corrente contínua",
            formulas: [
              String.raw`\text{capacitor carregado em CC estacionária} \Rightarrow \text{circuito aberto}`,
            ],
          },
        ],
      },
    ],
    notes: [
      {
        title: "Como usar em questão",
        type: "info",
        body: "Em circuitos de corrente contínua após muito tempo, trate o capacitor ideal como circuito aberto. No instante inicial ou durante carga e descarga, a análise é transitória e exige cuidado.",
      },
    ],
  },
  {
    id: 22,
    icon: BarChart3,
    title: "22. Gráficos importantes",
    accent: "from-blue-900 to-indigo-900",
    paragraphs: [
      "Gráficos em Eletrodinâmica não são decoração. Eles carregam informação física. Em provas difíceis, muitas vezes o gráfico substitui parte do enunciado.",
      "É preciso saber ler inclinação, intercepto, sinal da inclinação e significado físico de cada trecho. Gráfico U × i pode revelar resistência, força eletromotriz, resistência interna, comportamento ôhmico ou não ôhmico.",
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
          "A reta passa pela origem para resistor ôhmico ideal.",
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
        title: "Gráfico P × i para resistor",
        formula: String.raw`P = Ri^2`,
        terms: [
          "P: potência elétrica no eixo vertical.",
          "i: corrente elétrica no eixo horizontal.",
          "R: fator que controla a abertura da parábola.",
        ],
        structure: [
          "O gráfico é parabólico.",
          "A potência cresce com o quadrado da corrente.",
          "Corrente dobrada implica potência quatro vezes maior.",
        ],
        steps: [
          {
            title: "Corrente dobrada",
            formulas: [String.raw`P' = R(2i)^2 = 4Ri^2 = 4P`],
          },
        ],
      },
      {
        title: "Gráfico U × i para gerador real",
        formula: String.raw`U = \varepsilon - ri`,
        terms: [
          "ε: intercepto vertical.",
          "-r: inclinação da reta.",
          "U: tensão nos terminais.",
        ],
        structure: [
          "A reta é decrescente.",
          "Quando i = 0, U = ε.",
          "Quanto maior a resistência interna, mais rapidamente a tensão terminal cai com a corrente.",
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
          "ε': intercepto vertical.",
          "r': inclinação da reta.",
          "U: tensão aplicada ao receptor.",
        ],
        structure: [
          "A reta é crescente.",
          "O intercepto representa a energia útil por unidade de carga.",
          "A inclinação representa a resistência interna do receptor.",
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
    notes: [
      {
        title: "Prova difícil",
        type: "warning",
        body: "Em ITA/IME, o gráfico pode trazer os dados principais do problema. Leia interceptos, inclinações e sentido da reta antes de sair substituindo número como se a calculadora fosse te salvar da interpretação.",
      },
    ],
  },
  {
    id: 23,
    icon: Calculator,
    title: "23. Análise dimensional",
    accent: "from-indigo-900 to-slate-950",
    paragraphs: [
      "Análise dimensional é uma forma de verificar se uma fórmula faz sentido em termos de unidades. Ela não resolve toda questão, mas ajuda a detectar erros grosseiros antes que eles virem vergonha organizada.",
      "Em Eletrodinâmica, as unidades se conectam de maneira muito elegante: ampère é coulomb por segundo, volt é joule por coulomb, watt é joule por segundo, ohm é volt por ampère.",
    ],
    panels: [
      {
        title: "Unidades fundamentais em Eletrodinâmica",
        formula: String.raw`\text{A}, \ \text{V}, \ \Omega, \ \text{W}, \ \text{J}`,
        terms: [
          "A: ampère, unidade de corrente elétrica.",
          "V: volt, unidade de tensão elétrica.",
          "Ω: ohm, unidade de resistência elétrica.",
          "W: watt, unidade de potência.",
          "J: joule, unidade de energia.",
        ],
        structure: [
          "As unidades revelam o significado físico das grandezas.",
          "Potência elétrica vem de tensão vezes corrente.",
          "Resistência elétrica vem de tensão dividida por corrente.",
        ],
        steps: [
          {
            title: "Corrente elétrica",
            formulas: [
              String.raw`i = \frac{\Delta Q}{\Delta t}`,
              String.raw`[i] = \frac{\text{C}}{\text{s}} = \text{A}`,
            ],
          },
          {
            title: "Resistência elétrica",
            formulas: [
              String.raw`R = \frac{U}{i}`,
              String.raw`[R] = \frac{\text{V}}{\text{A}} = \Omega`,
            ],
          },
          {
            title: "Potência elétrica",
            formulas: [
              String.raw`P = Ui`,
              String.raw`[P] = \frac{\text{J}}{\text{C}}\cdot\frac{\text{C}}{\text{s}} = \text{W}`,
            ],
          },
          {
            title: "Resistividade",
            formulas: [
              String.raw`R = \rho\frac{L}{A}`,
              String.raw`[\rho] = \Omega\cdot\text{m}`,
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
      "O chuveiro elétrico usa efeito Joule. A corrente atravessa uma resistência e a energia elétrica é transformada em energia térmica, aquecendo a água.",
      "Para tensão fixa, diminuir a resistência aumenta a potência, pois P = U²/R. Por isso, em muitos chuveiros, a posição de maior aquecimento corresponde a uma resistência menor.",
      "Instalações residenciais usam associação em paralelo. Isso permite que os aparelhos recebam a mesma tensão e funcionem de forma independente.",
      "Linhas de transmissão usam altas tensões para reduzir perdas. Para transmitir a mesma potência, aumentar a tensão reduz a corrente. Como as perdas nos fios dependem de i², reduzir a corrente reduz muito a dissipação.",
    ],
    panels: [
      {
        title: "Perdas em linhas de transmissão",
        formula: String.raw`P_{\text{perdida}} = Ri^2`,
        terms: [
          "P_perdida: potência dissipada nos fios.",
          "R: resistência dos fios de transmissão.",
          "i: corrente que percorre a linha.",
        ],
        structure: [
          "As perdas crescem com o quadrado da corrente.",
          "Para a mesma potência transmitida, aumentar a tensão reduz a corrente.",
          "Por isso a transmissão de energia é feita em alta tensão.",
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
            title: "Conclusão",
            body: [
              "Se U aumenta e P é mantida, i diminui. Como as perdas dependem de i², a redução da corrente diminui fortemente a energia perdida nos fios.",
            ],
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
      "achar que a corrente diminui ao passar por resistores em série;",
      "inverter série e paralelo;",
      "usar P = U²/R sem perceber qual grandeza está fixa;",
      "esquecer resistência interna do gerador;",
      "errar sinal em Kirchhoff;",
      "ligar amperímetro em paralelo;",
      "ligar voltímetro em série;",
      "achar que elétrons se movem no sentido convencional da corrente;",
      "confundir kW com kWh;",
      "não perceber curto-circuito;",
      "não reconhecer pontos equipotenciais em circuitos simétricos.",
    ],
    notes: [
      {
        title: "Resumo da confusão humana",
        type: "warning",
        body: "Corrente não é energia. Tensão não é corrente. Potência não é energia. Resistência não é resistividade. Série não é paralelo. A física é coerente; o aluno é que geralmente tenta resolver circuito no modo superstição.",
      },
    ],
  },
  {
    id: 26,
    icon: Target,
    title: "26. Pontos importantes para ITA/IME",
    accent: "from-slate-950 to-purple-900",
    paragraphs: [
      "Em provas difíceis, Eletrodinâmica raramente aparece como aplicação direta de U = Ri. O conteúdo costuma vir misturado com simetria, energia, gráficos, geradores reais, instrumentos de medida e análise de circuitos não óbvios.",
      "O aluno forte não começa calculando. Ele começa interpretando a estrutura do circuito: quais pontos são nós, onde a tensão é comum, onde a corrente é comum, se há simetria, se existem pontos equipotenciais e se algum instrumento altera a configuração do circuito.",
    ],
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
        body: "Antes de calcular, pergunte: quais elementos estão em série? Quais estão em paralelo? Há pontos equipotenciais? A corrente se divide? A tensão é comum? Há resistência interna? O instrumento altera o circuito? O problema pede potência máxima ou rendimento?",
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
        body: "A corrente média é 4 A. Isso significa que passam, em média, 4 C por segundo pela seção analisada.",
      },
    ],
  },
  {
    id: "ex2",
    title: "Exemplo 2 — Número de elétrons",
    statement:
      "Uma corrente de 3,2 A atravessa um fio durante 5 s. Quantos elétrons atravessam uma seção nesse intervalo?",
    explanation: [
      "Primeiro calculamos a carga total transportada. Depois usamos a quantização da carga para determinar o número de elétrons.",
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
    explanation: [
      "Como o resistor é tratado como ôhmico, usamos a Primeira Lei de Ohm.",
    ],
    formulas: [
      String.raw`U = Ri`,
      String.raw`i = \frac{U}{R}`,
      String.raw`i = \frac{24}{8}`,
      String.raw`i = 3 \ \text{A}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A corrente elétrica vale 3 A.",
      },
    ],
  },
  {
    id: "ex4",
    title: "Exemplo 4 — Segunda Lei de Ohm",
    statement:
      "Um fio tem comprimento 10 m, área 2,0 × 10⁻⁶ m² e resistividade 2,0 × 10⁻⁸ Ω·m. Determine sua resistência.",
    explanation: [
      "A resistência depende da resistividade do material, do comprimento e da área da seção transversal.",
    ],
    formulas: [
      String.raw`R = \rho\frac{L}{A}`,
      String.raw`R = 2{,}0 \times 10^{-8}\cdot\frac{10}{2{,}0 \times 10^{-6}}`,
      String.raw`R = 0{,}10 \ \Omega`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A resistência do fio é 0,10 Ω.",
      },
    ],
  },
  {
    id: "ex5",
    title: "Exemplo 5 — Associação em série",
    statement:
      "Três resistores de 2 Ω, 3 Ω e 5 Ω estão em série ligados a uma fonte de 20 V.",
    explanation: [
      "Em série, a corrente é a mesma em todos os resistores e as resistências se somam.",
    ],
    formulas: [
      String.raw`R_{\text{eq}} = R_1 + R_2 + R_3`,
      String.raw`R_{\text{eq}} = 2 + 3 + 5 = 10 \ \Omega`,
      String.raw`i = \frac{U}{R_{\text{eq}}} = \frac{20}{10}`,
      String.raw`i = 2 \ \text{A}`,
    ],
    notes: [
      {
        title: "Ideia importante",
        type: "warning",
        body: "Em série, a corrente não diminui ao passar pelos resistores. O que se divide é a tensão.",
      },
    ],
  },
  {
    id: "ex6",
    title: "Exemplo 6 — Associação em paralelo",
    statement:
      "Dois resistores de 6 Ω e 3 Ω estão em paralelo ligados a uma fonte de 12 V.",
    explanation: [
      "Para dois resistores em paralelo, usamos o produto dividido pela soma. Depois aplicamos a Lei de Ohm ao circuito equivalente.",
    ],
    formulas: [
      String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1 + R_2}`,
      String.raw`R_{\text{eq}} = \frac{6\cdot 3}{6 + 3} = 2 \ \Omega`,
      String.raw`i = \frac{12}{2} = 6 \ \text{A}`,
    ],
    notes: [
      {
        title: "Ideia importante",
        type: "info",
        body: "Em paralelo, a resistência equivalente é menor que a menor resistência individual.",
      },
    ],
  },
  {
    id: "ex7",
    title: "Exemplo 7 — Associação mista",
    statement:
      "Um resistor de 4 Ω está em série com uma associação em paralelo de 6 Ω e 3 Ω. O circuito é ligado a 18 V.",
    explanation: [
      "Primeiro reduzimos a associação em paralelo. Depois somamos com o resistor em série.",
    ],
    formulas: [
      String.raw`R_p = \frac{6\cdot 3}{6 + 3} = 2 \ \Omega`,
      String.raw`R_{\text{eq}} = 4 + 2 = 6 \ \Omega`,
      String.raw`i = \frac{18}{6} = 3 \ \text{A}`,
    ],
    notes: [
      {
        title: "Leitura do circuito",
        type: "warning",
        body: "Em associação mista, o mais importante é identificar corretamente série, paralelo e nós.",
      },
    ],
  },
  {
    id: "ex8",
    title: "Exemplo 8 — Potência elétrica",
    statement:
      "Um aparelho ligado a 220 V é atravessado por corrente de 5 A. Determine a potência elétrica.",
    explanation: [
      "Potência elétrica é a taxa de transformação de energia. Conhecendo tensão e corrente, usamos P = Ui.",
    ],
    formulas: [
      String.raw`P = Ui`,
      String.raw`P = 220\cdot 5 = 1100 \ \text{W}`,
      String.raw`P = 1{,}1 \ \text{kW}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "O aparelho possui potência de 1100 W, ou 1,1 kW.",
      },
    ],
  },
  {
    id: "ex9",
    title: "Exemplo 9 — Consumo em kWh",
    statement:
      "Um chuveiro de 5500 W funciona por 30 minutos por dia durante 20 dias.",
    explanation: [
      "Para consumo em kWh, usamos potência em kW e tempo em horas.",
    ],
    formulas: [
      String.raw`5500 \ \text{W} = 5{,}5 \ \text{kW}`,
      String.raw`30 \ \text{min} = 0{,}5 \ \text{h}`,
      String.raw`\Delta t = 0{,}5\cdot 20 = 10 \ \text{h}`,
      String.raw`E = P\Delta t = 5{,}5\cdot 10`,
      String.raw`E = 55 \ \text{kWh}`,
    ],
    notes: [
      {
        title: "Erro comum",
        type: "warning",
        body: "kW é potência. kWh é energia. Confundir isso é quase tradição nacional, mas não precisa participar.",
      },
    ],
  },
  {
    id: "ex10",
    title: "Exemplo 10 — Efeito Joule",
    statement:
      "Um resistor de 10 Ω é atravessado por corrente de 2 A durante 5 min. Determine a energia dissipada.",
    explanation: [
      "A energia dissipada por efeito Joule depende da resistência, do quadrado da corrente e do tempo.",
    ],
    formulas: [
      String.raw`E = Ri^2\Delta t`,
      String.raw`5 \ \text{min} = 300 \ \text{s}`,
      String.raw`E = 10\cdot 2^2\cdot 300`,
      String.raw`E = 1{,}2 \times 10^4 \ \text{J}`,
    ],
    notes: [
      {
        title: "Ideia física",
        type: "info",
        body: "O aquecimento cresce com o quadrado da corrente.",
      },
    ],
  },
  {
    id: "ex11",
    title: "Exemplo 11 — Gerador real",
    statement:
      "Um gerador possui ε = 12 V e resistência interna r = 1 Ω. Ele fornece corrente de 2 A.",
    explanation: [
      "Em um gerador real, a tensão nos terminais é menor que a força eletromotriz devido à queda interna.",
    ],
    formulas: [
      String.raw`U = \varepsilon - ri`,
      String.raw`U = 12 - 1\cdot 2 = 10 \ \text{V}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A tensão nos terminais é 10 V.",
      },
    ],
  },
  {
    id: "ex12",
    title: "Exemplo 12 — Receptor real",
    statement:
      "Um motor possui ε' = 20 V e resistência interna r' = 2 Ω. Ele é atravessado por corrente de 3 A.",
    explanation: [
      "Em um receptor real, a tensão aplicada alimenta a conversão útil e também compensa a queda interna.",
    ],
    formulas: [
      String.raw`U = \varepsilon' + r'i`,
      String.raw`U = 20 + 2\cdot 3 = 26 \ \text{V}`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "A tensão aplicada ao receptor é 26 V.",
      },
    ],
  },
  {
    id: "ex13",
    title: "Exemplo 13 — Amperímetro e voltímetro",
    statement:
      "Deseja-se medir a corrente que passa por um resistor e a tensão em seus terminais.",
    explanation: [
      "O amperímetro mede corrente e deve ficar em série. O voltímetro mede tensão e deve ficar em paralelo.",
    ],
    formulas: [String.raw`R_A = 0`, String.raw`R_V \to \infty`],
    notes: [
      {
        title: "Erro perigoso",
        type: "danger",
        body: "Amperímetro em paralelo pode causar curto-circuito. Voltímetro em série pode quase interromper o circuito.",
      },
    ],
  },
  {
    id: "ex14",
    title: "Exemplo 14 — Kirchhoff com uma malha",
    statement:
      "Uma bateria ideal de 12 V alimenta resistores de 2 Ω e 4 Ω em série.",
    explanation: [
      "Percorremos a malha no sentido da corrente. A fonte fornece energia e os resistores produzem quedas de tensão.",
    ],
    formulas: [
      String.raw`+12 - 2i - 4i = 0`,
      String.raw`12 - 6i = 0`,
      String.raw`i = 2 \ \text{A}`,
    ],
    notes: [
      {
        title: "Interpretação",
        type: "success",
        body: "A soma das quedas de tensão nos resistores iguala a tensão fornecida pela fonte.",
      },
    ],
  },
  {
    id: "ex15",
    title: "Exemplo 15 — Kirchhoff com duas malhas",
    statement:
      "Duas malhas compartilham um resistor de 2 Ω. Na esquerda há fonte de 10 V e resistor de 3 Ω. Na direita há fonte de 8 V e resistor de 4 Ω.",
    explanation: [
      "Escolhemos correntes de malha i₁ e i₂ no sentido horário. No resistor compartilhado, a corrente depende da diferença entre as correntes de malha.",
    ],
    formulas: [
      String.raw`10 - 3i_1 - 2(i_1 - i_2) = 0`,
      String.raw`5i_1 - 2i_2 = 10`,
      String.raw`8 - 4i_2 - 2(i_2 - i_1) = 0`,
      String.raw`-2i_1 + 6i_2 = 8`,
      String.raw`\begin{cases}5i_1 - 2i_2 = 10\\-2i_1 + 6i_2 = 8\end{cases}`,
      String.raw`i_1 = \frac{38}{13} \ \text{A}`,
      String.raw`i_2 = \frac{30}{13} \ \text{A}`,
    ],
    notes: [
      {
        title: "Resposta final",
        type: "success",
        body: "Como as correntes deram positivas, os sentidos escolhidos estavam corretos.",
      },
    ],
  },
  {
    id: "ex16",
    title: "Exemplo 16 — Ponte de Wheatstone",
    statement:
      "Uma ponte possui R₁ = 2 Ω, R₂ = 4 Ω, R₃ = 3 Ω e R₄ desconhecido. Determine R₄ para equilíbrio.",
    explanation: [
      "Em equilíbrio, não passa corrente pelo galvanômetro, e as razões dos resistores obedecem à condição da ponte.",
    ],
    formulas: [
      String.raw`\frac{R_1}{R_2} = \frac{R_3}{R_4}`,
      String.raw`\frac{2}{4} = \frac{3}{R_4}`,
      String.raw`R_4 = 6 \ \Omega`,
    ],
    notes: [
      {
        title: "Resposta",
        type: "success",
        body: "Para equilíbrio, R₄ = 6 Ω.",
      },
    ],
  },
  {
    id: "ex17",
    title: "Exemplo 17 — Potência máxima transferida",
    statement:
      "Um gerador real de força eletromotriz ε e resistência interna r alimenta um resistor externo variável R.",
    explanation: [
      "A potência dissipada no resistor externo depende de R. Ao maximizar a função, obtemos a condição de potência máxima transferida.",
    ],
    formulas: [
      String.raw`i = \frac{\varepsilon}{R + r}`,
      String.raw`P_R = R\left(\frac{\varepsilon}{R + r}\right)^2`,
      String.raw`P_R = \frac{R\varepsilon^2}{(R + r)^2}`,
      String.raw`P_{\max} \Rightarrow R = r`,
      String.raw`P_{\max} = \frac{\varepsilon^2}{4r}`,
    ],
    notes: [
      {
        title: "Ideia de prova difícil",
        type: "warning",
        body: "Potência máxima e rendimento máximo não são a mesma coisa. Quando R = r, o rendimento é 50%.",
      },
    ],
  },
  {
    id: "ex18",
    title: "Exemplo 18 — Simetria e ponto equipotencial",
    statement:
      "Em uma rede simétrica, dois pontos possuem o mesmo potencial. O que acontece com um resistor ligado entre esses pontos?",
    explanation: [
      "Se dois pontos têm o mesmo potencial, a diferença de potencial entre eles é nula. Sem tensão, não há corrente no resistor entre esses pontos.",
    ],
    formulas: [
      String.raw`V_A = V_B`,
      String.raw`U_{AB} = V_A - V_B = 0`,
      String.raw`i = \frac{U_{AB}}{R} = 0`,
    ],
    notes: [
      {
        title: "Conclusão",
        type: "success",
        body: "Um resistor ligado entre pontos equipotenciais não é atravessado por corrente.",
      },
    ],
  },
  {
    id: "ex19",
    title: "Exemplo 19 — Voltímetro real alterando a medida",
    statement:
      "Um divisor de tensão possui dois resistores de 10 kΩ ligados a 12 V. Um voltímetro real de 10 kΩ mede a tensão no segundo resistor.",
    explanation: [
      "O voltímetro real tem resistência finita. Ao ser ligado em paralelo com o resistor medido, ele altera a resistência equivalente daquele trecho.",
    ],
    formulas: [
      String.raw`R_{\text{eq}} = \frac{10\,000\cdot 10\,000}{10\,000 + 10\,000}`,
      String.raw`R_{\text{eq}} = 5\,000 \ \Omega`,
      String.raw`U_{\text{medido}} = 12\cdot\frac{5}{10 + 5} = 4 \ \text{V}`,
    ],
    notes: [
      {
        title: "Moral da história",
        type: "warning",
        body: "Instrumentos reais podem alterar o circuito. Instrumento ideal é modelo; instrumento real é problema de prova.",
      },
    ],
  },
  {
    id: "ex20",
    title: "Exemplo 20 — Potência em série e paralelo",
    statement:
      "Compare o comportamento da potência quando a corrente é fixa e quando a tensão é fixa.",
    explanation: [
      "Quando a corrente é fixa, usamos P = Ri². Quando a tensão é fixa, usamos P = U²/R. O comportamento da potência muda porque a grandeza mantida constante é diferente.",
    ],
    formulas: [
      String.raw`\text{corrente fixa} \Rightarrow P = Ri^2`,
      String.raw`\text{tensão fixa} \Rightarrow P = \frac{U^2}{R}`,
    ],
    notes: [
      {
        title: "Erro clássico",
        type: "danger",
        body: "Não escolha fórmula de potência no automático. Primeiro veja qual grandeza está fixa: corrente ou tensão.",
      },
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
    description: "Relação entre tensão, resistência e corrente em resistor ôhmico.",
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
    title: "Potência em resistor",
    formula: String.raw`P = Ri^2 = \frac{U^2}{R}`,
    description: "Formas úteis usando a Lei de Ohm.",
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
    title: "Lei dos nós",
    formula: String.raw`\sum i_{\text{entrando}} = \sum i_{\text{saindo}}`,
    description: "Conservação da carga.",
  },
  {
    title: "Lei das malhas",
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
  {
    title: "Potência máxima",
    formula: String.raw`R = r`,
    description: "Condição de máxima potência externa em gerador real.",
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
                    Uma abordagem completa de Eletrodinâmica: corrente, tensão,
                    resistência, leis de Ohm, associações, potência, efeito
                    Joule, geradores, receptores, instrumentos, Kirchhoff,
                    Wheatstone, capacitores e gráficos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["26", "tópicos"],
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

                {section.numbered ? (
                  <NumberedList items={section.numbered} />
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
              description="Exercícios em ordem crescente: corrente, número de elétrons, Ohm, associações, potência, Joule, geradores, receptores, instrumentos, Kirchhoff, ponte, simetria e potência máxima."
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
