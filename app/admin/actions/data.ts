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

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    profile: profileRes.data,
    orders: ordersRes.data ?? [],
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
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  return { error: error?.message ?? null };
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
        variant_attributes(*),
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
