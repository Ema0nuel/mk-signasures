import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { ProductWithCategory } from "@/types/database";
import ProductCard from "@/components/product/product-card";

export default function FeaturedSection({
  title,
  subtitle,
  products,
  showStar = false,
}: {
  title: string;
  subtitle: string;
  products: ProductWithCategory[];
  showStar?: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Heading */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
        <div>
          {subtitle && (
            <div className="mb-3 flex items-center gap-2">
              {showStar && (
                <Star className="h-4 w-4 fill-gold text-gold" />
              )}
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {subtitle}
              </p>
            </div>
          )}
          <h2 className="font-heading text-3xl font-light sm:text-4xl">
            {title}
          </h2>
        </div>
        <Link
          href="/shop"
          className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-gold"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover/link:translate-x-0.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
