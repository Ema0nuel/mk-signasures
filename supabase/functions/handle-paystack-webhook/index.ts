import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHmac } from "jsr:@std/crypto@0.224.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Verify webhook signature
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const computedSignature = createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (computedSignature !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    // 2. Handle different event types
    switch (eventType) {
      case "charge.success": {
        const reference = data.reference;

        // Find the order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, payment_status")
          .eq("paystack_reference", reference)
          .single();

        if (orderError || !order) {
          console.error("Order not found for reference:", reference);
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Only update if not already confirmed (success page may have done it)
        if (order.payment_status === "pending") {
          await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "successful",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }

        break;
      }

      case "charge.failed": {
        const reference = data.reference;

        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("paystack_reference", reference)
          .single();

        if (order) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }

        break;
      }

      case "refund.created": {
        const reference = data.transaction?.reference;

        if (reference) {
          const { data: order } = await supabase
            .from("orders")
            .select("id")
            .eq("paystack_reference", reference)
            .single();

          if (order) {
            await supabase
              .from("orders")
              .update({
                status: "refunded",
                payment_status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        }

        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
