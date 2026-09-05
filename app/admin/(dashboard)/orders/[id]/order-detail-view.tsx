"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
} from "lucide-react";
import { getOrderById, updateOrderStatus } from "@/app/admin/actions/data";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

type OrderFull = Order & {
  order_items: OrderItem[];
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
  processing: { label: "Processing", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  refunded: { label: "Refunded", icon: XCircle, color: "text-orange-600", bg: "bg-orange-50" },
};

const statusFlow: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

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
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getOrderById(orderId).then(({ order: o, items }) => {
      if (o) {
        setOrder({ ...o, order_items: items } as unknown as OrderFull);
      }
      setLoading(false);
    });
  }, [orderId]);

  async function handleUpdateStatus(newStatus: OrderStatus) {
    if (!order) return;
    setUpdating(true);

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "shipped") updates.shipped_at = new Date().toISOString();
    if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

    await updateOrderStatus(order.id, newStatus);

    setOrder((prev) => prev ? { ...prev, ...updates, status: newStatus } as OrderFull : prev);
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse border border-border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-gold hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const currentStep = statusFlow.indexOf(order.status as OrderStatus);

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">Placed {formatDate(order.created_at)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${status.color} ${status.bg}`}>
          <StatusIcon className="w-3 h-3" /> {status.label}
        </span>
      </div>

      <div className="border border-border bg-card p-5">
        <h2 className="text-sm font-medium mb-4">Order Progress</h2>
        <div className="flex items-center gap-1">
          {statusFlow.map((step, i) => {
            const config = statusConfig[step];
            const isComplete = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-medium border ${isComplete ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"} ${isCurrent ? "ring-2 ring-gold/30" : ""}`}>
                    {i + 1}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center">{config.label}</p>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`h-px flex-1 mx-1 -mt-4.5 ${i < currentStep ? "bg-gold" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">Items ({order.order_items.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-12 h-12 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.variant_name} &middot; {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium tabular-nums">{formatNaira(item.line_total)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x {formatNaira(item.unit_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-5">
            <h2 className="text-sm font-medium mb-3">Update Status</h2>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((step) => (
                <button
                  key={step}
                  onClick={() => handleUpdateStatus(step)}
                  disabled={updating || order.status === step}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${order.status === step ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"}`}
                >
                  {statusConfig[step].label}
                </button>
              ))}
              <button onClick={() => handleUpdateStatus("cancelled")} disabled={updating || order.status === "cancelled"} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">{formatNaira(order.shipping_fee)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatNaira(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Shipping Address</h2>
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground font-medium">{order.shipping_name}</p>
              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state}</p>
              <p>{order.shipping_country}</p>
              {order.shipping_postal && <p>{order.shipping_postal}</p>}
              {order.delivery_notes && <p className="mt-2 text-xs italic">Note: {order.delivery_notes}</p>}
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Payment</h2>
            </div>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{order.payment_status}</span>
              </div>
              {order.paystack_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{order.paystack_reference}</span>
                </div>
              )}
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDate(order.paid_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
