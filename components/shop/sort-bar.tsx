"use client";

import { Suspense } from "react";
import SortDropdown from "@/components/shop/sort-dropdown";

function SortBarInner({ count, currentSort }: { count: number; currentSort: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {count} product{count !== 1 ? "s" : ""}
        </p>
        <SortDropdown currentSort={currentSort} />
      </div>
    </div>
  );
}

export default function SortBar({ count, currentSort }: { count: number; currentSort: string }) {
  return (
    <Suspense fallback={null}>
      <SortBarInner count={count} currentSort={currentSort} />
    </Suspense>
  );
}
