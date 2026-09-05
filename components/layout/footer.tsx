import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

const QUICK_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?new=true", label: "New Arrivals" },
  { href: "/about", label: "About" },
];

const SUPPORT_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/faq", label: "FAQ" },
];

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12 sm:py-16 md:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
        {/* Brand */}
        <div>
          <Link href="/" className="font-heading text-2xl font-light tracking-wide">
            MKSGN
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Wigs, hair, and clothing for everyone. Quality you can trust, style you will love.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Quick Links
          </h3>
          <ul className="space-y-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Support
          </h3>
          <ul className="space-y-3">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Get in Touch
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Jakande, Oke-Afa,<br />
                Isolo, Lagos, Nigeria
              </span>
            </li>
            <li>
              <a
                href="tel:+2348101510096"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
              >
                <Phone className="h-4 w-4 text-gold shrink-0" />
                +234 810 151 0096
              </a>
            </li>
            <li>
              <a
                href="mailto:admin@mksignasures.shop"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
              >
                <Mail className="h-4 w-4 text-gold shrink-0" />
                admin@mksignasures.shop
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} MK Signasures. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              P.O. Box 10131, Ikeja, Lagos State, Nigeria
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-gold transition-colors duration-150">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-gold transition-colors duration-150">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
