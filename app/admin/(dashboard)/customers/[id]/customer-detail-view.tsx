"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Shield, ShieldCheck } from "lucide-react";
import { getCustomerById } from "@/app/admin/actions/data";
import type { UserProfile, Order } from "@/types/database";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const roleColors: Record<string, string> = {
  customer: "bg-gray-100 text-gray-600",
  admin: "bg-gold/10 text-gold",
  super_admin: "bg-gold/20 text-gold-dark",
};

export default function CustomerDetailView({ customerId }: { customerId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerById(customerId).then(({ profile: p, orders: o, email: e }) => {
      setProfile(p as UserProfile);
      setOrders(o as Order[]);
      setEmail(e);
      setLoading(false);
    });
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse border border-border" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Customer not found</p>
        <Link href="/admin/customers" className="text-sm text-gold hover:underline mt-2 inline-block">Back to customers</Link>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.payment_status === "successful")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Customers
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gold/10 border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-medium text-gold">{profile.full_name?.charAt(0)?.toUpperCase() || "?"}</span>
          )}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-light">{profile.full_name || "No name"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${roleColors[profile.role] ?? ""}`}>
              {profile.role === "super_admin" && <ShieldCheck className="w-3 h-3" />}
              {profile.role === "admin" && <Shield className="w-3 h-3" />}
              {profile.role.replace("_", " ")}
            </span>
            {profile.is_active ? (
              <span className="text-xs text-green-600">Active</span>
            ) : (
              <span className="text-xs text-red-600">Inactive</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="text-xl font-medium tabular-nums">{orders.length}</p>
            </div>
            <div className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-xl font-medium tabular-nums">{formatNaira(totalSpent)}</p>
            </div>
            <div className="border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Last Order</p>
              <p className="text-sm">
                {orders.length > 0
                  ? new Date(orders[0].created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">Order History ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders yet</p>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium font-mono">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatNaira(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Profile Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm">{email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <p className="text-sm">{profile.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                <p className="text-sm">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
