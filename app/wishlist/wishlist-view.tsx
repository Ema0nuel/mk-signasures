"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { useAuthStore } from "@/stores/auth";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { createClient } from "@/lib/supabase/client";
import type { ProductWithCategory } from "@/types/database";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

export default function WishlistView() {
  const productIds = useWishlistStore((s) => s.productIds);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const { open: openCart } = useCartDrawer();
  const { open: openAuth } = useAuthDialog();
  const [wishlistProducts, setWishlistProducts] = useState<ProductWithCategory[]>([]);

  useEffect(() => {
    if (productIds.length === 0) {
      setWishlistProducts([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("products")
      .select("*, categories(*), product_images(*)")
      .in("id", productIds)
      .eq("status", "active")
      .then(({ data }) => {
        setWishlistProducts((data ?? []) as unknown as ProductWithCategory[]);
      });
  }, [productIds]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Sign in to view your wishlist
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Save your favorite products and access them from any device.
        </p>
        <Button
          className="bg-gold text-black hover:bg-gold-light h-11"
          onClick={openAuth}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Your wishlist is empty
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Browse our collection and save products you love.
        </p>
        <Link href="/shop">
          <Button className="bg-gold text-black hover:bg-gold-light h-11">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  function handleAddToCart(variantId: string) {
    addItem(variantId);
    openCart();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <p className="text-sm text-muted-foreground">
          {wishlistProducts.length} item{wishlistProducts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {wishlistProducts.map((product) => {
          const primaryImage =
            product.product_images?.find((img) => img.is_primary) ??
            product.product_images?.[0];
          const imageUrl =
            primaryImage?.optimized_url || primaryImage?.original_url || null;

          return (
            <div key={product.id} className="group">
              <Link href={`/shop/${product.slug}`} className="block">
                <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-secondary ring-1 ring-foreground/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
              </Link>

              <div className="py-3">
                {product.categories && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {product.categories.name}
                  </p>
                )}
                <h3 className="mt-1 text-sm font-medium group-hover:text-gold transition-colors duration-150 line-clamp-1">
                  <Link href={`/shop/${product.slug}`}>{product.name}</Link>
                </h3>
                <p className="mt-1 text-sm text-foreground font-medium">
                  {formatPrice(product.base_price)}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gold text-black hover:bg-gold-light h-9 text-xs"
                    onClick={() => {
                      // Fetch the first variant for this product
                      const supabase = createClient();
                      supabase
                        .from("product_variants")
                        .select("id")
                        .eq("product_id", product.id)
                        .eq("is_active", true)
                        .limit(1)
                        .single()
                        .then(({ data }) => {
                          if (data) handleAddToCart(data.id);
                        });
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-9 w-9 text-red-400 hover:text-red-500"
                    onClick={() => removeItem(product.id)}
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
