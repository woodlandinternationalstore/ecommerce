"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";

/** "Order now": puts the part in the cart and goes straight to checkout. */
export function AddToCart({
  productId, maxQty, compact = false,
}: { productId: number; maxQty: number | null; compact?: boolean }) {
  const t = useT();
  const cart = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const blocked = maxQty === 0;
  const inCart = cart.lines.find((l) => l.id === productId)?.qty ?? 0;
  const limit = maxQty === null ? 999 : maxQty;

  function orderNow() {
    const q = Math.min(qty, Math.max(limit - inCart, 0));
    if (q > 0) cart.add(productId, q);
    router.push("/checkout");
  }

  if (blocked) return <button className="btn btn-outline btn-sm w-full" disabled>{t("Out of stock")}</button>;

  return (
    <div className={compact ? "" : "space-y-3"}>
      {!compact && (
        <div className="flex items-center gap-3">
          <span className="label mb-0">{t("Quantity")}</span>
          <div className="flex items-center rounded-md border border-line">
            <button type="button" className="h-11 w-11 text-xl" aria-label={t("Decrease quantity")} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <input
              className="h-11 w-14 border-x border-line text-center text-base"
              inputMode="numeric"
              aria-label={t("Quantity")}
              value={qty}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, "") || "1", 10);
                setQty(Math.min(Math.max(n, 1), limit));
              }}
            />
            <button type="button" className="h-11 w-11 text-xl" aria-label={t("Increase quantity")} onClick={() => setQty(Math.min(qty + 1, limit))}>+</button>
          </div>
          {maxQty !== null && <span className="text-xs text-muted">{t("Max {n}", { n: maxQty })}</span>}
        </div>
      )}
      <button type="button" className={`btn btn-red ${compact ? "btn-sm w-full !px-2" : "w-full"}`} onClick={orderNow}>
        {t("Order now")}
      </button>
    </div>
  );
}
