/**
 * Client-side video conversion using ffmpeg.wasm.
 * Converts any video format to H.264 MP4 for universal browser playback.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(
  onProgress: (stage: string, percent: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    const percent = Math.round(progress * 100);
    onProgress("converting", percent);
  });

  onProgress("loading", 0);

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  onProgress("loading", 100);
  return ffmpeg;
}

export interface ConversionProgress {
  stage: "compressing" | "converting" | "uploading" | "done";
  percent: number;
}

/**
 * Convert any video file to H.264 MP4.
 * Returns a Blob of the converted MP4.
 */
export async function convertVideo(
  file: File,
  onProgress: (stage: string, percent: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  const inputName = `input${getExtension(file.name)}`;
  const outputName = "output.mp4";

  // Write input file to ffmpeg filesystem
  onProgress("compressing", 0);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  onProgress("compressing", 100);

  // Convert to H.264 MP4 with compression
  // -c:v libx264: H.264 codec for universal compatibility
  // -crf 28: reasonable quality with good compression (lower = better quality)
  // -preset fast: balance between speed and compression
  // -vf scale=-2:720: cap at 720p height, maintain aspect ratio
  // -c:a aac: AAC audio codec
  // -b:a 128k: audio bitrate
  onProgress("converting", 0);
  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-crf", "28",
    "-preset", "fast",
    "-vf", "scale=-2:720",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  // Read output file
  const data = await ffmpeg.readFile(outputName);

  // Cleanup ffmpeg filesystem
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  // Convert to Blob — normalize to plain Uint8Array for BlobPart compatibility
  const bytes = new Uint8Array(data as Uint8Array);
  return new Blob([bytes], { type: "video/mp4" });
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop();
  return ext ? `.${ext}` : ".mp4";
}
