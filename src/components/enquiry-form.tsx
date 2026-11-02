"use client";

import { useState } from "react";
import { submitEnquiry } from "@/app/(site)/actions";

export function EnquiryForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ ref: string; waUrl: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "");
    const res = await submitEnquiry({ name: s("name"), phone: s("phone"), part: s("part"), vehicle: s("vehicle"), message: s("message") });
    setBusy(false);
    if (res.ok) setDone(res);
    else {
      setError(res.error);
      setErrors(res.fieldErrors ?? {});
    }
  }

  if (done) {
    return (
      <div className="card card-grey p-5" role="status">
        <p className="display text-sm tracking-widest text-brand">Enquiry saved</p>
        <p className="text-2xl font-bold">{done.ref}</p>
        <p className="mt-2 text-sm">Your enquiry is saved. To reach the sales team faster, send it on WhatsApp (press Send inside WhatsApp).</p>
        <a href={done.waUrl} target="_blank" rel="noopener" className="btn btn-wa mt-3">Send enquiry on WhatsApp</a>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-bold text-brand">{errors[k]}</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div><label className="label" htmlFor="e-name">Name *</label><input id="e-name" name="name" className="field" autoComplete="name" />{err("name")}</div>
      <div><label className="label" htmlFor="e-phone">Phone number *</label><input id="e-phone" name="phone" className="field" inputMode="tel" autoComplete="tel" />{err("phone")}</div>
      <div><label className="label" htmlFor="e-part">Product or part number</label><input id="e-part" name="part" className="field" /></div>
      <div><label className="label" htmlFor="e-vehicle">Vehicle make and model</label><input id="e-vehicle" name="vehicle" className="field" /></div>
      <div><label className="label" htmlFor="e-msg">Enquiry message *</label><textarea id="e-msg" name="message" rows={4} className="field" />{err("message")}</div>
      {error && <p role="alert" className="text-sm font-bold text-brand">{error}</p>}
      <button className="btn btn-red w-full" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button>
    </form>
  );
}
