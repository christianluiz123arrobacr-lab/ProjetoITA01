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
  const [document, setDocument] = useState<NotebookDocument | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveRequest, setSaveRequest] = useState(0);
  const [paperDirty, setPaperDirty] = useState(false);

  useEffect(() => { updateRef.current = update; }, [update]);

  useEffect(() => {
    if (!query.data) return;
    const loaded = query.data.document as NotebookDocument;
    documentRef.current = loaded;
    modifiedTimeRef.current = query.data.modifiedTime;
    setDocument(loaded);
  }, [query.data]);

  const saveStudyDocument = useCallback(async (study: StudyCanvasDocument) => {
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

  if (query.isLoading || !document || !persistence) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 font-semibold text-slate-500">Carregando caderno...</main>;
  if (query.error) return <main className="p-8 text-center text-red-700">Não foi possível abrir este caderno.</main>;

  const statusLabel = saveState === "saved" ? "Salvo no Google Drive" : saveState === "saving" ? "Salvando..." : saveState === "dirty" ? "Alterações não salvas" : saveState === "conflict" ? "Conflito com outra versão" : "Falha ao salvar";

  return (
    <main className="min-h-dvh overflow-hidden bg-slate-100">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Link href="/caderno"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Meus cadernos</Button></Link>
        <input aria-label="Nome do caderno" value={document.name} onChange={event => updateName(event.target.value)} className="min-w-0 flex-1 rounded-md bg-transparent px-2 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200" />
        <span className={`text-xs font-bold ${saveState === "error" || saveState === "conflict" ? "text-red-600" : "text-slate-500"}`}>{statusLabel}</span>
        <label className="text-xs font-semibold text-slate-600">Papel <select value={document.paper.size} onChange={event => updatePaper({ size: event.target.value as NotebookPaperSize })} className="ml-1 rounded-lg border px-2 py-1"><option value="a5">A5</option><option value="a4">A4</option><option value="a3">A3</option><option value="infinite">Infinita</option></select></label>
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-600"><input type="checkbox" checked={document.paper.lined} onChange={event => updatePaper({ lined: event.target.checked })} />Com linhas</label>
        <Button size="sm" onClick={() => setSaveRequest(value => value + 1)}><Save className="mr-2 h-4 w-4" />Salvar agora</Button>
      </header>
      <section className="h-[calc(100dvh-57px)] overflow-auto p-2 sm:p-3">
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
        />
      </section>
    </main>
  );
}
