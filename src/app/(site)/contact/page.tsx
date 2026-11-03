import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { SITE, waLink } from "@/lib/site";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact WOODLAND INTERNATIONAL STORE in Kariakoo, Dar es Salaam by phone, WhatsApp or enquiry form.",
  alternates: { canonical: "/contact" },
};

export default async function Contact() {
  const t = await getT();
  const hours = await getSetting("business_hours");
  const map = await getSetting("map_embed_url");
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl">{t("Contact us")}</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl">{SITE.name}</h2>
            <p className="mt-1 text-sm">{SITE.address}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <a className="btn btn-outline" href={`tel:+${SITE.whatsapp}`}>{t("Call")} {SITE.whatsappDisplay}</a>
            <a className="btn btn-outline" href={`tel:+${SITE.altPhone}`}>{t("Call")} {SITE.altPhoneDisplay}</a>
            <a className="btn btn-wa" href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
            <a className="btn btn-outline" href={SITE.instagramUrl} target="_blank" rel="noopener">Instagram {SITE.instagramHandle}</a>
          </div>
          <div>
            <h2 className="text-2xl">{t("Opening hours")}</h2>
            <p className="mt-1 whitespace-pre-line text-sm">{hours || t("Opening hours to be confirmed. Please contact us on WhatsApp.")}</p>
          </div>
          <div>
            <h2 className="text-2xl">{t("Location")}</h2>
            {map ? (
              <iframe title="Woodland International Store location" src={map} loading="lazy" className="mt-2 h-64 w-full rounded-lg border border-line" />
            ) : (
              <p className="mt-1 text-sm text-muted">{t("Visit us at")} {SITE.address}. {t("An interactive map will be added once the exact location is verified by the business.")}</p>
            )}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-2xl">{t("Send an enquiry")}</h2>
          <div className="mt-3"><EnquiryForm /></div>
        </div>
      </div>
    </div>
  );
}
