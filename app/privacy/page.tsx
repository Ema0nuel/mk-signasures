import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MK Signasures collects, uses, and protects your personal information.",
  openGraph: {
    title: "Privacy Policy | MK Signasures",
    description: "How we collect, use, and protect your data.",
    url: "https://mksgn.shop/privacy",
  },
  alternates: {
    canonical: "https://mksgn.shop/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Privacy Policy
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you create an account or place an order, we collect your name,
            email address, phone number, and delivery address. We also collect
            payment information processed securely through our payment provider
            (Paystack). We do not store your card details on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">How We Use Your Information</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>To process and deliver your orders</li>
            <li>To communicate order updates via email or WhatsApp</li>
            <li>To improve our products and services</li>
            <li>To send promotional communications (only with your consent)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Data Protection</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is stored securely using Supabase (PostgreSQL) with
            row-level security enabled. We implement industry-standard encryption
            and access controls to protect your personal information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use Paystack for payment processing and Supabase for data storage
            and authentication. These services have their own privacy policies
            governing how they handle your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can access, update, or delete your account information at any time
            from your profile settings. For any privacy-related questions, contact
            us at admin@mksignasures.shop.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-light">Contact Us</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p className="font-medium text-foreground">MK Signasures Store</p>
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
