import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  prepareQuestionImage,
  IMAGE_TARGET_BYTES,
  IMAGE_PREPARATION_MAX_PIXELS,
  checkImageAbort,
  type ImagePreparation,
  type ImagePreparationMode,
} from "@/lib/questionImagePreparation";
import { Button } from "@/components/ui/button";

export type ImageUploadControls = {
  signal: AbortSignal;
  stage: (name: string) => void;
};
type Request = {
  file: File;
  task: (file: File, controls: ImageUploadControls) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};
const size = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`;
function FilePreview({ file, disabled }: { file: File; disabled: boolean }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (disabled) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file, disabled]);
  return disabled ? (
    <p>Prévia automática desativada acima de 8 MP para proteger a memória.</p>
  ) : url ? (
    <img
      src={url}
      alt="Prévia da imagem selecionada"
      className="max-h-72 max-w-full bg-white object-contain"
    />
  ) : null;
}
function ImageUploadReview({
  request,
  onDone,
}: {
  request: Request;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<ImagePreparationMode>("document");
  const [prepared, setPrepared] = useState<ImagePreparation | null>(null);
  const [choice, setChoice] = useState<"original" | "prepared">("original");
  const [stage, setStage] = useState("Preparando imagem localmente");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMs, setUploadMs] = useState<number | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  const settled = useRef(false);
  const active = useRef(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancel = () => {
    if (stage === "Confirmando arquivo") return;
    uploadController.current?.abort();
    settled.current = true;
    request.reject(
      new DOMException(
        "Envio cancelado; imagens anteriores foram preservadas.",
        "AbortError"
      )
    );
    onDone();
  };
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current();
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex="0"]'
        ) ?? []
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        !first ||
        (event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialogRef.current))
      ) {
        event.preventDefault();
        (last ?? dialogRef.current)?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [request]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      uploadController.current?.abort();
      if (!settled.current)
        request.reject(new DOMException("Tela fechada.", "AbortError"));
    };
  }, [request]);
  useEffect(() => {
    const controller = new AbortController();
    setPrepared(null);
    setError("");
    setStage("Preparando imagem localmente");
    void prepareQuestionImage(request.file, mode, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setPrepared(result);
        setChoice(result.changed ? "prepared" : "original");
        setStage("Revise antes de enviar");
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível preparar a imagem."
          );
          setStage("Imagem não preparada");
        }
      });
    return () => controller.abort();
  }, [request.file, mode]);
  async function send() {
    if (!prepared || uploading) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setUploading(true);
    setError("");
    const started = performance.now();
    try {
      const value = await request.task(
        choice === "prepared" ? prepared.file : request.file,
        {
          signal: controller.signal,
          stage: name => {
            if (active.current) setStage(name);
          },
        }
      );
      checkImageAbort(controller.signal);
      settled.current = true;
      request.resolve(value);
      if (active.current) onDone();
    } catch (cause) {
      if (!active.current || controller.signal.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Falha no envio. Tente novamente com a mesma imagem preparada."
      );
      setStage("Falha no envio — tente novamente");
    } finally {
      if (active.current) {
        setUploadMs(performance.now() - started);
        setUploading(false);
      }
    }
  }
  const selected = choice === "prepared" ? prepared?.file : request.file;
  const large = prepared
    ? prepared.originalInfo.width * prepared.originalInfo.height >
      IMAGE_PREPARATION_MAX_PIXELS
    : true;
  return createPortal(
    <div
      className="fixed inset-0 z-[250] overflow-y-auto bg-slate-950/70 p-4"
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-label="Preparar imagem para envio"
    >
      <div className="mx-auto max-w-4xl space-y-4 rounded-2xl bg-white p-5 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100">
        <h2 className="text-xl font-bold">Preparar imagem antes do upload</h2>
        <p className="break-all text-sm">{request.file.name}</p>
        <label className="block text-sm">
          Tipo de imagem
          <select
            disabled={uploading}
            value={mode}
            onChange={e => setMode(e.target.value as ImagePreparationMode)}
            className="ml-2 rounded border p-2 dark:bg-slate-800"
          >
            <option value="document">
              Documento, fórmulas ou diagrama — sem perda automática
            </option>
            <option value="photo">Fotografia — permite WebP com perda</option>
          </select>
        </label>
        <p role="status">{stage}</p>
        {prepared && (
          <>
            <p className="text-sm">
              Original: {prepared.originalInfo.mime} ·{" "}
              {prepared.originalInfo.width} × {prepared.originalInfo.height} ·{" "}
              {size(request.file.size)}
              <br />
              Preparada: {prepared.info.mime} · {prepared.info.width} ×{" "}
              {prepared.info.height} · {size(prepared.file.size)}
              <br />
              Preparação local: {Math.round(prepared.preparationMs)} ms
              {uploadMs !== null &&
                ` · Última tentativa de envio/confirmação: ${Math.round(uploadMs)} ms`}
            </p>
            <p className="rounded border border-amber-300 p-3 text-sm">
              {prepared.warning}{" "}
              {selected &&
                selected.size > IMAGE_TARGET_BYTES &&
                "Acima da meta de 400 KiB. O envio continua permitido dentro do teto existente de 3 MiB; priorize legibilidade."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <figure>
                <figcaption>Original</figcaption>
                <FilePreview file={request.file} disabled={large} />
              </figure>
              <figure>
                <figcaption>Resultado proposto</figcaption>
                <FilePreview file={prepared.file} disabled={large} />
              </figure>
            </div>
            <div className="flex flex-wrap gap-4">
              <label>
                <input
                  disabled={uploading}
                  type="radio"
                  checked={choice === "original"}
                  onChange={() => setChoice("original")}
                />{" "}
                Manter original
              </label>
              <label>
                <input
                  disabled={uploading || !prepared.changed}
                  type="radio"
                  checked={choice === "prepared"}
                  onChange={() => setChoice("prepared")}
                />{" "}
                Usar preparada
              </label>
            </div>
            <p className="text-sm">
              Confira sinais, expoentes e linhas finas. Nenhuma imagem foi
              enviada durante a preparação. A prévia não substitui a validação
              do servidor.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        {stage === "Confirmando arquivo" && (
          <p className="text-sm">
            Confirmando a referência persistida. Aguarde a resposta antes de
            sair; esta etapa não pode ser cancelada com segurança.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={stage === "Confirmando arquivo"}
            onClick={cancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!prepared || uploading}
            onClick={() => void send()}
          >
            {uploading
              ? "Enviando…"
              : error
                ? "Tentar envio novamente"
                : "Enviar imagem selecionada"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
export function useImageUploadReview() {
  const [request, setRequest] = useState<Request | null>(null);
  const pending = useRef(false);
  const reviewAndUpload = <T,>(
    file: File,
    task: (file: File, controls: ImageUploadControls) => Promise<T>
  ) => {
    if (pending.current)
      return Promise.reject<T>(new Error("Conclua ou cancele a imagem atual."));
    pending.current = true;
    return new Promise<T>((resolve, reject) =>
      setRequest({ file, task, resolve: value => resolve(value as T), reject })
    );
  };
  return {
    reviewAndUpload,
    reviewUi: request ? (
      <ImageUploadReview
        request={request}
        onDone={() => {
          pending.current = false;
          setRequest(null);
        }}
      />
    ) : null,
  };
}
