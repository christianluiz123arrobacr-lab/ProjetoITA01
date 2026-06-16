import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  History,
  Layers3,
  LineChart,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getQuestions } from "@/services/questions.service";
import {
  buildVetEngineResult,
  formatVetPercent,
  formatVetTime,
  prettifyVetText,
  type VetAttempt,
  type VetCollectiveContentStat,
  type VetEngineResult,
  type VetProfile,
  type VetStrategicContent,
  type VetTrainingBlock,
  type VetWeight,
} from "@/lib/vetEngine";

type VetProfileRow = VetProfile & {
  id: string;
  user_id: string;
};

function getRiskMeta(engine: VetEngineResult | null) {
  if (!engine || engine.totalAttempts < 5) {
    return {
      label: "dados insuficientes",
      title: "Dados insuficientes",
      description:
        "Responda mais questões para o VET medir seu risco com mais precisão.",
      className: "border-slate-200 bg-slate-50 text-slate-700",
      iconClassName: "bg-slate-100 text-slate-700",
      icon: Activity,
    };
  }

  const topScore = engine.topPriority?.priorityScore ?? 0;

  if (topScore >= 65) {
    return {
      label: "alto",
      title: "Risco alto",
      description:
        "Existe conteúdo importante, recorrente ou recente em que seu desempenho está perigoso.",
      className: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "bg-red-100 text-red-700",
      icon: AlertTriangle,
    };
  }

  if (topScore >= 40) {
    return {
      label: "moderado",
      title: "Risco moderado",
      description:
        "Você tem pontos frágeis relevantes, mas ainda dá para estabilizar com treino direcionado.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
      icon: Gauge,
    };
  }

  return {
    label: "controlado",
    title: "Risco controlado",
    description:
      "O cenário geral está aceitável, mas ainda exige manutenção e revisão constante.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClassName: "bg-emerald-100 text-emerald-700",
    icon: ShieldCheck,
  };
}

function getBlockMeta(block: VetTrainingBlock) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      className: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "bg-red-100 text-red-700",
      icon: Flame,
    };
  }

  if (block === "consolidacao") {
    return {
      label: "Consolidação",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
      icon: Layers3,
    };
  }

  return {
    label: "Manutenção",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClassName: "bg-emerald-100 text-emerald-700",
    icon: ShieldCheck,
  };
}

function getTrendLabel(score?: number) {
  if (!score && score !== 0) return "sem dados";
  if (score >= 8) return "subindo";
  if (score >= 5) return "estável";
  return "caindo";
}

function getCollectiveGapText(content: VetStrategicContent) {
  if (!content.collective || !content.personal.hasData) {
    return "Sem média coletiva suficiente.";
  }

  const gap = content.collective.collective_accuracy - content.personal.accuracy;

  if (gap > 8) {
    return `${Math.round(gap)} p.p. abaixo da média`;
  }

  if (gap < -8) {
    return `${Math.abs(Math.round(gap))} p.p. acima da média`;
  }

  return "próximo da média";
}

function getStrategicSummary(engine: VetEngineResult | null) {
  if (!engine) {
    return "Configure seu objetivo para liberar a leitura estratégica.";
  }

  const top = engine.topPriority;

  if (!top) {
    return "Ainda não há dados suficientes para gerar uma prioridade. Responda questões e confira os pesos da prova para o VET começar a trabalhar.";
  }

  const historical = top.historical;
  const collective = top.collective;

  const historicalPart = historical
    ? `apareceu em ${historical.yearsAppeared} de ${historical.totalYearsAnalyzed} ano(s) analisados`
    : "ainda não tem histórico suficiente na prova";

  const collectivePart =
    collective && top.personal.hasData
      ? `a média dos outros alunos é ${formatVetPercent(
          collective.collective_accuracy
        )}`
      : "a média coletiva ainda não tem volume suficiente";

  return `Seu foco imediato deve ser ${prettifyVetText(
    top.conteudo
  )}. Esse conteúdo ${historicalPart}, tem peso ${top.weight}, seu aproveitamento é ${
    top.personal.hasData ? formatVetPercent(top.personal.accuracy) : "sem dados"
  }, ${collectivePart} e faltam ${
    engine.profile.months_until_exam
  } mês(es) para sua prova. Por isso ele entrou como ${getBlockMeta(
    top.block
  ).label}.`;
}

function StatCard({
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
  icon: React.ComponentType<{ className?: string }>;
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
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
        </div>
      </div>

      <p className="text-sm opacity-80">{subtitle}</p>
    </Card>
  );
}

function StrategicContentCard({
  content,
  rank,
}: {
  content: VetStrategicContent;
  rank: number;
}) {
  const blockMeta = getBlockMeta(content.block);
  const BlockIcon = blockMeta.icon;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
              #{rank}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${blockMeta.className}`}
            >
              <BlockIcon className="w-3.5 h-3.5" />
              {blockMeta.label}
            </span>

            <span className="inline-flex rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
              score {Math.round(content.priorityScore)}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            {prettifyVetText(content.conteudo)}
          </h3>

          <p className="text-sm text-slate-500">
            {prettifyVetText(content.subject)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {content.historical
              ? formatVetPercent(content.historical.recurrenceRate * 100)
              : "—"}
          </p>
          <p className="text-xs text-slate-500">recorrência</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-7 gap-3 mb-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Peso</p>
          <p className="font-bold text-slate-900">{content.weight}</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Seu acerto</p>
          <p className="font-bold text-slate-900">
            {content.personal.hasData
              ? formatVetPercent(content.personal.accuracy)
              : "sem dados"}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Média geral</p>
          <p className="font-bold text-slate-900">
            {content.collective
              ? formatVetPercent(content.collective.collective_accuracy)
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Últimos anos</p>
          <p className="font-bold text-slate-900">
            {content.historical
              ? `${content.historical.totalQuestions} questões`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Tendência</p>
          <p className="font-bold text-slate-900">
            {getTrendLabel(content.historical?.trendScore)}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Erro recente</p>
          <p className="font-bold text-slate-900">
            {content.personal.recentWrong30Days}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Nunca acertei</p>
          <p className="font-bold text-slate-900">
            {content.personal.neverCorrectQuestions}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Por que o VET escolheu isso?
        </p>

        <ul className="space-y-2">
          {content.explanation.slice(0, 4).map((line, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function VetDiagnosisPage() {
  const { user, loading: authLoading } = useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [attempts, setAttempts] = useState<VetAttempt[]>([]);
  const [weights, setWeights] = useState<VetWeight[]>([]);
  const [collectiveStats, setCollectiveStats] = useState<
    VetCollectiveContentStat[]
  >([]);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_vet_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          setError("Não foi possível carregar o objetivo do VET.");
          setLoading(false);
          return;
        }

        const currentProfile = (profileData as VetProfileRow | null) ?? null;
        setProfile(currentProfile);

        if (!currentProfile) {
          setEngine(null);
          setLoading(false);
          return;
        }

        const [
          attemptsResponse,
          weightsResponse,
          collectiveResponse,
          questionsData,
        ] = await Promise.all([
          supabase
            .from("user_question_attempts")
            .select("*")
            .eq("user_id", user.id)
            .order("answered_at", { ascending: false }),

          supabase
            .from("vet_exam_content_weights")
            .select("*")
            .eq("exam", currentProfile.target_exam),

          supabase
            .from("vet_content_collective_stats")
            .select("*")
            .eq("exam", currentProfile.target_exam),

          getQuestions(),
        ]);

        if (attemptsResponse.error) {
          console.error(attemptsResponse.error);
          setError("Não foi possível carregar suas tentativas.");
          setLoading(false);
          return;
        }

        if (weightsResponse.error) {
          console.error(weightsResponse.error);
          setError("Não foi possível carregar os pesos da prova.");
          setLoading(false);
          return;
        }

        if (collectiveResponse.error) {
          console.error(collectiveResponse.error);
          setError("Não foi possível carregar a média coletiva dos alunos.");
          setLoading(false);
          return;
        }

        const loadedAttempts = (attemptsResponse.data as VetAttempt[]) ?? [];
        const loadedWeights = (weightsResponse.data as VetWeight[]) ?? [];
        const loadedCollective =
          ((collectiveResponse.data as VetCollectiveContentStat[]) ?? []).map(
            (item) => ({
              ...item,
              total_attempts: Number(item.total_attempts ?? 0),
              correct_attempts: Number(item.correct_attempts ?? 0),
              wrong_attempts: Number(item.wrong_attempts ?? 0),
              collective_accuracy: Number(item.collective_accuracy ?? 0),
              avg_time_seconds:
                item.avg_time_seconds === null ||
                item.avg_time_seconds === undefined
                  ? null
                  : Number(item.avg_time_seconds),
            })
          );

        setAttempts(loadedAttempts);
        setWeights(loadedWeights);
        setCollectiveStats(loadedCollective);

        const result = buildVetEngineResult({
          profile: currentProfile,
          attempts: loadedAttempts,
          questions: questionsData,
          weights: loadedWeights,
          collectiveStats: loadedCollective,
          yearsBack: 5,
        });

        setEngine(result);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o diagnóstico.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [user?.id, authLoading]);

  const riskMeta = getRiskMeta(engine);
  const RiskIcon = riskMeta.icon;

  const topPriority = engine?.topPriority ?? null;

  const topHistorical = useMemo(() => {
    return (engine?.historicalMetrics ?? []).slice(0, 5);
  }, [engine]);

  const topStrategic = useMemo(() => {
    return (engine?.strategicContents ?? []).slice(0, 5);
  }, [engine]);

  const collectiveCompared = useMemo(() => {
    return (engine?.strategicContents ?? [])
      .filter((content) => content.collective && content.personal.hasData)
      .slice(0, 5);
  }, [engine]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/vet">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Diagnóstico do VET
            </h1>
            <p className="text-sm text-slate-500">
              Análise por histórico da prova, desempenho pessoal e média dos alunos
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <p className="text-slate-600">Carregando diagnóstico...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700">{error}</p>
          </Card>
        ) : !user ? (
          <Card className="p-8 bg-white">
            <p className="text-slate-700">
              Você precisa estar logado para usar o VET.
            </p>
          </Card>
        ) : !profile ? (
          <Card className="p-8 bg-white border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Configure seu objetivo primeiro
                </h2>
                <p className="text-slate-600 mb-5">
                  O diagnóstico precisa saber sua prova-alvo, tempo restante e foco de estudo.
                  Sem isso, o VET vira um palpiteiro de jaleco.
                </p>

                <Link href="/vet/objetivo">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                    Configurar objetivo
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
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Diagnóstico estratégico
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Seu diagnóstico para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    Agora o VET cruza seu desempenho, o histórico dos últimos anos da prova,
                    os pesos dos conteúdos e a média coletiva dos alunos para apontar
                    o que realmente merece prioridade.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    <Link href="/vet/plano">
                      <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                        Transformar em Plano VET
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                    <Link href="/vet/objetivo">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Ajustar objetivo
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Configuração atual
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Prova-alvo</p>
                      <p className="font-bold">{profile.target_exam}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Tempo restante</p>
                      <p className="font-bold">{profile.months_until_exam} mês(es)</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Foco</p>
                      <p className="font-bold">{prettifyVetText(profile.focus_subject)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Carga diária</p>
                      <p className="font-bold">{profile.hours_per_day}h por dia</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Aproveitamento"
                value={engine ? formatVetPercent(engine.generalAccuracy) : "0%"}
                subtitle={`${engine?.totalCorrect ?? 0} acertos em ${
                  engine?.totalAttempts ?? 0
                } tentativa(s)`}
                icon={BarChart3}
              />

              <StatCard
                title="Ponto crítico"
                value={
                  engine?.weakestSubject
                    ? prettifyVetText(engine.weakestSubject.subject)
                    : "Sem dados"
                }
                subtitle={
                  engine?.weakestSubject
                    ? `${formatVetPercent(engine.weakestSubject.accuracy)} de acerto`
                    : "Responda mais questões"
                }
                icon={TrendingDown}
                className="border-red-200 bg-white text-slate-900"
                iconClassName="bg-red-100 text-red-600"
              />

              <StatCard
                title="Ponto forte"
                value={
                  engine?.strongestSubject
                    ? prettifyVetText(engine.strongestSubject.subject)
                    : "Sem dados"
                }
                subtitle={
                  engine?.strongestSubject
                    ? `${formatVetPercent(engine.strongestSubject.accuracy)} de acerto`
                    : "Responda mais questões"
                }
                icon={TrendingUp}
                className="border-emerald-200 bg-white text-slate-900"
                iconClassName="bg-emerald-100 text-emerald-600"
              />

              <StatCard
                title="Risco atual"
                value={riskMeta.label}
                subtitle={riskMeta.description}
                icon={RiskIcon}
                className={`border ${riskMeta.className}`}
                iconClassName={riskMeta.iconClassName}
              />

              <StatCard
                title="Erros recentes"
                value={`${engine?.recentWrongAttempts ?? 0}`}
                subtitle="tentativa(s) erradas nos últimos 30 dias"
                icon={AlertTriangle}
                className="border-orange-200 bg-white text-slate-900"
                iconClassName="bg-orange-100 text-orange-600"
              />

              <StatCard
                title="Revisão urgente"
                value={`${engine?.neverCorrectQuestionCount ?? 0}`}
                subtitle="questão(ões) que você ainda não acertou nenhuma vez"
                icon={History}
                className="border-violet-200 bg-white text-slate-900"
                iconClassName="bg-violet-100 text-violet-600"
              />
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
              <Card className="p-6 bg-white border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Leitura estratégica
                    </h2>
                    <p className="text-sm text-slate-500">
                      Agora baseada em você, na prova e na média dos alunos.
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-5">
                  {getStrategicSummary(engine)}
                </p>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-2xl font-bold text-red-700">
                      {engine?.attack.length ?? 0}
                    </p>
                    <p className="text-sm font-semibold text-red-700">em ataque</p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-2xl font-bold text-amber-700">
                      {engine?.consolidation.length ?? 0}
                    </p>
                    <p className="text-sm font-semibold text-amber-700">
                      em consolidação
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-2xl font-bold text-emerald-700">
                      {engine?.maintenance.length ?? 0}
                    </p>
                    <p className="text-sm font-semibold text-emerald-700">
                      em manutenção
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock3 className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Próximo passo
                  </h2>
                </div>

                {topPriority ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 mb-1">Comece por</p>
                      <p className="text-xl font-bold text-slate-900">
                        {prettifyVetText(topPriority.conteudo)}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        Score {Math.round(topPriority.priorityScore)} • Peso{" "}
                        {topPriority.weight} •{" "}
                        {topPriority.personal.hasData
                          ? `${formatVetPercent(
                              topPriority.personal.accuracy
                            )} de acerto`
                          : "sem dados ainda"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-bold text-blue-800 mb-2">
                        Comparação coletiva
                      </p>
                      <p className="text-sm text-blue-800">
                        {getCollectiveGapText(topPriority)}
                      </p>
                    </div>

                    <Link href="/vet/plano">
                      <Button className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        Transformar em Plano VET
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-600 mb-4">
                      Ainda não há conteúdo suficiente para definir o próximo passo.
                    </p>

                    <Link href="/banco-de-questoes">
                      <Button className="rounded-2xl">
                        Resolver questões
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <Flame className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Conteúdos críticos
                  </h2>
                </div>

                <div className="space-y-4">
                  {topStrategic.length > 0 ? (
                    topStrategic.map((content, index) => (
                      <StrategicContentCard
                        key={`${content.subject}-${content.conteudo}`}
                        content={content}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Ainda não há dados suficientes para gerar prioridades.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <History className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Histórico da prova
                  </h2>
                </div>

                <p className="text-sm text-slate-500 mb-5">
                  Conteúdos mais relevantes considerando frequência, recorrência,
                  recência, tendência e dificuldade média nos últimos anos.
                </p>

                <div className="space-y-4">
                  {topHistorical.length > 0 ? (
                    topHistorical.map((item, index) => (
                      <div
                        key={`${item.subject}-${item.conteudo}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400">
                              #{index + 1}
                            </p>
                            <p className="font-bold text-slate-900">
                              {prettifyVetText(item.conteudo)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {prettifyVetText(item.subject)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              {Math.round(item.historicalScore)}
                            </p>
                            <p className="text-xs text-slate-500">score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Questões</p>
                            <p className="font-bold text-slate-900">
                              {item.totalQuestions}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Anos</p>
                            <p className="font-bold text-slate-900">
                              {item.yearsAppeared}/{item.totalYearsAnalyzed}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Última vez</p>
                            <p className="font-bold text-slate-900">
                              {item.lastYearAppeared ?? "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Tendência</p>
                            <p className="font-bold text-slate-900">
                              {getTrendLabel(item.trendScore)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Não há questões suficientes da prova-alvo para calcular o histórico.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <section className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Você vs média dos alunos
                  </h2>
                </div>

                <div className="space-y-4">
                  {collectiveCompared.length > 0 ? (
                    collectiveCompared.map((content) => (
                      <div
                        key={`${content.subject}-${content.conteudo}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-bold text-slate-900 mb-1">
                          {prettifyVetText(content.conteudo)}
                        </p>

                        <p className="text-sm text-slate-500 mb-3">
                          {prettifyVetText(content.subject)}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Você</p>
                            <p className="font-bold text-slate-900">
                              {formatVetPercent(content.personal.accuracy)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Média</p>
                            <p className="font-bold text-slate-900">
                              {formatVetPercent(
                                content.collective?.collective_accuracy ?? 0
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mt-3">
                          {getCollectiveGapText(content)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Ainda não há dados coletivos suficientes para comparação.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <LineChart className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Desempenho por disciplina
                  </h2>
                </div>

                <div className="space-y-4">
                  {engine?.subjectStats && engine.subjectStats.length > 0 ? (
                    engine.subjectStats.map((subject) => (
                      <div key={subject.subject}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">
                            {prettifyVetText(subject.subject)}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatVetPercent(subject.accuracy)} • {subject.total} tentativa(s)
                          </span>
                        </div>

                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${subject.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Nenhuma tentativa encontrada ainda.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <Card className="p-6 bg-white border-slate-200">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Como o novo VET chegou nessa análise
                </h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Histórico da prova
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Mede frequência, recorrência, recência e tendência nos últimos anos.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Desempenho pessoal
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Usa seus acertos, erros, tentativas e tempo médio por conteúdo.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Média coletiva
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Compara seu aproveitamento com a média agregada dos alunos.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    Urgência temporal
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Quanto menos tempo até a prova, menor a tolerância para estudo aleatório.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
