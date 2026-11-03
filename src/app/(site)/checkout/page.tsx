import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "WhatsApp Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const t = await getT();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-4xl">{t("WhatsApp checkout")}</h1>
      <CheckoutForm />
    </div>
  );
}
