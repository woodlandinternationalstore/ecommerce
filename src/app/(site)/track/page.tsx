import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";
import { TrackForm } from "@/components/track-form";

export const metadata: Metadata = { title: "Track your order", alternates: { canonical: "/track" } };

export default async function TrackPage() {
  const t = await getT();
  return (
    <div className="container-x max-w-xl py-10">
      <p className="eyebrow">{t("Order tracking")}</p>
      <h1 className="mt-2 text-4xl">{t("Track your order")}</h1>
      <p className="mt-2 text-sm text-muted">{t("Enter the order reference you were given and the phone number you used when ordering.")}</p>
      <div className="mt-6"><TrackForm /></div>
      <p className="mt-4 text-xs text-muted">{t("Your reference looks like WIS-20261102-0001 and is shown on the confirmation page and in your WhatsApp message.")}</p>
    </div>
  );
}
