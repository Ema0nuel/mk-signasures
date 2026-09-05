import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions governing the use of MK Signasures website and services.",
  openGraph: {
    title: "Terms of Service | MK Signasures",
    description: "Terms and conditions for using our services.",
    url: "https://mksignasures.shop/terms",
  },
  alternates: {
    canonical: "https://mksignasures.shop/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Terms of Service
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using the MK Signasures website and services, you
            agree to be bound by these terms. If you do not agree, please do not
            use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Products &amp; Pricing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All product descriptions, images, and pricing are as accurate as
            possible. We reserve the right to modify prices without prior notice.
            In the event of a pricing error, we will contact you before processing
            your order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Orders &amp; Payment</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Placing an order constitutes an offer to purchase. We reserve the
            right to accept or decline any order. Payment is processed securely
            through Paystack. Orders are only confirmed after successful payment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Account Responsibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. Notify us immediately if you suspect unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MK Signasures shall not be liable for indirect, incidental, or
            consequential damages arising from the use of our products or
            services. Our total liability shall not exceed the amount paid for
            the specific order in question.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Governing Law</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the Federal Republic of
            Nigeria. Any disputes shall be resolved in the courts of competent
            jurisdiction within Nigeria.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Contact Information</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p className="font-medium text-foreground">MK Signatures Store</p>
            <p>Jakande, Oke-Afa,</p>
            <p>Isolo, Lagos, Nigeria</p>
            <p className="text-xs text-muted-foreground/60">
              P.O. Box 10131, Ikeja, Lagos State, Nigeria
            </p>
            <p className="mt-2">Email: admin@mksignasures.shop</p>
            <p>Phone: +234 810 151 0096</p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Last updated: September 2026
        </p>
      </div>
    </div>
  );
}
