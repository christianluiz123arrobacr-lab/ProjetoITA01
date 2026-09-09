import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";

type ReportStatus = "pendente" | "em_analise" | "resolvido" | "ignorado";

type QuestionReportRow = {
  id: string;
  question_id: string;
  user_id?: string | null;
  report_type: string;
  comment?: string | null;
  status: ReportStatus | string;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type QuestionRow = {
  id: string;
  codigo?: string | null;
  disciplina?: string | null;
  diciplina?: string | null;
  conteudo?: string | null;
  conteudos?: string[] | null;
  assunto?: string | null;
  assuntos?: string[] | null;
  banca?: string | null;
  ano?: number | null;
  dificuldade?: string | null;
  instituição?: string | null;
  enunciado?: string | null;
};

type ProfileRow = {
  id: string;
  nome?: string | null;
  email?: string | null;
};

const STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: "pendente", label: "Pendente" },
  { value: "em_analise", label: "Em análise" },
  { value: "resolvido", label: "Resolvido" },
  { value: "ignorado", label: "Ignorado" },
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  enunciado: "Enunciado com erro",
  alternativa: "Alternativa com erro",
  gabarito: "Gabarito incorreto",
  resolucao: "Resolução confusa",
  imagem: "Imagem quebrada",
  latex: "Formatação/LaTeX bugado",
  outro: "Outro",
};

function formatDate(date?: string | null) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Sem data";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarDisciplina(row?: QuestionRow) {
  return row?.disciplina || row?.diciplina || "—";
}

function normalizarLista(valores?: string[] | null, fallback?: string | null) {
  const itens = Array.isArray(valores) ? valores : [];
  const base = itens.length > 0 ? itens : fallback ? [fallback] : [];

  return Array.from(
    new Set(
      base
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );
}

function listarConteudos(row?: QuestionRow) {
  if (!row) return [];
  return normalizarLista(row.conteudos, row.conteudo);
}

function listarAssuntos(row?: QuestionRow) {
  if (!row) return [];
  return normalizarLista(row.assuntos, row.assunto);
}

function textoLista(valores: string[]) {
  return valores.length > 0 ? valores.join(", ") : "—";
}

function textoCurto(texto?: string | null, limite = 120) {
  const valor = (texto || "").trim();

  if (!valor) return "Sem enunciado";
  if (valor.length <= limite) return valor;

  return `${valor.slice(0, limite)}...`;
}

function getReportTypeLabel(type?: string | null) {
  const key = normalizeText(type);

  return REPORT_TYPE_LABELS[key] || type || "Tipo não informado";
}

function getStatusMeta(status?: string | null) {
  const value = normalizeText(status);

  if (value === "resolvido") {
    return {
      label: "Resolvido",
      className: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle2,
    };
  }

  if (value === "em_analise") {
    return {
      label: "Em análise",
      className: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      icon: Wrench,
    };
  }

  if (value === "ignorado") {
    return {
      label: "Ignorado",
      className: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      icon: ShieldAlert,
    };
  }

  return {
    label: "Pendente",
    className: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock3,
  };
}

function getDifficultyClass(difficulty?: string | null) {
  const value = normalizeText(difficulty);

  if (value === "facil") return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (value === "medio") return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  if (value === "dificil") return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";

  return "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
}

function getReporterName(profile?: ProfileRow) {
  if (!profile) return "Usuário não encontrado";
  return profile.nome?.trim() || profile.email?.trim() || "Usuário sem nome";
}

export default function AdminQuestionReportsPage() {
  const trpcUtils = trpc.useUtils();
  const updateQuestionReportMutation = trpc.admin.updateQuestionReport.useMutation();
  const [reports, setReports] = useState<QuestionReportRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await trpcUtils.admin.listQuestionReports.fetch();

      setReports((data.reports as QuestionReportRow[]) ?? []);
      setQuestions((data.questions as QuestionRow[]) ?? []);
      setProfiles((data.profiles as ProfileRow[]) ?? []);
    } catch (err) {
      console.error("Erro inesperado ao carregar reports:", err);
      setError("Ocorreu um erro inesperado ao carregar os erros reportados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const questionMap = useMemo(() => {
    const map = new Map<string, QuestionRow>();

    questions.forEach((question) => {
      map.set(question.id, question);
    });

    return map;
  }, [questions]);

  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileRow>();

    profiles.forEach((profile) => {
      map.set(profile.id, profile);
    });

    return map;
  }, [profiles]);

  const statusCounts = useMemo(() => {
    return reports.reduce<Record<string, number>>((acc, report) => {
      const status = report.status || "pendente";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [reports]);

  const reportTypeOptions = useMemo(() => {
    return Array.from(
      new Set(reports.map((report) => report.report_type).filter(Boolean))
    ).sort((a, b) => getReportTypeLabel(a).localeCompare(getReportTypeLabel(b), "pt-BR"));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const term = normalizeText(search);

    return reports.filter((report) => {
      const question = questionMap.get(report.question_id);
      const profile = report.user_id ? profileMap.get(report.user_id) : undefined;

      const searchableText = [
        report.id,
        report.question_id,
        report.report_type,
        getReportTypeLabel(report.report_type),
        report.comment,
        report.status,
        report.admin_note,
        question?.codigo,
        question?.enunciado,
        question?.banca,
        question?.ano,
        question?.instituição,
        normalizarDisciplina(question),
        textoLista(listarConteudos(question)),
        textoLista(listarAssuntos(question)),
        getReporterName(profile),
        profile?.email,
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      const matchesSearch = !term || searchableText.includes(term);
      const matchesStatus = !statusFilter || report.status === statusFilter;
      const matchesType = !typeFilter || report.report_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reports, questionMap, profileMap, search, statusFilter, typeFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  }

  async function updateReport(
    report: QuestionReportRow,
    updates: Partial<Pick<QuestionReportRow, "status" | "admin_note">>
  ) {
    try {
      setSavingId(report.id);
      setError("");
      setSuccessMessage("");

      const updatedReport = await updateQuestionReportMutation.mutateAsync({
        id: report.id,
        status: updates.status as ReportStatus | undefined,
        adminNote: updates.admin_note,
      });

      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id ? (updatedReport as QuestionReportRow) : item
        )
      );

      setSuccessMessage("Erro reportado atualizado com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao atualizar report:", err);
      setError("Ocorreu um erro inesperado ao atualizar o erro reportado.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Erros reportados"
        subtitle="Acompanhe problemas enviados pelos alunos nas questões do banco."
      >
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <MessageSquareWarning className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Central de reports
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Exibindo {filteredReports.length} de {reports.length} reports carregados.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full xl:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por código, usuário, comentário..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
          </div>
        </Card>

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_OPTIONS.map((status) => {
            const meta = getStatusMeta(status.value);
            const Icon = meta.icon;

            return (
              <Card key={status.value} className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${meta.className}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {statusCounts[status.value] || 0}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {status.label}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tipo do problema
              </label>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                <option value="">Todos</option>
                {reportTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {getReportTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full rounded-2xl"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="p-5 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          </Card>
        ) : null}

        {successMessage ? (
          <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">{successMessage}</p>
            </div>
          </Card>
        ) : null}

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Carregando erros reportados...</p>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="p-10 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <MessageSquareWarning className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Nenhum report encontrado
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Ainda não há erro reportado para os filtros selecionados.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const question = questionMap.get(report.question_id);
              const profile = report.user_id
                ? profileMap.get(report.user_id)
                : undefined;
              const statusMeta = getStatusMeta(report.status);
              const StatusIcon = statusMeta.icon;

              return (
                <Card
                  key={report.id}
                  className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusMeta.label}
                        </span>

                        <span className="inline-flex rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                          {getReportTypeLabel(report.report_type)}
                        </span>

                        {question?.dificuldade ? (
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDifficultyClass(question.dificuldade)}`}>
                            {question.dificuldade}
                          </span>
                        ) : null}

                        <span className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {formatDate(report.created_at)}
                        </span>
                      </div>

                      <div className="mb-5">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {question?.codigo
                            ? `Questão ${question.codigo}`
                            : `Questão ${report.question_id}`}
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {textoCurto(question?.enunciado)}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Instituição
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {question?.instituição || question?.banca || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Ano
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {question?.ano || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Disciplina
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {normalizarDisciplina(question)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Usuário
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {getReporterName(profile)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mb-5">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                            Conteúdos
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {textoLista(listarConteudos(question))}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                            Assuntos
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {textoLista(listarAssuntos(question))}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 mb-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300 mb-2">
                          Comentário do aluno
                        </p>
                        <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                          {report.comment?.trim() || "Sem comentário."}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Nota interna do ADM
                        </label>

                        <textarea
                          value={report.admin_note || ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setReports((prev) =>
                              prev.map((item) =>
                                item.id === report.id
                                  ? { ...item, admin_note: value }
                                  : item
                              )
                            );
                          }}
                          placeholder="Ex.: Corrigir gabarito, revisar resolução, imagem quebrada..."
                          rows={3}
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                        />
                      </div>
                    </div>

                    <div className="xl:w-64 shrink-0 space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Status
                        </label>

                        <select
                          value={report.status || "pendente"}
                          onChange={(event) =>
                            updateReport(report, {
                              status: event.target.value as ReportStatus,
                            })
                          }
                          disabled={savingId === report.id}
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        onClick={() =>
                          updateReport(report, {
                            admin_note: report.admin_note || "",
                          })
                        }
                        disabled={savingId === report.id}
                        className="w-full rounded-2xl"
                      >
                        {savingId === report.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Pencil className="w-4 h-4 mr-2" />
                            Salvar nota
                          </>
                        )}
                      </Button>

                      {question ? (
                        <>
                          <Link href={`/admin/questoes/${question.id}`}>
                            <Button variant="outline" className="w-full rounded-2xl">
                              <FileText className="w-4 h-4 mr-2" />
                              Editar questão
                            </Button>
                          </Link>

                          <Link href={`/admin/resolucoes/${question.id}`}>
                            <Button variant="outline" className="w-full rounded-2xl">
                              <Wrench className="w-4 h-4 mr-2" />
                              Editar resolução
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
                          Questão não encontrada no banco.
                        </div>
                      )}

                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          ID do report
                        </p>
                        <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                          {report.id}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          ID da questão
                        </p>
                        <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                          {report.question_id}
                        </p>
                      </div>

                      {question ? (
                        <Link href={`/banco-de-questoes`}>
                          <Button variant="outline" className="w-full rounded-2xl">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir banco
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
