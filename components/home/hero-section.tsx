"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import Link from "next/link";
import type {
  HeroBannerWithSlides,
  HeroSlideWithCtas,
  SiteAnnouncement,
} from "@/types/database";

// Hardcoded fallback when no banner is active in the database
const FALLBACK_SLIDES: HeroSlideWithCtas[] = [
  {
    id: "fallback-1",
    banner_id: "fallback",
    media_type: "photo",
    image_url: "/banner/banner-1.webp",
    video_url: null,
    headline: "Effortless Style,\nLasting Quality",
    subtext:
      "Luxury wigs, premium hair, and curated clothing. Quality you can feel, prices that respect you.",
    sort_order: 0,
    created_at: "",
    updated_at: "",
    hero_slide_ctas: [
      {
        id: "fallback-cta-1",
        slide_id: "fallback-1",
        label: "Shop Now",
        href: "/shop",
        variant: "primary",
        sort_order: 0,
        created_at: "",
      },
      {
        id: "fallback-cta-2",
        slide_id: "fallback-1",
        label: "New Arrivals",
        href: "/shop?new=true",
        variant: "secondary",
        sort_order: 1,
        created_at: "",
      },
    ],
  },
  {
    id: "fallback-2",
    banner_id: "fallback",
    media_type: "photo",
    image_url: "/banner/banner-2.webp",
    video_url: null,
    headline: "New Season Collection",
    subtext: "Discover the latest trends in premium wigs and fashion.",
    sort_order: 1,
    created_at: "",
    updated_at: "",
    hero_slide_ctas: [
      {
        id: "fallback-cta-3",
        slide_id: "fallback-2",
        label: "Shop Now",
        href: "/shop",
        variant: "primary",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
  {
    id: "fallback-3",
    banner_id: "fallback",
    media_type: "photo",
    image_url: "/banner/banner-3.webp",
    video_url: null,
    headline: "Luxury Hair Extensions",
    subtext: "Premium quality, natural look. Transform your style.",
    sort_order: 2,
    created_at: "",
    updated_at: "",
    hero_slide_ctas: [
      {
        id: "fallback-cta-4",
        slide_id: "fallback-3",
        label: "Explore",
        href: "/shop?category=hair-extensions",
        variant: "primary",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
  {
    id: "fallback-4",
    banner_id: "fallback",
    media_type: "photo",
    image_url: "/banner/banner-4.webp",
    video_url: null,
    headline: "Curated Fashion",
    subtext: "Handpicked pieces for the modern woman.",
    sort_order: 3,
    created_at: "",
    updated_at: "",
    hero_slide_ctas: [
      {
        id: "fallback-cta-5",
        slide_id: "fallback-4",
        label: "Shop Now",
        href: "/shop",
        variant: "primary",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
];

interface HeroSectionProps {
  banner?: HeroBannerWithSlides | null;
  announcement?: SiteAnnouncement | null;
}

export default function HeroSection({
  banner,
  announcement,
}: HeroSectionProps) {
  const slides =
    banner?.hero_slides?.length && banner.hero_slides.length > 0
      ? banner.hero_slides
      : FALLBACK_SLIDES;

  const transition = banner?.transition ?? "fade";
  const autoplayMs = banner?.autoplay_ms ?? 5000;
  const consistentText = banner?.consistent_text ?? false;

  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoplayMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoplayMs, slides.length]);

  // Play/pause video on slide change
  useEffect(() => {
    const activeSlide = slides[current];
    if (activeSlide?.video_url && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [current, slides]);

  const handleDotClick = (index: number) => {
    goTo(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoplayMs);
  };

  // Transition classes
  const getTransitionClass = () => {
    switch (transition) {
      case "smooth":
        return "transition-opacity duration-1000 ease-in-out";
      case "fade":
        return "transition-opacity duration-700 ease-in-out";
      case "static":
        return "transition-none";
      default:
        return "transition-opacity duration-700 ease-in-out";
    }
  };

  // Split headline on \n for line breaks
  const renderHeadline = (text: string) =>
    text.split("\n").map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {line}
      </span>
    ));

  return (
    <>
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-black sm:min-h-[80vh]">
        {/* Slides */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => {
            const isActive = index === current;
            const showVideo =
              slide.video_url &&
              (slide.media_type === "video" ||
                slide.media_type === "photo_video");
            const showImage =
              slide.media_type === "photo" ||
              slide.media_type === "photo_video";

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 ${getTransitionClass()}`}
                style={{ opacity: isActive ? 1 : 0 }}
              >
                {/* Video */}
                {showVideo && (
                  <video
                    ref={isActive ? videoRef : undefined}
                    src={slide.video_url!}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload={isActive ? "auto" : "metadata"}
                  />
                )}

                {/* Image */}
                {showImage && slide.image_url && (
                  <ImageWithFallback
                    src={slide.image_url}
                    alt={slide.headline || "Hero banner"}
                    fill
                    priority={index === 0}
                    quality={90}
                    sizes="100vw"
                    className="object-cover"
                  />
                )}

                {/* Fallback gradient when no media */}
                {!slide.image_url && !slide.video_url && (
                  <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black" />
                )}
              </div>
            );
          })}

          {/* Overlays */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-xl">
            {(() => {
              const textSlide = consistentText ? slides[0] : slides[current];
              return (
                <>
                  {textSlide?.headline && (
                    <h1 className="font-heading text-4xl font-light leading-tight text-white sm:text-6xl">
                      {renderHeadline(textSlide.headline)}
                    </h1>
                  )}
                  {textSlide?.subtext && (
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                      {textSlide.subtext}
                    </p>
                  )}
                  {textSlide?.hero_slide_ctas?.length > 0 && (
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      {textSlide.hero_slide_ctas.map((cta) => (
                        <Link
                          key={cta.id}
                          href={cta.href}
                          className={`h-12 inline-flex items-center justify-center px-8 text-sm font-semibold transition-colors rounded-lg ${
                            cta.variant === "primary"
                              ? "bg-gold text-black hover:bg-gold-light"
                              : "border border-white/30 bg-transparent text-white hover:bg-white hover:text-black"
                          }`}
                        >
                          {cta.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
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

      {/* Announcement Bar */}
      {announcement && (
        <section
          className="w-full py-3 px-4 flex items-center justify-center gap-4"
          style={{
            backgroundColor: announcement.bg_color,
            color: announcement.text_color,
          }}
        >
          {announcement.media_url && announcement.media_type === "image" && (
            <img
              src={announcement.media_url}
              alt=""
              className="h-6 w-6 rounded object-cover"
            />
          )}
          <p className="text-sm font-medium">{announcement.headline}</p>
          {announcement.subtext && (
            <p className="text-xs opacity-80 hidden sm:block">
              {announcement.subtext}
            </p>
          )}
          {announcement.cta_label && announcement.cta_href && (
            <Link
              href={announcement.cta_href}
              className="ml-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {announcement.cta_label}
            </Link>
          )}
        </section>
      )}
    </>
  );
}
