import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { normalizeDifficulty } from "@/lib/difficulty";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  Flame,
  History,
  Layers3,
  ListChecks,
  Loader2,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InteractiveQuiz } from "@/components/InteractiveQuiz";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { mapQuestao } from "@/services/questions.service";
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

type RecommendedQuestion = {
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

function getBlockMeta(block: VetTrainingBlock) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      description:
        "Questões para atacar conteúdos urgentes, recorrentes ou muito frágeis.",
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
        "Questões para estabilizar conteúdos que ainda oscilam no desempenho.",
      icon: Layers3,
      cardClassName: "border-amber-200 bg-amber-50",
      iconClassName: "bg-amber-100 text-amber-700",
      textClassName: "text-amber-700",
      activeClassName: "bg-amber-500 border-amber-500 text-white",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    };
  }

  return {
    label: "Manutenção",
    description:
      "Questões para manter conteúdos controlados vivos na rotina.",
    icon: Shield,
    cardClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    textClassName: "text-emerald-700",
    activeClassName: "bg-emerald-600 border-emerald-600 text-white",
    buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
}

function getDifficultyScore(question: Question, block: VetTrainingBlock) {
  const difficulty = normalizeDifficulty(question.difficulty);

  if (block === "ataque") {
    if (difficulty === "muito_dificil") return 10;
    if (difficulty === "medio") return 10;
    if (difficulty === "dificil") return 8;
    if (difficulty === "facil") return 4;
    return 5;
  }

  if (block === "consolidacao") {
    if (difficulty === "muito_dificil") return 2;
    if (difficulty === "medio") return 10;
    if (difficulty === "facil") return 7;
    if (difficulty === "dificil") return 4;
    return 5;
  }

  if (difficulty === "facil") return 10;
  if (difficulty === "medio") return 7;
  if (difficulty === "dificil") return 3;
  if (difficulty === "muito_dificil") return 1;

  return 5;
}

function getQuestionRecencyScore(question: Question) {
  const year = Number(question.year);

  if (Number.isNaN(year)) return 0;

  return Math.min(Math.max(year - 2015, 0), 10);
}

function getBlockLimit(block: VetTrainingBlock) {
  if (block === "ataque") return 12;
  if (block === "consolidacao") return 10;
  return 8;
}

function buildBankUrl(
  profile: VetProfile,
  block: VetTrainingBlock,
  contents: VetStrategicContent[]
) {
  const params = new URLSearchParams();

  if (profile.focus_subject && profile.focus_subject !== "todas") {
    params.set("subject", profile.focus_subject);
  }

  if (profile.target_exam) {
    params.set("institution", profile.target_exam);
  }

  params.set("block", block);

  const topics = contents.map((content) => content.conteudo).filter(Boolean);

  if (topics.length > 0) {
    params.set("topics", topics.join(","));
  }

  return `/banco-de-questoes?${params.toString()}`;
}

function buildRecommendedQuestions(params: {
  questions: Question[];
  profile: VetProfile;
  contents: VetStrategicContent[];
  block: VetTrainingBlock;
  attemptedQuestionIds: Set<string>;
}) {
  const { questions, profile, contents, block, attemptedQuestionIds } = params;

  if (contents.length === 0) return [];

  const results: RecommendedQuestion[] = [];

  for (const question of questions) {
    if (!matchesFocusSubject(question, profile.focus_subject)) continue;

    const matchedContent = contents.find((content) =>
      matchesContent(question, content.conteudo)
    );

    if (!matchedContent) continue;

    const sameExam = matchesTargetExam(question, profile.target_exam);
    const alreadyAttempted = attemptedQuestionIds.has(question.id);

    let score = matchedContent.priorityScore;

    score += sameExam ? 35 : 8;
    score += alreadyAttempted ? -20 : 35;
    score += getDifficultyScore(question, block);
    score += getQuestionRecencyScore(question);

    if (matchedContent.historical?.lastYearAppeared === question.year) {
      score += 8;
    }

    results.push({
      question,
      matchedContent,
      score,
      alreadyAttempted,
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, getBlockLimit(block));
}

function QuestionStatCard({
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

function QuestionPreviewCard({ item }: { item: RecommendedQuestion }) {
  const { question, matchedContent, alreadyAttempted } = item;
  const topics = getQuestionTopicsForVet(question);
  const blockMeta = getBlockMeta(matchedContent.block);
  const BlockIcon = blockMeta.icon;

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

        {alreadyAttempted ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
            já respondida
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            inédita para você
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
          <BlockIcon className="w-4 h-4 text-violet-700" />
          <p className="text-xs font-bold text-violet-700">
            Motivo da recomendação
          </p>
        </div>

        <p className="text-sm text-violet-800">
          Relacionada a {prettifyVetText(matchedContent.conteudo)}, com score{" "}
          {Math.round(matchedContent.priorityScore)}, no bloco{" "}
          {blockMeta.label}.
        </p>
      </div>
    </Card>
  );
}

export default function VetQuestionsPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<VetAttempt[]>([]);
  const [selectedBlock, setSelectedBlock] =
    useState<VetTrainingBlock>("ataque");

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [analysis, attack, consolidation, maintenance] = await Promise.all([
          trpcUtils.vet.getAnalysis.fetch(),
          trpcUtils.vet.getRecommendedQuestions.fetch({ block: "ataque", limit: 20 }),
          trpcUtils.vet.getRecommendedQuestions.fetch({ block: "consolidacao", limit: 20 }),
          trpcUtils.vet.getRecommendedQuestions.fetch({ block: "manutencao", limit: 20 }),
        ]);
        const currentProfile = (analysis?.profile as VetProfileRow | null) ?? null;
        setProfile(currentProfile);
        if (!currentProfile || !analysis) {
          setEngine(null);
          return;
        }
        const rows = [...attack, ...consolidation, ...maintenance] as unknown as any[];
        setQuestions(Array.from(new Map(rows.map(row => [row.id, mapQuestao(row)])).values()));
        setAttempts([]);
        setEngine(analysis as VetEngineResult);
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar as questões recomendadas.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
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

  const blockContents = useMemo(() => {
    if (selectedBlock === "ataque") return attackContents;
    if (selectedBlock === "consolidacao") return consolidationContents;
    return maintenanceContents;
  }, [attackContents, consolidationContents, maintenanceContents, selectedBlock]);

  const attackQuestions = useMemo(() => {
    if (!profile) return [];

    return buildRecommendedQuestions({
      questions,
      profile,
      contents: attackContents,
      block: "ataque",
      attemptedQuestionIds,
    });
  }, [questions, profile, attackContents, attemptedQuestionIds]);

  const consolidationQuestions = useMemo(() => {
    if (!profile) return [];

    return buildRecommendedQuestions({
      questions,
      profile,
      contents: consolidationContents,
      block: "consolidacao",
      attemptedQuestionIds,
    });
  }, [questions, profile, consolidationContents, attemptedQuestionIds]);

  const maintenanceQuestions = useMemo(() => {
    if (!profile) return [];

    return buildRecommendedQuestions({
      questions,
      profile,
      contents: maintenanceContents,
      block: "manutencao",
      attemptedQuestionIds,
    });
  }, [questions, profile, maintenanceContents, attemptedQuestionIds]);

  const visibleQuestions =
    selectedBlock === "ataque"
      ? attackQuestions
      : selectedBlock === "consolidacao"
        ? consolidationQuestions
        : maintenanceQuestions;

  const visibleTitle =
    selectedBlock === "ataque"
      ? "Questões de ataque"
      : selectedBlock === "consolidacao"
        ? "Questões de consolidação"
        : "Questões de manutenção";

  const visibleSubtitle =
    selectedBlock === "ataque"
      ? "Prioridade máxima: conteúdos com maior score estratégico."
      : selectedBlock === "consolidacao"
        ? "Treino para estabilizar conteúdos que ainda oscilam."
        : "Revisão para manter conteúdos controlados ativos.";

  const visibleBankUrl = profile
    ? buildBankUrl(profile, selectedBlock, blockContents)
    : "/banco-de-questoes";

  const selectedMeta = getBlockMeta(selectedBlock);
  const SelectedIcon = selectedMeta.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/vet">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Questões recomendadas
            </h1>
            <p className="text-sm text-slate-500">
              Questões reais escolhidas pelo novo motor do VET
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando questões recomendadas...
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
                  Antes de usar as questões recomendadas, você precisa configurar
                  sua prova-alvo e foco. Sem objetivo, o VET vira só um gerador
                  de palpite, e o mundo já está lotado disso.
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
                    Questões estratégicas
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    Fila recomendada para {profile.target_exam}
                  </h2>

                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    As questões agora são escolhidas pelo mesmo motor do
                    Diagnóstico e do Plano VET: score estratégico, histórico da
                    prova, média dos alunos, dificuldade e questões ainda não
                    respondidas.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    <Link href={visibleBankUrl}>
                      <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-6 py-5 font-bold">
                        Abrir bloco no banco
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
                    Resumo
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
                        Foco
                      </p>
                      <p className="font-bold">
                        {prettifyVetText(profile.focus_subject)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Tentativas analisadas
                      </p>
                      <p className="font-bold">
                        {engine?.totalAttempts ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <QuestionStatCard
                title="Ataque"
                value={`${attackQuestions.length}`}
                subtitle={`${attackContents.length} conteúdo(s) prioritário(s)`}
                icon={Flame}
                className="border-red-200 bg-white"
                iconClassName="bg-red-100 text-red-700"
              />

              <QuestionStatCard
                title="Consolidação"
                value={`${consolidationQuestions.length}`}
                subtitle={`${consolidationContents.length} conteúdo(s) em ajuste`}
                icon={Layers3}
                className="border-amber-200 bg-white"
                iconClassName="bg-amber-100 text-amber-700"
              />

              <QuestionStatCard
                title="Manutenção"
                value={`${maintenanceQuestions.length}`}
                subtitle={`${maintenanceContents.length} conteúdo(s) controlado(s)`}
                icon={ShieldCheck}
                className="border-emerald-200 bg-white"
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <QuestionStatCard
                title="Revisão de erro"
                value={`${engine?.reviewContents.length ?? 0}`}
                subtitle="conteúdo(s) com erro recente ou recorrente"
                icon={History}
                className="border-violet-200 bg-white"
                iconClassName="bg-violet-100 text-violet-700"
              />
            </section>

            {engine?.reviewContents.length ? (
              <Card className="p-6 bg-violet-50 border-violet-200 rounded-3xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Revisão de erros antes de questão nova
                      </h2>
                      <p className="text-sm text-slate-600">
                        O VET separou conteúdos com erro recente, erro repetido ou questões nunca acertadas. Aí está a parte menos divertida e mais útil do estudo, naturalmente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {engine.reviewContents.slice(0, 4).map((content) => (
                    <div
                      key={`${content.subject}-${content.conteudo}-review`}
                      className="rounded-2xl border border-violet-200 bg-white p-4"
                    >
                      <p className="text-sm font-black text-slate-900 mb-1">
                        {prettifyVetText(content.conteudo)}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        {content.personal.recentWrong30Days} erro(s) em 30 dias • {content.personal.neverCorrectQuestions} nunca acertada(s)
                      </p>
                      <Link href={buildBankUrl(profile, content.block, [content])}>
                        <Button size="sm" className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white w-full">
                          Revisar agora
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="p-6 bg-white border-slate-200 rounded-3xl">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${selectedMeta.iconClassName}`}
                  >
                    <SelectedIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Escolha o bloco
                    </h2>
                    <p className="text-sm text-slate-500">
                      A fila muda conforme o estágio do treino.
                    </p>
                  </div>
                </div>

                <Link href={visibleBankUrl}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir este bloco no banco
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {(["ataque", "consolidacao", "manutencao"] as VetTrainingBlock[]).map(
                  (block) => {
                    const meta = getBlockMeta(block);
                    const Icon = meta.icon;
                    const active = selectedBlock === block;

                    return (
                      <button
                        key={block}
                        onClick={() => setSelectedBlock(block)}
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

            <section className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <ListChecks className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {visibleTitle}
                  </h2>
                </div>

                <p className="text-sm text-slate-500 mb-5">
                  {visibleSubtitle}
                </p>

                <div className="space-y-4">
                  {visibleQuestions.length > 0 ? (
                    visibleQuestions.map((item) => (
                      <QuestionPreviewCard
                        key={item.question.id}
                        item={item}
                      />
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Ainda não há questões suficientes para esse bloco com os
                      critérios atuais.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Resolver agora
                  </h2>
                </div>

                {visibleQuestions.length > 0 ? (
                  <InteractiveQuiz
                    key={`${selectedBlock}-${visibleQuestions
                      .map((item) => item.question.id)
                      .join("-")}`}
                    questions={visibleQuestions.map((item) => item.question)}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-slate-600">
                      Não há questões para resolver neste bloco agora.
                    </p>
                  </div>
                )}
              </Card>
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
                  Questões relacionadas a conteúdos recorrentes e recentes da
                  prova recebem prioridade maior.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Média dos alunos
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  Se você está abaixo da média coletiva em um conteúdo, ele pesa
                  mais na recomendação.
                </p>
              </Card>

              <Card className="p-6 bg-white border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Questões inéditas
                  </h2>
                </div>

                <p className="text-sm text-slate-600">
                  O VET favorece questões que você ainda não respondeu. Repetir
                  questão sem critério é só nostalgia com gabarito.
                </p>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
