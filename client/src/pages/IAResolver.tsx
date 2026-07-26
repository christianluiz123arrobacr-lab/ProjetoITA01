import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  Calculator,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Send,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { trpc } from "@/lib/trpc";

type AiImageMimeType = "image/png" | "image/jpeg" | "image/webp";
type ResolverMode = "calculations" | "detailed";

const SUPPORTED_IMAGE_MIME_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const modeOptions: Array<{
  value: ResolverMode;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: "calculations",
    label: "Somente as Contas",
    icon: "🧮",
    description: "Apenas cálculos e resultados",
  },
  {
    value: "detailed",
    label: "Com Explicação",
    icon: "📚",
    description: "Resolução completa e didática",
  },
];

function isSupportedImageMimeType(value: string): value is AiImageMimeType {
  return SUPPORTED_IMAGE_MIME_TYPES.has(value);
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));

    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      const base64Data = result.split(",")[1] ?? "";
      resolve(base64Data);
    };

    reader.readAsDataURL(file);
  });
}

export default function IAResolver() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<ResolverMode>("detailed");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultEndRef = useRef<HTMLDivElement>(null);

  const solveMutation = trpc.ai.solvePhysics.useMutation();

  useEffect(() => {
    if (result && resultEndRef.current) {
      resultEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!isSupportedImageMimeType(file.type)) {
      toast.error("Envie uma imagem PNG, JPG ou WebP.");
      event.target.value = "";
      return;
    }

    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImage(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function simulateTyping(fullText: string) {
    setStatus(null);
    setResult("");

    const words = fullText.split(" ");
    let currentText = "";

    for (const word of words) {
      currentText += `${word} `;
      setResult(currentText);

      await new Promise((resolve) =>
        window.setTimeout(resolve, 15 + Math.random() * 25)
      );
    }
  }

  async function handleSolve() {
    if (!text.trim() && !image) {
      toast.error("Por favor, forneça um texto ou imagem da questão.");
      return;
    }

    setResult("");
    setStatus("Analisando sua questão...");

    try {
      let imageBase64: string | undefined;
      let imageMimeType: AiImageMimeType | undefined;

      if (image) {
        if (!isSupportedImageMimeType(image.type)) {
          toast.error("Envie uma imagem PNG, JPG ou WebP.");
          setStatus(null);
          return;
        }

        imageBase64 = await readFileAsBase64(image);
        imageMimeType = image.type;
      }

      const data = await solveMutation.mutateAsync({
        text: text.trim() || undefined,
        imageBase64,
        imageMimeType,
        mode,
      });

      setStatus("Organizando raciocínio...");
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      await simulateTyping(data.result);
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      toast.error(`Erro: ${errorMessage}`);
      setStatus(null);
    }
  }

  const isSolveDisabled = (!text.trim() && !image) || solveMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                IA Resolutora
              </h1>
              <p className="text-xs text-slate-600">
                Resolva questões de Física com IA
              </p>
            </div>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Sua Questão
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    Tipo de Resolução
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {modeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMode(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mode === option.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Enunciado da Questão
                  </label>

                  <Textarea
                    placeholder="Digite aqui o enunciado completo da questão de Física..."
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="min-h-32 resize-none border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Ou Envie uma Foto
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      Clique para enviar imagem
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG ou WebP
                    </p>
                  </button>
                </div>

                {preview ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Imagem selecionada:
                    </p>

                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full rounded-lg border border-slate-300"
                    />

                    <button
                      type="button"
                      onClick={clearImage}
                      className="w-full text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remover imagem
                    </button>
                  </div>
                ) : null}

                <Button
                  onClick={handleSolve}
                  disabled={isSolveDisabled}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold gap-2 h-12"
                >
                  {solveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resolvendo...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Resolver questão
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {status ? (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <p className="text-indigo-900 font-semibold">{status}</p>
              </div>
            ) : null}

            {result ? (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Resolução
                  </CardTitle>

                  <CardDescription className="text-indigo-100 mt-2">
                    {mode === "calculations"
                      ? "Cálculos e resultados"
                      : "Explicação completa"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-10 bg-white">
                  <div className="space-y-8 text-slate-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ children, ...props }) => (
                          <h1
                            className="text-4xl font-bold text-slate-900 mt-10 mb-6 border-b-3 border-indigo-400 pb-3"
                            {...props}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2
                            className="text-3xl font-bold text-slate-900 mt-8 mb-4"
                            {...props}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3
                            className="text-2xl font-bold text-slate-900 mt-6 mb-3"
                            {...props}
                          >
                            {children}
                          </h3>
                        ),
                        p: ({ children, ...props }) => (
                          <p
                            className="text-slate-800 leading-relaxed my-4 text-base"
                            {...props}
                          >
                            {children}
                          </p>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul
                            className="list-disc list-outside space-y-3 my-4 ml-6 text-slate-800"
                            {...props}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol
                            className="list-decimal list-outside space-y-3 my-4 ml-6 text-slate-800"
                            {...props}
                          >
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li
                            className="text-slate-800 leading-relaxed"
                            {...props}
                          >
                            {children}
                          </li>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            className="border-l-4 border-indigo-500 pl-6 italic text-slate-700 my-4 bg-indigo-50 py-4 rounded-r-lg"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong
                            className="font-bold text-slate-900"
                            {...props}
                          >
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }) => (
                          <em
                            className="italic text-slate-700"
                            {...props}
                          >
                            {children}
                          </em>
                        ),
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>

                  <div ref={resultEndRef} />
                </CardContent>
              </Card>
            ) : null}

            {!result && !status ? (
              <Card className="shadow-lg border-dashed">
                <CardContent className="p-12 text-center">
                  <Calculator className="w-16 h-16 mx-auto text-slate-300 mb-4" />

                  <p className="text-slate-600 text-lg font-semibold">
                    Envie uma questão para começar
                  </p>

                  <p className="text-slate-500 text-sm mt-2">
                    Escolha o tipo de resolução e envie o enunciado ou uma foto
                    da questão.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
