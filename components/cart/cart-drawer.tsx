"use client";

import { Minus, Plus, ShoppingBag, X, Trash2, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { useCartStore } from "@/stores/cart";
import { useCartItems, type CartItemWithDetails } from "@/hooks/use-cart-items";

const FREE_DELIVERY_THRESHOLD = 100000;

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

function CartItemRow({ item }: { item: CartItemWithDetails }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const changeVariant = useCartStore((s) => s.changeVariant);

  const lineTotal = item.variant.price * item.quantity;

  function handleOptionChange(attrName: string, newOptionValue: string) {
    const attr = item.attributes.find((a) => a.name === attrName);
    if (!attr) return;
    const opt = attr.options.find((o) => o.value === newOptionValue);
    if (!opt || !opt.variantId || opt.variantId === item.variantId) return;
    changeVariant(item.variantId, opt.variantId);
  }

  return (
    <div className="flex gap-4 py-5">
      {/* Product image */}
      <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-secondary shrink-0">
        {item.image ? (
          <ImageWithFallback
            src={item.image.optimized_url || item.image.original_url}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{item.product.name}</p>
              {item.variantName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.variantName}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.variantId)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Variant option selectors */}
          {item.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.attributes.map((attr) => {
                const currentValue =
                  attr.options.find(
                    (o) => o.variantId === item.variantId
                  )?.value ?? "";
                return (
                  <select
                    key={attr.name}
                    value={currentValue}
                    onChange={(e) =>
                      handleOptionChange(attr.name, e.target.value)
                    }
                    className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground max-w-[120px] truncate cursor-pointer"
                    aria-label={`Change ${attr.displayName}`}
                  >
                    {attr.options.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!opt.inStock}
                      >
                        {opt.displayValue}
                        {!opt.inStock ? " (unavailable)" : ""}
                      </option>
                    ))}
                  </select>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Line total */}
          <p className="text-sm font-semibold">{formatPrice(lineTotal)}</p>
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-20 h-24 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { items, isLoading } = useCartItems();

  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );
  const freeDeliveryDiff = FREE_DELIVERY_THRESHOLD - subtotal;
  const qualifiesForFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" showCloseButton={false} className="p-0 flex flex-col max-sm:inset-0! max-sm:w-full! max-sm:h-full! sm:inset-y-0 sm:right-0 sm:h-full sm:w-105">
        {/* Header with prominent close button */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <button
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-muted"
            aria-label="Close cart"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <SheetTitle className="font-heading text-lg font-light flex items-center gap-2">
            Shopping Bag
            {itemCount > 0 && (
              <span className="text-sm text-muted-foreground font-sans font-normal">
                ({itemCount})
              </span>
            )}
          </SheetTitle>
          <button
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-muted"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free delivery progress */}
        {itemCount > 0 && (
          <div className="px-6 py-3 border-b border-border">
            {qualifiesForFreeDelivery ? (
              <p className="text-sm text-green-600 font-medium">
                You qualify for free delivery
              </p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Add{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(freeDeliveryDiff)}
                  </span>{" "}
                  more for free delivery
                </p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 overscroll-contain">
          {isLoading ? (
            <CartSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-6" />
              <p className="text-base font-medium text-muted-foreground mb-2">
                Your bag is empty
              </p>
              <p className="text-sm text-muted-foreground/70 mb-6">
                Add items to start shopping
              </p>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary h-11"
                onClick={close}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-base font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Shipping</span>
                <span className="text-sm text-muted-foreground">
                  {qualifiesForFreeDelivery
                    ? "Free"
                    : "Calculated at checkout"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="w-full h-12 inline-flex items-center justify-center bg-gold text-black hover:bg-gold-light font-semibold text-sm rounded-xl transition-colors"
            >
              Checkout
            </Link>
            <button
              onClick={close}
              className="w-full text-center text-sm text-muted-foreground hover:text-gold transition-colors duration-150 py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
