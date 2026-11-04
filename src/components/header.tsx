import Link from "next/link";
import { categories } from "@/lib/catalog";
import { getT } from "@/lib/i18n-server";
import { SITE, waLink } from "@/lib/site";
import { LangToggle } from "./lang-toggle";
import { CartLink } from "./cart-link";
import { SearchBox } from "./search-box";

const WA_ICON = "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .9 2.2.1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z";

export function Logo({ light = false, size = 56 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" aria-label="Woodland International Store home" className="group flex items-center gap-2.5 leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.webp"
        alt=""
        width={size}
        height={Math.round(size * 0.935)}
        className={`shrink-0 transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105 ${light ? "rounded-md bg-white p-1" : ""}`}
        style={{ height: size * 0.935, width: size }}
      />
      <span className="flex flex-col">
        <span className="display text-[27px] text-brand">Woodland</span>
        <span className={`display text-[12.5px] tracking-[0.02em] ${light ? "text-white" : "text-ink"}`}>International Store</span>
      </span>
    </Link>
  );
}

/** Short labels for the red bar. Falls back to the category name for anything the owner adds later. */
const SHORT: Record<string, string> = {
  "engine-parts": "Engine", "suspension-parts": "Suspension", "brake-systems": "Brakes", "filters-lubricants": "Filters",
  "electrical-parts": "Electrical", "lighting-systems": "Lighting", "body-parts": "Body parts",
};
const BAR = ["engine-parts", "suspension-parts", "brake-systems", "filters-lubricants", "electrical-parts", "lighting-systems", "body-parts"];

export async function Header() {
  const t = await getT();
  const cats = await categories();
  const bar = BAR.map((s) => cats.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <header className="sticky top-0 z-40 no-print">
      <div className="topbar">
        <div className="container-x flex items-center justify-between gap-2 py-2 text-[11px] font-bold uppercase tracking-wide sm:gap-3 sm:text-xs">
          <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap"><svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>{t("Genuine auto spare parts")}</span>
          <span className="hidden items-center gap-1.5 sm:flex"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>Kariakoo, Dar es Salaam</span>
          <a href={waLink()} target="_blank" rel="noopener" className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap" aria-label={t("WhatsApp us")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366"><path d={WA_ICON} /></svg>
            <span className="hidden sm:inline">{t("WhatsApp ordering available")}</span>
          </a>
          <LangToggle />
          <a href={SITE.instagramUrl} target="_blank" rel="noopener" aria-label="Instagram" className="hidden sm:block">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
          </a>
        </div>
      </div>

      <div className="border-b border-line bg-white/95 backdrop-blur-xl">
        <div className="container-x flex items-center gap-3 py-2.5">
          <Logo />
          <div className="ml-4 hidden max-w-xl flex-1 md:block"><SearchBox button /></div>
          <Link href="/track" className="ml-auto hidden whitespace-nowrap text-sm font-bold hover:text-brand md:inline">{t("Track order")}</Link>
          <a href={waLink()} className="btn btn-wa hidden whitespace-nowrap md:inline-flex" target="_blank" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={WA_ICON} /></svg>{t("WhatsApp us")}
          </a>
          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <details className="relative md:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg" aria-label={t("Search")}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              </summary>
              <div className="fixed inset-x-0 top-[88px] z-50 border-b border-line bg-white p-3 shadow-xl"><SearchBox /></div>
            </details>
            <CartLink />
            <details className="relative lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg" aria-label="Menu">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              </summary>
              <div className="absolute right-0 top-12 z-50 max-h-[75vh] w-72 overflow-auto rounded-xl border border-line bg-white p-2 shadow-2xl">
                {[{ href: "/shop", label: "Shop all parts" }, { href: "/categories", label: "Categories" }, { href: "/finder", label: "Vehicle finder" }, { href: "/track", label: "Track order" }, { href: "/contact", label: "Contact us" }, { href: "/about", label: "About Woodland" }, { href: "/faq", label: "FAQ" }].map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-surface">{t(n.label)}</Link>
                ))}
                <a href={`tel:+${SITE.whatsapp}`} className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-surface">{t("Call")} {SITE.whatsappDisplay}</a>
              </div>
            </details>
          </div>
        </div>
      </div>

      <nav aria-label="Main" className="rednav hidden lg:block">
        <div className="container-x flex items-stretch">
          <details className="group relative">
            <summary className="flex h-12 cursor-pointer list-none items-center gap-2 whitespace-nowrap pr-4 xl:pr-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              {t("Shop all")}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="absolute left-0 top-12 z-50 grid w-[560px] grid-cols-2 gap-1 rounded-b-xl border border-line bg-white p-3 text-ink shadow-2xl">
              <Link href="/shop" className="col-span-2 rounded-lg bg-surface px-3 py-2.5 text-sm font-extrabold uppercase text-brand">{t("All spare parts")}</Link>
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="rounded-lg px-3 py-2.5 text-sm font-semibold normal-case hover:bg-surface">{t(c.name)}</Link>
              ))}
            </div>
          </details>
          {bar.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex h-12 items-center whitespace-nowrap border-l border-white/25 px-3 transition hover:bg-white/10 xl:px-4">{t(SHORT[c.slug] ?? c.name)}</Link>
          ))}
          <Link href="/finder" className="ml-auto flex h-12 items-center gap-2 whitespace-nowrap border-l border-white/25 pl-4 xl:pl-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 16l1.5-5h11L19 16M5 16v3h2v-1.5h10V19h2v-3M5 16h14M8 13h.01M16 13h.01" /></svg>
            {t("Vehicle finder")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
