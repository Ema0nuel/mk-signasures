import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { UserAddress } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserAddresses(
  userId: string
): Promise<UserAddress[]> {
  if (!UUID_RE.test(userId)) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch addresses", { message: error.message });
      return [];
    }

    return (data ?? []) as unknown as UserAddress[];
  } catch {
    return [];
  }
}
