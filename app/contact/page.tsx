import type { Metadata } from "next";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with MK Signasures. Reach us via phone, email, or WhatsApp.",
  openGraph: {
    title: "Contact Us | MK Signasures",
    description: "Reach us via phone, email, or WhatsApp.",
    url: "https://mksignasures.shop/contact",
  },
  alternates: {
    canonical: "https://mksignasures.shop/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Contact Us
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            We are here to help. Reach out through any of the channels below.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Contact Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <a
            href="https://wa.me/2348101510096?text=Hello%20MK%20Signasures"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 border border-border p-6 text-center transition-colors duration-150 hover:border-gold/40"
          >
            <MessageCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-1">
                +234 810 151 0096
              </p>
            </div>
          </a>

          <a
            href="tel:+2348101510096"
            className="flex flex-col items-center gap-3 border border-border p-6 text-center transition-colors duration-150 hover:border-gold/40"
          >
            <Phone className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-xs text-muted-foreground mt-1">
                +234 810 151 0096
              </p>
            </div>
          </a>

          <a
            href="mailto:admin@mksignasures.shop"
            className="flex flex-col items-center gap-3 border border-border p-6 text-center transition-colors duration-150 hover:border-gold/40"
          >
            <Mail className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground mt-1">
                admin@mksignasures.shop
              </p>
            </div>
          </a>
        </div>

        {/* Store Location */}
        <div className="mt-12 border border-border p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-light">
                Visit Our Store
              </h2>
              <p className="text-sm font-medium text-foreground">
                MK Signasures Store
              </p>
              <p className="text-sm text-muted-foreground">
                Jakande, Oke-Afa,
              </p>
              <p className="text-sm text-muted-foreground">
                Isolo, Lagos, Nigeria
              </p>
              <p className="text-xs text-muted-foreground/60">
                P.O. Box 10131, Ikeja, Lagos State, Nigeria
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-12 space-y-4">
          <h2 className="font-heading text-2xl font-light text-center">
            Send Us a Message
          </h2>
          <form className="space-y-4 mt-6">
            <input
              type="text"
              placeholder="Your name"
              className="w-full h-11 px-4 text-sm bg-background border border-border outline-none focus:border-gold transition-colors duration-150"
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full h-11 px-4 text-sm bg-background border border-border outline-none focus:border-gold transition-colors duration-150"
            />
            <textarea
              placeholder="How can we help?"
              rows={5}
              className="w-full px-4 py-3 text-sm bg-background border border-border outline-none focus:border-gold transition-colors duration-150 resize-none"
            />
            <button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground text-sm font-medium transition-colors duration-150 hover:bg-primary/90"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
