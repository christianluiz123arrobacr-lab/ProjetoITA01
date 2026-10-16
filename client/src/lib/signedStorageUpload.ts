import { supabase } from "@/lib/supabase";

type SignedStorageUploadInput = {
  bucket: string;
  path: string;
  token: string;
  file: File;
  contentType: string;
  signedUrl?: string;
  signal?: AbortSignal;
};

export async function uploadToSignedStorageUrl({
  bucket,
  path,
  token,
  file,
  contentType,
  signedUrl,
  signal,
}: SignedStorageUploadInput) {
  if (signal && signedUrl) {
    const url = new URL(signedUrl);
    const origin = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
    if (
      url.origin !== origin ||
      !decodeURIComponent(url.pathname).endsWith(
        `/object/upload/sign/${bucket}/${path}`
      )
    )
      throw new Error("URL assinada inválida.");
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file, file.name);
    const response = await fetch(url.href, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body,
      signal,
      credentials: "omit",
    });
    return {
      error: response.ok
        ? null
        : {
            message: `Storage recusou o envio (HTTP ${response.status}).`,
            statusCode: String(response.status),
          },
    };
  }
  return supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType,
  });
}
