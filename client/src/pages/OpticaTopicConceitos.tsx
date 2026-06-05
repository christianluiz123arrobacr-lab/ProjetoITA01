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

type TheorySection = {
  id: number;
  icon: ElementType;
  title: string;
  accent: string;
  paragraphs: string[];
  bullets?: string[];
  numbered?: string[];
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
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
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

function TheorySectionCard({ section }: { section: TheorySection }) {
  const Icon = section.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className={`bg-gradient-to-r ${section.accent} px-7 py-6 text-white md:px-9`}>
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
    accent: "from-purple-600 to-fuchsia-600",
    paragraphs: [
      "Nesta primeira página, o foco não é estudar a Óptica inteira de uma vez. A ideia é organizar a base que sustenta quase todas as questões iniciais: raio luminoso, feixe, fonte, imagem, princípios da Óptica Geométrica, câmara escura, reflexão e refração.",
      "Em outras palavras: esta página existe para deixar claro o que precisa estar firme antes de espelhos, lentes, instrumentos ópticos e fenômenos mais específicos.",
    ],
    notes: [
      {
        title: "O que fica nesta página",
        type: "success",
        body: "conceito de raio luminoso, feixe, fonte e imagem; princípios da Óptica Geométrica; câmara escura e semelhança de triângulos; base mínima de reflexão e refração; vocabulário necessário para espelhos, lentes e instrumentos.",
      },
      {
        title: "O que não deve inflar esta página",
        type: "warning",
        body: "tabela completa de imagens em espelhos esféricos; todos os casos de lentes delgadas; instrumentos ópticos em detalhe; defeitos da visão com contas longas; difração, interferência e polarização, que pertencem melhor à Ondulatória.",
      },
    ],
  },
  {
    id: 2,
    icon: Eye,
    title: "O que a Óptica Geométrica realmente modela",
    accent: "from-blue-700 to-slate-950",
    paragraphs: [
      "A Óptica Geométrica representa a luz por raios luminosos, isto é, linhas orientadas que indicam a direção e o sentido de propagação da luz.",
      "Esse modelo é excelente quando os obstáculos, espelhos e lentes são muito maiores que o comprimento de onda da luz. Nessa situação, prever trajetórias por meio de raios funciona muito bem.",
      "Quando aparecem difração, interferência ou polarização, o modelo ondulatório precisa entrar com mais força. Mesmo assim, para vestibulares, quase toda reflexão, refração, espelhos e lentes começa por um bom desenho de raios.",
    ],
  },
  {
    id: 3,
    icon: ScanLine,
    title: "Fonte, objeto, imagem e observador",
    accent: "from-cyan-600 to-blue-700",
    paragraphs: [
      "Uma das primeiras confusões do aluno é achar que imagem é sempre algo projetado em uma tela. Em Óptica, imagem é o ponto de encontro real ou aparente dos raios que chegam ao olho ou ao detector.",
      "Também é importante separar fonte primária, fonte secundária, objeto e observador. Essa linguagem parece simples, mas é ela que organiza a leitura correta de praticamente toda questão básica de Óptica.",
    ],
    bullets: [
      "Fonte primária emite luz própria, como Sol, lâmpada e chama.",
      "Fonte secundária apenas reflete luz recebida, como uma folha, uma parede ou uma pessoa iluminada.",
      "Imagem real é formada pelo encontro efetivo dos raios luminosos e pode ser projetada em uma tela.",
      "Imagem virtual é formada pelo prolongamento dos raios e não pode ser projetada diretamente em uma tela.",
    ],
  },
  {
    id: 4,
    icon: Compass,
    title: "Os três princípios que sustentam a maioria das questões",
    accent: "from-violet-600 to-purple-700",
    paragraphs: [
      "Grande parte da Óptica Geométrica de vestibular é uma aplicação cuidadosa de três princípios simples. Eles parecem inocentes, mas comandam sombras, espelhos, câmaras escuras, trajetórias reversas e desenhos de raios.",
      "O erro comum é decorar os nomes e não usá-los no desenho da questão. Em Óptica, isso normalmente vira erro evitável.",
    ],
    bullets: [
      "Propagação retilínea: em meio homogêneo e transparente, a luz se propaga em linha reta.",
      "Independência dos raios: raios que se cruzam não se alteram mutuamente no cruzamento.",
      "Reversibilidade: se um raio pode ir de A até B por certo caminho, também pode ir de B até A pelo mesmo caminho em sentido contrário.",
    ],
  },
  {
    id: 5,
    icon: Layers,
    title: "Normal, ângulo e mudança de meio",
    accent: "from-emerald-600 to-teal-700",
    paragraphs: [
      "Em reflexão e refração, os ângulos relevantes são medidos em relação à normal, não em relação à superfície. Essa frase salva pontos demais para ser tratada como detalhe.",
      "A normal é a reta perpendicular à superfície no ponto de incidência. Ângulo de incidência, reflexão e refração são medidos entre o raio e a normal.",
      "Ao entrar em meio de maior índice de refração, o raio se aproxima da normal. Ao entrar em meio de menor índice de refração, o raio se afasta da normal.",
    ],
    notes: [
      {
        title: "Regra de ouro",
        type: "info",
        body: "Antes de escrever qualquer seno, desenhe a normal. Sem ela, o risco de medir o ângulo errado é enorme.",
      },
    ],
  },
];

const formulas: FormulaSummary[] = [
  {
    title: "Relação fundamental da onda",
    formula: String.raw`v = \lambda f`,
    description:
      "Liga velocidade de propagação, comprimento de onda e frequência. Em mudança de meio, a frequência permanece constante; mudam velocidade e comprimento de onda.",
    warning: "Não trate frequência como se mudasse na refração. Esse é um erro clássico.",
  },
  {
    title: "Índice de refração absoluto",
    formula: String.raw`n = \frac{c}{v}`,
    description:
      "Mede o quanto a luz fica mais lenta em um meio em comparação com o vácuo. Quanto maior o índice, menor a velocidade da luz no meio.",
  },
  {
    title: "Lei da reflexão",
    formula: String.raw`i = r`,
    description:
      "O ângulo de incidência é igual ao ângulo de reflexão, ambos medidos pela normal.",
    warning: "Se medir pela superfície, a conta até pode parecer bonita, mas estará olhando para o ângulo errado.",
  },
  {
    title: "Lei de Snell-Descartes",
    formula: String.raw`n_1\sin i = n_2\sin r`,
    description:
      "Relaciona o desvio do raio luminoso aos índices de refração dos meios. É a ponte entre geometria e mudança de velocidade da luz.",
  },
  {
    title: "Câmara escura",
    formula: String.raw`\frac{i}{o} = \frac{p'}{p}`,
    description:
      "Vem diretamente da semelhança de triângulos. A imagem é invertida e seu tamanho depende da razão entre a profundidade da câmara e a distância do objeto.",
  },
  {
    title: "Ângulo limite",
    formula: String.raw`\sin L = \frac{n_2}{n_1}`,
    description:
      "Usado para reflexão total quando a luz tenta passar do meio mais refringente para o menos refringente.",
    warning: "Só faz sentido se n_1 > n_2. Sem isso, não há reflexão total por esse critério.",
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
        <section className="overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-slate-950 via-[#08153d] to-[#2c3274] px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                teoria completa
              </div>

              <h2 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
                Antes de decorar espelhos e lentes, entenda o caminho da luz.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                Esta página organiza a base da Óptica: raios luminosos, fontes, imagens,
                princípios, normal, reflexão, refração, câmara escura e os primeiros cuidados
                que realmente importam nas questões.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: "5", label: "Seções centrais" },
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
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-7 py-6 text-white md:px-9">
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
              <div className="bg-gradient-to-r from-blue-700 to-slate-950 px-7 py-6 text-white md:px-9">
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
                  Em fundamentos de Óptica, o mais importante não é sair colecionando fórmulas. O núcleo da matéria está em interpretar a luz como raio, desenhar corretamente a situação, marcar a normal e entender se a questão está pedindo reflexão, refração, imagem real, imagem virtual ou semelhança de triângulos.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                      <p className="text-[1.01rem] leading-8 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

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
