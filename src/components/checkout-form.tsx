"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { markWhatsAppOpened, submitOrder } from "@/app/(site)/actions";
import { useT } from "@/lib/i18n";
import { SITE, tsh } from "@/lib/site";
import { Totals } from "./cart-view";
import { useCartLines } from "./use-cart-products";

type Errors = Record<string, string>;

export function CheckoutForm() {
  const t = useT();
  const router = useRouter();
  const { cart, lines, loading, known, unknown, hasProblem } = useCartLines();
  const [method, setMethod] = useState<"pickup" | "local" | "regions">("pickup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [review, setReview] = useState(false);
  // One key per page load: repeated clicks / retries can never create a second order.
  const keyRef = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`);
  const formRef = useRef<HTMLFormElement>(null);

  if (loading) return <p className="py-10 text-center text-sm text-muted">{t("Loading…")}</p>;
  if (lines.length === 0) {
    return (
      <div className="card card-grey p-10 text-center">
        <p className="text-lg font-bold">{t("Your cart is empty.")}</p>
        <Link href="/shop" className="btn btn-red mt-4">{t("Shop spare parts")}</Link>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-bold text-brand">{t(errors[k])}</p>;

  async function send() {
    if (busy || !formRef.current) return;
    setBusy(true);
    setError("");
    const f = new FormData(formRef.current);
    const s = (k: string) => String(f.get(k) ?? "");
    // Open the window now (inside the click) so pop-up blockers allow it; we point it at WhatsApp once the order is saved.
    const win = typeof window !== "undefined" ? window.open("", "_blank") : null;
    try {
      const res = await submitOrder({
        idempotencyKey: keyRef.current,
        name: s("name"), whatsapp: s("whatsapp"), altPhone: s("altPhone"), email: s("email"),
        deliveryMethod: method, deliveryLocation: s("deliveryLocation"), region: s("region"),
        contactMethod: s("contactMethod") === "phone" ? "phone" : "whatsapp",
        vehicleMake: s("vehicleMake"), vehicleModel: s("vehicleModel"), vehicleYear: s("vehicleYear"),
        chassis: s("chassis"), engine: s("engine"), fitment: s("fitment"), notes: s("notes"),
        items: lines.map((l) => ({ productId: l.id, qty: l.qty })),
      });
      if (!res.ok) {
        win?.close();
        setError(res.error);
        setErrors(res.fieldErrors ?? {});
        setReview(false);
        setBusy(false);
        return;
      }
      cart.clear();
      let opened = false;
      if (win) {
        try {
          win.location.href = res.waUrl;
          opened = true;
          void markWhatsAppOpened(res.ref, res.token);
        } catch {
          win.close();
        }
      }
      router.push(`/order/${res.ref}?t=${res.token}${opened ? "" : "&open=1"}`);
    } catch {
      win?.close();
      setError("We could not reach the server. Your cart is still saved: please try again.");
      setBusy(false);
    }
  }

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    if (hasProblem) return setError("Please fix the issues in your cart first.");
    const f = new FormData(formRef.current!);
    const miss: Errors = {};
    if (String(f.get("name") ?? "").trim().length < 2) miss.name = "Enter your full name";
    if (!/^\+?[\d\s\-()]{7,24}$/.test(String(f.get("whatsapp") ?? "").trim())) miss.whatsapp = "Enter a valid phone number, e.g. +255 771 889 889";
    if (method !== "pickup") {
      if (String(f.get("deliveryLocation") ?? "").trim().length < 3) miss.deliveryLocation = "Enter your delivery location";
      if (String(f.get("region") ?? "").trim().length < 2) miss.region = "Enter your region or city";
    }
    setErrors(miss);
    if (Object.keys(miss).length) return setError("Please check the highlighted fields.");
    setError("");
    setReview(true);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <form ref={formRef} onSubmit={toReview} noValidate className={review ? "hidden" : "space-y-6"}>
        <fieldset className="card space-y-3 p-4">
          <legend className="display px-1 text-xl">{t("Your details")}</legend>
          <div><label className="label" htmlFor="name">{t("Full name")} *</label><input id="name" name="name" className="field" autoComplete="name" required />{err("name")}</div>
          <div><label className="label" htmlFor="whatsapp">{t("WhatsApp phone number")} *</label><input id="whatsapp" name="whatsapp" className="field" inputMode="tel" autoComplete="tel" placeholder="+255 7XX XXX XXX" required />{err("whatsapp")}</div>
          <div><label className="label" htmlFor="altPhone">{t("Alternative phone number")}</label><input id="altPhone" name="altPhone" className="field" inputMode="tel" />{err("altPhone")}</div>
          <div><label className="label" htmlFor="email">{t("Email address")}</label><input id="email" name="email" type="email" className="field" autoComplete="email" />{err("email")}</div>
          <div>
            <span className="label">{t("Preferred contact method")}</span>
            <label className="mr-4 inline-flex items-center gap-2 text-sm"><input type="radio" name="contactMethod" value="whatsapp" defaultChecked /> WhatsApp</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="contactMethod" value="phone" /> {t("Phone call")}</label>
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="display px-1 text-xl">{t("Delivery")}</legend>
          {([
            ["pickup", "Shop Pickup — Kariakoo, Dar es Salaam"],
            ["local", "Local Delivery — subject to confirmation"],
            ["regions", "Delivery to Other Regions — subject to confirmation"],
          ] as const).map(([v, label]) => (
            <label key={v} className="flex items-center gap-2 text-sm font-bold">
              <input type="radio" name="deliveryMethod" checked={method === v} onChange={() => setMethod(v)} /> {t(label)}
            </label>
          ))}
          {method === "pickup" ? (
            <p className="rounded-md bg-surface p-3 text-sm">{t("Pick up at:")} <b>{SITE.address}</b></p>
          ) : (
            <>
              <p className="text-xs text-muted">{t("Delivery times and charges are confirmed by Woodland. No delivery fee is added until confirmed.")}</p>
              <div><label className="label" htmlFor="deliveryLocation">{t("Delivery location")} *</label><input id="deliveryLocation" name="deliveryLocation" className="field" placeholder={t("Area, street, landmark")} />{err("deliveryLocation")}</div>
              <div><label className="label" htmlFor="region">{t("Region or city")} *</label><input id="region" name="region" className="field" />{err("region")}</div>
            </>
          )}
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="display px-1 text-xl">{t("Vehicle (optional)")}</legend>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="vehicleMake">{t("Make")}</label><input id="vehicleMake" name="vehicleMake" className="field" /></div>
            <div><label className="label" htmlFor="vehicleModel">{t("Model")}</label><input id="vehicleModel" name="vehicleModel" className="field" /></div>
            <div><label className="label" htmlFor="vehicleYear">{t("Year")}</label><input id="vehicleYear" name="vehicleYear" className="field" inputMode="numeric" /></div>
            <div><label className="label" htmlFor="engine">{t("Engine type")}</label><input id="engine" name="engine" className="field" /></div>
          </div>
          <div><label className="label" htmlFor="chassis">{t("Chassis number")}</label><input id="chassis" name="chassis" className="field" /></div>
          <div><label className="label" htmlFor="fitment">{t("ADDITIONAL FITMENT INFORMATION")}</label><textarea id="fitment" name="fitment" rows={3} className="field" placeholder={t("Helpful if you do not know the exact part number")} /></div>
        </fieldset>

        <div className="card p-4">
          <label className="label" htmlFor="notes">{t("Order notes")}</label>
          <textarea id="notes" name="notes" rows={3} className="field" />
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-bold text-brand">{t(error)}</p>}
        <button type="submit" className="btn btn-red w-full">{t("Review order")}</button>
      </form>

      {review && (
        <div className="space-y-4">
          <h2 className="text-3xl">{t("Review your order")}</h2>
          <ReviewDetails form={formRef.current!} method={method} />
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-bold text-brand">{error}</p>}
          <button className="btn btn-wa w-full" onClick={send} disabled={busy}>{busy ? t("Saving your order…") : t("Send order via WhatsApp")}</button>
          <button className="btn btn-outline w-full" onClick={() => setReview(false)} disabled={busy}>{t("Edit details")}</button>
          <p className="text-xs text-muted">
            {t("Your order is saved first, then WhatsApp opens with your message ready.")} <b>{t("You must press Send in WhatsApp")}</b> {t("for Woodland to receive it.")}
          </p>
        </div>
      )}

      <aside className="card card-grey h-fit space-y-3 p-4 lg:sticky lg:top-32">
        <h2 className="text-2xl">{t("Your items")}</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span>{l.qty} × {l.product?.name ?? t("Unavailable")}{l.problem && <b className="text-brand"> ({t(l.problem)})</b>}</span>
              <span className="shrink-0">{l.product?.price ? tsh(l.product.price * l.qty) : t("On request")}</span>
            </li>
          ))}
        </ul>
        <Totals known={known} unknown={unknown} />
        <Link href="/cart" className="text-sm font-bold underline">{t("Edit cart")}</Link>
      </aside>
    </div>
  );
}

function ReviewDetails({ form, method }: { form: HTMLFormElement; method: string }) {
  const t = useT();
  const f = new FormData(form);
  const v = (k: string) => String(f.get(k) ?? "").trim();
  const rows: [string, string][] = [
    [t("Name"), v("name")], ["WhatsApp", v("whatsapp")], [t("Alternative phone"), v("altPhone")], ["Email", v("email")],
    [t("Delivery"), method === "pickup" ? `${t("Shop pickup")} — ${SITE.address}` : `${method === "local" ? t("Local delivery") : t("Other region")}: ${v("deliveryLocation")}, ${v("region")}`],
    [t("Vehicle"), [v("vehicleMake"), v("vehicleModel"), v("vehicleYear"), v("engine"), v("chassis")].filter(Boolean).join(" ")],
    [t("Fitment info"), v("fitment")], [t("Notes"), v("notes")],
  ];
  return (
    <dl className="card divide-y divide-line text-sm">
      {rows.filter(([, val]) => val).map(([k, val]) => (
        <div key={k} className="grid grid-cols-[120px_1fr] gap-2 p-3"><dt className="text-muted">{k}</dt><dd className="break-words">{val}</dd></div>
      ))}
    </dl>
  );
}
