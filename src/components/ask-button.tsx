"use client";

import { useLang } from "@/lib/i18n";
import { translate } from "@/lib/i18n-core";
import { SITE, waLink } from "@/lib/site";

/** "Ask": opens WhatsApp with a ready message about this exact part, including its page link. */
export function AskButton({
  name, partNumber, slug, className = "", label,
}: { name: string; partNumber: string; slug: string; className?: string; label?: string }) {
  const lang = useLang();
  const text = [
    "WOODLAND INTERNATIONAL STORE",
    "QUESTION ABOUT A PART",
    `Product: ${name}`,
    `Part Number: ${partNumber || "-"}`,
    `Product Page: ${SITE.url}/product/${slug}`,
    "",
    "Please confirm availability, price and fitment.",
  ].join("\n");
  return (
    <a
      href={waLink(text, SITE.whatsapp)}
      target="_blank"
      rel="noopener"
      className={`btn btn-outline btn-sm !px-2 ${className}`}
      aria-label={`${translate(lang, "Ask")}: ${name}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.2A8 8 0 1121 12z" /></svg>
      {label ?? translate(lang, "Ask")}
    </a>
  );
}
