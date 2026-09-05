import { createClient } from "@/lib/supabase/server";
import type { ProductWithCategory, ProductDetail } from "@/types/database";

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
      console.error("Failed to fetch featured products:", error.message);
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

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
      console.error("Failed to fetch new arrivals:", error.message);
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
      console.error("Failed to fetch trending products:", error.message);
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
  } catch {
    return [];
  }
}

export async function getRecommendedProducts(): Promise<ProductWithCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Failed to fetch recommended products:", error.message);
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
      console.error("Failed to fetch products by category:", error.message);
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
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .eq("status", "active")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to search products:", error.message);
      return [];
    }

    return (data ?? []) as unknown as ProductWithCategory[];
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
      console.error("Failed to fetch product:", error.message);
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
