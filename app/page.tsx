import type { Metadata } from "next";
import {
  getNewArrivals,
  getRecommendedProducts,
} from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import {
  getActiveHeroBanner,
  getActiveAnnouncement,
} from "@/lib/data/customization";
import HeroSection from "@/components/home/hero-section";
import TickerTape from "@/components/home/ticker-tape";
import CategoriesSection from "@/components/home/categories-section";
import FeaturedSection from "@/components/home/featured-section";
import BrandStory from "@/components/home/brand-story";

export const metadata: Metadata = {
  title: "MK Signasures | Premium Wigs, Hair & Clothing in Nigeria",
  description:
    "Shop quality wigs, hair extensions, and clothing at MK Signasures. Free delivery on orders above N100,000. 7-day returns.",
  openGraph: {
    title: "MK Signasures | Premium Wigs, Hair & Clothing",
    description:
      "Quality wigs, hair extensions, and clothing. Free delivery across Nigeria.",
    url: "https://mksignasures.shop",
  },
  alternates: {
    canonical: "https://mksignasures.shop",
  },
};

export default async function Home() {
  const [newArrivals, recommended, categories, heroBanner, announcement] =
    await Promise.all([
      getNewArrivals(),
      getRecommendedProducts(),
      getCategories(),
      getActiveHeroBanner(),
      getActiveAnnouncement(),
    ]);

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection banner={heroBanner} announcement={announcement} />
      <TickerTape />
      <CategoriesSection categories={categories} />
      <FeaturedSection
        title="New Arrivals"
        subtitle="Fresh picks, just in"
        products={newArrivals}
      />
      <FeaturedSection
        title="Recommended"
        subtitle="Picked for you"
        products={recommended}
        showStar
      />
      <BrandStory />
    </div>
  );
}
