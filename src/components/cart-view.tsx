"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { tsh } from "@/lib/site";
import { useCartLines } from "./use-cart-products";
import { ProductImage } from "./product-bits";

export function Totals({ known, unknown }: { known: number; unknown: number }) {
  const t = useT();
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-base font-bold">
        <span>{unknown > 0 ? t("Estimated subtotal") : t("Subtotal")}</span>
        <span>{tsh(known)}</span>
      </div>
      {unknown > 0 && (
        <p className="text-xs font-bold text-brand">
          {t("ESTIMATED SUBTOTAL — EXCLUDES ITEMS WITH PRICE ON REQUEST.")} ({unknown} {unknown === 1 ? t("item needs price confirmation") : t("items need price confirmation")})
        </p>
      )}
      <p className="text-xs text-muted">{t("FINAL PRICING AND AVAILABILITY WILL BE CONFIRMED BY WOODLAND.")}</p>
    </div>
  );
}

export function CartView() {
  const t = useT();
  const { cart, lines, loading, known, unknown, hasProblem } = useCartLines();

  if (loading) return <p className="py-10 text-center text-sm text-muted">{t("Loading your cart…")}</p>;
  if (lines.length === 0) {
    return (
      <div className="card card-grey p-10 text-center">
        <p className="text-lg font-bold">{t("Your cart is empty.")}</p>
        <Link href="/shop" className="btn btn-red mt-4">{t("Shop spare parts")}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <ul className="space-y-3">
        {lines.map((l) => (
          <li key={l.id} className="card flex gap-3 p-3">
            <ProductImage src={l.product?.image ?? null} alt={l.product?.name ?? "Unavailable product"} className="h-20 w-20 shrink-0 rounded border border-line" />
            <div className="min-w-0 flex-1">
              {l.product ? (
                <>
                  <Link href={`/product/${l.product.slug}`} className="font-bold leading-tight hover:text-brand">{l.product.name}</Link>
                  <p className="partno text-xs">{l.product.partNumber || t("Part number to be confirmed")}</p>
                  {l.product.vehicle && <p className="text-xs text-muted">{l.product.vehicle}</p>}
                  <p className="mt-1 text-sm">
                    {l.product.price ? <>{tsh(l.product.price)} {t("each")} · <b>{tsh(l.product.price * l.qty)}</b></> : <b className="text-brand">{t("PRICE ON REQUEST")}</b>}
                  </p>
                </>
              ) : (
                <p className="font-bold">{t("This product is no longer available.")}</p>
              )}
              {l.problem && <p role="alert" className="mt-1 text-sm font-bold text-brand">{/^Only (\d+) available$/.test(l.problem) ? t("Only {n} available", { n: l.problem.replace(/\D/g, "") }) : t(l.problem)}. {t("Please update your cart.")}</p>}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-md border border-line">
                  <button className="h-10 w-10 text-lg" aria-label={t("Decrease quantity")} onClick={() => cart.setQty(l.id, l.qty - 1)}>−</button>
                  <span className="w-10 text-center" aria-label={t("Quantity")}>{l.qty}</span>
                  <button className="h-10 w-10 text-lg" aria-label={t("Increase quantity")} disabled={l.product?.maxQty != null && l.qty >= l.product.maxQty} onClick={() => cart.setQty(l.id, l.qty + 1)}>+</button>
                </div>
                <button className="text-sm font-bold text-brand underline" onClick={() => cart.remove(l.id)}>{t("Remove")}</button>
              </div>
            </div>
          </li>
        ))}
        <li><button className="text-sm font-bold underline" onClick={() => confirm(t("Remove all items from your cart?")) && cart.clear()}>{t("Clear cart")}</button></li>
      </ul>

      <aside className="card card-grey h-fit space-y-4 p-4 lg:sticky lg:top-32">
        <h2 className="text-2xl">{t("Order summary")}</h2>
        <p className="text-sm">{cart.count} {cart.count === 1 ? t("item") : t("items")}</p>
        <Totals known={known} unknown={unknown} />
        <div className="grid gap-2">
          {hasProblem ? (
            <button className="btn btn-red" disabled>{t("Fix cart issues to continue")}</button>
          ) : (
            <Link href="/checkout" className="btn btn-wa">{t("Proceed to WhatsApp checkout")}</Link>
          )}
          <Link href="/shop" className="btn btn-outline">{t("Continue shopping")}</Link>
        </div>
      </aside>
    </div>
  );
}
