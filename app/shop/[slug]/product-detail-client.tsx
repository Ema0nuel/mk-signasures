"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Minus, Plus, ShoppingBag, ChevronDown, Truck, RotateCcw, X, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "@/components/product/wishlist-button";
import ProductReviews from "@/components/product/product-reviews";
import { useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import type { ProductDetail } from "@/types/database";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

export default function ProductDetailClient({
  product,
}: {
  product: ProductDetail;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.product_variants?.[0]?.id ?? null
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    product.product_variants?.[0]?.product_variant_selections?.forEach(
      (sel) => {
        const attr = product.variant_attributes?.find((va) =>
          va.variant_options?.some((vo) => vo.id === sel.variant_option_id)
        );
        if (attr) {
          const option = attr.variant_options?.find(
            (vo) => vo.id === sel.variant_option_id
          );
          if (option) {
            initial[attr.name] = option.value;
          }
        }
      }
    );
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Show spinner when switching images
  useEffect(() => {
    setImageLoading(true);
  }, [activeImageIndex]);

  const addItem = useCartStore((s) => s.addItem);
  const { open: openCart } = useCartDrawer();

  const allImages = product.product_images ?? [];
  const variants = product.product_variants ?? [];
  const attributes = product.variant_attributes ?? [];
  const reviews = product.reviews ?? [];

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant?.price ?? product.base_price;
  const comparePrice = selectedVariant?.compare_at_price;
  const stock = selectedVariant?.stock_quantity ?? 0;
  const inStock = stock > 0;

  // Get images relevant to the selected variant
  const variantImages = selectedVariantId
    ? allImages.filter(
        (img) =>
          img.product_variant_id === selectedVariantId ||
          img.product_variant_id === null
      )
    : allImages;
  const displayImages = (variantImages.length > 0 ? variantImages : allImages)
    .slice()
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  // Build variant name from selected options
  const variantName = attributes
    .map((attr) => {
      const val = selectedOptions[attr.name];
      if (!val) return null;
      const opt = attr.variant_options?.find((vo) => vo.value === val);
      return opt?.display_value ?? val;
    })
    .filter(Boolean)
    .join(" / ");

  // Description paragraphs
  const descriptionText = product.description ?? "";
  const isLong = descriptionText.length > 200;
  const displayedDesc =
    isLong && !descExpanded
      ? descriptionText.slice(0, 200) + "..."
      : descriptionText;

  function handleOptionSelect(attrName: string, value: string) {
    const newOptions = { ...selectedOptions, [attrName]: value };
    setSelectedOptions(newOptions);

    const matchingVariant = variants.find((v) => {
      if (!v.is_active) return false;
      return attributes.every((attr) => {
        const selectedVal = newOptions[attr.name];
        if (!selectedVal) return true;
        const option = attr.variant_options?.find(
          (vo) => vo.value === selectedVal
        );
        if (!option) return true;
        return v.product_variant_selections?.some(
          (sel) => sel.variant_option_id === option.id
        );
      });
    });

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  }

  function handleAddToCart() {
    if (!selectedVariantId || !inStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(selectedVariantId);
    }
    openCart();
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div
              className="relative aspect-3/4 overflow-hidden bg-secondary ring-1 ring-foreground/10 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              {displayImages.length > 0 ? (
                <>
                  <ImageWithFallback
                    src={
                      displayImages[activeImageIndex]?.optimized_url ||
                      displayImages[activeImageIndex]?.original_url
                    }
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onLoad={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}

              {comparePrice && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    Sale
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative shrink-0 w-16 h-20 overflow-hidden ring-2 transition-all duration-150 ${
                      idx === activeImageIndex
                        ? "ring-gold"
                        : "ring-foreground/10 hover:ring-foreground/30"
                    }`}
                  >
                    <ImageWithFallback
                      src={img.optimized_url || img.original_url}
                      alt={img.alt_text || product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category + Breadcrumb context */}
            {product.categories && (
              <Link
                href={`/shop?category=${product.categories.slug}`}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors duration-150"
              >
                {product.categories.name}
              </Link>
            )}

            <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-light">
              {product.name}
            </h1>

            {/* Variant name */}
            {variantName && (
              <p className="mt-1 text-sm text-muted-foreground">
                {variantName}
              </p>
            )}

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(avgRating)
                          ? "fill-gold text-gold"
                          : "fill-muted text-muted"
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} ({reviews.length} review
                  {reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-medium">
                {formatPrice(currentPrice)}
              </span>
              {comparePrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(comparePrice)}
                  </span>
                  <Badge className="bg-red-500/10 text-red-500 text-xs font-medium px-2 py-0.5 rounded-full">
                    {Math.round(
                      ((comparePrice - currentPrice) / comparePrice) * 100
                    )}
                    % off
                  </Badge>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="mt-3">
              {inStock ? (
                <span className="text-sm text-green-600">
                  In Stock ({stock} available)
                </span>
              ) : (
                <span className="text-sm text-red-500">Out of Stock</span>
              )}
            </div>

            {/* Variant selectors */}
            {attributes.length > 0 && (
              <div className="mt-8 space-y-5">
                {attributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="text-sm font-medium mb-2.5">
                      {attr.display_name}
                      {selectedOptions[attr.name] && (
                        <span className="text-muted-foreground font-normal ml-1.5">
                          :{" "}
                          {attr.variant_options?.find(
                            (vo) => vo.value === selectedOptions[attr.name]
                          )?.display_value ?? selectedOptions[attr.name]}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attr.variant_options?.map((option) => {
                        const isSelected =
                          selectedOptions[attr.name] === option.value;
                        const isAvailable = variants.some(
                          (v) =>
                            v.is_active &&
                            v.stock_quantity > 0 &&
                            v.product_variant_selections?.some(
                              (sel) => sel.variant_option_id === option.id
                            )
                        );

                        return (
                          <button
                            key={option.id}
                            onClick={() =>
                              handleOptionSelect(attr.name, option.value)
                            }
                            disabled={!isAvailable}
                            className={`px-4 py-2 text-sm border transition-all duration-150 ${
                              isSelected
                                ? "bg-foreground text-background border-foreground"
                                : "bg-background text-foreground border-border hover:border-foreground/30"
                            } ${!isAvailable ? "opacity-30 cursor-not-allowed" : ""}`}
                          >
                            {option.display_value ?? option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SKU */}
            {selectedVariant && (
              <p className="mt-4 text-xs text-muted-foreground">
                SKU: {selectedVariant.sku}
              </p>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="h-11 w-12 flex items-center justify-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                className="sm:flex-1 w-full bg-gold text-black hover:bg-gold-light h-11"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </Button>

              <WishlistButton
                productId={product.id}
                className="h-11 w-11 border border-border"
              />
            </div>

            {/* Description */}
            {descriptionText && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-sm font-medium mb-3">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {displayedDesc}
                </p>
                {isLong && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-2 text-sm font-medium text-foreground hover:text-gold transition-colors duration-150 inline-flex items-center gap-1"
                  >
                    {descExpanded ? "Show less" : "Read more"}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        descExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* Trust signals */}
            <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Free Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    On orders above &#8358;100,000
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">7-Day Returns</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Easy return policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews reviews={reviews} productName={product.name} productId={product.id} />
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && displayImages.length > 0 && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev === 0 ? displayImages.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-4 sm:mx-12"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithFallback
              src={
                displayImages[activeImageIndex]?.optimized_url ||
                displayImages[activeImageIndex]?.original_url
              }
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
              onLoad={() => setImageLoading(false)}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/70" />
              </div>
            )}
          </div>

          {/* Next */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev === displayImages.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  className={`relative w-12 h-14 overflow-hidden ring-2 transition-all duration-150 ${
                    idx === activeImageIndex
                      ? "ring-gold"
                      : "ring-white/30 hover:ring-white/60"
                  }`}
                >
                  <ImageWithFallback
                    src={img.optimized_url || img.original_url}
                    alt={img.alt_text || product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description || product.short_description,
            image: allImages.map(
              (img) => img.optimized_url || img.original_url
            ),
            sku: selectedVariant?.sku,
            brand: { "@type": "Brand", name: "MK Signasures" },
            offers: {
              "@type": "Offer",
              priceCurrency: "NGN",
              price: currentPrice,
              availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `https://mksignasures.shop/shop/${product.slug}`,
            },
            ...(reviews.length > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: avgRating.toFixed(1),
                    reviewCount: reviews.length,
                  },
                }
              : {}),
          }),
        }}
      />
    </>
  );
}
