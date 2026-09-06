import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileJson, Loader2, RefreshCw, Trash2, Upload, XCircle } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  MAX_QUESTION_IMPORT_JSON_BYTES,
  parseQuestionImportJsonText,
  summarizeQuestionImport,
  validateQuestionImportItem,
  type NormalizedQuestionImportItem,
  type QuestionImportBatch,
  type QuestionImportPreviewItem,
} from "@shared/questionImportSchema";

type ImportResult = {
  index: number;
  importSourceId: string;
  status: "criada" | "duplicada" | "falhou";
  questionId: string | null;
  codigo: string | null;
  resolutionBlocksSaved: number;
  message: string;
};

type SuggestionRow = {
  conteudo?: string | null;
  conteudos?: string[] | null;
  assunto?: string | null;
  assuntos?: string[] | null;
  assuntos_por_conteudo?: unknown;
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getExistingSets(rows: SuggestionRow[] | undefined) {
  const conteudos = new Set<string>();
  const assuntos = new Set<string>();

  for (const row of rows ?? []) {
    [row.conteudo, ...(Array.isArray(row.conteudos) ? row.conteudos : [])]
      .filter(Boolean)
      .forEach((value) => conteudos.add(normalizeKey(String(value))));
    [row.assunto, ...(Array.isArray(row.assuntos) ? row.assuntos : [])]
      .filter(Boolean)
      .forEach((value) => assuntos.add(normalizeKey(String(value))));

    if (Array.isArray(row.assuntos_por_conteudo)) {
      row.assuntos_por_conteudo.forEach((item) => {
        const raw = item as { conteudo?: unknown; assuntos?: unknown };
        if (typeof raw.conteudo === "string") conteudos.add(normalizeKey(raw.conteudo));
        if (Array.isArray(raw.assuntos)) raw.assuntos.forEach((assunto) => assuntos.add(normalizeKey(String(assunto))));
      });
    }
  }

  return { conteudos, assuntos };
}

function enrichItemWithCatalogWarnings(
  preview: QuestionImportPreviewItem,
  existing: { conteudos: Set<string>; assuntos: Set<string> }
): QuestionImportPreviewItem {
  const warnings = new Set(preview.warnings);
  preview.item.conteudos.forEach((conteudo) => {
    if (!existing.conteudos.has(normalizeKey(conteudo))) warnings.add(`Conteúdo novo: ${conteudo}.`);
  });
  preview.item.assuntos.forEach((assunto) => {
    if (!existing.assuntos.has(normalizeKey(assunto))) warnings.add(`Assunto novo: ${assunto}.`);
  });
  return { ...preview, warnings: Array.from(warnings) };
}

function getSelectedValidQuestions(batch: QuestionImportBatch | null, selected: Set<number>) {
  return (batch?.questoes ?? [])
    .filter((item) => selected.has(item.index) && item.status === "valida")
    .map((item) => item.item);
}

function StatusPill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

export default function AdminQuestionBatchImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsQuery = trpc.admin.getQuestionSuggestions.useQuery();
  const importMutation = trpc.admin.importQuestionBatch.useMutation();

  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [batch, setBatch] = useState<QuestionImportBatch | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState("");

  const existingSets = useMemo(() => getExistingSets(suggestionsQuery.data as SuggestionRow[] | undefined), [suggestionsQuery.data]);

  const visibleItems = useMemo(() => {
    return (batch?.questoes ?? [])
      .filter((item) => !removed.has(item.index))
      .map((item) => enrichItemWithCatalogWarnings(item, existingSets));
  }, [batch, existingSets, removed]);

  const visibleSummary = useMemo(() => summarizeQuestionImport(visibleItems), [visibleItems]);
  const newContents = useMemo(() => new Set(visibleItems.flatMap((preview) => preview.item.conteudos.filter((value) => !existingSets.conteudos.has(normalizeKey(value))))).size, [existingSets.conteudos, visibleItems]);
  const newSubjects = useMemo(() => new Set(visibleItems.flatMap((preview) => preview.item.assuntos.filter((value) => !existingSets.assuntos.has(normalizeKey(value))))).size, [existingSets.assuntos, visibleItems]);
  const validIndexes = useMemo(() => visibleItems.filter((item) => item.status === "valida").map((item) => item.index), [visibleItems]);
  const selectedValidCount = validIndexes.filter((index) => selected.has(index)).length;
  const resultMap = useMemo(() => new Map(results.map((result) => [result.index, result])), [results]);

  async function loadFile(file: File) {
    setError("");
    setResults([]);
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setError("Selecione um arquivo .json válido.");
      return;
    }
    if (file.size > MAX_QUESTION_IMPORT_JSON_BYTES) {
      setError("O JSON excede o limite inicial de 2 MB.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseQuestionImportJsonText(text);
      const valid = parsed.questoes.filter((item) => item.status === "valida").map((item) => item.index);
      setFileInfo({ name: file.name, size: file.size });
      setBatch(parsed);
      setRemoved(new Set());
      setExpanded(new Set());
      setSelected(new Set(valid));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o JSON.");
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  function clearBatch() {
    setFileInfo(null);
    setBatch(null);
    setSelected(new Set());
    setRemoved(new Set());
    setExpanded(new Set());
    setResults([]);
    setError("");
  }

  async function importQuestions(questions: NormalizedQuestionImportItem[]) {
    if (!batch || questions.length === 0 || importMutation.isPending) return;
    setError("");
    const refreshedQuestions = questions.map((question) => validateQuestionImportItem(question)).filter((item) => item.status === "valida").map((item) => item.item);
    if (refreshedQuestions.length === 0) {
      setError("Nenhuma questão válida selecionada para importar.");
      return;
    }
    const response = await importMutation.mutateAsync({ batchId: batch.batchId, questions: refreshedQuestions });
    setResults(response.results as ImportResult[]);
    const failed = new Set(response.results.filter((result) => result.status === "falhou").map((result) => result.index));
    setSelected(failed);
  }

  function retryFailed() {
    if (!batch) return;
    const failed = new Set(results.filter((result) => result.status === "falhou").map((result) => result.index));
    const questions = (batch.questoes ?? []).filter((item) => failed.has(item.index)).map((item) => item.item);
    void importQuestions(questions);
  }

  const finalReport = results.length > 0 ? {
    criadas: results.filter((result) => result.status === "criada").length,
    duplicadas: results.filter((result) => result.status === "duplicada").length,
    falhas: results.filter((result) => result.status === "falhou").length,
    resolucoes: results.reduce((sum, result) => sum + result.resolutionBlocksSaved, 0),
  } : null;

  return (
    <AdminGuard>
      <AdminLayout title="Importar lote JSON" subtitle="Valide, revise e importe várias questões com resoluções pelo backend tRPC.">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/questoes">
            <Button variant="outline" className="rounded-2xl"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para questões</Button>
          </Link>
          <Link href="/admin/questoes/nova">
            <Button variant="outline" className="rounded-2xl">Importador individual</Button>
          </Link>
        </div>

        {error ? <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-5 text-red-700 dark:text-red-300"><div className="flex gap-3"><AlertTriangle className="h-5 w-5" /><p className="font-medium">{error}</p></div></Card> : null}

        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-8 text-center"
          >
            <FileJson className="mx-auto h-10 w-10 text-slate-500 dark:text-slate-400" />
            <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">Selecione ou arraste um JSON</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aceita o novo formato com <code>questoes</code> e o JSON antigo de questão única. Limite: {formatBytes(MAX_QUESTION_IMPORT_JSON_BYTES)}.</p>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileInput} />
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button className="rounded-2xl" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Escolher arquivo JSON</Button>
              {fileInfo ? <Button variant="outline" className="rounded-2xl" onClick={clearBatch}><Trash2 className="mr-2 h-4 w-4" />Remover arquivo</Button> : null}
            </div>
            {fileInfo ? <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">{fileInfo.name} · {formatBytes(fileInfo.size)}</p> : null}
          </div>
        </Card>

        {batch ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
              {[
                ["Total", visibleSummary.total],
                ["Válidas", visibleSummary.validas],
                ["Com aviso", visibleSummary.comAvisos],
                ["Inválidas", visibleSummary.invalidas],
                ["Blocos", visibleSummary.totalBlocosResolucao],
                ["Conteúdos novos", newContents],
                ["Assuntos novos", newSubjects],
              ].map(([label, value]) => (
                <Card key={label} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p></Card>
              ))}
            </div>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-2xl" onClick={() => setSelected(new Set(validIndexes))}>Selecionar todas as válidas</Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => setSelected(new Set())}>Desmarcar todas</Button>
                <Button className="rounded-2xl" disabled={selectedValidCount === 0 || importMutation.isPending} onClick={() => void importQuestions(getSelectedValidQuestions(batch, selected))}>
                  {importMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Importar {selectedValidCount} selecionada(s)
                </Button>
                <Button variant="outline" className="rounded-2xl" disabled={!results.some((result) => result.status === "falhou") || importMutation.isPending} onClick={retryFailed}><RefreshCw className="mr-2 h-4 w-4" />Tentar falhas</Button>
                <Button variant="outline" className="rounded-2xl" onClick={clearBatch}>Limpar lote</Button>
              </div>
            </Card>

            {finalReport ? (
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-5 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5" /><div><p className="font-bold">Relatório final</p><p className="text-sm">Criadas: {finalReport.criadas} · Duplicadas: {finalReport.duplicadas} · Falhas: {finalReport.falhas} · Resoluções salvas: {finalReport.resolucoes}</p></div></div>
              </Card>
            ) : null}

            <div className="space-y-4">
              {visibleItems.map((preview) => {
                const item = preview.item;
                const result = resultMap.get(preview.index);
                const isExpanded = expanded.has(preview.index);
                return (
                  <Card key={preview.index} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <input type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 dark:border-slate-700" checked={selected.has(preview.index)} disabled={preview.status !== "valida" || importMutation.isPending} onChange={(event) => setSelected((prev) => { const next = new Set(prev); event.target.checked ? next.add(preview.index) : next.delete(preview.index); return next; })} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill className={preview.status === "valida" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"}>#{preview.index + 1} {preview.status}</StatusPill>
                          {result ? <StatusPill className={result.status === "criada" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : result.status === "duplicada" ? "border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"}>{result.status}</StatusPill> : null}
                          <StatusPill className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">{item.disciplina || "Sem disciplina"}</StatusPill>
                          <StatusPill className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">{item.dificuldade || "Sem dificuldade"}</StatusPill>
                        </div>
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{item.enunciado || "Sem enunciado"}</p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                          <p><b>Conteúdos:</b> {item.conteudos.join(", ") || "—"}</p>
                          <p><b>Assuntos:</b> {item.assuntos.join(", ") || "—"}</p>
                          <p><b>Alternativas:</b> {preview.alternativas_preenchidas} · correta {item.alternativa_correta || "—"}</p>
                          <p><b>Resolução:</b> {preview.resolution_blocks_count} bloco(s)</p>
                        </div>
                        {preview.errors.length ? <div className="mt-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300"><b>Erros:</b> {preview.errors.join(" ")}</div> : null}
                        {preview.warnings.length ? <div className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200"><b>Avisos:</b> {preview.warnings.join(" ")}</div> : null}
                        {result ? <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-300"><b>Resultado:</b> {result.message}</div> : null}
                        {isExpanded ? (
                          <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(item, null, 2)}</pre>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" className="rounded-2xl" onClick={() => setExpanded((prev) => { const next = new Set(prev); next.has(preview.index) ? next.delete(preview.index) : next.add(preview.index); return next; })}>{isExpanded ? "Recolher" : "Expandir"}</Button>
                        <Button variant="outline" className="rounded-2xl text-red-700 dark:text-red-300" onClick={() => { setRemoved((prev) => new Set(prev).add(preview.index)); setSelected((prev) => { const next = new Set(prev); next.delete(preview.index); return next; }); }}><XCircle className="mr-2 h-4 w-4" />Retirar</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : null}
      </AdminLayout>
    </AdminGuard>
  );
}
