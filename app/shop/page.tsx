import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getNewArrivals,
  getTrendingProducts,
  getProductsByCategory,
  searchProducts,
} from "@/lib/data/products";
import ProductCard from "@/components/product/product-card";
import SortBar from "@/components/shop/sort-bar";
import ShopSearch from "@/components/shop/shop-search";
import type { ProductWithCategory } from "@/types/database";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our collection of premium wigs, hair extensions, clothing, and accessories. Free delivery on orders above N100,000.",
  openGraph: {
    title: "Shop | MK Signasures",
    description:
      "Premium wigs, hair extensions, clothing, and accessories.",
    url: "https://mksignasures.shop/shop",
  },
  alternates: {
    canonical: "https://mksignasures.shop/shop",
  },
};

const CATEGORY_NAV = [
  { slug: "wigs", label: "Wigs" },
  { slug: "hair-extensions", label: "Hair" },
  { slug: "clothing", label: "Clothing" },
  { slug: "accessories", label: "Accessories" },
];

function sortProducts(
  products: ProductWithCategory[],
  sort: string
): ProductWithCategory[] {
  const sorted = [...products];
  switch (sort) {
    case "price-low":
      return sorted.sort((a, b) => a.base_price - b.base_price);
    case "price-high":
      return sorted.sort((a, b) => b.base_price - a.base_price);
    case "trending":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

async function ShopContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const query = typeof params.q === "string" ? params.q : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const isNew = params.new === "true";

  let products: ProductWithCategory[] = [];
  let pageTitle = "All Products";
  let pageDescription = "Browse our full collection of premium products.";

  if (query) {
    products = await searchProducts(query);
    pageTitle = `Results for "${query}"`;
    pageDescription = `${products.length} products found.`;
  } else if (isNew) {
    products = await getNewArrivals();
    pageTitle = "New Arrivals";
    pageDescription = "The latest additions to our collection.";
  } else if (category) {
    products = await getProductsByCategory(category);
    const cat = CATEGORY_NAV.find((c) => c.slug === category);
    pageTitle = cat?.label ?? category;
    pageDescription = `Shop our ${pageTitle} collection.`;
  } else {
    const [newArrivals, trending] = await Promise.all([
      getNewArrivals(),
      getTrendingProducts(),
    ]);
    // Deduplicate by id
    const allIds = new Set<string>();
    products = [];
    for (const p of [...newArrivals, ...trending]) {
      if (!allIds.has(p.id)) {
        allIds.add(p.id);
        products.push(p);
      }
    }
  }

  const sorted = sortProducts(products, sort);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center relative">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            {pageTitle}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            {pageDescription}
          </p>
          <div className="mt-6 flex justify-center relative">
            <ShopSearch />
          </div>
        </div>
      </div>

      {/* Category quick nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/shop"
            className={`shrink-0 px-5 py-2.5 text-sm font-medium transition-colors duration-150 border ${
              !category && !isNew && !query
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            All
          </Link>
          {CATEGORY_NAV.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className={`shrink-0 px-5 py-2.5 text-sm font-medium transition-colors duration-150 border ${
                category === cat.slug
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {cat.label}
            </Link>
          ))}
          <Link
            href="/shop?new=true"
            className={`shrink-0 px-5 py-2.5 text-sm font-medium transition-colors duration-150 border ${
              isNew
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            New Arrivals
          </Link>
        </div>
      </div>

      {/* Sort bar */}
      <SortBar count={sorted.length} currentSort={sort} />

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {sorted.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
              No products found
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {query
                ? `No results for "${query}". Try a different search.`
                : "This collection is being curated. Check back soon."}
            </p>
            <Link
              href="/shop"
              className="text-sm font-medium text-gold hover:text-gold-dark transition-colors duration-150"
            >
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}
