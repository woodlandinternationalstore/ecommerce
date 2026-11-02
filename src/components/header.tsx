import Link from "next/link";
import { SITE, waLink } from "@/lib/site";
import { CartLink } from "./cart-link";
import { SearchBox } from "./search-box";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="Woodland International Store home" className="flex flex-col leading-none">
      <span className="display text-[26px] text-brand">WOODLAND</span>
      <span className={`display text-[11px] tracking-[0.18em] ${light ? "text-white" : "text-ink"}`}>INTERNATIONAL STORE</span>
    </Link>
  );
}

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/finder", label: "Vehicle Finder" },
  { href: "/contact", label: "Contact Us" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white no-print">
      <div className="bg-ink px-4 py-1.5 text-center text-[11px] font-bold tracking-wide text-white sm:text-xs">
        GENUINE AUTO SPARE PARTS | QUALITY GUARANTEED | KARIAKOO, DAR ES SALAAM
      </div>
      <div className="container-x flex items-center gap-3 py-2.5">
        <Logo />
        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-bold uppercase tracking-wide hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox />
        </div>
        <a href={waLink()} className="btn btn-wa btn-sm ml-auto hidden md:ml-0 md:inline-flex" target="_blank" rel="noopener">
          Order via WhatsApp
        </a>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <CartLink />
          <details className="relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-line" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-60 rounded-lg border border-line bg-white p-2 shadow-lg">
              {[...NAV, { href: "/about", label: "About Woodland" }, { href: "/faq", label: "FAQ" }].map((n) => (
                <Link key={n.href} href={n.href} className="block rounded px-3 py-3 text-sm font-bold uppercase hover:bg-surface">
                  {n.label}
                </Link>
              ))}
              <a href={`tel:+${SITE.whatsapp}`} className="block rounded px-3 py-3 text-sm font-bold uppercase hover:bg-surface">
                Call {SITE.whatsappDisplay}
              </a>
            </div>
          </details>
        </div>
      </div>
      <div className="container-x pb-2.5 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
