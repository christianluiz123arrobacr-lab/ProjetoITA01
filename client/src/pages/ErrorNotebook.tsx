import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type AttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: string;
  attempt_number: number;
  subject: string | null;
  conteudo: string | null;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  difficulty: string | null;
};

type ReviewStatusRow = {
  id: string;
  user_id: string;
  question_id: string;
  reviewed: boolean;
  reviewed_at: string | null;
  error_type: string | null;
  note: string | null;
};

type ErrorNotebookItem = {
  question_id: string;
  subject: string | null;
  conteudo: string | null;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  difficulty: string | null;
  last_error_at: string;
  last_time_spent_seconds: number | null;
  total_errors: number;
  max_attempt_number: number;
  reviewed: boolean;
  reviewed_at: string | null;
  error_type: string | null;
  note: string | null;
};

const ERROR_TYPE_OPTIONS = [
  { value: "atencao", label: "Atenção" },
  { value: "calculo", label: "Cálculo" },
  { value: "interpretacao", label: "Interpretação" },
  { value: "conceito", label: "Conceito" },
  { value: "chute", label: "Chute" },
  { value: "nao_soube_fazer", label: "Não soube fazer" },
] as const;

function formatSeconds(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function getErrorTypeLabel(errorType?: string | null) {
  return (
    ERROR_TYPE_OPTIONS.find((item) => item.value === errorType)?.label ??
    "Não definido"
  );
}

function buildNotebookItems(
  attempts: AttemptRow[],
  reviewStatusMap: Map<string, ReviewStatusRow>
): ErrorNotebookItem[] {
  const map = new Map<string, ErrorNotebookItem>();

  for (const attempt of attempts) {
    const existing = map.get(attempt.question_id);

    if (!existing) {
      const review = reviewStatusMap.get(attempt.question_id);

      map.set(attempt.question_id, {
        question_id: attempt.question_id,
        subject: attempt.subject,
        conteudo: attempt.conteudo,
        assunto: attempt.assunto,
        banca: attempt.banca,
        ano: attempt.ano,
        difficulty: attempt.difficulty,
        last_error_at: attempt.answered_at,
        last_time_spent_seconds: attempt.time_spent_seconds,
        total_errors: 1,
        max_attempt_number: attempt.attempt_number ?? 1,
        reviewed: review?.reviewed ?? false,
        reviewed_at: review?.reviewed_at ?? null,
        error_type: review?.error_type ?? null,
        note: review?.note ?? null,
      });
      continue;
    }

    existing.total_errors += 1;

    if ((attempt.attempt_number ?? 1) > existing.max_attempt_number) {
      existing.max_attempt_number = attempt.attempt_number ?? 1;
    }

    if (
      new Date(attempt.answered_at).getTime() >
      new Date(existing.last_error_at).getTime()
    ) {
      existing.last_error_at = attempt.answered_at;
      existing.last_time_spent_seconds = attempt.time_spent_seconds;
      existing.subject = attempt.subject;
      existing.conteudo = attempt.conteudo;
      existing.assunto = attempt.assunto;
      existing.banca = attempt.banca;
      existing.ano = attempt.ano;
      existing.difficulty = attempt.difficulty;
    }
  }

  return Array.from(map.values());
}

export default function ErrorNotebook() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const trpcUtils = trpc.useUtils();
  const upsertReviewStatusMutation = trpc.quiz.upsertErrorReviewStatus.useMutation();

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [reviewStatuses, setReviewStatuses] = useState<ReviewStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState("todas");
  const [conteudoFilter, setConteudoFilter] = useState("todos");
  const [assuntoFilter, setAssuntoFilter] = useState("todos");
  const [bancaFilter, setBancaFilter] = useState("todas");
  const [difficultyFilter, setDifficultyFilter] = useState("todas");
  const [sortBy, setSortBy] = useState("recentes");
  const [reviewFilter, setReviewFilter] = useState("todas");
  const [errorTypeFilter, setErrorTypeFilter] = useState("todos");

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setAttempts([]);
        setReviewStatuses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await trpcUtils.quiz.getErrorNotebook.fetch();
        const reviewData = (data.reviewStatuses as ReviewStatusRow[]) ?? [];

        setAttempts((data.attempts as AttemptRow[]) ?? []);
        setReviewStatuses(reviewData);
        setNoteDrafts(
          Object.fromEntries(
            reviewData.map((row) => [row.question_id, row.note ?? ""])
          )
        );
      } catch (error) {
        console.error("Erro ao buscar caderno de erros:", error);
        setError("Não foi possível carregar o caderno de erros.");
        setAttempts([]);
        setReviewStatuses([]);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [user?.id, authLoading, trpcUtils]);

  const reviewStatusMap = useMemo(() => {
    const map = new Map<string, ReviewStatusRow>();
    for (const row of reviewStatuses) {
      map.set(row.question_id, row);
    }
    return map;
  }, [reviewStatuses]);

  const notebookItems = useMemo(() => {
    return buildNotebookItems(attempts, reviewStatusMap);
  }, [attempts, reviewStatusMap]);

  const availableSubjects = useMemo(() => {
    return Array.from(
      new Set(
        notebookItems
          .map((item) => item.subject?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [notebookItems]);

  const filteredBySubject = useMemo(() => {
    if (subjectFilter === "todas") return notebookItems;
    return notebookItems.filter(
      (item) => (item.subject?.trim() || "") === subjectFilter
    );
  }, [notebookItems, subjectFilter]);

  const availableConteudos = useMemo(() => {
    return Array.from(
      new Set(
        filteredBySubject
          .map((item) => item.conteudo?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [filteredBySubject]);

  const filteredByConteudo = useMemo(() => {
    if (conteudoFilter === "todos") return filteredBySubject;
    return filteredBySubject.filter(
      (item) => (item.conteudo?.trim() || "") === conteudoFilter
    );
  }, [filteredBySubject, conteudoFilter]);

  const availableAssuntos = useMemo(() => {
    return Array.from(
      new Set(
        filteredByConteudo
          .map((item) => item.assunto?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [filteredByConteudo]);

  const filteredByAssunto = useMemo(() => {
    if (assuntoFilter === "todos") return filteredByConteudo;
    return filteredByConteudo.filter(
      (item) => (item.assunto?.trim() || "") === assuntoFilter
    );
  }, [filteredByConteudo, assuntoFilter]);

  const availableBancas = useMemo(() => {
    return Array.from(
      new Set(
        filteredByAssunto
          .map((item) => item.banca?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [filteredByAssunto]);

  const filteredByBanca = useMemo(() => {
    if (bancaFilter === "todas") return filteredByAssunto;
    return filteredByAssunto.filter(
      (item) => (item.banca?.trim() || "") === bancaFilter
    );
  }, [filteredByAssunto, bancaFilter]);

  const availableDifficulties = useMemo(() => {
    return Array.from(
      new Set(
        filteredByBanca
          .map((item) => item.difficulty?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [filteredByBanca]);

  const filteredItems = useMemo(() => {
    let result = [...filteredByBanca];

    if (difficultyFilter !== "todas") {
      result = result.filter(
        (item) => (item.difficulty?.trim() || "") === difficultyFilter
      );
    }

    if (reviewFilter === "pendentes") {
      result = result.filter((item) => !item.reviewed);
    } else if (reviewFilter === "revisadas") {
      result = result.filter((item) => item.reviewed);
    }

    if (errorTypeFilter !== "todos") {
      result = result.filter(
        (item) => (item.error_type?.trim() || "") === errorTypeFilter
      );
    }

    if (sortBy === "recentes") {
      result.sort(
        (a, b) =>
          new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime()
      );
    } else if (sortBy === "mais_erradas") {
      result.sort(
        (a, b) =>
          b.total_errors - a.total_errors ||
          new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime()
      );
    } else if (sortBy === "antigas") {
      result.sort(
        (a, b) =>
          new Date(a.last_error_at).getTime() - new Date(b.last_error_at).getTime()
      );
    }

    return result;
  }, [filteredByBanca, difficultyFilter, sortBy, reviewFilter, errorTypeFilter]);

  const recurringErrors = useMemo(() => {
    return filteredItems
      .filter((item) => item.total_errors >= 2)
      .sort(
        (a, b) =>
          b.total_errors - a.total_errors ||
          new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime()
      );
  }, [filteredItems]);

  const recentErrors = useMemo(() => {
    return [...filteredItems]
      .sort(
        (a, b) =>
          new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime()
      )
      .slice(0, 12);
  }, [filteredItems]);

  useEffect(() => {
    setConteudoFilter("todos");
    setAssuntoFilter("todos");
    setBancaFilter("todas");
    setDifficultyFilter("todas");
    setReviewFilter("todas");
    setErrorTypeFilter("todos");
  }, [subjectFilter]);

  useEffect(() => {
    setAssuntoFilter("todos");
    setBancaFilter("todas");
    setDifficultyFilter("todas");
    setReviewFilter("todas");
    setErrorTypeFilter("todos");
  }, [conteudoFilter]);

  useEffect(() => {
    setBancaFilter("todas");
    setDifficultyFilter("todas");
    setReviewFilter("todas");
    setErrorTypeFilter("todos");
  }, [assuntoFilter]);

  useEffect(() => {
    setDifficultyFilter("todas");
    setReviewFilter("todas");
    setErrorTypeFilter("todos");
  }, [bancaFilter]);

  async function upsertReviewRow(
    questionId: string,
    partial: {
      reviewed?: boolean;
      reviewed_at?: string | null;
      error_type?: string | null;
      note?: string | null;
    }
  ) {
    if (!user?.id) return;

    const existing = reviewStatusMap.get(questionId);

    const payload = {
      user_id: user.id,
      question_id: questionId,
      reviewed: partial.reviewed ?? existing?.reviewed ?? false,
      reviewed_at:
        partial.reviewed === false
          ? null
          : partial.reviewed_at ?? existing?.reviewed_at ?? null,
      error_type:
        partial.error_type !== undefined
          ? partial.error_type
          : existing?.error_type ?? null,
      note:
        partial.note !== undefined
          ? partial.note
          : existing?.note ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      const data = await upsertReviewStatusMutation.mutateAsync({
        questionId,
        reviewed: payload.reviewed,
        reviewedAt: payload.reviewed_at,
        errorType: payload.error_type,
        note: payload.note,
      });

      if (data) {
        setReviewStatuses((prev) => {
          const filtered = prev.filter((item) => item.question_id !== questionId);
          return [...filtered, data as ReviewStatusRow];
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status de revisão:", error);
    }
  }

  async function updateReviewStatus(questionId: string, reviewed: boolean) {
    if (!user?.id) return;

    try {
      setSavingQuestionId(questionId);

      await upsertReviewRow(questionId, {
        reviewed,
        reviewed_at: reviewed ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.error("Erro inesperado ao atualizar revisão:", err);
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function updateErrorType(questionId: string, errorType: string) {
    if (!user?.id) return;

    try {
      setSavingQuestionId(questionId);

      await upsertReviewRow(questionId, {
        error_type: errorType || null,
      });
    } catch (err) {
      console.error("Erro inesperado ao atualizar tipo do erro:", err);
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function saveNote(questionId: string) {
    if (!user?.id) return;

    try {
      setSavingQuestionId(questionId);

      await upsertReviewRow(questionId, {
        note: (noteDrafts[questionId] ?? "").trim() || null,
      });
    } catch (err) {
      console.error("Erro inesperado ao salvar anotação:", err);
    } finally {
      setSavingQuestionId(null);
    }
  }

  function renderNoteEditor(item: ErrorNotebookItem) {
    return (
      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FileText className="w-4 h-4" />
          Anotação
        </label>

        <textarea
          value={noteDrafts[item.question_id] ?? item.note ?? ""}
          onChange={(e) =>
            setNoteDrafts((prev) => ({
              ...prev,
              [item.question_id]: e.target.value,
            }))
          }
          placeholder="Ex.: confundi a fórmula, revisar esse conceito, erro de sinal..."
          className="w-full min-h-[96px] rounded-xl border border-slate-300 px-3 py-3 bg-white text-sm"
        />

        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            onClick={() => saveNote(item.question_id)}
            disabled={savingQuestionId === item.question_id}
          >
            Salvar anotação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/progress">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Caderno de Erros</h1>
        </div>
      </header>

      <section className="container py-6 md:py-12 space-y-8">
        {authLoading || loading ? (
          <Card className="p-8">
            <p className="text-slate-600">Carregando caderno de erros...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="text-red-700 font-medium">{error}</p>
          </Card>
        ) : !user ? (
          <Card className="p-8">
            <p className="text-slate-700 font-medium">
              Você precisa estar logado para ver seu caderno de erros.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-slate-900">Filtros</h2>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-8 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Disciplina
                  </label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todas">Todas</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Conteúdo
                  </label>
                  <select
                    value={conteudoFilter}
                    onChange={(e) => setConteudoFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todos">Todos</option>
                    {availableConteudos.map((conteudo) => (
                      <option key={conteudo} value={conteudo}>
                        {conteudo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Assunto
                  </label>
                  <select
                    value={assuntoFilter}
                    onChange={(e) => setAssuntoFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todos">Todos</option>
                    {availableAssuntos.map((assunto) => (
                      <option key={assunto} value={assunto}>
                        {assunto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Banca
                  </label>
                  <select
                    value={bancaFilter}
                    onChange={(e) => setBancaFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todas">Todas</option>
                    {availableBancas.map((banca) => (
                      <option key={banca} value={banca}>
                        {banca}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todas">Todas</option>
                    {availableDifficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Revisão
                  </label>
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todas">Todas</option>
                    <option value="pendentes">Pendentes</option>
                    <option value="revisadas">Revisadas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo de erro
                  </label>
                  <select
                    value={errorTypeFilter}
                    onChange={(e) => setErrorTypeFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="todos">Todos</option>
                    {ERROR_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="mais_erradas">Mais erradas</option>
                    <option value="antigas">Mais antigas</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-sm text-slate-500 mb-2">Questões no caderno</p>
                <p className="text-3xl font-bold text-slate-900">{filteredItems.length}</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-slate-500 mb-2">Erros recorrentes</p>
                <p className="text-3xl font-bold text-red-600">{recurringErrors.length}</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-slate-500 mb-2">Questões revisadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {filteredItems.filter((item) => item.reviewed).length}
                </p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-slate-500 mb-2">Total de erros no filtro</p>
                <p className="text-3xl font-bold text-orange-600">
                  {filteredItems.reduce((sum, item) => sum + item.total_errors, 0)}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-slate-900">Erros recorrentes</h2>
              </div>

              {recurringErrors.length > 0 ? (
                <div className="space-y-4">
                  {recurringErrors.map((item) => (
                    <div
                      key={item.question_id}
                      className={`rounded-2xl p-5 border ${
                        item.reviewed
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900">
                            {item.subject ?? "Sem disciplina"} •{" "}
                            {item.conteudo ?? "Sem conteúdo"}
                            {item.assunto ? ` • ${item.assunto}` : ""}
                          </p>

                          <p className="text-sm text-slate-600">
                            {item.banca ?? "Sem banca"}
                            {item.ano ? ` • ${item.ano}` : ""}
                            {item.difficulty ? ` • ${item.difficulty}` : ""}
                          </p>

                          <p className="text-sm font-semibold text-red-700">
                            {item.total_errors} erro(s) nessa questão
                          </p>

                          <p className="text-sm text-red-600 font-semibold">
                            Último erro em: {new Date(item.last_error_at).toLocaleString("pt-BR")}
                          </p>

                          <p className="text-sm text-slate-500">
                            Tempo gasto: {formatSeconds(item.last_time_spent_seconds)}
                          </p>

                          <p className="text-sm text-slate-700">
                            Tipo de erro:{" "}
                            <span className="font-semibold">
                              {getErrorTypeLabel(item.error_type)}
                            </span>
                          </p>

                          <p className={`text-sm font-semibold ${item.reviewed ? "text-green-700" : "text-yellow-700"}`}>
                            {item.reviewed
                              ? `Revisada em ${item.reviewed_at ? new Date(item.reviewed_at).toLocaleString("pt-BR") : "-"}`
                              : "Revisão pendente"}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={item.error_type ?? ""}
                            onChange={(e) => updateErrorType(item.question_id, e.target.value)}
                            disabled={savingQuestionId === item.question_id}
                            className="rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm"
                          >
                            <option value="">Tipo do erro</option>
                            {ERROR_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <Link href="/banco-de-questoes">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                              Revisar no banco
                            </Button>
                          </Link>

                          {item.reviewed ? (
                            <Button
                              variant="outline"
                              onClick={() => updateReviewStatus(item.question_id, false)}
                              disabled={savingQuestionId === item.question_id}
                            >
                              Marcar pendente
                            </Button>
                          ) : (
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateReviewStatus(item.question_id, true)}
                              disabled={savingQuestionId === item.question_id}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar revisada
                            </Button>
                          )}
                        </div>
                      </div>

                      {renderNoteEditor(item)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Nenhum erro recorrente encontrado com os filtros atuais.
                </p>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Questões para revisar
                </h2>
                <span className="text-sm font-semibold text-slate-500">
                  {filteredItems.length} questão(ões)
                </span>
              </div>

              {filteredItems.length > 0 ? (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.question_id}
                      className={`rounded-2xl p-5 border ${
                        item.reviewed
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900">
                            {item.subject ?? "Sem disciplina"} •{" "}
                            {item.conteudo ?? "Sem conteúdo"}
                            {item.assunto ? ` • ${item.assunto}` : ""}
                          </p>

                          <p className="text-sm text-slate-600">
                            {item.banca ?? "Sem banca"}
                            {item.ano ? ` • ${item.ano}` : ""}
                            {item.difficulty ? ` • ${item.difficulty}` : ""}
                          </p>

                          <p className="text-sm font-semibold text-red-700">
                            {item.total_errors} erro(s) nessa questão
                          </p>

                          <p className="text-sm text-red-600 font-semibold">
                            Último erro em: {new Date(item.last_error_at).toLocaleString("pt-BR")}
                          </p>

                          <p className="text-sm text-slate-500">
                            Tempo gasto: {formatSeconds(item.last_time_spent_seconds)}
                          </p>

                          <p className="text-sm text-slate-700">
                            Tipo de erro:{" "}
                            <span className="font-semibold">
                              {getErrorTypeLabel(item.error_type)}
                            </span>
                          </p>

                          <p className={`text-sm font-semibold ${item.reviewed ? "text-green-700" : "text-yellow-700"}`}>
                            {item.reviewed
                              ? `Revisada em ${item.reviewed_at ? new Date(item.reviewed_at).toLocaleString("pt-BR") : "-"}`
                              : "Revisão pendente"}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={item.error_type ?? ""}
                            onChange={(e) => updateErrorType(item.question_id, e.target.value)}
                            disabled={savingQuestionId === item.question_id}
                            className="rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm"
                          >
                            <option value="">Tipo do erro</option>
                            {ERROR_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <Link href="/banco-de-questoes">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                              Revisar no banco
                            </Button>
                          </Link>

                          {item.reviewed ? (
                            <Button
                              variant="outline"
                              onClick={() => updateReviewStatus(item.question_id, false)}
                              disabled={savingQuestionId === item.question_id}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Marcar pendente
                            </Button>
                          ) : (
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateReviewStatus(item.question_id, true)}
                              disabled={savingQuestionId === item.question_id}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar revisada
                            </Button>
                          )}
                        </div>
                      </div>

                      {renderNoteEditor(item)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Nenhuma questão errada encontrada com os filtros atuais.
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Erros recentes
              </h2>

              {recentErrors.length > 0 ? (
                <div className="space-y-4">
                  {recentErrors.map((item) => (
                    <div
                      key={item.question_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900">
                            {item.subject ?? "Sem disciplina"} •{" "}
                            {item.conteudo ?? "Sem conteúdo"}
                            {item.assunto ? ` • ${item.assunto}` : ""}
                          </p>

                          <p className="text-sm text-slate-600">
                            {item.banca ?? "Sem banca"}
                            {item.ano ? ` • ${item.ano}` : ""}
                            {item.difficulty ? ` • ${item.difficulty}` : ""}
                          </p>

                          <p className="text-sm text-red-600 font-semibold">
                            Último erro em: {new Date(item.last_error_at).toLocaleString("pt-BR")}
                          </p>

                          <p className="text-sm text-slate-700">
                            Tipo do erro:{" "}
                            <span className="font-semibold">
                              {getErrorTypeLabel(item.error_type)}
                            </span>
                          </p>

                          <p className={`text-sm font-semibold ${item.reviewed ? "text-green-700" : "text-yellow-700"}`}>
                            {item.reviewed ? "Revisada" : "Pendente"}
                          </p>
                        </div>

                        <div className="text-sm text-slate-500">
                          {item.total_errors} erro(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Nenhum erro recente encontrado com os filtros atuais.
                </p>
              )}
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
