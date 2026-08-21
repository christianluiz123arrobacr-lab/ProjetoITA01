import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  History,
  Layers3,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { mapQuestao } from "@/services/questions.service";
import type { Question } from "@/types/question";
import { getVetPlanDifficultyBonus } from "@shared/difficulty";
import {
  buildVetEngineResult,
  formatVetPercent,
  prettifyVetText,
  getQuestionTopicsForVet,
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

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesTargetExam(question: Question, targetExam: string) {
  const target = normalizeText(targetExam);
  return (
    normalizeText(question.institution) === target ||
    normalizeText(question.exam) === target
  );
}

function matchesContent(question: Question, content: string) {
  const topics = getQuestionTopicsForVet(question).map(normalizeText);
  return topics.includes(normalizeText(content));
}

function buildBankUrl(profile: VetProfile, content: VetStrategicContent) {
  const params = new URLSearchParams();

  params.set("institution", profile.target_exam);
  params.set("subject", content.subject);
  params.set("topics", encodeURIComponent(content.conteudo));
  params.set("block", content.block);

  return `/banco-de-questoes?${params.toString()}`;
}

function getBlockMeta(block: VetTrainingBlock) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      description:
        "Conteúdos que exigem prioridade máxima: peso alto, baixo desempenho, recorrência ou urgência.",
      icon: Flame,
      className: "border-red-200 bg-red-50",
      iconClassName: "bg-red-100 text-red-700",
      textClassName: "text-red-700",
      buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
    };
  }

  if (block === "consolidacao") {
    return {
      label: "Consolidação",
      description:
        "Conteúdos que você já começou, mas ainda precisam de repetição e estabilidade.",
      icon: Layers3,
      className: "border-amber-200 bg-amber-50",
      iconClassName: "bg-amber-100 text-amber-700",
      textClassName: "text-amber-700",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    };
  }

  return {
    label: "Manutenção",
    description:
      "Conteúdos controlados, mas que devem aparecer na rotina para não enferrujar.",
    icon: ShieldCheck,
    className: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    textClassName: "text-emerald-700",
    buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
}

function getTrendLabel(score?: number) {
  if (!score && score !== 0) return "sem dados";
  if (score >= 8) return "subindo";
  if (score >= 5) return "estável";
  return "caindo";
}

function getCollectiveText(content: VetStrategicContent) {
  if (!content.collective || !content.personal.hasData) {
    return "Sem média coletiva suficiente.";
  }

  const gap = content.collective.collective_accuracy - content.personal.accuracy;

  if (gap > 8) {
    return `${Math.round(gap)} p.p. abaixo da média dos alunos.`;
  }

  if (gap < -8) {
    return `${Math.abs(Math.round(gap))} p.p. acima da média dos alunos.`;
  }

  return "Próximo da média dos alunos.";
}

function PlanStatCard({
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

function ContentPlanCard({
  content,
  profile,
  rank,
}: {
  content: VetStrategicContent;
  profile: VetProfile;
  rank: number;
}) {
  const meta = getBlockMeta(content.block);
  const Icon = meta.icon;

  return (
    <Card className={`p-5 rounded-3xl border shadow-sm ${meta.className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
              #{rank}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.iconClassName}`}
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

      <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3 mb-4">
        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Seu acerto</p>
          <p className="font-bold text-slate-900">
            {content.personal.hasData
              ? formatVetPercent(content.personal.accuracy)
              : "sem dados"}
          </p>
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

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Erros recentes</p>
          <p className="font-bold text-slate-900">
            {content.personal.recentWrong30Days}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-white p-3">
          <p className="text-xs text-slate-500 mb-1">Nunca acertei</p>
          <p className="font-bold text-slate-900">
            {content.personal.neverCorrectQuestions}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Por que entrou no plano?
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

      <div className="rounded-2xl border border-white bg-white/80 p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Comparação coletiva
        </p>
        <p className="text-sm text-slate-700">{getCollectiveText(content)}</p>
      </div>

      <Link href={buildBankUrl(profile, content)}>
        <Button className={`w-full rounded-2xl ${meta.buttonClassName}`}>
          Treinar esse conteúdo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </Card>
  );
}

function RecommendedQuestionCard({
  question,
  matchedContent,
}: {
  question: Question;
  matchedContent: VetStrategicContent;
}) {
  const topics = getQuestionTopicsForVet(question);

  return (
    <Card className="p-5 bg-white border-slate-200 rounded-3xl shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
          {question.institution || question.exam}
        </span>

        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          {question.year}
        </span>

        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {prettifyVetText(question.subject)}
        </span>

        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          {question.difficulty}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-2">
        {question.codigo || `Questão ${question.id}`}
      </h3>

      <p className="text-sm text-slate-600 line-clamp-3 mb-4">
        {question.statement}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {topics.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
        <p className="text-xs font-bold text-violet-700 mb-1">
          Motivo da recomendação
        </p>
        <p className="text-sm text-violet-800">
          Relacionada a {prettifyVetText(matchedContent.conteudo)}, que está no
          bloco {getBlockMeta(matchedContent.block).label}.
        </p>
      </div>
    </Card>
  );
}

export default function VetPlanPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    async function loadPlan() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [analysis, recommended] = await Promise.all([
          trpcUtils.vet.getAnalysis.fetch(),
          trpcUtils.vet.getRecommendedQuestions.fetch({ block: "ataque", limit: 20 }),
        ]);
        const currentProfile = (analysis?.profile as VetProfileRow | null) ?? null;
        setProfile(currentProfile);
        if (!currentProfile || !analysis) {
          setEngine(null);
          return;
        }
        setQuestions((recommended as unknown as any[]).map(mapQuestao));
        setEngine(analysis as VetEngineResult);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o Plano VET.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadPlan();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const topPriority = engine?.topPriority ?? null;

  const attackItems = useMemo(() => {
    return (engine?.attack ?? []).slice(0, 4);
  }, [engine]);

  const consolidationItems = useMemo(() => {
    return (engine?.consolidation ?? []).slice(0, 4);
  }, [engine]);

  const maintenanceItems = useMemo(() => {
    return (engine?.maintenance ?? []).slice(0, 4);
  }, [engine]);

  const recommendedQuestions = useMemo(() => {
    if (!engine || !profile) return [];

    const strategic = engine.strategicContents.slice(0, 8);

    const result: Array<{
      question: Question;
      matchedContent: VetStrategicContent;
      score: number;
    }> = [];

    for (const question of questions) {
      if (!matchesTargetExam(question, profile.target_exam)) continue;

      const matchedContent = strategic.find((content) =>
        matchesContent(question, content.conteudo)
      );

      if (!matchedContent) continue;

      const recencyBonus = question.year ? Math.min(10, Math.max(0, question.year - 2015)) : 0;

      const difficultyBonus = getVetPlanDifficultyBonus(question.difficulty);

      result.push({
        question,
        matchedContent,
        score: matchedContent.priorityScore + recencyBonus + difficultyBonus,
      });
    }

    return result
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [engine, profile, questions]);

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
            <h1 className="text-2xl font-bold text-slate-900">Plano VET</h1>
            <p className="text-sm text-slate-500">
              Prioridades, blocos de treino e questões recomendadas
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando Plano VET...
            </div>
          </Card>
        ) : error ? (
          <Card className="p-8 bg-red-50 border-red-200">
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
                  O Plano VET precisa saber sua prova-alvo, tempo restante e
                  disciplina foco. Sem isso, ele só vira uma lista bonita com
                  zero cérebro, o que já tem demais por aí.
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
                    Plano estratégico
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Plano VET para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    Este plano usa o novo motor do VET: histórico dos últimos
                    anos da prova, seu desempenho, peso dos conteúdos e média
                    coletiva dos alunos para montar uma ordem de execução.
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

                    <Link href="/vet/diagnostico">
                      <Button
                        variant="outline"
                        className="rounded-2xl px-6 py-5 font-bold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Ver diagnóstico
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/12 border border-white/20 p-5 backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-wide text-emerald-100 font-bold mb-4">
                    Configuração
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Prova-alvo
                      </p>
                      <p className="font-bold">{profile.target_exam}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Tempo restante
                      </p>
                      <p className="font-bold">
                        {profile.months_until_exam} mês(es)
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Foco</p>
                      <p className="font-bold">
                        {prettifyVetText(profile.focus_subject)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <PlanStatCard
                title="Aproveitamento"
                value={engine ? formatVetPercent(engine.generalAccuracy) : "0%"}
                subtitle={`${engine?.totalCorrect ?? 0} acertos em ${
                  engine?.totalAttempts ?? 0
                } tentativa(s)`}
                icon={BarChart3}
              />

              <PlanStatCard
                title="Em ataque"
                value={`${engine?.attack.length ?? 0}`}
                subtitle="Conteúdos de maior urgência"
                icon={Flame}
                className="border-red-200 bg-white"
                iconClassName="bg-red-100 text-red-700"
              />

              <PlanStatCard
                title="Em consolidação"
                value={`${engine?.consolidation.length ?? 0}`}
                subtitle="Conteúdos instáveis"
                icon={Layers3}
                className="border-amber-200 bg-white"
                iconClassName="bg-amber-100 text-amber-700"
              />

              <PlanStatCard
                title="Em manutenção"
                value={`${engine?.maintenance.length ?? 0}`}
                subtitle="Conteúdos mais controlados"
                icon={ShieldCheck}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />
            </section>

            {topPriority ? (
              <Card className="p-6 bg-white border-emerald-200 rounded-3xl">
                <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6 items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-emerald-700" />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          Próxima ação recomendada
                        </h2>
                        <p className="text-sm text-slate-500">
                          O primeiro conteúdo do plano não foi escolhido por
                          simpatia, infelizmente.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-slate-900 mb-3">
                      {prettifyVetText(topPriority.conteudo)}
                    </h3>

                    <p className="text-slate-600 leading-relaxed mb-5">
                      Esse conteúdo lidera o Plano VET porque combina score{" "}
                      {Math.round(topPriority.priorityScore)}, peso{" "}
                      {topPriority.weight}, histórico da prova, seu desempenho e
                      comparação com a média coletiva.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Link href={buildBankUrl(profile, topPriority)}>
                        <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                          Treinar agora
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>

                      <Link href="/vet/diagnostico">
                        <Button variant="outline" className="rounded-2xl">
                          Ver explicação completa
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold text-slate-900 mb-4">
                      Resumo do motivo
                    </p>

                    <ul className="space-y-3">
                      {topPriority.explanation.slice(0, 4).map((line, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ) : null}

            <section className="grid xl:grid-cols-3 gap-5">
              <Card className="p-5 bg-white border-red-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Ataque</h2>
                    <p className="text-sm text-slate-500">
                      Prioridade máxima
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {attackItems.length > 0 ? (
                    attackItems.map((content, index) => (
                      <ContentPlanCard
                        key={`${content.subject}-${content.conteudo}`}
                        content={content}
                        profile={profile}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhum conteúdo em ataque agora.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-white border-amber-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Layers3 className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Consolidação
                    </h2>
                    <p className="text-sm text-slate-500">
                      Estabilizar desempenho
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {consolidationItems.length > 0 ? (
                    consolidationItems.map((content, index) => (
                      <ContentPlanCard
                        key={`${content.subject}-${content.conteudo}`}
                        content={content}
                        profile={profile}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhum conteúdo em consolidação agora.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-white border-emerald-200 rounded-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Manutenção
                    </h2>
                    <p className="text-sm text-slate-500">
                      Não deixar enferrujar
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {maintenanceItems.length > 0 ? (
                    maintenanceItems.map((content, index) => (
                      <ContentPlanCard
                        key={`${content.subject}-${content.conteudo}`}
                        content={content}
                        profile={profile}
                        rank={index + 1}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhum conteúdo em manutenção agora.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <ListChecks className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Questões recomendadas
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {recommendedQuestions.length > 0 ? (
                    recommendedQuestions.map((item) => (
                      <RecommendedQuestionCard
                        key={item.question.id}
                        question={item.question}
                        matchedContent={item.matchedContent}
                      />
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Nenhuma questão recomendada encontrada para esse recorte.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <History className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Como o plano foi montado
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      Histórico da prova
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Conteúdos recorrentes, recentes ou em tendência de alta
                      ganham peso no plano.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      Seu desempenho
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Acertos, erros, volume de tentativas e ausência de treino
                      entram no score.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      Média coletiva
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      O VET compara seu aproveitamento com a média agregada dos
                      outros alunos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      Urgência temporal
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Quanto menos tempo até a prova, mais o plano reduz a
                      tolerância para estudo aleatório. Cruel? Sim. Útil? Também.
                    </p>
                  </div>
                </div>

                <Link href="/vet/simulado">
                  <Button className="w-full mt-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white">
                    Gerar simulado VET
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
