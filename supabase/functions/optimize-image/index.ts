import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const { record } = await req.json();

  if (!record?.id || !record?.storage_path) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Mark as processing
    await supabase
      .from("product_images")
      .update({ processing_status: "processing" })
      .eq("id", record.id);

    // 2. Download image from Storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("product-images")
      .download(record.storage_path);

    if (dlError) throw new Error(`Download failed: ${dlError.message}`);

    const buffer = new Uint8Array(await fileData.arrayBuffer());

    // 3. Optimize with sharp
    //    - Resize to max 2040px (handles retina at 2x for 1020px display)
    //    - Convert to WebP for ~30% smaller than JPEG at same quality
    //    - Quality 85 provides excellent visual quality
    const { default: sharp } = await import("npm:sharp@0.33");
    const optimized = await sharp(buffer)
      .resize(2040, 2040, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    // 4. Upload optimized version
    const optimizedPath = record.storage_path.replace(
      /\.[^.]+$/,
      "-optimized.webp"
    );

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(optimizedPath, optimized, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(optimizedPath);

    // 6. Update database with optimized URL
    await supabase
      .from("product_images")
      .update({
        optimized_url: urlData.publicUrl,
        processing_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    return new Response(
      JSON.stringify({
        success: true,
        imageId: record.id,
        optimizedUrl: urlData.publicUrl,
        originalSize: buffer.length,
        optimizedSize: optimized.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Image optimization failed:", message);

    await supabase
      .from("product_images")
      .update({ processing_status: "failed" })
      .eq("id", record.id);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
