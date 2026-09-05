import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { userId, items } = await req.json();

    if (!userId || !items?.length) {
      return new Response(
        JSON.stringify({ error: "userId and items are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Get or create user's cart
    let { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!cart) {
      const { data: newCart } = await supabase
        .from("carts")
        .insert({ user_id: userId, session_id: crypto.randomUUID() })
        .select("id")
        .single();
      cart = newCart;
    }

    // 2. Upsert each item (conflict resolution: take higher quantity)
    for (const item of items) {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart!.id)
        .eq("product_variant_id", item.variantId)
        .single();

      if (existing) {
        const maxQuantity = Math.max(existing.quantity, item.quantity);
        await supabase
          .from("cart_items")
          .update({ quantity: maxQuantity })
          .eq("id", existing.id);
      } else {
        // Check stock before adding
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity, is_active")
          .eq("id", item.variantId)
          .single();

        if (variant?.is_active && variant.stock_quantity > 0) {
          await supabase.from("cart_items").insert({
            cart_id: cart!.id,
            product_variant_id: item.variantId,
            quantity: Math.min(item.quantity, variant.stock_quantity),
          });
        }
      }
    }

    // 3. Mark cart as merged
    await supabase
      .from("carts")
      .update({ merged: true })
      .eq("id", cart!.id);

    // 4. Count total items
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("cart_id", cart!.id);

    return new Response(
      JSON.stringify({ cartId: cart!.id, itemCount: count || 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cart sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
