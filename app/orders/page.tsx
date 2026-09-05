import type { Metadata } from "next";
import { getUserOrders } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";
import OrdersView from "./orders-view";
import type { OrderWithItems } from "@/types/database";

export const metadata: Metadata = {
  title: "Orders",
  description: "View your MK Signatures order history.",
  openGraph: {
    title: "Orders | MK Signatures",
    description: "View your order history.",
    url: "https://mksignatures.com/orders",
  },
  alternates: {
    canonical: "https://mksignatures.com/orders",
  },
};

export default async function OrdersPage() {
  let orders: OrderWithItems[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      orders = await getUserOrders(user.id);
    }
  } catch {
    // Not authenticated or error — show empty state
  }

  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            My Orders
          </h1>
        </div>
      </div>
      <OrdersView initialOrders={orders} />
    </div>
  );
}
