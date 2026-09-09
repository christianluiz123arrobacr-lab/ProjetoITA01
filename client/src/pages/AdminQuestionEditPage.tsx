import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useRoute, useLocation, Link } from "wouter";
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
import { normalizeDifficulty } from "@/lib/difficulty";
import {
  Loader2,
  AlertTriangle,
  Save,
  ArrowLeft,
  CheckCircle2,
  Blocks,
  Upload,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

type AssuntosPorConteudoItem = {
  conteudo: string;
  assuntos: string[];
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 ${
        props.className || ""
      }`}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 ${
        props.className || ""
      }`}
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 ${
        props.className || ""
      }`}
    />
  );
}

function valorLimpo(texto: string) {
  const valor = texto.trim();
  return valor.length > 0 ? valor : null;
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

function listaDoBanco(valor: unknown, fallback?: string | null) {
  const itens = Array.isArray(valor) ? valor : [];
  const base = itens.length > 0 ? itens : fallback ? [fallback] : [];

  return normalizarLista(base.map((item) => String(item)));
}

function primeiroValorDaLista(valores: string[]) {
  return normalizarLista(valores)[0] ?? "";
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

function normalizarAssuntosPorConteudoDoBanco(
  valor: unknown,
  conteudos: string[],
  assuntosLegados: string[]
): AssuntosPorConteudoItem[] {
  if (Array.isArray(valor)) {
    const normalizados = normalizarAssuntosPorConteudo(
      valor
        .map((item) => {
          if (!item || typeof item !== "object") return null;

          const rawItem = item as {
            conteudo?: unknown;
            topic?: unknown;
            assuntos?: unknown;
            subtopics?: unknown;
          };

          const conteudo = String(rawItem.conteudo ?? rawItem.topic ?? "").trim();
          const assuntos = Array.isArray(rawItem.assuntos)
            ? rawItem.assuntos.map((assunto) => String(assunto ?? ""))
            : Array.isArray(rawItem.subtopics)
              ? rawItem.subtopics.map((assunto) => String(assunto ?? ""))
              : [];

          return conteudo ? { conteudo, assuntos } : null;
        })
        .filter((item): item is AssuntosPorConteudoItem => !!item)
    );

    if (normalizados.length > 0) {
      return sincronizarAssuntosPorConteudo(conteudos, normalizados);
    }
  }

  return conteudos.map((conteudo, index) => ({
    conteudo,
    assuntos: index === 0 ? assuntosLegados : [],
  }));
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

      <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm focus-within:ring-2 focus-within:ring-slate-900">
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
          className="w-full border-0 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400"
        />

        {filteredSuggestions.length > 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
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
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {helper ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
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
    <div className="md:col-span-4 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Assuntos por conteúdo
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Cada conteúdo selecionado tem sua própria caixa de assuntos. Assim o filtro deixa de misturar função modular com Álgebra, porque até o ADM merece alguma dignidade.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.conteudo}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
            >
              <div className="mb-3">
                <span className="inline-flex rounded-full bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-800 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
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
        <p className="text-sm text-slate-500 dark:text-slate-400">
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
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="prose dark:prose-invert prose-slate max-w-none text-slate-800 dark:text-slate-100 prose-p:my-2 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
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
    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Prévia da questão</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Veja como o enunciado, a imagem, as fórmulas e as alternativas vão aparecer para o aluno.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          {form.codigo.trim() ? (
            <span className="rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 font-semibold">
              {form.codigo.trim()}
            </span>
          ) : null}

          {form.disciplina.trim() ? (
            <span className="rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 px-3 py-1 font-semibold text-blue-700 dark:text-blue-300">
              {form.disciplina.trim()}
            </span>
          ) : null}
          {normalizarLista(form.conteudos).map((conteudo) => (
            <span
              key={conteudo}
              className="rounded-full bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-800 px-3 py-1 font-semibold text-purple-700 dark:text-purple-300"
            >
              {conteudo}
            </span>
          ))}

          {normalizarLista(form.assuntos).map((assunto) => (
            <span
              key={assunto}
              className="rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              {assunto}
            </span>
          ))}

          {form.banca.trim() || form.ano.trim() ? (
            <span className="rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-800 px-3 py-1 font-semibold text-amber-700 dark:text-amber-300">
              {[form.banca.trim(), form.ano.trim()].filter(Boolean).join(" • ")}
            </span>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Enunciado</p>
          <MarkdownPreview
            value={form.enunciado}
            emptyMessage="Digite o enunciado para ver a prévia renderizada aqui."
          />
        </div>

        {form.url_imagem.trim() ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Imagem</p>
            <img
              src={form.url_imagem.trim()}
              alt="Imagem da questão"
              className="max-w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        ) : null}

        {form.enunciado_pos_imagem.trim() ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Continuação do enunciado
            </p>
            <MarkdownPreview value={form.enunciado_pos_imagem} />
          </div>
        ) : null}

        {form.formula.trim() ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Fórmula</p>
            <MarkdownPreview value={form.formula} />
          </div>
        ) : null}

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Alternativas</p>

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
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                            className="max-h-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Preencha as alternativas para visualizar como elas aparecerão.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminQuestionEditPage() {
  const trpcUtils = trpc.useUtils();
  const updateQuestionMutation = trpc.admin.updateQuestion.useMutation();
  const createImageUploadMutation = trpc.admin.createAdminImageUpload.useMutation();
  const [match, params] = useRoute("/admin/questoes/:id");
  const [, setLocation] = useLocation();
  const questionId = match ? params.id : null;

  const [form, setForm] = useState<QuestionFormData>(initialForm);
  const [suggestions, setSuggestions] =
    useState<SuggestionsState>(EMPTY_SUGGESTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAlternative, setUploadingAlternative] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    async function loadQuestion() {
      if (!questionId) {
        setError("ID da questão não encontrado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const data = await trpcUtils.admin.getQuestionById.fetch({
          id: questionId,
        });

        const conteudos = listaDoBanco(data.conteudos, data.conteudo);
        const assuntos = listaDoBanco(data.assuntos, data.assunto);
        const assuntosPorConteudo = normalizarAssuntosPorConteudoDoBanco(
          data.assuntos_por_conteudo,
          conteudos,
          assuntos
        );
        const assuntosAjustados = flattenAssuntosPorConteudo(assuntosPorConteudo);

        setForm({
          codigo: data.codigo ?? "",
          disciplina: data.disciplina ?? data.diciplina ?? "",
          conteudo: data.conteudo ?? "",
          conteudos,
          assunto: primeiroValorDaLista(assuntosAjustados),
          assuntos: assuntosAjustados,
          assuntosPorConteudo,
          banca: data.banca ?? "",
          ano: data.ano ? String(data.ano) : "",
          dificuldade: normalizeDifficulty(data.dificuldade) ?? "",
          instituicao: data["instituição"] ?? "",
          publicada: data.publicada ?? true,
          enunciado: data.enunciado ?? "",
          enunciado_pos_imagem: data.enunciado_pos_imagem ?? "",
          formula: data.formula ?? "",
          url_imagem: data.url_imagem ?? "",

          alternativa_a: data.a ?? data.A ?? "",
          alternativa_b: data.b ?? data.B ?? "",
          alternativa_c: data.c ?? data.C ?? "",
          alternativa_d: data.d ?? data.D ?? "",
          alternativa_e: data.e ?? data.E ?? "",

          alternativa_a_imagem: data.a_url_imagem ?? "",
          alternativa_b_imagem: data.b_url_imagem ?? "",
          alternativa_c_imagem: data.c_url_imagem ?? "",
          alternativa_d_imagem: data.d_url_imagem ?? "",
          alternativa_e_imagem: data.e_url_imagem ?? "",

          alternativa_correta: data.alternativa_correta ?? "",
        });
      } catch (err) {
        console.error("Erro inesperado ao carregar questão:", err);
        setError("Ocorreu um erro inesperado ao carregar a questão.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [questionId, trpcUtils]);

  function updateField<K extends keyof QuestionFormData>(
    field: K,
    value: QuestionFormData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !questionId) return;

    try {
      validarImagemUpload(file);
      setUploadingImage(true);
      setError("");
      setSuccessMessage("");

      const pastaBase =
        form.codigo.trim() || questionId || `questao-${Date.now().toString()}`;
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
    if (!file || !questionId) return;

    try {
      validarImagemUpload(file);
      setUploadingAlternative(field);
      setError("");
      setSuccessMessage("");

      const pastaBase =
        form.codigo.trim() || questionId || `questao-${Date.now().toString()}`;
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

  async function saveQuestion() {
    if (!questionId) {
      return { ok: false };
    }

    const anoNumero = Number(form.ano);

    if (!form.disciplina.trim()) {
      setError("Preencha a disciplina.");
      return { ok: false };
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
      return { ok: false };
    }

    if (assuntosSelecionados.length === 0) {
      setError("Adicione pelo menos um assunto.");
      return { ok: false };
    }

    if (!form.dificuldade.trim()) {
      setError("Preencha a dificuldade.");
      return { ok: false };
    }

    if (!form.instituicao.trim()) {
      setError("Preencha a instituição.");
      return { ok: false };
    }

    if (!form.ano.trim() || Number.isNaN(anoNumero)) {
      setError("Preencha um ano válido.");
      return { ok: false };
    }

    const temA = form.alternativa_a.trim() || form.alternativa_a_imagem.trim();
    const temB = form.alternativa_b.trim() || form.alternativa_b_imagem.trim();

    if (!temA) {
      setError("Preencha a alternativa A com texto ou imagem.");
      return { ok: false };
    }

    if (!temB) {
      setError("Preencha a alternativa B com texto ou imagem.");
      return { ok: false };
    }

    if (!form.alternativa_correta.trim()) {
      setError("Selecione a alternativa correta.");
      return { ok: false };
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
      dificuldade: normalizeDifficulty(form.dificuldade) || "",
      instituição: valorLimpo(form.instituicao),
      publicada: form.publicada,
      enunciado: valorLimpo(form.enunciado),
      enunciado_pos_imagem: valorLimpo(form.enunciado_pos_imagem),
      formula: valorLimpo(form.formula),
      url_imagem: valorLimpo(form.url_imagem),

      A: valorLimpo(form.alternativa_a),
      B: valorLimpo(form.alternativa_b),
      C: valorLimpo(form.alternativa_c),
      D: valorLimpo(form.alternativa_d),
      E: valorLimpo(form.alternativa_e),

      a_url_imagem: valorLimpo(form.alternativa_a_imagem),
      b_url_imagem: valorLimpo(form.alternativa_b_imagem),
      c_url_imagem: valorLimpo(form.alternativa_c_imagem),
      d_url_imagem: valorLimpo(form.alternativa_d_imagem),
      e_url_imagem: valorLimpo(form.alternativa_e_imagem),

      alternativa_correta: valorLimpo(form.alternativa_correta),
    };

    await updateQuestionMutation.mutateAsync({ id: questionId, payload });

    return { ok: true };
  }

  async function handleSave() {
    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const result = await saveQuestion();

      if (!result.ok) return;

      setSuccessMessage("Questão salva com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao salvar questão:", err);
      setError("Ocorreu um erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndGoToResolution() {
    if (saving || !questionId) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const result = await saveQuestion();

      if (!result.ok) return;

      setSuccessMessage("Questão salva com sucesso. Indo para a resolução...");
      setLocation(`/admin/resolucoes/${questionId}`);
    } catch (err) {
      console.error("Erro inesperado ao salvar e ir para resolução:", err);
      setError("Ocorreu um erro inesperado ao salvar e abrir a resolução.");
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
            <span className="inline-flex items-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
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
            className="mt-3 max-h-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        ) : null}
      </div>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Editar questão"
        subtitle="Edite os dados estruturais da questão diretamente no banco."
      >
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">ID da questão</p>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-100 break-all">
                {questionId || "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/questoes">
                <Button variant="outline" className="rounded-2xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para questões
                </Button>
              </Link>

              {questionId ? (
                <Link href={`/admin/resolucoes/${questionId}`}>
                  <Button variant="outline" className="rounded-2xl">
                    <Blocks className="w-4 h-4 mr-2" />
                    Ir para resolução
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">Carregando dados da questão...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1">
                  Erro na edição
                </h2>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {successMessage ? (
              <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    {successMessage}
                  </p>
                </div>
              </Card>
            ) : null}

            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
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
                        const assuntosPorConteudo =
                          sincronizarAssuntosPorConteudo(
                            conteudos,
                            prev.assuntosPorConteudo
                          );
                        const assuntos =
                          flattenAssuntosPorConteudo(assuntosPorConteudo);

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
                      const assuntosPorConteudo =
                        normalizarAssuntosPorConteudo(items);
                      const assuntos =
                        flattenAssuntosPorConteudo(assuntosPorConteudo);

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
                    list="edit-bancas-suggestions"
                  />
                  <datalist id="edit-bancas-suggestions">
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
                    list="edit-instituicoes-suggestions"
                  />
                  <datalist id="edit-instituicoes-suggestions">
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
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Questão publicada
                  </span>
                </label>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
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
                    <span className="inline-flex items-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
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

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Preview da imagem da questão
                    </p>
                  </div>

                  {form.url_imagem ? (
                    <img
                      src={form.url_imagem}
                      alt="Preview da imagem da questão"
                      className="max-w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
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
                    placeholder="Ex.: $$ v = \\frac{\\Delta s}{\\Delta t} $$"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Alternativas
              </h2>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Alternativa A</FieldLabel>
                    <TextArea
                      rows={3}
                      value={form.alternativa_a}
                      onChange={(e) =>
                        updateField("alternativa_a", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("alternativa_b", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("alternativa_c", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("alternativa_d", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("alternativa_e", e.target.value)
                      }
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

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleSaveAndGoToResolution}
                disabled={saving}
                className="rounded-2xl min-w-[220px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Blocks className="w-4 h-4 mr-2" />
                    Salvar e ir para resolução
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
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
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

