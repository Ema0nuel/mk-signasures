"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProductWithCategory } from "@/types/database";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ShopSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const q = searchQuery.trim();

    const [byNameDesc, byCategory, allProducts] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(*), product_images(*)")
        .eq("status", "active")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("products")
        .select("*, categories!inner(*), product_images(*)")
        .eq("status", "active")
        .ilike("categories.name", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("products")
        .select("*, categories(*), product_images(*)")
        .eq("status", "active")
        .limit(50),
    ]);

    const qLower = q.toLowerCase();
    const byTags = (allProducts.data ?? []).filter((p: ProductWithCategory) =>
      p.tags?.some((t) => t.toLowerCase().includes(qLower))
    );

    if (byNameDesc.data || byCategory.data || byTags.length) {
      const merged = new Map<string, ProductWithCategory>();
      for (const p of [
        ...((byNameDesc.data ?? []) as unknown as ProductWithCategory[]),
        ...((byCategory.data ?? []) as unknown as ProductWithCategory[]),
        ...byTags,
      ]) {
        if (!merged.has(p.id)) merged.set(p.id, p);
      }
      setResults(Array.from(merged.values()).slice(0, 8));
      setOpen(true);
    } else {
      setResults([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    searchProducts(debouncedQuery);
  }, [debouncedQuery, searchProducts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  const showDropdown = open && (query.trim().length > 0);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          placeholder="Search..."
          className="h-9 sm:h-10 w-full rounded-lg border border-border bg-background pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-60 sm:max-h-100 overflow-y-auto">
                {results.map((product) => {
                  const primaryImage =
                    product.product_images?.find((img) => img.is_primary) ??
                    product.product_images?.[0];
                  const imageUrl =
                    primaryImage?.optimized_url ||
                    primaryImage?.original_url ||
                    null;

                  return (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors hover:bg-secondary"
                    >
                      <div className="relative h-9 w-9 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {imageUrl ? (
                          <ImageWithFallback
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {product.categories?.name}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground shrink-0">
                        {formatPrice(product.base_price)}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium text-gold hover:bg-secondary transition-colors"
                >
                  View all results for &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 sm:px-4 py-6 sm:py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No products match &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching by name, tag, or category
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
