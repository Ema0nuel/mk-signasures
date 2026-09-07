import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "Our return and exchange policy for orders placed at MK Signasures.",
  openGraph: {
    title: "Returns & Exchanges | MK Signasures",
    description: "7-day return and exchange policy.",
    url: "https://mksgn.shop/returns",
  },
  alternates: {
    canonical: "https://mksgn.shop/returns",
  },
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Returns &amp; Exchanges
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Our Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We want you to love your purchase. If you are not satisfied with your
            order, you can request a return or exchange within 7 days of
            delivery, provided the item is unused, unworn, and in its original
            packaging.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Eligible Items</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>Clothing items with tags attached and unworn</li>
            <li>Accessories in original packaging</li>
            <li>Hair extensions that are uninstalled and in original condition</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Non-Eligible Items</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>Wigs that have been worn, styled, or altered</li>
            <li>Items without original tags or packaging</li>
            <li>Sale or clearance items (unless defective)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">How to Start a Return</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Contact us on WhatsApp at +234 810 151 0096 with your order number and
            reason for return. Our team will guide you through the process and
            arrange pickup where applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Refunds</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once we receive and inspect the returned item, your refund will be
            processed within 5 to 7 business days to your original payment method.
          </p>
        </section>
      </div>
    </div>
  );
}
