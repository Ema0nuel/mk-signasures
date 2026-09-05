import type { Metadata } from "next";
import FAQAccordion from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about orders, delivery, returns, and products at MK Signasures.",
  openGraph: {
    title: "FAQ | MK Signasures",
    description: "Quick answers to common questions.",
    url: "https://mksignasures.shop/faq",
  },
  alternates: {
    canonical: "https://mksignasures.shop/faq",
  },
};

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Quick answers to common questions about shopping with us.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <FAQAccordion />

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Still have questions?{" "}
            <a
              href="https://wa.me/2348101510096?text=Hello%20MK%20Signasures"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold hover:text-gold-dark transition-colors duration-150"
            >
              Chat with us on WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
