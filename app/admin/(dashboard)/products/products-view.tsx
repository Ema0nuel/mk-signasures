"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Package } from "lucide-react";
import { getProducts } from "@/app/admin/actions/data";
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

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductsView() {
  const [products, setProducts] = useState<ProductWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">Products</h1>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "draft", "archived", "out_of_stock"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 h-9 text-xs font-medium border transition-colors ${
                statusFilter === status
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" ? "All" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Featured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const primaryImage = product.product_images.find((img) => img.is_primary);
                  return (
                    <tr key={product.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/products/${product.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {primaryImage ? (
                              <img src={primaryImage.optimized_url || primaryImage.original_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{product.categories?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{formatNaira(product.base_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${statusColors[product.status] ?? ""}`}>
                          {product.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.is_featured ? (
                          <span className="text-gold text-xs font-medium">Featured</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
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

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
