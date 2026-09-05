import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("paystack_reference", reference)
      .single();

    if (orderError || !order) {
      console.error("Order not found for reference:", reference);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // If emails already sent, skip
    if (order.emails_sent) {
      return NextResponse.json({ success: true, orderNumber: order.order_number, alreadySent: true });
    }

    // If order is still pending, confirm it now (webhook may not have fired yet)
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

      // Refresh order data
      const { data: refreshedOrder } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", order.id)
        .single();

      if (refreshedOrder) {
        Object.assign(order, refreshedOrder);
      }
    }

    // Get customer email from auth
    let customerEmail = "";
    if (order.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        order.user_id
      );
      customerEmail = userData?.user?.email || "";
    }

    // Fallback: fetch email from Paystack transaction
    if (!customerEmail && order.paystack_reference) {
      try {
        const psRes = await fetch(
          `https://api.paystack.co/transaction/verify/${order.paystack_reference}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        const psData = await psRes.json();
        if (psData.status && psData.data?.customer?.email) {
          customerEmail = psData.data.customer.email;
        }
      } catch {}
    }

    if (!customerEmail) {
      console.error("No customer email found for order:", order.id);
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    const orderData = {
      orderNumber: order.order_number,
      items: (order.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        line_total: Number(item.line_total),
        image_url: item.image_url,
      })),
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shipping_fee),
      totalAmount: Number(order.total_amount),
      shippingName: order.shipping_name,
      shippingPhone: order.shipping_phone,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingState: order.shipping_state,
      shippingCountry: order.shipping_country,
      paystackReference: order.paystack_reference || reference,
      customerNotes: order.delivery_notes,
    };

    // Send both emails
    const [customerResult, adminResult] = await Promise.all([
      sendOrderConfirmation(customerEmail, order.shipping_name, orderData),
      sendAdminNotification({ ...orderData, customerEmail }),
    ]);

    console.log("Email results:", {
      customer: customerResult,
      admin: adminResult,
    });

    // Mark emails as sent
    await supabase
      .from("orders")
      .update({ emails_sent: true })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
    });
  } catch (err) {
    console.error("send-order-emails error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
