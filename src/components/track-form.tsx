"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackOrder } from "@/app/(site)/track/actions";
import { useT } from "@/lib/i18n";

export function TrackForm() {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const res = await trackOrder(String(f.get("ref") ?? ""), String(f.get("phone") ?? ""));
    if (res.ok) router.push(res.url);
    else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5" noValidate>
      <div>
        <label className="label" htmlFor="t-ref">{t("Order reference")}</label>
        <input id="t-ref" name="ref" className="field partno" placeholder="WIS-20261102-0001" autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="t-phone">{t("Phone number used on the order")}</label>
        <input id="t-phone" name="phone" className="field" inputMode="tel" placeholder="+255 7XX XXX XXX" autoComplete="tel" required />
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-bold text-brand">{t(error)}</p>}
      <button className="btn btn-red w-full" disabled={busy}>{busy ? t("Checking…") : t("Track my order")}</button>
    </form>
  );
}
