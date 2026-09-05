import type { Metadata } from "next";
import { getUserAddresses } from "@/lib/data/addresses";
import { createClient } from "@/lib/supabase/server";
import AddressesView from "./addresses-view";
import type { UserAddress } from "@/types/database";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your MK Signatures delivery addresses.",
  openGraph: {
    title: "Addresses | MK Signatures",
    description: "Manage your delivery addresses.",
    url: "https://mksignatures.com/addresses",
  },
  alternates: {
    canonical: "https://mksignatures.com/addresses",
  },
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
