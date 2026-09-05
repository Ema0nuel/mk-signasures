-- Migration: 00004_create_products.sql
-- Description: Create products table

CREATE TABLE public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  short_description TEXT,
  category_id       UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  base_price        DECIMAL(12,2) NOT NULL,
  status            public.product_status NOT NULL DEFAULT 'draft',
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  meta_title        TEXT,
  meta_description  TEXT,
  tags              TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE public.products IS 'Main product catalog. base_price is the display/starting price; actual price lives on product_variants.';
COMMENT ON COLUMN public.products.base_price IS 'Display price shown on product cards. Variant-specific pricing overrides this.';
