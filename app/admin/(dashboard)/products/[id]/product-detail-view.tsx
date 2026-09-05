"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ExternalLink,
  Star,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { getProductById, deleteReview } from "@/app/admin/actions/data";
import { Button } from "@/components/ui/button";
import type { ProductReview } from "@/types/database";

function ImageCarousel({ images }: { images: { src: string; alt: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    timerRef.current = setInterval(next, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, images.length]);

  // Touch/swipe support
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
    setPaused(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  }

  function handleTouchEnd() {
    if (Math.abs(touchDelta.current) > 50) {
      if (touchDelta.current > 0) prev();
      else next();
    }
    touchStart.current = null;
    setPaused(false);
  }

  return (
    <div className="w-full max-w-md">
      <div
        className="relative aspect-square border border-border bg-muted overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pause/Play button */}
        <button
          onClick={() => setPaused(!paused)}
          className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i);
              setPaused(true);
            }}
            className={`w-2 h-2 transition-colors ${
              i === current ? "bg-gold" : "bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type ImageData = {
  optimized_url: string | null;
  original_url: string;
  is_primary: boolean;
  alt_text: string | null;
  sort_order: number;
  processing_status: string;
};

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
  compare_at_price: number | null;
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
  tags: string[] | null;
  created_at: string;
  categories: { name: string } | null;
  product_images: ImageData[];
  product_variants: Variant[];
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
        <Link
          href="/admin/products"
          className="text-sm text-gold hover:underline mt-2 inline-block"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const totalStock = product.product_variants.reduce(
    (sum, v) => sum + v.stock_quantity,
    0
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Products
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-light">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {product.slug} &middot; Created {formatDate(product.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-medium ${statusColors[product.status] ?? ""}`}
          >
            {product.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="border border-border bg-card p-5">
            <h2 className="text-sm font-medium mb-4">
              Images ({product.product_images.length})
            </h2>
            {product.product_images.length === 0 ? (
              <div className="w-full max-w-md aspect-square border border-border bg-muted flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
            ) : product.product_images.length === 1 ? (
              <div className="w-full max-w-md aspect-square border border-border bg-muted overflow-hidden">
                <img
                  src={product.product_images[0].optimized_url || product.product_images[0].original_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <ImageCarousel
                images={product.product_images
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((img) => ({
                    src: img.optimized_url || img.original_url,
                    alt: img.alt_text || product.name,
                  }))}
              />
            )}
          </div>

          {/* Description */}
          <div className="border border-border bg-card p-5">
            <h2 className="text-sm font-medium mb-3">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description ||
                product.short_description ||
                "No description"}
            </p>
          </div>

          {/* Variants */}
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">
                Variants ({product.product_variants.length})
              </h2>
            </div>
            {product.product_variants.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                No variants
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                          SKU
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                          Options
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          Price
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          Stock
                        </th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                          Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {product.product_variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2.5 font-mono text-xs">
                            {variant.sku}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {variant.product_variant_selections
                              .map(
                                (sel) =>
                                  `${sel.variant_options.variant_attributes.display_name}: ${sel.variant_options.display_value || sel.variant_options.value}`
                              )
                              .join(", ") || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {formatNaira(variant.price)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {variant.stock_quantity}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {variant.is_active ? (
                              <span className="text-green-600 text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Inactive
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {product.product_variants.map((variant) => (
                    <div key={variant.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium">
                          {variant.sku}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 font-medium ${
                            variant.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {variant.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {variant.product_variant_selections.map((sel) => (
                          <span key={sel.id}>
                            {sel.variant_options.variant_attributes.display_name}:{" "}
                            {sel.variant_options.display_value ||
                              sel.variant_options.value}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-medium tabular-nums">
                          {formatNaira(variant.price)}
                        </span>
                        {variant.compare_at_price && (
                          <span className="text-muted-foreground line-through tabular-nums">
                            {formatNaira(variant.compare_at_price)}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Stock: {variant.stock_quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium">
                Reviews ({reviews.length})
              </h2>
            </div>
            {reviews.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                No reviews yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? "fill-gold text-gold"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          {review.verified && (
                            <span className="text-[10px] text-green-600 font-medium">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{review.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.body}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.author_name} &middot;{" "}
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-medium tabular-nums">
                  {formatNaira(product.base_price)}
                </span>
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
                <span className="tabular-nums">
                  {product.product_variants.length}
                </span>
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

          {product.tags && product.tags.length > 0 && (
            <div className="border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-medium">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/admin/products/${productId}/edit`}
            className="flex items-center justify-center gap-1.5 w-full h-9 bg-primary text-primary-foreground text-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Product
          </Link>

          <a
            href={`/shop/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full h-9 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View on Store
          </a>
        </div>
      </div>
    </div>
  );
}
