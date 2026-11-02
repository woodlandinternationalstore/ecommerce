"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export function AddToCart({
  productId, maxQty, compact = false,
}: { productId: number; maxQty: number | null; compact?: boolean }) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const blocked = maxQty === 0;
  const inCart = cart.lines.find((l) => l.id === productId)?.qty ?? 0;
  const limit = maxQty === null ? 999 : maxQty;

  function add() {
    const q = Math.min(qty, Math.max(limit - inCart, 0));
    if (q <= 0) return;
    cart.add(productId, q);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (blocked) return <button className="btn btn-outline btn-sm w-full" disabled>Out of stock</button>;

  return (
    <div className={compact ? "" : "space-y-3"}>
      {!compact && (
        <div className="flex items-center gap-3">
          <span className="label mb-0">Quantity</span>
          <div className="flex items-center rounded-md border border-line">
            <button type="button" className="h-11 w-11 text-xl" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <input
              className="h-11 w-14 border-x border-line text-center text-base"
              inputMode="numeric"
              aria-label="Quantity"
              value={qty}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, "") || "1", 10);
                setQty(Math.min(Math.max(n, 1), limit));
              }}
            />
            <button type="button" className="h-11 w-11 text-xl" aria-label="Increase quantity" onClick={() => setQty(Math.min(qty + 1, limit))}>+</button>
          </div>
          {maxQty !== null && <span className="text-xs text-muted">Max {maxQty}</span>}
        </div>
      )}
      <button type="button" className={`btn btn-red ${compact ? "btn-sm w-full" : "w-full"}`} onClick={add} disabled={inCart >= limit}>
        {inCart >= limit ? "Maximum in cart" : "Add to cart"}
      </button>
      {added && (
        <p role="status" className="text-sm font-bold text-green-700">
          Added to cart. <Link href="/cart" className="underline">View cart</Link>
        </p>
      )}
    </div>
  );
}
