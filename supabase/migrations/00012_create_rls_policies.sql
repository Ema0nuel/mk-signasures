-- Migration: 00012_create_rls_policies.sql
-- Description: Enable RLS and create all Row Level Security policies

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ: Catalog tables (anyone can browse)
-- ============================================================

-- Categories: public read for active categories
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Products: public read for active products
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

-- Variant attributes: public read (filtered by product above)
CREATE POLICY "Public can view variant attributes"
  ON public.variant_attributes FOR SELECT
  USING (true);

-- Variant options: public read
CREATE POLICY "Public can view variant options"
  ON public.variant_options FOR SELECT
  USING (true);

-- Product variants: public read for active variants
CREATE POLICY "Public can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

-- Product variant selections: public read
CREATE POLICY "Public can view variant selections"
  ON public.product_variant_selections FOR SELECT
  USING (true);

-- Product images: public read
CREATE POLICY "Public can view product images"
  ON public.product_images FOR SELECT
  USING (true);

-- ============================================================
-- AUTHENTICATED USER: Profile, addresses, cart, wishlist, orders
-- ============================================================

-- user_profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- user_addresses: full CRUD on own addresses
CREATE POLICY "Users can view own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- carts: users can manage their own cart
CREATE POLICY "Users can view own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

-- cart_items: users can manage items in their own cart
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- wishlists: users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- wishlist_items: users can manage their own wishlist items
CREATE POLICY "Users can view own wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own wishlist items"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

-- orders: users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- order_items: users can view items from their own orders
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- ADMIN: Full management of catalog, orders, and audit logs
-- ============================================================

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products: admin full CRUD
CREATE POLICY "Admins can create products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- Categories: admin full CRUD
CREATE POLICY "Admins can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- Variant attributes: admin full CRUD
CREATE POLICY "Admins can create variant attributes"
  ON public.variant_attributes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update variant attributes"
  ON public.variant_attributes FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete variant attributes"
  ON public.variant_attributes FOR DELETE
  USING (public.is_admin());

-- Variant options: admin full CRUD
CREATE POLICY "Admins can create variant options"
  ON public.variant_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update variant options"
  ON public.variant_options FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete variant options"
  ON public.variant_options FOR DELETE
  USING (public.is_admin());

-- Product variants: admin full CRUD
CREATE POLICY "Admins can create product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product variants"
  ON public.product_variants FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete product variants"
  ON public.product_variants FOR DELETE
  USING (public.is_admin());

-- Product variant selections: admin full CRUD
CREATE POLICY "Admins can create variant selections"
  ON public.product_variant_selections FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update variant selections"
  ON public.product_variant_selections FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete variant selections"
  ON public.product_variant_selections FOR DELETE
  USING (public.is_admin());

-- Product images: admin full CRUD
CREATE POLICY "Admins can create product images"
  ON public.product_images FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  USING (public.is_admin());

-- Orders: admin can view and update all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Order items: admin can view all
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

-- Admin audit logs: admin can view and insert
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- User profiles: admin can view all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin());
