import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "WhatsApp Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-4xl">WhatsApp checkout</h1>
      <CheckoutForm />
    </div>
  );
}
