import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck,
  Flame,
  History,
  Layers3,
  Loader2,
  Shield,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InteractiveQuiz,
  type QuizCompletionData,
} from "@/components/InteractiveQuiz";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getQuestions } from "@/services/questions.service";
import type { Question } from "@/types/question";
import {
  buildVetEngineResult,
  formatVetPercent,
  getQuestionTopicsForVet,
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

type SimuladoMode = VetTrainingBlock | "misto";

type MockQuestionItem = {
  question: Question;
  matchedContent: VetStrategicContent;
  score: number;
  alreadyAttempted: boolean;
};

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueByQuestionId(items: MockQuestionItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.question.id)) return false;

    seen.add(item.question.id);
    return true;
  });
}

function matchesTargetExam(question: Question, targetExam: string) {
  const target = normalizeText(targetExam);

  return (
    normalizeText(question.institution) === target ||
    normalizeText(question.exam) === target
  );
}

function matchesFocusSubject(question: Question, focusSubject: string) {
  if (normalizeText(focusSubject) === "todas") return true;

  return normalizeText(question.subject) === normalizeText(focusSubject);
}

function matchesContent(question: Question, content: string) {
  const topics = getQuestionTopicsForVet(question).map(normalizeText);
  return topics.includes(normalizeText(content));
}

function getDifficultyScore(question: Question, block: VetTrainingBlock) {
  const difficulty = normalizeText(question.difficulty);

  if (block === "ataque") {
    if (difficulty === "dificil") return 12;
    if (difficulty === "medio") return 10;
    if (difficulty === "facil") return 4;
    return 5;
  }

  if (block === "consolidacao") {
    if (difficulty === "medio") return 12;
    if (difficulty === "facil") return 8;
    if (difficulty === "dificil") return 5;
    return 6;
  }

  if (difficulty === "facil") return 12;
  if (difficulty === "medio") return 8;
  if (difficulty === "dificil") return 3;

  return 5;
}

function getQuestionRecencyScore(question: Question) {
  const year = Number(question.year);

  if (Number.isNaN(year)) return 0;

  return Math.min(Math.max(year - 2015, 0), 10);
}

function getBlockMeta(block: SimuladoMode) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      description:
        "Simulado para enfrentar conteúdos urgentes, recorrentes ou com baixo desempenho.",
      icon: Flame,
      cardClassName: "border-red-200 bg-red-50",
      iconClassName: "bg-red-100 text-red-700",
      textClassName: "text-red-700",
      activeClassName: "bg-red-600 border-red-600 text-white",
      buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
    };
  }

  if (block === "consolidacao") {
    return {
      label: "Consolidação",
      description:
        "Simulado para estabilizar conteúdos que ainda oscilam no desempenho.",
      icon: Layers3,
      cardClassName: "border-amber-200 bg-amber-50",
      iconClassName: "bg-amber-100 text-amber-700",
      textClassName: "text-amber-700",
      activeClassName: "bg-amber-500 border-amber-500 text-white",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    };
  }

  if (block === "manutencao") {
    return {
      label: "Manutenção",
      description:
        "Simulado para revisar conteúdos controlados e manter ritmo de prova.",
      icon: Shield,
      cardClassName: "border-emerald-200 bg-emerald-50",
      iconClassName: "bg-emerald-100 text-emerald-700",
      textClassName: "text-emerald-700",
      activeClassName: "bg-emerald-600 border-emerald-600 text-white",
      buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
    };
  }

  return {
    label: "Misto VET",
    description:
      "Simulado equilibrado misturando ataque, consolidação e manutenção.",
    icon: Shuffle,
    cardClassName: "border-slate-200 bg-slate-50",
    iconClassName: "bg-slate-900 text-white",
    textClassName: "text-slate-900",
    activeClassName: "bg-slate-900 border-slate-900 text-white",
    buttonClassName: "bg-slate-900 hover:bg-slate-800 text-white",
  };
}

function buildBankUrl(
  profile: VetProfile,
  mode: SimuladoMode,
  contents: VetStrategicContent[]
) {
  const params = new URLSearchParams();

  if (profile.target_exam) {
    params.set("institution", profile.target_exam);
  }

  if (profile.focus_subject && profile.focus_subject !== "todas") {
    params.set("subject", profile.focus_subject);
  }

  params.set("block", mode);

  const topics = contents.map((content) => content.conteudo).filter(Boolean);

  if (topics.length > 0) {
    params.set("topics", topics.join(","));
  }

  return `/banco-de-questoes?${params.toString()}`;
}

function buildMockQuestions(params: {
  questions: Question[];
  profile: VetProfile;
  contents: VetStrategicContent[];
  block: VetTrainingBlock;
  attemptedQuestionIds: Set<string>;
  limit: number;
}) {
  const { questions, profile, contents, block, attemptedQuestionIds, limit } =
    params;

  if (contents.length === 0) return [];

  const result: MockQuestionItem[] = [];

  for (const question of questions) {
    if (!matchesFocusSubject(question, profile.focus_subject)) continue;

    const matchedContent = contents.find((content) =>
      matchesContent(question, content.conteudo)
    );

    if (!matchedContent) continue;

    const sameExam = matchesTargetExam(question, profile.target_exam);
    const alreadyAttempted = attemptedQuestionIds.has(question.id);

    let score = matchedContent.priorityScore;

    score += sameExam ? 35 : 6;
    score += alreadyAttempted ? -18 : 30;
    score += getDifficultyScore(question, block);
    score += getQuestionRecencyScore(question);

    if (matchedContent.historical?.lastYearAppeared === question.year) {
      score += 8;
    }

    if (matchedContent.collective && matchedContent.personal.hasData) {
      const gap =
        matchedContent.collective.collective_accuracy -
        matchedContent.personal.accuracy;

      if (gap > 10) score += 8;
      if (gap > 20) score += 12;
    }

    result.push({
      question,
      matchedContent,
      score,
      alreadyAttempted,
    });
  }

  return result.sort((a, b) => b.score - a.score).slice(0, limit);
}

function MockStatCard({
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

function MockQuestionPreviewCard({ item }: { item: MockQuestionItem }) {
  const { question, matchedContent, alreadyAttempted } = item;
  const meta = getBlockMeta(matchedContent.block);
  const Icon = meta.icon;
  const topics = getQuestionTopicsForVet(question);

  return (
    <Card className="p-5 rounded-3xl border-slate-200 bg-white shadow-sm">
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

        {alreadyAttempted ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
            já respondida
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            inédita
          </span>
        )}
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
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-violet-700" />
          <p className="text-xs font-bold text-violet-700">
            Motivo da escolha
          </p>
        </div>

        <p className="text-sm text-violet-800">
          Ligada a {prettifyVetText(matchedContent.conteudo)}, no bloco{" "}
          {meta.label}, com score {Math.round(matchedContent.priorityScore)}.
        </p>
      </div>
    </Card>
  );
}

export default function VetMockPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<VetAttempt[]>([]);
  const [mode, setMode] = useState<SimuladoMode>("misto");

  useEffect(() => {
    async function loadMock() {
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

        setAttempts(loadedAttempts);
        setQuestions(loadedQuestions);
        setEngine(result);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar o Simulado VET.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadMock();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const attemptedQuestionIds = useMemo(() => {
    return new Set(attempts.map((attempt) => attempt.question_id));
  }, [attempts]);

  const attackContents = useMemo(() => {
    return (engine?.attack ?? []).slice(0, 6);
  }, [engine]);

  const consolidationContents = useMemo(() => {
    return (engine?.consolidation ?? []).slice(0, 6);
  }, [engine]);

  const maintenanceContents = useMemo(() => {
    return (engine?.maintenance ?? []).slice(0, 6);
  }, [engine]);

  const attackQuestions = useMemo(() => {
    if (!profile) return [];

    return buildMockQuestions({
      questions,
      profile,
      contents: attackContents,
      block: "ataque",
      attemptedQuestionIds,
      limit: 10,
    });
  }, [questions, profile, attackContents, attemptedQuestionIds]);

  const consolidationQuestions = useMemo(() => {
    if (!profile) return [];

    return buildMockQuestions({
      questions,
      profile,
      contents: consolidationContents,
      block: "consolidacao",
      attemptedQuestionIds,
      limit: 10,
    });
  }, [questions, profile, consolidationContents, attemptedQuestionIds]);

  const maintenanceQuestions = useMemo(() => {
    if (!profile) return [];

    return buildMockQuestions({
      questions,
      profile,
      contents: maintenanceContents,
      block: "manutencao",
      attemptedQuestionIds,
      limit: 10,
    });
  }, [questions, profile, maintenanceContents, attemptedQuestionIds]);

  const mixedQuestions = useMemo(() => {
    const mixed = uniqueByQuestionId([
      ...attackQuestions.slice(0, 5),
      ...consolidationQuestions.slice(0, 4),
      ...maintenanceQuestions.slice(0, 3),
    ]);

    return mixed.slice(0, 12);
  }, [attackQuestions, consolidationQuestions, maintenanceQuestions]);

  const currentItems =
    mode === "ataque"
      ? attackQuestions
      : mode === "consolidacao"
        ? consolidationQuestions
        : mode === "manutencao"
          ? maintenanceQuestions
          : mixedQuestions;

  const currentQuestions = currentItems.map((item) => item.question);

  const currentMeta = getBlockMeta(mode);
  const CurrentIcon = currentMeta.icon;

  const currentContents =
    mode === "ataque"
      ? attackContents
      : mode === "consolidacao"
        ? consolidationContents
        : mode === "manutencao"
          ? maintenanceContents
          : [
              ...attackContents.slice(0, 3),
              ...consolidationContents.slice(0, 3),
              ...maintenanceContents.slice(0, 2),
            ];

  const bankUrl =
    profile && currentContents.length > 0
      ? buildBankUrl(profile, mode, currentContents)
      : "/banco-de-questoes";

  const modeTitle =
    mode === "ataque"
      ? "Simulado de ataque"
      : mode === "consolidacao"
        ? "Simulado de consolidação"
        : mode === "manutencao"
          ? "Simulado de manutenção"
          : "Simulado misto VET";

  function handleSimuladoComplete(data: QuizCompletionData) {
    if (!profile) return;

    const payload = {
      mode,
      targetExam: profile.target_exam,
      focusSubject: profile.focus_subject,
      totalQuestions: data.totalQuestions,
      totalAnswered: data.totalAnswered,
      score: data.score,
      accuracy: data.accuracy,
      wrongTopics: data.wrongTopics,
      wrongDifficulties: data.wrongDifficulties,

      engineSummary: {
        totalAttempts: engine?.totalAttempts ?? 0,
        generalAccuracy: engine?.generalAccuracy ?? 0,
        topPriority: engine?.topPriority?.conteudo ?? null,
        attackCount: engine?.attack.length ?? 0,
        consolidationCount: engine?.consolidation.length ?? 0,
        maintenanceCount: engine?.maintenance.length ?? 0,
      },
    };

    window.sessionStorage.setItem("vet_mock_result", JSON.stringify(payload));
    setLocation("/vet/simulado/resultado");
  }

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
            <h1 className="text-2xl font-bold text-slate-900">Simulado VET</h1>
            <p className="text-sm text-slate-500">
              Simulados montados pelo mesmo motor do Diagnóstico e do Plano VET
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando Simulado VET...
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
                  O Simulado VET precisa saber sua prova-alvo, tempo restante e
                  foco. Sem isso, ele só escolhe questão com a precisão de um
                  pombo jogando dardo.
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
                    Execução estratégica
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Simulado para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    O VET monta simulados com base no score estratégico dos
                    conteúdos, histórico dos últimos anos da prova, média dos
                    alunos, dificuldade e questões que você ainda não respondeu.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    <Link href={bankUrl}>
                      <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                        Abrir recorte no banco
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

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
                    Resumo atual
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Prova-alvo
                      </p>
                      <p className="font-bold">{profile.target_exam}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">Foco</p>
                      <p className="font-bold">
                        {prettifyVetText(profile.focus_subject)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Aproveitamento
                      </p>
                      <p className="font-bold">
                        {engine ? formatVetPercent(engine.generalAccuracy) : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <MockStatCard
                title="Ataque"
                value={`${attackQuestions.length}`}
                subtitle={`${attackContents.length} conteúdo(s) prioritário(s)`}
                icon={Flame}
                className="border-red-200 bg-white"
                iconClassName="bg-red-100 text-red-700"
              />

              <MockStatCard
                title="Consolidação"
                value={`${consolidationQuestions.length}`}
                subtitle={`${consolidationContents.length} conteúdo(s) em ajuste`}
                icon={Layers3}
                className="border-amber-200 bg-white"
                iconClassName="bg-amber-100 text-amber-700"
              />

              <MockStatCard
                title="Manutenção"
                value={`${maintenanceQuestions.length}`}
                subtitle={`${maintenanceContents.length} conteúdo(s) controlado(s)`}
                icon={ShieldCheck}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <MockStatCard
                title="Misto VET"
                value={`${mixedQuestions.length}`}
                subtitle="Combinação dos três blocos"
                icon={Shuffle}
                className="border-slate-200 bg-white"
                iconClassName="bg-slate-900 text-white"
              />
            </section>

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${currentMeta.iconClassName}`}
                  >
                    <CurrentIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Escolha o modo do simulado
                    </h2>
                    <p className="text-sm text-slate-500">
                      Cada modo muda o peso das questões escolhidas.
                    </p>
                  </div>
                </div>

                <Link href={bankUrl}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir este recorte no banco
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {(["ataque", "consolidacao", "manutencao", "misto"] as SimuladoMode[]).map(
                  (item) => {
                    const meta = getBlockMeta(item);
                    const Icon = meta.icon;
                    const active = mode === item;

                    return (
                      <button
                        key={item}
                        onClick={() => setMode(item)}
                        className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                          active
                            ? meta.activeClassName
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 inline mr-2" />
                        {meta.label}
                      </button>
                    );
                  }
                )}
              </div>
            </Card>

            <section className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
              <Card className={`p-6 rounded-3xl border ${currentMeta.cardClassName}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${currentMeta.iconClassName}`}
                  >
                    <CurrentIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {modeTitle}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {currentMeta.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white bg-white/80 p-4 mb-5">
                  <p className="text-sm text-slate-500 mb-1">
                    Questões neste modo
                  </p>
                  <p className="text-4xl font-bold text-slate-900">
                    {currentQuestions.length}
                  </p>
                </div>

                <div className="space-y-4">
                  {currentItems.length > 0 ? (
                    currentItems.slice(0, 6).map((item) => (
                      <MockQuestionPreviewCard
                        key={item.question.id}
                        item={item}
                      />
                    ))
                  ) : (
                    <p className="text-slate-600">
                      Ainda não há questões suficientes para este modo com os
                      critérios atuais.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Resolver simulado
                  </h2>
                </div>

                {currentQuestions.length > 0 ? (
                  <InteractiveQuiz
                    key={`${mode}-${currentQuestions
                      .map((question) => question.id)
                      .join("-")}`}
                    questions={currentQuestions}
                    onComplete={handleSimuladoComplete}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-slate-600">
                      Não há questões suficientes para montar este simulado agora.
                    </p>
                  </div>
                )}
              </Card>
            </section>

            <section className="grid xl:grid-cols-4 gap-5">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Histórico da prova
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  Questões ligadas a conteúdos recorrentes e recentes ganham
                  prioridade. Porque prova também tem padrão, mesmo quando a banca
                  finge ser entidade mística.
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
                  Se você está abaixo da média dos alunos em um conteúdo, o VET
                  aumenta a chance de ele entrar no simulado.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Questões inéditas
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  O VET favorece questões que você ainda não respondeu, para
                  evitar treino decorado fingindo que é evolução.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Clock3 className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Dificuldade ideal
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  Ataque puxa questões mais fortes, consolidação busca equilíbrio
                  e manutenção favorece revisão eficiente.
                </p>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
