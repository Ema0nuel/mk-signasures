"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, X, Check } from "lucide-react";
import { useVariantSelectorStore } from "@/stores/variant-selector";
import { useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import type { ProductDetail } from "@/types/database";

/**
 * Inline accordion variant selector.
 *
 * Each attribute is a clickable row. Click to expand and see options.
 * Pick an option and the row collapses, showing the selected value,
 * then the next unpicked attribute expands automatically.
 * Once all attributes are chosen the item is auto-added to cart.
 *
 * Selections are cleared when the panel opens so the user always
 * starts fresh — prevents stale zustand state from auto-adding.
 */
export default function VariantPanel({
  product,
  onClose,
}: {
  product: ProductDetail;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const addedRef = useRef(false);
  const {
    selections,
    setSelectedVariant,
    setSelection,
    resetSelections,
  } = useVariantSelectorStore();
  const addItem = useCartStore((s) => s.addItem);
  const { open: openCart } = useCartDrawer();

  const attributes = product.variant_attributes ?? [];
  const variants = product.product_variants ?? [];
  const currentSelection = selections[product.id];
  const allSelected = attributes.every(
    (attr) => currentSelection?.selections?.[attr.name]
  );

  // Clear stale selections on mount so the user always starts fresh
  useEffect(() => {
    resetSelections(product.id);
    setExpandedIndex(0);
    setUserInteracted(false);
    addedRef.current = false;
  }, [product.id, resetSelections]);

  const doClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const trigger = (target as HTMLElement)?.closest?.(
        `[data-variant-trigger="${product.id}"]`
      );
      if (trigger) return;
      if (ref.current && !ref.current.contains(target)) doClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [product.id, doClose]);

  function findMatchingVariant(sel: Record<string, string>) {
    return (
      variants.find((v) => {
        if (!v.is_active || v.stock_quantity <= 0) return false;
        return attributes.every((attr) => {
          const selectedVal = sel[attr.name];
          if (!selectedVal) return true;
          const option = attr.variant_options?.find(
            (o) => o.value === selectedVal
          );
          if (!option) return true;
          return v.product_variant_selections?.some(
            (s) => s.variant_option_id === option.id
          );
        });
      }) ?? null
    );
  }

  function handleSelectOption(attrName: string, value: string) {
    setUserInteracted(true);
    const newSelections = {
      ...(currentSelection?.selections ?? {}),
      [attrName]: value,
    };
    setSelection(product.id, attrName, value);

    const matching = findMatchingVariant(newSelections);
    if (matching) setSelectedVariant(product.id, matching.id);

    // Collapse this row and expand the next unpicked attribute
    const nextIndex = attributes.findIndex(
      (a) => !newSelections[a.name] && a.name !== attrName
    );
    if (nextIndex !== -1) {
      setExpandedIndex(nextIndex);
    } else {
      setExpandedIndex(null);
    }
  }

  function handleRemoveSelection(attrName: string, e: React.MouseEvent) {
    e.stopPropagation();
    const attrIndex = attributes.findIndex((a) => a.name === attrName);
    for (let i = attrIndex; i < attributes.length; i++) {
      setSelection(product.id, attributes[i].name, "");
    }
    setExpandedIndex(attrIndex);
  }

  // Auto-add to cart ONLY after the user has actually picked options
  // Uses a ref guard to prevent firing twice from React re-renders
  useEffect(() => {
    if (!allSelected || !userInteracted || addedRef.current) return;
    const matching = currentSelection?.selectedVariantId;
    if (!matching) return;
    addedRef.current = true;
    addItem(matching, 1);
    openCart();
    doClose();
  }, [
    allSelected,
    userInteracted,
    currentSelection?.selectedVariantId,
    addItem,
    openCart,
    doClose,
  ]);

  if (attributes.length === 0) return null;

  return (
    <div ref={ref} className="mt-2 w-full border border-border bg-background">
      <div className="p-3 sm:p-4">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Select Options
        </p>

        <div className="flex flex-col gap-1.5">
          {attributes.map((attr, index) => {
            const isExpanded = expandedIndex === index;
            const currentVal = currentSelection?.selections?.[attr.name];
            const currentOption = attr.variant_options?.find(
              (o) => o.value === currentVal
            );
            const hasSelection = !!currentVal;

            return (
              <div key={attr.id} className="flex flex-col">
                {/* Attribute row — div to avoid nested button */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedIndex(isExpanded ? null : index)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedIndex(isExpanded ? null : index);
                    }
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm transition-all duration-200 ${
                    isExpanded
                      ? "bg-secondary"
                      : hasSelection
                        ? "bg-gold/5 hover:bg-secondary"
                        : "hover:bg-secondary"
                  }`}
                >
                  <span className="font-medium text-foreground">
                    {attr.display_name}
                  </span>
                  <span className="flex items-center gap-2">
                    {hasSelection && (
                      <>
                        <span className="text-xs font-medium text-gold">
                          {currentOption?.display_value ?? currentOption?.value}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleRemoveSelection(attr.name, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRemoveSelection(
                                attr.name,
                                e as unknown as React.MouseEvent
                              );
                            }
                          }}
                          className="flex h-4 w-4 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Remove ${attr.display_name} selection`}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </>
                    )}
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </span>
                </div>

                {/* Options — slides open with max-height */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isExpanded ? "300px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="flex flex-wrap gap-2 px-1 py-3">
                    {attr.variant_options?.map((option) => {
                      const isSelected = currentVal === option.value;
                      const isAvailable = variants.some(
                        (v) =>
                          v.is_active &&
                          v.stock_quantity > 0 &&
                          v.product_variant_selections?.some(
                            (s) => s.variant_option_id === option.id
                          )
                      );

                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleSelectOption(attr.name, option.value)
                          }
                          disabled={!isAvailable}
                          className={`inline-flex items-center gap-1.5 border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                            isSelected
                              ? "border-gold bg-gold/10 text-gold"
                              : isAvailable
                                ? "border-border text-foreground hover:border-gold/40"
                                : "cursor-not-allowed border-border/50 text-muted-foreground opacity-40"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {option.display_value ?? option.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
