-- Migration: 00009_create_orders.sql
-- Description: Create orders and order_items tables with price snapshots

CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  order_number      TEXT NOT NULL,
  status            public.order_status NOT NULL DEFAULT 'pending',
  payment_status    public.payment_status NOT NULL DEFAULT 'pending',
  subtotal          DECIMAL(12,2) NOT NULL,
  shipping_fee      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(12,2) NOT NULL,
  shipping_name     TEXT NOT NULL,
  shipping_phone    TEXT NOT NULL,
  shipping_address  TEXT NOT NULL,
  shipping_city     TEXT NOT NULL,
  shipping_state    TEXT NOT NULL,
  shipping_country  TEXT NOT NULL DEFAULT 'Nigeria',
  shipping_postal   TEXT,
  delivery_notes    TEXT,
  paystack_reference TEXT,
  paid_at           TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_order_number_unique UNIQUE (order_number)
);

COMMENT ON TABLE public.orders IS 'Customer orders. order_number is auto-generated (MK-YYYYMMDD-NNNN). Shipping details are snapshots at time of order.';
COMMENT ON COLUMN public.orders.paystack_reference IS 'Paystack transaction reference for payment verification.';

CREATE TABLE public.order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name        TEXT NOT NULL,
  variant_name        TEXT NOT NULL,
  sku                 TEXT NOT NULL,
  unit_price          DECIMAL(12,2) NOT NULL,
  quantity            INTEGER NOT NULL,
  line_total          DECIMAL(12,2) NOT NULL,
  image_url           TEXT
);

COMMENT ON TABLE public.order_items IS 'Snapshot of ordered items. product_name, variant_name, sku, unit_price, and image_url are copied at order time to preserve historical accuracy.';
