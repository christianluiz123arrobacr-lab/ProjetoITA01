import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useRoute } from "wouter";
import {
  StudyCanvasWorkspace,
  type StudyCanvasDocument,
  type StudyCanvasPersistence,
} from "@/components/study-canvas/StudyCanvasWorkspace";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  NOTEBOOK_AUTOSAVE_MS,
  type NotebookDocument,
  type NotebookElement,
  type NotebookPaperSize,
} from "@/lib/notebookDocument";
import type { ScratchpadStroke } from "@/services/question-notes.service";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

function elementToStroke(value: unknown): ScratchpadStroke | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ScratchpadStroke>;
  if (typeof candidate.id === "string" && typeof candidate.tool === "string" && Array.isArray(candidate.points)) {
    return candidate as ScratchpadStroke;
  }
  const element = value as NotebookElement;
  if (typeof element.id !== "string" || !Array.isArray(element.points)) return null;
  const shape = element.type === "circle" ? "ellipse" : element.type === "rectangle" ? "rectangle" : element.type === "triangle" ? "triangle" : element.type === "arrow" ? "arrow" : element.type === "line" ? "line" : undefined;
  return {
    id: element.id,
    tool: element.type === "text" ? "text" : shape ? "shape" : "pen",
    brush: element.type === "highlighter" ? "highlighter" : "pen",
    shape,
    color: element.color,
    size: element.width,
    opacity: element.type === "highlighter" ? 0.35 : 1,
    points: element.points,
    text: element.text,
  };
}

function toStudyDocument(document: NotebookDocument): StudyCanvasDocument {
  const backgroundType = document.paper.lined ? ("lined" as const) : ("blank" as const);
  const pages = document.pages.map((page, index) => ({
    id: page.id || `page-${index + 1}`,
    title: `Página ${index + 1}`,
    backgroundType,
    strokes: (page.elements as unknown[]).map(elementToStroke).filter((stroke): stroke is ScratchpadStroke => Boolean(stroke)),
  }));
  return { pages, activePageId: pages[0]?.id ?? "page-1" };
}

export default function NotebookEditorPage() {
  const [, params] = useRoute("/caderno/:documentId");
  const documentId = params?.documentId ?? "";
  const query = trpc.notebooks.get.useQuery({ documentId }, { enabled: Boolean(documentId), retry: false });
  const update = trpc.notebooks.update.useMutation();
  const updateRef = useRef(update);
  const documentRef = useRef<NotebookDocument | null>(null);
  const modifiedTimeRef = useRef("");
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [document, setDocument] = useState<NotebookDocument | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveRequest, setSaveRequest] = useState(0);
  const [paperDirty, setPaperDirty] = useState(false);
  const [pdfExport, setPdfExport] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfDriveLink, setPdfDriveLink] = useState("");
  const exportPdf = trpc.notebooks.exportPdf.useMutation();
  const linkedIds = document?.linkedQuestions?.sort((a, b) => a.order - b.order).map(item => item.questionId) ?? [];
  const linkedQuery = trpc.notebooks.linkedQuestions.useQuery({ questionIds: linkedIds }, { enabled: linkedIds.length > 0 });
  const [questionPanelOpen, setQuestionPanelOpen] = useState(true);
  const [activeQuestionId, setActiveQuestionId] = useState("");

  useEffect(() => { updateRef.current = update; }, [update]);

  useEffect(() => {
    if (!query.data) return;
    const loaded = query.data.document as NotebookDocument;
    documentRef.current = loaded;
    modifiedTimeRef.current = query.data.modifiedTime;
    setDocument(loaded);
  }, [query.data]);

  const saveStudyDocument = useCallback((study: StudyCanvasDocument) => {
    const save = saveQueueRef.current.catch(() => undefined).then(async () => {
      const current = documentRef.current;
      if (!current) throw new Error("Documento indisponível.");
      setSaveState("saving");
      const next: NotebookDocument = {
        ...current,
        modifiedAt: new Date().toISOString(),
        pages: study.pages.map(page => ({ id: page.id, elements: page.strokes as unknown as NotebookElement[] })),
      };
      try {
        const result = await updateRef.current.mutateAsync({
          documentId,
          document: next,
          expectedModifiedTime: modifiedTimeRef.current,
          force: false,
        });
        const saved = result.document as NotebookDocument;
        documentRef.current = saved;
        modifiedTimeRef.current = result.modifiedTime;
        setDocument(saved);
        setPaperDirty(false);
        setSaveState("saved");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setSaveState(message.includes("outro dispositivo") ? "conflict" : "error");
        throw error;
      }
    });
    saveQueueRef.current = save.catch(() => undefined);
    return save;
  }, [documentId]);

  const persistence = useMemo<StudyCanvasPersistence | null>(() => document ? ({
    load: async () => documentRef.current ? toStudyDocument(documentRef.current) : null,
    save: saveStudyDocument,
  }) : null, [Boolean(document), saveStudyDocument]);

  useEffect(() => {
    if (!paperDirty) return;
    const timer = window.setTimeout(() => setSaveRequest(value => value + 1), NOTEBOOK_AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [paperDirty]);

  const updatePaper = (patch: Partial<NotebookDocument["paper"]>) => {
    const current = documentRef.current;
    if (!current) return;
    const next = { ...current, paper: { ...current.paper, ...patch } };
    documentRef.current = next;
    setDocument(next);
    setPaperDirty(true);
    setSaveState("dirty");
  };

  const updateName = (name: string) => {
    if (name.length > 80) return;
    const current = documentRef.current;
    if (!current) return;
    const next = { ...current, name };
    documentRef.current = next;
    setDocument(next);
    setPaperDirty(true);
    setSaveState("dirty");
  };

  function downloadPdf() {
    if (!pdfExport) return;
    const url = URL.createObjectURL(pdfExport.blob); const link = window.document.createElement("a"); link.href = url; link.download = pdfExport.fileName; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000); setPdfExport(null);
  }

  async function savePdfToDrive() {
    if (!pdfExport) return;
    const bytes = new Uint8Array(await pdfExport.blob.arrayBuffer());
    let binary = ""; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...Array.from(bytes.subarray(offset, offset + 0x8000)));
    const current = documentRef.current; if (!current) return;
    try { const result = await exportPdf.mutateAsync({ documentId, name: current.name, pdfBase64: btoa(binary) }); modifiedTimeRef.current = result.notebookModifiedTime; setPdfMessage("PDF exportado e atualizado no Google Drive."); setPdfDriveLink(result.webViewLink ?? ""); setPdfExport(null); }
    catch { setPdfMessage("Não foi possível salvar o PDF no Google Drive. Tente novamente."); }
  }

  if (query.isLoading || !document || !persistence) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 font-semibold text-slate-500">Carregando caderno...</main>;
  if (query.error) return <main className="p-8 text-center text-red-700">Não foi possível abrir este caderno.</main>;

  const statusLabel = saveState === "saved" ? "Salvo no Google Drive" : saveState === "saving" ? "Salvando..." : saveState === "dirty" ? "Alterações não salvas" : saveState === "conflict" ? "Conflito com outra versão" : "Falha ao salvar";
  const activeQuestion = linkedQuery.data?.find(item => item.id === (activeQuestionId || linkedIds[0]));

  return (
    <main className="min-h-dvh overflow-hidden bg-slate-100">
      <header className="sticky top-0 z-40 flex min-h-14 flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-950 px-3 py-1.5 text-white shadow-lg">
        <Link href="/caderno"><Button variant="ghost" size="sm" className="text-slate-100 hover:bg-slate-800 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />Meus cadernos</Button></Link>
        <img src="/brand/projeto-vetor-logo.svg" alt="Projeto Vetor" className="h-8 w-8" />
        <input aria-label="Nome do caderno" value={document.name} onChange={event => updateName(event.target.value)} className="min-w-32 flex-1 rounded-md bg-transparent px-2 text-base font-bold text-white outline-none focus:ring-2 focus:ring-cyan-400" />
        <span className={`text-xs font-bold ${saveState === "error" || saveState === "conflict" ? "text-red-300" : "text-emerald-300"}`}>{statusLabel}</span>
        <label className="text-xs font-semibold text-slate-200">Papel <select value={document.paper.size} onChange={event => updatePaper({ size: event.target.value as NotebookPaperSize })} className="ml-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1"><option value="a5">A5</option><option value="a4">A4</option><option value="a3">A3</option><option value="infinite">Infinita</option></select></label>
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-200"><input type="checkbox" checked={document.paper.lined} onChange={event => updatePaper({ lined: event.target.checked })} />Com linhas</label>
        <Button size="sm" disabled={saveState === "saving"} onClick={() => setSaveRequest(value => value + 1)}><Save className="mr-2 h-4 w-4" />Salvar agora</Button>
        {pdfDriveLink ? <Button size="sm" variant="outline" onClick={() => window.open(pdfDriveLink, "_blank", "noopener,noreferrer")}>Abrir PDF no Google Drive</Button> : null}
        {linkedIds.length ? <Button variant="outline" size="sm" onClick={() => setQuestionPanelOpen(value => !value)}>Questões da lista</Button> : null}
      </header>
      <section className="flex h-[calc(100dvh-57px)] overflow-hidden p-2 sm:p-3">
        {linkedIds.length && questionPanelOpen ? <aside className="mr-3 hidden w-[34%] min-w-[280px] max-w-[480px] overflow-auto rounded-2xl border bg-white p-4 shadow-sm md:block"><h2 className="font-bold">Questões da lista</h2><div className="mt-3 flex gap-2 overflow-x-auto">{document.linkedQuestions?.map((item, index) => <button key={item.questionId} onClick={() => setActiveQuestionId(item.questionId)} className={`rounded-lg px-3 py-2 text-xs font-bold ${(activeQuestionId || linkedIds[0]) === item.questionId ? "bg-blue-600 text-white" : "bg-slate-100"}`}>{index + 1}</button>)}</div>{activeQuestion ? <article className="mt-4"><p className="text-xs font-bold text-blue-700">{activeQuestion.instituição} · {activeQuestion.ano} · {activeQuestion.disciplina}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{activeQuestion.enunciado}</p></article> : <p className="mt-4 text-sm text-slate-500">Carregando questão...</p>}</aside> : null}
        <div className="min-w-0 flex-1 overflow-auto">
        {linkedIds.length && questionPanelOpen ? <div className="mb-2 max-h-[42dvh] overflow-auto rounded-xl border bg-white p-3 md:hidden"><div className="flex gap-2 overflow-x-auto">{document.linkedQuestions?.map((item, index) => <button key={item.questionId} onClick={() => setActiveQuestionId(item.questionId)} className={`rounded-lg px-3 py-2 text-xs font-bold ${(activeQuestionId || linkedIds[0]) === item.questionId ? "bg-blue-600 text-white" : "bg-slate-100"}`}>Questão {index + 1}</button>)}</div>{activeQuestion ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{activeQuestion.enunciado}</p> : null}</div> : null}
        <StudyCanvasWorkspace
          questionId={documentId}
          titleOverride={document.name}
          persistence={persistence}
          disableLocalDraft
          initiallyOpen
          hideLauncher
          autosaveIntervalMs={NOTEBOOK_AUTOSAVE_MS}
          saveRequest={saveRequest}
          onStateChange={({ dirty, saving, error }) => {
            if (saving) setSaveState("saving");
            else if (error) setSaveState(previous => previous === "conflict" ? previous : "error");
            else if (dirty || paperDirty) setSaveState("dirty");
          }}
          backgroundOverride={document.paper.lined ? "lined" : "blank"}
          onPdfReady={(blob, fileName) => setPdfExport({ blob, fileName })}
          compactMode
          drawWithTouchInitially={false}
          lockTouchToPan
          paperSize={document.paper.size}
        />
        </div>
      </section>
      {pdfMessage ? <div role="status" className="fixed bottom-4 right-4 z-[150] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">{pdfMessage}</div> : null}
      {pdfExport ? <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold">Exportar PDF</h2><p className="mt-2 text-sm text-slate-500">O arquivo editável continuará intacto. O PDF é um arquivo binário separado.</p><div className="mt-5 grid gap-2"><Button onClick={downloadPdf}>Baixar neste dispositivo</Button><Button variant="outline" onClick={() => void savePdfToDrive()} disabled={exportPdf.isPending}>{exportPdf.isPending ? "Enviando..." : "Salvar PDF no Google Drive"}</Button><Button variant="ghost" onClick={() => setPdfExport(null)}>Cancelar</Button></div></div></div> : null}
    </main>
  );
}
