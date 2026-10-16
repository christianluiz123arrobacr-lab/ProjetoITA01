import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { safeErrorCode } from "../../shared/authRecovery.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import {
  MAX_QUESTION_IMPORT_IMAGE_BYTES,
  parseQuestionImportJsonText,
  summarizeQuestionImport,
  validateQuestionImportItem,
  type NormalizedQuestionImportItem,
  type QuestionImportPreviewItem,
} from "../../shared/questionImportSchema.js";
import { selectValidQuestionImportItems } from "../../shared/questionImportSelection.js";
import { applyReadyImageSlots, inspectQuestionImportImage, sanitizeImportFileName, type QuestionImportImageType, type ReadyImportImageSlot } from "./questionImportImages.js";

const BATCH_SELECT = "id,created_by,status,format,source_name,payload,validation_summary,result,created_at,updated_at,completed_at,expires_at";
const SLOT_SELECT = "id,batch_id,import_key,slot_id,required,location,alternative_key,expected_filename,description,alt_text,caption,bucket,storage_path,public_url,original_name,mime_type,byte_size,width,height,status,created_at,updated_at";

function dbError(message: string, error?: { message?: string }) {
  // Only constant operation descriptions and provider codes, never SQL messages/files.
  console.warn({ event: "question_import_database", stage: message, code: safeErrorCode(error) });
  return new TRPCError({ code: "BAD_REQUEST", message: error?.message?.includes("question_import_") ? "A migration dos rascunhos de importação ainda não foi aplicada." : message });
}

async function loadOwnedBatch(batchId: string, userId: string, requireDraft = true) {
  const { data, error } = await supabaseAdmin.from("question_import_batches").select(BATCH_SELECT).eq("id", batchId).eq("created_by", userId).maybeSingle();
  if (error) throw dbError("Não foi possível carregar o lote.", error);
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Lote não encontrado." });
  if (requireDraft && data.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este lote não está aberto para edição." });
  return data as any;
}

function publicBatch(batch: any, slots: any[]) {
  return { ...batch, slots, payload: batch.payload as { questions: NormalizedQuestionImportItem[]; previews: unknown[] } };
}

export async function createQuestionImportDraft(userId: string, rawJson: string, sourceName?: string) {
  const parsed = parseQuestionImportJsonText(rawJson);
  const questions = parsed.questoes.map((preview) => preview.item);
  const { data: batch, error } = await supabaseAdmin.from("question_import_batches").insert({
    created_by: userId,
    format: parsed.versao || parsed.tipo,
    source_name: sourceName?.trim().slice(0, 180) || null,
    payload: { questions, previews: parsed.questoes },
    validation_summary: parsed.summary,
  }).select(BATCH_SELECT).single();
  if (error || !batch) throw dbError("Não foi possível salvar o rascunho.", error ?? undefined);
  const slots = questions.flatMap((question) => question.imagens.map((slot) => ({
    batch_id: batch.id,
    import_key: question.chave_importacao || question.id_importacao || question.import_hash,
    slot_id: slot.slot_id,
    required: slot.obrigatoria,
    location: slot.local,
    alternative_key: slot.alternativa,
    expected_filename: slot.nome_arquivo_esperado,
    description: slot.descricao,
    alt_text: slot.texto_alternativo,
    caption: slot.legenda,
  })));
  if (slots.length) {
    const { error: slotError } = await supabaseAdmin.from("question_import_image_slots").insert(slots);
    if (slotError) {
      await supabaseAdmin.from("question_import_batches").delete().eq("id", batch.id);
      throw dbError("Não foi possível criar os slots de imagem.", slotError);
    }
  }
  await supabaseAdmin.from("admin_logs").insert({ actor_user_id: userId, action: "question_import_draft_created", entity_type: "question_import_batch", entity_id: batch.id, description: `Rascunho com ${questions.length} questão(ões) criado.`, level: "info", metadata: { questionCount: questions.length, slotCount: slots.length } });
  return getQuestionImportDraft(batch.id, userId);
}

export async function getQuestionImportDraft(batchId: string, userId: string) {
  const batch = await loadOwnedBatch(batchId, userId, false);
  const { data: slots, error } = await supabaseAdmin.from("question_import_image_slots").select(SLOT_SELECT).eq("batch_id", batchId).order("created_at");
  if (error) throw dbError("Não foi possível carregar as imagens do lote.", error);
  return publicBatch(batch, slots ?? []);
}

export async function listQuestionImportDrafts(userId: string) {
  const { data, error } = await supabaseAdmin.from("question_import_batches").select("id,status,format,source_name,validation_summary,created_at,updated_at,expires_at").eq("created_by", userId).in("status", ["draft", "completed"]).order("updated_at", { ascending: false }).limit(30);
  if (error) throw dbError("Não foi possível listar os lotes.", error);
  return data ?? [];
}

export async function removeInvalidQuestionFromImportDraft(batchId: string, questionIndex: number, userId: string) {
  const batch = await loadOwnedBatch(batchId, userId);
  const questions = batch.payload?.questions as NormalizedQuestionImportItem[] | undefined;
  const previews = batch.payload?.previews as QuestionImportPreviewItem[] | undefined;
  if (!Array.isArray(questions) || !Array.isArray(previews) || questions.length !== previews.length) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "O rascunho de importação está inconsistente." });
  }
  const position = previews.findIndex((preview) => preview.index === questionIndex);
  if (position < 0 || previews[position].status !== "invalida") {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Somente uma questão inválida deste rascunho pode ser removida." });
  }
  const question = questions[position];
  const importKey = question.chave_importacao || question.id_importacao || question.import_hash;
  if (questions.some((other, index) => index !== position && (other.chave_importacao || other.id_importacao || other.import_hash) === importKey)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Há outra questão com a mesma chave neste lote; corrija o JSON antes de remover." });
  }
  const { data: slots, error: slotsError } = await supabaseAdmin.from("question_import_image_slots").select("bucket,storage_path").eq("batch_id", batchId).eq("import_key", importKey);
  if (slotsError) throw dbError("Não foi possível consultar as imagens da questão.", slotsError);
  for (const slot of slots ?? []) {
    if (slot.bucket && slot.storage_path) {
      const { error } = await supabaseAdmin.storage.from(slot.bucket).remove([slot.storage_path]);
      if (error) throw dbError("Não foi possível remover a imagem temporária da questão.", error);
    }
  }
  const { error: deleteError } = await supabaseAdmin.from("question_import_image_slots").delete().eq("batch_id", batchId).eq("import_key", importKey);
  if (deleteError) throw dbError("Não foi possível remover os slots da questão.", deleteError);
  const nextQuestions = questions.filter((_, index) => index !== position);
  const nextPreviews = previews.filter((_, index) => index !== position);
  const { error: updateError } = await supabaseAdmin.from("question_import_batches").update({
    payload: { questions: nextQuestions, previews: nextPreviews },
    validation_summary: summarizeQuestionImport(nextPreviews),
    updated_at: new Date().toISOString(),
  }).eq("id", batchId).eq("created_by", userId).eq("status", "draft");
  if (updateError) throw dbError("Não foi possível atualizar o rascunho.", updateError);
  await supabaseAdmin.from("admin_logs").insert({ actor_user_id: userId, action: "question_import_invalid_removed", entity_type: "question_import_batch", entity_id: batchId, description: "Questão inválida removida do rascunho.", level: "info", metadata: { questionIndex } });
  return getQuestionImportDraft(batchId, userId);
}

export type ImportUploadIdentity = { batchId:string;importKey:string;slotId:string };
function replacementPrefix(batchId:string,slot:any) { return `question-imports/${batchId}/${slot.id}/`; }
function assertReplacementPath(batchId:string,slot:any,path:string) {
  const prefix=replacementPrefix(batchId,slot);
  if(!path.startsWith(prefix) || !/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path.slice(prefix.length)))
    throw new TRPCError({code:"FORBIDDEN",message:"Arquivo não pertence a este lote e slot."});
}
async function getUploadSlot(input:ImportUploadIdentity) {
  const {data,error}=await supabaseAdmin.from("question_import_image_slots").select(SLOT_SELECT).eq("batch_id",input.batchId).eq("import_key",input.importKey).eq("slot_id",input.slotId).maybeSingle();
  if(error)throw dbError("Não foi possível consultar o slot.",error);
  if(!data)throw new TRPCError({code:"NOT_FOUND",message:"Slot não encontrado neste lote."});
  return data as any;
}
export async function prepareQuestionImportSlotUpload(input: ImportUploadIdentity & { originalName: string; contentType: QuestionImportImageType; byteSize: number }, userId: string) {
  await loadOwnedBatch(input.batchId,userId);
  if(input.byteSize<1 || input.byteSize>MAX_QUESTION_IMPORT_IMAGE_BYTES)throw new TRPCError({code:"BAD_REQUEST",message:"A imagem deve ter no máximo 3 MiB."});
  const slot=await getUploadSlot(input);
  const extension=input.contentType==="image/png"?"png":input.contentType==="image/webp"?"webp":"jpg";
  if(!/\.(png|jpe?g|webp)$/i.test(input.originalName))throw new TRPCError({code:"BAD_REQUEST",message:"Nome de imagem inválido."});
  const path=`${replacementPrefix(input.batchId,slot)}${randomUUID()}.${extension}`;
  const bucket=slot.location==="resolucao"?"resolucoes-imagens":"questoes-imagens";
  const {data:upload,error}=await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if(error || !upload?.token)throw dbError("Não foi possível preparar o upload.",error??undefined);
  // The persisted ready slot is NEVER cleared here. No image is deleted before confirmation.
  return {bucket,path,previousPath:slot.storage_path??null,token:upload.token,signedUrl:upload.signedUrl};
}
export async function discardQuestionImportReplacement(input:ImportUploadIdentity & {uploadPath:string},userId:string) {
  const batch=await loadOwnedBatch(input.batchId,userId,false);
  const slot=await getUploadSlot(input); assertReplacementPath(input.batchId,slot,input.uploadPath);
  if(batch.status==="completed" || slot.storage_path===input.uploadPath)return {removed:false};
  const bucket=slot.location==="resolucao"?"resolucoes-imagens":"questoes-imagens";
  const {error}=await supabaseAdmin.storage.from(bucket).remove([input.uploadPath]);
  if(error)throw dbError("Não foi possível limpar o upload temporário.",error);
  return {removed:true};
}
export async function confirmQuestionImportSlotUpload(input:ImportUploadIdentity & {altText:string;caption?:string|null;uploadPath?:string;previousPath?:string|null;contentType?:QuestionImportImageType;originalName?:string},userId:string) {
  await loadOwnedBatch(input.batchId,userId);
  const slot=await getUploadSlot(input);
  const legacy=!input.uploadPath && slot.status==="uploading" && slot.storage_path;
  const path=input.uploadPath || (legacy?slot.storage_path:null);
  if(!path)throw new TRPCError({code:"PRECONDITION_FAILED",message:"Selecione o arquivo novamente para preparar o upload."});
  if(!legacy)assertReplacementPath(input.batchId,slot,path);
  const bucket=slot.location==="resolucao"?"resolucoes-imagens":"questoes-imagens";
  if(slot.storage_path===path && slot.status==="ready")return getQuestionImportDraft(input.batchId,userId);
  const previous=legacy?slot.storage_path:input.previousPath??null;
  if((slot.storage_path??null)!==previous)throw new TRPCError({code:"CONFLICT",message:"A imagem deste slot mudou. Atualize o lote antes de substituir."});
  const storage=supabaseAdmin.storage.from(bucket);
  const {data:blob,error}=await storage.download(path);
  if(error || !blob)throw dbError("O arquivo enviado não foi encontrado.",error??undefined);
  try {
    const info=inspectQuestionImportImage(new Uint8Array(await blob.arrayBuffer()),input.contentType || slot.mime_type || "");
    const extension=info.mime==="image/png"?"png":info.mime==="image/webp"?"webp":"jpg";
    if(!path.endsWith(`.${extension}`))throw new Error("Extensão e conteúdo real não correspondem.");
    const altText=input.altText.trim().replace(/[<>]/g,"").slice(0,500);
    const caption=input.caption?.trim().replace(/[<>]/g,"").slice(0,500)||null;
    if(slot.required && !altText)throw new Error("Informe o texto alternativo da imagem obrigatória.");
    const {data:url}=storage.getPublicUrl(path);
    let update=supabaseAdmin.from("question_import_image_slots").update({bucket,storage_path:path,public_url:url.publicUrl,
      original_name:sanitizeImportFileName(input.originalName || slot.original_name || path.split("/").pop()!),
      alt_text:altText,caption,mime_type:info.mime,byte_size:info.byteSize,width:info.width,height:info.height,status:"ready",updated_at:new Date().toISOString()}).eq("id",slot.id);
    update=previous?update.eq("storage_path",previous):update.is("storage_path",null);
    const {data:committed,error:updateError}=await update.select("id").maybeSingle();
    if(updateError)throw dbError("Não foi possível confirmar a nova imagem.",updateError);
    if(!committed)throw new TRPCError({code:"CONFLICT",message:"O slot mudou durante a confirmação. Atualize o lote."});
  } catch(cause) {
    // Keep the candidate for a retry (e.g. a transient database failure). The old
    // reference remains unchanged. Explicit cancellation/expiry cleans candidates
    // after checking the current reference, including ambiguous commit responses.
    throw cause instanceof TRPCError?cause:new TRPCError({code:"BAD_REQUEST",message:cause instanceof Error?cause.message:"Imagem inválida."});
  }
  // Reference committed first. Cleanup failure must not turn a successful replacement into a failed retry.
  if(previous && previous!==path) {
    const {error:cleanupError}=await storage.remove([previous]);
    if(cleanupError)console.warn({event:"question_import_cleanup",outcome:"deferred"});
  }
  return getQuestionImportDraft(input.batchId,userId);
}

export async function removeQuestionImportSlotUpload(batchId: string, importKey: string, slotId: string, userId: string) {
  await loadOwnedBatch(batchId, userId);
  const { data: slot } = await supabaseAdmin.from("question_import_image_slots").select(SLOT_SELECT).eq("batch_id", batchId).eq("import_key", importKey).eq("slot_id", slotId).maybeSingle();
  if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot não encontrado." });
  if (slot.bucket && slot.storage_path) await supabaseAdmin.storage.from(slot.bucket).remove([slot.storage_path]);
  await supabaseAdmin.from("question_import_image_slots").update({ bucket: null, storage_path: null, public_url: null, original_name: null, mime_type: null, byte_size: null, width: null, height: null, status: "pending", updated_at: new Date().toISOString() }).eq("id", slot.id);
  return getQuestionImportDraft(batchId, userId);
}

export async function updateQuestionImportSlotMetadata(input: { batchId: string; importKey: string; slotId: string; altText: string; caption?: string | null }, userId: string) {
  await loadOwnedBatch(input.batchId, userId);
  const altText = input.altText.trim().replace(/[<>]/g, "").slice(0, 500);
  const caption = input.caption?.trim().replace(/[<>]/g, "").slice(0, 500) || null;
  const { data: slot } = await supabaseAdmin.from("question_import_image_slots").select("id,required").eq("batch_id", input.batchId).eq("import_key", input.importKey).eq("slot_id", input.slotId).maybeSingle();
  if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot não encontrado neste lote." });
  if (slot.required && !altText) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o texto alternativo da imagem obrigatória." });
  await supabaseAdmin.from("question_import_image_slots").update({ alt_text: altText, caption, updated_at: new Date().toISOString() }).eq("id", slot.id);
  return getQuestionImportDraft(input.batchId, userId);
}

export async function prepareQuestionImportFinalization(batchId: string, userId: string) {
  const batch = await loadOwnedBatch(batchId, userId, false);
  if (batch.status === "completed") return { batch, questions: [] as NormalizedQuestionImportItem[], skippedInvalidCount: 0, skippedImportKeys: [] as string[] };
  if (batch.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este lote não pode ser finalizado agora." });
  const previews = batch.payload?.previews as QuestionImportPreviewItem[] | undefined;
  const allQuestions = batch.payload?.questions as NormalizedQuestionImportItem[] | undefined;
  if (!Array.isArray(previews) || !Array.isArray(allQuestions)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "O rascunho de importação está inconsistente." });
  if (previews.length !== allQuestions.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "O rascunho de importação está inconsistente." });
  const { valid, skipped } = selectValidQuestionImportItems(previews, allQuestions);
  if (!valid.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Não há questões válidas para importar." });
  const validKeys = new Set(valid.map((question) => question.chave_importacao || question.id_importacao || question.import_hash));
  const { data: slots, error } = await supabaseAdmin.from("question_import_image_slots").select(SLOT_SELECT).eq("batch_id", batchId);
  if (error) throw dbError("Não foi possível validar os slots.", error);
  const pending = (slots ?? []).filter((slot: any) => validKeys.has(slot.import_key) && slot.required && slot.status !== "ready");
  if (pending.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Faltam ${pending.length} imagem(ns) obrigatória(s): ${pending.map((slot: any) => `${slot.import_key}/${slot.slot_id}`).join(", ")}.` });
  const ready = (slots ?? []).filter((slot: any) => validKeys.has(slot.import_key) && slot.status === "ready").map((slot: any): ReadyImportImageSlot => ({
    slot_id: slot.slot_id, obrigatoria: slot.required, local: slot.location, alternativa: slot.alternative_key,
    nome_arquivo_esperado: slot.expected_filename, descricao: slot.description, texto_alternativo: slot.alt_text, legenda: slot.caption,
    import_key: slot.import_key, public_url: slot.public_url,
  }));
  const questions = valid.map((question) => applyReadyImageSlots(question, ready));
  const invalid = questions.map((question) => validateQuestionImportItem(question)).filter((preview) => preview.status === "invalida");
  if (invalid.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `O lote contém ${invalid.length} questão(ões) inválida(s).` });
  const skippedImportKeys = allQuestions.filter((question, index) => skipped.includes(previews[index].index))
    .map((question) => question.chave_importacao || question.id_importacao || question.import_hash)
    .filter((key) => !validKeys.has(key));
  return { batch, questions, skippedInvalidCount: skipped.length, skippedImportKeys };
}

export async function cleanupSkippedQuestionImportImages(batchId: string, importKeys: string[], userId: string) {
  if (!importKeys.length) return;
  await loadOwnedBatch(batchId, userId);
  const { data: slots, error } = await supabaseAdmin.from("question_import_image_slots")
    .select("bucket,storage_path").eq("batch_id", batchId).in("import_key", importKeys);
  if (error) throw dbError("Não foi possível consultar as imagens ignoradas.", error);
  for (const slot of slots ?? []) {
    if (slot.bucket && slot.storage_path) {
      const { error: removeError } = await supabaseAdmin.storage.from(slot.bucket).remove([slot.storage_path]);
      if (removeError) throw dbError("Não foi possível limpar a imagem ignorada.", removeError);
    }
  }
  const { error: deleteError } = await supabaseAdmin.from("question_import_image_slots")
    .delete().eq("batch_id", batchId).in("import_key", importKeys);
  if (deleteError) throw dbError("Não foi possível limpar os slots ignorados.", deleteError);
}

export async function completeQuestionImportDraft(batchId: string, userId: string, result: unknown) {
  const { error } = await supabaseAdmin.from("question_import_batches").update({ status: "completed", result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", batchId).eq("created_by", userId).eq("status", "draft");
  if (error) throw dbError("As questões foram processadas, mas o lote não pôde ser finalizado.", error);
}

export async function cancelQuestionImportDraft(batchId: string, userId: string) {
  const batch=await loadOwnedBatch(batchId,userId,false);
  if(!["draft","cancelled"].includes(batch.status))throw new TRPCError({code:"PRECONDITION_FAILED",message:"Um lote concluído não pode ser cancelado."});
  const { data: slots,error:slotsError } = await supabaseAdmin.from("question_import_image_slots").select("id,bucket,storage_path,location").eq("batch_id", batchId);
  if(slotsError)throw dbError("Não foi possível consultar os arquivos do lote.",slotsError);
  for (const bucket of ["questoes-imagens", "resolucoes-imagens"] as const) {
    const paths = (slots ?? []).filter((slot: any) => slot.bucket === bucket && slot.storage_path).map((slot: any) => slot.storage_path);
    // Include unassociated replacement candidates abandoned by a closed browser.
    // Enumerate only UUID slot directories of this owned, non-completed batch.
    for(const slot of slots??[]) {
      if((slot.location==="resolucao"?"resolucoes-imagens":"questoes-imagens")!==bucket)continue;
      for(let offset=0;;offset+=100) {
        const {data:files,error:listError}=await supabaseAdmin.storage.from(bucket).list(replacementPrefix(batchId,slot).slice(0,-1),{limit:100,offset});
        if(listError)throw dbError("Não foi possível localizar os arquivos temporários.",listError);
        for(const file of files??[])if(/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(file.name))paths.push(`${replacementPrefix(batchId,slot)}${file.name}`);
        if(!files || files.length<100)break;
      }
    }
    const uniquePaths=Array.from(new Set(paths));
    for(let offset=0;offset<uniquePaths.length;offset+=1000) {const {error}=await supabaseAdmin.storage.from(bucket).remove(uniquePaths.slice(offset,offset+1000));if(error)throw dbError("Não foi possível limpar os arquivos temporários.",error);}
  }
  await supabaseAdmin.from("question_import_batches").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", batchId).eq("created_by", userId);
  await supabaseAdmin.from("admin_logs").insert({ actor_user_id: userId, action: "question_import_draft_cancelled", entity_type: "question_import_batch", entity_id: batchId, description: "Rascunho de importação cancelado e uploads temporários removidos.", level: "info", metadata: {} });
  return { success: true } as const;
}

export async function cleanupExpiredQuestionImportDrafts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("question_import_batches")
    .select("id")
    .eq("created_by", userId)
    .in("status", ["draft","cancelled"])
    .lt("expires_at", new Date().toISOString())
    .limit(50);
  if (error) throw dbError("Não foi possível localizar os rascunhos expirados.", error);

  const cleaned: string[] = [];
  for (const batch of data ?? []) {
    await cancelQuestionImportDraft(batch.id, userId);
    cleaned.push(batch.id);
  }
  return { success: true, cleanedCount: cleaned.length } as const;
}
