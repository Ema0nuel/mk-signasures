import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sendOrderStatusUpdate } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    // Verify caller is admin
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: "orderId and newStatus are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, shipping_name")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Get customer email
    let customerEmail = "";

    if (order.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        order.user_id
      );
      customerEmail = userData?.user?.email || "";
    }

    if (!customerEmail) {
      // Skip email but don't fail the request
      return NextResponse.json({ success: true, skipped: true, reason: "No customer email found" });
    }

    const result = await sendOrderStatusUpdate(
      customerEmail,
      order.shipping_name || "Customer",
      order.order_number,
      newStatus
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-order-status-email error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
