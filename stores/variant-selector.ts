import { create } from "zustand";

// ============================================================
// Variant Selector Store
// Manages the multi-level dropdown state for product cards.
// Each product card can have its own dropdown open/close state.
// ============================================================

export interface VariantSelection {
  /** Currently selected variant ID */
  selectedVariantId: string | null;
  /** Attribute selections: { attributeName: optionValue } */
  selections: Record<string, string>;
}

interface VariantSelectorState {
  /** Map of productId -> open state */
  openDropdowns: Record<string, boolean>;
  /** Map of productId -> current drill-down level */
  drillLevels: Record<string, "root" | string>;
  /** Map of productId -> variant selection */
  selections: Record<string, VariantSelection>;

  // Actions
  toggleDropdown: (productId: string) => void;
  openDropdown: (productId: string) => void;
  closeDropdown: (productId: string) => void;
  closeAllDropdowns: () => void;
  setDrillLevel: (productId: string, level: "root" | string) => void;
  setSelectedVariant: (productId: string, variantId: string) => void;
  setSelection: (
    productId: string,
    attributeName: string,
    value: string
  ) => void;
  resetSelections: (productId: string) => void;
}

export const useVariantSelectorStore = create<VariantSelectorState>()(
  (set, get) => ({
    openDropdowns: {},
    drillLevels: {},
    selections: {},

    toggleDropdown: (productId) => {
      set((state) => ({
        openDropdowns: {
          ...state.openDropdowns,
          [productId]: !state.openDropdowns[productId],
        },
        drillLevels: {
          ...state.drillLevels,
          [productId]: "root",
        },
      }));
    },

    openDropdown: (productId) => {
      set((state) => ({
        openDropdowns: {
          ...state.openDropdowns,
          [productId]: true,
        },
        drillLevels: {
          ...state.drillLevels,
          [productId]: "root",
        },
      }));
    },

    closeDropdown: (productId) => {
      set((state) => ({
        openDropdowns: {
          ...state.openDropdowns,
          [productId]: false,
        },
        drillLevels: {
          ...state.drillLevels,
          [productId]: "root",
        },
      }));
    },

    closeAllDropdowns: () => {
      set({ openDropdowns: {}, drillLevels: {} });
    },

    setDrillLevel: (productId, level) => {
      set((state) => ({
        drillLevels: {
          ...state.drillLevels,
          [productId]: level,
        },
      }));
    },

    setSelectedVariant: (productId, variantId) => {
      set((state) => ({
        selections: {
          ...state.selections,
          [productId]: {
            ...(state.selections[productId] ?? {
              selectedVariantId: null,
              selections: {},
            }),
            selectedVariantId: variantId,
          },
        },
      }));
    },

    setSelection: (productId, attributeName, value) => {
      set((state) => {
        const current = state.selections[productId] ?? {
          selectedVariantId: null,
          selections: {},
        };
        return {
          selections: {
            ...state.selections,
            [productId]: {
              ...current,
              selections: {
                ...current.selections,
                [attributeName]: value,
              },
            },
          },
        };
      });
    },

    resetSelections: (productId) => {
      set((state) => {
        const { [productId]: _, ...rest } = state.selections;
        const { [productId]: __, ...restLevels } = state.drillLevels;
        const { [productId]: ___, ...restOpen } = state.openDropdowns;
        return {
          selections: rest,
          drillLevels: restLevels,
          openDropdowns: restOpen,
        };
      });
    },
  })
);
