/// <reference lib="webworker" />
// One job per worker; cancellation terminates this worker and releases its surfaces.
const workerScope = self as unknown as DedicatedWorkerGlobalScope;
workerScope.onmessage = async ({
  data,
}: {
  data: { file: File; mode: "document" | "photo" };
}) => {
  let bitmap: ImageBitmap | undefined;
  try {
    if (
      typeof OffscreenCanvas === "undefined" ||
      typeof createImageBitmap === "undefined"
    ) {
      workerScope.postMessage(null);
      return;
    }
    bitmap = await createImageBitmap(data.file, {
      imageOrientation: "from-image",
    });
    if (bitmap.width * bitmap.height > 8_000_000) {
      workerScope.postMessage(null);
      return;
    }
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      workerScope.postMessage(null);
      return;
    }
    context.drawImage(bitmap, 0, 0); // No resize, no opaque background, EXIF orientation applied by decoder.
    let best: Blob | null = null;
    for (const quality of data.mode === "photo" ? [0.95, 0.9] : [1]) {
      const blob = await canvas.convertToBlob({
        type: data.mode === "photo" ? "image/webp" : "image/png",
        quality,
      });
      if (!best || blob.size < best.size) best = blob;
      if (
        blob.size <= 409600 ||
        (data.mode === "photo" && blob.type !== "image/webp")
      )
        break;
    }
    workerScope.postMessage(best);
  } catch {
    workerScope.postMessage(null);
  } finally {
    bitmap?.close();
  }
};
export {};
