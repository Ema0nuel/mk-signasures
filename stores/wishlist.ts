import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem } from "@/types/database";

// ============================================================
// Wishlist Store
// ============================================================

interface WishlistState {
  /** Product IDs in the wishlist (optimistic local state) */
  productIds: string[];
  /** Server wishlist ID */
  wishlistId: string | null;
  /** Loading state */
  isLoading: boolean;

  // Actions
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
  setWishlistId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      wishlistId: null,
      isLoading: false,

      addItem: (productId) => {
        set((state) => {
          if (state.productIds.includes(productId)) return state;
          return { productIds: [...state.productIds, productId] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },

      toggleItem: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          get().removeItem(productId);
        } else {
          get().addItem(productId);
        }
      },

      hasItem: (productId) => {
        return get().productIds.includes(productId);
      },

      clearWishlist: () => {
        set({ productIds: [], wishlistId: null });
      },

      setWishlistId: (id) => {
        set({ wishlistId: id });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      getItemCount: () => get().productIds.length,
    }),
    {
      name: "mk-wishlist",
      partialize: (state) => ({
        productIds: state.productIds,
        wishlistId: state.wishlistId,
      }),
    }
  )
);
