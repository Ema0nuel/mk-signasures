/**
 * Client-side image compression using Canvas API.
 * No external dependencies. Runs entirely in the browser.
 *
 * - Resizes to max 2040px (handles retina at 2x for 1020px display)
 * - Converts to WebP at quality 85
 * - Falls back to original if WebP is not supported or larger
 */

const MAX_DIMENSION = 2040;
const WEBP_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  /** Original file name with .webp extension */
  fileName: string;
  mimeType: string;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  // Skip compression for GIFs (canvas can't handle animation) and already-WebP files
  if (file.type === "image/gif") {
    return {
      blob: file,
      width: 0,
      height: 0,
      fileName: file.name,
      mimeType: file.type,
    };
  }

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let { naturalWidth: w, naturalHeight: h } = img;

  // Scale down if exceeds max dimension
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas not available, return original
    return {
      blob: file,
      width: img.naturalWidth,
      height: img.naturalHeight,
      fileName: file.name,
      mimeType: file.type,
    };
  }

  ctx.drawImage(img, 0, 0, w, h);

  // Try WebP first
  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  // If WebP is supported and the result is smaller, use it
  if (webpBlob && webpBlob.size < file.size) {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      blob: webpBlob,
      width: w,
      height: h,
      fileName: `${baseName}.webp`,
      mimeType: "image/webp",
    };
  }

  // Fallback: re-encode as original format at reduced quality
  const fallbackBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", WEBP_QUALITY);
  });

  if (fallbackBlob && fallbackBlob.size < file.size) {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    return {
      blob: fallbackBlob,
      width: w,
      height: h,
      fileName: `${baseName}.${ext}`,
      mimeType: mime,
    };
  }

  // Original is already optimal
  return {
    blob: file,
    width: img.naturalWidth,
    height: img.naturalHeight,
    fileName: file.name,
    mimeType: file.type,
  };
}
