"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useVariantSelectorStore } from "@/stores/variant-selector";
import type { ProductDetail } from "@/types/database";

export default function VariantDropdown({
  product,
}: {
  product: ProductDetail;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    openDropdowns,
    drillLevels,
    selections,
    closeDropdown,
    setDrillLevel,
    setSelectedVariant,
    setSelection,
  } = useVariantSelectorStore();

  const isOpen = openDropdowns[product.id] ?? false;
  const currentLevel = drillLevels[product.id] ?? "root";
  const currentSelection = selections[product.id];

  const attributes = product.variant_attributes ?? [];
  const variants = product.product_variants ?? [];

  // Close on outside click, ignoring clicks on the trigger button itself
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const trigger = (e.target as HTMLElement)?.closest?.(
        `[data-variant-trigger="${product.id}"]`
      );
      if (trigger) return;
      if (ref.current && !ref.current.contains(target)) {
        closeDropdown(product.id);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, product.id, closeDropdown]);

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

  function handleOptionSelect(attrName: string, value: string) {
    const newSelections = {
      ...(currentSelection?.selections ?? {}),
      [attrName]: value,
    };
    setSelection(product.id, attrName, value);

    const matching = findMatchingVariant(newSelections);
    if (matching) {
      setSelectedVariant(product.id, matching.id);
    }

    // If every attribute has a value, a full variant is resolved: close.
    // Otherwise keep the panel open so the user can pick the remaining
    // attributes (e.g. Length then Density).
    const allPicked = attributes.every((attr) => newSelections[attr.name]);

    if (allPicked) {
      setDrillLevel(product.id, "root");
      closeDropdown(product.id);
    } else {
      // Move to the next attribute that still needs a choice.
      const nextAttr = attributes.find((a) => !newSelections[a.name]);
      if (nextAttr) {
        setDrillLevel(product.id, nextAttr.name);
      }
    }
  }

  if (!isOpen) return null;

  const isRoot = currentLevel === "root";
  const activeAttr = isRoot
    ? null
    : attributes.find((a) => a.name === currentLevel);

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {isRoot ? "Select Options" : activeAttr?.display_name}
        </p>
        {!isRoot && (
          <button
            onClick={() => setDrillLevel(product.id, "root")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto p-1.5">
        {isRoot ? (
          <div className="flex flex-col gap-0.5">
            {attributes.map((attr) => {
              const currentVal = currentSelection?.selections?.[attr.name];
              const currentOption = attr.variant_options?.find(
                (o) => o.value === currentVal
              );
              return (
                <button
                  key={attr.id}
                  onClick={() => setDrillLevel(product.id, attr.name)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted"
                >
                  <span className="font-medium text-foreground">
                    {attr.display_name}
                  </span>
                  <span className="flex items-center gap-2">
                    {currentOption && (
                      <span className="text-xs font-medium text-gold">
                        {currentOption.display_value ?? currentOption.value}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {activeAttr?.variant_options?.map((option) => {
              const isSelected =
                currentSelection?.selections?.[activeAttr.name] ===
                option.value;
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
                    handleOptionSelect(activeAttr.name, option.value)
                  }
                  disabled={!isAvailable}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isSelected
                      ? "bg-gold/10 font-medium text-gold"
                      : isAvailable
                        ? "text-foreground hover:bg-muted"
                        : "cursor-not-allowed text-muted-foreground opacity-40"
                  }`}
                >
                  <span>{option.display_value ?? option.value}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
