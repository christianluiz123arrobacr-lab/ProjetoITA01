import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Step = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: BookOpen,
    title: "Explicações profundas",
    description:
      "Conteúdos didáticos, organizados e feitos para realmente entender a matéria, não só decorar meia dúzia de fórmula e torcer para o universo colaborar.",
  },
  {
    icon: Calculator,
    title: "Simuladores interativos",
    description:
      "Ferramentas visuais para mexer em parâmetros, ver fenômenos acontecendo e transformar abstração em algo que o aluno consiga enxergar.",
  },
  {
    icon: Target,
    title: "Banco de questões",
    description:
      "Questões organizadas por disciplina, conteúdo, assunto, instituição, ano e dificuldade para treinar de forma mais estratégica.",
  },
  {
    icon: FlaskConical,
    title: "Física, Matemática e Química",
    description:
      "A plataforma está crescendo por frentes, com foco em provas fortes como ITA, IME, militares, FUVEST e ENEM.",
  },
];

const betaItems = [
  "Acesso inicial à plataforma",
  "Explicações em evolução constante",
  "Banco de questões sendo ampliado",
  "Simuladores sendo refinados",
  "Preço inicial menor para os primeiros alunos",
  "Feedback dos alunos ajudando a melhorar o projeto",
];

const steps: Step[] = [
  {
    title: "Crie sua conta",
    description:
      "O aluno cadastra nome completo, telefone, e-mail e senha. Uma coisa normal, veja só, a tecnologia finalmente descobrindo o cadastro.",
  },
  {
    title: "Escolha um plano",
    description:
      "Depois do cadastro, ele escolhe o plano beta disponível e solicita a assinatura.",
  },
  {
    title: "Libere o acesso",
    description:
      "Com a assinatura ativa, o aluno entra na plataforma e acessa os conteúdos protegidos.",
  },
];

const audiences = [
  "ITA",
  "IME",
  "Escola Naval",
  "EFOMM",
  "AFA",
  "EPCAR",
  "FUVEST",
  "ENEM",
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950" />
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
              <Rocket className="h-4 w-4" />
              Plataforma beta de estudos
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Uma plataforma para estudar com mais direção, profundidade e menos
              enrolação.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              O projeto reúne explicações didáticas, simuladores, banco de
              questões e ferramentas de treino para quem está se preparando para
              vestibulares difíceis. A ideia é simples: estudar com método,
              clareza e profundidade, em vez de ficar perdido em PDF jogado,
              aula solta e promessa milagrosa de produtividade. A humanidade já
              sofreu bastante.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                  Criar conta e ver planos
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>

              <Link href="/login">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                  Já tenho conta
                </a>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {audiences.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                  Rumo ao ITA
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Beta em construção
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-300">
              O acesso beta serve para liberar a plataforma para os primeiros
              alunos enquanto o projeto ainda está sendo refinado. Você entra,
              usa, testa, estuda e ajuda a melhorar o produto antes da versão
              mais madura.
            </p>

            <div className="mt-6 grid gap-3">
              {betaItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
                  <span className="text-sm leading-6 text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link href="/planos">
              <a className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
                Ver planos beta
                <ChevronRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
              <LayoutDashboard className="h-4 w-4" />
              O que tem dentro
            </div>

            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              A plataforma junta teoria, prática e visualização.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              O objetivo não é ser só um “site com conteúdo”. Isso já existe aos
              montes, geralmente com a mesma alegria visual de uma planilha
              abandonada. A ideia é organizar o estudo em um ambiente mais
              claro, com teoria, questão, simulador e acompanhamento.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-cyan-900">
              <LockKeyhole className="h-4 w-4" />
              Fluxo de acesso
            </div>

            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              O aluno cria conta primeiro. Depois assina.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Esse fluxo evita o pior cenário possível: alguém pagar antes de
              existir usuário no sistema e depois você ter que virar detetive de
              Pix no WhatsApp. A conta vem primeiro. A assinatura vem depois. A
              sanidade agradece.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="font-black text-slate-950">
                    Conteúdo protegido
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Usuário sem login vai para a página inicial. Usuário logado
                    sem assinatura vai para assinatura pendente. Usuário com
                    assinatura ativa entra na plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>

                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-cyan-950">
                    Quer entrar no beta?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-cyan-900/80">
                    Crie sua conta e escolha um dos planos disponíveis.
                  </p>
                </div>

                <Link href="/cadastro">
                  <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                    Começar
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <GraduationCap className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black">Para vestibular forte</h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                O projeto é pensado para quem quer estudar com profundidade e
                não só passar o olho em resuminho de emergência.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                <Trophy className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black">Treino com direção</h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Filtros, questões e conteúdos ajudam o aluno a estudar pelo que
                realmente precisa melhorar.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <Users className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black">Primeiros usuários</h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Quem entra no beta ajuda a validar o projeto e pega o acesso
                inicial com condições melhores.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                  <Zap className="h-4 w-4" />
                  Comece pelo cadastro
                </div>

                <h2 className="text-3xl font-black tracking-tight">
                  Crie sua conta e escolha seu plano beta.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Depois que a assinatura for liberada, você entra na plataforma
                  e continua os estudos normalmente.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/cadastro">
                  <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                    Criar conta
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>

                <Link href="/planos">
                  <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                    Ver planos
                    <PlayCircle className="h-4 w-4" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
