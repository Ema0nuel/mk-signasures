import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

// Shipping fee logic
const LAGOS_FEE = 5000;    // N5,000 within Lagos
const INTERSTATE_FEE = 10000; // N10,000 outside Lagos
const FREE_DELIVERY_THRESHOLD = 100000; // Free above N100,000

function calculateShippingFee(subtotal: number, state: string): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  const normalizedState = (state || "").trim().toLowerCase();
  if (normalizedState === "lagos") return LAGOS_FEE;
  return INTERSTATE_FEE;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { userId, cartItems, shippingAddress, origin } = await req.json();

    if (!userId || !cartItems?.length || !shippingAddress) {
      return new Response(
        JSON.stringify({
          error: "userId, cartItems, and shippingAddress are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Extract variant IDs and quantities from the frontend cart
    const variantIds = cartItems.map((item: any) => item.variantId);

    // 1. Fetch variant and product details directly from product_variants
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select(
        `
        id,
        sku,
        price,
        stock_quantity,
        is_active,
        products (
          id,
          name,
          slug
        ),
        product_images (
          original_url,
          is_primary
        )
      `
      )
      .in("id", variantIds);

    if (variantsError || !variants?.length) {
      return new Response(
        JSON.stringify({
          error: "Cart items not found. Please refresh and try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Merge frontend quantities with database variant data
    const enrichedItems = cartItems.map((item: any) => {
      const variant = variants.find((v) => v.id === item.variantId);
      return {
        ...item,
        variant,
      };
    });

    // 2. Validate stock availability
    for (const item of enrichedItems) {
      const variant = item.variant as any;
      if (!variant) {
        return new Response(
          JSON.stringify({
            error: `Product not found. Please refresh your cart.`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      if (!variant.is_active) {
        return new Response(
          JSON.stringify({
            error: `Variant ${variant.sku} is no longer available`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      if (variant.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Insufficient stock for ${variant.sku}. Available: ${variant.stock_quantity}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // 3. Calculate totals and build order items
    let subtotal = 0;
    const orderItems = enrichedItems.map((item: any) => {
      const variant = item.variant as any;
      const product = variant.products as any;
      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const primaryImage =
        variant.product_images?.find((img: any) => img.is_primary) ||
        variant.product_images?.[0];

      return {
        product_id: product.id,
        product_variant_id: variant.id,
        product_name: product.name,
        variant_name: variant.sku,
        sku: variant.sku,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        image_url: primaryImage?.original_url || null,
      };
    });

    const shippingFee = calculateShippingFee(subtotal, shippingAddress.state);
    const totalAmount = subtotal + shippingFee;

    // 4. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        payment_status: "pending",
        subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        shipping_name: shippingAddress.name,
        shipping_phone: shippingAddress.phone,
        shipping_address: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_country: shippingAddress.country || "Nigeria",
        shipping_postal: shippingAddress.postalCode || null,
        delivery_notes: shippingAddress.notes || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Create order items (triggers stock decrement)
    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }))
    );

    if (itemsError) {
      // Rollback order if items fail
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    // 6. Initialize Paystack transaction
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email:
            shippingAddress.email ||
            `${shippingAddress.phone}@mksignasures.shop`,
          amount: totalAmount * 100, // Paystack uses kobo
          reference: `MK-${order.order_number}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.order_number,
            userId,
          },
          callback_url: `${origin || Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://mksgn.shop"}/checkout/success`,
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(
        paystackData.message || "Paystack initialization failed"
      );
    }

    // 7. Update order with Paystack reference
    await supabase
      .from("orders")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", order.id);

    // 8. Clean up cart items in the database (if they exist)
    const { data: userCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (userCart) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", userCart.id)
        .in("product_variant_id", variantIds);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Process order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
