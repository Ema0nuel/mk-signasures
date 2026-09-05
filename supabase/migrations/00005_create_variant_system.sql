-- Migration: 00005_create_variant_system.sql
-- Description: Create flexible EAV variant system (attributes, options, variants, selections)

-- Defines WHAT can vary per product (e.g., Color, Size, Length)
CREATE TABLE public.variant_attributes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT variant_attributes_product_name_unique UNIQUE (product_id, name)
);

COMMENT ON TABLE public.variant_attributes IS 'Defines variant dimensions per product. Each product has its own set of attributes.';

-- Defines the VALUES for each attribute (e.g., Black, Medium, 16 inches)
CREATE TABLE public.variant_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id  UUID NOT NULL REFERENCES public.variant_attributes(id) ON DELETE CASCADE,
  value         TEXT NOT NULL,
  display_value TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT variant_options_attribute_value_unique UNIQUE (attribute_id, value)
);

COMMENT ON TABLE public.variant_options IS 'Selectable values for each variant attribute.';

-- Specific SKU combinations with pricing and stock
CREATE TABLE public.product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku               TEXT NOT NULL,
  price             DECIMAL(12,2) NOT NULL,
  compare_at_price  DECIMAL(12,2),
  stock_quantity    INTEGER NOT NULL DEFAULT 0,
  weight_grams      INTEGER,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  barcode           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_sku_unique UNIQUE (sku)
);

COMMENT ON TABLE public.product_variants IS 'Concrete SKU combinations. Each row is a purchasable item with its own price, stock, and SKU.';
COMMENT ON COLUMN public.product_variants.compare_at_price IS 'Original price before discount. Used to show strikethrough pricing.';

-- Links a variant to its specific attribute option choices
CREATE TABLE public.product_variant_selections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  variant_option_id   UUID NOT NULL REFERENCES public.variant_options(id) ON DELETE CASCADE,
  CONSTRAINT product_variant_selections_unique UNIQUE (product_variant_id, variant_option_id)
);

COMMENT ON TABLE public.product_variant_selections IS 'Maps each product_variants row to its selected variant_options. A variant with Color=Black AND Size=Medium has two rows here.';
