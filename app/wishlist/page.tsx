import type { Metadata } from "next";
import WishlistView from "./wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist | MK Signasures",
  description: "Your saved products and favorites.",
};

export default function WishlistPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Wishlist
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Your saved products and favorites.
          </p>
        </div>
      </div>
      <WishlistView />
    </div>
  );
}
