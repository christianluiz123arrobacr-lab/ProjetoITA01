import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  Search,
  Loader2,
  AlertTriangle,
  Blocks,
  Image,
  Pencil,
  FileText,
} from "lucide-react";

type QuestionRow = {
  id: string;
  codigo?: string | null;
  enunciado?: string | null;
  disciplina?: string | null;
  diciplina?: string | null;
  conteudo?: string | null;
  assunto?: string | null;
  banca?: string | null;
  ano?: number | null;
};

type ResolutionRow = {
  id: string;
  questao_id: string;
  tipo?: string | null;
  url_imagem?: string | null;
};

type ResolutionSummary = {
  totalBlocks: number;
  totalImages: number;
};

function normalizarDisciplina(question: QuestionRow) {
  return question.disciplina || question.diciplina || "—";
}

function textoCurto(texto?: string | null, limite = 110) {
  const valor = (texto || "").trim();
  if (!valor) return "Sem enunciado";
  if (valor.length <= limite) return valor;
  return `${valor.slice(0, limite)}...`;
}

export default function AdminResolutionsPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const data = await trpcUtils.admin.listResolutionOverview.fetch();

        setQuestions(data.questions as QuestionRow[]);
        setResolutions(data.resolutions as ResolutionRow[]);
      } catch (err) {
        console.error(
          "Erro inesperado ao carregar módulo de resoluções:",
          err
        );
        setError("Ocorreu um erro inesperado ao carregar as resoluções.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [trpcUtils]);

  const resolutionMap = useMemo(() => {
    const map = new Map<string, ResolutionSummary>();

    for (const item of resolutions) {
      const current = map.get(item.questao_id) || {
        totalBlocks: 0,
        totalImages: 0,
      };

      current.totalBlocks += 1;

      if (
        (item.tipo || "").toLowerCase().trim() === "imagem" ||
        !!item.url_imagem
      ) {
        current.totalImages += 1;
      }

      map.set(item.questao_id, current);
    }

    return map;
  }, [resolutions]);

  const filteredQuestions = useMemo(() => {
    const termo = search.trim().toLowerCase();

    if (!termo) return questions;

    return questions.filter((q) => {
      const codigo = (q.codigo || "").toLowerCase();
      const enunciado = (q.enunciado || "").toLowerCase();
      const disciplina = normalizarDisciplina(q).toLowerCase();
      const conteudo = (q.conteudo || "").toLowerCase();
      const assunto = (q.assunto || "").toLowerCase();
      const banca = (q.banca || "").toLowerCase();
      const ano = String(q.ano || "");

      return (
        codigo.includes(termo) ||
        enunciado.includes(termo) ||
        disciplina.includes(termo) ||
        conteudo.includes(termo) ||
        assunto.includes(termo) ||
        banca.includes(termo) ||
        ano.includes(termo)
      );
    });
  }, [questions, search]);

  return (
    <AdminGuard>
      <AdminLayout
        title="Resoluções ADM"
        subtitle="Gerencie os blocos de resolução das questões, incluindo texto, latex e imagem."
      >
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Editor administrativo de resoluções
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total carregado: {filteredQuestions.length} de {questions.length} questões
              </p>
            </div>

            <div className="relative w-full xl:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, enunciado, disciplina, conteúdo..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Carregando resoluções...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1">
                  Erro ao carregar resoluções
                </h2>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </Card>
        ) : filteredQuestions.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Nenhuma questão encontrada
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Tente outro termo de busca.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const summary = resolutionMap.get(question.id) || {
                totalBlocks: 0,
                totalImages: 0,
              };

              return (
                <Card
                  key={question.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                          {question.codigo || "Sem código"}
                        </span>

                        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                          {normalizarDisciplina(question)}
                        </span>

                        <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                          {question.conteudo || "Sem conteúdo"}
                        </span>
                      </div>

                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {textoCurto(question.enunciado, 150)}
                      </p>

                      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">Assunto:</span>{" "}
                          {question.assunto || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">Banca:</span>{" "}
                          {question.banca || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">Ano:</span>{" "}
                          {question.ano || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">ID:</span>{" "}
                          {question.id}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-3 py-2 text-sm font-semibold text-orange-700 dark:text-orange-300">
                          <Blocks className="w-4 h-4" />
                          {summary.totalBlocks} bloco(s)
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          <Image className="w-4 h-4" />
                          {summary.totalImages} imagem(ns)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link href={`/admin/resolucoes/${question.id}`}>
                        <Button variant="outline" className="rounded-2xl">
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar resolução
                        </Button>
                      </Link>
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
