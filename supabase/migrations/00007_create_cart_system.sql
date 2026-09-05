-- Migration: 00007_create_cart_system.sql
-- Description: Create carts and cart_items tables for hybrid localStorage + Supabase cart

CREATE TABLE public.carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  merged      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.carts IS 'Shopping carts. user_id is null for guest carts. One cart per authenticated user.';
COMMENT ON COLUMN public.carts.merged IS 'True after localStorage cart items have been synced to this server-side cart.';

CREATE TABLE public.cart_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id             UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity            INTEGER NOT NULL DEFAULT 1,
  added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_cart_variant_unique UNIQUE (cart_id, product_variant_id)
);

COMMENT ON TABLE public.cart_items IS 'Individual items in a cart. Each row links to a specific product variant.';
