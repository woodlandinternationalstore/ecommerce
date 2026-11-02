"use client";

import { useEffect, useState } from "react";
import { getCartProducts, type CartProduct } from "@/app/(site)/actions";
import { useCart } from "@/lib/cart";

export type Line = { id: number; qty: number; product: CartProduct | null; problem: string | null };

/** Cart lines joined with fresh database data. */
export function useCartLines() {
  const cart = useCart();
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const key = cart.lines.map((l) => l.id).sort().join(",");

  useEffect(() => {
    if (!cart.ready) return;
    if (!key) {
      setProducts([]);
      return;
    }
    let live = true;
    getCartProducts(key.split(",").map(Number)).then((p) => live && setProducts(p)).catch(() => live && setProducts([]));
    return () => {
      live = false;
    };
  }, [key, cart.ready]);

  const loading = !cart.ready || products === null;
  const lines: Line[] = cart.lines.map((l) => {
    const product = products?.find((p) => p.id === l.id) ?? null;
    let problem: string | null = null;
    if (!loading) {
      if (!product) problem = "No longer available";
      else if (product.maxQty === 0) problem = "Out of stock";
      else if (product.maxQty !== null && l.qty > product.maxQty) problem = `Only ${product.maxQty} available`;
    }
    return { ...l, product, problem };
  });

  const known = lines.reduce((s, l) => s + (l.product?.price ? l.product.price * l.qty : 0), 0);
  const unknown = lines.filter((l) => l.product && !l.product.price).length;
  const hasProblem = lines.some((l) => l.problem);
  return { cart, lines, loading, known, unknown, hasProblem };
}
