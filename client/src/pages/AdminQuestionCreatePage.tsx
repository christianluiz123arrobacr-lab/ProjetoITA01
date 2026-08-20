import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { uploadToSignedStorageUrl } from "@/lib/signedStorageUpload";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { KATEX_RENDER_OPTIONS, normalizeMathSource } from "@/lib/mathRendering";
import {
  Loader2,
  AlertTriangle,
  Save,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Eye,
  FileJson,
} from "lucide-react";

type AssuntosPorConteudoItem = {
  conteudo: string;
  assuntos: string[];
};

type ResolutionDraftBlock = {
  tipo: "texto" | "latex" | "imagem";
  texto?: string | null;
  url_imagem?: string | null;
  ordem: number;
};

type QuestionFormData = {
  codigo: string;
  disciplina: string;
  conteudo: string;
  conteudos: string[];
  assunto: string;
  assuntos: string[];
  assuntosPorConteudo: AssuntosPorConteudoItem[];
  banca: string;
  ano: string;
  dificuldade: string;
  instituicao: string;
  publicada: boolean;
  enunciado: string;
  enunciado_pos_imagem: string;
  formula: string;
  url_imagem: string;

  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;

  alternativa_a_imagem: string;
  alternativa_b_imagem: string;
  alternativa_c_imagem: string;
  alternativa_d_imagem: string;
  alternativa_e_imagem: string;

  alternativa_correta: string;
};

type ImportedResolutionBlock = {
  tipo?: unknown;
  texto?: unknown;
  content?: unknown;
  url_imagem?: unknown;
  imageUrl?: unknown;
  ordem?: unknown;
};

type NormalizedImportedResolutionBlock = {
  tipo: "texto" | "latex" | "imagem";
  texto: string;
  url_imagem: string;
  ordem: number;
};

type ImportedQuestionFile = {
  codigo?: unknown;
  disciplina?: unknown;
  subject?: unknown;
  dificuldade?: unknown;
  difficulty?: unknown;
  conteudo?: unknown;
  conteudos?: unknown;
  assunto?: unknown;
  assuntos?: unknown;
  assuntos_por_conteudo?: unknown;
  assuntosPorConteudo?: unknown;
  enunciado?: unknown;
  statement?: unknown;
  enunciado_pos_imagem?: unknown;
  statementAfterImage?: unknown;
  formula?: unknown;
  url_imagem?: unknown;
  imageUrl?: unknown;
  alternativas?: unknown;
  options?: unknown;
  alternativa_correta?: unknown;
  correctOptionId?: unknown;
  resolucao_blocos?: unknown;
  resolutionBlocks?: unknown;
  resolucao?: unknown;
};

const QUESTION_IMAGES_BUCKET = "questoes-imagens";
const MAX_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const initialForm: QuestionFormData = {
  codigo: "",
  disciplina: "",
  conteudo: "",
  conteudos: [],
  assunto: "",
  assuntos: [],
  assuntosPorConteudo: [],
  banca: "",
  ano: "",
  dificuldade: "",
  instituicao: "",
  publicada: true,
  enunciado: "",
  enunciado_pos_imagem: "",
  formula: "",
  url_imagem: "",

  alternativa_a: "",
  alternativa_b: "",
  alternativa_c: "",
  alternativa_d: "",
  alternativa_e: "",

  alternativa_a_imagem: "",
  alternativa_b_imagem: "",
  alternativa_c_imagem: "",
  alternativa_d_imagem: "",
  alternativa_e_imagem: "",

  alternativa_correta: "",
};

type SuggestionRow = {
  conteudo?: string | null;
  conteudos?: string[] | null;
  assunto?: string | null;
  assuntos?: string[] | null;
  assuntos_por_conteudo?: unknown;
  banca?: string | null;
  instituição?: string | null;
};

type SuggestionsState = {
  conteudos: string[];
  assuntos: string[];
  bancas: string[];
  instituicoes: string[];
};

const EMPTY_SUGGESTIONS: SuggestionsState = {
  conteudos: [],
  assuntos: [],
  bancas: [],
  instituicoes: [],
};

const QUESTION_JSON_EXAMPLE = JSON.stringify(
  {
    codigo: "Q00001",
    disciplina: "fisica",
    conteudos: ["Cinemática"],
    assuntos_por_conteudo: [
      {
        conteudo: "Cinemática",
        assuntos: ["Movimento Uniforme"],
      },
    ],
    banca: "eear",
    ano: 2024,
    dificuldade: "medio",
    instituição: "eear",
    publicada: true,
    enunciado: "Texto do enunciado em Markdown/LaTeX.",
    enunciado_pos_imagem: "Texto opcional depois da imagem.",
    formula: "$$ v = \\frac{\\Delta s}{\\Delta t} $$",
    url_imagem: "",
    alternativas: {
      A: "Alternativa A",
      B: "Alternativa B",
      C: "Alternativa C",
      D: "Alternativa D",
      E: "Alternativa E",
    },
    alternativa_correta: "a",
    resolucao: {
      blocos: [
        {
          tipo: "texto",
          texto: "Primeiro passo da resolução.",
        },
        {
          tipo: "latex",
          texto: "$$ v = \\frac{\\Delta s}{\\Delta t} $$",
        },
      ],
    },
  },
  null,
  2
);

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonValue(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }

  return undefined;
}

function readJsonString(record: JsonRecord, keys: string[]) {
  const value = readJsonValue(record, keys);

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  return "";
}

function readJsonBoolean(record: JsonRecord, keys: string[], fallback: boolean) {
  const value = readJsonValue(record, keys);

  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "publicada"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "rascunho"].includes(normalized)) return false;
  }

  return fallback;
}

function readJsonStringArray(record: JsonRecord, keys: string[]) {
  const value = readJsonValue(record, keys);

  if (Array.isArray(value)) {
    return normalizarLista(
      value
        .map((item) => (typeof item === "string" || typeof item === "number" ? String(item) : ""))
        .filter(Boolean)
    );
  }

  if (typeof value === "string") {
    return normalizarLista(value.split(/[;,\n]/g));
  }

  return [];
}

function normalizeCorrectAlternative(value: string) {
  const normalized = value.trim().toLowerCase();

  if (["a", "b", "c", "d", "e"].includes(normalized)) return normalized;

  return "";
}

function readAlternativeText(record: JsonRecord, letter: "A" | "B" | "C" | "D" | "E") {
  const lower = letter.toLowerCase();
  const alternatives = readJsonValue(record, ["alternativas", "alternatives", "opcoes", "opções"]);

  if (isJsonRecord(alternatives)) {
    const rawValue = readJsonValue(alternatives, [letter, lower]);

    if (typeof rawValue === "string" || typeof rawValue === "number") return String(rawValue);

    if (isJsonRecord(rawValue)) {
      return readJsonString(rawValue, ["texto", "text", "valor", "value", "conteudo"]);
    }
  }

  if (Array.isArray(alternatives)) {
    const item = alternatives.find((alternative) => {
      if (!isJsonRecord(alternative)) return false;
      return readJsonString(alternative, ["letra", "letter", "alternativa"]).trim().toLowerCase() === lower;
    });

    if (isJsonRecord(item)) {
      return readJsonString(item, ["texto", "text", "valor", "value", "conteudo"]);
    }
  }

  return readJsonString(record, [letter, lower, `alternativa_${lower}`, `alternativa_${letter}`]);
}

function readAlternativeImage(record: JsonRecord, letter: "A" | "B" | "C" | "D" | "E") {
  const lower = letter.toLowerCase();
  const alternatives = readJsonValue(record, ["alternativas", "alternatives", "opcoes", "opções"]);

  if (isJsonRecord(alternatives)) {
    const rawValue = readJsonValue(alternatives, [letter, lower]);

    if (isJsonRecord(rawValue)) {
      return readJsonString(rawValue, ["url_imagem", "image", "imagem", "imageUrl"]);
    }
  }

  if (Array.isArray(alternatives)) {
    const item = alternatives.find((alternative) => {
      if (!isJsonRecord(alternative)) return false;
      return readJsonString(alternative, ["letra", "letter", "alternativa"]).trim().toLowerCase() === lower;
    });

    if (isJsonRecord(item)) {
      return readJsonString(item, ["url_imagem", "image", "imagem", "imageUrl"]);
    }
  }

  return readJsonString(record, [
    `${lower}_url_imagem`,
    `${letter}_url_imagem`,
    `alternativa_${lower}_imagem`,
    `alternativa_${letter}_imagem`,
  ]);
}

function normalizeResolutionBlockType(value: string, urlImagem: string): "texto" | "latex" | "imagem" {
  const normalized = value.trim().toLowerCase();

  if (["imagem", "image"].includes(normalized) || urlImagem.trim()) return "imagem";
  if (["latex", "formula", "fórmula", "math"].includes(normalized)) return "latex";

  return "texto";
}

function readResolutionBlocks(record: JsonRecord): ResolutionDraftBlock[] {
  const directBlocksValue = readJsonValue(record, [
    "resolucao_blocos",
    "resolução_blocos",
    "blocos_resolucao",
    "blocos_resolução",
    "resolution_blocks",
    "resolutionBlocks",
  ]);
  const resolutionValue = readJsonValue(record, [
    "resolucao",
    "resolução",
    "resolution",
    "resolucoes",
    "resoluções",
  ]);
  const blocksValue = Array.isArray(directBlocksValue)
    ? directBlocksValue
    : isJsonRecord(resolutionValue)
    ? readJsonValue(resolutionValue, ["blocos", "blocks", "passos", "steps"])
    : resolutionValue;

  if (!Array.isArray(blocksValue)) return [];

  const parsedBlocks: ResolutionDraftBlock[] = [];

  blocksValue.forEach((item, index) => {
    let block: ResolutionDraftBlock | null = null;

    if (typeof item === "string") {
      block = {
        tipo: "texto",
        texto: item,
        url_imagem: null,
        ordem: index + 1,
      };
    } else if (isJsonRecord(item)) {
      const texto = readJsonString(item, ["texto", "text", "conteudo", "content", "latex"]);
      const urlImagem = readJsonString(item, ["url_imagem", "imagem", "image", "imageUrl"]);
      const tipo = normalizeResolutionBlockType(readJsonString(item, ["tipo", "type"]), urlImagem);

      block = {
        tipo,
        texto: tipo === "imagem" ? null : texto,
        url_imagem: tipo === "imagem" ? urlImagem : null,
        ordem: Number(readJsonString(item, ["ordem", "order"])) || index + 1,
      };
    }

    if (!block) return;
    if (block.tipo === "imagem" && !block.url_imagem?.trim()) return;
    if (block.tipo !== "imagem" && !block.texto?.trim()) return;

    parsedBlocks.push(block);
  });

  return parsedBlocks
    .sort((a, b) => a.ordem - b.ordem)
    .map((item, index) => ({ ...item, ordem: index + 1 }));
}

function readAssuntosPorConteudo(record: JsonRecord, conteudos: string[]) {
  const value = readJsonValue(record, ["assuntos_por_conteudo", "assuntosPorConteudo"]);

  if (!Array.isArray(value)) return sincronizarAssuntosPorConteudo(conteudos, []);

  return normalizarAssuntosPorConteudo(
    value
      .map((item) => {
        if (!isJsonRecord(item)) return null;

        return {
          conteudo: readJsonString(item, ["conteudo", "content"]),
          assuntos: readJsonStringArray(item, ["assuntos", "subtopics"]),
        };
      })
      .filter((item): item is AssuntosPorConteudoItem => item !== null)
  );
}

function mapQuestionJsonToForm(record: JsonRecord, currentForm: QuestionFormData): QuestionFormData {
  const conteudos = normalizarLista([
    ...readJsonStringArray(record, ["conteudos", "contents"]),
    readJsonString(record, ["conteudo", "content"]),
  ]);
  const assuntosPorConteudo = readAssuntosPorConteudo(record, conteudos);
  const assuntosFromGroups = flattenAssuntosPorConteudo(assuntosPorConteudo);
  const assuntos = normalizarLista([
    ...assuntosFromGroups,
    ...readJsonStringArray(record, ["assuntos", "subtopics"]),
    readJsonString(record, ["assunto", "subtopic"]),
  ]);

  return {
    ...currentForm,
    codigo: readJsonString(record, ["codigo", "código", "code"]) || currentForm.codigo,
    disciplina: readJsonString(record, ["disciplina", "subject"]) || currentForm.disciplina,
    conteudo: primeiroValorDaLista(conteudos) || currentForm.conteudo,
    conteudos: conteudos.length ? conteudos : currentForm.conteudos,
    assunto: primeiroValorDaLista(assuntos) || currentForm.assunto,
    assuntos: assuntos.length ? assuntos : currentForm.assuntos,
    assuntosPorConteudo: assuntosPorConteudo.length ? assuntosPorConteudo : currentForm.assuntosPorConteudo,
    banca: readJsonString(record, ["banca", "examBoard"]) || currentForm.banca,
    ano: readJsonString(record, ["ano", "year"]) || currentForm.ano,
    dificuldade: readJsonString(record, ["dificuldade", "difficulty"]) || currentForm.dificuldade,
    instituicao:
      readJsonString(record, ["instituição", "instituicao", "institution"]) || currentForm.instituicao,
    publicada: readJsonBoolean(record, ["publicada", "published"], currentForm.publicada),
    enunciado: readJsonString(record, ["enunciado", "statement", "pergunta"]) || currentForm.enunciado,
    enunciado_pos_imagem:
      readJsonString(record, ["enunciado_pos_imagem", "enunciadoPosImagem", "postImageStatement"]) ||
      currentForm.enunciado_pos_imagem,
    formula: readJsonString(record, ["formula", "fórmula", "latex"]) || currentForm.formula,
    url_imagem: readJsonString(record, ["url_imagem", "imagem", "imageUrl"]) || currentForm.url_imagem,
    alternativa_a: readAlternativeText(record, "A") || currentForm.alternativa_a,
    alternativa_b: readAlternativeText(record, "B") || currentForm.alternativa_b,
    alternativa_c: readAlternativeText(record, "C") || currentForm.alternativa_c,
    alternativa_d: readAlternativeText(record, "D") || currentForm.alternativa_d,
    alternativa_e: readAlternativeText(record, "E") || currentForm.alternativa_e,
    alternativa_a_imagem: readAlternativeImage(record, "A") || currentForm.alternativa_a_imagem,
    alternativa_b_imagem: readAlternativeImage(record, "B") || currentForm.alternativa_b_imagem,
    alternativa_c_imagem: readAlternativeImage(record, "C") || currentForm.alternativa_c_imagem,
    alternativa_d_imagem: readAlternativeImage(record, "D") || currentForm.alternativa_d_imagem,
    alternativa_e_imagem: readAlternativeImage(record, "E") || currentForm.alternativa_e_imagem,
    alternativa_correta:
      normalizeCorrectAlternative(readJsonString(record, ["alternativa_correta", "correta", "answer"])) ||
      currentForm.alternativa_correta,
  };
}


function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        props.className || ""
      }`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        props.className || ""
      }`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        props.className || ""
      }`}
    />
  );
}

function valorLimpo(texto: string) {
  const valor = texto.trim();
  return valor.length > 0 ? valor : null;
}

function valorAlternativa(texto: string) {
  return texto.trim();
}

function normalizarLista(valores: string[]) {
  return Array.from(
    new Set(
      valores
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function textFromUnknown(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function listFromUnknown(value: unknown) {
  if (Array.isArray(value)) {
    return normalizarLista(value.map((item) => String(item ?? "")));
  }

  if (typeof value === "string") {
    return normalizarLista(value.split(","));
  }

  return [];
}

function normalizeDisciplina(value: unknown) {
  const normalized = normalizeForSearch(textFromUnknown(value));

  if (["fisica", "física", "physics"].includes(normalized)) return "fisica";
  if (["matematica", "matemática", "math", "mathematics"].includes(normalized)) {
    return "matematica";
  }
  if (["quimica", "química", "chemistry"].includes(normalized)) return "quimica";

  return textFromUnknown(value).toLowerCase();
}

function normalizeDificuldade(value: unknown) {
  const normalized = normalizeForSearch(textFromUnknown(value)).replace(/\s+/g, "_");

  if (["facil", "easy"].includes(normalized)) return "facil";
  if (["medio", "media", "normal", "medium"].includes(normalized)) return "medio";
  if (["dificil", "hard"].includes(normalized)) return "dificil";
  if (
    ["muito_dificil", "muitodificil", "dificuldade_alta", "very_hard"].includes(
      normalized
    )
  ) {
    return "muito_dificil";
  }

  return "";
}

function normalizeCorrectOption(value: unknown) {
  const normalized = textFromUnknown(value).toLowerCase().trim();
  const firstLetter = normalized.replace(/[^a-e]/g, "").charAt(0);

  return ["a", "b", "c", "d", "e"].includes(firstLetter) ? firstLetter : "";
}

function getAlternativeText(source: unknown, letter: "a" | "b" | "c" | "d" | "e") {
  if (!source) return "";

  if (Array.isArray(source)) {
    const index = ["a", "b", "c", "d", "e"].indexOf(letter);
    const item = source[index];

    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      const raw = item as { text?: unknown; texto?: unknown; value?: unknown };
      return textFromUnknown(raw.text ?? raw.texto ?? raw.value);
    }

    return "";
  }

  if (typeof source === "object") {
    const raw = source as Record<string, unknown>;
    const value = raw[letter] ?? raw[letter.toUpperCase()];

    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") {
      const rawValue = value as { text?: unknown; texto?: unknown; value?: unknown };
      return textFromUnknown(rawValue.text ?? rawValue.texto ?? rawValue.value);
    }
  }

  return "";
}

function normalizeImportedGroupedSubtopics(
  rawValue: unknown,
  fallbackConteudos: string[],
  fallbackAssuntos: string[]
) {
  const normalizedItems =
    Array.isArray(rawValue)
      ? rawValue
          .map((item) => {
            if (!item || typeof item !== "object") return null;

            const rawItem = item as {
              conteudo?: unknown;
              topic?: unknown;
              assuntos?: unknown;
              subtopics?: unknown;
            };

            const conteudo = textFromUnknown(rawItem.conteudo ?? rawItem.topic);
            const assuntos = listFromUnknown(rawItem.assuntos ?? rawItem.subtopics);

            if (!conteudo) return null;

            return {
              conteudo,
              assuntos,
            };
          })
          .filter((item): item is AssuntosPorConteudoItem => !!item)
      : [];

  if (normalizedItems.length > 0) {
    return normalizarAssuntosPorConteudo(normalizedItems);
  }

  if (fallbackConteudos.length === 0) return [];

  return normalizarAssuntosPorConteudo([
    {
      conteudo: fallbackConteudos[0],
      assuntos: fallbackAssuntos,
    },
  ]);
}

function normalizeImportedResolutionBlocks(rawValue: unknown) {
  const blocks = Array.isArray(rawValue) ? rawValue : [];

  return blocks
    .map((block, index) => {
      if (!block || typeof block !== "object") return null;

      const rawBlock = block as ImportedResolutionBlock;
      const rawTipo = normalizeForSearch(textFromUnknown(rawBlock.tipo));
      const tipo: NormalizedImportedResolutionBlock["tipo"] =
        rawTipo === "imagem" || rawTipo === "image"
          ? "imagem"
          : rawTipo === "latex"
            ? "latex"
            : "texto";
      const texto = textFromUnknown(rawBlock.texto ?? rawBlock.content);
      const urlImagem = textFromUnknown(rawBlock.url_imagem ?? rawBlock.imageUrl);

      if (tipo === "imagem" && !urlImagem) return null;
      if (tipo !== "imagem" && !texto) return null;

      return {
        tipo,
        texto,
        url_imagem: urlImagem,
        ordem: Number(rawBlock.ordem) || index + 1,
      };
    })
    .filter((block): block is NormalizedImportedResolutionBlock => !!block)
    .map((block, index) => ({
      ...block,
      ordem: index + 1,
    }));
}

function normalizeImportedQuestion(rawData: unknown) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error("O arquivo precisa ser um JSON de questão.");
  }

  const raw = rawData as ImportedQuestionFile;
  const conteudos = listFromUnknown(raw.conteudos ?? raw.conteudo);
  const assuntos = listFromUnknown(raw.assuntos ?? raw.assunto);
  const assuntosPorConteudo = normalizeImportedGroupedSubtopics(
    raw.assuntos_por_conteudo ?? raw.assuntosPorConteudo,
    conteudos,
    assuntos
  );
  const assuntosNormalizados = flattenAssuntosPorConteudo(assuntosPorConteudo);
  const alternativas = raw.alternativas ?? raw.options;
  const rawResolucao =
    raw.resolucao && typeof raw.resolucao === "object"
      ? (raw.resolucao as { blocos?: unknown; blocks?: unknown })
      : null;

  return {
    formPatch: {
      codigo: textFromUnknown(raw.codigo),
      disciplina: normalizeDisciplina(raw.disciplina ?? raw.subject),
      dificuldade: normalizeDificuldade(raw.dificuldade ?? raw.difficulty),
      conteudos,
      conteudo: primeiroValorDaLista(conteudos),
      assuntos: assuntosNormalizados,
      assunto: primeiroValorDaLista(assuntosNormalizados),
      assuntosPorConteudo,
      enunciado: textFromUnknown(raw.enunciado ?? raw.statement),
      enunciado_pos_imagem: textFromUnknown(
        raw.enunciado_pos_imagem ?? raw.statementAfterImage
      ),
      formula: textFromUnknown(raw.formula),
      url_imagem: textFromUnknown(raw.url_imagem ?? raw.imageUrl),
      alternativa_a: getAlternativeText(alternativas, "a"),
      alternativa_b: getAlternativeText(alternativas, "b"),
      alternativa_c: getAlternativeText(alternativas, "c"),
      alternativa_d: getAlternativeText(alternativas, "d"),
      alternativa_e: getAlternativeText(alternativas, "e"),
      alternativa_correta: normalizeCorrectOption(
        raw.alternativa_correta ?? raw.correctOptionId
      ),
    },
    resolutionBlocks: normalizeImportedResolutionBlocks(
      raw.resolucao_blocos ?? raw.resolutionBlocks ?? rawResolucao?.blocos ?? rawResolucao?.blocks
    ),
  };
}

function normalizeForSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function addTextToSet(set: Set<string>, value?: string | null) {
  const cleanValue = value?.trim();

  if (cleanValue) {
    set.add(cleanValue);
  }
}

function addTextArrayToSet(set: Set<string>, values?: string[] | null) {
  if (!Array.isArray(values)) return;

  values.forEach((value) => addTextToSet(set, value));
}

function sortTextValues(values: Set<string>) {
  return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function primeiroValorDaLista(valores: string[]) {
  return normalizarLista(valores)[0] ?? "";
}

function normalizarAssuntosPorConteudo(
  valores: AssuntosPorConteudoItem[]
): AssuntosPorConteudoItem[] {
  return valores
    .map((item) => ({
      conteudo: item.conteudo.trim(),
      assuntos: normalizarLista(item.assuntos),
    }))
    .filter((item) => item.conteudo.length > 0);
}

function sincronizarAssuntosPorConteudo(
  conteudos: string[],
  atuais: AssuntosPorConteudoItem[]
): AssuntosPorConteudoItem[] {
  const conteudosLimpos = normalizarLista(conteudos);

  return conteudosLimpos.map((conteudo) => {
    const atual = atuais.find(
      (item) => normalizeForSearch(item.conteudo) === normalizeForSearch(conteudo)
    );

    return {
      conteudo,
      assuntos: atual?.assuntos ?? [],
    };
  });
}

function flattenAssuntosPorConteudo(valores: AssuntosPorConteudoItem[]) {
  return normalizarLista(valores.flatMap((item) => item.assuntos));
}

function addGroupedAssuntosToSet(set: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return;

  value.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const rawItem = item as { assuntos?: unknown; subtopics?: unknown };
    const assuntos = Array.isArray(rawItem.assuntos)
      ? rawItem.assuntos
      : Array.isArray(rawItem.subtopics)
        ? rawItem.subtopics
        : [];

    assuntos.forEach((assunto) => addTextToSet(set, String(assunto ?? "")));
  });
}

type MultiTagInputProps = {
  label: string;
  values: string[];
  suggestions?: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  helper?: string;
};

function MultiTagInput({
  label,
  values,
  suggestions = [],
  onChange,
  placeholder,
  helper,
}: MultiTagInputProps) {
  const [draft, setDraft] = useState("");

  const filteredSuggestions = suggestions
    .filter((suggestion) => {
      const normalizedSuggestion = normalizeForSearch(suggestion);
      const normalizedDraft = normalizeForSearch(draft);
      const alreadySelected = values.some(
        (value) => normalizeForSearch(value) === normalizedSuggestion
      );

      if (alreadySelected) return false;
      if (!normalizedDraft) return false;

      return normalizedSuggestion.includes(normalizedDraft);
    })
    .slice(0, 8);

  function addValues(rawValue: string) {
    const novosValores = rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (novosValores.length === 0) {
      setDraft("");
      return;
    }

    onChange(normalizarLista([...values, ...novosValores]));
    setDraft("");
  }

  function addSingleValue(value: string) {
    onChange(normalizarLista([...values, value]));
    setDraft("");
  }

  function removeValue(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") return;

    event.preventDefault();
    addValues(draft);
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <div className="rounded-2xl border border-slate-300 bg-white p-3 shadow-sm focus-within:ring-2 focus-within:ring-slate-900">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  className="text-white/80 hover:text-white"
                  aria-label={`Remover ${value}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addValues(draft)}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />

        {filteredSuggestions.length > 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Sugestões já cadastradas
            </p>

            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addSingleValue(suggestion);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

type AssuntosPorConteudoEditorProps = {
  items: AssuntosPorConteudoItem[];
  suggestions: string[];
  onChange: (items: AssuntosPorConteudoItem[]) => void;
};

function AssuntosPorConteudoEditor({
  items,
  suggestions,
  onChange,
}: AssuntosPorConteudoEditorProps) {
  function updateAssuntos(conteudo: string, assuntos: string[]) {
    onChange(
      normalizarAssuntosPorConteudo(
        items.map((item) =>
          normalizeForSearch(item.conteudo) === normalizeForSearch(conteudo)
            ? { ...item, assuntos }
            : item
        )
      )
    );
  }

  return (
    <div className="md:col-span-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">
          Assuntos por conteúdo
        </h3>
        <p className="text-sm text-slate-500">
          Cada conteúdo selecionado tem sua própria caixa de assuntos. Assim Funções não rouba assunto de Álgebra, essa pequena vitória contra o caos.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.conteudo}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-3">
                <span className="inline-flex rounded-full bg-purple-50 border border-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  {item.conteudo}
                </span>
              </div>

              <MultiTagInput
                label={`Assuntos de ${item.conteudo}`}
                values={item.assuntos}
                suggestions={suggestions}
                onChange={(values) => updateAssuntos(item.conteudo, values)}
                placeholder={`Digite um assunto de ${item.conteudo}`}
                helper="Esses assuntos ficarão ligados somente a este conteúdo."
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Adicione pelo menos um conteúdo para liberar as caixas de assuntos.
        </p>
      )}
    </div>
  );
}

function validarImagemUpload(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 3 MB.");
  }
}

function MarkdownPreview({
  value,
  emptyMessage = "Nada para visualizar ainda.",
}: {
  value: string;
  emptyMessage?: string;
}) {
  const content = value.trim();

  if (!content) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="prose prose-slate max-w-none text-slate-800 prose-p:my-2 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, KATEX_RENDER_OPTIONS]]}>
        {normalizeMathSource(content)}
      </ReactMarkdown>
    </div>
  );
}

function QuestionPreview({ form }: { form: QuestionFormData }) {
  const alternatives = [
    {
      letter: "A",
      text: form.alternativa_a,
      image: form.alternativa_a_imagem,
      value: "a",
    },
    {
      letter: "B",
      text: form.alternativa_b,
      image: form.alternativa_b_imagem,
      value: "b",
    },
    {
      letter: "C",
      text: form.alternativa_c,
      image: form.alternativa_c_imagem,
      value: "c",
    },
    {
      letter: "D",
      text: form.alternativa_d,
      image: form.alternativa_d_imagem,
      value: "d",
    },
    {
      letter: "E",
      text: form.alternativa_e,
      image: form.alternativa_e_imagem,
      value: "e",
    },
  ];

  const hasAnyAlternative = alternatives.some(
    (alternative) => alternative.text.trim() || alternative.image.trim()
  );

  return (
    <Card className="p-6 bg-white border-slate-200">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Prévia da questão</h2>
          </div>
          <p className="text-sm text-slate-500">
            Veja como o enunciado, a imagem, as fórmulas e as alternativas vão aparecer para o aluno.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {form.codigo.trim() ? (
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1 font-semibold">
              {form.codigo.trim()}
            </span>
          ) : null}

          {form.disciplina.trim() ? (
            <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 font-semibold text-blue-700">
              {form.disciplina.trim()}
            </span>
          ) : null}

          {normalizarLista(form.conteudos).map((conteudo) => (
            <span
              key={conteudo}
              className="rounded-full bg-purple-50 border border-purple-100 px-3 py-1 font-semibold text-purple-700"
            >
              {conteudo}
            </span>
          ))}

          {normalizarLista(form.assuntos).map((assunto) => (
            <span
              key={assunto}
              className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 font-semibold text-emerald-700"
            >
              {assunto}
            </span>
          ))}

          {form.banca.trim() || form.ano.trim() ? (
            <span className="rounded-full bg-amber-50 border border-amber-100 px-3 py-1 font-semibold text-amber-700">
              {[form.banca.trim(), form.ano.trim()].filter(Boolean).join(" • ")}
            </span>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-500 mb-3">Enunciado</p>
          <MarkdownPreview
            value={form.enunciado}
            emptyMessage="Digite o enunciado para ver a prévia renderizada aqui."
          />
        </div>

        {form.url_imagem.trim() ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500 mb-3">Imagem</p>
            <img
              src={form.url_imagem.trim()}
              alt="Imagem da questão"
              className="max-w-full rounded-xl border border-slate-200 bg-white"
            />
          </div>
        ) : null}

        {form.enunciado_pos_imagem.trim() ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500 mb-3">
              Continuação do enunciado
            </p>
            <MarkdownPreview value={form.enunciado_pos_imagem} />
          </div>
        ) : null}

        {form.formula.trim() ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500 mb-3">Fórmula</p>
            <MarkdownPreview value={form.formula} />
          </div>
        ) : null}

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-500 mb-4">Alternativas</p>

          {hasAnyAlternative ? (
            <div className="space-y-3">
              {alternatives.map((alternative) => {
                const isCorrect = form.alternativa_correta === alternative.value;

                if (!alternative.text.trim() && !alternative.image.trim()) {
                  return null;
                }

                return (
                  <div
                    key={alternative.value}
                    className={`rounded-2xl border p-4 ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {alternative.letter}
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        {alternative.text.trim() ? (
                          <MarkdownPreview value={alternative.text} />
                        ) : null}

                        {alternative.image.trim() ? (
                          <img
                            src={alternative.image.trim()}
                            alt={`Imagem da alternativa ${alternative.letter}`}
                            className="max-h-56 rounded-xl border border-slate-200 bg-white"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Preencha as alternativas para visualizar como elas aparecerão.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminQuestionCreatePage() {
  const trpcUtils = trpc.useUtils();
  const createQuestionMutation = trpc.admin.createQuestion.useMutation();
  const createImageUploadMutation = trpc.admin.createAdminImageUpload.useMutation();
  const saveResolutionBlocksMutation = trpc.admin.saveResolutionBlocks.useMutation();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<QuestionFormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAlternative, setUploadingAlternative] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsState>(EMPTY_SUGGESTIONS);
  const [jsonInput, setJsonInput] = useState("");
  const [resolutionDraftBlocks, setResolutionDraftBlocks] = useState<ResolutionDraftBlock[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingResolutionBlocks, setPendingResolutionBlocks] = useState<
    NormalizedImportedResolutionBlock[]
  >([]);

  useEffect(() => {
    async function loadSuggestions() {
      const data = await trpcUtils.admin.getQuestionSuggestions.fetch();

      const conteudosSet = new Set<string>();
      const assuntosSet = new Set<string>();
      const bancasSet = new Set<string>();
      const instituicoesSet = new Set<string>();

      ((data as SuggestionRow[]) || []).forEach((row) => {
        addTextToSet(conteudosSet, row.conteudo);
        addTextArrayToSet(conteudosSet, row.conteudos);

        addTextToSet(assuntosSet, row.assunto);
        addTextArrayToSet(assuntosSet, row.assuntos);
        addGroupedAssuntosToSet(assuntosSet, row.assuntos_por_conteudo);

        addTextToSet(bancasSet, row.banca);
        addTextToSet(instituicoesSet, row.instituição);
      });

      setSuggestions({
        conteudos: sortTextValues(conteudosSet),
        assuntos: sortTextValues(assuntosSet),
        bancas: sortTextValues(bancasSet),
        instituicoes: sortTextValues(instituicoesSet),
      });
    }

    loadSuggestions();
  }, [trpcUtils]);

  function updateField<K extends keyof QuestionFormData>(
    field: K,
    value: QuestionFormData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function applyQuestionJsonText(rawJson: string) {
    if (!rawJson.trim()) {
      setError("Cole ou importe um arquivo JSON de questão antes de importar.");
      return;
    }

    const parsed = JSON.parse(rawJson) as unknown;
    const questionRecord = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!isJsonRecord(questionRecord)) {
      setError("O JSON precisa ser um objeto de questão ou uma lista com uma questão.");
      return;
    }

    const importedResolutionBlocks = readResolutionBlocks(questionRecord);

    setForm((prev) => mapQuestionJsonToForm(questionRecord, prev));
    setResolutionDraftBlocks(importedResolutionBlocks);
    setSuccessMessage(
      importedResolutionBlocks.length > 0
        ? `JSON importado com ${importedResolutionBlocks.length} bloco(s) de resolução. Revise a prévia antes de salvar.`
        : "JSON importado para o formulário. Revise a prévia antes de salvar."
    );
  }

  function handleApplyQuestionJson() {
    try {
      setError("");
      setSuccessMessage("");
      applyQuestionJsonText(jsonInput);
    } catch (err) {
      console.error("Erro ao importar JSON da questão:", err);
      setError("JSON inválido. Verifique vírgulas, aspas e chaves antes de importar.");
    }
  }

  async function handleQuestionJsonFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setSuccessMessage("");

      if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
        setError("Envie um arquivo .json válido.");
        return;
      }

      const text = await file.text();
      setJsonInput(text);
      applyQuestionJsonText(text);
    } catch (err) {
      console.error("Erro ao importar arquivo JSON da questão:", err);
      setError("Não foi possível ler o arquivo JSON. Verifique o conteúdo e tente novamente.");
    } finally {
      event.target.value = "";
    }
  }

  function handleUseJsonExample() {
    setJsonInput(QUESTION_JSON_EXAMPLE);
    setError("");
    setSuccessMessage("Exemplo carregado. Edite o JSON e clique em importar.");
  }

  async function handleQuestionJsonImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setError("");
      setSuccessMessage("");

      const text = await file.text();
      const parsed = JSON.parse(text);
      const { formPatch, resolutionBlocks } = normalizeImportedQuestion(parsed);

      setForm((prev) => ({
        ...prev,
        ...formPatch,
        banca: prev.banca,
        ano: prev.ano,
        instituicao: prev.instituicao,
        publicada: prev.publicada,
      }));
      setPendingResolutionBlocks(resolutionBlocks);

      setSuccessMessage(
        resolutionBlocks.length > 0
          ? `Arquivo importado. O formulário foi preenchido e ${resolutionBlocks.length} bloco(s) de resolução serão levados para a próxima tela.`
          : "Arquivo importado. Revise os campos antes de criar a questão."
      );
    } catch (err) {
      console.error("Erro ao importar JSON da questão:", err);
      setPendingResolutionBlocks([]);
      setError(
        err instanceof Error
          ? `Não foi possível importar o arquivo: ${err.message}`
          : "Não foi possível importar o arquivo JSON da questão."
      );
    }
  }

  async function saveImportedResolutionBlocks(
    questaoId: string,
    blocks: NormalizedImportedResolutionBlock[]
  ) {
    if (blocks.length === 0) return;

    const payload = blocks.map((block, index) => ({
      questao_id: questaoId,
      tipo: block.tipo,
      texto: block.tipo === "imagem" ? null : block.texto,
      url_imagem: block.tipo === "imagem" ? block.url_imagem || null : null,
      ordem: index + 1,
    }));

    const { error } = await supabase.from("resolucoes").insert(payload);

    if (error) {
      throw error;
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validarImagemUpload(file);
      setUploadingImage(true);
      setError("");
      setSuccessMessage("");

      const pastaBase =
        form.codigo.trim() || `questao-${Date.now().toString()}`;
      const upload = await createImageUploadMutation.mutateAsync({
        bucket: QUESTION_IMAGES_BUCKET,
        originalName: file.name,
        contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
        context: `${pastaBase}/enunciado`,
      });

      const { error: uploadError } = await uploadToSignedStorageUrl({
        bucket: upload.bucket,
        path: upload.path,
        token: upload.token,
        file,
        contentType: file.type,
      });

      if (uploadError) {
        console.error("Erro ao enviar imagem da questão:", uploadError);
        setError(
          uploadError.message
            ? `Não foi possível enviar a imagem da questão: ${uploadError.message}`
            : "Não foi possível enviar a imagem da questão."
        );
        return;
      }

      if (!upload.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem.");
        return;
      }

      updateField("url_imagem", upload.publicUrl);

      setSuccessMessage("Imagem da questão enviada com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao enviar imagem da questão:", err);
      setError("Ocorreu um erro inesperado ao enviar a imagem.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleAlternativeImageUpload(
    field:
      | "alternativa_a_imagem"
      | "alternativa_b_imagem"
      | "alternativa_c_imagem"
      | "alternativa_d_imagem"
      | "alternativa_e_imagem",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validarImagemUpload(file);
      setUploadingAlternative(field);
      setError("");
      setSuccessMessage("");

      const pastaBase =
        form.codigo.trim() || `questao-${Date.now().toString()}`;
      const upload = await createImageUploadMutation.mutateAsync({
        bucket: QUESTION_IMAGES_BUCKET,
        originalName: file.name,
        contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
        context: `${pastaBase}/alternativas/${field}`,
      });

      const { error: uploadError } = await uploadToSignedStorageUrl({
        bucket: upload.bucket,
        path: upload.path,
        token: upload.token,
        file,
        contentType: file.type,
      });

      if (uploadError) {
        console.error("Erro ao enviar imagem da alternativa:", uploadError);
        setError(
          uploadError.message
            ? `Não foi possível enviar a imagem da alternativa: ${uploadError.message}`
            : "Não foi possível enviar a imagem da alternativa."
        );
        return;
      }

      if (!upload.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem da alternativa.");
        return;
      }

      updateField(field, upload.publicUrl);

      setSuccessMessage("Imagem da alternativa enviada com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao enviar imagem da alternativa:", err);
      setError("Ocorreu um erro inesperado ao enviar a imagem da alternativa.");
    } finally {
      setUploadingAlternative(null);
      event.target.value = "";
    }
  }

  async function handleCreate() {
    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const anoNumero = form.ano.trim() ? Number(form.ano) : null;

      if (!form.disciplina.trim()) {
        setError("Preencha a disciplina.");
        return;
      }

      const conteudosSelecionados = normalizarLista(form.conteudos);
      const assuntosPorConteudoSelecionados = normalizarAssuntosPorConteudo(
        form.assuntosPorConteudo
      );
      const assuntosSelecionados = flattenAssuntosPorConteudo(
        assuntosPorConteudoSelecionados
      );

      if (conteudosSelecionados.length === 0) {
        setError("Adicione pelo menos um conteúdo.");
        return;
      }

      if (assuntosSelecionados.length === 0) {
        setError("Adicione pelo menos um assunto.");
        return;
      }

      if (!form.dificuldade.trim()) {
        setError("Preencha a dificuldade.");
        return;
      }

      if (form.ano.trim() && Number.isNaN(anoNumero)) {
        setError("Preencha um ano válido.");
        return;
      }

      const temA = form.alternativa_a.trim() || form.alternativa_a_imagem.trim();
      const temB = form.alternativa_b.trim() || form.alternativa_b_imagem.trim();

      if (!temA) {
        setError("Preencha a alternativa A com texto ou imagem.");
        return;
      }

      if (!temB) {
        setError("Preencha a alternativa B com texto ou imagem.");
        return;
      }

      if (!form.alternativa_correta.trim()) {
        setError("Selecione a alternativa correta.");
        return;
      }

      const payload = {
        codigo: valorLimpo(form.codigo),
        disciplina: valorLimpo(form.disciplina),
        conteudo: valorLimpo(primeiroValorDaLista(conteudosSelecionados)),
        conteudos: conteudosSelecionados,
        assunto: valorLimpo(primeiroValorDaLista(assuntosSelecionados)),
        assuntos: assuntosSelecionados,
        assuntos_por_conteudo: assuntosPorConteudoSelecionados,
        banca: valorLimpo(form.banca),
        ano: anoNumero,
        dificuldade: valorLimpo(form.dificuldade),
        instituição: valorLimpo(form.instituicao),
        publicada: form.publicada,
        enunciado: valorLimpo(form.enunciado),
        enunciado_pos_imagem: valorLimpo(form.enunciado_pos_imagem),
        formula: valorLimpo(form.formula),
        url_imagem: valorLimpo(form.url_imagem),

        A: valorAlternativa(form.alternativa_a),
        B: valorAlternativa(form.alternativa_b),
        C: valorAlternativa(form.alternativa_c),
        D: valorAlternativa(form.alternativa_d),
        E: valorAlternativa(form.alternativa_e),

        a_url_imagem: valorLimpo(form.alternativa_a_imagem),
        b_url_imagem: valorLimpo(form.alternativa_b_imagem),
        c_url_imagem: valorLimpo(form.alternativa_c_imagem),
        d_url_imagem: valorLimpo(form.alternativa_d_imagem),
        e_url_imagem: valorLimpo(form.alternativa_e_imagem),

        alternativa_correta: valorLimpo(form.alternativa_correta),
      };

      const data = await createQuestionMutation.mutateAsync({ payload });

      if (!data?.id) {
        setError("A questão foi criada, mas o ID não retornou como esperado.");
        return;
      }

      if (resolutionDraftBlocks.length > 0) {
        await saveResolutionBlocksMutation.mutateAsync({
          questaoId: data.id,
          blocks: resolutionDraftBlocks.map((block, index) => ({
            tipo: block.tipo,
            texto: block.tipo === "imagem" ? null : block.texto ?? null,
            url_imagem: block.tipo === "imagem" ? block.url_imagem ?? null : null,
            ordem: index + 1,
          })),
        });
      }

      try {
        await saveImportedResolutionBlocks(data.id, pendingResolutionBlocks);
      } catch (resolutionError) {
        console.error("Erro ao salvar resolução importada:", resolutionError);
        setError(
          "A questão foi criada, mas não foi possível salvar a resolução importada. Abra a tela de resoluções e adicione os blocos manualmente ou tente importar novamente."
        );
        return;
      }

      await logAdminAction({
        action: "question_created",
        entityType: "questao",
        entityId: data.id,
        description: `Questão ${form.codigo || data.id} criada no ADM`,
        level: "info",
        metadata: {
          codigo: form.codigo || null,
          disciplina: form.disciplina || null,
          conteudo: primeiroValorDaLista(form.conteudos) || null,
          conteudos: normalizarLista(form.conteudos),
          assunto: primeiroValorDaLista(form.assuntos) || null,
          assuntos: normalizarLista(form.assuntos),
          assuntosPorConteudo: normalizarAssuntosPorConteudo(form.assuntosPorConteudo),
          banca: form.banca || null,
          ano: anoNumero,
          dificuldade: form.dificuldade || null,
          instituicao: form.instituicao || null,
          publicada: form.publicada,
          urlImagem: form.url_imagem || null,
          alternativaAImagem: form.alternativa_a_imagem || null,
          alternativaBImagem: form.alternativa_b_imagem || null,
          alternativaCImagem: form.alternativa_c_imagem || null,
          alternativaDImagem: form.alternativa_d_imagem || null,
          alternativaEImagem: form.alternativa_e_imagem || null,
          resolucaoImportadaBlocos: pendingResolutionBlocks.length,
        },
      });

      setSuccessMessage(
        pendingResolutionBlocks.length > 0 || resolutionDraftBlocks.length > 0
          ? "Questão e resolução criadas com sucesso. Indo para a resolução..."
          : "Questão criada com sucesso. Indo para a resolução..."
      );
      setLocation(`/admin/resolucoes/${data.id}`);
    } catch (err) {
      console.error("Erro inesperado ao criar questão:", err);
      setError("Ocorreu um erro inesperado ao criar a questão.");
    } finally {
      setSaving(false);
    }
  }

  function AlternativeImageField({
    label,
    imageField,
  }: {
    label: string;
    imageField:
      | "alternativa_a_imagem"
      | "alternativa_b_imagem"
      | "alternativa_c_imagem"
      | "alternativa_d_imagem"
      | "alternativa_e_imagem";
  }) {
    const imageValue = form[imageField];

    return (
      <div>
        <FieldLabel>{label}</FieldLabel>

        <div className="flex flex-wrap gap-3 mb-3">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleAlternativeImageUpload(imageField, e)}
            />
            <span className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
              {uploadingAlternative === imageField ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando imagem...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar imagem
                </>
              )}
            </span>
          </label>
        </div>

        <TextInput
          value={imageValue}
          onChange={(e) => updateField(imageField, e.target.value)}
          placeholder="https://..."
        />

        {imageValue ? (
          <img
            src={imageValue}
            alt={`Preview ${label}`}
            className="mt-3 max-h-40 rounded-xl border border-slate-200 bg-white"
          />
        ) : null}
      </div>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Nova questão"
        subtitle="Cadastre uma nova questão diretamente pelo painel administrativo."
      >
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Criação de questão</p>
              <p className="text-sm text-slate-800">
                Importe um JSON gerado pela IA ou preencha os campos manualmente.
              </p>
            </div>

            <Link href="/admin/questoes">
              <Button variant="outline" className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para questões
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-950 border-slate-900 text-white">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-blue-200 flex items-center justify-center shrink-0">
                <FileJson className="w-5 h-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">Importação por JSON</h2>

                  {pendingResolutionBlocks.length > 0 ? (
                    <span className="rounded-full bg-emerald-400/15 border border-emerald-300/30 px-3 py-1 text-[11px] font-bold text-emerald-100">
                      {pendingResolutionBlocks.length} bloco(s) de resolução
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">
                      opcional
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Use o arquivo gerado pela IA para preencher a questão. Ano,
                  banca e instituição continuam manuais quando forem necessários.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {pendingResolutionBlocks.length > 0 ? (
                <p className="text-xs font-medium text-emerald-100">
                  Ao criar, a resolução será salva automaticamente.
                </p>
              ) : null}

              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleQuestionJsonImport}
                />
                <span className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-sm cursor-pointer hover:bg-blue-50">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar JSON
                </span>
              </label>
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="p-5 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">
                  Erro ao criar questão
                </h2>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {successMessage ? (
          <Card className="p-5 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-emerald-700 font-medium">{successMessage}</p>
            </div>
          </Card>
        ) : null}

        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileJson className="w-5 h-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">Importar questão por JSON</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Cole o JSON antigo da questão para preencher automaticamente o formulário. A resolução pode vir em
                <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">resolucao_blocos</code>
                ou em <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">resolucao.blocos</code>.
                Depois revise a prévia e salve normalmente pelo backend.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleQuestionJsonFileUpload}
                />
                <span className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar arquivo .json
                </span>
              </label>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl shrink-0"
                onClick={handleUseJsonExample}
              >
                Carregar exemplo
              </Button>
            </div>
          </div>

          <TextArea
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={QUESTION_JSON_EXAMPLE}
            className="font-mono text-xs"
          />

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              type="button"
              className="rounded-2xl"
              onClick={handleApplyQuestionJson}
            >
              <FileJson className="w-4 h-4 mr-2" />
              Importar JSON para o formulário
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setJsonInput("");
                setResolutionDraftBlocks([]);
              }}
            >
              Limpar JSON
            </Button>
          </div>

          {resolutionDraftBlocks.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {resolutionDraftBlocks.length} bloco(s) de resolução importado(s). Ao clicar em criar questão, eles serão salvos automaticamente e aparecerão no editor de resolução.
            </div>
          ) : null}
        </Card>

        <Card className="p-6 bg-white border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Dados principais
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <FieldLabel>Código</FieldLabel>
              <TextInput
                value={form.codigo}
                onChange={(e) => updateField("codigo", e.target.value)}
                placeholder="Q00001"
              />
            </div>

            <div>
              <FieldLabel>Disciplina</FieldLabel>
              <Select
                value={form.disciplina}
                onChange={(e) => updateField("disciplina", e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="fisica">Física</option>
                <option value="matematica">Matemática</option>
                <option value="quimica">Química</option>
              </Select>
            </div>

            <div>
              <FieldLabel>Ano</FieldLabel>
              <TextInput
                value={form.ano}
                onChange={(e) => updateField("ano", e.target.value)}
                placeholder="2024"
              />
            </div>

            <div>
              <FieldLabel>Dificuldade</FieldLabel>
              <Select
                value={form.dificuldade}
                onChange={(e) => updateField("dificuldade", e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
                <option value="muito_dificil">Muito difícil</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <MultiTagInput
                label="Conteúdos"
                values={form.conteudos}
                suggestions={suggestions.conteudos}
                onChange={(values) =>
                  setForm((prev) => {
                    const conteudos = normalizarLista(values);
                    const assuntosPorConteudo = sincronizarAssuntosPorConteudo(
                      conteudos,
                      prev.assuntosPorConteudo
                    );
                    const assuntos = flattenAssuntosPorConteudo(assuntosPorConteudo);

                    return {
                      ...prev,
                      conteudos,
                      conteudo: primeiroValorDaLista(conteudos),
                      assuntosPorConteudo,
                      assuntos,
                      assunto: primeiroValorDaLista(assuntos),
                    };
                  })
                }
                placeholder="Digite um conteúdo e pressione Enter. Ex.: cinemática"
                helper="Você pode adicionar vários conteúdos. Também dá para colar separados por vírgula."
              />
            </div>

            <AssuntosPorConteudoEditor
              items={form.assuntosPorConteudo}
              suggestions={suggestions.assuntos}
              onChange={(items) =>
                setForm((prev) => {
                  const assuntosPorConteudo = normalizarAssuntosPorConteudo(items);
                  const assuntos = flattenAssuntosPorConteudo(assuntosPorConteudo);

                  return {
                    ...prev,
                    assuntosPorConteudo,
                    assuntos,
                    assunto: primeiroValorDaLista(assuntos),
                  };
                })
              }
            />

            <div>
              <FieldLabel>Banca</FieldLabel>
              <TextInput
                value={form.banca}
                onChange={(e) => updateField("banca", e.target.value)}
                placeholder="eear"
                list="bancas-suggestions"
              />
              <datalist id="bancas-suggestions">
                {suggestions.bancas.map((banca) => (
                  <option key={banca} value={banca} />
                ))}
              </datalist>
            </div>

            <div>
              <FieldLabel>Instituição</FieldLabel>
              <TextInput
                value={form.instituicao}
                onChange={(e) => updateField("instituicao", e.target.value)}
                placeholder="eear"
                list="instituicoes-suggestions"
              />
              <datalist id="instituicoes-suggestions">
                {suggestions.instituicoes.map((instituicao) => (
                  <option key={instituicao} value={instituicao} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-5">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publicada}
                onChange={(e) => updateField("publicada", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">
                Questão publicada
              </span>
            </label>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Enunciado e imagem
          </h2>

          <div className="space-y-5">
            <div>
              <FieldLabel>Enunciado</FieldLabel>
              <TextArea
                rows={6}
                value={form.enunciado}
                onChange={(e) => updateField("enunciado", e.target.value)}
                placeholder="Digite o enunciado da questão"
              />
            </div>

            <div>
              <FieldLabel>Enunciado pós-imagem</FieldLabel>
              <TextArea
                rows={4}
                value={form.enunciado_pos_imagem}
                onChange={(e) =>
                  updateField("enunciado_pos_imagem", e.target.value)
                }
                placeholder="Texto que aparece depois da imagem da questão"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <span className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando imagem...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar imagem da questão
                    </>
                  )}
                </span>
              </label>
            </div>

            <div>
              <FieldLabel>URL da imagem</FieldLabel>
              <TextInput
                value={form.url_imagem}
                onChange={(e) => updateField("url_imagem", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-700">
                  Preview da imagem da questão
                </p>
              </div>

              {form.url_imagem ? (
                <img
                  src={form.url_imagem}
                  alt="Preview da imagem da questão"
                  className="max-w-full rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Envie uma imagem ou cole uma URL para visualizar o preview.
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Fórmula</FieldLabel>
              <TextArea
                rows={4}
                value={form.formula}
                onChange={(e) => updateField("formula", e.target.value)}
                placeholder="Ex.: $$ v = \frac{\Delta s}{\Delta t} $$"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Alternativas
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Alternativa A</FieldLabel>
                <TextArea
                  rows={3}
                  value={form.alternativa_a}
                  onChange={(e) => updateField("alternativa_a", e.target.value)}
                />
              </div>

              <AlternativeImageField
                label="Imagem da alternativa A"
                imageField="alternativa_a_imagem"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Alternativa B</FieldLabel>
                <TextArea
                  rows={3}
                  value={form.alternativa_b}
                  onChange={(e) => updateField("alternativa_b", e.target.value)}
                />
              </div>

              <AlternativeImageField
                label="Imagem da alternativa B"
                imageField="alternativa_b_imagem"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Alternativa C</FieldLabel>
                <TextArea
                  rows={3}
                  value={form.alternativa_c}
                  onChange={(e) => updateField("alternativa_c", e.target.value)}
                />
              </div>

              <AlternativeImageField
                label="Imagem da alternativa C"
                imageField="alternativa_c_imagem"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Alternativa D</FieldLabel>
                <TextArea
                  rows={3}
                  value={form.alternativa_d}
                  onChange={(e) => updateField("alternativa_d", e.target.value)}
                />
              </div>

              <AlternativeImageField
                label="Imagem da alternativa D"
                imageField="alternativa_d_imagem"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Alternativa E</FieldLabel>
                <TextArea
                  rows={3}
                  value={form.alternativa_e}
                  onChange={(e) => updateField("alternativa_e", e.target.value)}
                />
              </div>

              <AlternativeImageField
                label="Imagem da alternativa E"
                imageField="alternativa_e_imagem"
              />
            </div>

            <div>
              <FieldLabel>Alternativa correta</FieldLabel>
              <Select
                value={form.alternativa_correta}
                onChange={(e) =>
                  updateField("alternativa_correta", e.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
                <option value="e">E</option>
              </Select>
            </div>
          </div>
        </Card>

        <QuestionPreview form={form} />

        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-2xl min-w-[180px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Criar questão
              </>
            )}
          </Button>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
