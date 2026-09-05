"use server";

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboardStats() {
  const supabase = getAdminClient();

  const [ordersRes, productsRes, customersRes, orderItemsRes, variantsRes] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*, product_images(original_url, is_primary)"),
      supabase.from("user_profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("order_items")
        .select("product_id, product_name, quantity, line_total"),
      supabase
        .from("product_variants")
        .select("id, product_id, stock_quantity"),
    ]);

  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];
  const orderItems = orderItemsRes.data ?? [];
  const variants = variantsRes.data ?? [];

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.payment_status === "successful" ? o.total_amount : 0),
    0
  );

  const ordersByStatus: Record<string, number> = {};
  for (const order of orders) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
  }

  const productSales: Record<string, { product_id: string; product_name: string; total_quantity: number; total_revenue: number }> = {};
  for (const item of orderItems) {
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = {
        product_id: item.product_id,
        product_name: item.product_name,
        total_quantity: 0,
        total_revenue: 0,
      };
    }
    productSales[item.product_id].total_quantity += item.quantity;
    productSales[item.product_id].total_revenue += item.line_total;
  }
  const mostOrdered = Object.values(productSales)
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5);

  const stockByProduct: Record<string, number> = {};
  for (const v of variants) {
    stockByProduct[v.product_id] = (stockByProduct[v.product_id] || 0) + v.stock_quantity;
  }
  const lowStockProducts = products
    .map((p) => ({ ...p, stock: stockByProduct[p.id] || 0 }))
    .filter((p) => p.status === "active")
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: products.length,
    totalCustomers: customersRes.count ?? 0,
    recentOrders: orders.slice(0, 5),
    ordersByStatus,
    mostOrdered,
    lowStockProducts,
  };
}

// ============================================================
// Customers
// ============================================================

export async function getCustomers() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getCustomerById(id: string) {
  const supabase = getAdminClient();

  const [profileRes, ordersRes, authRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase.auth.admin.getUserById(id),
  ]);

  return {
    profile: profileRes.data,
    orders: ordersRes.data ?? [],
    email: authRes.data?.user?.email ?? null,
  };
}

// ============================================================
// Orders
// ============================================================

export async function getOrders() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getOrderById(id: string) {
  const supabase = getAdminClient();

  const [orderRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  return {
    order: orderRes.data,
    items: itemsRes.data ?? [],
  };
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "shipped") updates.shipped_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  if (paymentStatus === "successful") updates.paid_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "shipped") updates.shipped_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .in("id", ids);

  return { error: error?.message ?? null };
}

export async function getOrderRevenueStats() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("total_amount, payment_status")
    .order("created_at", { ascending: false });

  const orders = data ?? [];
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.payment_status === "successful" ? o.total_amount : 0),
    0
  );
  const successfulCount = orders.filter((o) => o.payment_status === "successful").length;

  return { totalRevenue, successfulCount, totalOrders: orders.length };
}

// ============================================================
// Products
// ============================================================

export async function getProducts() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(*), product_images(*)")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProductById(id: string) {
  const supabase = getAdminClient();

  const [productRes, reviewsRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        `*,
        categories(*),
        product_images(*),
        variant_attributes(*, variant_options(*)),
        product_variants(
          *,
          product_variant_selections(
            *,
            variant_options(
              *,
              variant_attributes(*)
            )
          )
        )`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    product: productRes.data,
    reviews: reviewsRes.data ?? [],
  };
}

export async function deleteReview(reviewId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);

  return { error: error?.message ?? null };
}

// ============================================================
// Categories
// ============================================================

export async function getCategories() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getCategoryById(id: string) {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const supabase = getAdminClient();
  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url || null,
      parent_id: data.parent_id || null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  return { data: created, error: error?.message ?? null };
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    image_url?: string;
    parent_id?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteCategory(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function getCategoryProductCount(categoryId: string) {
  const supabase = getAdminClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  return count ?? 0;
}

// ============================================================
// Product Mutations
// ============================================================

export async function createProduct(product: {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id: string;
  base_price: number;
  status: string;
  is_featured: boolean;
  tags?: string[];
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function updateProductStatus(id: string, status: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteProducts(ids: string[]) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .in("id", ids);

  return { error: error?.message ?? null };
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    short_description?: string;
    category_id?: string;
    base_price?: number;
    status?: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    tags?: string[];
  }
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ============================================================
// Product Images
// ============================================================

export async function deleteProductImage(imageId: string, storagePath: string) {
  const supabase = getAdminClient();

  // Delete from storage
  await supabase.storage.from("product-images").remove([storagePath]);

  // Delete from database
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  return { error: error?.message ?? null };
}

export async function updateProductImage(
  imageId: string,
  data: { alt_text?: string; is_primary?: boolean; sort_order?: number }
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("product_images")
    .update(data)
    .eq("id", imageId);

  return { error: error?.message ?? null };
}

export async function setPrimaryImage(productId: string, imageId: string) {
  const supabase = getAdminClient();

  // Unset all current primaries
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  // Set the new primary
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  return { error: error?.message ?? null };
}

export async function uploadProductImageFile(
  productId: string,
  fileBase64: string,
  fileName: string,
  fileType: string,
  altText?: string,
  isPrimary?: boolean
) {
  const supabase = getAdminClient();

  const ext = fileName.split(".").pop() || "jpg";
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Decode base64 to buffer
  const buffer = Buffer.from(fileBase64, "base64");

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, buffer, { contentType: fileType });

  if (uploadError) return { data: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // If first image, make it primary
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const shouldBePrimary = count === 0 || isPrimary;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: path,
      original_url: publicUrl,
      alt_text: altText || null,
      sort_order: nextSort,
      is_primary: shouldBePrimary,
      processing_status: "pending",
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function reorderProductImages(imageIds: string[]) {
  const supabase = getAdminClient();

  const updates = imageIds.map((id, index) =>
    supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", id)
  );

  await Promise.all(updates);
  return { error: null };
}

export async function addProductImageByUrl(
  productId: string,
  imageUrl: string,
  altText?: string,
  isPrimary?: boolean
) {
  const supabase = getAdminClient();

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // If this is the first image, make it primary
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const shouldBePrimary = count === 0 || isPrimary;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: imageUrl,
      original_url: imageUrl,
      optimized_url: imageUrl,
      alt_text: altText || null,
      sort_order: nextSort,
      is_primary: shouldBePrimary,
      processing_status: "completed",
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

// ============================================================
// Variant Attributes
// ============================================================

export async function createVariantAttribute(
  productId: string,
  name: string,
  displayName: string
) {
  const supabase = getAdminClient();

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("variant_attributes")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("variant_attributes")
    .insert({
      product_id: productId,
      name: name.toLowerCase().replace(/\s+/g, "_"),
      display_name: displayName,
      sort_order: nextSort,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function deleteVariantAttribute(attributeId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("variant_attributes")
    .delete()
    .eq("id", attributeId);

  return { error: error?.message ?? null };
}

// ============================================================
// Variant Options
// ============================================================

export async function createVariantOption(
  attributeId: string,
  value: string,
  displayValue?: string
) {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from("variant_options")
    .select("sort_order")
    .eq("attribute_id", attributeId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("variant_options")
    .insert({
      attribute_id: attributeId,
      value,
      display_value: displayValue || value,
      sort_order: nextSort,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function deleteVariantOption(optionId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("variant_options")
    .delete()
    .eq("id", optionId);

  return { error: error?.message ?? null };
}

// ============================================================
// Product Variants (SKUs)
// ============================================================

export async function createProductVariant(data: {
  product_id: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  weight_grams?: number;
  is_active?: boolean;
  barcode?: string;
  option_ids: string[];
}) {
  const supabase = getAdminClient();
  const { option_ids, ...variantData } = data;

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .insert(variantData)
    .select()
    .single();

  if (variantError) return { data: null, error: variantError.message };

  // Insert selections
  if (option_ids.length > 0) {
    const selections = option_ids.map((option_id) => ({
      product_variant_id: variant.id,
      variant_option_id: option_id,
    }));

    const { error: selError } = await supabase
      .from("product_variant_selections")
      .insert(selections);

    if (selError) return { data: null, error: selError.message };
  }

  return { data: variant, error: null };
}

export async function updateProductVariant(
  id: string,
  data: {
    sku?: string;
    price?: number;
    compare_at_price?: number;
    stock_quantity?: number;
    weight_grams?: number;
    is_active?: boolean;
    barcode?: string;
  }
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteProductVariant(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function getProductVariantById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `*,
       product_variant_selections(
        *,
        variant_options(*, variant_attributes(*))
       )`
    )
    .eq("id", id)
    .single();

  return { data, error: error?.message ?? null };
}
