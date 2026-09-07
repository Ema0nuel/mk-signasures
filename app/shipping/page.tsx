import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Learn about our shipping options, delivery times, and policies for orders within Nigeria.",
  openGraph: {
    title: "Shipping Policy | MK Signasures",
    description: "Delivery times and shipping policies for Nigeria.",
    url: "https://mksgn.shop/shipping",
  },
  alternates: {
    canonical: "https://mksgn.shop/shipping",
  },
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Shipping Policy
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Processing Time</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Orders are processed within 1 to 2 business days after payment
            confirmation. You will receive a notification once your order has been
            dispatched.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">
            Delivery Within Nigeria
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              <span className="font-medium text-foreground">Lagos:</span> 1 to 3
              business days
            </p>
            <p>
              <span className="font-medium text-foreground">South West:</span> 2
              to 4 business days
            </p>
            <p>
              <span className="font-medium text-foreground">North / East /</span>{" "}
              <span className="font-medium text-foreground">
                South South:
              </span>{" "}
              3 to 7 business days
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Shipping Fees</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              <span className="font-medium text-foreground">Lagos:</span> &#8358;5,000
            </p>
            <p>
              <span className="font-medium text-foreground">Outside Lagos (Interstate):</span> &#8358;10,000
            </p>
            <p>
              <span className="font-medium text-foreground">Free Delivery:</span> Orders above &#8358;100,000
            </p>
          </div>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Shipping fees may vary based on location and order details. Final fees are confirmed at checkout.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Order Tracking</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once your order ships, you will receive tracking information via
            WhatsApp or email. You can also check your order status from your
            account dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">International Orders</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We currently ship within Nigeria. For international inquiries, please
            contact us on WhatsApp at +234 810 151 0096 and we will do our best
            to accommodate your request.
          </p>
        </section>
      </div>
    </div>
  );
}
