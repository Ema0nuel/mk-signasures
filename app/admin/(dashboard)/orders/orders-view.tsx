"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  DollarSign,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrders,
  getOrderRevenueStats,
  bulkUpdateOrderStatus,
} from "@/app/admin/actions/data";
import type { Order } from "@/types/database";

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  refunded: {
    label: "Refunded",
    icon: XCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

const paymentColors: Record<string, string> = {
  successful: "text-green-600",
  pending: "text-yellow-600",
  processing: "text-blue-600",
  failed: "text-red-600",
  refunded: "text-orange-600",
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const bulkStatusOptions = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    successfulCount: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    Promise.all([getOrders(), getOrderRevenueStats()]).then(
      ([ordersData, stats]) => {
        setOrders(ordersData as Order[]);
        setRevenueStats(stats);
        setLoading(false);
      }
    );
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

  const allSelected =
    filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    setBulkLoading(true);

    const ids = Array.from(selected);
    const { error } = await bulkUpdateOrderStatus(ids, bulkAction);

    if (error) {
      toast.error(error);
      setBulkLoading(false);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        selected.has(o.id) ? { ...o, status: bulkAction as Order["status"] } : o
      )
    );
    toast.success(
      `${ids.length} order${ids.length !== 1 ? "s" : ""} updated to ${bulkAction}`
    );

    setSelected(new Set());
    setBulkAction(null);
    setBulkLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-light">Orders</h1>

      {/* Revenue Stats */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-medium tracking-tight">
              {formatNaira(revenueStats.totalRevenue)}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Paid Orders</p>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-medium tracking-tight">
              {revenueStats.successfulCount}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <ShoppingCart className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-medium tracking-tight">
              {revenueStats.totalOrders}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 h-8 text-xs font-medium border whitespace-nowrap transition-colors shrink-0 ${
                statusFilter === opt.value
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select All (desktop) */}
      {!loading && filtered.length > 0 && (
        <div className="hidden md:flex items-center gap-2 text-sm">
          <button
            onClick={toggleSelectAll}
            className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
              allSelected
                ? "bg-gold border-gold text-white"
                : "border-border hover:border-foreground"
            }`}
          >
            {allSelected && (
              <svg
                className="w-3 h-3"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <span className="text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </span>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block border border-border bg-card">
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
                  <th className="w-10 px-4 py-3">
                    <div className="sr-only">Select</div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => {
                  const status =
                    statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/admin/orders/${order.id}`)
                      }
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(order.id);
                          }}
                          className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
                            selected.has(order.id)
                              ? "bg-gold border-gold text-white"
                              : "border-border hover:border-foreground"
                          }`}
                        >
                          {selected.has(order.id) && (
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {order.order_number}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">
                          {order.shipping_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.shipping_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium capitalize ${paymentColors[order.payment_status] ?? ""}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatNaira(order.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center border border-border bg-card">
            <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center border border-border bg-card">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          filtered.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={order.id}
                className="border border-border bg-card p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleSelect(order.id)}
                  className={`w-5 h-5 border rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(order.id)
                      ? "bg-gold border-gold text-white"
                      : "border-border"
                  }`}
                >
                  {selected.has(order.id) && (
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/admin/orders/${order.id}`)
                  }
                >
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.order_number}
                    </p>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {order.shipping_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-medium capitalize ${paymentColors[order.payment_status] ?? ""}`}
                    >
                      {order.payment_status}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNaira(order.total_amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:static">
          <div className="bg-card border border-border p-3 flex items-center gap-2 md:justify-start justify-center shadow-lg md:shadow-none flex-wrap">
            <span className="text-sm font-medium mr-1 hidden sm:inline">
              {selected.size} selected
            </span>
            {bulkStatusOptions.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                className={`border-border text-xs ${
                  status === "cancelled"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBulkAction(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={bulkAction !== null}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {selected.size} Order{selected.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will change the status of {selected.size} order
            {selected.size !== 1 ? "s" : ""} to{" "}
            <span className="font-medium text-foreground">{bulkAction}</span>.
          </p>
          <DialogFooter>
            <button
              onClick={() => setBulkAction(null)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleBulkAction}
              disabled={bulkLoading}
              className={
                bulkAction === "cancelled"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-primary text-primary-foreground"
              }
            >
              {bulkLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
