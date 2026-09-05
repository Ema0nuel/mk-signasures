-- Migration: 00013_create_indexes.sql
-- Description: Create performance indexes for all tables

-- Products
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_created ON public.products(created_at DESC);

-- Product variants
CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- Variant attributes
CREATE INDEX idx_variant_attributes_product ON public.variant_attributes(product_id);

-- Variant options
CREATE INDEX idx_variant_options_attribute ON public.variant_options(attribute_id);

-- Product variant selections
CREATE INDEX idx_pvs_variant ON public.product_variant_selections(product_variant_id);
CREATE INDEX idx_pvs_option ON public.product_variant_selections(variant_option_id);

-- Product images
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
CREATE INDEX idx_product_images_variant ON public.product_images(product_variant_id) WHERE product_variant_id IS NOT NULL;
CREATE INDEX idx_product_images_primary ON public.product_images(is_primary) WHERE is_primary = true;

-- Cart
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_carts_session ON public.carts(session_id);
CREATE INDEX idx_carts_user ON public.carts(user_id) WHERE user_id IS NOT NULL;

-- Wishlist
CREATE INDEX idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);

-- Orders
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_reference ON public.orders(paystack_reference) WHERE paystack_reference IS NOT NULL;
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- Order items
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- User addresses
CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);

-- Admin audit logs
CREATE INDEX idx_audit_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_audit_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON public.admin_audit_logs(created_at DESC);
