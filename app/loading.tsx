import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero skeleton */}
      <div className="relative min-h-[70vh] animate-pulse bg-muted sm:min-h-[80vh]" />

      {/* Ticker skeleton */}
      <div className="h-10 w-full bg-black" />

      {/* Categories skeleton */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex flex-col items-center gap-3 sm:mb-14">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-3/4 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* New arrivals skeleton */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex items-end justify-between sm:mb-14">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="hidden h-4 w-16 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Recommended skeleton */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex items-end justify-between sm:mb-14">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="hidden h-4 w-16 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Brand story skeleton */}
      <section className="bg-secondary py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
          <Skeleton className="aspect-square rounded-2xl" />
        </div>
      </section>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-3/4 rounded-2xl" />
      <Skeleton className="mt-4 h-3 w-16" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-20" />
    </div>
  );
}
