import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  History,
  Layers3,
  Loader2,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
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
  type VetTrainingBlock,
  type VetWeight,
} from "@/lib/vetEngine";

type VetProfileRow = VetProfile & {
  id: string;
  user_id: string;
  study_days_per_week?: number | null;
  study_weekdays?: string[] | null;
};

type WeeklyStrategy = {
  attackPercent: number;
  consolidationPercent: number;
  maintenancePercent: number;
  reading: string;
};

function weekdayLabel(day: string) {
  const map: Record<string, string> = {
    segunda: "Segunda",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  return map[day] ?? day;
}

function buildBankUrl(profile: VetProfile, content: VetStrategicContent) {
  const params = new URLSearchParams();

  params.set("institution", profile.target_exam);
  params.set("subject", content.subject);
  params.set("topics", content.conteudo);
  params.set("block", content.block);

  return `/banco-de-questoes?${params.toString()}`;
}

function getBlockMeta(block: VetTrainingBlock) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      description:
        "Prioridade máxima: conteúdos com peso alto, recorrência, baixo desempenho ou urgência.",
      icon: Flame,
      borderClassName: "border-red-200",
      cardClassName: "border-red-200 bg-red-50",
      iconClassName: "bg-red-100 text-red-700",
      titleClassName: "text-red-700",
      buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
      progressClassName: "bg-red-500",
    };
  }

  if (block === "consolidacao") {
    return {
      label: "Consolidação",
      description:
        "Estabilização: conteúdos importantes que ainda oscilam e precisam de repetição inteligente.",
      icon: Layers3,
      borderClassName: "border-amber-200",
      cardClassName: "border-amber-200 bg-amber-50",
      iconClassName: "bg-amber-100 text-amber-700",
      titleClassName: "text-amber-700",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
      progressClassName: "bg-amber-500",
    };
  }

  return {
    label: "Manutenção",
    description:
      "Revisão ativa: conteúdos controlados que não podem desaparecer da rotina.",
    icon: Shield,
    borderClassName: "border-emerald-200",
    cardClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    titleClassName: "text-emerald-700",
    buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
    progressClassName: "bg-emerald-500",
  };
}

function getTrendLabel(score?: number) {
  if (!score && score !== 0) return "sem dados";
  if (score >= 8) return "subindo";
  if (score >= 5) return "estável";
  return "caindo";
}

function getWeeklyStrategy(profile: VetProfile, engine: VetEngineResult | null): WeeklyStrategy {
  const attackCount = engine?.attack.length ?? 0;
  const months = profile.months_until_exam;

  if (months <= 2) {
    return {
      attackPercent: attackCount > 0 ? 70 : 55,
      consolidationPercent: attackCount > 0 ? 20 : 30,
      maintenancePercent: attackCount > 0 ? 10 : 15,
      reading:
        "Falta pouco tempo. O treino precisa ser agressivo, com foco brutal nos gargalos e pouca tolerância para estudo aleatório.",
    };
  }

  if (months <= 4) {
    return {
      attackPercent: attackCount > 0 ? 60 : 45,
      consolidationPercent: attackCount > 0 ? 30 : 40,
      maintenancePercent: 10,
      reading:
        "Ainda dá para corrigir rota, mas o VET precisa priorizar conteúdos críticos sem abandonar consolidação.",
    };
  }

  if (months <= 6) {
    return {
      attackPercent: attackCount > 0 ? 50 : 35,
      consolidationPercent: attackCount > 0 ? 35 : 45,
      maintenancePercent: 15,
      reading:
        "Sua janela permite equilíbrio: atacar fraquezas, consolidar conteúdos médios e manter o que já está sob controle.",
    };
  }

  return {
    attackPercent: attackCount > 0 ? 40 : 30,
    consolidationPercent: 40,
    maintenancePercent: attackCount > 0 ? 20 : 30,
    reading:
      "Com mais tempo até a prova, o treino pode ser mais distribuído, mas ainda guiado por prioridade. Nada de virar turista de conteúdo.",
  };
}

function getContentTimeGuidance(block: VetTrainingBlock, hoursPerWeek: number) {
  if (block === "ataque") {
    if (hoursPerWeek <= 6) return "1 bloco forte por semana";
    if (hoursPerWeek <= 12) return "2 blocos por semana";
    return "2 a 3 blocos por semana";
  }

  if (block === "consolidacao") {
    if (hoursPerWeek <= 6) return "1 bloco curto por semana";
    if (hoursPerWeek <= 12) return "1 a 2 blocos por semana";
    return "2 blocos por semana";
  }

  if (hoursPerWeek <= 6) return "revisão rápida";
  if (hoursPerWeek <= 12) return "1 revisão semanal";
  return "1 a 2 revisões semanais";
}

function StrategyStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  className = "border-slate-200 bg-white",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  className?: string;
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

function TrainingContentCard({
  content,
  profile,
  rank,
  weeklyHours,
}: {
  content: VetStrategicContent;
  profile: VetProfile;
  rank: number;
  weeklyHours: number;
}) {
  const meta = getBlockMeta(content.block);
  const Icon = meta.icon;

  return (
    <div className={`rounded-3xl border p-5 ${meta.cardClassName}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
              #{rank}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.iconClassName}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
              score {Math.round(content.priorityScore)}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            {prettifyVetText(content.conteudo)}
          </h3>

          <p className="text-sm text-slate-500">
            {prettifyVetText(content.subject)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{content.weight}</p>
          <p className="text-xs text-slate-500">peso</p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Seu acerto</p>
          <p className="font-bold text-slate-900">
            {content.personal.hasData
              ? formatVetPercent(content.personal.accuracy)
              : "sem dados"}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Erros</p>
          <p className="font-bold text-slate-900">{content.personal.wrong}</p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Média geral</p>
          <p className="font-bold text-slate-900">
            {content.collective
              ? formatVetPercent(content.collective.collective_accuracy)
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Histórico</p>
          <p className="font-bold text-slate-900">
            {content.historical
              ? `${content.historical.totalQuestions} questões`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Tendência</p>
          <p className="font-bold text-slate-900">
            {getTrendLabel(content.historical?.trendScore)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Como treinar
        </p>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Frequência</p>
            <p className="text-sm font-bold text-slate-900">
              {getContentTimeGuidance(content.block, weeklyHours)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Tipo</p>
            <p className="text-sm font-bold text-slate-900">
              {content.block === "ataque"
                ? "questões médias/difíceis"
                : content.block === "consolidacao"
                  ? "questões fáceis/médias"
                  : "revisão rápida"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Tempo médio</p>
            <p className="text-sm font-bold text-slate-900">
              {formatVetTime(content.personal.avgTimeSeconds)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Por que está aqui?
        </p>

        <ul className="space-y-2">
          {content.explanation.slice(0, 3).map((line, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link href={buildBankUrl(profile, content)}>
        <Button className={`w-full rounded-2xl ${meta.buttonClassName}`}>
          Treinar no banco
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

function BlockSection({
  title,
  block,
  items,
  profile,
  weeklyHours,
  emptyText,
}: {
  title: string;
  block: VetTrainingBlock;
  items: VetStrategicContent[];
  profile: VetProfile;
  weeklyHours: number;
  emptyText: string;
}) {
  const meta = getBlockMeta(block);
  const Icon = meta.icon;

  return (
    <Card className={`p-6 bg-white rounded-3xl ${meta.borderClassName}`}>
      <div className="flex items-start gap-3 mb-5">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.iconClassName}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{meta.description}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((content, index) => (
            <TrainingContentCard
              key={`${content.subject}-${content.conteudo}`}
              content={content}
              profile={profile}
              rank={index + 1}
              weeklyHours={weeklyHours}
            />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">{emptyText}</p>
      )}
    </Card>
  );
}

export default function VetTrainingPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);

  useEffect(() => {
    async function loadTraining() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const analysis = await trpcUtils.vet.getAnalysis.fetch();
        const currentProfile = (analysis?.profile as VetProfileRow | null) ?? null;
        setProfile(currentProfile);
        if (!currentProfile || !analysis) {
          setEngine(null);
          return;
        }
        setEngine(analysis as VetEngineResult);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o treino recomendado.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadTraining();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const studyDaysLabels = useMemo(() => {
    return (profile?.study_weekdays ?? []).map(weekdayLabel);
  }, [profile]);

  const weeklyLoad = useMemo(() => {
    if (!profile) {
      return {
        studyDays: 0,
        hoursPerDay: 0,
        totalWeeklyHours: 0,
      };
    }

    const daysFromList = profile.study_weekdays?.length ?? 0;
    const studyDays = profile.study_days_per_week ?? daysFromList ?? 0;
    const hoursPerDay = Number(profile.hours_per_day ?? 0);
    const totalWeeklyHours = studyDays * hoursPerDay;

    return {
      studyDays,
      hoursPerDay,
      totalWeeklyHours,
    };
  }, [profile]);

  const weeklyStrategy = useMemo(() => {
    if (!profile) {
      return {
        attackPercent: 60,
        consolidationPercent: 30,
        maintenancePercent: 10,
        reading: "Configure seu objetivo para liberar a estratégia semanal.",
      };
    }

    return getWeeklyStrategy(profile, engine);
  }, [profile, engine]);

  const weeklyHoursSplit = useMemo(() => {
    const total = weeklyLoad.totalWeeklyHours;

    return {
      attackHours: (total * weeklyStrategy.attackPercent) / 100,
      consolidationHours: (total * weeklyStrategy.consolidationPercent) / 100,
      maintenanceHours: (total * weeklyStrategy.maintenancePercent) / 100,
    };
  }, [weeklyLoad.totalWeeklyHours, weeklyStrategy]);

  const attackItems = useMemo(() => {
    return (engine?.attack ?? []).slice(0, 5);
  }, [engine]);

  const consolidationItems = useMemo(() => {
    return (engine?.consolidation ?? []).slice(0, 5);
  }, [engine]);

  const maintenanceItems = useMemo(() => {
    return (engine?.maintenance ?? []).slice(0, 5);
  }, [engine]);

  const topPriority = engine?.topPriority ?? null;

  const selectedDaysText =
    studyDaysLabels.length > 0
      ? studyDaysLabels.join(", ")
      : "Nenhum dia específico marcado.";

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
              Treino recomendado
            </h1>
            <p className="text-sm text-slate-500">
              Transformando o diagnóstico em rotina prática
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando treino recomendado...
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
                  Antes de gerar treino recomendado, o VET precisa saber prova,
                  tempo restante, foco e carga. Sem isso, ele vira um personal
                  trainer de conteúdo sem saber se você vai correr 100m ou uma
                  maratona.
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
                    Rotina estratégica
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Treino recomendado para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    Esta página transforma o score do VET em distribuição de
                    tempo, blocos semanais e conteúdos de execução. Agora ela usa
                    histórico da prova, seu desempenho, média coletiva e urgência
                    temporal. Sim, finalmente parou de fingir que todo conteúdo
                    tem a mesma importância.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    {topPriority ? (
                      <Link href={buildBankUrl(profile, topPriority)}>
                        <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                          Começar por {prettifyVetText(topPriority.conteudo)}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : null}

                    <Link href="/vet/plano">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Ver Plano VET
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Carga atual
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Horas por dia
                      </p>
                      <p className="font-bold">{weeklyLoad.hoursPerDay}h</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Dias por semana
                      </p>
                      <p className="font-bold">{weeklyLoad.studyDays}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Carga semanal
                      </p>
                      <p className="font-bold">
                        {weeklyLoad.totalWeeklyHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StrategyStatCard
                title="Ataque"
                value={`${weeklyStrategy.attackPercent}%`}
                subtitle={`${weeklyHoursSplit.attackHours.toFixed(
                  1
                )}h por semana`}
                icon={Flame}
                className="border-red-200 bg-white"
                iconClassName="bg-red-100 text-red-700"
              />

              <StrategyStatCard
                title="Consolidação"
                value={`${weeklyStrategy.consolidationPercent}%`}
                subtitle={`${weeklyHoursSplit.consolidationHours.toFixed(
                  1
                )}h por semana`}
                icon={Layers3}
                className="border-amber-200 bg-white"
                iconClassName="bg-amber-100 text-amber-700"
              />

              <StrategyStatCard
                title="Manutenção"
                value={`${weeklyStrategy.maintenancePercent}%`}
                subtitle={`${weeklyHoursSplit.maintenanceHours.toFixed(
                  1
                )}h por semana`}
                icon={ShieldCheck}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <StrategyStatCard
                title="Aproveitamento"
                value={engine ? formatVetPercent(engine.generalAccuracy) : "0%"}
                subtitle={`${engine?.totalAttempts ?? 0} tentativa(s) analisadas`}
                icon={BarChart3}
                className="border-slate-200 bg-white"
                iconClassName="bg-slate-100 text-slate-700"
              />
            </section>

            <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Leitura do treino
                    </h2>
                    <p className="text-sm text-slate-500">
                      Como distribuir seu esforço sem estudar igual barata tonta.
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-5">
                  {weeklyStrategy.reading}
                </p>

                {topPriority ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-bold text-emerald-700 mb-2">
                      Primeira ação
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {prettifyVetText(topPriority.conteudo)}
                    </h3>

                    <p className="text-sm text-slate-700 mb-4">
                      Comece por esse conteúdo porque ele lidera o score do VET,
                      com prioridade {Math.round(topPriority.priorityScore)}.
                    </p>

                    <Link href={buildBankUrl(profile, topPriority)}>
                      <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        Treinar agora
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Dias disponíveis
                  </h2>
                </div>

                <p className="text-sm text-slate-500 mb-4">
                  {selectedDaysText}
                </p>

                <div className="flex flex-wrap gap-2">
                  {studyDaysLabels.length > 0 ? (
                    studyDaysLabels.map((day) => (
                      <span
                        key={day}
                        className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm"
                      >
                        {day}
                      </span>
                    ))
                  ) : (
                    <span className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-sm">
                      Não configurado
                    </span>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500 mb-1">
                    Carga semanal estimada
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {weeklyLoad.totalWeeklyHours.toFixed(1)}h
                  </p>
                </div>
              </Card>
            </section>

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex items-center gap-2 mb-5">
                <Clock3 className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Divisão semanal sugerida
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-red-700">Ataque</p>
                    <p className="text-2xl font-bold text-red-700">
                      {weeklyStrategy.attackPercent}%
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-red-100 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${weeklyStrategy.attackPercent}%` }}
                    />
                  </div>

                  <p className="text-sm text-slate-700">
                    {weeklyHoursSplit.attackHours.toFixed(1)}h por semana
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-amber-700">Consolidação</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {weeklyStrategy.consolidationPercent}%
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-amber-100 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${weeklyStrategy.consolidationPercent}%` }}
                    />
                  </div>

                  <p className="text-sm text-slate-700">
                    {weeklyHoursSplit.consolidationHours.toFixed(1)}h por semana
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-emerald-700">Manutenção</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {weeklyStrategy.maintenancePercent}%
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-emerald-100 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${weeklyStrategy.maintenancePercent}%` }}
                    />
                  </div>

                  <p className="text-sm text-slate-700">
                    {weeklyHoursSplit.maintenanceHours.toFixed(1)}h por semana
                  </p>
                </div>
              </div>
            </Card>

            <section className="grid xl:grid-cols-3 gap-5">
              <BlockSection
                title="Ataque imediato"
                block="ataque"
                items={attackItems}
                profile={profile}
                weeklyHours={weeklyLoad.totalWeeklyHours}
                emptyText="Nenhum conteúdo entrou em ataque imediato agora."
              />

              <BlockSection
                title="Consolidação"
                block="consolidacao"
                items={consolidationItems}
                profile={profile}
                weeklyHours={weeklyLoad.totalWeeklyHours}
                emptyText="Nenhum conteúdo entrou em consolidação agora."
              />

              <BlockSection
                title="Manutenção"
                block="manutencao"
                items={maintenanceItems}
                profile={profile}
                weeklyHours={weeklyLoad.totalWeeklyHours}
                emptyText="Nenhum conteúdo entrou em manutenção agora."
              />
            </section>

            <section className="grid xl:grid-cols-3 gap-5">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Histórico da prova
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  Conteúdos recorrentes e recentes ganham prioridade na rotina,
                  porque prova antiga também deixa rastro. Às vezes o examinador
                  é previsível, só faz pose de gênio.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Média coletiva
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  Quando você está abaixo da média dos alunos em um conteúdo,
                  o VET aumenta a urgência. O algoritmo não julga, só expõe.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Execução prática
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  O treino recomendado não é só lista de conteúdo: ele sugere
                  peso semanal, tipo de questão e ordem de ataque.
                </p>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
