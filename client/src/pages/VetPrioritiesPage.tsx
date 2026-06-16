import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Flame,
  History,
  Layers3,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getQuestions } from "@/services/questions.service";
import {
  buildVetEngineResult,
  formatVetPercent,
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

type PriorityFilter = "todas" | VetTrainingBlock | "revisao";

const FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "ataque", label: "Ataque" },
  { value: "consolidacao", label: "Consolidação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "revisao", label: "Revisão de erro" },
];

function buildBankUrl(profile: VetProfile, content: VetStrategicContent) {
  const params = new URLSearchParams();

  if (profile.target_exam) params.set("institution", profile.target_exam);
  if (content.subject) params.set("subject", content.subject);
  if (content.conteudo) params.set("topics", content.conteudo);
  params.set("block", content.block);

  return `/banco-de-questoes?${params.toString()}`;
}

function getBlockMeta(block: VetTrainingBlock) {
  if (block === "ataque") {
    return {
      label: "Ataque",
      icon: Flame,
      cardClassName: "border-red-200 bg-red-50",
      badgeClassName: "bg-red-100 text-red-700 border-red-200",
      iconClassName: "bg-red-100 text-red-700",
      buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
    };
  }

  if (block === "consolidacao") {
    return {
      label: "Consolidação",
      icon: Layers3,
      cardClassName: "border-amber-200 bg-amber-50",
      badgeClassName: "bg-amber-100 text-amber-700 border-amber-200",
      iconClassName: "bg-amber-100 text-amber-700",
      buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    };
  }

  return {
    label: "Manutenção",
    icon: ShieldCheck,
    cardClassName: "border-emerald-200 bg-emerald-50",
    badgeClassName: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconClassName: "bg-emerald-100 text-emerald-700",
    buttonClassName: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-1">
        {label}
      </p>
      <p className="text-lg font-black text-slate-900">{Math.round(value)}</p>
    </div>
  );
}

function PriorityCard({
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
    <Card className={`rounded-3xl border p-5 shadow-sm ${meta.cardClassName}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
              #{rank}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.badgeClassName}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
            {content.personal.recentWrong30Days > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                erro recente
              </span>
            ) : null}
            {content.personal.neverCorrectQuestions > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                <History className="w-3.5 h-3.5" />
                revisão urgente
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl font-black text-slate-900 leading-tight">
            {prettifyVetText(content.conteudo)}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {prettifyVetText(content.subject)} • score {Math.round(content.priorityScore)}
          </p>
        </div>

        <Link href={buildBankUrl(profile, content)}>
          <Button className={`rounded-2xl ${meta.buttonClassName}`}>
            Treinar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <ScorePill label="Peso" value={content.weight} />
        <ScorePill label="Histórico" value={content.historicalImportanceScore} />
        <ScorePill label="Fraqueza" value={content.weaknessScore} />
        <ScorePill label="Erros" value={content.wrongVolumeScore} />
        <ScorePill label="Erro recente" value={content.recentErrorScore} />
        <ScorePill label="Erro recorrente" value={content.recurringErrorScore} />
        <ScorePill label="Urgência" value={content.urgencyTimeScore} />
        <ScorePill label="Média" value={content.collectiveGapScore} />
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-2xl border border-white bg-white/80 p-4">
          <p className="text-xs text-slate-500 mb-1">Seu acerto</p>
          <p className="font-black text-slate-900">
            {content.personal.hasData
              ? formatVetPercent(content.personal.accuracy)
              : "sem dados"}
          </p>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4">
          <p className="text-xs text-slate-500 mb-1">Erros 30 dias</p>
          <p className="font-black text-slate-900">
            {content.personal.recentWrong30Days}
          </p>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4">
          <p className="text-xs text-slate-500 mb-1">Erradas +1 vez</p>
          <p className="font-black text-slate-900">
            {content.personal.repeatedWrongQuestions}
          </p>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4">
          <p className="text-xs text-slate-500 mb-1">Nunca acertadas</p>
          <p className="font-black text-slate-900">
            {content.personal.neverCorrectQuestions}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white bg-white/80 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          Por que o VET colocou isso aqui?
        </p>
        <ul className="space-y-2">
          {content.explanation.slice(0, 5).map((line, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function VetPrioritiesPage() {
  const { user, loading: authLoading } = useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VetProfileRow | null>(null);
  const [engine, setEngine] = useState<VetEngineResult | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<PriorityFilter>("todas");

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
          setError("Não foi possível carregar seu objetivo do VET.");
          return;
        }

        const currentProfile = (profileData as VetProfileRow | null) ?? null;
        setProfile(currentProfile);

        if (!currentProfile) {
          setEngine(null);
          return;
        }

        const [attemptsResponse, weightsResponse, collectiveResponse, questions] =
          await Promise.all([
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
          return;
        }

        if (weightsResponse.error) {
          console.error(weightsResponse.error);
          setError("Não foi possível carregar os pesos da prova.");
          return;
        }

        if (collectiveResponse.error) {
          console.error(collectiveResponse.error);
          setError("Não foi possível carregar a média coletiva.");
          return;
        }

        const loadedCollective =
          ((collectiveResponse.data as VetCollectiveContentStat[]) ?? []).map(
            item => ({
              ...item,
              total_attempts: Number(item.total_attempts ?? 0),
              correct_attempts: Number(item.correct_attempts ?? 0),
              wrong_attempts: Number(item.wrong_attempts ?? 0),
              collective_accuracy: Number(item.collective_accuracy ?? 0),
              avg_time_seconds:
                item.avg_time_seconds === null || item.avg_time_seconds === undefined
                  ? null
                  : Number(item.avg_time_seconds),
            })
          );

        setEngine(
          buildVetEngineResult({
            profile: currentProfile,
            attempts: (attemptsResponse.data as VetAttempt[]) ?? [],
            questions,
            weights: (weightsResponse.data as VetWeight[]) ?? [],
            collectiveStats: loadedCollective,
            yearsBack: 5,
          })
        );
      } catch (err) {
        console.error(err);
        setError("Ocorreu um erro inesperado ao carregar as prioridades.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [user?.id, authLoading]);

  const filteredContents = useMemo(() => {
    if (!engine) return [];

    if (selectedFilter === "todas") return engine.strategicContents;
    if (selectedFilter === "revisao") return engine.reviewContents;

    return engine.strategicContents.filter(
      content => content.block === selectedFilter
    );
  }, [engine, selectedFilter]);

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
            <h1 className="text-2xl font-black text-slate-900">
              Prioridades do VET
            </h1>
            <p className="text-sm text-slate-500">
              O que estudar primeiro, com motivo explícito e sem horóscopo acadêmico.
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {authLoading || loading ? (
          <Card className="p-8 bg-white">
            <p className="text-slate-600">Carregando prioridades...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700">{error}</p>
          </Card>
        ) : !user ? (
          <Card className="p-8 bg-white">
            <p className="text-slate-700">Você precisa estar logado para usar o VET.</p>
          </Card>
        ) : !profile ? (
          <Card className="p-8 bg-white border-emerald-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Configure seu objetivo primeiro
            </h2>
            <p className="text-slate-600 mb-5">
              O VET precisa saber sua prova-alvo e seu foco de estudo antes de inventar uma estratégia, porque até máquina precisa de contexto.
            </p>
            <Link href="/vet/objetivo">
              <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
                Configurar objetivo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        ) : engine ? (
          <>
            <Card className="rounded-3xl border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl -mr-24 -mt-24" />
              <div className="relative grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-bold mb-4">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Decisão explicada
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">
                    O VET agora olha erro recente e erro recorrente.
                  </h2>
                  <p className="text-emerald-50 leading-relaxed max-w-3xl">
                    A prioridade não vem só do peso da prova. Ela cruza histórico, seu aproveitamento, erros acumulados, erros dos últimos 30 dias, questões nunca acertadas e comparação coletiva. Finalmente um painel que tenta explicar o estrago em vez de só apontar para ele.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                    <p className="text-3xl font-black">{engine.attack.length}</p>
                    <p className="text-sm text-emerald-50">ataque</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                    <p className="text-3xl font-black">{engine.consolidation.length}</p>
                    <p className="text-sm text-emerald-50">consolidação</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                    <p className="text-3xl font-black">{engine.recentWrongAttempts}</p>
                    <p className="text-sm text-emerald-50">erros recentes</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                    <p className="text-3xl font-black">{engine.neverCorrectQuestionCount}</p>
                    <p className="text-sm text-emerald-50">nunca acertadas</p>
                  </div>
                </div>
              </div>
            </Card>

            <section className="grid md:grid-cols-4 gap-4">
              <Card className="p-5 bg-white border-slate-200 rounded-3xl">
                <BarChart3 className="w-5 h-5 text-slate-700 mb-3" />
                <p className="text-2xl font-black text-slate-900">
                  {formatVetPercent(engine.generalAccuracy)}
                </p>
                <p className="text-sm text-slate-500">aproveitamento geral</p>
              </Card>
              <Card className="p-5 bg-white border-orange-200 rounded-3xl">
                <AlertTriangle className="w-5 h-5 text-orange-600 mb-3" />
                <p className="text-2xl font-black text-slate-900">
                  {engine.recentWrongAttempts}
                </p>
                <p className="text-sm text-slate-500">erros nos últimos 30 dias</p>
              </Card>
              <Card className="p-5 bg-white border-violet-200 rounded-3xl">
                <History className="w-5 h-5 text-violet-600 mb-3" />
                <p className="text-2xl font-black text-slate-900">
                  {engine.repeatedWrongQuestionCount}
                </p>
                <p className="text-sm text-slate-500">erros repetidos</p>
              </Card>
              <Card className="p-5 bg-white border-emerald-200 rounded-3xl">
                <Target className="w-5 h-5 text-emerald-600 mb-3" />
                <p className="text-2xl font-black text-slate-900">
                  {engine.reviewContents.length}
                </p>
                <p className="text-sm text-slate-500">conteúdos para revisão</p>
              </Card>
            </section>

            <section className="flex flex-wrap gap-2">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                    selectedFilter === filter.value
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </section>

            <section className="space-y-4">
              {filteredContents.length > 0 ? (
                filteredContents.map((content, index) => (
                  <PriorityCard
                    key={`${content.subject}-${content.conteudo}`}
                    content={content}
                    profile={profile}
                    rank={index + 1}
                  />
                ))
              ) : (
                <Card className="p-8 bg-white border-slate-200 rounded-3xl">
                  <ListChecks className="w-6 h-6 text-slate-500 mb-3" />
                  <p className="text-slate-600">
                    Nenhuma prioridade encontrada nesse filtro.
                  </p>
                </Card>
              )}
            </section>

            <Card className="p-6 bg-slate-900 text-white rounded-3xl border-slate-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-emerald-300 mt-1" />
                <div>
                  <h2 className="text-xl font-black mb-2">Como ler essa tela</h2>
                  <p className="text-slate-300 leading-relaxed">
                    Peso e histórico dizem o quanto a prova costuma cobrar. Fraqueza, erro recente e erro recorrente dizem onde você está sangrando. Urgência aumenta quando a prova está perto. A prioridade final é a soma desses sinais, porque estudar tudo com o mesmo peso é uma forma elegante de desperdiçar tempo.
                  </p>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
