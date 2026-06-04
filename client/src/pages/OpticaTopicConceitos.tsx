import { useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calculator,
  Compass,
  Eye,
  Layers,
  Lightbulb,
  Rainbow,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

import { MathFormula } from "@/components/MathFormula";

type Tab = "fundamentos" | "formulas" | "treino";

type ConceptBlock = {
  title: string;
  icon: ElementType;
  accent: string;
  description: string;
  bullets: string[];
};

type FormulaCard = {
  title: string;
  formula: string;
  meaning: string;
  warning?: string;
};

type ExampleCard = {
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: string[];
  answer: string;
};

const tabs: Array<{ id: Tab; label: string; description: string }> = [
  {
    id: "fundamentos",
    label: "Fundamentos",
    description: "o que realmente precisa estar claro antes de espelhos e lentes",
  },
  {
    id: "formulas",
    label: "Fórmulas essenciais",
    description: "relações úteis, condições de validade e erros de sinal",
  },
  {
    id: "treino",
    label: "Exemplos e prova",
    description: "como transformar a teoria em resolução de questão",
  },
];

const principles: ConceptBlock[] = [
  {
    title: "O que a Óptica Geométrica realmente modela",
    icon: Eye,
    accent: "from-orange-600 to-amber-500",
    description:
      "Nesta primeira página, o foco não é estudar todos os fenômenos ópticos de uma vez. A ideia é construir a base: representar a luz por raios, prever trajetórias e entender quando esse modelo funciona.",
    bullets: [
      "Raios de luz são linhas orientadas que indicam a direção e o sentido de propagação da luz.",
      "O modelo geométrico é excelente quando os obstáculos, espelhos e lentes são muito maiores que o comprimento de onda da luz.",
      "Quando aparecem difração, interferência ou polarização, o modelo ondulatório precisa entrar com mais força.",
      "Para vestibulares, quase toda reflexão, refração, espelhos e lentes começa por um bom desenho de raios.",
    ],
  },
  {
    title: "Fonte, objeto, imagem e observador",
    icon: ScanLine,
    accent: "from-sky-600 to-cyan-500",
    description:
      "Uma das primeiras confusões do aluno é achar que imagem é sempre algo projetado em uma tela. Em Óptica, imagem é o ponto de encontro real ou aparente dos raios que chegam ao olho ou ao detector.",
    bullets: [
      "Fonte primária emite luz própria, como Sol, lâmpada e chama.",
      "Fonte secundária apenas reflete luz recebida, como uma folha, uma parede ou uma pessoa iluminada.",
      "Imagem real é formada pelo encontro efetivo dos raios luminosos e pode ser projetada em uma tela.",
      "Imagem virtual é formada pelo prolongamento dos raios e não pode ser projetada diretamente em uma tela.",
    ],
  },
  {
    title: "Os três princípios que sustentam a maioria das questões",
    icon: Compass,
    accent: "from-violet-600 to-fuchsia-500",
    description:
      "Grande parte da Óptica Geométrica de vestibular é uma aplicação cuidadosa de três princípios simples. Eles parecem inocentes, mas comandam sombras, espelhos, câmaras escuras, trajetórias reversas e desenhos de raios.",
    bullets: [
      "Propagação retilínea: em meio homogêneo e transparente, a luz se propaga em linha reta.",
      "Independência dos raios: raios que se cruzam não se alteram mutuamente no cruzamento.",
      "Reversibilidade: se um raio pode ir de A até B por certo caminho, também pode ir de B até A pelo mesmo caminho em sentido contrário.",
      "O erro comum é decorar os nomes e não usá-los no desenho da questão.",
    ],
  },
  {
    title: "Normal, ângulo e mudança de meio",
    icon: Layers,
    accent: "from-emerald-600 to-teal-500",
    description:
      "Em reflexão e refração, os ângulos relevantes são medidos em relação à normal, não em relação à superfície. Essa frase salva pontos demais para ser tratada como detalhe.",
    bullets: [
      "A normal é a reta perpendicular à superfície no ponto de incidência.",
      "Ângulo de incidência, reflexão e refração são medidos entre o raio e a normal.",
      "Ao entrar em meio de maior índice de refração, o raio se aproxima da normal.",
      "Ao entrar em meio de menor índice de refração, o raio se afasta da normal.",
    ],
  },
];

const usefulNotEverything = [
  {
    title: "O que fica nesta página",
    items: [
      "conceito de raio luminoso, feixe, fonte e imagem;",
      "princípios da Óptica Geométrica;",
      "câmara escura e semelhança de triângulos;",
      "base mínima de reflexão e refração;",
      "vocabulário necessário para espelhos, lentes e instrumentos.",
    ],
  },
  {
    title: "O que não deve inflar esta página",
    items: [
      "tabela completa de imagens em espelhos esféricos;",
      "todos os casos de lentes delgadas;",
      "instrumentos ópticos em detalhe;",
      "defeitos da visão com contas longas;",
      "difração, interferência e polarização, que pertencem melhor à Ondulatória.",
    ],
  },
];

const formulas: FormulaCard[] = [
  {
    title: "Relação fundamental da onda",
    formula: "v = \\lambda f",
    meaning:
      "Liga velocidade de propagação, comprimento de onda e frequência. Em mudança de meio, a frequência permanece constante; mudam velocidade e comprimento de onda.",
    warning: "Não trate frequência como se mudasse na refração. Esse é um erro clássico.",
  },
  {
    title: "Índice de refração absoluto",
    formula: "n = \\frac{c}{v}",
    meaning:
      "Mede o quanto a luz fica mais lenta em um meio em comparação com o vácuo. Quanto maior o índice, menor a velocidade da luz no meio.",
  },
  {
    title: "Lei da reflexão",
    formula: "i = r",
    meaning:
      "O ângulo de incidência é igual ao ângulo de reflexão, ambos medidos pela normal.",
    warning: "Se medir pela superfície, a conta até pode parecer bonita, mas estará olhando para o ângulo errado.",
  },
  {
    title: "Lei de Snell-Descartes",
    formula: "n_1\\sin i = n_2\\sin r",
    meaning:
      "Relaciona o desvio do raio luminoso aos índices de refração dos meios. É a ponte entre geometria e mudança de velocidade da luz.",
  },
  {
    title: "Câmara escura",
    formula: "\\frac{i}{o} = \\frac{p'}{p}",
    meaning:
      "Vem diretamente da semelhança de triângulos. A imagem é invertida e seu tamanho depende da razão entre a profundidade da câmara e a distância do objeto.",
  },
  {
    title: "Ângulo limite",
    formula: "\\sin L = \\frac{n_2}{n_1}",
    meaning:
      "Usado para reflexão total quando a luz tenta passar do meio mais refringente para o menos refringente.",
    warning: "Só faz sentido se n_1 > n_2. Sem isso, não há reflexão total por esse critério.",
  },
];

const examples: ExampleCard[] = [
  {
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

const examChecklist = [
  "desenhar a normal antes de escrever qualquer seno;",
  "verificar se o ângulo foi dado em relação à normal ou à superfície;",
  "prever qualitativamente se o raio aproxima ou afasta da normal;",
  "lembrar que frequência não muda na passagem entre meios;",
  "separar imagem real de imagem virtual pelo caminho dos raios, não por chute visual;",
  "usar semelhança de triângulos em câmara escura, sombra e ampliações simples;",
  "não misturar fundamentos de Óptica Geométrica com fenômenos ondulatórios sem necessidade.",
];

function FormulaBox({ formula, dark = false }: { formula: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark
          ? "border-white/10 bg-white/5 text-white [&_.MathJax]:text-white"
          : "border-slate-200 bg-slate-50 text-slate-950"
      }`}
    >
      <MathFormula formula={formula} display={true} />
    </div>
  );
}

function SectionShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] md:p-8">
      {eyebrow ? (
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-orange-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ConceptCard({ block }: { block: ConceptBlock }) {
  const Icon = block.icon;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-2 bg-gradient-to-r ${block.accent}`} />
      <div className="p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className={`rounded-2xl bg-gradient-to-br ${block.accent} p-3 text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-950">{block.title}</h3>
            <p className="mt-2 leading-8 text-slate-700">{block.description}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {block.bullets.map((item) => (
            <li key={item} className="flex gap-3 leading-7 text-slate-700">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function FormulaCardView({ item }: { item: FormulaCard }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
      <div className="my-4">
        <FormulaBox formula={item.formula} />
      </div>
      <p className="leading-7 text-slate-700">{item.meaning}</p>
      {item.warning ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          {item.warning}
        </div>
      ) : null}
    </article>
  );
}

function ExampleCardView({ example, index }: { example: ExampleCard; index: number }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Exemplo {index + 1} · {example.level}
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{example.title}</h3>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
          resolvido
        </div>
      </div>

      <p className="mt-5 rounded-2xl bg-slate-50 p-4 leading-8 text-slate-700">
        {example.statement}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h4 className="font-black text-slate-950">Ideia antes da conta</h4>
          <p className="mt-2 leading-7 text-slate-700">{example.idea}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-black text-slate-950">Desenvolvimento</h4>
          <ol className="mt-3 space-y-3">
            {example.steps.map((step, stepIndex) => (
              <li key={step} className="flex gap-3 leading-7 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                  {stepIndex + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-7 text-emerald-950">
        {example.answer}
      </div>
    </article>
  );
}

function HeroPanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-orange-500/20 p-3 text-orange-200">
          <Waves className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-black">Mapa mínimo da página</h3>
          <p className="text-sm text-slate-400">o que você precisa dominar primeiro</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {[
          "raio luminoso e feixe",
          "fonte, objeto e imagem",
          "normal e ângulos",
          "reflexão e refração",
          "câmara escura",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="h-2 w-2 rounded-full bg-orange-300" />
            <span className="text-sm font-bold text-slate-200">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <FormulaBox formula="n_1\sin i = n_2\sin r" dark={true} />
      </div>
    </div>
  );
}

export default function OpticaTopicConceitos() {
  const [activeTab, setActiveTab] = useState<Tab>("fundamentos");

  const activeContent = useMemo(() => {
    if (activeTab === "fundamentos") {
      return (
        <div className="space-y-8">
          <SectionShell title="O papel desta página" eyebrow="organização">
            <div className="grid gap-5 lg:grid-cols-2">
              {usefulNotEverything.map((group) => (
                <div key={group.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-black text-slate-950">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3 leading-7 text-slate-700">
                        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionShell>

          <div className="grid gap-6 xl:grid-cols-2">
            {principles.map((block) => (
              <ConceptCard key={block.title} block={block} />
            ))}
          </div>

          <SectionShell title="A sequência de raciocínio em Óptica" eyebrow="método">
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { title: "1. Desenhe", text: "represente superfície, normal, objeto e sentido da luz" },
                { title: "2. Identifique", text: "decida se há reflexão, refração, sombra ou formação de imagem" },
                { title: "3. Preveja", text: "antecipe o comportamento antes da conta" },
                { title: "4. Calcule", text: "use semelhança, Snell ou fórmula adequada" },
                { title: "5. Interprete", text: "confira sinal, unidade, imagem real/virtual e sentido físico" },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </SectionShell>
        </div>
      );
    }

    if (activeTab === "formulas") {
      return (
        <div className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {formulas.map((item) => (
              <FormulaCardView key={item.title} item={item} />
            ))}
          </div>

          <SectionShell title="Convenções que valem ouro" eyebrow="atenção">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Compass,
                  title: "Ângulo sempre pela normal",
                  text: "Em reflexão e refração, desenhe a normal no ponto de incidência antes de medir qualquer ângulo.",
                },
                {
                  icon: Waves,
                  title: "Frequência permanece",
                  text: "Na mudança de meio, a fonte não muda. Por isso, a frequência permanece constante.",
                },
                {
                  icon: AlertTriangle,
                  title: "Modelo tem limite",
                  text: "Se o problema envolve fendas, interferência ou difração, a Óptica Geométrica sozinha não basta.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 leading-7 text-slate-700">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </SectionShell>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {examples.map((example, index) => (
          <ExampleCardView key={example.title} example={example} index={index} />
        ))}

        <SectionShell title="Checklist para prova" eyebrow="ITA, IME, FUVEST e militares">
          <div className="grid gap-4 md:grid-cols-2">
            {examChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700">
                <Target className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>
    );
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/70 to-yellow-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <Link
            href="/optica"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-orange-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para Óptica
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-yellow-400 text-white shadow-lg">
              <Eye className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-slate-900">Fundamentos da Óptica</h1>
              <p className="text-xs font-semibold text-slate-500">base para reflexão, refração e formação de imagens</p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.18),transparent_32%)]" />
        <div className="container relative grid gap-10 py-14 md:grid-cols-[1.12fr_0.88fr] md:items-center md:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-200">
              <Sparkles className="h-4 w-4" />
              Óptica geométrica sem excesso
            </div>

            <div className="space-y-5">
              <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Antes de decorar espelhos e lentes, entenda o caminho da luz.
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                Esta versão corta o que inflava a página e foca no que realmente sustenta as questões:
                raios luminosos, princípios, normal, imagem, câmara escura, reflexão e refração.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "princípios centrais", value: "3" },
                { label: "fórmulas úteis", value: formulas.length },
                { label: "exemplos guiados", value: examples.length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="text-sm font-semibold text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroPanel />
        </div>
      </section>

      <main className="container py-10 md:py-14">
        <div className="mb-8 grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.08)] md:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-5 py-4 text-left transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-orange-600 to-yellow-500 text-white shadow-lg"
                  : "bg-slate-50 text-slate-700 hover:bg-orange-50"
              }`}
            >
              <span className="block text-base font-black">{tab.label}</span>
              <span className={`mt-1 block text-sm ${activeTab === tab.id ? "text-orange-50" : "text-slate-500"}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        {activeContent}

        <section className="mt-12 grid gap-5 md:grid-cols-3">
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
              <Link key={item.href} href={item.href}>
                <a className="block h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
                  <div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
                </a>
              </Link>
            );
          })}
        </section>

        <section className="mt-12 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-7 text-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.28)] md:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl font-black md:text-3xl">Fechamento dos fundamentos</h2>
              <p className="leading-8 text-slate-300">
                Óptica começa com uma pergunta simples: por onde a luz passa? Se o aluno desenha o raio,
                marca a normal e interpreta o tipo de imagem antes da fórmula, metade dos erros desaparece.
              </p>
            </div>
            <div className="grid gap-3 text-sm font-bold text-slate-300 md:min-w-[320px]">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                Ângulos de reflexão e refração são medidos pela normal.
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                Na refração, a frequência permanece constante.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
