import type { Metadata } from "next";
import CheckoutSuccess from "./checkout-success";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Order Confirmed
          </h1>
        </div>
      </div>
      <CheckoutSuccess reference={params.reference} />
    </div>
  );
}
