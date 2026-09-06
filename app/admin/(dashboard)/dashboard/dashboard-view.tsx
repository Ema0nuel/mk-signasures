"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  TrendingUp,
  Box,
} from "lucide-react";
import { getDashboardStats } from "@/app/admin/actions/data";
import type { Order } from "@/types/database";

type MostOrderedProduct = {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
};

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
  mostOrdered: MostOrderedProduct[];
  lowStockProducts: {
    id: string;
    name: string;
    base_price: number;
    status: string;
    stock: number;
    product_images: { original_url: string; is_primary: boolean }[];
  }[];
}

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

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600" },
  processing: { label: "Processing", icon: Package, color: "text-purple-600" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-600" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600" },
  refunded: { label: "Refunded", icon: XCircle, color: "text-orange-600" },
};

export default function DashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data as DashboardData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-light">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-7 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Revenue", value: formatNaira(stats.totalRevenue), icon: DollarSign, color: "text-green-600" },
    { label: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { label: "Products", value: stats.totalProducts.toString(), icon: Package, color: "text-purple-600" },
    { label: "Customers", value: stats.totalCustomers.toString(), icon: Users, color: "text-gold" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-light">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-medium tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 border border-border bg-card p-5">
        <p className="col-span-full text-sm font-medium mb-1">Order Status</p>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="text-center">
            <p className="text-2xl font-medium">{stats.ordersByStatus[key] || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Orders
            </h2>
            <Link href="/orders" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {stats.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders yet</p>
            ) : (
              stats.recentOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <Link key={order.id} href={`/orders/${order.id}`} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.shipping_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                      <p className="text-sm font-medium tabular-nums">{formatNaira(order.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">{formatDate(order.created_at)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Most Ordered Products
            </h2>
          </div>
          <div className="divide-y divide-border">
            {stats.mostOrdered.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders yet</p>
            ) : (
              stats.mostOrdered.map((item, i) => (
                <Link key={item.product_id} href={`/products/${item.product_id}`} className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center">{i + 1}</span>
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-muted-foreground">{item.total_quantity} sold</span>
                    <p className="text-sm font-medium tabular-nums">{formatNaira(item.total_revenue)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Box className="w-4 h-4 text-muted-foreground" />
            Inventory
          </h2>
          <Link href="/products" className="text-xs text-gold hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.lowStockProducts.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-sm text-muted-foreground text-center">No products yet</td></tr>
              ) : (
                stats.lowStockProducts.map((product) => {
                  const primaryImage = product.product_images.find((img) => img.is_primary);
                  return (
                    <tr key={product.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {primaryImage ? (
                              <img src={primaryImage.original_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium truncate">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">{product.stock}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium ${
                          product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {product.stock === 0 ? "Out of stock" : product.stock <= 5 ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatNaira(product.base_price)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
