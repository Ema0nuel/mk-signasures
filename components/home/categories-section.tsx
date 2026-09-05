import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/types/database";

const CATEGORY_BANNERS: Record<string, string> = {
  wigs: "/banner/wig.webp",
  "hair-extensions": "/banner/hair_extension.webp",
  clothing: "/banner/clothing.webp",
  accessories: "/banner/Accessories.webp",
};

export default function CategoriesSection({
  categories,
}: {
  categories: Category[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Heading */}
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Our Collections
        </p>
        <h2 className="font-heading text-3xl font-light sm:text-4xl">
          Shop by Category
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((category) => {
          const bannerSrc =
            category.image_url ?? CATEGORY_BANNERS[category.slug] ?? null;

          return (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-border bg-secondary"
            >
              {bannerSrc ? (
                <Image
                  src={bannerSrc}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 bg-secondary" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
                <div>
                  <h3 className="font-heading text-xl font-light text-white sm:text-2xl">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/70 transition-colors duration-200 group-hover:text-gold sm:text-sm">
                    Explore Collection
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-200 group-hover:border-gold group-hover:bg-gold group-hover:text-black">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
