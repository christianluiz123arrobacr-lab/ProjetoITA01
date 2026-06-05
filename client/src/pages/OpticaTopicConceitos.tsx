import { type ElementType, type ReactNode } from "react";
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
  Orbit,
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

type SectionTone = "orange" | "cyan" | "violet" | "emerald" | "blue" | "rose";

type TopicSection = {
  number: string;
  title: string;
  icon: ElementType;
  tone: SectionTone;
  children: ReactNode;
};

type FormulaItem = {
  title: string;
  formula: string;
  explanation: string;
  warning?: string;
};

type ExampleItem = {
  title: string;
  level: string;
  statement: string;
  idea: string;
  steps: string[];
  answer: string;
};

const toneMap: Record<SectionTone, { header: string; icon: string; border: string; soft: string; text: string }> = {
  orange: {
    header: "from-orange-600 via-orange-600 to-red-600",
    icon: "bg-orange-500/20 text-orange-100 ring-orange-300/30",
    border: "border-orange-200",
    soft: "bg-orange-50",
    text: "text-orange-700",
  },
  cyan: {
    header: "from-cyan-600 via-sky-600 to-blue-700",
    icon: "bg-cyan-500/20 text-cyan-100 ring-cyan-300/30",
    border: "border-cyan-200",
    soft: "bg-cyan-50",
    text: "text-cyan-700",
  },
  violet: {
    header: "from-violet-600 via-purple-600 to-fuchsia-700",
    icon: "bg-violet-500/20 text-violet-100 ring-violet-300/30",
    border: "border-violet-200",
    soft: "bg-violet-50",
    text: "text-violet-700",
  },
  emerald: {
    header: "from-emerald-600 via-teal-600 to-cyan-700",
    icon: "bg-emerald-500/20 text-emerald-100 ring-emerald-300/30",
    border: "border-emerald-200",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
  blue: {
    header: "from-blue-700 via-indigo-700 to-slate-900",
    icon: "bg-blue-500/20 text-blue-100 ring-blue-300/30",
    border: "border-blue-200",
    soft: "bg-blue-50",
    text: "text-blue-700",
  },
  rose: {
    header: "from-rose-600 via-red-600 to-orange-600",
    icon: "bg-rose-500/20 text-rose-100 ring-rose-300/30",
    border: "border-rose-200",
    soft: "bg-rose-50",
    text: "text-rose-700",
  },
};

const formulas: FormulaItem[] = [
  {
    title: "Relação fundamental da onda",
    formula: "v = \\lambda f",
    explanation:
      "Relaciona velocidade, comprimento de onda e frequência. Quando a luz muda de meio, a frequência permanece a mesma, mas a velocidade e o comprimento de onda mudam.",
    warning: "A frequência é determinada pela fonte. Ela não muda quando a luz passa de um meio para outro.",
  },
  {
    title: "Índice de refração absoluto",
    formula: "n = \\frac{c}{v}",
    explanation:
      "Mostra quantas vezes a luz é mais rápida no vácuo do que no meio analisado. Quanto maior o índice de refração, menor a velocidade da luz naquele meio.",
  },
  {
    title: "Lei da reflexão",
    formula: "i = r",
    explanation:
      "O ângulo de incidência é igual ao ângulo de reflexão. Os dois devem ser medidos em relação à normal, não em relação à superfície.",
    warning: "Medir o ângulo pela superfície é um erro clássico e muda completamente a interpretação do desenho.",
  },
  {
    title: "Lei de Snell-Descartes",
    formula: "n_1\\sin i = n_2\\sin r",
    explanation:
      "Relaciona os índices de refração dos meios com os ângulos de incidência e refração. É a fórmula central para estudar o desvio da luz ao mudar de meio.",
  },
  {
    title: "Câmara escura",
    formula: "\\frac{i}{o} = \\frac{p'}{p}",
    explanation:
      "Vem diretamente da semelhança de triângulos. A imagem formada é invertida e seu tamanho depende da razão entre a profundidade da câmara e a distância do objeto.",
  },
];

const examples: ExampleItem[] = [
  {
    title: "Câmara escura",
    level: "básico",
    statement:
      "Um objeto de 1,80 m está a 4,0 m do orifício de uma câmara escura. A tela está a 20 cm do orifício. Determine o tamanho da imagem.",
    idea:
      "O raio que sai do topo do objeto passa pelo orifício e chega à parte inferior da tela. O desenho forma dois triângulos semelhantes.",
    steps: [
      "Converta 20 cm para metros: 20 cm = 0,20 m.",
      "Use a relação da câmara escura: i/o = p'/p.",
      "Substitua: i/1,80 = 0,20/4,0.",
      "Calcule: i = 1,80 · 0,05 = 0,09 m.",
    ],
    answer: "A imagem mede 0,09 m, ou seja, 9 cm, e aparece invertida.",
  },
  {
    title: "Refração do ar para o vidro",
    level: "intermediário",
    statement:
      "Um raio passa do ar para um vidro de índice 1,5 com ângulo de incidência de 30°. Considere n_ar = 1. Determine sen r.",
    idea:
      "Como o vidro tem maior índice de refração, a luz fica mais lenta e o raio se aproxima da normal. Antes da conta, já esperamos que r seja menor que 30°.",
    steps: [
      "Pela lei de Snell: n_1 sen i = n_2 sen r.",
      "Substitua os dados: 1 · sen 30° = 1,5 · sen r.",
      "Como sen 30° = 0,5, temos 0,5 = 1,5 sen r.",
      "Logo, sen r = 1/3.",
    ],
    answer: "sen r = 1/3. O resultado faz sentido, pois o raio aproximou-se da normal.",
  },
];

const checklist = [
  "desenhe a normal antes de aplicar qualquer fórmula;",
  "confira se o ângulo foi dado pela normal ou pela superfície;",
  "preveja se o raio deve aproximar-se ou afastar-se da normal;",
  "lembre que a frequência não muda na refração;",
  "diferencie imagem real de imagem virtual pelo caminho dos raios;",
  "use semelhança de triângulos em câmara escura e sombras;",
  "não misture Óptica Geométrica com fenômenos ondulatórios sem necessidade.",
];

function TextBlock({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-[1.05rem] leading-9 text-slate-700">{children}</div>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="max-w-none text-justify">{children}</p>;
}

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="my-5 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-black p-8 text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)] [&_.MathJax]:text-white">
      <MathFormula formula={formula} display={true} />
    </div>
  );
}

function NoteBox({
  title,
  children,
  icon: Icon = Lightbulb,
  tone = "blue",
}: {
  title: string;
  children: ReactNode;
  icon?: ElementType;
  tone?: SectionTone;
}) {
  const styles = toneMap[tone];

  return (
    <div className={`rounded-3xl border ${styles.border} ${styles.soft} p-5`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${styles.text}`} />
        <h4 className="font-black text-slate-950">{title}</h4>
      </div>
      <div className="space-y-3 leading-8 text-slate-700">{children}</div>
    </div>
  );
}

function TopicSectionView({ section }: { section: TopicSection }) {
  const styles = toneMap[section.tone];
  const Icon = section.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className={`bg-gradient-to-r ${styles.header} px-7 py-6 text-white md:px-9`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${styles.icon}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/75">Seção {section.number}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              {section.number}. {section.title}
            </h2>
          </div>
        </div>
      </div>
      <div className="space-y-7 px-7 py-7 md:px-9 md:py-9">{section.children}</div>
    </section>
  );
}

function FormulaCard({ item }: { item: FormulaItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
      <FormulaBlock formula={item.formula} />
      <p className="text-justify leading-8 text-slate-700">{item.explanation}</p>
      {item.warning ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
          {item.warning}
        </div>
      ) : null}
    </article>
  );
}

function ExampleCard({ example, index }: { example: ExampleItem; index: number }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Exemplo {index + 1} · {example.level}
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{example.title}</h3>
        </div>
        <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">resolvido</span>
      </div>
      <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-justify leading-8 text-slate-700">{example.statement}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <NoteBox title="Ideia antes da conta" icon={Brain} tone="orange">
          <p>{example.idea}</p>
        </NoteBox>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h4 className="font-black text-slate-950">Desenvolvimento</h4>
          <ol className="mt-4 space-y-3">
            {example.steps.map((step, stepIndex) => (
              <li key={step} className="flex gap-3 leading-8 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                  {stepIndex + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold leading-8 text-emerald-950">
        {example.answer}
      </div>
    </article>
  );
}

export default function OpticaTopicConceitos() {
  const sections: TopicSection[] = [
    {
      number: "1",
      title: "O que a Óptica Geométrica estuda",
      icon: Eye,
      tone: "orange",
      children: (
        <TextBlock>
          <Paragraph>
            A Óptica Geométrica é o estudo da luz quando podemos representar sua propagação por raios luminosos. Em vez de descrever a luz por frentes de onda, campos elétricos ou oscilações eletromagnéticas, usamos linhas orientadas que indicam o caminho seguido pela luz.
          </Paragraph>
          <Paragraph>
            Esse modelo é simples, mas extremamente poderoso. Ele explica sombras, formação de imagens, espelhos planos, espelhos esféricos, lentes, câmaras escuras, instrumentos ópticos e boa parte das questões clássicas de vestibular.
          </Paragraph>
          <NoteBox title="O limite do modelo" icon={AlertTriangle} tone="rose">
            <p>
              Quando o problema envolve interferência, difração ou polarização, a descrição por raios luminosos deixa de ser suficiente. Nesses casos, a luz precisa ser tratada com mais força como onda eletromagnética.
            </p>
          </NoteBox>
        </TextBlock>
      ),
    },
    {
      number: "2",
      title: "Raios, feixes, fontes e imagens",
      icon: ScanLine,
      tone: "cyan",
      children: (
        <TextBlock>
          <Paragraph>
            Um raio luminoso é uma linha orientada que mostra a direção e o sentido de propagação da luz. Um conjunto de raios forma um feixe. Esse feixe pode ser convergente, divergente ou paralelo, dependendo de como os raios se comportam no espaço.
          </Paragraph>
          <div className="grid gap-5 md:grid-cols-3">
            <NoteBox title="Feixe convergente" icon={Target} tone="cyan"><p>Os raios se aproximam e tendem a encontrar-se em uma região.</p></NoteBox>
            <NoteBox title="Feixe divergente" icon={Zap} tone="violet"><p>Os raios se afastam uns dos outros a partir de uma região ou de uma fonte.</p></NoteBox>
            <NoteBox title="Feixe paralelo" icon={Layers} tone="emerald"><p>Os raios seguem paralelos, como uma idealização comum para luz muito distante.</p></NoteBox>
          </div>
          <Paragraph>
            Também é importante separar fonte, objeto e imagem. Uma fonte primária emite luz própria, enquanto uma fonte secundária apenas reflete luz recebida. A imagem, por sua vez, é a região de encontro real ou aparente dos raios que chegam ao observador.
          </Paragraph>
          <div className="grid gap-5 md:grid-cols-2">
            <NoteBox title="Imagem real" icon={CheckCircle2} tone="emerald"><p>É formada pelo encontro efetivo dos raios luminosos. Pode ser projetada em uma tela.</p></NoteBox>
            <NoteBox title="Imagem virtual" icon={Eye} tone="violet"><p>É formada pelo prolongamento dos raios. Parece existir atrás do espelho ou da lente, mas não pode ser projetada diretamente em uma tela.</p></NoteBox>
          </div>
        </TextBlock>
      ),
    },
    {
      number: "3",
      title: "Os três princípios fundamentais",
      icon: Compass,
      tone: "violet",
      children: (
        <TextBlock>
          <Paragraph>
            A maioria das primeiras questões de Óptica Geométrica nasce de três princípios simples. O problema é que aluno costuma decorar os nomes e esquecer de usá-los no desenho. Aí, naturalmente, a prova cobra exatamente o raciocínio que ele ignorou.
          </Paragraph>
          <div className="grid gap-5 lg:grid-cols-3">
            <NoteBox title="Propagação retilínea" icon={ScanLine} tone="orange"><p>Em meio homogêneo e transparente, a luz se propaga em linha reta. Isso explica sombras, penumbras e a formação de imagem na câmara escura.</p></NoteBox>
            <NoteBox title="Independência dos raios" icon={Orbit} tone="cyan"><p>Raios luminosos que se cruzam não alteram seus caminhos por causa do cruzamento. Cada raio segue sua trajetória como se o outro não estivesse ali.</p></NoteBox>
            <NoteBox title="Reversibilidade" icon={Compass} tone="violet"><p>Se a luz pode ir de A até B por certo caminho, também pode ir de B até A pelo mesmo caminho em sentido contrário.</p></NoteBox>
          </div>
        </TextBlock>
      ),
    },
    {
      number: "4",
      title: "Normal, reflexão e refração",
      icon: Layers,
      tone: "emerald",
      children: (
        <TextBlock>
          <Paragraph>
            Em reflexão e refração, a reta mais importante do desenho quase nunca é a superfície: é a normal. A normal é a reta perpendicular à superfície no ponto em que o raio incide. Todos os ângulos importantes são medidos em relação a ela.
          </Paragraph>
          <NoteBox title="Regra de ouro" icon={ShieldCheck} tone="emerald"><p>Antes de aplicar qualquer fórmula, desenhe a normal. Sem ela, a chance de medir o ângulo errado é enorme, e a conta vira só decoração algébrica.</p></NoteBox>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xl font-black text-slate-950">Reflexão</h3>
              <Paragraph>Na reflexão, a luz retorna ao meio de origem após atingir uma superfície. A lei fundamental é que o ângulo de incidência é igual ao ângulo de reflexão.</Paragraph>
              <FormulaBlock formula="i = r" />
            </div>
            <div>
              <h3 className="mb-3 text-xl font-black text-slate-950">Refração</h3>
              <Paragraph>Na refração, a luz atravessa a interface entre dois meios e muda sua velocidade. Essa mudança pode provocar desvio na direção de propagação.</Paragraph>
              <FormulaBlock formula="n_1\sin i = n_2\sin r" />
            </div>
          </div>
          <NoteBox title="Interpretação física" icon={Lightbulb} tone="blue"><p>Ao entrar em um meio de maior índice de refração, a luz fica mais lenta e o raio aproxima-se da normal. Ao entrar em um meio de menor índice, a luz fica mais rápida e o raio afasta-se da normal.</p></NoteBox>
        </TextBlock>
      ),
    },
    {
      number: "5",
      title: "Fórmulas essenciais",
      icon: BookOpen,
      tone: "blue",
      children: <div className="grid gap-5 lg:grid-cols-2">{formulas.map((item) => <FormulaCard key={item.title} item={item} />)}</div>,
    },
    {
      number: "6",
      title: "Exemplos resolvidos",
      icon: Brain,
      tone: "rose",
      children: <div className="space-y-6">{examples.map((example, index) => <ExampleCard key={example.title} example={example} index={index} />)}</div>,
    },
    {
      number: "7",
      title: "Checklist para questões",
      icon: Target,
      tone: "orange",
      children: (
        <div className="grid gap-4 md:grid-cols-2">
          {checklist.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 text-slate-700">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-orange-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/60 to-yellow-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <Link href="/optica" className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-orange-700">
            <ArrowLeft className="h-5 w-5" />
            Voltar para Óptica
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-yellow-400 text-white shadow-lg"><Eye className="h-6 w-6" /></div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-slate-900">Fundamentos da Óptica</h1>
              <p className="text-xs font-semibold text-slate-500">base para reflexão, refração, espelhos e lentes</p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.30),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.18),transparent_32%)]" />
        <div className="container relative grid gap-10 py-14 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-200"><Sparkles className="h-4 w-4" />Óptica geométrica com foco em prova</div>
            <div className="space-y-5">
              <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">Antes de decorar espelhos e lentes, entenda o caminho da luz.</h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">Esta página organiza a base da Óptica: raios luminosos, fontes, imagens, normal, princípios fundamentais, reflexão, refração e câmara escura. É o alicerce antes de entrar em espelhos, lentes e instrumentos ópticos.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ label: "princípios centrais", value: "3" }, { label: "fórmulas úteis", value: formulas.length }, { label: "seções organizadas", value: sections.length }].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><p className="text-3xl font-black text-white">{item.value}</p><p className="text-sm font-semibold text-slate-400">{item.label}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-orange-500/20 p-3 text-orange-200"><Waves className="h-6 w-6" /></div><div><h3 className="font-black">Mapa da página</h3><p className="text-sm text-slate-400">o que precisa ficar na cabeça</p></div></div>
            <div className="mt-6 space-y-3">
              {["raio luminoso representa direção e sentido da luz", "imagem é encontro real ou aparente dos raios", "ângulos são medidos pela normal", "refração muda velocidade e pode mudar direção", "câmara escura nasce de triângulos semelhantes"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"><span className="h-2 w-2 rounded-full bg-orange-300" /><span className="text-sm font-bold text-slate-200">{item}</span></div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5 [&_.MathJax]:text-white"><MathFormula formula="n_1\sin i = n_2\sin r" display={true} /></div>
          </div>
        </div>
      </section>

      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-6xl space-y-10">
          {sections.map((section) => <TopicSectionView key={section.number} section={section} />)}
          <section className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-7 text-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.28)] md:p-9">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl space-y-3"><h2 className="text-2xl font-black md:text-3xl">Fechamento dos fundamentos</h2><p className="text-justify leading-8 text-slate-300">Óptica começa com uma pergunta simples: por onde a luz passa? Se o aluno desenha o raio, marca a normal e interpreta o tipo de imagem antes da fórmula, metade dos erros desaparece. A outra metade, infelizmente, ainda exige estudar. A física não entrega tudo de graça.</p></div>
              <div className="grid gap-3 text-sm font-bold text-slate-300 md:min-w-[330px]"><div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">Ângulos de reflexão e refração são medidos pela normal.</div><div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">Na refração, a frequência permanece constante.</div></div>
            </div>
          </section>
          <section className="grid gap-5 md:grid-cols-3">
            {[{ href: "/optica/topic/fenomenos", icon: Rainbow, title: "Fenômenos ópticos", text: "refração, reflexão total, dispersão e aplicações." }, { href: "/optica/topic/lentes", icon: Telescope, title: "Espelhos e lentes", text: "formação de imagens, aumento, vergência e visão." }, { href: "/optica/quiz", icon: Brain, title: "Treino rápido", text: "questões para testar se os fundamentos estão firmes." }].map((item) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className="block h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl"><div className="mb-4 inline-flex rounded-2xl bg-orange-100 p-3 text-orange-700"><Icon className="h-6 w-6" /></div><h3 className="text-xl font-black text-slate-950">{item.title}</h3><p className="mt-2 leading-7 text-slate-600">{item.text}</p></Link>;
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
