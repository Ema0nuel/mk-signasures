import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MK Signatures, our mission, and our commitment to quality wigs, hair, and clothing.",
  openGraph: {
    title: "About | MK Signatures",
    description: "Our story, mission, and commitment to quality.",
    url: "https://mksignatures.com/about",
  },
  alternates: {
    canonical: "https://mksignatures.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
        <Image
          src="/banner/about.webp"
          alt="About MK Signatures"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white text-center px-4">
            About MK Signatures
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-light">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            MK Signatures was born from a simple idea: everyone deserves access to
            quality wigs, hair extensions, and clothing without compromise. We
            started with a passion for helping people look and feel their best,
            and that mission drives every product we curate.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-light">What We Offer</h2>
          <p className="text-muted-foreground leading-relaxed">
            From premium lace front wigs to versatile hair extensions, trendy
            clothing, and finishing accessories, our collection is carefully
            selected to meet the highest standards of quality and style. Every
            product goes through our quality check before it reaches you.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-light">Our Promise</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe in transparency, honest pricing, and customer service that
            actually cares. If something is not right, we make it right. Your
            satisfaction is not a slogan for us, it is the standard we operate by
            every single day.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-light">Visit Us</h2>
          <div className="text-muted-foreground leading-relaxed space-y-1">
            <p className="font-medium text-foreground">MK Signatures Store</p>
            <p>Jakande, Oke-Afa,</p>
            <p>Isolo, Lagos, Nigeria</p>
            <p className="text-sm">P.O. Box 10131, Ikeja, Lagos State, Nigeria</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-light">Get In Touch</h2>
          <p className="text-muted-foreground leading-relaxed">
            Have questions about our products or need styling advice? Reach out to
            us on WhatsApp at +234 810 151 0096 or email us at
            admin@mksignasures.shop. We respond within hours, not days.
          </p>
        </section>
      </div>
    </div>
  );
}
