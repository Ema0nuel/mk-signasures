"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const banners = [
  {
    src: "/banner/banner-1.webp",
    alt: "MK Signasures - Premium Wigs, Hair & Clothing",
  },
  {
    src: "/banner/banner-2.webp",
    alt: "MK Signasures - New Season Collection",
  },
  {
    src: "/banner/banner-3.webp",
    alt: "MK Signasures - Luxury Hair Extensions",
  },
  {
    src: "/banner/banner-4.webp",
    alt: "MK Signasures - Curated Fashion",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDotClick = (index: number) => {
    goTo(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-black sm:min-h-[80vh]">
      {/* Banner slides */}
      <div className="absolute inset-0">
        {banners.map((banner, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: index === current ? 1 : 0 }}
          >
            <ImageWithFallback
              src={banner.src}
              alt={banner.alt}
              fill
              priority={index === 0}
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Backdrop overlays */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">
            New Season Essentials
          </p>
          <h1 className="font-heading text-4xl font-light leading-tight text-white sm:text-6xl">
            Effortless Style,
            <br />
            Lasting Quality
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Luxury wigs, premium hair, and curated clothing. Quality you can
            feel, prices that respect you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="h-12 inline-flex items-center justify-center bg-gold px-8 text-sm font-semibold text-black hover:bg-gold-light transition-colors rounded-lg"
            >
              Shop Now
            </Link>
            <Link
              href="/shop?new=true"
              className="h-12 inline-flex items-center justify-center border border-white/30 bg-transparent px-8 text-sm font-semibold text-white hover:bg-white hover:text-black transition-colors rounded-lg"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === index
                ? "w-8 bg-gold"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
