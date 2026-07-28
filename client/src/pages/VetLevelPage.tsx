import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  History,
  Layers3,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getQuestions } from "@/services/questions.service";
import {
  buildVetEngineResult,
  formatVetPercent,
  formatVetTime,
  normalizeVetText,
  prettifyVetText,
  type VetAttempt,
  type VetCollectiveContentStat,
  type VetEngineResult,
  type VetProfile,
  type VetStrategicContent,
  type VetWeight,
} from "@/lib/vetEngine";

type VetProfileRow = VetProfile & {
  id: string;
  user_id: string;
  study_days_per_week?: number | null;
  study_weekdays?: string[] | null;
};

type LevelStatus =
  | "muito_abaixo"
  | "baixo"
  | "proximo"
  | "compativel"
  | "acima";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getExamExpectedScore(targetExam: string) {
  const exam = normalizeVetText(targetExam);

  if (exam === "ita") return 78;
  if (exam === "ime") return 78;
  if (exam === "fuvest") return 72;
  if (exam === "unicamp") return 72;
  if (exam === "efomm") return 70;
  if (exam === "espcex") return 70;
  if (exam === "espcx") return 70;
  if (exam === "cn") return 72;
  if (exam === "colegio naval") return 72;
  if (exam === "en") return 72;
  if (exam === "escola naval") return 72;
  if (exam === "eear") return 65;
  if (exam === "enem") return 65;

  return 70;
}

function getLevelLabel(score: number) {
  if (score < 35) return "inicial";
  if (score < 50) return "básico";
  if (score < 65) return "intermediário";
  if (score < 80) return "competitivo";
  return "avançado";
}

function getTargetStatus(adjustedScore: number, expectedScore: number): LevelStatus {
  const diff = adjustedScore - expectedScore;

  if (diff <= -20) return "muito_abaixo";
  if (diff <= -8) return "baixo";
  if (diff < 4) return "proximo";
  if (diff < 12) return "compativel";
  return "acima";
}

function getStatusMeta(status: LevelStatus) {
  if (status === "muito_abaixo") {
    return {
      label: "Muito abaixo",
      title: "Risco alto",
      description:
        "Você ainda está bem distante da régua esperada para a prova-alvo. O foco deve ser base, cobertura e ataque aos gargalos.",
      icon: AlertTriangle,
      cardClassName: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "bg-red-100 text-red-700",
      buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
    };
  }

  if (status === "baixo") {
    return {
      label: "Baixo",
      title: "Abaixo da régua",
      description:
        "Você já tem algum chão, mas ainda precisa atacar lacunas importantes e subir consistência.",
      icon: TrendingDown,
      cardClassName: "border-orange-200 bg-orange-50 text-orange-700",
      iconClassName: "bg-orange-100 text-orange-700",
      buttonClassName: "bg-orange-600 hover:bg-orange-700 text-white",
    };
  }

  if (status === "proximo") {
    return {
      label: "Próximo",
      title: "Perto da régua",
      description:
        "Você está chegando perto da régua da prova. Agora o jogo é reduzir oscilação e consolidar conteúdos estratégicos.",
      icon: Gauge,
      cardClassName: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    };
  }

  if (status === "compativel") {
    return {
      label: "Compatível",
      title: "Dentro da régua",
      description:
        "Seu nível está compatível com a prova-alvo. O foco agora é constância, simulado e manutenção do desempenho.",
      icon: CheckCircle2,
      cardClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "bg-emerald-100 text-emerald-700",
      buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
    };
  }

  return {
    label: "Acima",
    title: "Acima da régua",
    description:
      "Você está acima da régua estimada. Agora precisa transformar isso em estabilidade, velocidade e resistência de prova.",
    icon: TrendingUp,
    cardClassName: "border-blue-200 bg-blue-50 text-blue-700",
    iconClassName: "bg-blue-100 text-blue-700",
    buttonClassName: "bg-blue-600 hover:bg-blue-700 text-white",
  };
}

function getStrategicReading(params: {
  status: LevelStatus;
  profile: VetProfile;
  adjustedScore: number;
  expectedScore: number;
  weightedCoverage: number;
  historicalCoverage: number;
  collectiveScore: number;
  engine: VetEngineResult | null;
}) {
  const {
    status,
    profile,
    adjustedScore,
    expectedScore,
    weightedCoverage,
    historicalCoverage,
    collectiveScore,
    engine,
  } = params;

  const diff = adjustedScore - expectedScore;
  const topPriority = engine?.topPriority;

  if (status === "muito_abaixo") {
    return `Seu nivelamento está muito abaixo da régua de ${profile.target_exam}. A diferença estimada é de ${Math.abs(
      Math.round(diff)
    )} ponto(s). O problema não é só acertar pouco: a cobertura ponderada está em ${formatVetPercent(
      weightedCoverage
    )}, a cobertura histórica está em ${formatVetPercent(
      historicalCoverage
    )} e sua comparação coletiva ficou em ${formatVetPercent(
      collectiveScore
    )}. O caminho agora é atacar base e conteúdos críticos, começando por ${
      topPriority ? prettifyVetText(topPriority.conteudo) : "seu conteúdo mais urgente"
    }.`;
  }

  if (status === "baixo") {
    return `Você está abaixo da régua de ${profile.target_exam}, mas já existe base para recuperação. O foco deve ser subir cobertura dos conteúdos de maior peso e reduzir erros nos blocos em ataque. ${
      topPriority
        ? `O primeiro gargalo estratégico continua sendo ${prettifyVetText(
            topPriority.conteudo
          )}.`
        : ""
    }`;
  }

  if (status === "proximo") {
    return `Você está próximo da régua esperada para ${profile.target_exam}. Agora o VET deve reduzir oscilação: consolidar conteúdos médios, manter revisão ativa e atacar os poucos gargalos que ainda derrubam sua média. É aquela fase chata em que errar detalhe começa a custar caro, porque aparentemente vestibular gosta de sadismo elegante.`;
  }

  if (status === "compativel") {
    return `Seu nível está compatível com a régua de ${profile.target_exam}. Isso não significa relaxar, porque relaxar é como deixar leite fora da geladeira: parece inofensivo até estragar tudo. O foco agora é simulado, manutenção e aumento gradual de dificuldade.`;
  }

  return `Você está acima da régua estimada para ${profile.target_exam}. O objetivo agora é transformar desempenho em constância: simulados mistos, revisão de erros raros, manutenção dos conteúdos fortes e treino em tempo de prova.`;
}

function buildBankUrl(profile: VetProfile, content?: VetStrategicContent | null) {
  const params = new URLSearchParams();

  params.set("institution", profile.target_exam);

  if (profile.focus_subject && normalizeVetText(profile.focus_subject) !== "todas") {
    params.set("subject", profile.focus_subject);
  }

  if (content?.conteudo) {
    params.set("topics", content.conteudo);
    params.set("block", content.block);
  }

  return `/banco-de-questoes?${params.toString()}`;
}

function LevelStatCard({
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

function MetricBar({
  label,
  value,
  subtitle,
  colorClassName = "bg-emerald-500",
}: {
  label: string;
  value: number;
  subtitle: string;
  colorClassName?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        <p className="text-sm font-bold text-slate-700">
          {formatVetPercent(value)}
        </p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClassName}`}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

function PriorityMiniCard({
  content,
  rank,
  profile,
}: {
  content: VetStrategicContent;
  rank: number;
  profile: VetProfile;
}) {
  const isAttack = content.block === "ataque";
  const isConsolidation = content.block === "consolidacao";

  const badgeClass = isAttack
    ? "bg-red-100 text-red-700 border-red-200"
    : isConsolidation
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  const label = isAttack
    ? "Ataque"
    : isConsolidation
      ? "Consolidação"
      : "Manutenção";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
              #{rank}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}
            >
              {label}
            </span>
          </div>

          <p className="font-bold text-slate-900">
            {prettifyVetText(content.conteudo)}
          </p>
          <p className="text-sm text-slate-500">
            {prettifyVetText(content.subject)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {Math.round(content.priorityScore)}
          </p>
          <p className="text-xs text-slate-500">score</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Acerto</p>
          <p className="font-bold text-slate-900">
            {content.personal.hasData
              ? formatVetPercent(content.personal.accuracy)
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Peso</p>
          <p className="font-bold text-slate-900">{content.weight}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Histórico</p>
          <p className="font-bold text-slate-900">
            {content.historical ? content.historical.totalQuestions : "—"}
          </p>
        </div>
      </div>

      <Link href={buildBankUrl(profile, content)}>
        <Button variant="outline" className="w-full rounded-2xl bg-white">
          Treinar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

export default function VetLevelPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);

  useEffect(() => {
    async function loadLevel() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [vetData, loadedQuestions] = await Promise.all([
          trpcUtils.vet.getLearningData.fetch(),
          getQuestions(),
        ]);

        const currentProfile = (vetData.profile as VetProfileRow | null) ?? null;
        setProfile(currentProfile);

        if (!currentProfile) {
          setEngine(null);
          setLoading(false);
          return;
        }

        const loadedAttempts = (vetData.attempts as unknown as VetAttempt[]) ?? [];
        const loadedWeights = (vetData.weights as unknown as VetWeight[]) ?? [];
        const loadedCollective =
          ((vetData.collectiveStats as unknown as VetCollectiveContentStat[]) ?? []).map(
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

        const result = buildVetEngineResult({
          profile: currentProfile,
          attempts: loadedAttempts,
          questions: loadedQuestions,
          weights: loadedWeights,
          collectiveStats: loadedCollective,
          yearsBack: 5,
        });

        setEngine(result);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o nivelamento.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadLevel();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const weightedCoverage = useMemo(() => {
    const contents = engine?.strategicContents ?? [];

    const totalWeight = contents.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return 0;

    const coveredWeight = contents
      .filter((item) => item.personal.hasData)
      .reduce((sum, item) => sum + item.weight, 0);

    return (coveredWeight / totalWeight) * 100;
  }, [engine]);

  const historicalCoverage = useMemo(() => {
    const historical = engine?.historicalMetrics ?? [];
    if (historical.length === 0) return 0;

    const personalContents = new Set(
      (engine?.strategicContents ?? [])
        .filter((item) => item.personal.hasData)
        .map((item) => `${normalizeVetText(item.subject)}::${normalizeVetText(item.conteudo)}`)
    );

    const coveredHistorical = historical.filter((item) =>
      personalContents.has(
        `${normalizeVetText(item.subject)}::${normalizeVetText(item.conteudo)}`
      )
    );

    return (coveredHistorical.length / historical.length) * 100;
  }, [engine]);

  const collectiveScore = useMemo(() => {
    const comparable = (engine?.strategicContents ?? []).filter(
      (item) => item.personal.hasData && item.collective
    );

    if (comparable.length === 0) return 50;

    const averageGap =
      comparable.reduce((sum, item) => {
        const personal = item.personal.accuracy;
        const collective = item.collective?.collective_accuracy ?? personal;

        return sum + (personal - collective);
      }, 0) / comparable.length;

    return clamp(50 + averageGap);
  }, [engine]);

  const expectedScore = profile ? getExamExpectedScore(profile.target_exam) : 70;

  const adjustedScore = useMemo(() => {
    const accuracy = engine?.generalAccuracy ?? 0;

    return (
      accuracy * 0.45 +
      weightedCoverage * 0.25 +
      historicalCoverage * 0.15 +
      collectiveScore * 0.15
    );
  }, [engine, weightedCoverage, historicalCoverage, collectiveScore]);

  const currentLevel = getLevelLabel(adjustedScore);
  const targetStatus = getTargetStatus(adjustedScore, expectedScore);
  const statusMeta = getStatusMeta(targetStatus);
  const StatusIcon = statusMeta.icon;

  const strategicReading = profile
    ? getStrategicReading({
        status: targetStatus,
        profile,
        adjustedScore,
        expectedScore,
        weightedCoverage,
        historicalCoverage,
        collectiveScore,
        engine,
      })
    : "Configure seu objetivo para gerar o nivelamento.";

  const topPriorityContents = useMemo(() => {
    return (engine?.strategicContents ?? []).slice(0, 5);
  }, [engine]);

  const untrainedImportantContents = useMemo(() => {
    return (engine?.strategicContents ?? [])
      .filter((item) => !item.personal.hasData)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);
  }, [engine]);

  const topPriority = engine?.topPriority ?? null;

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
              Nivelamento do VET
            </h1>
            <p className="text-sm text-slate-500">
              Sua posição atual em relação à prova-alvo
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando nivelamento...
            </div>
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
          <Card className="p-8 bg-white border-emerald-200 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Configure seu objetivo primeiro
                </h2>

                <p className="text-slate-600 mb-5">
                  O nivelamento precisa saber sua prova-alvo, foco e tempo
                  restante. Sem isso, ele vira chute com gráfico, uma invenção
                  humana infelizmente popular.
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
                    <Sparkles className="w-3.5 h-3.5" />
                    Régua estratégica
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Nivelamento para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    O VET compara seu desempenho com a régua estimada da prova,
                    considerando acertos, cobertura dos conteúdos, histórico dos
                    últimos anos e comparação com a média dos alunos.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    {topPriority ? (
                      <Link href={buildBankUrl(profile, topPriority)}>
                        <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                          Treinar prioridade
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : null}

                    <Link href="/vet/plano">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Abrir Plano VET
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Régua atual
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Score ajustado
                      </p>
                      <p className="font-bold">
                        {formatVetPercent(adjustedScore)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Régua da prova
                      </p>
                      <p className="font-bold">{formatVetPercent(expectedScore)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Status
                      </p>
                      <p className="font-bold">{statusMeta.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <LevelStatCard
                title="Status vs prova"
                value={statusMeta.label}
                subtitle={statusMeta.title}
                icon={StatusIcon}
                className={statusMeta.cardClassName}
                iconClassName={statusMeta.iconClassName}
              />

              <LevelStatCard
                title="Nível atual"
                value={prettifyVetText(currentLevel)}
                subtitle="Classificação pelo score ajustado"
                icon={Gauge}
                className="border-slate-200 bg-white"
                iconClassName="bg-slate-100 text-slate-700"
              />

              <LevelStatCard
                title="Score ajustado"
                value={formatVetPercent(adjustedScore)}
                subtitle={`Régua esperada: ${formatVetPercent(expectedScore)}`}
                icon={Target}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <LevelStatCard
                title="Tentativas"
                value={`${engine?.totalAttempts ?? 0}`}
                subtitle={`Tempo médio: ${formatVetTime(engine?.avgTimeSeconds ?? 0)}`}
                icon={Clock3}
                className="border-blue-200 bg-white"
                iconClassName="bg-blue-100 text-blue-700"
              />
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${statusMeta.iconClassName}`}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Leitura estratégica
                    </h2>
                    <p className="text-sm text-slate-500">
                      O que esse nivelamento diz sobre seu momento.
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-5">
                  {strategicReading}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/vet/plano">
                    <Button className={`rounded-2xl ${statusMeta.buttonClassName}`}>
                      Abrir Plano VET
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <Link href="/vet/diagnostico">
                    <Button variant="outline" className="rounded-2xl">
                      Ver diagnóstico completo
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Composição do score
                  </h2>
                </div>

                <div className="space-y-5">
                  <MetricBar
                    label="Aproveitamento"
                    value={engine?.generalAccuracy ?? 0}
                    subtitle="Peso de 45% no nivelamento"
                    colorClassName="bg-emerald-500"
                  />

                  <MetricBar
                    label="Cobertura ponderada"
                    value={weightedCoverage}
                    subtitle="Conteúdos de maior peso já treinados"
                    colorClassName="bg-blue-500"
                  />

                  <MetricBar
                    label="Cobertura histórica"
                    value={historicalCoverage}
                    subtitle="Conteúdos recorrentes dos últimos anos já treinados"
                    colorClassName="bg-violet-500"
                  />

                  <MetricBar
                    label="Comparação coletiva"
                    value={collectiveScore}
                    subtitle="Sua posição contra a média dos alunos"
                    colorClassName="bg-amber-500"
                  />
                </div>
              </Card>
            </section>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <LevelStatCard
                title="Ataque"
                value={`${engine?.attack.length ?? 0}`}
                subtitle="Conteúdos de risco alto"
                icon={Flame}
                className="border-red-200 bg-white"
                iconClassName="bg-red-100 text-red-700"
              />

              <LevelStatCard
                title="Consolidação"
                value={`${engine?.consolidation.length ?? 0}`}
                subtitle="Conteúdos instáveis"
                icon={Layers3}
                className="border-amber-200 bg-white"
                iconClassName="bg-amber-100 text-amber-700"
              />

              <LevelStatCard
                title="Manutenção"
                value={`${engine?.maintenance.length ?? 0}`}
                subtitle="Conteúdos controlados"
                icon={ShieldCheck}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <LevelStatCard
                title="Média coletiva"
                value={formatVetPercent(collectiveScore)}
                subtitle="Comparação com outros alunos"
                icon={Users}
                className="border-slate-200 bg-white"
                iconClassName="bg-slate-100 text-slate-700"
              />
            </section>

            <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <BrainCircuit className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Conteúdos que mais puxam seu nivelamento
                  </h2>
                </div>

                <div className="space-y-4">
                  {topPriorityContents.length > 0 ? (
                    topPriorityContents.map((content, index) => (
                      <PriorityMiniCard
                        key={`${content.subject}-${content.conteudo}`}
                        content={content}
                        rank={index + 1}
                        profile={profile}
                      />
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Ainda não há dados suficientes para gerar prioridade.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Conteúdos importantes sem treino
                  </h2>
                </div>

                {untrainedImportantContents.length > 0 ? (
                  <div className="space-y-4">
                    {untrainedImportantContents.map((content, index) => (
                      <div
                        key={`${content.subject}-${content.conteudo}`}
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-amber-700 mb-1">
                              #{index + 1} sem cobertura
                            </p>
                            <p className="font-bold text-slate-900">
                              {prettifyVetText(content.conteudo)}
                            </p>
                            <p className="text-sm text-slate-600">
                              {prettifyVetText(content.subject)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              {Math.round(content.priorityScore)}
                            </p>
                            <p className="text-xs text-slate-500">score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-800">
                          Boa cobertura inicial
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                          Você já tem alguma tentativa nos conteúdos mais relevantes.
                          Agora o problema vira qualidade, não só cobertura.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex items-center gap-2 mb-5">
                <History className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Como o VET calculou esse nivelamento
                </h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    45% aproveitamento
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Sua taxa geral de acerto nas tentativas analisadas.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    25% cobertura ponderada
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Quanto dos conteúdos importantes você já começou a treinar.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    15% histórico da prova
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Cobertura dos conteúdos recorrentes nos últimos anos.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    15% média coletiva
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Comparação agregada com o desempenho dos outros alunos.
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
