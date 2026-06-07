import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  HelpCircle,
  MessageCircle,
  Play,
  TrendingUp,
  Waves,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type TopicCard = {
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  status?: "available" | "soon";
  bullets: string[];
};

const topicCards: TopicCard[] = [
  {
    title: "Movimento Harmônico Simples",
    subtitle: "Oscilações, força restauradora, energia e gráficos.",
    icon: "🔄",
    href: "/ondulatoria/topic/mhs",
    status: "available",
    bullets: [
      "Equação horária do MHS",
      "Velocidade e aceleração",
      "Energia no MHS",
      "Massa-mola e pêndulo simples",
    ],
  },
  {
    title: "Ondas: Conceitos Fundamentais",
    subtitle: "Natureza das ondas, classificação e grandezas principais.",
    icon: "🌊",
    href: "/ondulatoria/topic/conceitos",
    status: "available",
    bullets: [
      "Ondas mecânicas e eletromagnéticas",
      "Ondas transversais e longitudinais",
      "Amplitude, período e frequência",
      "Comprimento de onda e velocidade",
    ],
  },
  {
    title: "Equação da Onda",
    subtitle: "Descrição matemática da propagação ondulatória.",
    icon: "📐",
    href: "/ondulatoria/topic/equacao",
    status: "available",
    bullets: [
      "Função de onda progressiva",
      "Equação de onda unidimensional",
      "Velocidade de propagação",
      "Reflexão e refração de ondas",
    ],
  },
  {
    title: "Ondas em Cordas",
    subtitle: "Propagação, tensão, densidade linear e ondas estacionárias.",
    icon: "🎻",
    status: "soon",
    bullets: [
      "Velocidade em cordas tensionadas",
      "Reflexão em extremidades",
      "Ondas estacionárias",
      "Harmônicos em cordas",
    ],
  },
  {
    title: "Fenômenos Ondulatórios",
    subtitle: "Superposição, interferência, difração, batimentos e ressonância.",
    icon: "🌈",
    href: "/ondulatoria/topic/fenomenos",
    status: "available",
    bullets: [
      "Princípio da superposição",
      "Interferência e difração",
      "Batimentos",
      "Ressonância",
    ],
  },
  {
    title: "Acústica",
    subtitle: "Som, intensidade, nível sonoro e percepção auditiva.",
    icon: "🔊",
    href: "/ondulatoria/topic/som",
    status: "available",
    bullets: [
      "Velocidade do som",
      "Intensidade sonora",
      "Nível sonoro em decibéis",
      "Qualidades fisiológicas do som",
    ],
  },
  {
    title: "Tubos Sonoros",
    subtitle: "Ondas estacionárias em tubos abertos e fechados.",
    icon: "🎺",
    status: "soon",
    bullets: [
      "Tubo aberto",
      "Tubo fechado",
      "Frequências harmônicas",
      "Ressonância em colunas de ar",
    ],
  },
  {
    title: "Efeito Doppler",
    subtitle: "Mudança aparente de frequência por movimento relativo.",
    icon: "🚑",
    status: "soon",
    bullets: [
      "Fonte em movimento",
      "Observador em movimento",
      "Aproximação e afastamento",
      "Aplicações em som e luz",
    ],
  },
];

function TopicCardItem({ topic }: { topic: TopicCard }) {
  const isSoon = topic.status === "soon";

  const card = (
    <Card
      className={`h-full p-8 transition-all border-l-4 bg-white ${
        isSoon
          ? "border-slate-300 opacity-80 cursor-not-allowed"
          : "border-cyan-500 cursor-pointer hover:shadow-lg hover:border-cyan-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl leading-none">{topic.icon}</div>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-bold text-slate-900">{topic.title}</h4>
            {isSoon ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                em breve
              </span>
            ) : null}
          </div>

          <p className="mb-4 text-slate-600">{topic.subtitle}</p>

          <ul className="space-y-2 text-sm text-slate-700">
            {topic.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );

  if (topic.href && !isSoon) {
    return <Link href={topic.href}>{card}</Link>;
  }

  return card;
}

export default function OndulatóriaHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <Link
            href="/fisica-ii"
            className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-400">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Oscilações e Ondas</h1>
              <p className="text-xs text-slate-500">Projeto ITA - Do Zero a Aprovação</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/progress">
              <Button variant="outline" size="sm">
                Progresso
              </Button>
            </Link>
            <a
              href="https://youtube.com/@projetoita-z4x?si=dIghaQjMiHZzk4R5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Sobre
              </Button>
            </a>
            <a
              href="https://chat.whatsapp.com/Grwi9hUFvFbA91gShvZGqI"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-blue-600/5 to-transparent" />
        <div className="container relative py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
                  Oscilações que viram <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">ondas</span>
                </h2>
                <p className="text-xl leading-9 text-slate-600">
                  Comece pelo Movimento Harmônico Simples e avance para ondas, cordas, acústica,
                  tubos sonoros e fenômenos ondulatórios com foco em ITA/IME.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/ondulatoria/topic/mhs">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-lg transition-all hover:from-cyan-700 hover:to-blue-600 hover:shadow-xl"
                  >
                    Começar por MHS
                  </Button>
                </Link>
                <Link href="/ondulatoria/simulator">
                  <Button size="lg" variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                    <Play className="mr-2 h-4 w-4" />
                    Simulador Visual
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <Waves className="h-32 w-32 text-cyan-200" />
                <p className="absolute mt-40 font-medium text-slate-400">Oscilações, ondas e som</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <main className="container py-12">
        <div className="mb-16">
          <h3 className="mb-8 text-3xl font-bold text-slate-900">Ferramentas de Aprendizado</h3>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="group">
              <Link href="/ondulatoria/topic/mhs">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <BookOpen className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Guia Completo</h3>
                  <p className="mt-1 text-xs text-slate-600">Comece pelo MHS</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/ondulatoria/simulator">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <Calculator className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Calculadora</h3>
                  <p className="mt-1 text-xs text-slate-600">Calcule variáveis</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/ondulatoria/topic/conceitos">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <BarChart3 className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Fórmulas</h3>
                  <p className="mt-1 text-xs text-slate-600">Relações principais</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/ondulatoria/quiz">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <HelpCircle className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Quiz</h3>
                  <p className="mt-1 text-xs text-slate-600">Teste seu conhecimento</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/ondulatoria/graphs">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <TrendingUp className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Gráficos</h3>
                  <p className="mt-1 text-xs text-slate-600">Visualizações dinâmicas</p>
                </Card>
              </Link>
            </div>
            <div className="group">
              <Link href="/ondulatoria/simulator">
                <Card className="cursor-pointer border-2 border-transparent bg-white p-6 text-center transition-all hover:border-cyan-400 hover:shadow-lg">
                  <Play className="mx-auto mb-3 h-8 w-8 text-cyan-600 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-slate-900">Simulador</h3>
                  <p className="mt-1 text-xs text-slate-600">Animações interativas</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h3 className="text-3xl font-bold text-slate-900">Tópicos Principais</h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                A ordem abaixo separa o que é oscilação local, o que é propagação de onda e o que é aplicação em som. Sim, agora a tela parou de fingir que quatro cards resolvem tudo.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {topicCards.map((topic) => (
              <TopicCardItem key={topic.title} topic={topic} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
