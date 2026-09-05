-- Migration: 00008_create_wishlist.sql
-- Description: Create wishlists and wishlist_items tables

CREATE TABLE public.wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT wishlists_user_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.wishlists IS 'One wishlist per user. Created on first item add.';

CREATE TABLE public.wishlist_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id         UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_variant_id  UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_items_wishlist_product_unique UNIQUE (wishlist_id, product_id)
);

COMMENT ON TABLE public.wishlist_items IS 'Saved items in a user wishlist. product_variant_id is optional (wishlist the product regardless of variant).';
