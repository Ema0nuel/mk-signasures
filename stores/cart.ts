import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/database";

// ============================================================
// Local cart item (for localStorage persistence)
// ============================================================

export interface LocalCartItem {
  variantId: string;
  quantity: number;
  addedAt: number;
}

// ============================================================
// Cart Store
// ============================================================

interface CartState {
  /** Local cart items (persisted in localStorage) */
  items: LocalCartItem[];
  /** Server-side cart ID (set after sync) */
  serverCartId: string | null;
  /** Whether localStorage cart has been synced to server */
  isSynced: boolean;
  /** Loading state for cart operations */
  isLoading: boolean;

  // Actions
  addItem: (variantId: string, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  changeVariant: (oldVariantId: string, newVariantId: string) => void;
  clearCart: () => void;
  setServerCartId: (cartId: string) => void;
  setSynced: (synced: boolean) => void;
  setLoading: (loading: boolean) => void;
  getLocalItems: () => LocalCartItem[];
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serverCartId: null,
      isSynced: false,
      isLoading: false,

      addItem: (variantId, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.variantId === variantId
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.variantId === variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { variantId, quantity, addedAt: Date.now() },
            ],
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        }));
      },

      changeVariant: (oldVariantId, newVariantId) => {
        if (oldVariantId === newVariantId) return;

        set((state) => {
          const oldItem = state.items.find(
            (item) => item.variantId === oldVariantId
          );
          if (!oldItem) return state;

          const existingNewItem = state.items.find(
            (item) => item.variantId === newVariantId
          );

          if (existingNewItem) {
            // Target variant already in cart: merge quantities, remove old
            return {
              items: state.items
                .filter((item) => item.variantId !== oldVariantId)
                .map((item) =>
                  item.variantId === newVariantId
                    ? { ...item, quantity: item.quantity + oldItem.quantity }
                    : item
                ),
            };
          }

          // Swap variantId in place
          return {
            items: state.items.map((item) =>
              item.variantId === oldVariantId
                ? { ...item, variantId: newVariantId }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [], serverCartId: null, isSynced: false });
      },

      setServerCartId: (cartId) => {
        set({ serverCartId: cartId });
      },

      setSynced: (synced) => {
        set({ isSynced: synced });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      getLocalItems: () => get().items,

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: "mk-cart",
      partialize: (state) => ({
        items: state.items,
        serverCartId: state.serverCartId,
        isSynced: state.isSynced,
      }),
    }
  )
);
