"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { getOrders } from "@/app/admin/actions/data";
import type { Order } from "@/types/database";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600" },
  processing: { label: "Processing", icon: ShoppingCart, color: "text-purple-600" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-600" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600" },
  refunded: { label: "Refunded", icon: XCircle, color: "text-orange-600" },
};

const paymentColors: Record<string, string> = {
  successful: "text-green-600",
  pending: "text-yellow-600",
  processing: "text-blue-600",
  failed: "text-red-600",
  refunded: "text-orange-600",
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data as Order[]);
      setLoading(false);
    });
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_name.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_phone?.includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-light">Orders</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 h-9 text-xs font-medium border transition-colors ${
                statusFilter === status
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{order.shipping_name}</p>
                        <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium capitalize ${paymentColors[order.payment_status] ?? ""}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatNaira(order.total_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
