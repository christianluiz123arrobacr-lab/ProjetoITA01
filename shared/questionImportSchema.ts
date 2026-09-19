import { z } from "zod";
import { normalizeDifficulty, type QuestionDifficulty } from "./difficulty.js";

export const MAX_QUESTION_IMPORT_ITEMS = 50;
export const MAX_QUESTION_IMPORT_JSON_BYTES = 2 * 1024 * 1024;

export const QUESTION_IMPORT_BLOCK_TYPES = ["texto", "latex", "imagem", "equacao_quimica", "molecula"] as const;
export type QuestionImportBlockType = (typeof QUESTION_IMPORT_BLOCK_TYPES)[number];
export type QuestionImportStatus = "valida" | "invalida";
export type ImportResultStatus = "criada" | "duplicada" | "falhou";

export type AssuntosPorConteudoImportItem = {
  conteudo: string;
  assuntos: string[];
};

export type NormalizedResolutionImportBlock = {
  tipo: QuestionImportBlockType;
  texto: string | null;
  url_imagem: string | null;
  ordem: number;
};

export type NormalizedQuestionImportItem = {
  id_importacao: string | null;
  codigo: string | null;
  disciplina: string;
  dificuldade: QuestionDifficulty;
  conteudos: string[];
  assuntos: string[];
  assuntos_por_conteudo: AssuntosPorConteudoImportItem[];
  banca: string | null;
  ano: number | null;
  instituição: string | null;
  publicada: boolean;
  enunciado: string;
  enunciado_pos_imagem: string | null;
  formula: string | null;
  url_imagem: string | null;
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  a_url_imagem: string | null;
  b_url_imagem: string | null;
  c_url_imagem: string | null;
  d_url_imagem: string | null;
  e_url_imagem: string | null;
  alternativa_correta: "a" | "b" | "c" | "d" | "e" | "";
  resolucao_blocos: NormalizedResolutionImportBlock[];
  import_hash: string;
  raw_index: number;
};

export type QuestionImportPreviewItem = {
  index: number;
  item: NormalizedQuestionImportItem;
  status: QuestionImportStatus;
  errors: string[];
  warnings: string[];
  alternativas_preenchidas: number;
  resolution_blocks_count: number;
};

export type QuestionImportSummary = {
  total: number;
  validas: number;
  comAvisos: number;
  invalidas: number;
  totalBlocosResolucao: number;
};

export type QuestionImportBatch = {
  batchId: string;
  versao: string | null;
  tipo: string;
  questoes: QuestionImportPreviewItem[];
  summary: QuestionImportSummary;
};

export const normalizedResolutionImportBlockSchema = z.object({
  tipo: z.enum(QUESTION_IMPORT_BLOCK_TYPES),
  texto: z.string().nullable(),
  url_imagem: z.string().nullable(),
  ordem: z.number().int().min(1).max(500),
});

export const normalizedQuestionImportItemSchema = z.object({
  id_importacao: z.string().trim().min(1).max(180).nullable(),
  codigo: z.string().trim().min(1).max(120).nullable(),
  disciplina: z.string().trim().min(1).max(120),
  dificuldade: z.enum(["facil", "medio", "dificil", "muito_dificil"]),
  conteudos: z.array(z.string().trim().min(1).max(160)).min(1).max(40),
  assuntos: z.array(z.string().trim().min(1).max(180)).min(1).max(80),
  assuntos_por_conteudo: z.array(z.object({
    conteudo: z.string().trim().min(1).max(160),
    assuntos: z.array(z.string().trim().min(1).max(180)).min(1).max(40),
  })).min(1).max(40),
  banca: z.string().trim().min(1).max(120).nullable(),
  ano: z.number().int().min(1900).max(2200).nullable(),
  instituição: z.string().trim().min(1).max(160).nullable(),
  publicada: z.boolean(),
  enunciado: z.string().trim().min(1).max(50000),
  enunciado_pos_imagem: z.string().trim().max(20000).nullable(),
  formula: z.string().trim().max(10000).nullable(),
  url_imagem: z.string().trim().max(2000).nullable(),
  A: z.string().trim().max(20000),
  B: z.string().trim().max(20000),
  C: z.string().trim().max(20000),
  D: z.string().trim().max(20000),
  E: z.string().trim().max(20000),
  a_url_imagem: z.string().trim().max(2000).nullable(),
  b_url_imagem: z.string().trim().max(2000).nullable(),
  c_url_imagem: z.string().trim().max(2000).nullable(),
  d_url_imagem: z.string().trim().max(2000).nullable(),
  e_url_imagem: z.string().trim().max(2000).nullable(),
  alternativa_correta: z.enum(["a", "b", "c", "d", "e", ""]),
  resolucao_blocos: z.array(normalizedResolutionImportBlockSchema).max(500),
  import_hash: z.string().trim().min(1).max(80),
  raw_index: z.number().int().min(0).max(MAX_QUESTION_IMPORT_ITEMS - 1),
});

export const questionImportPayloadSchema = z.object({
  batchId: z.string().trim().min(1).max(120),
  questions: z.array(normalizedQuestionImportItemSchema).min(1).max(MAX_QUESTION_IMPORT_ITEMS),
});

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeJsonKey(value: string) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "");
}

function read(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }

  const normalizedKeys = new Set(keys.map(normalizeJsonKey));

  for (const [recordKey, value] of Object.entries(record)) {
    if (normalizedKeys.has(normalizeJsonKey(recordKey))) return value;
  }

  return undefined;
}

function readString(record: JsonRecord, keys: string[]) {
  const value = read(record, keys);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readBoolean(record: JsonRecord, keys: string[], fallback: boolean) {
  const value = read(record, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = normalizeSearch(value);
    if (["true", "1", "sim", "publicada", "published"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "rascunho", "draft"].includes(normalized)) return false;
  }
  return fallback;
}

function cleanText(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value).trim()
    : "";
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

export function normalizeTextList(values: unknown): string[] {
  const raw = Array.isArray(values)
    ? values.map(cleanText)
    : typeof values === "string"
      ? values.split(/[;,\n]/g).map(cleanText)
      : [cleanText(values)];

  const map = new Map<string, string>();
  for (const item of raw) {
    if (!item) continue;
    const key = normalizeSearch(item);
    if (!map.has(key)) map.set(key, item.replace(/\s+/g, " "));
  }
  return Array.from(map.values());
}

function readStringArray(record: JsonRecord, keys: string[]) {
  return normalizeTextList(read(record, keys));
}

function first(values: string[]) {
  return values[0] ?? "";
}

function nullable(value: string) {
  const clean = value.trim();
  return clean ? clean : null;
}

function normalizeCorrectAlternative(value: string): "a" | "b" | "c" | "d" | "e" | "" {
  const normalized = value.trim().toLowerCase();
  return ["a", "b", "c", "d", "e"].includes(normalized) ? normalized as "a" | "b" | "c" | "d" | "e" : "";
}

function readAlternative(record: JsonRecord, letter: "A" | "B" | "C" | "D" | "E", image: boolean) {
  const lower = letter.toLowerCase();
  const alternatives = read(record, ["alternativas", "alternatives", "opcoes", "opções"]);
  const textKeys = ["texto", "text", "valor", "value", "conteudo"];
  const imageKeys = ["url_imagem", "image", "imagem", "imageUrl"];

  if (isRecord(alternatives)) {
    const raw = read(alternatives, [letter, lower]);
    if (!image && (typeof raw === "string" || typeof raw === "number")) return String(raw);
    if (isRecord(raw)) return readString(raw, image ? imageKeys : textKeys);
  }

  if (Array.isArray(alternatives)) {
    const item = alternatives.find((alternative) => isRecord(alternative) && normalizeSearch(readString(alternative, ["letra", "letter", "alternativa"])) === lower);
    if (isRecord(item)) return readString(item, image ? imageKeys : textKeys);
  }

  return readString(record, image
    ? [`${lower}_url_imagem`, `${letter}_url_imagem`, `alternativa_${lower}_imagem`, `alternativa_${letter}_imagem`]
    : [letter, lower, `alternativa_${lower}`, `alternativa_${letter}`]
  );
}

function normalizeBlockType(value: string, imageUrl: string): QuestionImportBlockType | null {
  const normalized = normalizeSearch(value);
  if (["imagem", "image"].includes(normalized) || imageUrl.trim()) return "imagem";
  if (["latex", "formula", "fórmula", "math"].includes(normalized)) return "latex";
  if (["equacao_quimica", "equação_química", "chemical_equation"].includes(normalized)) return "equacao_quimica";
  if (["molecula", "molécula", "molecule", "smiles"].includes(normalized)) return "molecula";
  if (!normalized || ["texto", "text", "markdown"].includes(normalized)) return "texto";
  return null;
}

function readResolutionBlocks(record: JsonRecord) {
  const direct = read(record, ["resolucao_blocos", "resolução_blocos", "blocos_resolucao", "blocos_resolução", "resolution_blocks", "resolutionBlocks"]);
  const resolution = read(record, ["resolucao", "resolução", "resolution", "resolucoes", "resoluções"]);
  const blocks = Array.isArray(direct) ? direct : isRecord(resolution) ? read(resolution, ["blocos", "blocks", "passos", "steps"]) : resolution;
  const unsupportedTypes: string[] = [];

  const normalizedBlocks = typeof blocks === "string" ? [blocks] : blocks;
  if (!Array.isArray(normalizedBlocks)) return { blocks: [] as NormalizedResolutionImportBlock[], unsupportedTypes };

  const parsed: NormalizedResolutionImportBlock[] = [];
  normalizedBlocks.forEach((item, index) => {
    if (typeof item === "string") {
      if (item.trim()) parsed.push({ tipo: "texto", texto: item.trim(), url_imagem: null, ordem: index + 1 });
      return;
    }
    if (!isRecord(item)) return;
    let texto = readString(item, ["texto", "text", "conteudo", "content", "latex"]);
    const url = readString(item, ["url_imagem", "imagem", "image", "imageUrl"]);
    const rawType = readString(item, ["tipo", "type"]);
    const tipo = normalizeBlockType(rawType, url);
    if (!tipo) {
      unsupportedTypes.push(rawType || `bloco ${index + 1}`);
      return;
    }
    if (tipo === "imagem" && !url.trim()) return;
    if (tipo === "molecula") {
      const smiles = readString(item, ["smiles"]);
      const legenda = readString(item, ["legenda", "caption"]);
      texto = JSON.stringify({ smiles, ...(legenda ? { legenda } : {}) });
    }
    if (tipo !== "imagem" && !texto.trim()) return;
    parsed.push({
      tipo,
      texto: tipo === "imagem" ? null : texto.trim(),
      url_imagem: tipo === "imagem" ? url.trim() : null,
      ordem: Number(readString(item, ["ordem", "order"])) || index + 1,
    });
  });

  return {
    blocks: parsed.sort((a, b) => a.ordem - b.ordem).map((block, index) => ({ ...block, ordem: index + 1 })),
    unsupportedTypes,
  };
}

function readAssuntosPorConteudo(record: JsonRecord, conteudos: string[]) {
  const value = read(record, ["assuntos_por_conteudo", "assuntosPorConteudo"]);
  if (!Array.isArray(value)) return conteudos.map((conteudo) => ({ conteudo, assuntos: [] }));
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      return {
        conteudo: readString(item, ["conteudo", "content"]),
        assuntos: readStringArray(item, ["assuntos", "subtopics"]),
      };
    })
    .filter((item): item is AssuntosPorConteudoImportItem => !!item && !!item.conteudo.trim())
    .map((item) => ({ conteudo: item.conteudo.trim(), assuntos: normalizeTextList(item.assuntos) }));
}

function flattenAssuntos(groups: AssuntosPorConteudoImportItem[]) {
  return normalizeTextList(groups.flatMap((item) => item.assuntos));
}

function fnv1aHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getQuestionImportSourceId(question: NormalizedQuestionImportItem) {
  return question.id_importacao || question.import_hash;
}

function buildImportHash(data: Pick<NormalizedQuestionImportItem, "disciplina" | "enunciado" | "A" | "B" | "C" | "D" | "E" | "alternativa_correta">) {
  const basis = [data.disciplina, data.enunciado, data.A, data.B, data.C, data.D, data.E, data.alternativa_correta]
    .map((item) => normalizeSearch(item ?? ""))
    .join("|");
  return `qimp_${fnv1aHash(basis)}_${fnv1aHash(basis.split("").reverse().join(""))}`;
}

function normalizeQuestion(record: JsonRecord, rawIndex: number): { item: NormalizedQuestionImportItem; unsupportedBlockTypes: string[] } {
  const conteudos = normalizeTextList([
    ...readStringArray(record, ["conteudos", "contents"]),
    readString(record, ["conteudo", "content"]),
  ]);
  const groups = readAssuntosPorConteudo(record, conteudos);
  const assuntos = normalizeTextList([
    ...flattenAssuntos(groups),
    ...readStringArray(record, ["assuntos", "subtopics"]),
    readString(record, ["assunto", "subtopic"]),
  ]);
  const normalizedGroups = groups.length > 0
    ? groups.map((group) => ({ conteudo: group.conteudo, assuntos: normalizeTextList(group.assuntos.length ? group.assuntos : assuntos) }))
    : conteudos.map((conteudo) => ({ conteudo, assuntos }));
  const { blocks, unsupportedTypes } = readResolutionBlocks(record);
  const anoRaw = readString(record, ["ano", "year"]);
  const ano = anoRaw.trim() && Number.isFinite(Number(anoRaw)) ? Number(anoRaw) : null;

  const base = {
    id_importacao: nullable(readString(record, ["id_importacao", "import_id", "external_id"])),
    codigo: nullable(readString(record, ["codigo", "código", "code"])),
    disciplina: readString(record, ["disciplina", "subject"]).trim(),
    dificuldade:
      normalizeDifficulty(readString(record, ["dificuldade", "difficulty"])) ??
      ("" as QuestionDifficulty),
    conteudos,
    assuntos,
    assuntos_por_conteudo: normalizedGroups,
    banca: nullable(readString(record, ["banca", "examBoard", "exam_board", "board"])),
    ano,
    instituição: nullable(readString(record, [
      "instituição",
      "instituicao",
      "institution",
      "instituicao_prova",
      "instituição_prova",
      "instituicao_nome",
      "instituição_nome",
      "instituicoes",
      "instituições",
      "institutions",
      "escola",
      "prova",
    ])),
    publicada: readBoolean(record, ["publicada", "published"], true),
    enunciado: readString(record, ["enunciado", "statement", "pergunta"]).trim(),
    enunciado_pos_imagem: nullable(readString(record, ["enunciado_pos_imagem", "enunciadoPosImagem", "postImageStatement"])),
    formula: nullable(readString(record, ["formula", "fórmula", "latex"])),
    url_imagem: nullable(readString(record, ["url_imagem", "imagem", "imageUrl"])),
    A: readAlternative(record, "A", false).trim(),
    B: readAlternative(record, "B", false).trim(),
    C: readAlternative(record, "C", false).trim(),
    D: readAlternative(record, "D", false).trim(),
    E: readAlternative(record, "E", false).trim(),
    a_url_imagem: nullable(readAlternative(record, "A", true)),
    b_url_imagem: nullable(readAlternative(record, "B", true)),
    c_url_imagem: nullable(readAlternative(record, "C", true)),
    d_url_imagem: nullable(readAlternative(record, "D", true)),
    e_url_imagem: nullable(readAlternative(record, "E", true)),
    alternativa_correta: normalizeCorrectAlternative(readString(record, ["alternativa_correta", "correta", "answer"])),
    resolucao_blocos: blocks,
    raw_index: rawIndex,
  } satisfies Omit<NormalizedQuestionImportItem, "import_hash">;

  return { item: { ...base, import_hash: buildImportHash(base) }, unsupportedBlockTypes: unsupportedTypes };
}

function getRawQuestions(payload: unknown) {
  if (Array.isArray(payload)) return { versao: null, tipo: "lista_antiga", questions: payload };
  if (!isRecord(payload)) throw new Error("O JSON precisa ser um objeto ou uma lista de questões.");
  const batchQuestions = read(payload, ["questoes", "questions"]);
  if (Array.isArray(batchQuestions)) {
    return {
      versao: nullable(readString(payload, ["versao", "version"])),
      tipo: readString(payload, ["tipo", "type"]) || "importacao_lote_questoes",
      questions: batchQuestions,
    };
  }
  return { versao: null, tipo: "questao_unica_antiga", questions: [payload] };
}

export function createQuestionImportBatchId() {
  return `qbatch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseQuestionImportJsonText(rawJson: string) {
  if (new Blob([rawJson]).size > MAX_QUESTION_IMPORT_JSON_BYTES) {
    throw new Error("O arquivo JSON excede o limite de 2 MB.");
  }
  return parseQuestionImportPayload(JSON.parse(rawJson) as unknown);
}

export function parseQuestionImportPayload(payload: unknown): QuestionImportBatch {
  const rawBatch = getRawQuestions(payload);
  if (rawBatch.questions.length > MAX_QUESTION_IMPORT_ITEMS) {
    throw new Error(`O lote pode ter no máximo ${MAX_QUESTION_IMPORT_ITEMS} questões.`);
  }

  const questoes = rawBatch.questions.map((raw, index) => {
    if (!isRecord(raw)) {
      const item = normalizeQuestion({}, index).item;
      return { index, item, status: "invalida" as const, errors: ["Item do lote não é um objeto JSON."], warnings: [], alternativas_preenchidas: 0, resolution_blocks_count: 0 };
    }
    const { item, unsupportedBlockTypes } = normalizeQuestion(raw, index);
    return validateQuestionImportItem(item, index, unsupportedBlockTypes);
  });

  return {
    batchId: createQuestionImportBatchId(),
    versao: rawBatch.versao,
    tipo: rawBatch.tipo,
    questoes,
    summary: summarizeQuestionImport(questoes),
  };
}

export function validateQuestionImportItem(
  item: NormalizedQuestionImportItem,
  index = item.raw_index,
  unsupportedBlockTypes: string[] = []
): QuestionImportPreviewItem {
  const errors: string[] = [];
  const warnings: string[] = [];
  const alternatives = { a: item.A, b: item.B, c: item.C, d: item.D, e: item.E };
  const filledAlternatives = Object.values(alternatives).filter((value) => value.trim()).length;

  if (!item.disciplina.trim()) errors.push("Disciplina obrigatória.");
  if (item.conteudos.length === 0) errors.push("Adicione pelo menos um conteúdo.");
  if (item.assuntos.length === 0) errors.push("Adicione pelo menos um assunto.");
  if (!item.enunciado.trim()) errors.push("Enunciado obrigatório.");
  if (filledAlternatives < 2) errors.push("Preencha pelo menos duas alternativas.");
  if (!item.alternativa_correta) errors.push("Alternativa correta obrigatória.");
  if (item.alternativa_correta && !alternatives[item.alternativa_correta].trim()) {
    errors.push("A alternativa correta aponta para uma alternativa vazia.");
  }
  if (item.resolucao_blocos.length === 0) errors.push("Inclua pelo menos um bloco de resolução.");
  if (unsupportedBlockTypes.length > 0) errors.push(`Tipo(s) de bloco não suportado(s): ${unsupportedBlockTypes.join(", ")}.`);

  if (!item.codigo) warnings.push("Código vazio: o sistema usará o padrão atual de cadastro sem código.");
  if (!item.E.trim()) warnings.push("Alternativa E vazia.");
  if (!item.url_imagem) warnings.push("Campo de imagem vazio.");
  if (!item.formula) warnings.push("Fórmula vazia.");
  if (item.resolucao_blocos.length === 1) warnings.push("Resolução com apenas um bloco.");

  return {
    index,
    item,
    status: errors.length > 0 ? "invalida" : "valida",
    errors,
    warnings,
    alternativas_preenchidas: filledAlternatives,
    resolution_blocks_count: item.resolucao_blocos.length,
  };
}

export function summarizeQuestionImport(items: QuestionImportPreviewItem[]): QuestionImportSummary {
  return {
    total: items.length,
    validas: items.filter((item) => item.status === "valida").length,
    comAvisos: items.filter((item) => item.warnings.length > 0).length,
    invalidas: items.filter((item) => item.status === "invalida").length,
    totalBlocosResolucao: items.reduce((sum, item) => sum + item.resolution_blocks_count, 0),
  };
}

export function buildQuestionInsertPayload(question: NormalizedQuestionImportItem, importBatchId: string, importedBy: string) {
  const currentYear = new Date().getFullYear();

  return {
    codigo: question.codigo,
    disciplina: question.disciplina,
    conteudo: first(question.conteudos),
    conteudos: question.conteudos,
    assunto: first(question.assuntos),
    assuntos: question.assuntos,
    assuntos_por_conteudo: question.assuntos_por_conteudo,
    banca: question.banca ?? "Não informada",
    ano: question.ano ?? currentYear,
    dificuldade: question.dificuldade,
    instituição: question.instituição ?? "Não informada",
    publicada: question.publicada,
    enunciado: question.enunciado,
    enunciado_pos_imagem: question.enunciado_pos_imagem,
    formula: question.formula,
    url_imagem: question.url_imagem,
    A: question.A,
    B: question.B,
    C: question.C,
    D: question.D,
    E: question.E,
    a_url_imagem: question.a_url_imagem,
    b_url_imagem: question.b_url_imagem,
    c_url_imagem: question.c_url_imagem,
    d_url_imagem: question.d_url_imagem,
    e_url_imagem: question.e_url_imagem,
    alternativa_correta: question.alternativa_correta,
    import_source_id: getQuestionImportSourceId(question),
    import_batch_id: importBatchId,
    imported_at: new Date().toISOString(),
    imported_by: importedBy,
  };
}
