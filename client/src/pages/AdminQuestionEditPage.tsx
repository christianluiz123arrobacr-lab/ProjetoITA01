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
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { logAdminAction } from "@/lib/adminLogs";
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
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Blocks,
  Copy,
  Image,
  Loader2,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  UserSquare2,
} from "lucide-react";

type QuestionInfo = {
  id: string;
  codigo?: string | null;
  enunciado?: string | null;
};

type ResolutionMeta = {
  id: string;
  questao_id: string;
  autor_nome?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ResolutionBlock = {
  id: string;
  questao_id: string;
  tipo: string;
  texto?: string | null;
  ordem?: number | null;
  url_imagem?: string | null;
  codigo_resolucao?: string | null;
  created_at?: string | null;
};

type EditableBlock = {
  id?: string;
  localId: string;
  tipo: "texto" | "latex" | "imagem";
  texto: string;
  url_imagem: string;
  ordem: number;
  isNew?: boolean;
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
const STORAGE_BUCKET = "resolucoes-imagens";
const AUTORES_RESOLUCAO = ["Christian", "Maurício"];
const RESOLUTION_IMPORT_STORAGE_PREFIX = "pending-resolution-import:";

type ImportedResolutionBlock = {
  tipo?: unknown;
  texto?: unknown;
  content?: unknown;
  url_imagem?: unknown;
  imageUrl?: unknown;
  ordem?: unknown;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        props.className || ""
      }`}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        props.className || ""
      }`}
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
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
function textoCurto(texto?: string | null, limite = 140) {
  const valor = (texto || "").trim();
  if (!valor) return "Sem enunciado";
  if (valor.length <= limite) return valor;
  return `${valor.slice(0, limite)}...`;
}

function gerarLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function criarBlocoVazio(ordem: number): EditableBlock {
  return {
    localId: gerarLocalId(),
    tipo: "texto",
    texto: "",
    url_imagem: "",
    ordem,
    isNew: true,
  };
}

function gerarNomeArquivo(originalName: string) {
  const extensao = originalName.includes(".")
    ? originalName.split(".").pop()
    : "png";

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extensao}`;
}

function normalizarOrdens(lista: EditableBlock[]) {
  return lista.map((block, index) => ({
    ...block,
    ordem: index + 1,
  }));
}

function textFromUnknown(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeImportedResolutionBlocks(rawValue: unknown) {
  const blocks = Array.isArray(rawValue) ? rawValue : [];

  return blocks
    .map((block, index) => {
      if (!block || typeof block !== "object") return null;

      const rawBlock = block as ImportedResolutionBlock;
      const rawTipo = textFromUnknown(rawBlock.tipo).toLowerCase();
      const tipo: EditableBlock["tipo"] =
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
        localId: gerarLocalId(),
        tipo,
        texto,
        url_imagem: urlImagem,
        ordem: Number(rawBlock.ordem) || index + 1,
        isNew: true,
      };
    })
    .filter((block): block is EditableBlock => !!block);
}

export default function AdminResolutionEditorPage() {
  const [match, params] = useRoute("/admin/resolucoes/:questaoId");
  const questaoId = match ? params.questaoId : null;

  const [question, setQuestion] = useState<QuestionInfo | null>(null);
  const [resolutionMeta, setResolutionMeta] = useState<ResolutionMeta | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);

  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!questaoId) {
        setError("Questão não encontrada.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const [questionResult, resolutionsResult, metaResult] = await Promise.all([
          supabase
            .from("questoes")
            .select("id, codigo, enunciado")
            .eq("id", questaoId)
            .single(),

          supabase
            .from("resolucoes")
            .select(
              "id, questao_id, tipo, texto, ordem, url_imagem, codigo_resolucao, created_at"
            )
            .eq("questao_id", questaoId)
            .order("ordem", { ascending: true }),

          supabase
            .from("resolucoes_meta")
            .select("*")
            .eq("questao_id", questaoId)
            .maybeSingle(),
        ]);

        if (questionResult.error || !questionResult.data) {
          console.error(
            "Erro ao carregar questão da resolução:",
            questionResult.error
          );
          setError("Não foi possível carregar a questão.");
          return;
        }

        if (resolutionsResult.error) {
          console.error(
            "Erro ao carregar blocos da resolução:",
            resolutionsResult.error
          );
          setError("Não foi possível carregar os blocos da resolução.");
          return;
        }

        if (metaResult.error) {
          console.error(
            "Erro ao carregar metadados da resolução:",
            metaResult.error
          );
          setError("Não foi possível carregar os dados gerais da resolução.");
          return;
        }

        setQuestion(questionResult.data as QuestionInfo);

        const meta = (metaResult.data as ResolutionMeta | null) ?? null;
        setResolutionMeta(meta);
        setAuthorName(meta?.autor_nome || "");

        const mappedBlocks: EditableBlock[] = (
          (resolutionsResult.data as ResolutionBlock[]) || []
        ).map((block, index) => ({
          id: block.id,
          localId: block.id || `${index}-${gerarLocalId()}`,
          tipo: ((block.tipo || "texto").toLowerCase() as
            | "texto"
            | "latex"
            | "imagem"),
          texto: block.texto || "",
          url_imagem: block.url_imagem || "",
          ordem: block.ordem ?? index + 1,
          isNew: false,
        }));

        if (mappedBlocks.length > 0) {
          setBlocks(normalizarOrdens(mappedBlocks));
          return;
        }

        const pendingImportKey = `${RESOLUTION_IMPORT_STORAGE_PREFIX}${questaoId}`;
        const pendingImport = window.localStorage.getItem(pendingImportKey);

        if (pendingImport) {
          const importedBlocks = normalizeImportedResolutionBlocks(
            JSON.parse(pendingImport)
          );

          if (importedBlocks.length > 0) {
            setBlocks(normalizarOrdens(importedBlocks));
            setSuccessMessage(
              "Blocos importados do arquivo da questão. Revise e clique em Salvar tudo para gravar no Supabase."
            );
          } else {
            setBlocks([]);
          }

          window.localStorage.removeItem(pendingImportKey);
          return;
        }

        setBlocks([]);
      } catch (err) {
        console.error(
          "Erro inesperado ao carregar editor de resolução:",
          err
        );
        setError("Ocorreu um erro inesperado ao carregar a resolução.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [questaoId]);

  const orderedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.ordem - b.ordem),
    [blocks]
  );

  function updateBlock(localId: string, patch: Partial<EditableBlock>) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.localId === localId ? { ...block, ...patch } : block
      )
    );
  }

  function addNewBlock() {
    const nextOrder =
      blocks.length > 0 ? Math.max(...blocks.map((b) => b.ordem)) + 1 : 1;

    setBlocks((prev) => [...prev, criarBlocoVazio(nextOrder)]);
    setSuccessMessage("");
    setError("");
  }

  function insertBlockAt(index: number, block?: Partial<EditableBlock>) {
    setBlocks((prev) => {
      const sorted = [...prev].sort((a, b) => a.ordem - b.ordem);

      const novoBloco: EditableBlock = {
        localId: gerarLocalId(),
        tipo: block?.tipo || "texto",
        texto: block?.texto || "",
        url_imagem: block?.url_imagem || "",
        ordem: 0,
        isNew: true,
      };

      sorted.splice(index, 0, novoBloco);
      return normalizarOrdens(sorted);
    });

    setSuccessMessage("");
    setError("");
  }

  function addBlockAbove(localId: string) {
    const sorted = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const index = sorted.findIndex((block) => block.localId === localId);
    if (index === -1) return;
    insertBlockAt(index);
  }

  function addBlockBelow(localId: string) {
    const sorted = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const index = sorted.findIndex((block) => block.localId === localId);
    if (index === -1) return;
    insertBlockAt(index + 1);
  }

  function duplicateBlock(localId: string) {
    const sorted = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const index = sorted.findIndex((block) => block.localId === localId);
    if (index === -1) return;

    const original = sorted[index];

    insertBlockAt(index + 1, {
      tipo: original.tipo,
      texto: original.texto,
      url_imagem: original.url_imagem,
    });
  }

  function removeLocalBlock(localId: string) {
    setBlocks((prev) =>
      normalizarOrdens(prev.filter((block) => block.localId !== localId))
    );
    setSuccessMessage("");
    setError("");
  }

  function moveBlock(localId: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const sorted = [...prev].sort((a, b) => a.ordem - b.ordem);
      const index = sorted.findIndex((block) => block.localId === localId);

      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === sorted.length - 1) return prev;

function validarImagemUpload(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 3 MB.");
  }
}
      const targetIndex = direction === "up" ? index - 1 : index + 1;

function validarImagemUpload(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 3 MB.");
  }
}
      [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];

      return normalizarOrdens(sorted);
    });

    setSuccessMessage("");
    setError("");
  }

  return (
    <div className="prose prose-slate max-w-none text-slate-800 prose-p:my-2 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, KATEX_RENDER_OPTIONS]]}>
        {normalizeMathSource(content)}
      </ReactMarkdown>
    </div>
  );
}
  async function handleSaveAuthor() {
    if (!questaoId) return;

    try {
      setSavingAuthor(true);
      setError("");
      setSuccessMessage("");

      const autor = authorName.trim();

      if (!autor) {
        setError("Selecione um autor da resolução.");
        return;
      }

      const payload = {
        questao_id: questaoId,
        autor_nome: autor,
      };

      const { data, error } = await supabase
        .from("resolucoes_meta")
        .upsert(payload, { onConflict: "questao_id" })
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao salvar autor da resolução:", error);
        setError("Não foi possível salvar o autor da resolução.");
        return;
      }

      setResolutionMeta((data as ResolutionMeta) || null);

      await logAdminAction({
        action: "resolution_author_saved",
        entityType: "resolucao_meta",
        entityId: questaoId,
        description: `Autor da resolução da questão ${
          question?.codigo || questaoId
        } definido como ${autor}`,
        level: "info",
        metadata: {
          questaoId,
          questaoCodigo: question?.codigo || null,
          autorNome: autor,
        },
      });

      setSuccessMessage("Autor da resolução salvo com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao salvar autor:", err);
      setError("Ocorreu um erro inesperado ao salvar o autor.");
    } finally {
      setSavingAuthor(false);
    }
  }

export default function AdminQuestionEditPage() {
  const trpcUtils = trpc.useUtils();
  const updateQuestionMutation = trpc.admin.updateQuestion.useMutation();
  const createImageUploadMutation = trpc.admin.createAdminImageUpload.useMutation();
  const [match, params] = useRoute("/admin/questoes/:id");
  const [, setLocation] = useLocation();
  const questionId = match ? params.id : null;
  async function deletePersistedBlock(localId: string, id?: string) {
    if (!id) {
      removeLocalBlock(localId);
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

  useEffect(() => {
    async function loadSuggestions() {
      const data = await trpcUtils.admin.getQuestionSuggestions.fetch();
      const { error } = await supabase.from("resolucoes").delete().eq("id", id);

      if (error) {
        console.error("Erro ao excluir bloco:", error);
        setError("Não foi possível excluir o bloco.");
        return;
      }

      await logAdminAction({
        action: "resolution_block_deleted",
        entityType: "resolucao",
        entityId: id,
        description: `Bloco de resolução excluído da questão ${
          question?.codigo || questaoId
        }`,
        level: "warning",
        metadata: {
          questaoId,
          questaoCodigo: question?.codigo || null,
          blocoId: id,
          localId,
        },
      });

      removeLocalBlock(localId);
      setSuccessMessage("Bloco excluído com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao excluir bloco:", err);
      setError("Ocorreu um erro inesperado ao excluir o bloco.");
    }
  }

  async function saveBlock(block: EditableBlock) {
    if (!questaoId) return;

    const payload = {
      questao_id: questaoId,
      tipo: block.tipo,
      texto: block.tipo === "imagem" ? null : block.texto || null,
      url_imagem: block.tipo === "imagem" ? block.url_imagem || null : null,
      ordem: block.ordem,
    };

    if (block.id) {
      const { error } = await supabase
        .from("resolucoes")
        .update(payload)
        .eq("id", block.id);

      if (error) throw error;
      return block.id;
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
    const { data, error } = await supabase
      .from("resolucoes")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;
    return data?.id as string;
  }

  async function handleSaveSingle(localId: string) {
    const block = blocks.find((item) => item.localId === localId);
    if (!block || !questaoId) return;

        const data = await trpcUtils.admin.getQuestionById.fetch({
          id: questionId,
        });
    try {
      setError("");
      setSuccessMessage("");

      if (block.tipo === "imagem" && !block.url_imagem.trim()) {
        setError("Bloco de imagem precisa ter uma URL de imagem.");
        return;
      }

      if (
        (block.tipo === "texto" || block.tipo === "latex") &&
        !block.texto.trim()
      ) {
        setError("Bloco de texto/latex precisa ter conteúdo.");
        return;
      }

    loadQuestion();
  }, [questionId, trpcUtils]);
      const wasExisting = !!block.id;
      const savedId = await saveBlock(block);

      await logAdminAction({
        action: "resolution_block_saved",
        entityType: "resolucao",
        entityId: savedId,
        description: `Bloco ${
          wasExisting ? "atualizado" : "criado"
        } na resolução da questão ${question?.codigo || questaoId}`,
        level: "info",
        metadata: {
          questaoId,
          questaoCodigo: question?.codigo || null,
          blocoId: savedId,
          tipo: block.tipo,
          ordem: block.ordem,
          isNew: !wasExisting,
          hasImage: block.tipo === "imagem",
          autorNome: authorName || null,
        },
      });

      setBlocks((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? { ...item, id: savedId, isNew: false }
            : item
        )
      );

      setSuccessMessage("Bloco salvo com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar bloco:", err);
      setError("Não foi possível salvar o bloco.");
    }
  }

  async function handleSaveAll() {
    if (!questaoId) return;

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
      setSavingAll(true);
      setError("");
      setSuccessMessage("");

      for (const block of orderedBlocks) {
        if (block.tipo === "imagem" && !block.url_imagem.trim()) {
          setError(`O bloco de ordem ${block.ordem} precisa de URL da imagem.`);
          return;
        }

        if (
          (block.tipo === "texto" || block.tipo === "latex") &&
          !block.texto.trim()
        ) {
          setError(`O bloco de ordem ${block.ordem} precisa de conteúdo.`);
          return;
        }
      }

      if (!upload.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem.");
        return;
      }

      updateField("url_imagem", upload.publicUrl);
      const updatedBlocks: EditableBlock[] = [];
      let createdCount = 0;
      let updatedCount = 0;

      for (const block of orderedBlocks) {
        const wasExisting = !!block.id;
        const savedId = await saveBlock(block);

        if (wasExisting) updatedCount += 1;
        else createdCount += 1;

        updatedBlocks.push({
          ...block,
          id: savedId,
          isNew: false,
        });
      }

      await logAdminAction({
        action: "resolution_blocks_saved",
        entityType: "resolucao",
        entityId: questaoId,
        description: `Todos os blocos da resolução da questão ${
          question?.codigo || questaoId
        } foram salvos`,
        level: "info",
        metadata: {
          questaoId,
          questaoCodigo: question?.codigo || null,
          totalBlocos: updatedBlocks.length,
          criados: createdCount,
          atualizados: updatedCount,
          autorNome: authorName || null,
        },
      });

      setBlocks(updatedBlocks);
      setSuccessMessage("Todos os blocos foram salvos com sucesso.");
    } catch (err) {
      console.error("Erro ao salvar todos os blocos:", err);
      setError("Não foi possível salvar todos os blocos.");
    } finally {
      setSavingAll(false);
    }
  }

  async function handleImageUpload(
    localId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file || !questaoId) return;

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

      const { error: uploadError } = await uploadToSignedStorageUrl({
        bucket: upload.bucket,
        path: upload.path,
        token: upload.token,
        file,
        contentType: file.type,
      });
      setUploadingBlockId(localId);
      setError("");
      setSuccessMessage("");

      const fileName = gerarNomeArquivo(file.name);
      const path = `${questaoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        setError("Não foi possível enviar a imagem para o bucket.");
        return;
      }

      if (!upload.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem da alternativa.");
        return;
      }

      updateField(field, upload.publicUrl);
        return;
      }

      updateField(field, upload.publicUrl);
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem.");
        return;
      }

      updateBlock(localId, {
        tipo: "imagem",
        url_imagem: data.publicUrl,
      });

      await logAdminAction({
        action: "resolution_image_uploaded",
        entityType: "resolucao",
        entityId: questaoId,
        description: `Imagem enviada para a resolução da questão ${
          question?.codigo || questaoId
        }`,
        level: "info",
        metadata: {
          questaoId,
          questaoCodigo: question?.codigo || null,
          localId,
          bucket: STORAGE_BUCKET,
          path,
          fileName: file.name,
          publicUrl: data.publicUrl,
          autorNome: authorName || null,
        },
      });

      setSuccessMessage("Imagem enviada com sucesso.");
    } catch (err) {
      console.error("Erro inesperado no upload da imagem:", err);
      setError("Ocorreu um erro inesperado ao enviar a imagem.");
    } finally {
      setUploadingBlockId(null);
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
      dificuldade: valorLimpo(form.dificuldade),
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
  return (
    <AdminGuard>
      <AdminLayout
        title="Editar resolução"
        subtitle="Monte a resolução por blocos de texto, latex e imagem, na ordem que quiser."
      >
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Questão</p>
              <p className="font-semibold text-slate-900">
                {question?.codigo || "Sem código"}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {textoCurto(question?.enunciado)}
              </p>
              <p className="text-xs text-slate-500 mt-2 break-all">
                ID: {questaoId || "—"}
              </p>
            </div>

            <div className="w-full lg:max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserSquare2 className="w-4 h-4 text-slate-600" />
                <p className="text-sm font-semibold text-slate-800">
                  Autor da resolução
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Selecione o autor</option>
                  {AUTORES_RESOLUCAO.map((autor) => (
                    <option key={autor} value={autor}>
                      {autor}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleSaveAuthor}
                  disabled={savingAuthor || !questaoId}
                  className="rounded-2xl whitespace-nowrap"
                >
                  {savingAuthor ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar autor
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Atual: {resolutionMeta?.autor_nome || "Nenhum autor definido"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/admin/resolucoes">
              <Button variant="outline" className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>

            <Button onClick={addNewBlock} className="rounded-2xl">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar bloco
            </Button>

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
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || orderedBlocks.length === 0}
              className="rounded-2xl"
            >
              {savingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando tudo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar tudo
                </>
              )}
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            <p className="text-slate-600">Carregando blocos da resolução...</p>
          </Card>
        ) : error ? (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">
                  Erro no editor de resolução
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

        {!loading && orderedBlocks.length === 0 ? (
          <Card className="p-10 text-center">
            <Blocks className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum bloco de resolução cadastrado
            </h2>
            <p className="text-slate-500 mb-4">
              Comece adicionando um bloco de texto, latex ou imagem.
            </p>
            <Button onClick={addNewBlock} className="rounded-2xl">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro bloco
            </Button>
          </Card>
        ) : null}

        <div className="space-y-5">
          {orderedBlocks.map((block, index) => (
            <Card key={block.localId} className="p-6 bg-white border-slate-200">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                      Bloco {index + 1}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                      Ordem {block.ordem}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        block.tipo === "imagem"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : block.tipo === "latex"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      {block.tipo}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">
                    {block.id ? `ID: ${block.id}` : "Bloco ainda não salvo"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => addBlockAbove(block.localId)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Acima
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => addBlockBelow(block.localId)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Abaixo
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => duplicateBlock(block.localId)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => moveBlock(block.localId, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Subir
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => moveBlock(block.localId, "down")}
                    disabled={index === orderedBlocks.length - 1}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Descer
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => handleSaveSingle(block.localId)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar bloco
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => deletePersistedBlock(block.localId, block.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo do bloco
                  </label>
                  <select
                    value={block.tipo}
                    onChange={(e) =>
                      updateBlock(block.localId, {
                        tipo: e.target.value as "texto" | "latex" | "imagem",
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="texto">Texto</option>
                    <option value="latex">Latex</option>
                    <option value="imagem">Imagem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={block.ordem}
                    onChange={(e) =>
                      updateBlock(block.localId, {
                        ordem: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {block.tipo === "imagem" ? (
                  <div className="md:col-span-2 xl:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      URL da imagem
                    </label>
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
                    placeholder="Ex.: $$ v = \\frac{\\Delta s}{\\Delta t} $$"
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
                      type="text"
                      value={block.url_imagem}
                      onChange={(e) =>
                        updateBlock(block.localId, {
                          url_imagem: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                ) : null}
              </div>

              {block.tipo === "imagem" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(block.localId, e)}
                      />
                      <span className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
                        {uploadingBlockId === block.localId ? (
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

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-700">
                        Preview da imagem
                      </p>
                    </div>

                    {block.url_imagem ? (
                      <img
                        src={block.url_imagem}
                        alt="Preview do bloco de imagem"
                        className="max-w-full rounded-xl border border-slate-200 bg-white"
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        Envie uma imagem ou cole uma URL para visualizar o preview.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Conteúdo do bloco
                    </label>
                    <textarea
                      rows={block.tipo === "latex" ? 5 : 7}
                      value={block.texto}
                      onChange={(e) =>
                        updateBlock(block.localId, { texto: e.target.value })
                      }
                      placeholder={
                        block.tipo === "latex"
                          ? "Ex.: $$ v = \\frac{\\Delta s}{\\Delta t} $$"
                          : "Digite o texto do bloco..."
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {block.tipo === "latex" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        Preview do LaTeX
                      </p>

                      <div className="prose prose-slate max-w-none text-slate-800">
                        {block.texto.trim() ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {block.texto}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Digite o conteúdo em LaTeX para ver o preview aqui.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
                      }
                    
