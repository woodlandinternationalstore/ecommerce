import Link from "next/link";
import { SITE, waLink } from "@/lib/site";
import { CartLink } from "./cart-link";
import { SearchBox } from "./search-box";

export function Logo({ light = false, size = 52 }: { light?: boolean; size?: number }) {
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
        <span className="display text-[22px] tracking-tight text-brand">WOODLAND</span>
        <span className={`text-[9.5px] font-semibold uppercase tracking-[0.24em] ${light ? "text-white" : "text-ink"}`}>International Store</span>
      </span>
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
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-xl no-print">
      <div className="bg-ink px-4 py-1.5 text-center text-[10.5px] font-bold tracking-[0.12em] text-white sm:text-xs">
        GENUINE AUTO SPARE PARTS <span className="mx-1 text-brand">|</span> QUALITY GUARANTEED <span className="mx-1 text-brand">|</span> KARIAKOO, DAR ES SALAAM
      </div>
      <div className="container-x flex items-center gap-3 py-2">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="group relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold">
              {n.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox />
        </div>
        <a href={waLink()} className="btn btn-wa btn-sm ml-auto hidden whitespace-nowrap md:ml-0 md:inline-flex" target="_blank" rel="noopener">
          WhatsApp
        </a>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <CartLink />
          <details className="relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-line" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-line bg-white p-2 shadow-2xl">
              {[...NAV, { href: "/about", label: "About Woodland" }, { href: "/faq", label: "FAQ" }].map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-surface">
                  {n.label}
                </Link>
              ))}
              <a href={`tel:+${SITE.whatsapp}`} className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-surface">
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
