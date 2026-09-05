"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore, type LocalCartItem } from "@/stores/cart";
import type {
  Product,
  ProductImage,
  ProductVariant,
  VariantAttribute,
  VariantOption,
  ProductVariantSelection,
} from "@/types/database";

// ============================================================
// Enriched types for the cart drawer
// ============================================================

export interface CartItemAttributeOption {
  value: string;
  displayValue: string;
  variantId: string;
  inStock: boolean;
}

export interface CartItemAttribute {
  name: string;
  displayName: string;
  options: CartItemAttributeOption[];
}

export interface CartItemWithDetails extends LocalCartItem {
  product: Product;
  variant: ProductVariant;
  image: ProductImage | null;
  /** Human-readable variant name, e.g. "Black / Medium" */
  variantName: string;
  /** Attributes with available options for switching */
  attributes: CartItemAttribute[];
}

// ============================================================
// Hook
// ============================================================

/**
 * Resolves variant IDs into full item details from Supabase.
 * Items render as loading until the server data arrives.
 */
export function useCartItems() {
  const items = useCartStore((s) => s.items);
  const [serverData, setServerData] = useState<
    Record<string, CartItemWithDetails>
  >({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (items.length === 0) {
      setServerData({});
      fetchedRef.current.clear();
      return;
    }

    const unresolvedIds = items
      .filter((i) => !fetchedRef.current.has(i.variantId))
      .map((i) => i.variantId);
    if (unresolvedIds.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        // 1. Fetch variants with product, images, and selections
        const { data: variants, error } = await supabase
          .from("product_variants")
          .select(
            "*, products(*), product_images(*), product_variant_selections(*)"
          )
          .in("id", unresolvedIds);

        unresolvedIds.forEach((id) => fetchedRef.current.add(id));

        if (cancelled || error || !variants || variants.length === 0) return;

        // 2. Collect unique product IDs
        const productIds = [
          ...new Set(
            variants.map((v) => (v.products as unknown as Product).id)
          ),
        ];

        // 3. Fetch variant attributes with their options
        const { data: attributes } = await supabase
          .from("variant_attributes")
          .select("*, variant_options(*)")
          .in("product_id", productIds)
          .order("sort_order");

        if (cancelled) return;

        // Group attributes by product ID
        const attrsByProduct: Record<
          string,
          (VariantAttribute & { variant_options: VariantOption[] })[]
        > = {};
        for (const attr of attributes ?? []) {
          if (!attrsByProduct[attr.product_id]) {
            attrsByProduct[attr.product_id] = [];
          }
          attrsByProduct[attr.product_id].push(attr);
        }

        // 4. Build enriched items
        const enriched: Record<string, CartItemWithDetails> = {};
        for (const variantId of unresolvedIds) {
          const local = items.find((i) => i.variantId === variantId);
          if (!local) continue;
          const variant = variants.find((v) => v.id === variantId);
          if (!variant) continue;

          const product = variant.products as unknown as Product;
          const images = variant.product_images as unknown as ProductImage[];
          const selections = (variant.product_variant_selections ??
            []) as unknown as ProductVariantSelection[];
          const productAttrs = attrsByProduct[product.id] ?? [];
          const allVariants = variants.filter(
            (v) => v.product_id === product.id
          );

          // Build current selections map: { attrName: optionValue }
          const currentSelections: Record<string, string> = {};
          for (const sel of selections) {
            for (const attr of productAttrs) {
              const opt = attr.variant_options.find(
                (o) => o.id === sel.variant_option_id
              );
              if (opt) {
                currentSelections[attr.name] = opt.value;
              }
            }
          }

          // Build human-readable variant name
          const variantName = productAttrs
            .map((attr) => {
              const val = currentSelections[attr.name];
              if (!val) return null;
              const opt = attr.variant_options.find((o) => o.value === val);
              return opt?.display_value ?? val;
            })
            .filter(Boolean)
            .join(" / ");

          // Build available attributes for variant switching
          const availableAttributes: CartItemAttribute[] = productAttrs.map(
            (attr) => ({
              name: attr.name,
              displayName: attr.display_name,
              options: (attr.variant_options ?? [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((opt) => {
                  // Test: swap this attribute's value, keep others
                  const testSelections = {
                    ...currentSelections,
                    [attr.name]: opt.value,
                  };

                  // Find variant matching all test selections
                  const matchingVariant = allVariants.find((v) => {
                    if (!v.is_active) return false;
                    if (
                      (v as unknown as ProductVariant).stock_quantity <= 0
                    )
                      return false;
                    return productAttrs.every((a) => {
                      const testVal = testSelections[a.name];
                      if (!testVal) return true;
                      const testOpt = a.variant_options.find(
                        (o) => o.value === testVal
                      );
                      if (!testOpt) return true;
                      return v.product_variant_selections?.some(
                        (s: ProductVariantSelection) => s.variant_option_id === testOpt.id
                      );
                    });
                  });

                  return {
                    value: opt.value,
                    displayValue: opt.display_value ?? opt.value,
                    variantId: matchingVariant?.id ?? "",
                    inStock: !!matchingVariant,
                  };
                }),
            })
          );

          const primaryImage =
            images?.find((img) => img.is_primary) ?? images?.[0] ?? null;

          enriched[variantId] = {
            ...local,
            product,
            variant: variant as unknown as ProductVariant,
            image: primaryImage,
            variantName,
            attributes: availableAttributes,
          };
        }

        setServerData((prev) => ({ ...prev, ...enriched }));
      } catch {
        // Supabase not available
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const resolvedItems: CartItemWithDetails[] = useMemo(() => {
    return items
      .map((local): CartItemWithDetails | null => {
        const serverItem = serverData[local.variantId];
        if (!serverItem) return null;
        // Use live quantity from store, not stale server data
        return { ...serverItem, quantity: local.quantity };
      })
      .filter(Boolean) as CartItemWithDetails[];
  }, [items, serverData]);

  const isLoading = items.length > 0 && resolvedItems.length < items.length;

  return { items: resolvedItems, isLoading };
}
