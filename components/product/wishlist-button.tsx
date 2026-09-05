"use client";

import { useState, useCallback, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist";
import { useAuthStore } from "@/stores/auth";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Wishlist button with optimistic updates.
 * - Instantly toggles the heart icon on click.
 * - On network failure, rolls back to previous state.
 * - Persists via Zustand + localStorage.
 */
export default function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasItem = useWishlistStore((s) => s.hasItem);
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const user = useAuthStore((s) => s.user);
  const { open: openAuth } = useAuthDialog();
  const isInWishlist = mounted && hasItem(productId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        openAuth();
        return;
      }

      // Optimistic update
      setAnimating(true);
      const wasInWishlist = isInWishlist;

      if (wasInWishlist) {
        removeItem(productId);
      } else {
        addItem(productId);
      }

      setTimeout(() => setAnimating(false), 300);

      // Persist to server in background
      try {
        const supabase = createClient();
        if (wasInWishlist) {
          // Remove from server wishlist
          await supabase
            .from("wishlist_items")
            .delete()
            .eq("product_id", productId);
        } else {
          // Add to server wishlist
          const { data: wishlist } = await supabase
            .from("wishlists")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (wishlist) {
            await supabase.from("wishlist_items").insert({
              wishlist_id: wishlist.id,
              product_id: productId,
            });
          }
        }
      } catch {
        // Rollback on failure
        if (wasInWishlist) {
          addItem(productId);
        } else {
          removeItem(productId);
        }
      }
    },
    [productId, user, isInWishlist, addItem, removeItem, openAuth]
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 rounded-full text-foreground hover:text-gold",
        className
      )}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleToggle}
    >
      <Heart
        className={cn(
          "h-[18px] w-[18px] transition-all duration-200",
          isInWishlist && "fill-gold text-gold",
          animating && "scale-125"
        )}
      />
    </Button>
  );
}
