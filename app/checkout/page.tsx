import type { Metadata } from "next";
import CheckoutView from "./checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your MK Signasures order.",
  openGraph: {
    title: "Checkout | MK Signasures",
    description: "Complete your order.",
    url: "https://mksgn.shop/checkout",
  },
  alternates: {
    canonical: "https://mksgn.shop/checkout",
  },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Checkout
          </h1>
        </div>
      </div>
      <CheckoutView />
    </div>
  );
}
