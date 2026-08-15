import { useEffect, useMemo, useState } from "react";
import { trpcClient } from "@/lib/trpcClient";
import { Link } from "wouter";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Gauge,
  History,
  Layers3,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WrongTopic = {
  topic: string;
  count: number;
};

type WrongDifficulty = {
  difficulty: string;
  count: number;
};

type VetMockResultPayload = {
  mode?: string;
  targetExam?: string;
  focusSubject?: string;
  totalQuestions: number;
  totalAnswered: number;
  score: number;
  accuracy: number;
  wrongTopics?: WrongTopic[];
  wrongDifficulties?: WrongDifficulty[];
  engineSummary?: {
    totalAttempts?: number;
    generalAccuracy?: number;
    topPriority?: string | null;
    attackCount?: number;
    consolidationCount?: number;
    maintenanceCount?: number;
  };
};

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function prettify(value?: string | null) {
  const raw = String(value ?? "").trim();

  if (!raw) return "—";

  const normalized = normalizeText(raw);

  if (normalized === "fisica") return "Física";
  if (normalized === "matematica") return "Matemática";
  if (normalized === "quimica") return "Química";
  if (normalized === "todas") return "Todas";
  if (normalized === "facil") return "Fácil";
  if (normalized === "medio") return "Médio";
  if (normalized === "dificil") return "Difícil";
  if (normalized === "ataque") return "Ataque";
  if (normalized === "consolidacao") return "Consolidação";
  if (normalized === "manutencao") return "Manutenção";
  if (normalized === "misto") return "Misto VET";

  return raw
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatPercent(value?: number | null) {
  return `${Math.round(Number(value ?? 0))}%`;
}

function getModeMeta(mode?: string) {
  const normalized = normalizeText(mode);

  if (normalized === "ataque") {
    return {
      label: "Ataque",
      description: "Simulado focado em conteúdos urgentes e de maior risco.",
      icon: Flame,
      className: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "bg-red-100 text-red-700",
    };
  }

  if (normalized === "consolidacao") {
    return {
      label: "Consolidação",
      description: "Simulado focado em conteúdos instáveis que precisam firmar.",
      icon: Layers3,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
    };
  }

  if (normalized === "manutencao") {
    return {
      label: "Manutenção",
      description: "Simulado focado em revisão e manutenção de conteúdos controlados.",
      icon: ShieldCheck,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: "Misto VET",
    description: "Simulado equilibrado entre ataque, consolidação e manutenção.",
    icon: BrainCircuit,
    className: "border-slate-200 bg-slate-50 text-slate-700",
    iconClassName: "bg-slate-900 text-white",
  };
}

function getPerformanceMeta(accuracy: number) {
  if (accuracy >= 85) {
    return {
      title: "Excelente",
      label: "controle forte",
      description:
        "Você teve um desempenho alto. O próximo passo é manter ritmo, aumentar dificuldade e evitar cair na armadilha do conforto.",
      icon: Trophy,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "bg-emerald-100 text-emerald-700",
    };
  }

  if (accuracy >= 70) {
    return {
      title: "Bom desempenho",
      label: "rota boa",
      description:
        "Seu resultado foi bom, mas ainda existem pontos que precisam de consolidação para não virarem erro recorrente depois.",
      icon: CheckCircle2,
      className: "border-blue-200 bg-blue-50 text-blue-700",
      iconClassName: "bg-blue-100 text-blue-700",
    };
  }

  if (accuracy >= 50) {
    return {
      title: "Desempenho instável",
      label: "atenção",
      description:
        "Você acertou uma parte razoável, mas o resultado ainda mostra instabilidade. O Plano VET precisa puxar consolidação e ataque nos erros.",
      icon: Gauge,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
    };
  }

  return {
    title: "Risco alto",
    label: "voltar para ataque",
    description:
      "O resultado indica fragilidade forte. O VET deve priorizar os conteúdos errados e reduzir estudo aleatório. Triste, porém útil.",
    icon: AlertTriangle,
    className: "border-red-200 bg-red-50 text-red-700",
    iconClassName: "bg-red-100 text-red-700",
  };
}

function getPlanImpact(result: VetMockResultPayload) {
  const accuracy = Number(result.accuracy ?? 0);
  const wrongTopics = result.wrongTopics ?? [];
  const mode = normalizeText(result.mode);

  if (accuracy >= 85 && wrongTopics.length === 0) {
    return "O resultado sugere que esse recorte está bem controlado. O Plano VET pode manter esse bloco em manutenção e puxar desafios mais difíceis.";
  }

  if (accuracy >= 70) {
    return "O resultado sugere avanço, mas ainda há pontos para consolidar. O Plano VET deve manter revisão curta dos erros e aumentar gradualmente a dificuldade.";
  }

  if (accuracy >= 50) {
    return "O resultado indica instabilidade. O Plano VET deve transformar os conteúdos errados em consolidação ou ataque leve, principalmente se eles aparecem no histórico recente da prova.";
  }

  if (mode === "manutencao") {
    return "Esse resultado em modo manutenção é um alerta: conteúdo que parecia controlado pode precisar voltar para consolidação. O VET não perdoa memória enferrujada.";
  }

  return "O resultado indica que os principais erros devem voltar para ataque. O Plano VET deve priorizar esses tópicos antes de aumentar volume ou dificuldade.";
}

function getNextStep(result: VetMockResultPayload) {
  const accuracy = Number(result.accuracy ?? 0);
  const wrongTopics = result.wrongTopics ?? [];
  const mainWrongTopic = wrongTopics[0]?.topic;

  if (accuracy >= 85) {
    return {
      title: "Aumentar dificuldade",
      description:
        "Faça outro bloco com questões mais difíceis ou parta para um simulado misto. Resultado alto precisa virar consistência, não soberba acadêmica.",
      href: "/vet/simulado",
      button: "Gerar novo simulado",
    };
  }

  if (accuracy >= 70) {
    return {
      title: "Consolidar os erros",
      description: mainWrongTopic
        ? `Revise ${prettify(mainWrongTopic)} e resolva algumas questões direcionadas antes de partir para outro simulado.`
        : "Revise os erros e faça uma rodada curta de consolidação.",
      href: "/vet/questoes",
      button: "Ver questões recomendadas",
    };
  }

  if (accuracy >= 50) {
    return {
      title: "Voltar ao Plano VET",
      description:
        "Antes de repetir o simulado, volte ao Plano VET e treine os conteúdos que apareceram como erro. Repetir prova sem corrigir causa só ilusão estatística.",
      href: "/vet/plano",
      button: "Abrir Plano VET",
    };
  }

  return {
    title: "Entrar em modo ataque",
    description:
      "O resultado pede treino direcionado. Volte ao Plano VET, ataque os principais erros e só depois refaça o simulado.",
    href: "/vet/plano",
    button: "Reorganizar pelo Plano VET",
  };
}

function ResultStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className = "border-slate-200 bg-white",
  iconClassName = "bg-slate-100 text-slate-700",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconClassName}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {value}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-500">{subtitle}</p>
    </Card>
  );
}

function BarRow({
  label,
  value,
  max,
  subtitle,
  danger = false,
}: {
  label: string;
  value: number;
  max: number;
  subtitle?: string;
  danger?: boolean;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>

        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${danger ? "bg-red-500" : "bg-violet-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function VetMockResultPage() {
  const [result, setResult] = useState<VetMockResultPayload | null>(null);
  const [resultError, setResultError] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("sessionId");
    if (!sessionId) {
      setResultError("Nenhum resultado persistido foi informado. Abra o resultado pelo histórico do Simulado VET.");
      return;
    }
    void trpcClient.vet.getMockResult.query({ sessionId }).then((saved) => {
        setResult({
          mode: saved.mode as VetMockResultPayload["mode"],
          targetExam: saved.target_exam,
          focusSubject: saved.focus_subject,
          totalQuestions: saved.total_questions,
          totalAnswered: saved.total_answered,
          score: saved.correct_answers,
          accuracy: Number(saved.accuracy ?? 0),
          wrongTopics: [], wrongDifficulties: [],
          engineSummary: (saved.engine_snapshot as VetMockResultPayload["engineSummary"]) ?? undefined,
        });
      }).catch(error => { console.error("Erro ao carregar resultado persistido:", error); setResult(null); setResultError("O resultado persistido não foi encontrado ou não pertence a este usuário."); });
  }, []);

  const performanceMeta = useMemo(() => {
    return getPerformanceMeta(result?.accuracy ?? 0);
  }, [result?.accuracy]);

  const modeMeta = useMemo(() => {
    return getModeMeta(result?.mode);
  }, [result?.mode]);

  const nextStep = useMemo(() => {
    if (!result) return null;
    return getNextStep(result);
  }, [result]);

  const wrongTopics = result?.wrongTopics ?? [];
  const wrongDifficulties = result?.wrongDifficulties ?? [];

  const maxWrongTopicCount = Math.max(
    1,
    ...wrongTopics.map((item) => item.count)
  );

  const maxWrongDifficultyCount = Math.max(
    1,
    ...wrongDifficulties.map((item) => item.count)
  );

  const PerformanceIcon = performanceMeta.icon;
  const ModeIcon = modeMeta.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/vet/simulado">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Resultado do Simulado VET
            </h1>
            <p className="text-sm text-slate-500">
              Leitura do desempenho e impacto no seu plano
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {!result ? (
          <Card className="p-8 bg-white border-slate-200 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <History className="w-6 h-6 text-slate-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Nenhum resultado encontrado
                </h2>

                <p className="text-slate-600 mb-5">
                  {resultError || "Nenhum resultado persistido foi encontrado para esta sessão."}
                </p>

                <Link href="/vet/simulado">
                  <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                    Fazer Simulado VET
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6 md:p-8 border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white overflow-hidden relative rounded-3xl shadow-lg">
              <div className="absolute top-0 right-0 h-52 w-52 rounded-full bg-white/10 blur-2xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-white/10 blur-2xl -ml-24 -mb-24" />

              <div className="relative grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-bold text-emerald-50 mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Resultado estratégico
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Você acertou {result.score} de {result.totalQuestions}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    Seu aproveitamento foi de {formatPercent(result.accuracy)} no modo{" "}
                    {modeMeta.label}. Agora o resultado precisa voltar para o
                    Plano VET, porque dado que não muda treino é só decoração.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    {nextStep ? (
                      <Link href={nextStep.href}>
                        <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                          {nextStep.button}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : null}

                    <Link href="/vet/simulado">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Refazer simulado
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Resumo
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Prova-alvo
                      </p>
                      <p className="font-bold">
                        {result.targetExam || "Não informado"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Foco
                      </p>
                      <p className="font-bold">
                        {prettify(result.focusSubject)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Modo
                      </p>
                      <p className="font-bold">{modeMeta.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <ResultStatCard
                title="Aproveitamento"
                value={formatPercent(result.accuracy)}
                subtitle={`${result.score} acertos em ${result.totalQuestions} questão(ões)`}
                icon={BarChart3}
                className="border-slate-200 bg-white"
                iconClassName="bg-slate-100 text-slate-700"
              />

              <ResultStatCard
                title="Leitura"
                value={performanceMeta.label}
                subtitle={performanceMeta.title}
                icon={PerformanceIcon}
                className={performanceMeta.className}
                iconClassName={performanceMeta.iconClassName}
              />

              <ResultStatCard
                title="Modo"
                value={modeMeta.label}
                subtitle={modeMeta.description}
                icon={ModeIcon}
                className={modeMeta.className}
                iconClassName={modeMeta.iconClassName}
              />

              <ResultStatCard
                title="Prioridade anterior"
                value={prettify(result.engineSummary?.topPriority || "—")}
                subtitle={`${result.engineSummary?.totalAttempts ?? 0} tentativa(s) já analisadas pelo VET`}
                icon={Target}
                className="border-violet-200 bg-white"
                iconClassName="bg-violet-100 text-violet-700"
              />
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${performanceMeta.iconClassName}`}
                  >
                    <PerformanceIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Leitura do resultado
                    </h2>
                    <p className="text-sm text-slate-500">
                      O que esse simulado diz sobre seu momento.
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-5">
                  {performanceMeta.description}
                </p>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-bold text-emerald-700 mb-2">
                    Impacto no Plano VET
                  </p>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    {getPlanImpact(result)}
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-slate-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Próximo passo
                    </h2>
                    <p className="text-sm text-slate-500">
                      Ação prática depois do resultado.
                    </p>
                  </div>
                </div>

                {nextStep ? (
                  <>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {nextStep.title}
                    </h3>

                    <p className="text-slate-600 leading-relaxed mb-5">
                      {nextStep.description}
                    </p>

                    <Link href={nextStep.href}>
                      <Button className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        {nextStep.button}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : null}
              </Card>
            </section>

            <section className="grid xl:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Erros por conteúdo
                  </h2>
                </div>

                {wrongTopics.length > 0 ? (
                  <div className="space-y-5">
                    {wrongTopics.map((item) => (
                      <BarRow
                        key={item.topic}
                        label={prettify(item.topic)}
                        value={item.count}
                        max={maxWrongTopicCount}
                        subtitle="deve voltar para treino direcionado"
                        danger
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-800">
                          Nenhum erro registrado
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                          Esse recorte foi bem controlado. Agora vem a parte
                          irritante: manter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <Gauge className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Erros por dificuldade
                  </h2>
                </div>

                {wrongDifficulties.length > 0 ? (
                  <div className="space-y-5">
                    {wrongDifficulties.map((item) => (
                      <BarRow
                        key={item.difficulty}
                        label={prettify(item.difficulty)}
                        value={item.count}
                        max={maxWrongDifficultyCount}
                        subtitle="ajuda a calibrar o próximo bloco"
                        danger={normalizeText(item.difficulty) === "facil"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-800">
                          Nenhum erro por dificuldade
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                          O simulado não registrou falhas por nível.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex items-center gap-2 mb-5">
                <BrainCircuit className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Leitura do VET
                </h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Se errou conteúdo crítico
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Ele deve voltar para ataque ou consolidação no Plano VET.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Se errou questão fácil
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    É sinal de base instável, não só falta de treino pesado.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Se foi bem no ataque
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Pode subir dificuldade ou migrar parte do bloco para consolidação.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Se foi mal no misto
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    O problema pode ser integração entre conteúdos, não só um tópico isolado.
                  </p>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-3 gap-4">
              <Link href="/vet/plano">
                <Button className="w-full rounded-2xl py-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Abrir Plano VET
                </Button>
              </Link>

              <Link href="/vet/questoes">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl py-6 bg-white"
                >
                  <ListChecks className="w-4 h-4 mr-2" />
                  Questões recomendadas
                </Button>
              </Link>

              <Link href="/vet/simulado">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl py-6 bg-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refazer simulado
                </Button>
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
