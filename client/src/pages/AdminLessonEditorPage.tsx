import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, Eye, FileJson, History, Loader2, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { LessonRenderer } from "@/components/lessons/LessonRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LESSON_SCHEMA_VERSION, lessonBlockSchema, type LessonBlock, type LessonJSON, type LessonMetadata } from "@shared/lessonSchema";

type Tab = "edit" | "preview" | "history";
const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const textareaClass = "min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const blockLabels: Record<LessonBlock["type"], string> = { text: "Texto", formula: "Fórmula", highlight: "Destaque", intuition: "Intuição", common_mistake: "Erro comum", example: "Exemplo", image: "Imagem", summary: "Resumo" };
function newId(type: string) { return `${type}-${crypto.randomUUID().slice(0, 8)}`; }
function makeBlock(type: LessonBlock["type"]): LessonBlock {
  const common = { id: newId(type), visible: true };
  if (type === "text") return { ...common, type, content: "Novo texto didático." };
  if (type === "formula") return { ...common, type, latex: "x = x_0 + vt", align: "center" };
  if (type === "highlight") return { ...common, type, variant: "info", content: "Informação importante." };
  if (type === "intuition") return { ...common, type, content: "Explique aqui a intuição do conceito." };
  if (type === "common_mistake") return { ...common, type, content: "Descreva o erro e como evitá-lo." };
  if (type === "example") return { ...common, type, problem: "Enunciado do exemplo.", solution: "Resolução passo a passo." };
  if (type === "image") return { ...common, type, storagePath: "caminho-da-imagem.webp", alt: "Descrição objetiva da imagem", align: "center", size: "large" };
  return { ...common, type: "summary", points: ["Ponto principal da aula."] };
}

function BlockFields({ block, onChange }: { block: LessonBlock; onChange: (block: LessonBlock) => void }) {
  const patch = (value: Partial<LessonBlock>) => onChange({ ...block, ...value } as LessonBlock);
  const title = "title" in block ? <label className="space-y-1 text-xs font-semibold text-slate-500">Título opcional<input className={inputClass} value={block.title ?? ""} onChange={e => patch({ title: e.target.value || undefined } as Partial<LessonBlock>)} /></label> : null;
  if (block.type === "text" || block.type === "intuition" || block.type === "common_mistake") return <div className="space-y-3">{title}<label className="space-y-1 text-xs font-semibold text-slate-500">Conteúdo Markdown<textarea className={textareaClass} value={block.content} onChange={e => patch({ content: e.target.value })} /></label></div>;
  if (block.type === "formula") return <div className="grid gap-3"><label className="space-y-1 text-xs font-semibold text-slate-500">LaTeX<textarea className={textareaClass} value={block.latex} onChange={e => patch({ latex: e.target.value })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500">Legenda<input className={inputClass} value={block.caption ?? ""} onChange={e => patch({ caption: e.target.value || undefined })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500">Alinhamento<select className={inputClass} value={block.align} onChange={e => patch({ align: e.target.value as "left" | "center" | "right" })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label></div>;
  if (block.type === "highlight") return <div className="space-y-3">{title}<label className="space-y-1 text-xs font-semibold text-slate-500">Variante<select className={inputClass} value={block.variant} onChange={e => patch({ variant: e.target.value as typeof block.variant })}><option value="info">Informação</option><option value="attention">Atenção</option><option value="important">Importante</option><option value="tip">Dica</option><option value="key_concept">Conceito-chave</option><option value="observation">Observação</option></select></label><label className="space-y-1 text-xs font-semibold text-slate-500">Conteúdo<textarea className={textareaClass} value={block.content} onChange={e => patch({ content: e.target.value })} /></label></div>;
  if (block.type === "example") return <div className="space-y-3"><label className="space-y-1 text-xs font-semibold text-slate-500">Problema<textarea className={textareaClass} value={block.problem} onChange={e => patch({ problem: e.target.value })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500">Resolução<textarea className={textareaClass} value={block.solution} onChange={e => patch({ solution: e.target.value })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500">Conclusão opcional<textarea className={textareaClass} value={block.conclusion ?? ""} onChange={e => patch({ conclusion: e.target.value || undefined })} /></label></div>;
  if (block.type === "image") return <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-xs font-semibold text-slate-500 md:col-span-2">Caminho no Storage<input className={inputClass} value={block.storagePath} onChange={e => patch({ storagePath: e.target.value })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500 md:col-span-2">Texto alternativo<input className={inputClass} value={block.alt} onChange={e => patch({ alt: e.target.value })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500 md:col-span-2">Legenda<input className={inputClass} value={block.caption ?? ""} onChange={e => patch({ caption: e.target.value || undefined })} /></label><label className="space-y-1 text-xs font-semibold text-slate-500">Alinhamento<select className={inputClass} value={block.align} onChange={e => patch({ align: e.target.value as typeof block.align })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><label className="space-y-1 text-xs font-semibold text-slate-500">Tamanho<select className={inputClass} value={block.size} onChange={e => patch({ size: e.target.value as typeof block.size })}><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option><option value="full">Largura total</option></select></label></div>;
  return <div className="space-y-3">{title}<label className="space-y-1 text-xs font-semibold text-slate-500">Pontos principais, um por linha<textarea className={textareaClass} value={block.points.join("\n")} onChange={e => patch({ points: e.target.value.split("\n") })} /></label></div>;
}

export default function AdminLessonEditorPage() {
  const [, params] = useRoute("/admin/aulas/:id");
  const lessonId = params?.id ?? "";
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  const [tab, setTab] = useState<Tab>(requestedTab === "preview" || requestedTab === "history" ? requestedTab : "edit");
  const [metadata, setMetadata] = useState<LessonMetadata | null>(null);
  const [document, setDocument] = useState<LessonJSON>({ schemaVersion: LESSON_SCHEMA_VERSION, blocks: [] });
  const [addType, setAddType] = useState<LessonBlock["type"]>("text");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Array<{ path: string; message: string }>>([]);
  const [jsonText, setJsonText] = useState("");
  const initialized = useRef(false);
  const detail = trpc.lessons.getAdmin.useQuery({ lessonId }, { enabled: Boolean(lessonId) });
  const taxonomy = trpc.lessons.taxonomy.useQuery();
  const history = trpc.lessons.history.useQuery({ lessonId }, { enabled: Boolean(lessonId) && tab === "history" });
  const save = trpc.lessons.saveDraft.useMutation();
  const validateDraft = trpc.lessons.validateDraft.useMutation();
  const validateImport = trpc.lessons.validateImport.useMutation();
  const publish = trpc.lessons.publish.useMutation();
  const restore = trpc.lessons.restore.useMutation();

  useEffect(() => {
    if (!detail.data || initialized.current) return;
    const lesson = detail.data.lesson as Record<string, unknown>;
    const parsed = lessonBlockSchema.array().safeParse((detail.data.draft.content_json as { blocks?: unknown })?.blocks ?? []);
    setMetadata({ title: String(lesson.title), slug: String(lesson.slug), description: String(lesson.description), discipline: String(lesson.discipline), content: String(lesson.content), subject: String(lesson.subject), level: typeof lesson.level === "string" ? lesson.level : null, displayOrder: Number(lesson.display_order ?? 0) });
    if (parsed.success) setDocument({ schemaVersion: LESSON_SCHEMA_VERSION, blocks: parsed.data });
    initialized.current = true;
  }, [detail.data]);

  const selectedDiscipline = taxonomy.data?.find(item => item.name === metadata?.discipline);
  const selectedContent = selectedDiscipline?.contents.find(item => item.name === metadata?.content);
  const exportDocument = useMemo(() => metadata ? JSON.stringify({ metadata, lesson: document }, null, 2) : "", [metadata, document]);

  function updateBlock(index: number, block: LessonBlock) { setDocument(current => ({ ...current, blocks: current.blocks.map((item, position) => position === index ? block : item) })); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= document.blocks.length) return; const blocks = [...document.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; setDocument({ ...document, blocks }); }
  async function saveDraft() {
    if (!metadata) return false;
    setMessage(""); setIssues([]);
    try {
      const validation = await validateDraft.mutateAsync({ metadata, content: document });
      if (!validation.valid) { setIssues(validation.issues); setMessage("Corrija os campos indicados antes de salvar."); return false; }
      await save.mutateAsync({ lessonId, metadata, content: document }); setMessage("Rascunho salvo. A versão publicada não foi alterada."); await detail.refetch(); return true;
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); return false; }
  }
  async function publishDraft() {
    if (!window.confirm("Publicar este rascunho como uma nova versão imutável?")) return;
    if (!metadata) return;
    const publicationValidation = await validateImport.mutateAsync({ document: { metadata, lesson: document } });
    if (!publicationValidation.valid) { setIssues(publicationValidation.issues); setMessage("Corrija os campos indicados antes de publicar."); return; }
    if (!await saveDraft()) return;
    try { const result = await publish.mutateAsync({ lessonId }); setMessage(`Versão ${result.versionNumber} publicada com sucesso.`); await Promise.all([detail.refetch(), history.refetch()]); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível publicar."); }
  }
  function downloadJson() { const blob = new Blob([exportDocument], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = globalThis.document.createElement("a"); anchor.href = url; anchor.download = `${metadata?.slug ?? "aula"}.json`; anchor.click(); URL.revokeObjectURL(url); }
  async function checkImport(apply: boolean) {
    setIssues([]); setMessage("");
    let value: unknown;
    try { value = JSON.parse(jsonText); } catch { setIssues([{ path: "$", message: "JSON inválido." }]); return; }
    const result = await validateImport.mutateAsync({ document: value });
    if (!result.valid || !result.document) { setIssues(result.issues); return; }
    if (apply && window.confirm("Substituir o rascunho aberto pelos dados validados? A alteração só será persistida ao salvar.")) {
      setMetadata(result.document.metadata); setDocument(result.document.lesson); setMessage("JSON aplicado localmente. Revise e salve o rascunho.");
    } else if (!apply) setMessage("JSON válido. Nenhum dado foi alterado.");
  }
  async function loadJsonFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) { setIssues([{ path: "$", message: "O arquivo JSON excede 1 MB." }]); return; }
    setJsonText(await file.text());
    setMessage("Arquivo carregado localmente. Valide antes de importar.");
  }
  async function restoreVersion(versionId: string) {
    if (!window.confirm("Copiar esta versão para o rascunho atual? O histórico publicado será preservado.")) return;
    await restore.mutateAsync({ lessonId, versionId }); initialized.current = false; await detail.refetch(); setTab("preview"); setMessage("Versão copiada para o rascunho. Publique novamente quando estiver pronta.");
  }

  if (detail.error) return <AdminGuard allowedRoles={["admin"]}><div className="p-10 text-red-600">{detail.error.message}</div></AdminGuard>;
  if (detail.isLoading || !metadata) return <AdminGuard allowedRoles={["admin"]}><div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin" /></div></AdminGuard>;

  return <AdminGuard allowedRoles={["admin"]}><AdminLayout title={metadata.title} subtitle="Rascunho isolado da versão publicada.">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/aulas"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Aulas</Button></Link><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadJson}><Download className="mr-2 h-4 w-4" />Exportar JSON</Button><Button variant="outline" onClick={saveDraft} disabled={save.isPending}><Save className="mr-2 h-4 w-4" />Salvar rascunho</Button><Button onClick={publishDraft} disabled={publish.isPending}><Send className="mr-2 h-4 w-4" />Publicar</Button></div></div>
    {message && <div aria-live="polite" className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">{message}</div>}
    {issues.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40"><p className="mb-2 font-bold text-red-800 dark:text-red-200">Corrija os campos abaixo:</p><ul className="space-y-1 text-sm text-red-700 dark:text-red-300">{issues.map((issue, index) => <li key={index}><code>{issue.path}</code>: {issue.message}</li>)}</ul></div>}
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">{(["edit","preview","history"] as const).map(value => <button key={value} onClick={() => setTab(value)} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === value ? "border-cyan-500 text-cyan-700 dark:text-cyan-300" : "border-transparent text-slate-500"}`}>{value === "edit" ? "Editar" : value === "preview" ? "Preview" : "Histórico"}</button>)}</div>

    {tab === "edit" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4">{document.blocks.map((block, index) => <Card key={block.id} className="border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><span className="font-bold text-slate-900 dark:text-white">{index + 1}. {blockLabels[block.type]}</span><code className="ml-2 text-xs text-slate-400">{block.id}</code></div><div className="flex items-center gap-1"><label className="mr-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={block.visible} onChange={e => updateBlock(index, { ...block, visible: e.target.checked })} />Visível</label><Button size="icon" variant="ghost" aria-label="Mover para cima" onClick={() => move(index,-1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Mover para baixo" onClick={() => move(index,1)}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Duplicar bloco" onClick={() => setDocument({ ...document, blocks: [...document.blocks.slice(0,index+1), { ...block, id: newId(block.type) }, ...document.blocks.slice(index+1)] })}><Copy className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Remover bloco" onClick={() => window.confirm("Remover este bloco do rascunho?") && setDocument({ ...document, blocks: document.blocks.filter((_, position) => position !== index) })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div><BlockFields block={block} onChange={value => updateBlock(index,value)} /></Card>)}<Card className="flex flex-wrap gap-2 border-dashed p-4"><select className={`${inputClass} w-52`} value={addType} onChange={e => setAddType(e.target.value as LessonBlock["type"])}>{Object.entries(blockLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select><Button onClick={() => setDocument({ ...document, blocks: [...document.blocks, makeBlock(addType)] })}><Plus className="mr-2 h-4 w-4" />Adicionar bloco</Button></Card></div>
      <div className="space-y-4"><Card className="space-y-3 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h3 className="font-bold">Metadados</h3><label className="block text-xs font-semibold text-slate-500">Título<input className={inputClass} value={metadata.title} onChange={e => setMetadata({ ...metadata, title:e.target.value })} /></label><label className="block text-xs font-semibold text-slate-500">Slug<input className={inputClass} value={metadata.slug} onChange={e => setMetadata({ ...metadata, slug:e.target.value })} /></label><label className="block text-xs font-semibold text-slate-500">Descrição<textarea className={textareaClass} value={metadata.description} onChange={e => setMetadata({ ...metadata, description:e.target.value })} /></label><label className="block text-xs font-semibold text-slate-500">Disciplina<select className={inputClass} value={metadata.discipline} onChange={e => setMetadata({ ...metadata, discipline:e.target.value, content:"", subject:"" })}>{taxonomy.data?.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="block text-xs font-semibold text-slate-500">Conteúdo<select className={inputClass} value={metadata.content} onChange={e => setMetadata({ ...metadata, content:e.target.value, subject:"" })}>{selectedDiscipline?.contents.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="block text-xs font-semibold text-slate-500">Assunto<select className={inputClass} value={metadata.subject} onChange={e => setMetadata({ ...metadata, subject:e.target.value })}>{selectedContent?.subjects.map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-xs font-semibold text-slate-500">Nível<input className={inputClass} value={metadata.level ?? ""} onChange={e => setMetadata({ ...metadata, level:e.target.value || null })} /></label></Card>
      <Card className="space-y-3 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h3 className="flex items-center gap-2 font-bold"><FileJson className="h-4 w-4" />Importar JSON</h3><input type="file" accept="application/json,.json" aria-label="Selecionar arquivo JSON" className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold dark:file:bg-slate-800 dark:file:text-slate-100" onChange={e => loadJsonFile(e.target.files?.[0])} /><textarea className={`${textareaClass} min-h-48 font-mono text-xs`} value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder="Cole o JSON oficial aqui" /><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => checkImport(false)}><Eye className="mr-1 h-4 w-4" />Validar sem importar</Button><Button size="sm" variant="outline" onClick={() => checkImport(true)}><Upload className="mr-1 h-4 w-4" />Importar no rascunho</Button></div></Card></div></div>}

    {tab === "preview" && <div><div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">Preview do rascunho — alunos continuam vendo somente a última versão publicada.</div><article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-10"><h1 className="text-3xl font-black text-slate-950 dark:text-white">{metadata.title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{metadata.description}</p><p className="mb-8 mt-3 text-sm text-cyan-700 dark:text-cyan-300">{metadata.discipline} · {metadata.content} · {metadata.subject}</p><LessonRenderer lesson={document} mode="preview" /></article></div>}

    {tab === "history" && <div className="space-y-3">{history.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : !history.data?.length ? <Card className="p-8 text-center text-slate-500">Nenhuma versão publicada.</Card> : history.data.map(version => <Card key={version.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Versão {version.version_number}</h3><p className="text-sm text-slate-500">Publicada em {new Date(version.published_at).toLocaleString("pt-BR")}</p>{version.change_note && <p className="mt-1 text-sm">{version.change_note}</p>}</div><Button variant="outline" onClick={() => restoreVersion(version.id)} disabled={restore.isPending}><History className="mr-2 h-4 w-4" />Restaurar no rascunho</Button></Card>)}</div>}
  </AdminLayout></AdminGuard>;
}
