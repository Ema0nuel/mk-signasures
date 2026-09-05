"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ShoppingBag,
  Package,
  MessageCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";

const WHATSAPP_NUMBER = "2348101510096";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi MK Signasures, I just placed an order and would like to follow up on it."
);

export default function CheckoutSuccess({
  reference,
}: {
  reference?: string;
}) {
  const clearCart = useCartStore((s) => s.clearCart);
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const emailSentRef = useRef(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Send order confirmation emails when the page loads (ref guard prevents double-send in strict mode)
  useEffect(() => {
    if (!reference || emailSentRef.current) return;
    emailSentRef.current = true;

    setEmailLoading(true);
    fetch("/api/send-order-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmailSent(true);
        }
      })
      .catch(() => {})
      .finally(() => setEmailLoading(false));
  }, [reference]);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="mb-8">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-light mb-3">
          Thank you for your order
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your payment was successful and your order has been placed. We&apos;ll
          send you updates on your order progress via email and phone.
        </p>
      </div>

      {reference && (
        <div className="border border-border p-4 mb-8">
          <p className="text-xs text-muted-foreground mb-1">
            Payment Reference
          </p>
          <p className="text-sm font-mono font-medium">{reference}</p>
        </div>
      )}

      {/* Email status */}
      <div className="border border-border p-4 mb-8 bg-secondary/50">
        <div className="flex items-center justify-center gap-2 mb-2">
          {emailLoading ? (
            <Loader2 className="h-4 w-4 text-gold animate-spin" />
          ) : emailSent ? (
            <Mail className="h-4 w-4 text-green-600" />
          ) : (
            <Package className="h-4 w-4 text-gold" />
          )}
          <p className="text-sm font-medium">
            {emailLoading
              ? "Sending your invoice..."
              : emailSent
                ? "Invoice sent to your email"
                : "What happens next?"}
          </p>
        </div>
        {emailLoading ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            We are sending your order confirmation and invoice to your email
            address.
          </p>
        ) : emailSent ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Check your inbox for your order confirmation and invoice. A copy has
            also been sent to our team.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              We will review and confirm your order shortly. You will receive a
              confirmation with your order number once it is processed.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need quick help? Contact our WhatsApp support for immediate
              follow-up on your order, delivery updates, or any questions.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="h-11 px-8 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp Support
          </Button>
        </a>
        <Link href="/orders">
          <Button variant="outline" className="h-11 px-8 border-border">
            View Orders
          </Button>
        </Link>
        <Link href="/shop">
          <Button className="bg-gold text-black hover:bg-gold-light h-11 px-8">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
