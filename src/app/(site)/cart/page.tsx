import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-4xl">Shopping cart</h1>
      <CartView />
    </div>
  );
}
