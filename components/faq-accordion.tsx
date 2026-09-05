"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I place an order?",
    answer:
      "Browse our shop, select your product and variant options, and add to cart. Proceed to checkout, enter your delivery details, and complete payment via Paystack. You will receive an order confirmation immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept debit cards, bank transfers, and USSD payments through Paystack. All transactions are encrypted and secure.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Lagos deliveries take 1 to 3 business days. Other parts of Nigeria range from 2 to 7 business days depending on your location. Orders above N100,000 qualify for free delivery.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "Yes. You can request a return or exchange within 7 days of delivery. The item must be unused, unworn, and in its original packaging. Wigs that have been worn or styled are not eligible. Contact us on WhatsApp to start the process.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you will receive tracking details via WhatsApp or email. You can also check your order status from your account dashboard.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We currently focus on deliveries within Nigeria. For international orders, reach out to us on WhatsApp at +234 810 151 0096 and we will do our best to help.",
  },
  {
    question: "Are the wig sizes standard?",
    answer:
      "Most of our wigs come in a standard medium cap size that fits most head sizes. Specific sizing details are listed on each product page. If you need a custom size, contact us before ordering.",
  },
  {
    question: "How do I care for my wig?",
    answer:
      "Store your wig on a wig stand when not in use. Wash with sulfate-free shampoo and condition regularly. Avoid excessive heat styling. Detailed care instructions come with each purchase.",
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border border border-border">
      {FAQ_DATA.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary transition-colors duration-150"
            >
              {item.question}
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isOpen ? "300px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
