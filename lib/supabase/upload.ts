import { createClient } from "@/lib/supabase/client";

/**
 * Upload a file directly from the browser to Supabase storage.
 * Bypasses server action body size limits for large files like videos.
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  // For progress tracking on large files, we upload in chunks
  // But Supabase JS client doesn't support upload progress natively
  // So we report 0% at start and 100% at end
  onProgress?.(0);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", JSON.stringify({
      message: error.message,
      statusCode: error.statusCode,
      bucket,
      path,
      contentType,
      fileSize: file.size,
      fileMimeType: file.type,
      data,
    }, null, 2));
    return { url: null, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  onProgress?.(100);
  return { url: publicUrl, error: null };
}

/**
 * Delete a file from Supabase storage using the public URL.
 */
export async function deleteFromStorage(
  bucket: string,
  url: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Extract path from public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl("");
  const baseUrl = urlData.publicUrl;
  const path = url.replace(baseUrl, "");

  if (!path || path === url) return { error: null };

  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error: error?.message ?? null };
}
