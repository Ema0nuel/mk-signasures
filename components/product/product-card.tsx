"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, SlidersHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "./wishlist-button";
import VariantPanel from "./variant-panel";
import { useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { createClient } from "@/lib/supabase/client";
import type { ProductWithCategory, ProductDetail } from "@/types/database";
import { useVariantSelectorStore } from "@/stores/variant-selector";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default function ProductCard({
  product,
}: {
  product: ProductWithCategory;
}) {
  const [added, setAdded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { open: openCart } = useCartDrawer();
  const { selections } = useVariantSelectorStore();
  const [sampleDetail, setSampleDetail] = useState<ProductDetail | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("*, categories(*), product_images(*), variant_attributes(*, variant_options(*)), product_variants(*, product_variant_selections(*))")
      .eq("id", product.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSampleDetail(data as unknown as ProductDetail);
      });
  }, [product.id]);

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];

  const imageUrl =
    primaryImage?.optimized_url || primaryImage?.original_url || null;

  const variants = sampleDetail?.product_variants ?? [];
  const attributes = sampleDetail?.variant_attributes ?? [];
  const hasVariants = variants.length > 1 && attributes.length > 0;

  const outOfStock =
    product.status === "out_of_stock" ||
    variants.length === 0 ||
    variants.every((v) => !v.is_active || v.stock_quantity <= 0);

  const currentSelection = selections[product.id];
  const selectedVariantId =
    currentSelection?.selectedVariantId ?? variants[0]?.id;
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product.base_price;
  const compareAtPrice = selectedVariant?.compare_at_price ?? null;

  const closePanel = useCallback(() => setPanelOpen(false), []);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (hasVariants) {
      setPanelOpen((prev) => !prev);
      return;
    }
    const variantId = variants[0]?.id;
    if (!variantId) return;
    addItem(variantId);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group/card relative flex flex-col">
      {/* Image — clickable */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-3/4 w-full overflow-hidden rounded-2xl bg-secondary"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.is_featured && (
            <Badge className="bg-gold text-black uppercase tracking-wider">
              Featured
            </Badge>
          )}
          {compareAtPrice && (
            <Badge className="bg-foreground text-background uppercase tracking-wider">
              Sale
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton
            productId={product.id}
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          />
        </div>

        {/* Quick-add bar — hover only (fine pointer = desktop) */}
        <div className="absolute inset-x-3 bottom-3 z-20 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 pointer-fine:block">
          <Button
            size="lg"
            data-variant-trigger={hasVariants ? product.id : undefined}
            disabled={outOfStock}
            className={`h-11 w-full rounded-xl text-sm font-semibold shadow-lg ${
              outOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : added
                ? "bg-foreground text-background hover:bg-foreground"
                : "bg-gold text-black hover:bg-gold-light"
            }`}
            onClick={handleQuickAdd}
          >
            {outOfStock ? (
              "Out of Stock"
            ) : added ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Added
              </>
            ) : hasVariants ? (
              <>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Choose Options
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </Link>

      {/* Mobile-only action button (no hover on touch) */}
      <div className="pointer-coarse:mt-3 pointer-coarse:block hidden">
        <Button
          size="lg"
          data-variant-trigger={hasVariants ? product.id : undefined}
          disabled={outOfStock}
          className={`h-11 w-full rounded-xl text-sm font-semibold ${
            outOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : added
              ? "bg-foreground text-background hover:bg-foreground"
              : "bg-gold text-black hover:bg-gold-light"
          }`}
          onClick={handleQuickAdd}
        >
          {outOfStock ? (
            "Out of Stock"
          ) : added ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added
            </>
          ) : hasVariants ? (
            <>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Choose Options
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>

      {/* Variant panel — inline accordion below the button */}
      {hasVariants && sampleDetail && panelOpen && (
        <VariantPanel product={sampleDetail} onClose={closePanel} />
      )}

      {/* Info — clickable */}
      <Link href={`/shop/${product.slug}`} className="mt-4 flex flex-col gap-0.5 px-0.5">
        {product.categories?.name && (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground line-clamp-1">
            {product.categories.name}
          </p>
        )}
        <h3
          className="mt-1 text-[15px] leading-snug font-semibold text-foreground line-clamp-2 transition-colors duration-150 group-hover/card:text-gold"
          title={product.name}
        >
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(displayPrice)}
          </span>
          {compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
