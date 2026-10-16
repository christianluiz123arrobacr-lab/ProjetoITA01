import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileImage, FileJson, ImagePlus, Loader2, Save, Trash2, Upload, XCircle } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { retryTransientRead } from "@/lib/transientRetry";
import { uploadToSignedStorageUrl } from "@/lib/signedStorageUpload";
import { getDifficultyLabel } from "@shared/difficulty";
import { MAX_QUESTION_IMPORT_IMAGE_BYTES, MAX_QUESTION_IMPORT_JSON_BYTES, type NormalizedQuestionImageSlot, type QuestionImportPreviewItem } from "@shared/questionImportSchema";
import { getExistingQuestionTaxonomy, normalizeQuestionTaxonomyKey } from "@shared/questionImportTaxonomy";
import { StatementImagesPreview } from "@/components/admin/StatementImagesEditor";
import { useImageUploadReview } from "@/components/admin/useImageUploadReview";
import { checkImageAbort, type PreparedImageMime } from "@/lib/questionImagePreparation";

type SlotRow = {
  id: string; import_key: string; slot_id: string; required: boolean; location: NormalizedQuestionImageSlot["local"];
  alternative_key: NormalizedQuestionImageSlot["alternativa"]; expected_filename: string | null; description: string | null;
  alt_text: string; caption: string | null; public_url: string | null; original_name: string | null; mime_type: string | null;
  byte_size: number | null; width: number | null; height: number | null; status: "pending" | "uploading" | "ready" | "rejected";
};

type Draft = {
  id: string; status: string; format: string; source_name: string | null; validation_summary: any; result?: any;
  payload: { questions: QuestionImportPreviewItem["item"][]; previews: QuestionImportPreviewItem[] }; slots: SlotRow[];
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function slotLabel(slot: SlotRow) {
  if (slot.location === "alternativa") return `Imagem da alternativa ${(slot.alternative_key || "?").toUpperCase()}`;
  if (slot.location === "resolucao") return "Imagem da resolução";
  if (slot.location === "contexto") return "Figura do contexto";
  return "Figura do enunciado";
}

function statusLabel(preview: any, slots: SlotRow[]) {
  if (preview.status !== "valida") return "Erro de validação";
  if (!slots.length) return "Sem imagens";
  if (slots.some((slot) => slot.required && slot.status !== "ready")) return "Imagens pendentes";
  return "Pronta para importar";
}

function autoMatch(files: File[], slots: SlotRow[]) {
  const matches: Array<{ file: File; slot: SlotRow }> = [];
  const warnings: string[] = [];
  const used = new Set<string>();
  for (const file of files) {
    const normalized = file.name.toLowerCase();
    const candidates = slots.filter((slot) => !used.has(slot.id) && (slot.expected_filename?.toLowerCase() === normalized || slot.slot_id.toLowerCase() === normalized.replace(/\.[^.]+$/, "")));
    if (candidates.length === 1) { matches.push({ file, slot: candidates[0] }); used.add(candidates[0].id); }
    else if (candidates.length > 1) warnings.push(`${file.name}: associação ambígua (${candidates.map((slot) => slot.slot_id).join(", ")}).`);
    else warnings.push(`${file.name}: nenhum nome esperado ou slot_id coincide; selecione manualmente no slot.`);
  }
  return { matches, warnings };
}

export default function AdminQuestionBatchImportPage() {
  const jsonInput = useRef<HTMLInputElement | null>(null);
  const bulkImagesInput = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils();
  const draftsQuery = trpc.admin.listQuestionImportDrafts.useQuery(undefined, { retry: retryTransientRead, retryDelay: 1000 });
  const suggestionsQuery = trpc.admin.getQuestionSuggestions.useQuery(undefined, { staleTime: 60000, retry: false });
  const createDraft = trpc.admin.createQuestionImportDraft.useMutation({ retry: false });
  const prepareUpload = trpc.admin.prepareQuestionImportImageUpload.useMutation();
  const confirmUpload = trpc.admin.confirmQuestionImportImageUpload.useMutation();
  const discardReplacement = trpc.admin.discardQuestionImportImageReplacement.useMutation();
  const { reviewAndUpload, reviewUi } = useImageUploadReview();
  const [batchProgress,setBatchProgress]=useState<{current:number;total:number}|null>(null);
  const removeUpload = trpc.admin.removeQuestionImportImageUpload.useMutation();
  const updateMetadata = trpc.admin.updateQuestionImportImageMetadata.useMutation();
  const cancelDraft = trpc.admin.cancelQuestionImportDraft.useMutation();
  const removeInvalidQuestion = trpc.admin.removeInvalidQuestionFromImportDraft.useMutation();
  const finalizeDraft = trpc.admin.finalizeQuestionImportDraft.useMutation({ retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [sourceName, setSourceName] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workingSlot, setWorkingSlot] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, { alt: string; caption: string }>>({});

  const previews = draft?.payload?.previews ?? [];
  const slots = draft?.slots ?? [];
  const validKeys = new Set(previews.filter((preview) => preview.status === "valida").map((preview) => preview.item.chave_importacao || preview.item.id_importacao || preview.item.import_hash));
  const pendingRequired = slots.filter((slot) => validKeys.has(slot.import_key) && slot.required && slot.status !== "ready").length;
  const readyCount = slots.filter((slot) => slot.status === "ready").length;
  const questionsWithImages = new Set(slots.map((slot) => slot.import_key)).size;
  const invalidCount = previews.filter((preview) => preview.status !== "valida").length;
  const validCount = previews.length - invalidCount;
  const existingTaxonomy = useMemo(() => getExistingQuestionTaxonomy(suggestionsQuery.data), [suggestionsQuery.data]);
  const newContents = useMemo(() => new Set(previews.flatMap((preview) => preview.item.conteudos.filter((value) => !existingTaxonomy.contents.has(normalizeQuestionTaxonomyKey(value))).map(normalizeQuestionTaxonomyKey))).size, [previews, existingTaxonomy]);
  const newSubjects = useMemo(() => new Set(previews.flatMap((preview) => preview.item.assuntos.filter((value) => !existingTaxonomy.subjects.has(normalizeQuestionTaxonomyKey(value))).map(normalizeQuestionTaxonomyKey))).size, [previews, existingTaxonomy]);
  const busy = Boolean(workingSlot) || createDraft.isPending || prepareUpload.isPending || confirmUpload.isPending || finalizeDraft.isPending || removeInvalidQuestion.isPending;
  const slotsByQuestion = useMemo(() => {
    const map = new Map<string, SlotRow[]>();
    for (const preview of previews) {
      const key = preview.item.chave_importacao || preview.item.id_importacao || preview.item.import_hash;
      const order = preview.item.imagens.map(item => item.slot_id);
      map.set(key, slots.filter(slot => slot.import_key === key).sort((a,b) => order.indexOf(a.slot_id) - order.indexOf(b.slot_id)));
    }
    return map;
  }, [slots, previews]);

  function applyDraft(value: unknown) {
    const next = value as Draft;
    setDraft(next);
    setMetadata(Object.fromEntries((next.slots ?? []).map((slot) => [slot.id, { alt: slot.alt_text ?? "", caption: slot.caption ?? "" }])));
  }

  async function createFromJson() {
    setError(""); setNotice("");
    try {
      const result = await createDraft.mutateAsync({ rawJson, sourceName });
      applyDraft(result); setNotice("Rascunho salvo. Você pode sair e continuar depois."); await draftsQuery.refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível validar o JSON."); }
  }

  async function readJsonFile(file: File) {
    if ((!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") || file.size > MAX_QUESTION_IMPORT_JSON_BYTES) { setError("Selecione um JSON válido de até 2 MB."); return; }
    setSourceName(file.name); setRawJson(await file.text()); setError("");
  }

  async function refreshDraft() {
    if (!draft) return;
    applyDraft(await utils.client.admin.getQuestionImportDraft.query({ batchId: draft.id }));
  }

  async function resumeDraft(batchId: string) {
    setError("");
    try { applyDraft(await utils.client.admin.getQuestionImportDraft.query({ batchId })); }
    catch { setError("Não foi possível retomar o lote. Ele continua salvo; tente novamente."); }
  }

  async function cancelCurrentDraft() {
    if (!draft) return;
    setError("");
    try { await cancelDraft.mutateAsync({batchId:draft.id}); setDraft(null); await draftsQuery.refetch(); }
    catch { setError("Não foi possível confirmar o cancelamento. Atualize os lotes salvos antes de tentar novamente."); }
  }

  async function uploadFile(slot:SlotRow,file:File) {
    if(!draft)return false;
    const identity={batchId:draft.id,importKey:slot.import_key,slotId:slot.slot_id};
    let ticket:Awaited<ReturnType<typeof prepareUpload.mutateAsync>>|null=null;
    let chosen:File|null=null,uploaded=false;
    setError("");setNotice("");setWorkingSlot(slot.id);
    try {
      const result=await reviewAndUpload(file,async(prepared,controls)=>{
        if(chosen!==prepared) {
          if(ticket)await discardReplacement.mutateAsync({...identity,uploadPath:ticket.path});
          ticket=null;chosen=prepared;uploaded=false;
        }
        controls.stage("Gerando URL assinada");
        ticket??=await prepareUpload.mutateAsync({...identity,originalName:prepared.name,contentType:prepared.type as PreparedImageMime,byteSize:prepared.size});
        checkImageAbort(controls.signal);
        if(!uploaded) {
          controls.stage("Enviando arquivo");
          const sent=await uploadToSignedStorageUrl({...ticket,file:prepared,contentType:prepared.type,signal:controls.signal});
          if(sent.error && !("statusCode" in sent.error && Number(sent.error.statusCode)===409))throw new Error("O Storage recusou o envio. Você pode tentar novamente sem preparar outra vez.");
          uploaded=true;
        }
        checkImageAbort(controls.signal);controls.stage("Confirmando arquivo");
        const values=metadata[slot.id]??{alt:slot.alt_text??"",caption:slot.caption??""};
        return confirmUpload.mutateAsync({...identity,uploadPath:ticket.path,previousPath:ticket.previousPath,contentType:prepared.type as PreparedImageMime,originalName:prepared.name,altText:values.alt,caption:values.caption||null});
      });
      applyDraft(result);setNotice(`${file.name} validado no slot ${slot.slot_id}.`);return true;
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"Falha ao enviar a imagem.");return false;
    } finally {
      // The endpoint refuses to remove any file currently referenced by the slot.
      if(ticket)await discardReplacement.mutateAsync({...identity,uploadPath:(ticket as {path:string}).path}).catch(()=>setNotice("A limpeza temporária ficou pendente; a imagem anterior permanece protegida."));
      setWorkingSlot(null);
    }
  }
  async function uploadMany(files:File[]) {
    if(!draft)return;
    // Match ORIGINAL filenames before any conversion or generated extension.
    const {matches,warnings}=autoMatch(files,slots.filter(slot=>slot.status!=="ready"));
    if(warnings.length)setNotice(warnings.join(" "));
    try {
      for(let index=0;index<matches.length;index++) {
        setBatchProgress({current:index+1,total:matches.length});
        if(!await uploadFile(matches[index].slot,matches[index].file))break;
      }
    } finally {setBatchProgress(null);}
  }

  async function removeSlot(slot: SlotRow) {
    if (!draft) return;
    setWorkingSlot(slot.id);
    try { applyDraft(await removeUpload.mutateAsync({ batchId: draft.id, importKey: slot.import_key, slotId: slot.slot_id })); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover a imagem."); }
    finally { setWorkingSlot(null); }
  }

  async function finish() {
    if (!draft) return;
    setError("");
    try {
      if (invalidCount > 0 && !window.confirm(`Este lote contém ${invalidCount} questão(ões) inválida(s). Importar somente as ${validCount} válida(s) e deixar as inválidas de fora?`)) return;
      const result = await finalizeDraft.mutateAsync({ batchId: draft.id }); await refreshDraft();
      setNotice(`Importação concluída: ${result.createdCount} criada(s), ${result.duplicatedCount} já existente(s), ${result.skippedInvalidCount} inválida(s) ignorada(s), ${result.failedCount} falha(s).`); await draftsQuery.refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a importação."); }
  }

  async function removeInvalid(index: number) {
    if (!draft || !window.confirm("Remover esta questão inválida do rascunho?")) return;
    setError("");
    try {
      applyDraft(await removeInvalidQuestion.mutateAsync({ batchId: draft.id, questionIndex: index }));
      setNotice("Questão inválida removida do rascunho.");
      await draftsQuery.refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover a questão."); }
  }

  return <AdminGuard><AdminLayout title="Importar lote JSON" subtitle="Valide o lote, vincule imagens e finalize de forma segura e idempotente.">
    {reviewUi}
    {batchProgress && <p role="status">Imagem {batchProgress.current} de {batchProgress.total}. Preparação e envio sequenciais; Cancelar na revisão interrompe o restante do lote.</p>}
    <div className="flex flex-wrap gap-3"><Link href="/admin/questoes"><Button variant="outline" className="rounded-2xl"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link><a href="/question-import/questoes-v2.example.json" download><Button variant="outline" className="rounded-2xl"><FileJson className="mr-2 h-4 w-4" />Exemplo questoes-v2</Button></a></div>
    {error && <Card className="border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"><AlertTriangle className="mr-2 inline h-5 w-5" />{error}</Card>}
    {notice && <Card className="border-blue-300 bg-blue-50 p-4 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">{notice}</Card>}
    {draftsQuery.error && <Card role="alert" className="p-4">Não foi possível atualizar os lotes salvos. <Button variant="outline" onClick={() => void draftsQuery.refetch()}>Tentar novamente</Button></Card>}

    {!draft ? <>
      <Card className="space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div onDragOver={(event) => event.preventDefault()} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void readJsonFile(file); }} className="rounded-3xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <FileJson className="mx-auto h-9 w-9 text-slate-500"/><h2 className="mt-2 text-lg font-bold">Carregue ou cole o JSON</h2>
          <input ref={jsonInput} type="file" accept=".json,application/json" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void readJsonFile(file); event.target.value = ""; }}/>
          <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => jsonInput.current?.click()}><Upload className="mr-2 h-4 w-4"/>Escolher JSON</Button>
        </div>
        <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} rows={12} placeholder='{"formato":"questoes-v2","questoes":[...]}' className="w-full rounded-2xl border border-slate-300 bg-white p-4 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"/>
        <div className="flex justify-end"><Button disabled={!rawJson.trim() || createDraft.isPending} className="rounded-2xl" onClick={() => void createFromJson()}>{createDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Validar e salvar rascunho</Button></div>
      </Card>
{(draftsQuery.data?.length ?? 0) > 0 && <Card className="border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold">Lotes salvos</h2><div className="mt-3 space-y-2">{draftsQuery.data?.map((item: any) => <button key={item.id} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => void resumeDraft(item.id)}><span>{item.source_name || item.format} · {item.validation_summary?.total ?? 0} questão(ões)</span><span className="text-xs font-bold uppercase">{item.status}</span></button>)}</div></Card>}
    </> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Questões", previews.length], ["Válidas", previews.length - invalidCount], ["Inválidas", invalidCount], ["Com imagens", questionsWithImages], ["Imagens vinculadas", readyCount], ["Obrigatórias pendentes", pendingRequired], ["Conteúdos novos", suggestionsQuery.isLoading ? "…" : suggestionsQuery.isError ? "Indisponível" : newContents], ["Assuntos novos", suggestionsQuery.isLoading ? "…" : suggestionsQuery.isError ? "Indisponível" : newSubjects]].map(([label, value]) => <Card key={String(label)} className="border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></Card>)}</div>
      {suggestionsQuery.isError && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">Não foi possível comparar conteúdos e assuntos com as questões cadastradas. <Button variant="outline" onClick={()=>void suggestionsQuery.refetch()}>Tentar novamente</Button></p>}
      <Card className="flex flex-wrap items-center gap-3 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <input ref={bulkImagesInput} multiple type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void uploadMany(Array.from(event.target.files ?? [])); event.target.value = ""; }}/>
        <Button variant="outline" className="rounded-2xl" onClick={() => bulkImagesInput.current?.click()}><ImagePlus className="mr-2 h-4 w-4"/>Associar vários arquivos</Button>
        <Button className="rounded-2xl" disabled={busy || validCount === 0 || pendingRequired > 0 || draft.status === "completed"} onClick={() => void finish()}><CheckCircle2 className="mr-2 h-4 w-4"/>{draft.status === "completed" ? "Lote concluído" : invalidCount > 0 ? `Importar ${validCount} válida(s)` : "Concluir importação"}</Button>
        <Button variant="outline" className="rounded-2xl" onClick={() => { setDraft(null); setRawJson(""); setNotice("Rascunho salvo para continuar depois."); }}><Save className="mr-2 h-4 w-4"/>Salvar e sair</Button>
        {draft.status === "draft" && <Button variant="outline" className="rounded-2xl text-red-700" onClick={() => void cancelCurrentDraft()}><Trash2 className="mr-2 h-4 w-4"/>Cancelar lote</Button>}
      </Card>
      <div className="space-y-4">{previews.map((preview) => {
        const question = preview.item; const key = question.chave_importacao || question.id_importacao || question.import_hash; const questionSlots = slotsByQuestion.get(key) ?? []; const state = statusLabel(preview, questionSlots);
        return <Card key={`${preview.index}-${key}`} className="border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800">{state}</span><code className="text-xs">{key}</code><span className="text-sm text-slate-500 dark:text-slate-400">{question.disciplina || "Sem disciplina"}</span></div>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
            <p><strong>Dificuldade:</strong> {getDifficultyLabel(question.dificuldade) || "—"}</p>
            <p><strong>Ano:</strong> {question.ano ?? "—"}</p>
            <p><strong>Prova:</strong> {question.instituição || question.banca || "—"}</p>
            <p><strong>Banca:</strong> {question.banca || "—"}</p>
          </div>
          <p className="mt-3 line-clamp-2 text-sm">{question.enunciado}</p>
          <StatementImagesPreview images={questionSlots.flatMap((slot, ordem) => slot.public_url && ["enunciado", "contexto"].includes(slot.location) ? [{ slot_id: slot.slot_id, local: slot.location as "enunciado" | "contexto", url_imagem: slot.public_url, ordem, texto_alternativo: slot.alt_text, legenda: slot.caption }] : [])} />
          {question.enunciado_pos_imagem && <p className="mt-3 whitespace-pre-wrap text-sm">{question.enunciado_pos_imagem}</p>}
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div><h3 className="font-semibold">Conteúdos</h3><p className="mt-1 text-slate-700 dark:text-slate-300">{question.conteudos.join(", ") || "—"}</p>{!suggestionsQuery.isLoading && !suggestionsQuery.isError && question.conteudos.filter((value) => !existingTaxonomy.contents.has(normalizeQuestionTaxonomyKey(value))).map((value) => <span key={value} className="mr-2 mt-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">Conteúdo novo: {value}</span>)}</div>
            <div><h3 className="font-semibold">Assuntos</h3><p className="mt-1 text-slate-700 dark:text-slate-300">{question.assuntos.join(", ") || "—"}</p>{!suggestionsQuery.isLoading && !suggestionsQuery.isError && question.assuntos.filter((value) => !existingTaxonomy.subjects.has(normalizeQuestionTaxonomyKey(value))).map((value) => <span key={value} className="mr-2 mt-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">Assunto novo: {value}</span>)}</div>
          </div>
          <div className="mt-4"><h3 className="text-sm font-semibold">Alternativas <span className="font-normal text-slate-500 dark:text-slate-400">({preview.alternativas_preenchidas} preenchidas · correta: {question.alternativa_correta?.toUpperCase() || "—"})</span></h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{(["A", "B", "C", "D", "E"] as const).map((letter) => <div key={letter} className={`rounded-xl border p-3 text-sm ${question.alternativa_correta === letter.toLowerCase() ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"}`}><strong>{letter}.</strong> <span className="whitespace-pre-wrap break-words">{question[letter] || "—"}</span>{(question[`${letter.toLowerCase()}_url_imagem` as "a_url_imagem" | "b_url_imagem" | "c_url_imagem" | "d_url_imagem" | "e_url_imagem"] || questionSlots.some((slot) => slot.location === "alternativa" && slot.alternative_key === letter.toLowerCase())) && <span className="ml-2 text-xs text-blue-700 dark:text-blue-300">Imagem da alternativa</span>}</div>)}</div></div>
          {preview.errors?.length > 0 && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{preview.errors.join(" ")}</div>}
          {preview.status === "invalida" && draft.status === "draft" && <Button variant="outline" size="sm" className="mt-3 text-red-700 dark:text-red-300" disabled={removeInvalidQuestion.isPending} onClick={() => void removeInvalid(preview.index)}><Trash2 className="mr-1 h-3 w-3"/>Remover questão inválida</Button>}
          {questionSlots.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{questionSlots.map((slot) => { const values = metadata[slot.id] ?? { alt: slot.alt_text ?? "", caption: slot.caption ?? "" }; return <div key={slot.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadFile(slot, file); }} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-start gap-3">{slot.public_url ? <img src={slot.public_url} alt={slot.alt_text} className="h-24 w-24 rounded-xl bg-white object-contain"/> : <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300"><FileImage className="h-7 w-7 text-slate-400"/></div>}<div className="min-w-0 flex-1"><p className="font-bold">{slotLabel(slot)} {slot.required && <span className="text-red-600">*</span>}</p><p className="text-xs text-slate-500">slot: {slot.slot_id}</p><p className="truncate text-xs text-slate-500">esperado: {slot.expected_filename || "associação manual"}</p><p className="mt-1 text-xs">{slot.original_name || "Nenhum arquivo"} · {formatBytes(slot.byte_size)} · {slot.mime_type || "—"}{slot.width ? ` · ${slot.width}×${slot.height}` : ""}</p><p className={`mt-1 text-xs font-bold ${slot.status === "ready" ? "text-emerald-600" : "text-amber-600"}`}>{slot.status === "ready" ? "Concluído" : "Pendente"}</p></div></div>
            <label className="mt-3 block text-xs font-bold">Texto alternativo<input value={values.alt} onChange={(event) => setMetadata((prev) => ({ ...prev, [slot.id]: { ...values, alt: event.target.value } }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" maxLength={500}/></label>
            <label className="mt-2 block text-xs font-bold">Legenda (opcional)<input value={values.caption} onChange={(event) => setMetadata((prev) => ({ ...prev, [slot.id]: { ...values, caption: event.target.value } }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" maxLength={500}/></label>
            <div className="mt-3 flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={workingSlot === slot.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(slot, file); event.target.value = ""; }}/>{workingSlot === slot.id ? "Validando..." : slot.status === "ready" ? "Substituir" : "Selecionar arquivo"}</label>{slot.status === "ready" && <><Button size="sm" variant="outline" onClick={async () => applyDraft(await updateMetadata.mutateAsync({ batchId: draft.id, importKey: slot.import_key, slotId: slot.slot_id, altText: values.alt, caption: values.caption || null }))}><Save className="mr-1 h-3 w-3"/>Salvar textos</Button><Button size="sm" variant="outline" onClick={() => void removeSlot(slot)}><XCircle className="mr-1 h-3 w-3"/>Remover</Button></>}</div>
          </div>})}</div>}
        </Card>})}</div>
    </>}
  </AdminLayout></AdminGuard>;
}
