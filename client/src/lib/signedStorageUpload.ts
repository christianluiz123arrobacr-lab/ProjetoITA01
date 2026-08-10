import { supabase } from "@/lib/supabase";

type SignedStorageUploadInput = {
  bucket: string;
  path: string;
  token: string;
  file: File;
  contentType: string;
};

export async function uploadToSignedStorageUrl({
  bucket,
  path,
  token,
  file,
  contentType,
}: SignedStorageUploadInput) {
  return supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType,
  });
}
