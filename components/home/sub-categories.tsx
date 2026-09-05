"use client";

import Link from "next/link";
import { Sparkles, Star, ArrowRight } from "lucide-react";

export default function SubCategories() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <Link
          href="/shop?new=true"
          className="group inline-flex items-center gap-2 border border-border bg-background px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-150 hover:border-gold/40 hover:text-gold"
        >
          <Sparkles className="h-4 w-4" />
          New Arrivals
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/shop?sort=trending"
          className="group inline-flex items-center gap-2 border border-border bg-background px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-150 hover:border-gold/40 hover:text-gold"
        >
          <Star className="h-4 w-4" />
          Recommended
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
