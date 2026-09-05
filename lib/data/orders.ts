import { createClient } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserOrders(
  userId: string
): Promise<OrderWithItems[]> {
  if (!UUID_RE.test(userId)) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders:", error.message);
      return [];
    }

    return (data ?? []) as unknown as OrderWithItems[];
  } catch {
    return [];
  }
}
