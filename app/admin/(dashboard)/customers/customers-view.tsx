"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { getCustomers } from "@/app/admin/actions/data";
import type { UserProfile } from "@/types/database";

const roleColors: Record<string, string> = {
  customer: "bg-gray-100 text-gray-600",
  admin: "bg-gold/10 text-gold",
  super_admin: "bg-gold/20 text-gold-dark",
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "admin", label: "Admins" },
  { value: "super_admin", label: "Super Admins" },
];

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    getCustomers().then((data) => {
      setCustomers(data as UserProfile[]);
      setLoading(false);
    });
  }, []);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchesRole = roleFilter === "all" || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = customers.filter((c) => c.is_active).length;
  const inactiveCount = customers.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-light">Customers</h1>

      {/* Stat Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <Users className="w-4 h-4 text-gold" />
            </div>
            <p className="text-2xl font-medium tracking-tight">
              {customers.length}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Active</p>
              <UserCheck className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-medium tracking-tight">{activeCount}</p>
          </div>
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Inactive</p>
              <UserX className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-medium tracking-tight">
              {inactiveCount}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-3 h-8 text-xs font-medium border whitespace-nowrap transition-colors shrink-0 ${
                roleFilter === opt.value
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/customers/${customer.id}`)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gold/10 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                          {customer.avatar_url ? (
                            <img src={customer.avatar_url} alt={customer.full_name || "Avatar"} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-gold">
                              {customer.full_name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">
                            {customer.full_name || "No name"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${roleColors[customer.role] ?? ""}`}
                      >
                        {customer.role === "super_admin" && (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {customer.role === "admin" && (
                          <Shield className="w-3 h-3" />
                        )}
                        {customer.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {customer.is_active ? (
                        <span className="text-xs text-green-600 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(customer.last_login_at)}
                    </td>
                  </tr>
                ))}
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
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </div>
        ) : (
          filtered.map((customer) => (
            <div
              key={customer.id}
              className="border border-border bg-card p-3 flex items-center gap-3 cursor-pointer"
              onClick={() =>
                (window.location.href = `/customers/${customer.id}`)
              }
            >
              <div className="w-10 h-10 bg-gold/10 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {customer.avatar_url ? (
                  <img src={customer.avatar_url} alt={customer.full_name || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-gold">
                    {customer.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {customer.full_name || "No name"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium ${roleColors[customer.role] ?? ""}`}
                  >
                    {customer.role.replace("_", " ")}
                  </span>
                  {customer.is_active ? (
                    <span className="text-[10px] text-green-600 font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-600 font-medium">
                      Inactive
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {customer.phone || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
