import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";
import { AuthDialogProvider } from "@/components/auth-dialog-provider";
import { CartDrawerProvider } from "@/components/cart/cart-drawer-provider";
import StorefrontShell from "@/components/layout/storefront-shell";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MK Signasures | Wigs, Hair & Clothing",
    template: "%s | MK Signasures",
  },
  description:
    "Discover quality wigs, hair extensions, and clothing at MK Signasures. Premium products, fast delivery across Nigeria, 7-day returns.",
  metadataBase: new URL("https://mksignasures.shop"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "MK Signasures",
    title: "MK Signasures | Wigs, Hair & Clothing",
    description:
      "Premium wigs, hair extensions, and clothing. Quality you can trust, style you will love.",
    images: [
      {
        url: "/images/logo-192.png",
        width: 192,
        height: 192,
        alt: "MK Signasures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MK Signasures | Wigs, Hair & Clothing",
    description:
      "Premium wigs, hair extensions, and clothing. Quality you can trust.",
    images: ["/images/logo-192.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/favicon.ico", sizes: "any" },
      { url: "/images/logo-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  verification: {
    google: "-8gzpKE_2bVk5-cgTdkrVHwodqpKg2rJN5jYdbCtyI4",
  },
  alternates: {
    canonical: "https://mksignasures.shop",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MK Signasures",
              url: "https://mksignasures.shop",
              logo: "https://mksignasures.shop/images/logo-192.png",
              description:
                "Premium wigs, hair extensions, and clothing in Nigeria.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+234-810-151-0096",
                contactType: "customer service",
                availableLanguage: "English",
              },
              sameAs: [],
            }),
          }}
        />
        <Providers>
          <AuthDialogProvider>
            <CartDrawerProvider>
              <StorefrontShell>{children}</StorefrontShell>
            </CartDrawerProvider>
          </AuthDialogProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
