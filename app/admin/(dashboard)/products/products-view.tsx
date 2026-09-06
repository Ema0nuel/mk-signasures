"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Package, Archive, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getProducts,
  updateProductStatus,
} from "@/app/admin/actions/data";
import type { Product, Category, ProductImage } from "@/types/database";

type ProductWithExtras = Product & {
  categories: Category;
  product_images: ProductImage[];
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
  out_of_stock: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
  out_of_stock: "Out of Stock",
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
  { value: "out_of_stock", label: "Out of Stock" },
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductsView() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"archive" | "out_of_stock" | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data as ProductWithExtras[]);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
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
    const status: "archived" | "out_of_stock" = bulkAction === "archive" ? "archived" : "out_of_stock";
    const errors: string[] = [];
    for (const id of ids) {
      const { error } = await updateProductStatus(id, status);
      if (error) errors.push(error);
    }
    if (errors.length > 0) {
      toast.error(`Failed to update ${errors.length} product(s)`);
    } else {
      setProducts((prev) =>
        prev.map((p) => (selected.has(p.id) ? { ...p, status } : p))
      );
      toast.success(
        `${ids.length} product${ids.length !== 1 ? "s" : ""} ${status === "archived" ? "archived" : "marked out of stock"}`
      );
    }

    setSelected(new Set());
    setBulkAction(null);
    setBulkLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">Products</h1>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => router.push("/products/new")}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} selected`
              : "Select all"}
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
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-4 py-3">
                    <div className="sr-only">Select</div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Featured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const primaryImage = product.product_images.find(
                    (img) => img.is_primary
                  );
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/products/${product.id}`)
                      }
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(product.id);
                          }}
                          className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
                            selected.has(product.id)
                              ? "bg-gold border-gold text-white"
                              : "border-border hover:border-foreground"
                          }`}
                        >
                          {selected.has(product.id) && (
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {primaryImage ? (
                              <img
                                src={
                                  primaryImage.optimized_url ||
                                  primaryImage.original_url
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatNaira(product.base_price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium ${statusColors[product.status] ?? ""}`}
                        >
                          {statusLabels[product.status] ?? product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.is_featured ? (
                          <span className="text-gold text-xs font-medium">
                            Featured
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No
                          </span>
                        )}
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
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        ) : (
          filtered.map((product) => {
            const primaryImage = product.product_images.find(
              (img) => img.is_primary
            );
            return (
              <div
                key={product.id}
                className="border border-border bg-card p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleSelect(product.id)}
                  className={`w-5 h-5 border rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(product.id)
                      ? "bg-gold border-gold text-white"
                      : "border-border"
                  }`}
                >
                  {selected.has(product.id) && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="w-11 h-11 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={
                        primaryImage.optimized_url || primaryImage.original_url
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/products/${product.id}`)
                  }
                >
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium ${statusColors[product.status] ?? ""}`}
                    >
                      {statusLabels[product.status] ?? product.status}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNaira(product.base_price)}
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
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:static">
          <div className="bg-card border border-border p-3 flex items-center gap-3 md:justify-start justify-center shadow-lg md:shadow-none">
            <span className="text-sm font-medium mr-2 hidden sm:inline">
              {selected.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-foreground"
              onClick={() => setBulkAction("archive")}
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-foreground"
              onClick={() => setBulkAction("out_of_stock")}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Out of Stock
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
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
              {bulkAction === "archive"
                ? "Archive Products"
                : "Mark as Out of Stock"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will {bulkAction === "archive" ? "archive" : "mark as out of stock"} {selected.size} product{selected.size !== 1 ? "s" : ""}.
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
              className="bg-primary text-primary-foreground"
            >
              {bulkLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {bulkAction === "archive" ? "Archive" : "Mark Out of Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
