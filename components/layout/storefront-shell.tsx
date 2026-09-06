"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import AuthDialog from "@/components/auth/auth-dialog";
import WhatsAppButton from "@/components/home/whatsapp-button";

export default function StorefrontShell({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isViewingAdmin = isAdmin || pathname.startsWith("/admin");

  if (isViewingAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <AuthDialog />
      <WhatsAppButton />
    </>
  );
}
