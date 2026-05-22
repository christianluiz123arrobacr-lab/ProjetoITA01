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
    title: "Explicações aprofundadas",
    description:
      "Conteúdos organizados de forma didática, com foco na compreensão real dos conceitos, no desenvolvimento do raciocínio e na preparação para questões de maior exigência.",
  },
  {
    icon: Calculator,
    title: "Simuladores interativos",
    description:
      "Ferramentas visuais que permitem analisar fenômenos, alterar parâmetros e compreender melhor relações físicas e matemáticas por meio da experimentação guiada.",
  },
  {
    icon: Target,
    title: "Banco de questões",
    description:
      "Questões organizadas por disciplina, conteúdo, assunto, instituição, ano e dificuldade, facilitando um treino mais direcionado e estratégico.",
  },
  {
    icon: FlaskConical,
    title: "Física, Matemática e Química",
    description:
      "A plataforma está sendo desenvolvida por frentes de estudo, com foco em vestibulares exigentes como ITA, IME, escolas militares, FUVEST e ENEM.",
  },
];

const betaItems = [
  "Acesso inicial à plataforma",
  "Conteúdos em expansão contínua",
  "Banco de questões em desenvolvimento",
  "Simuladores em processo de refinamento",
  "Condições especiais para os primeiros alunos",
  "Participação na fase inicial de evolução do projeto",
];

const steps: Step[] = [
  {
    title: "Crie sua conta",
    description:
      "O aluno realiza o cadastro com nome completo, telefone, e-mail e senha. Esses dados permitem vincular corretamente o acesso à assinatura escolhida.",
  },
  {
    title: "Escolha um plano",
    description:
      "Após o cadastro, o aluno seleciona um dos planos disponíveis na fase beta e envia a solicitação de assinatura.",
  },
  {
    title: "Aguarde a liberação",
    description:
      "Com a assinatura aprovada, o acesso à plataforma é liberado para a conta cadastrada, permitindo o uso dos conteúdos e ferramentas disponíveis.",
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
              Uma plataforma para estudar com método, profundidade e direção.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              O Rumo ao ITA reúne explicações didáticas, simuladores, banco de
              questões e ferramentas de acompanhamento para alunos que desejam
              estudar com mais organização e profundidade. A proposta é oferecer
              um ambiente estruturado para preparação em vestibulares exigentes,
              com foco em clareza, prática e evolução constante.
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
                  Beta em desenvolvimento
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-300">
              O acesso beta permite que os primeiros alunos utilizem a
              plataforma enquanto novos conteúdos, simuladores e recursos são
              implementados. Durante essa fase, o projeto será continuamente
              ajustado com base no uso real e nas necessidades dos estudantes.
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
              Estrutura da plataforma
            </div>

            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Teoria, prática e visualização reunidas em um só ambiente.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              A plataforma foi pensada para organizar diferentes etapas do
              estudo: compreensão teórica, resolução de questões, visualização
              de fenômenos e acompanhamento da evolução do aluno. O objetivo é
              tornar o processo de preparação mais claro, eficiente e
              consistente.
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
              Cadastro primeiro. Assinatura depois.
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              O processo foi organizado para garantir que cada assinatura fique
              corretamente vinculada ao usuário cadastrado. Dessa forma, o
              controle de acesso se torna mais seguro, transparente e fácil de
              acompanhar durante a fase beta.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="font-black text-slate-950">
                    Conteúdo protegido
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Usuários sem login acessam apenas a área pública. Usuários
                    com conta, mas sem assinatura ativa, são direcionados para a
                    tela de pendência. Usuários com assinatura ativa acessam a
                    plataforma normalmente.
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
                    Deseja participar da fase beta?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-cyan-900/80">
                    Crie sua conta e escolha um dos planos disponíveis para
                    solicitar o acesso.
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

              <h3 className="text-xl font-black">
                Preparação para provas exigentes
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                O projeto é voltado para alunos que buscam uma preparação mais
                profunda, especialmente para vestibulares de alto nível e provas
                com grande cobrança conceitual.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                <Trophy className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black">Treino direcionado</h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Filtros por disciplina, conteúdo, assunto, instituição, ano e
                dificuldade ajudam o aluno a treinar com mais precisão e foco
                nos pontos que precisam evoluir.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <Users className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-black">Fase beta controlada</h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Os primeiros usuários ajudam a validar a plataforma, identificar
                melhorias e acompanhar a evolução do projeto desde sua fase
                inicial.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                  <Zap className="h-4 w-4" />
                  Início do acesso
                </div>

                <h2 className="text-3xl font-black tracking-tight">
                  Crie sua conta e escolha seu plano beta.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Após a aprovação da assinatura, sua conta será liberada para
                  acessar os conteúdos, ferramentas e recursos disponíveis na
                  plataforma.
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
