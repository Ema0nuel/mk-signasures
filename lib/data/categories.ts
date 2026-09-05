import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Failed to fetch categories:", error.message);
      return [];
    }

    return (data ?? []) as unknown as Category[];
  } catch {
    return [];
  }
}

export async function getCategoriesWithProductCount(): Promise<
  (Category & { product_count: number })[]
> {
  try {
    const supabase = await createClient();
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (catError || !categories || categories.length === 0) {
      return [];
    }

    const { data: counts } = await supabase
      .from("products")
      .select("category_id")
      .eq("status", "active");

    const countMap = new Map<string, number>();
    (counts ?? []).forEach((p) => {
      countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1);
    });

    return (categories as Category[]).map((cat) => ({
      ...cat,
      product_count: countMap.get(cat.id) ?? 0,
    }));
  } catch {
    return [];
  }
}
