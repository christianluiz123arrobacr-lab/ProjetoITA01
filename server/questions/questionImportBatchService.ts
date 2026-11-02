import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { bounded, safeErrorCode } from "../../shared/authRecovery.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import {
  MAX_QUESTION_IMPORT_IMAGE_BYTES,
  buildQuestionInsertPayload,
  normalizedQuestionImportItemSchema,
  parseQuestionImportJsonText,
  summarizeQuestionImport,
  validateQuestionImportItem,
  type NormalizedQuestionImportItem,
  type QuestionImportPreviewItem,
} from "../../shared/questionImportSchema.js";
import { selectValidQuestionImportItems } from "../../shared/questionImportSelection.js";
import {
  applyReadyImageSlots,
  inspectQuestionImportImage,
  sanitizeImportFileName,
  type QuestionImportImageType,
  type ReadyImportImageSlot,
} from "./questionImportImages.js";
import { normalizeResolutionBlockPayload } from "./resolutionPayload.js";

const BATCH_SELECT =
  "id,created_by,status,format,source_name,payload,validation_summary,result,created_at,updated_at,completed_at,expires_at,operation_kind,lease_until,revision,last_error,cleanup_pending,cleanup_slot,cleanup_offset";
const SLOT_SELECT =
  "id,batch_id,import_key,slot_id,required,location,alternative_key,expected_filename,description,alt_text,caption,bucket,storage_path,public_url,original_name,mime_type,byte_size,width,height,status,created_at,updated_at";
const keyOf = (q: NormalizedQuestionImportItem) =>
  q.chave_importacao || q.id_importacao || q.import_hash;
const cleanText = (text?: string | null) =>
  text?.trim().replace(/[<>]/g, "").slice(0, 500) || null;

function dbError(stage: string, error?: unknown): TRPCError {
  const code = safeErrorCode(error);
  console.warn({ event: "question_import_database", stage, code });
  const detail =
    typeof (error as any)?.message === "string" ? (error as any).message : "";
  if (code === "42501")
    return new TRPCError({
      code: "FORBIDDEN",
      message: "Você não pode alterar este lote ou arquivo.",
    });
  if (code === "P0002")
    return new TRPCError({
      code: "NOT_FOUND",
      message: "Lote ou slot não encontrado.",
    });
  if (["40001", "55P03", "40P01"].includes(code || ""))
    return new TRPCError({
      code: "CONFLICT",
      message:
        "Outra operação assumiu ou alterou o lote. Consulte o estado salvo antes de continuar.",
    });
  if (["55000", "22023"].includes(code || ""))
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: detail.includes("PARTIAL")
        ? "Este lote já possui conteúdo importado. Retome a importação; o cancelamento não pode apagar esse conteúdo."
        : "Esta ação não é permitida no estado atual do lote. Consulte o estado salvo.",
    });
  return new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Não foi possível confirmar a operação. O progresso salvo foi preservado; consulte o lote antes de tentar novamente.",
  });
}
async function rpc(
  name: string,
  args: Record<string, unknown>,
  deadline = Date.now() + 8000
) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc(name, args)
      .abortSignal(
        AbortSignal.timeout(Math.max(1, Math.min(8000, deadline - Date.now())))
      );
    if (error) throw dbError(name, error);
    if (data === null) throw dbError(name);
    return data as any;
  } catch (error) {
    throw error instanceof TRPCError ? error : dbError(name, error);
  }
}
const control = (
  batchId: string,
  userId: string,
  action: string,
  token: string | null = null,
  args: Record<string, unknown> = {},
  deadline?: number
) =>
  rpc(
    "vet_import_control",
    {
      p_batch: batchId,
      p_actor: userId,
      p_action: action,
      p_token: token,
      p_args: args,
    },
    deadline
  );
async function loadOwnedBatch(batchId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("question_import_batches")
    .select(BATCH_SELECT)
    .eq("id", batchId)
    .eq("created_by", userId)
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();
  if (error) throw dbError("load_batch", error);
  if (!data)
    throw new TRPCError({ code: "NOT_FOUND", message: "Lote não encontrado." });
  return data as any;
}
async function release(
  batchId: string,
  userId: string,
  token: string,
  failed = false
) {
  // A lost response must never release another execution or roll back items.
  try {
    await control(batchId, userId, "release", token, {
      error: failed ? "operation_interrupted" : null,
    });
  } catch {
    console.warn({
      event: "question_import_release",
      outcome: "lease_expiry_required",
    });
  }
}
async function edit<T>(
  batchId: string,
  userId: string,
  operation: (token: string, batch: any) => Promise<T>
): Promise<T> {
  const token = randomUUID();
  const batch = await control(batchId, userId, "claim", token, {
    kind: "edit",
  });
  let failed = true;
  try {
    const value = await operation(token, batch);
    failed = false;
    return value;
  } finally {
    await release(batchId, userId, token, failed);
  }
}
function draftPayload(previews: QuestionImportPreviewItem[]) {
  return { questions: previews.map(p => p.item), previews };
}
async function createDraft(
  userId: string,
  previews: QuestionImportPreviewItem[],
  format: string,
  sourceName?: string,
  requestKey?: string
) {
  const slots = previews.flatMap(({ item }) =>
    item.imagens.map(slot => ({
      import_key: keyOf(item),
      slot_id: slot.slot_id,
      required: slot.obrigatoria,
      location: slot.local,
      alternative_key: slot.alternativa,
      expected_filename: slot.nome_arquivo_esperado,
      description: slot.descricao,
      alt_text: slot.texto_alternativo,
      caption: slot.legenda,
    }))
  );
  const batch = await control(randomUUID(), userId, "create", null, {
    format,
    source_name: sourceName?.trim().slice(0, 180) || null,
    payload: draftPayload(previews),
    summary: summarizeQuestionImport(previews),
    slots,
    request_key: requestKey,
  });
  return getQuestionImportDraft(batch.id, userId);
}
export async function createQuestionImportDraft(
  userId: string,
  rawJson: string,
  sourceName?: string
) {
  const parsed = parseQuestionImportJsonText(rawJson);
  return createDraft(
    userId,
    parsed.questoes,
    parsed.versao || parsed.tipo,
    sourceName
  );
}
export async function getQuestionImportDraft(batchId: string, userId: string) {
  // Same batch lock as mutations: never combine an old revision with newer
  // slots/journal from two other HTTP queries. The RPC redacts the lease token.
  return control(batchId, userId, "snapshot");
}
export async function listQuestionImportDrafts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("question_import_batches")
    .select(
      "id,status,format,source_name,validation_summary,created_at,updated_at,expires_at,operation_kind,lease_until,last_error,cleanup_pending"
    )
    .eq("created_by", userId)
    .in("status", ["draft", "finalizing", "completed", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw dbError("list_batches", error);
  return data ?? [];
}
export async function removeInvalidQuestionFromImportDraft(
  batchId: string,
  questionIndex: number,
  userId: string
) {
  await edit(batchId, userId, async (token, batch) => {
    const { questions, previews } = batch.payload;
    if (
      !Array.isArray(questions) ||
      !Array.isArray(previews) ||
      questions.length !== previews.length
    )
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Rascunho inconsistente.",
      });
    const position = previews.findIndex(
      (p: QuestionImportPreviewItem) => p.index === questionIndex
    );
    if (position < 0 || previews[position].status !== "invalida")
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Somente uma questão inválida pode ser removida.",
      });
    const key = keyOf(questions[position]);
    if (
      questions.some(
        (q: NormalizedQuestionImportItem, i: number) =>
          i !== position && keyOf(q) === key
      )
    )
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Corrija primeiro a chave duplicada no JSON.",
      });
    const next = previews.filter((_: unknown, i: number) => i !== position);
    await control(batchId, userId, "remove_invalid", token, {
      import_key: key,
      payload: draftPayload(next),
      summary: summarizeQuestionImport(next),
    });
    for (const slot of batch.slots
      .filter((s: any) => s.import_key === key && s.storage_path)
      .slice(0, 3))
      await cleanupFiles(batchId, userId, token, slot.storage_path);
  });
  return getQuestionImportDraft(batchId, userId);
}

export type ImportUploadIdentity = {
  batchId: string;
  importKey: string;
  slotId: string;
};
const slotArgs = (input: ImportUploadIdentity) => ({
  import_key: input.importKey,
  slot_id: input.slotId,
});
function replacementPrefix(batchId: string, slot: any) {
  return `question-imports/${batchId}/${slot.id}/`;
}
function assertReplacementPath(batchId: string, slot: any, path: string) {
  if (
    !path.startsWith(replacementPrefix(batchId, slot)) ||
    !/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(
      path.slice(replacementPrefix(batchId, slot).length)
    )
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Arquivo não pertence a este lote e slot.",
    });
}
async function getUploadSlot(input: ImportUploadIdentity) {
  const { data, error } = await supabaseAdmin
    .from("question_import_image_slots")
    .select(SLOT_SELECT)
    .eq("batch_id", input.batchId)
    .eq("import_key", input.importKey)
    .eq("slot_id", input.slotId)
    .maybeSingle();
  if (error) throw dbError("load_slot", error);
  if (!data)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Slot não encontrado neste lote.",
    });
  return data as any;
}
export async function prepareQuestionImportSlotUpload(
  input: ImportUploadIdentity & {
    originalName: string;
    contentType: QuestionImportImageType;
    byteSize: number;
  },
  userId: string
) {
  return edit(input.batchId, userId, async token => {
    if (
      input.byteSize < 1 ||
      input.byteSize > MAX_QUESTION_IMPORT_IMAGE_BYTES ||
      !/\.(png|jpe?g|webp)$/i.test(input.originalName)
    )
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Selecione PNG, JPEG ou WebP de até 3 MiB.",
      });
    const slot = await getUploadSlot(input);
    const extension =
      input.contentType === "image/png"
        ? "png"
        : input.contentType === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${replacementPrefix(input.batchId, slot)}${randomUUID()}.${extension}`;
    const bucket =
      slot.location === "resolucao" ? "resolucoes-imagens" : "questoes-imagens";
    const storage = supabaseAdmin.storage.from(bucket);
    // Register before issuing a capability: abandoned/late uploads stay tracked.
    await control(input.batchId, userId, "register", token, {
      ...slotArgs(input),
      path,
      url: storage.getPublicUrl(path).data.publicUrl,
    });
    const { data, error } = await bounded(
      storage.createSignedUploadUrl(path),
      8000
    );
    if (error || !data?.token) throw dbError("prepare_upload", error);
    return {
      bucket,
      path,
      previousPath: slot.storage_path ?? null,
      token: data.token,
      signedUrl: data.signedUrl,
    };
  });
}
// Commit the tombstone BEFORE Storage. A delayed deletion remains safe after a
// lease loss because no execution can ever associate a tombstoned path again.
async function cleanupFiles(
  batchId: string,
  userId: string,
  token: string,
  path?: string
) {
  let files;
  try {
    files = await control(batchId, userId, "plan_delete", token, { path });
  } catch {
    console.warn({
      event: "question_import_cleanup",
      outcome: "planning_deferred",
    });
    return false;
  }
  let removed = false;
  for (const file of files as { id: string; bucket: string; path: string }[]) {
    try {
      const { data, error } = await bounded(
        supabaseAdmin.storage.from(file.bucket).remove([file.path]),
        3000
      );
      if (error) throw error;
      await control(batchId, userId, "deleted", token, {
        asset_id: file.id,
        removed: Boolean(data?.length),
      });
      removed = true;
    } catch (error) {
      console.warn({
        event: "question_import_cleanup",
        outcome: "deferred",
        code: safeErrorCode(error),
      });
      try {
        await control(batchId, userId, "deleted", token, {
          asset_id: file.id,
          error: "storage_cleanup_pending",
        });
      } catch {
        console.warn({
          event: "question_import_cleanup",
          outcome: "tombstone_preserved",
        });
      }
    }
  }
  return removed;
}
export async function discardQuestionImportReplacement(
  input: ImportUploadIdentity & { uploadPath: string },
  userId: string
) {
  const batch = await loadOwnedBatch(input.batchId, userId);
  const slot = await getUploadSlot(input);
  assertReplacementPath(input.batchId, slot, input.uploadPath);
  if (batch.status === "finalizing" || slot.storage_path === input.uploadPath)
    return { removed: false };
  if (batch.status === "draft")
    return edit(input.batchId, userId, async token => ({
      removed: await cleanupFiles(
        input.batchId,
        userId,
        token,
        input.uploadPath
      ),
    }));
  return cleanupTerminal(batch.id, userId, input.uploadPath);
}
export async function confirmQuestionImportSlotUpload(
  input: ImportUploadIdentity & {
    altText: string;
    caption?: string | null;
    uploadPath?: string;
    previousPath?: string | null;
    contentType?: QuestionImportImageType;
    originalName?: string;
  },
  userId: string
) {
  await edit(input.batchId, userId, async token => {
    const slot = await getUploadSlot(input);
    const legacy = !input.uploadPath && slot.status === "uploading";
    const path = input.uploadPath || (legacy ? slot.storage_path : null);
    if (!path)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Selecione o arquivo novamente.",
      });
    assertReplacementPath(input.batchId, slot, path);
    if (slot.storage_path === path && slot.status === "ready") return;
    const bucket =
      slot.location === "resolucao" ? "resolucoes-imagens" : "questoes-imagens";
    const { data: blob, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(path, {}, { signal: AbortSignal.timeout(8000) });
    if (error || !blob) throw dbError("download_upload", error);
    let info;
    try {
      info = inspectQuestionImportImage(
        new Uint8Array(await blob.arrayBuffer()),
        input.contentType || slot.mime_type || ""
      );
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Conteúdo da imagem inválido.",
      });
    }
    const extension =
      info.mime === "image/png"
        ? "png"
        : info.mime === "image/webp"
          ? "webp"
          : "jpg";
    if (!path.endsWith(`.${extension}`))
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Extensão e conteúdo não correspondem.",
      });
    await control(input.batchId, userId, "confirm", token, {
      ...slotArgs(input),
      path,
      previous_path: legacy ? slot.storage_path : (input.previousPath ?? null),
      alt: cleanText(input.altText) || "",
      caption: cleanText(input.caption),
      name: sanitizeImportFileName(
        input.originalName || slot.original_name || path.split("/").pop()!
      ),
      mime: info.mime,
      bytes: info.byteSize,
      width: info.width,
      height: info.height,
    });
    const previous = legacy ? null : input.previousPath;
    if (previous && previous !== path)
      await cleanupFiles(input.batchId, userId, token, previous);
  });
  return getQuestionImportDraft(input.batchId, userId);
}
export async function removeQuestionImportSlotUpload(
  batchId: string,
  importKey: string,
  slotId: string,
  userId: string
) {
  await edit(batchId, userId, async token => {
    const previous = await getUploadSlot({ batchId, importKey, slotId });
    await control(batchId, userId, "remove_slot", token, {
      import_key: importKey,
      slot_id: slotId,
    });
    if (previous.storage_path)
      await cleanupFiles(batchId, userId, token, previous.storage_path);
  });
  return getQuestionImportDraft(batchId, userId);
}
export async function updateQuestionImportSlotMetadata(
  input: ImportUploadIdentity & { altText: string; caption?: string | null },
  userId: string
) {
  await edit(input.batchId, userId, token =>
    control(input.batchId, userId, "metadata", token, {
      ...slotArgs(input),
      alt: cleanText(input.altText) || "",
      caption: cleanText(input.caption),
    })
  );
  return getQuestionImportDraft(input.batchId, userId);
}
function prepareFinalization(batch: any, slots: any[]) {
  const { previews, questions: all } = batch.payload;
  const { valid, skipped } = selectValidQuestionImportItems(previews, all);
  if (!valid.length)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Não há questões válidas para importar.",
    });
  const keys = new Set(valid.map(keyOf));
  const pending = slots.filter(
    s => keys.has(s.import_key) && s.required && s.status !== "ready"
  );
  if (pending.length)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Imagens obrigatórias pendentes: ${pending.map(s => `${s.import_key}/${s.slot_id}`).join(", ")}.`,
    });
  const ready: ReadyImportImageSlot[] = slots
    .filter(s => keys.has(s.import_key) && s.status === "ready")
    .map(s => ({
      slot_id: s.slot_id,
      obrigatoria: s.required,
      local: s.location,
      alternativa: s.alternative_key,
      nome_arquivo_esperado: s.expected_filename,
      descricao: s.description,
      texto_alternativo: s.alt_text,
      legenda: s.caption,
      import_key: s.import_key,
      public_url: s.public_url,
    }));
  const unique = new Map<string, NormalizedQuestionImportItem>();
  for (const q of valid) {
    const previous = unique.get(keyOf(q));
    if (previous && previous.import_hash !== q.import_hash)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Há questões diferentes com a mesma chave. Corrija o JSON antes de importar.",
      });
    unique.set(keyOf(q), q);
  }
  const questions = Array.from(unique.values()).map(q =>
    normalizedQuestionImportItemSchema.parse(applyReadyImageSlots(q, ready))
  );
  if (questions.some(q => validateQuestionImportItem(q).status !== "valida"))
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "O lote contém questões inválidas após a vinculação de imagens.",
    });
  return { questions, skippedInvalidCount: skipped.length };
}
function summary(
  batchId: string,
  rows: any[],
  total: number,
  skippedInvalidCount: number,
  status: string
) {
  const results = rows.map(row => row.result);
  return {
    batchId,
    status,
    createdCount: results.filter(r => r.status === "criada").length,
    duplicatedCount: results.filter(r => r.status === "duplicada").length,
    failedCount: 0,
    reviewRequiredCount: results.filter(r => r.requiresReview).length,
    resolutionBlocksSaved: results.reduce(
      (sum, r) => sum + r.resolutionBlocksSaved,
      0
    ),
    skippedInvalidCount,
    confirmedCount: results.length,
    pendingCount: Math.max(0, total - results.length),
    results,
  };
}
export async function finalizeQuestionImportDraft(
  batchId: string,
  userId: string
) {
  const deadline = Date.now() + 15000;
  const token = randomUUID();
  const claimed = await control(
    batchId,
    userId,
    "claim",
    token,
    { kind: "finalize" },
    deadline
  );
  if (claimed.status === "completed") return claimed.result;
  let finished = false,
    failed = true;
  try {
    // Snapshot obtained under the claim's row lock. Other mutations are fenced.
    const prepared = prepareFinalization(claimed, claimed.slots);
    const saved = [...claimed.progress];
    const confirmed = new Set(saved.map((r: any) => r.import_key));
    await control(batchId, userId, "start", token, {}, deadline);
    // Short, resumable HTTP steps; no background work after the response.
    const started = Date.now();
    let processed = 0;
    for (const question of prepared.questions) {
      if (confirmed.has(keyOf(question))) continue;
      if (
        processed >= 1 ||
        Date.now() - started >= 8000 ||
        deadline - Date.now() < 3000
      )
        break;
      const itemResult = await rpc(
        "vet_import_commit_item",
        {
          p_batch: batchId,
          p_actor: userId,
          p_token: token,
          p_key: keyOf(question),
          p_question: buildQuestionInsertPayload(question, batchId, userId),
          p_blocks: question.resolucao_blocos.map(block => {
            const { questao_id: _id, ...payload } =
              normalizeResolutionBlockPayload("", block);
            return payload;
          }),
          p_index: question.raw_index,
        },
        deadline
      );
      saved.push({ import_key: keyOf(question), result: itemResult });
      processed++;
    }
    if (processed === 0 && saved.length < prepared.questions.length) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "O prazo desta etapa terminou antes de confirmar outro item. Consulte o lote e retome os itens pendentes.",
      });
    }
    const result = summary(
      batchId,
      saved,
      prepared.questions.length,
      prepared.skippedInvalidCount,
      saved.length === prepared.questions.length ? "completed" : "finalizing"
    );
    if (result.pendingCount === 0) {
      await control(
        batchId,
        userId,
        "complete",
        token,
        { expected_count: prepared.questions.length, result },
        deadline
      );
      finished = true;
    }
    failed = false;
    return result;
  } finally {
    if (!finished) {
      try {
        await control(
          batchId,
          userId,
          "release",
          token,
          { error: failed ? "operation_interrupted" : null },
          deadline
        );
      } catch {
        console.warn({
          event: "question_import_release",
          outcome: "lease_expiry_required",
        });
      }
    }
  }
}
export async function importLegacyQuestionBatch(
  input: { batchId: string; questions: NormalizedQuestionImportItem[] },
  userId: string
) {
  const draft = await createDraft(
    userId,
    input.questions.map(q => validateQuestionImportItem(q)),
    "legacy-endpoint",
    undefined,
    input.batchId
  );
  return finalizeQuestionImportDraft(draft.id, userId);
}
async function cleanupTerminal(batchId: string, userId: string, path?: string) {
  const token = randomUUID();
  const batch = await control(batchId, userId, "claim", token, {
    kind: "cleanup",
  });
  try {
    if (!path) await discoverLegacyFiles(batch, userId, token);
    return { removed: await cleanupFiles(batchId, userId, token, path) };
  } finally {
    await release(batchId, userId, token);
  }
}
export async function cancelQuestionImportDraft(
  batchId: string,
  userId: string
) {
  const token = randomUUID();
  // Persist cancellation BEFORE external deletion. Partial batches require resume.
  const batch = await control(batchId, userId, "claim", token, {
    kind: "cancel",
  });
  try {
    await discoverLegacyFiles(batch, userId, token);
    await cleanupFiles(batchId, userId, token);
  } finally {
    await release(batchId, userId, token);
  }
  return getQuestionImportDraft(batchId, userId);
}
async function discoverLegacyFiles(batch: any, userId: string, token: string) {
  // One directory/page per maintenance call, with a persisted cursor. Unknown
  // layouts are preserved. New uploads are always registered before signing.
  const slots = [...batch.slots].sort((a: any, b: any) =>
    a.id.localeCompare(b.id)
  );
  const index = batch.cleanup_slot < slots.length ? batch.cleanup_slot : 0;
  const slot = slots[index];
  if (!slot) {
    await control(batch.id, userId, "advance_scan", token, {
      slot: 0,
      offset: 0,
    });
    return;
  }
  const bucket =
    slot.location === "resolucao" ? "resolucoes-imagens" : "questoes-imagens";
  const storage = supabaseAdmin.storage.from(bucket);
  try {
    const { data, error } = await storage.list(
      replacementPrefix(batch.id, slot).slice(0, -1),
      { limit: 3, offset: batch.cleanup_offset },
      { signal: AbortSignal.timeout(5000) }
    );
    if (error) throw error;
    for (const file of data ?? [])
      if (/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(file.name)) {
        const path = replacementPrefix(batch.id, slot) + file.name;
        await control(batch.id, userId, "discover", token, {
          slot_row_id: slot.id,
          path,
          url: storage.getPublicUrl(path).data.publicUrl,
        });
      }
    await control(batch.id, userId, "advance_scan", token, {
      slot:
        data?.length === 3 ? index : index + 1 < slots.length ? index + 1 : 0,
      offset: data?.length === 3 ? batch.cleanup_offset + 3 : 0,
    });
  } catch {
    console.warn({
      event: "question_import_cleanup",
      outcome: "legacy_scan_deferred",
    });
  }
}
export async function cleanupQuestionImportDraft(
  batchId: string,
  userId: string
) {
  const batch = await loadOwnedBatch(batchId, userId);
  if (batch.status === "draft")
    await edit(batchId, userId, token => cleanupFiles(batchId, userId, token));
  else await cleanupTerminal(batchId, userId);
  return getQuestionImportDraft(batchId, userId);
}
export async function cleanupExpiredQuestionImportDrafts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("question_import_batches")
    .select("id,status,cleanup_pending")
    .eq("created_by", userId)
    .in("status", ["draft", "cancelled", "completed"])
    .lt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: true })
    .limit(5);
  if (error) throw dbError("expired_batches", error);
  let cleanedCount = 0,
    deferredCount = 0;
  for (const batch of data ?? []) {
    try {
      if (batch.status === "draft")
        await cancelQuestionImportDraft(batch.id, userId);
      else await cleanupTerminal(batch.id, userId);
      const saved = await loadOwnedBatch(batch.id, userId);
      if (saved.cleanup_pending) deferredCount++;
      else cleanedCount++;
    } catch {
      deferredCount++;
    }
  }
  return { success: deferredCount === 0, cleanedCount, deferredCount };
}
