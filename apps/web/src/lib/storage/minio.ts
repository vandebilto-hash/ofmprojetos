import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const storageClient = createClient(supabaseUrl, supabaseServiceKey);

export const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "projete-se";

export async function createUploadUrl(path: string, contentType: string) {
  const { data, error } = await storageClient.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: true });

  if (error) throw error;
  return data.signedUrl;
}

export async function createDownloadUrl(path: string) {
  const { data, error } = await storageClient.storage
    .from(bucket)
    .createSignedUrl(path, 300);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(path: string) {
  const { error } = await storageClient.storage.from(bucket).remove([path]);
  if (error) throw error;
}
