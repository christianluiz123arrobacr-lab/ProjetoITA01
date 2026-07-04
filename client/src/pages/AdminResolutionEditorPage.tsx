import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
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

const STORAGE_BUCKET = "resolucoes-imagens";
const MAX_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const AUTORES_RESOLUCAO = ["Christian", "Maurício"];

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

function validarImagemUpload(file: File) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 3 MB.");
  }
}

function normalizarOrdens(lista: EditableBlock[]) {
  return lista.map((block, index) => ({
    ...block,
    ordem: index + 1,
  }));
}

export default function AdminResolutionEditorPage() {
  const createImageUploadMutation = trpc.admin.createAdminImageUpload.useMutation();
  const saveAuthorMutation = trpc.admin.saveResolutionAuthor.useMutation();
  const saveBlockMutation = trpc.admin.saveResolutionBlock.useMutation();
  const saveBlocksMutation = trpc.admin.saveResolutionBlocks.useMutation();
  const deleteBlockMutation = trpc.admin.deleteResolutionBlock.useMutation();
  const [match, params] = useRoute("/admin/resolucoes/:questaoId");
  const questaoId = match ? params.questaoId : null;
  const resolutionEditorQuery = trpc.admin.getResolutionEditor.useQuery(
    { questaoId: questaoId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: !!questaoId }
  );

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
    if (!questaoId) {
      setError("Questão não encontrada.");
      setLoading(false);
      return;
    }

    if (resolutionEditorQuery.isLoading) {
      setLoading(true);
      return;
    }

    if (resolutionEditorQuery.error) {
      console.error("Erro ao carregar editor de resolução:", resolutionEditorQuery.error);
      setError(resolutionEditorQuery.error.message || "Não foi possível carregar a resolução.");
      setLoading(false);
      return;
    }

    if (!resolutionEditorQuery.data) return;

    setError("");
    setSuccessMessage("");
    setQuestion(resolutionEditorQuery.data.question as QuestionInfo);

    const meta = (resolutionEditorQuery.data.meta as ResolutionMeta | null) ?? null;
    setResolutionMeta(meta);
    setAuthorName(meta?.autor_nome || "");

    const mappedBlocks: EditableBlock[] = (
      (resolutionEditorQuery.data.blocks as ResolutionBlock[]) || []
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

    setBlocks(normalizarOrdens(mappedBlocks));
    setLoading(false);
  }, [questaoId, resolutionEditorQuery.data, resolutionEditorQuery.error, resolutionEditorQuery.isLoading]);

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

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];

      return normalizarOrdens(sorted);
    });

    setSuccessMessage("");
    setError("");
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

      const result = await saveAuthorMutation.mutateAsync({
        questaoId,
        autorNome: autor,
      });

      setResolutionMeta((result.meta as ResolutionMeta) || null);
      setSuccessMessage("Autor da resolução salvo com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao salvar autor:", err);
      setError("Ocorreu um erro inesperado ao salvar o autor.");
    } finally {
      setSavingAuthor(false);
    }
  }

  async function deletePersistedBlock(localId: string, id?: string) {
    if (!id) {
      removeLocalBlock(localId);
      return;
    }

    if (!questaoId) return;

    try {
      setError("");
      setSuccessMessage("");

      await deleteBlockMutation.mutateAsync({ questaoId, id });

      removeLocalBlock(localId);
      setSuccessMessage("Bloco excluído com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao excluir bloco:", err);
      setError("Ocorreu um erro inesperado ao excluir o bloco.");
    }
  }

  async function saveBlock(block: EditableBlock) {
    if (!questaoId) return;

    const result = await saveBlockMutation.mutateAsync({
      questaoId,
      block: {
        id: block.id,
        tipo: block.tipo,
        texto: block.tipo === "imagem" ? null : block.texto || null,
        url_imagem: block.tipo === "imagem" ? block.url_imagem || null : null,
        ordem: block.ordem,
      },
    });

    return result.id;
  }

  async function handleSaveSingle(localId: string) {
    const block = blocks.find((item) => item.localId === localId);
    if (!block || !questaoId) return;

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

      const savedId = await saveBlock(block);

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

      const result = await saveBlocksMutation.mutateAsync({
        questaoId,
        blocks: orderedBlocks.map((block) => ({
          id: block.id,
          tipo: block.tipo,
          texto: block.tipo === "imagem" ? null : block.texto || null,
          url_imagem: block.tipo === "imagem" ? block.url_imagem || null : null,
          ordem: block.ordem,
        })),
      });

      const idByIndex = new Map(result.blocks.map((item) => [item.index, item.id]));
      const updatedBlocks = orderedBlocks.map((block, index) => ({
        ...block,
        id: idByIndex.get(index) ?? block.id,
        isNew: false,
      }));

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
      setUploadingBlockId(localId);
      setError("");
      setSuccessMessage("");

      const upload = await createImageUploadMutation.mutateAsync({
        bucket: STORAGE_BUCKET,
        originalName: file.name,
        contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
        context: questaoId,
      });

      const { error: uploadError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        setError("Não foi possível enviar a imagem para o bucket.");
        return;
      }

      if (!upload.publicUrl) {
        setError("Não foi possível gerar a URL pública da imagem.");
        return;
      }

      updateBlock(localId, {
        tipo: "imagem",
        url_imagem: upload.publicUrl,
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
                        accept="image/png,image/jpeg,image/webp"
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
                    
