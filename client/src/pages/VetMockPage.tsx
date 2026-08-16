import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, FileCheck, History, Loader2, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InteractiveQuiz, type QuizCompletionData } from "@/components/InteractiveQuiz";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { trpc } from "@/lib/trpc";
import { trpcClient } from "@/lib/trpcClient";
import { mapQuestao } from "@/services/questions.service";
import type { Question } from "@/types/question";
import type { VetEngineResult } from "@/lib/vetEngine";

type SimuladoMode = "ataque" | "consolidacao" | "manutencao" | "misto";
type PersistedItem = {
  id: string;
  position: number;
  strategic_content: string | null;
  block: "ataque" | "consolidacao" | "manutencao";
  question: Record<string, unknown>;
  answer?: { selectedOption: string; isCorrect: boolean; correctOption: string; resolution?: any[] } | null;
};
type SessionView = {
  session: { id: string; mode: SimuladoMode; status: string; total_questions: number };
  items: PersistedItem[];
};
type HistoryRow = {
  id: string; mode: SimuladoMode; status: string; total_questions: number;
  total_answered: number; accuracy: number | null; created_at: string;
};

const MODES: Array<{ value: SimuladoMode; label: string; description: string }> = [
  { value: "misto", label: "Misto VET", description: "5 Ataque + 4 Consolidação + 3 Manutenção, com backfill quando necessário." },
  { value: "ataque", label: "Ataque", description: "Conteúdos mais urgentes e frágeis." },
  { value: "consolidacao", label: "Consolidação", description: "Conteúdos em formação que precisam estabilizar." },
  { value: "manutencao", label: "Manutenção", description: "Conteúdos controlados que precisam permanecer ativos." },
];

export default function VetMockPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [analysis, setAnalysis] = useState<VetEngineResult | null>(null);
  const [mode, setMode] = useState<SimuladoMode>("misto");
  const [active, setActive] = useState<SessionView | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function loadBase() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [canonicalAnalysis, savedHistory] = await Promise.all([
        utils.vet.getAnalysis.fetch(),
        utils.vet.listMockHistory.fetch({ limit: 20, offset: 0 }),
      ]);
      setAnalysis(canonicalAnalysis as VetEngineResult | null);
      setHistory(savedHistory as HistoryRow[]);
    } catch (cause) {
      console.error("Erro ao carregar Simulado VET:", cause);
      setError("Não foi possível carregar o Simulado VET.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (!authLoading) void loadBase(); }, [authLoading, user?.id]);

  async function openSession(sessionId: string) {
    setStarting(true); setError("");
    try {
      const persisted = await utils.vet.getMockSession.fetch({ sessionId });
      const ordered = [...(persisted.items as PersistedItem[])].sort((a, b) => a.position - b.position);
      setActive({ session: persisted.session as SessionView["session"], items: ordered });
    } catch (cause) {
      console.error("Erro ao abrir sessão VET:", cause);
      setError("Não foi possível abrir esta sessão persistida.");
    } finally { setStarting(false); }
  }

  async function startSession() {
    setStarting(true); setError("");
    try {
      const created = await trpcClient.vet.createMockSession.mutate({ mode });
      await openSession(created.id);
      await loadBase();
    } catch (cause) {
      console.error("Erro ao criar sessão VET:", cause);
      setError("Não foi possível criar o simulado. Verifique se há questões suficientes para seu objetivo.");
    } finally { setStarting(false); }
  }

  async function completeSession(_completion: QuizCompletionData) {
    if (!active) return;
    await trpcClient.vet.completeMockSession.mutate({ sessionId: active.session.id });
    navigate(`/vet/simulado/resultado?sessionId=${active.session.id}`);
  }

  const questions = useMemo<Question[]>(() => active
    ? active.items.map(item => mapQuestao(item.question as any))
    : [], [active]);
  const initialAnswers = useMemo(() => Object.fromEntries((active?.items ?? []).flatMap((item, index) => item.answer ? [[index, item.answer]] : [])), [active]);

  if (loading || authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <header className="border-b bg-white/90 backdrop-blur"><div className="container flex items-center gap-4 py-4"><Link href="/vet"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link><div><h1 className="text-xl font-bold">Simulado VET</h1><p className="text-sm text-slate-500">Questões escolhidas e ordenadas exclusivamente pelo backend.</p></div></div></header>
      <main className="container space-y-6 py-8">
        {error && <Card className="border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</Card>}
        {!analysis ? <Card className="p-6"><p>Configure seu objetivo VET antes de iniciar um simulado.</p><Link href="/vet/objetivo"><Button className="mt-4">Configurar objetivo</Button></Link></Card> : null}

        {!active && analysis ? (
          <>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-600" /><div><h2 className="text-lg font-bold">Escolha o modo</h2><p className="text-sm text-slate-500">Trocar o modo não cria uma sessão. Ela só é criada ao clicar em iniciar.</p></div></div>
              <div className="grid gap-3 md:grid-cols-4">{MODES.map(item => <button key={item.value} type="button" onClick={() => setMode(item.value)} className={`rounded-2xl border p-4 text-left ${mode === item.value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}><strong>{item.label}</strong><p className="mt-1 text-xs text-slate-500">{item.description}</p></button>)}</div>
              <Button className="mt-5" onClick={() => void startSession()} disabled={starting}>{starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Iniciar simulado persistido</Button>
            </Card>

            <Card className="p-6"><div className="mb-4 flex items-center gap-2"><History className="h-5 w-5" /><h2 className="text-lg font-bold">Histórico de simulados</h2></div><div className="space-y-3">{history.length ? history.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold capitalize">{row.mode}</p><p className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString("pt-BR")} • {row.total_answered}/{row.total_questions} respondidas</p></div>{row.status === "completed" ? <Button variant="outline" onClick={() => navigate(`/vet/simulado/resultado?sessionId=${row.id}`)}>Ver resultado {row.accuracy == null ? "" : `(${Math.round(Number(row.accuracy))}%)`}</Button> : <Button variant="outline" onClick={() => void openSession(row.id)}><RotateCcw className="mr-2 h-4 w-4" />Continuar</Button>}</div>) : <p className="text-sm text-slate-500">Nenhum simulado persistido ainda.</p>}</div></Card>
          </>
        ) : null}

        {active ? <Card className="p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-lg font-bold capitalize">Simulado {active.session.mode}</h2></div><p className="mt-1 text-sm text-slate-500">{active.items.length} itens persistidos, renderizados por position.</p></div><Button variant="outline" onClick={() => setActive(null)}>Voltar aos modos</Button></div>{questions.length ? <InteractiveQuiz key={active.session.id} questions={questions} initialAnswers={initialAnswers} vetMockSessionId={active.session.id} onComplete={completeSession} /> : <p className="text-slate-600">Esta sessão não possui questões.</p>}</Card> : null}
      </main>
    </div>
  );
}
