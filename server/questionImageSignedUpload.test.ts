import { afterEach, describe, expect, it, vi } from "vitest";
const sdkUpload = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("../client/src/lib/supabase", () => ({
  supabase: { storage: { from: () => ({ uploadToSignedUrl: sdkUpload }) } },
}));
import { uploadToSignedStorageUrl } from "../client/src/lib/signedStorageUpload";
const path = "statement-images/test/new.webp";
const input = () => ({
  bucket: "questoes-imagens",
  path,
  token: "synthetic-not-a-real-token",
  file: new File(["synthetic"], "new.webp", { type: "image/webp" }),
  contentType: "image/webp",
  signedUrl: `https://storage.local.invalid/storage/v1/object/upload/sign/questoes-imagens/${path}?token=synthetic`,
  signal: new AbortController().signal,
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("upload assinado com transporte simulado", () => {
  it("envia somente o arquivo preparado com MIME/nome reais e permite AbortSignal", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://storage.local.invalid");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const upload = input();
    await uploadToSignedStorageUrl(upload);
    const options = fetchMock.mock.calls[0][1];
    expect(options.signal).toBe(upload.signal);
    expect(options.method).toBe("PUT");
    const sent = options.body.get("") as File;
    expect(sent.name).toBe("new.webp");
    expect(sent.type).toBe("image/webp");
    expect(await sent.text()).toBe("synthetic");
    expect(options.credentials).toBe("omit");
    expect(sdkUpload).not.toHaveBeenCalled();
  });
  it("cancelamento durante transporte não é convertido em sucesso", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://storage.local.invalid");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Cancelado", "AbortError"))
            )
          )
      )
    );
    const controller = new AbortController();
    const job = uploadToSignedStorageUrl({
      ...input(),
      signal: controller.signal,
    });
    controller.abort();
    await expect(job).rejects.toMatchObject({ name: "AbortError" });
  });
  it("rejeita origem ou caminho diferentes sem enviar dados", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://storage.local.invalid");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      uploadToSignedStorageUrl({
        ...input(),
        signedUrl: "https://external.invalid/upload",
      })
    ).rejects.toThrow(/inválida/);
    await expect(
      uploadToSignedStorageUrl({ ...input(), path: "other.webp" })
    ).rejects.toThrow(/inválida/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("erro HTTP é sanitizado; consumidores antigos mantêm o SDK", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://storage.local.invalid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 409 })
    );
    expect((await uploadToSignedStorageUrl(input())).error).toEqual({
      message: "Storage recusou o envio (HTTP 409).",
      statusCode: "409",
    });
    const { signal, signedUrl, ...old } = input();
    await uploadToSignedStorageUrl(old);
    expect(sdkUpload).toHaveBeenCalledTimes(1);
  });
});
