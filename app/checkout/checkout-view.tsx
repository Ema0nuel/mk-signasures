"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useCartItems } from "@/hooks/use-cart-items";
import { createClient } from "@/lib/supabase/client";
import {
  LAGOS_FEE,
  INTERSTATE_FEE,
  FREE_DELIVERY_THRESHOLD,
  formatPrice,
} from "@/lib/constants";
import { toast } from "sonner";

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  is_default: boolean;
}

export default function CheckoutView() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const getFullName = useAuthStore((s) => s.getFullName);
  const clearCart = useCartStore((s) => s.clearCart);
  const localItems = useCartStore((s) => s.items);
  const { items } = useCartItems();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressesLoading, setAddressesLoading] = useState(true);

  const [form, setForm] = useState({
    name: profile?.full_name ?? getFullName() ?? "",
    phone: profile?.phone ?? "",
    email: user?.email ?? "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "Nigeria",
    notes: "",
  });

  // Fetch saved addresses
  useEffect(() => {
    if (!user) return;
    setAddressesLoading(true);
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => {
        const addrs = data.addresses || [];
        setSavedAddresses(addrs);
        // Auto-select default address
        const defaultAddr = addrs.find((a: SavedAddress) => a.is_default);
        if (defaultAddr) {
          selectAddress(defaultAddr);
        }
        setAddressesLoading(false);
      })
      .catch(() => setAddressesLoading(false));
  }, [user]);

  function selectAddress(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    setShowNewAddress(false);
    setForm((f) => ({
      ...f,
      name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      country: addr.country || "Nigeria",
    }));
  }

  function handleNewAddress() {
    setSelectedAddressId(null);
    setShowNewAddress(true);
    setForm((f) => ({
      ...f,
      name: profile?.full_name ?? getFullName() ?? "",
      phone: profile?.phone ?? "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      country: "Nigeria",
    }));
  }

  async function deleteAddress(id: string) {
    try {
      await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
        handleNewAddress();
      }
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );
  const isLagos = form.state.trim().toLowerCase() === "lagos";
  const shippingFee =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : isLagos ? LAGOS_FEE : INTERSTATE_FEE;
  const total = subtotal + shippingFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Sign in to checkout
        </p>
        <Link href="/">
          <Button className="bg-gold text-black hover:bg-gold-light h-11">
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0 && localItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Your cart is empty
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Add some items before checking out.
        </p>
        <Link href="/shop">
          <Button className="bg-gold text-black hover:bg-gold-light h-11">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  async function handlePayment() {
    setError("");
    const userId = user?.id;
    if (!userId) return;

    if (!form.name || !form.phone || !form.address_line1 || !form.city || !form.state) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Save address if requested
      if (saveAddress && !selectedAddressId) {
        await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: addressLabel,
            full_name: form.name,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2 || null,
            city: form.city,
            state: form.state,
            country: form.country,
            is_default: savedAddresses.length === 0,
          }),
        });
      }

      const supabase = createClient();
      const cartItems = localItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const { data, error: fnError } = await supabase.functions.invoke(
        "process-order",
        {
          body: {
            userId,
            cartItems,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
            shippingAddress: {
              name: form.name,
              phone: form.phone,
              email: form.email,
              address:
                form.address_line1 +
                (form.address_line2 ? `, ${form.address_line2}` : ""),
              city: form.city,
              state: form.state,
              country: form.country,
              notes: form.notes || undefined,
            },
          },
        }
      );

      if (fnError) {
        const msg = fnError.message || "";
        if (
          msg.includes("Cart items not found") ||
          msg.includes("Product not found")
        ) {
          setError(
            "Your cart is empty or some items are no longer available. Please refresh and try again."
          );
        } else if (msg.includes("Insufficient stock")) {
          setError("Some items in your cart are out of stock");
        } else if (msg.includes("no longer available")) {
          setError("One or more items in your cart are no longer available");
        } else if (msg.includes("Paystack initialization failed")) {
          setError("Payment could not be initialized. Please try again");
        } else if (
          msg.includes("Missing authorization") ||
          msg.includes("UNAUTHORIZED")
        ) {
          setError("Session expired. Please sign in again");
        } else {
          setError("Something went wrong. Please try again");
        }
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError("Something went wrong. Please try again");
        setLoading(false);
        return;
      }

      if (data?.authorization_url) {
        clearCart();
        window.location.href = data.authorization_url;
      } else {
        setError("Something went wrong. Please try again");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Shipping Form */}
        <div className="lg:col-span-3">
          <h2 className="font-heading text-xl font-light mb-6">
            Shipping Information
          </h2>

          {/* Saved Addresses */}
          {!addressesLoading && savedAddresses.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Saved Addresses
              </p>
              <div className="space-y-2">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`border p-4 cursor-pointer transition-colors duration-150 flex items-start gap-3 ${
                      selectedAddressId === addr.id
                        ? "border-gold bg-gold/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => selectAddress(addr)}
                  >
                    <div className="mt-0.5">
                      {selectedAddressId === addr.id ? (
                        <div className="h-4 w-4 rounded-full bg-gold flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-black" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {addr.address_line1}
                        {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                        <br />
                        {addr.city}, {addr.state}, {addr.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(addr.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors duration-150 mt-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleNewAddress}
                className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <Plus className="h-3 w-3" />
                Use a different address
              </button>
            </div>
          )}

          {/* New Address Form */}
          {(showNewAddress || savedAddresses.length === 0 || addressesLoading) && (
            <div className="space-y-4">
              {savedAddresses.length > 0 && !addressesLoading && (
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gold" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    New Address
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Recipient name"
                    className="h-11"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+234 ..."
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email for order updates"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Address Line 1 *
                </label>
                <Input
                  type="text"
                  value={form.address_line1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address_line1: e.target.value }))
                  }
                  placeholder="Street address"
                  className="h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Address Line 2
                </label>
                <Input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address_line2: e.target.value }))
                  }
                  placeholder="Apartment, suite, etc. (optional)"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    City *
                  </label>
                  <Input
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    placeholder="City"
                    className="h-11"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    State *
                  </label>
                  <Input
                    type="text"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    placeholder="State"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Country
                </label>
                <Input
                  type="text"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  className="h-11"
                />
              </div>

              {/* Save address checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="save-address"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                <label
                  htmlFor="save-address"
                  className="text-xs text-muted-foreground"
                >
                  Save this address for future orders
                </label>
              </div>

              {saveAddress && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Address Label
                  </label>
                  <Input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="e.g. Home, Office"
                    className="h-11"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Delivery Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional delivery instructions"
                  rows={3}
                  className="w-full px-4 py-3 text-sm bg-background border border-border outline-none focus:border-gold transition-colors duration-150 resize-none"
                />
              </div>
            </div>
          )}

          {/* Trust signals */}
          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
              <span>Secure payment via Paystack</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold shrink-0" />
              <span>
                {shippingFee === 0
                  ? "Free delivery on this order"
                  : `Shipping: ${formatPrice(shippingFee)} · Free above ${formatPrice(FREE_DELIVERY_THRESHOLD)}`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 sm:mt-0 sm:ml-6">
            Shipping fees may vary based on location and order details. Final
            fees confirmed at checkout.
          </p>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            {/* Mobile toggle */}
            <button
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="w-full flex items-center justify-between py-4 border-b border-border lg:hidden"
            >
              <span className="text-sm font-medium">
                Order Summary ({totalItems} item
                {totalItems !== 1 ? "s" : ""})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatPrice(total)}
                </span>
                {summaryOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Summary content */}
            <div className={`${summaryOpen ? "block" : "hidden"} lg:block`}>
              <div className="border border-border p-6 space-y-4">
                <h2 className="font-heading text-xl font-light hidden lg:block">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const imageUrl =
                      item.image?.optimized_url ||
                      item.image?.original_url ||
                      null;
                    const lineTotal = item.variant.price * item.quantity;

                    return (
                      <div key={item.variantId} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 rounded-lg bg-secondary overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-black text-xs font-medium flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variant.sku}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-600 font-medium">
                          Free
                        </span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-[11px] text-muted-foreground/70 text-right -mt-1">
                      {isLagos ? "Lagos delivery" : "Interstate delivery"}
                    </p>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Pay button */}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full h-12 bg-gold text-black hover:bg-gold-light font-semibold text-sm rounded-xl"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatPrice(total)}`
                  )}
                </Button>

                <Link
                  href="/shop"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 pt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
