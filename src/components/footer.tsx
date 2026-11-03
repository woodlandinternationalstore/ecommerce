import Link from "next/link";
import { categories } from "@/lib/catalog";
import { getSetting } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { SITE, waLink } from "@/lib/site";
import { Logo } from "./header";
import { MobileBar } from "./mobile-bar";

export async function Footer() {
  const t = await getT();
  const cats = (await categories()).slice(0, 8);
  const hours = await getSetting("business_hours");
  return (
    <>
      <footer className="mt-16 bg-ink pb-24 text-white md:pb-0 no-print">
        <div className="container-x grid gap-10 py-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-silver">
              {t("WOODLAND INTERNATIONAL STORE supplies automotive spare parts in Kariakoo, Dar es Salaam, helping customers find suitable parts for their vehicles through convenient online browsing and direct WhatsApp ordering.")}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg">{t("Categories")}</h3>
            <ul className="space-y-2 text-sm text-silver">
              {cats.map((c) => (
                <li key={c.id}><Link className="hover:text-white" href={`/category/${c.slug}`}>{t(c.name)}</Link></li>
              ))}
              {cats.length === 0 && <li>{t("Categories coming soon")}</li>}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg">{t("Contact")}</h3>
            <ul className="space-y-2 text-sm text-silver">
              <li>{SITE.address}</li>
              <li><a className="hover:text-white" href={`tel:+${SITE.whatsapp}`}>{SITE.whatsappDisplay}</a></li>
              <li><a className="hover:text-white" href={`tel:+${SITE.altPhone}`}>{SITE.altPhoneDisplay}</a></li>
              <li><a className="hover:text-white" href={SITE.instagramUrl} target="_blank" rel="noopener">Instagram {SITE.instagramHandle}</a></li>
            </ul>
            <a href={waLink()} target="_blank" rel="noopener" className="btn btn-wa btn-sm mt-4">{t("WhatsApp us")}</a>
          </div>
          <div>
            <h3 className="mb-3 text-lg">{t("Business hours")}</h3>
            <p className="whitespace-pre-line text-sm text-silver">{hours || t("Opening hours to be confirmed. Please contact us on WhatsApp.")}</p>
            <ul className="mt-5 space-y-2 text-sm text-silver">
              <li><Link className="hover:text-white" href="/privacy">{t("Privacy Policy")}</Link></li>
              <li><Link className="hover:text-white" href="/terms">{t("Terms and Conditions")}</Link></li>
              <li><Link className="hover:text-white" href="/track">{t("Track order")}</Link></li>
              <li><Link className="hover:text-white" href="/faq">{t("FAQ")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs text-silver">
          © {new Date().getFullYear()} WOODLAND INTERNATIONAL STORE. {t("All rights reserved.")}
        </div>
      </footer>
      <MobileBar />
    </>
  );
}
