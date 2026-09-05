// Shared business constants used across checkout and order processing

export const LAGOS_FEE = 5000;
export const INTERSTATE_FEE = 10000;
export const FREE_DELIVERY_THRESHOLD = 100000;

export function calculateShippingFee(subtotal: number, state: string): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  const normalizedState = (state || "").trim().toLowerCase();
  if (normalizedState === "lagos") return LAGOS_FEE;
  return INTERSTATE_FEE;
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
