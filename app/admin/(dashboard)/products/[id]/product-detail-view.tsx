"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, ExternalLink, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getProductById, deleteReview } from "@/app/admin/actions/data";
import { Button } from "@/components/ui/button";
import type { ProductReview } from "@/types/database";

type VariantSelection = {
  id: string;
  variant_options: {
    display_value: string | null;
    value: string;
    variant_attributes: { display_name: string };
  };
};

type Variant = {
  id: string;
  sku: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  product_variant_selections: VariantSelection[];
};

type ProductFull = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  status: string;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  created_at: string;
  categories: { name: string } | null;
  product_images: { optimized_url: string | null; original_url: string; is_primary: boolean }[];
  product_variants: Variant[];
  variant_attributes: unknown[];
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
  out_of_stock: "bg-red-100 text-red-700",
};

export default function ProductDetailView({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductById(productId).then(({ product: p, reviews: r }) => {
      setProduct(p as unknown as ProductFull);
      setReviews(r as ProductReview[]);
      setLoading(false);
    });
  }, [productId]);

  async function handleDeleteReview(reviewId: string) {
    const { error } = await deleteReview(reviewId);
    if (error) {
      toast.error("Failed to delete review");
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    toast.success("Review deleted");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse border border-border" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Product not found</p>
        <Link href="/admin/products" className="text-sm text-gold hover:underline mt-2 inline-block">Back to products</Link>
      </div>
    );
  }

  const primaryImage = product.product_images.find((img) => img.is_primary);
  const totalStock = product.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Products
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-light">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{product.slug} &middot; Created {formatDate(product.created_at)}</p>
        </div>
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium ${statusColors[product.status] ?? ""}`}>
          {product.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card p-5">
            <h2 className="text-sm font-medium mb-4">Image</h2>
            {primaryImage ? (
              <div className="w-full max-w-md aspect-square border border-border bg-muted overflow-hidden">
                <img src={primaryImage.optimized_url || primaryImage.original_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-md aspect-square border border-border bg-muted flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="border border-border bg-card p-5">
            <h2 className="text-sm font-medium mb-3">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description || product.short_description || "No description"}
            </p>
          </div>

          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">Variants ({product.product_variants.length})</h2>
            </div>
            {product.product_variants.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">No variants</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">SKU</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Options</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Price</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Stock</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {product.product_variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5 font-mono text-xs">{variant.sku}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {variant.product_variant_selections
                            .map((sel) => `${sel.variant_options.variant_attributes.display_name}: ${sel.variant_options.display_value || sel.variant_options.value}`)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatNaira(variant.price)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{variant.stock_quantity}</td>
                        <td className="px-4 py-2.5 text-center">
                          {variant.is_active ? (
                            <span className="text-green-600 text-xs">Active</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">Reviews ({reviews.length})</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No reviews yet</p>
            ) : (
              <div className="divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          {review.verified && <span className="text-[10px] text-green-600 font-medium">Verified</span>}
                        </div>
                        <p className="text-sm font-medium">{review.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                        <p className="text-xs text-muted-foreground">{review.author_name} &middot; {formatDate(review.created_at)}</p>
                      </div>
                      <button onClick={() => handleDeleteReview(review.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Delete review">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-medium tabular-nums">{formatNaira(product.base_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span>{product.categories?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Stock</span>
                <span className="tabular-nums">{totalStock}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Variants</span>
                <span className="tabular-nums">{product.product_variants.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Featured</span>
                <span>{product.is_featured ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reviews</span>
                <span className="tabular-nums">{reviews.length}</span>
              </div>
            </div>
          </div>

          {(product.meta_title || product.meta_description) && (
            <div className="border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-medium">SEO</h2>
              {product.meta_title && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Meta Title</p>
                  <p className="text-sm">{product.meta_title}</p>
                </div>
              )}
              {product.meta_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Meta Description</p>
                  <p className="text-sm text-muted-foreground">{product.meta_description}</p>
                </div>
              )}
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-medium">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <a href={`/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 w-full h-9 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> View on Store
          </a>
        </div>
      </div>
    </div>
  );
}
