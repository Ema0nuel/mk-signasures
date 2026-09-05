"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrderWithItems } from "@/types/database";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Package className="h-3 w-3" />,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <Truck className="h-3 w-3" />,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  refunded: {
    label: "Refunded",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

export default function OrdersView({
  initialOrders,
}: {
  initialOrders: OrderWithItems[];
}) {
  const [orders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          No orders yet
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Start shopping and your orders will appear here.
        </p>
        <Link href="/shop">
          <Button className="bg-gold text-black hover:bg-gold-light h-11">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-4">
      <p className="text-sm text-muted-foreground">
        {orders.length} order{orders.length !== 1 ? "s" : ""}
      </p>

      {orders.map((order) => {
        const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
        const isExpanded = expandedId === order.id;
        const itemCount = order.order_items?.length ?? 0;

        return (
          <div
            key={order.id}
            className="border border-border overflow-hidden"
          >
            {/* Order header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-secondary/50 transition-colors duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`${status.color} border gap-1 w-fit`}
                >
                  {status.icon}
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPrice(order.total_amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded items */}
            {isExpanded && (
              <div className="border-t border-border">
                {/* Order items */}
                <div className="divide-y divide-border">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 sm:px-6"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.product_name}
                        </p>
                        {item.variant_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variant_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium shrink-0">
                        {formatPrice(item.line_total)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping info */}
                <div className="border-t border-border p-4 sm:px-6 space-y-2 bg-secondary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Shipping: </span>
                      {order.shipping_name}, {order.shipping_address},{" "}
                      {order.shipping_city}, {order.shipping_state}
                    </div>
                    {order.paid_at && (
                      <div>
                        <span className="font-medium text-foreground">Paid: </span>
                        {formatDate(order.paid_at)}
                      </div>
                    )}
                  </div>
                  {order.delivery_notes && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Note: </span>
                      {order.delivery_notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
