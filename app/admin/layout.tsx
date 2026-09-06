import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin | MK Signasures",
    template: "%s | MK Signasures Admin",
  },
  description: "MK Signasures Admin Panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
