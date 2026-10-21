import {
  inspectQuestionImportImage,
  type QuestionImportImageType,
} from "@shared/questionImageInspection";
import { MAX_QUESTION_IMPORT_IMAGE_BYTES } from "@shared/questionImportSchema";

export const IMAGE_TARGET_BYTES = 400 * 1024;
// An RGBA surface alone costs 32 MB at this budget; decoders/copies cost more.
export const IMAGE_PREPARATION_MAX_PIXELS = 8_000_000;
export type ImagePreparationMode = "document" | "photo";
export type ImageInfo = ReturnType<typeof inspectQuestionImportImage>;
export type ImagePreparation = {
  original: File;
  file: File;
  originalInfo: ImageInfo;
  info: ImageInfo;
  warning: string;
  preparationMs: number;
  changed: boolean;
};
export type ImageEncoder = (
  file: File,
  mode: ImagePreparationMode,
  signal: AbortSignal
) => Promise<Blob | null>;
export function checkImageAbort(signal: AbortSignal) {
  if (signal.aborted)
    throw new DOMException("Operação cancelada.", "AbortError");
}
export function imageHasAnimation(bytes: Uint8Array, type: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, n: number) =>
    String.fromCharCode(...Array.from(bytes.slice(offset, offset + n)));
  if (type === "image/png")
    for (let p = 8; p + 12 <= bytes.length; ) {
      if (text(p + 4, 4) === "acTL") return true;
      const size = view.getUint32(p);
      if (size > bytes.length - p - 12) break;
      p += size + 12;
    }
  if (type === "image/webp")
    for (let p = 12; p + 8 <= bytes.length; ) {
      const kind = text(p, 4),
        size = view.getUint32(p + 4, true);
      if (
        kind === "ANIM" ||
        (kind === "VP8X" && p + 8 < bytes.length && (bytes[p + 8] & 2) !== 0)
      )
        return true;
      if (size > bytes.length - p - 8) break;
      p += 8 + size + (size % 2);
    }
  return false;
}

/** No pixel decoding on the main thread. Cache is keyed by ORIGINAL File and mode. */
export function createQuestionImagePreparer(encode: ImageEncoder) {
  const cache = new WeakMap<
    File,
    Map<ImagePreparationMode, Promise<ImagePreparation>>
  >();
  return async (
    original: File,
    mode: ImagePreparationMode = "document",
    signal: AbortSignal = new AbortController().signal
  ) => {
    checkImageAbort(signal);
    let entries = cache.get(original);
    if (!entries) {
      entries = new Map();
      cache.set(original, entries);
    }
    const known = entries.get(mode);
    if (known) return known;
    const task = (async () => {
      const start = performance.now();
      if (!original.size || original.size > MAX_QUESTION_IMPORT_IMAGE_BYTES)
        throw new Error("Cada imagem deve ter entre 1 byte e 3 MiB.");
      if (!/\.(png|jpe?g|webp)$/i.test(original.name))
        throw new Error(
          "Use arquivos PNG, JPEG ou WebP com extensão correspondente."
        );
      const bytes = new Uint8Array(await original.arrayBuffer());
      checkImageAbort(signal);
      const info = inspectQuestionImportImage(bytes, original.type);
      const expected =
        info.mime === "image/jpeg"
          ? /\.jpe?g$/i
          : info.mime === "image/png"
            ? /\.png$/i
            : /\.webp$/i;
      if (!expected.test(original.name))
        throw new Error("Extensão e conteúdo da imagem não correspondem.");
      const keep = (warning: string): ImagePreparation => ({
        original,
        file: original,
        originalInfo: info,
        info,
        warning,
        preparationMs: performance.now() - start,
        changed: false,
      });
      if (original.size <= IMAGE_TARGET_BYTES)
        return keep(
          "Imagem dentro da meta; original preservado, sem recodificação."
        );
      if (imageHasAnimation(bytes, info.mime))
        return keep(
          "Imagem animada: original preservado para não perder quadros."
        );
      if (info.width * info.height > IMAGE_PREPARATION_MAX_PIXELS)
        return keep(
          "Imagem acima de 8 megapixels: preparação e prévia automática desativadas para proteger a memória. O original pode ser enviado dentro do teto existente."
        );
      if (info.mime === "image/png" && bytes[24] !== 8)
        return keep(
          "PNG com profundidade diferente de 8 bits: original preservado para evitar perda de precisão."
        );
      if (mode === "document" && info.mime !== "image/png")
        return keep(
          "Documento JPEG/WebP: original preservado. Não se aplica recompressão com perda a fórmulas e texto automaticamente."
        );
      let blob: Blob | null;
      try {
        blob = await encode(original, mode, signal);
      } catch (error) {
        checkImageAbort(signal);
        return keep(
          "O navegador não pôde preparar esta imagem com segurança. Original preservado."
        );
      }
      checkImageAbort(signal);
      if (!blob)
        return keep(
          "Codificação segura indisponível neste navegador. Original preservado."
        );
      if (mode === "photo" && blob.type !== "image/webp")
        return keep(
          "O navegador não produziu WebP real. Original preservado, sem trocar apenas a extensão."
        );
      if (mode === "document" && blob.type !== "image/png")
        return keep("Saída sem perdas não confirmada. Original preservado.");
      if (blob.size >= original.size * 0.95)
        return keep(
          "A transformação não trouxe redução útil. Original preservado."
        );
      let output: ImageInfo;
      try {
        output = inspectQuestionImportImage(
          new Uint8Array(await blob.arrayBuffer()),
          blob.type
        );
      } catch {
        return keep(
          "A saída gerada não passou pela verificação de formato. Original preservado."
        );
      }
      if (
        output.width * output.height !== info.width * info.height ||
        !(
          (output.width === info.width && output.height === info.height) ||
          (output.width === info.height && output.height === info.width)
        )
      )
        return keep("Dimensões inesperadas: original preservado.");
      const extension = output.mime === "image/png" ? "png" : "webp";
      const file = new File(
        [blob],
        original.name.replace(/\.[^.]+$/, `.${extension}`),
        { type: output.mime, lastModified: original.lastModified }
      );
      return {
        original,
        file,
        originalInfo: info,
        info: output,
        changed: true,
        preparationMs: performance.now() - start,
        warning:
          mode === "photo"
            ? "WebP com perda, somente para fotografias. Compare com o original antes de enviar."
            : "PNG recodificado sem reduzir dimensões. Confira cores, transparência e detalhes na prévia.",
      };
    })();
    entries.set(mode, task);
    try {
      return await task;
    } catch (error) {
      entries.delete(mode);
      throw error;
    }
  };
}

function encodeInWorker(
  file: File,
  mode: ImagePreparationMode,
  signal: AbortSignal
): Promise<Blob | null> {
  if (typeof Worker === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./questionImagePreparation.worker.ts", import.meta.url),
      { type: "module" }
    );
    const finish = (blob: Blob | null, error?: Error) => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
      error ? reject(error) : resolve(blob);
    };
    const abort = () =>
      finish(null, new DOMException("Operação cancelada.", "AbortError"));
    const timeout = setTimeout(() => finish(null), 15_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = event =>
      finish(event.data instanceof Blob ? event.data : null);
    worker.onerror = () => finish(null);
    worker.postMessage({ file, mode });
    if (signal.aborted) abort();
  });
}
export const prepareQuestionImage = createQuestionImagePreparer(encodeInWorker);
export type PreparedImageMime = QuestionImportImageType;
