import type { Metadata } from "next";
import { getUserAddresses } from "@/lib/data/addresses";
import { createClient } from "@/lib/supabase/server";
import AddressesView from "./addresses-view";
import type { UserAddress } from "@/types/database";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your MK Signasures delivery addresses.",
  openGraph: {
    title: "Addresses | MK Signasures",
    description: "Manage your delivery addresses.",
    url: "https://mksgn.shop/addresses",
  },
  alternates: {
    canonical: "https://mksgn.shop/addresses",
  },
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  let addresses: UserAddress[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      addresses = await getUserAddresses(user.id);
    }
  } catch {
    // Not authenticated or error — show empty state
  }

  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            My Addresses
          </h1>
        </div>
      </div>
      <AddressesView initialAddresses={addresses} />
    </div>
  );
}
