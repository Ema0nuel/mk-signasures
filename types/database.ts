/**
 * Database types for MK Signasures.
 * Mirrors the Supabase schema defined in migrations.
 *
 * These types are hand-written to match the SQL schema exactly.
 * Regenerate from live database with: npx supabase gen types typescript --local > types/database.ts
 */

// ============================================================
// Enums
// ============================================================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "refunded";

export type UserRole = "customer" | "admin" | "super_admin";

export type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";

export type ImageProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

// ============================================================
// Row Types (one per table)
// ============================================================

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string;
  base_price: number;
  status: ProductStatus;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface VariantAttribute {
  id: string;
  product_id: string;
  name: string;
  display_name: string;
  sort_order: number;
  created_at: string;
}

export interface VariantOption {
  id: string;
  attribute_id: string;
  value: string;
  display_value: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  weight_grams: number | null;
  is_active: boolean;
  barcode: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantSelection {
  id: string;
  product_variant_id: string;
  variant_option_id: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  original_url: string;
  optimized_url: string | null;
  blur_data_url: string | null;
  alt_text: string | null;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  processing_status: ImageProcessingStatus;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string;
  merged: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product_variant_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal: string | null;
  delivery_notes: string | null;
  paystack_reference: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  emails_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Relation Types (joined / expanded)
// ============================================================

/** A product with its category and primary image */
export interface ProductWithCategory extends Product {
  categories: Category;
  product_images: ProductImage[];
  product_variants?: ProductVariant[];
}

/** A product with all its variant data for the product detail page */
export interface ProductDetail extends Product {
  categories: Category;
  product_images: ProductImage[];
  variant_attributes: VariantAttributeWithOptions[];
  product_variants: ProductVariantWithSelections[];
  reviews?: ProductReview[];
}

/** Variant attribute with its selectable options */
export interface VariantAttributeWithOptions extends VariantAttribute {
  variant_options: VariantOption[];
}

/** A variant with its attribute selections */
export interface ProductVariantWithSelections extends ProductVariant {
  product_variant_selections: ProductVariantSelection[];
}

/** Cart item expanded with variant and product info */
export interface CartItemExpanded extends CartItem {
  product_variants: ProductVariant & {
    products: Product;
    product_images: ProductImage[];
  };
}

/** Order with its items */
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface ShippingAddress {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  notes?: string;
}

export interface ProcessOrderCartItem {
  variantId: string;
  quantity: number;
}

export interface ProcessOrderRequest {
  userId: string;
  cartItems: ProcessOrderCartItem[];
  shippingAddress: ShippingAddress;
}

export interface ProcessOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface SyncCartRequest {
  userId: string;
  items: Array<{
    variantId: string;
    quantity: number;
    addedAt: number;
  }>;
}

export interface SyncCartResponse {
  cartId: string;
  itemCount: number;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

// ============================================================
// Admin Dashboard Types
// ============================================================

export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  ordersByStatus: Record<OrderStatus, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}
