import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { ProductWithCategory, ProductDetail } from "@/types/database";

/** Fetch featured products. Alias getRecommendedProducts to this. */
export async function getFeaturedProducts(): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("is_featured", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      logger.error("Failed to fetch featured products", { message: error.message });
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

/** Recommended products are identical to featured — reuse the same query. */
export const getRecommendedProducts = getFeaturedProducts;

export async function getNewArrivals(): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      logger.error("Failed to fetch new arrivals", { message: error.message });
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

export async function getTrendingProducts(): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(8);

    if (error) {
      logger.error("Failed to fetch trending products", { message: error.message });
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories!inner(*), product_images(*)")
      .eq("categories.slug", categorySlug)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logger.error("Failed to fetch products by category", { message: error.message });
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

export async function searchProducts(
  query: string
): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const q = query.trim();

    const { data: byNameDesc, error: e1 } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: byCategory, error: e2 } = await supabase
      .from("products")
      .select("*, categories!inner(*), product_images(*)")
      .eq("status", "active")
      .ilike("categories.name", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (e1 && e2) {
      logger.error("Failed to search products", { e1: e1.message, e2: e2.message });
      return [];
    }

    const qLower = q.toLowerCase();
    const { data: allForTags } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .limit(50);

    const byTags = (allForTags ?? []).filter((p: ProductWithCategory) =>
      p.tags?.some((t) => t.toLowerCase().includes(qLower))
    );

    const merged = new Map<string, ProductWithCategory>();
    for (const p of [
      ...((byNameDesc ?? []) as unknown as ProductWithCategory[]),
      ...((byCategory ?? []) as unknown as ProductWithCategory[]),
      ...byTags,
    ]) {
      if (!merged.has(p.id)) merged.set(p.id, p);
    }

    return Array.from(merged.values()).slice(0, 20);
  } catch {
    return [];
  }
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        "*, categories(*), product_images(*), variant_attributes(*, variant_options(*)), product_variants(*, product_variant_selections(*))"
      )
      .eq("slug", slug)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch product", { message: error.message });
      return null;
    }

    if (!product) return null;

    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });

    return {
      ...product,
      reviews: reviews ?? [],
    } as unknown as ProductDetail;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getRelatedProducts(
  categoryId: string,
  currentProductId: string
): Promise<ProductWithCategory[]> {
  if (!UUID_RE.test(categoryId) || !UUID_RE.test(currentProductId)) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("category_id", categoryId)
      .eq("status", "active")
      .neq("id", currentProductId)
      .limit(4);

    if (error) {
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}
