-- Migration: 00006_create_product_images.sql
-- Description: Create product_images table with progressive loading support

CREATE TABLE public.product_images (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_variant_id  UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  original_url        TEXT NOT NULL,
  optimized_url       TEXT,
  blur_data_url       TEXT,
  alt_text            TEXT,
  storage_path        TEXT NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_primary          BOOLEAN NOT NULL DEFAULT false,
  width               INTEGER,
  height              INTEGER,
  file_size_bytes     INTEGER,
  processing_status   public.image_processing_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_images IS 'Product images with progressive loading. original_url is the compressed ~300KB version. optimized_url is set by the optimize-image edge function.';
COMMENT ON COLUMN public.product_images.original_url IS 'Compressed version (~300KB). Loads fast on initial render.';
COMMENT ON COLUMN public.product_images.optimized_url IS 'High-quality WebP version. Set asynchronously by edge function after upload.';
COMMENT ON COLUMN public.product_images.blur_data_url IS 'Tiny base64 placeholder for skeleton/blur loading state.';
COMMENT ON COLUMN public.product_images.processing_status IS 'Tracks background optimization: pending -> processing -> completed (or failed).';
