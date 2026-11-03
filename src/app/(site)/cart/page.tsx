import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false } };

export default async function CartPage() {
  const t = await getT();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-4xl">{t("Shopping cart")}</h1>
      <CartView />
    </div>
  );
}
