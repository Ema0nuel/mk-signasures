import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { ArrowRight } from "lucide-react";

export default function BrandStory() {
  return (
    <section className="bg-secondary py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
        {/* Copy */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Our Story
          </p>
          <h2 className="font-heading text-2xl font-light leading-snug sm:text-3xl md:text-4xl">
            Effortless Style, Lasting Quality
          </h2>
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
            MK Signasures was built for anyone who wants luxury without the
            markup. We source the finest wigs, hair, and clothing so you look
            and feel your best, every single day.
          </p>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every piece in our collection is selected for quality, comfort,
            and style. No middlemen, no compromises.
          </p>
          <Link
            href="/about"
            className="group/link mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
          >
            Discover More
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover/link:translate-x-0.5" />
          </Link>
        </div>

        {/* Visual */}
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
          <ImageWithFallback
            src="/banner/our_story.webp"
            alt="MK Signasures story"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
