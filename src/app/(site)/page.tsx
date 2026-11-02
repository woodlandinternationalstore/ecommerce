import Link from "next/link";
import { categories, featuredProducts, publicStats, vehicleSummaries } from "@/lib/catalog";
import { SITE, VEHICLE_BRANDS, waLink } from "@/lib/site";
import { CategoryBrowser } from "@/components/category-browser";
import { Gear } from "@/components/gear";
import { CountUp, Reveal, Tilt } from "@/components/motion";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";

const WHY = [
  ["Genuine parts", "Help customers identify suitable genuine and quality spare parts.", "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"],
  ["Quality guaranteed", "Accurate product information and any applicable warranty terms configured by the business.", "M5 12l5 5L20 7"],
  ["Trusted service", "Direct assistance from the Woodland sales team.", "M4 5h16v11H8l-4 4z"],
  ["Competitive prices", "Enquire about product pricing and availability.", "M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"],
  ["Convenient ordering", "Submit orders directly through WhatsApp.", "M21 12a9 9 0 11-4-7.5L21 3l-1 4.5A9 9 0 0121 12z"],
  ["Kariakoo location", "Easy to locate: Ungoni & Kipande Street, Kariakoo.", "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"],
] as const;

export default async function Home() {
  const [cats, featured, stats] = await Promise.all([categories(), featuredProducts(8), publicStats()]);
  const vehicles = await vehicleSummaries(featured.map((p) => p.id));
  const headline = ["All your car", "spare parts", "in one place"];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero text-white">
        <div className="hero-glow -right-24 top-10" aria-hidden="true" />
        <div className="absolute -left-24 bottom-[-120px] h-[420px] w-[420px] text-white/[0.04]" aria-hidden="true"><Gear teeth={14} className="gear-spin h-full w-full" /></div>
        <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="hero-in eyebrow" style={{ "--d": "0ms" } as React.CSSProperties}>Premium auto parts</p>
            <h1 className="mt-4 text-[clamp(2.8rem,8vw,5.4rem)]">
              {headline.map((line, i) => (
                <span key={line} className="hero-in block" style={{ "--d": `${120 + i * 140}ms` } as React.CSSProperties}>
                  {i === 1 ? <span className="text-brand">{line}</span> : line}
                </span>
              ))}
            </h1>
            <p className="hero-in mt-5 max-w-xl text-base text-silver sm:text-lg" style={{ "--d": "560ms" } as React.CSSProperties}>
              Find quality automotive spare parts for Toyota, Nissan, Ford, Mitsubishi, Foton and other supported vehicle brands.
            </p>
            <div className="hero-in mt-7 flex flex-col gap-3 sm:flex-row" style={{ "--d": "700ms" } as React.CSSProperties}>
              <Link href="/shop" className="btn btn-red pulse">Shop now</Link>
              <Link href="/finder" className="btn btn-ghost">Find your spare part</Link>
              <a href={waLink()} target="_blank" rel="noopener" className="btn btn-wa">Order via WhatsApp</a>
            </div>
            <div className="hero-in mt-6 max-w-xl rounded-xl bg-white p-3 text-ink shadow-2xl" style={{ "--d": "840ms" } as React.CSSProperties}>
              <SearchBox />
              <p className="mt-2 px-1 text-xs text-muted">Try 48068-0K090 · Hilux lower arm · Prado 150 brake pads</p>
            </div>
          </div>

          <div className="hero-in relative mx-auto w-full max-w-md" style={{ "--d": "400ms" } as React.CSSProperties}>
            <div className="absolute -right-6 -top-6 h-28 w-28 text-brand/90" aria-hidden="true"><Gear teeth={10} className="gear-spin h-full w-full" /></div>
            <div className="absolute -bottom-8 -left-8 h-36 w-36 text-silver/50" aria-hidden="true"><Gear teeth={12} className="gear-spin-rev h-full w-full" /></div>
            <Tilt max={9} className="relative">
              <div className="relative rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.webp" alt="Woodland International Store logo" className="depth-1 mx-auto w-full" width={900} height={843} />
                <span className="lift-3d absolute -left-4 top-8 rounded-lg bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xl floaty">Search by part number</span>
                <span className="lift-3d absolute -right-3 top-1/2 rounded-lg bg-brand px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-xl floaty" style={{ animationDelay: "-2s" }}>Vehicle finder</span>
                <span className="lift-3d absolute -bottom-4 left-10 rounded-lg bg-wa px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#06230f] shadow-xl floaty" style={{ animationDelay: "-4s" }}>Order on WhatsApp</span>
              </div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* ---------------- REAL STATS ---------------- */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-4 py-6 text-center sm:grid-cols-4">
          {[
            [stats.parts, "parts listed"],
            [stats.categories, "categories"],
            [VEHICLE_BRANDS.length, "vehicle brands"],
            [2, "contact lines"],
          ].map(([n, label]) => (
            <div key={label as string}>
              <CountUp to={n as number} className="display block text-4xl text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- BRAND MARQUEE ---------------- */}
      <section className="marquee overflow-hidden bg-ink py-4" aria-label="Vehicle brands">
        <div className="marquee-track">
          {[...VEHICLE_BRANDS, ...VEHICLE_BRANDS, ...VEHICLE_BRANDS, ...VEHICLE_BRANDS].map((b, i) => (
            <Link key={`${b}-${i}`} href={`/shop?q=${encodeURIComponent(b)}`} className="display mx-6 flex items-center gap-6 text-2xl text-white/80 transition hover:text-white">
              {b}<span className="text-brand">✦</span>
            </Link>
          ))}
        </div>
      </section>
      <p className="container-x mt-2 text-center text-[11px] text-muted">Shop by vehicle brand for compatibility browsing. Woodland is not an authorised dealer of these manufacturers.</p>

      {/* ---------------- CATEGORIES ---------------- */}
      <section className="container-x mt-12">
        <Reveal>
          <p className="eyebrow">Browse</p>
          <h2 className="section-title mt-2">Find your category</h2>
          <div className="mt-5"><CategoryBrowser cats={cats} variant="home" /></div>
        </Reveal>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      <section className="container-x mt-16">
        <Reveal>
          <div className="flex items-end justify-between gap-3">
            <div><p className="eyebrow">Selected parts</p><h2 className="section-title mt-2">Featured products</h2></div>
            <Link href="/shop" className="btn btn-outline btn-sm hidden sm:inline-flex">View all</Link>
          </div>
        </Reveal>
        {featured.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard p={p} vehicle={vehicles.get(p.id)} /></Reveal>)}
          </div>
        ) : (
          <div className="card card-grey mt-5 p-6 text-center">
            <p className="font-bold">Featured products will appear here once they are published.</p>
            <Link href="/shop" className="btn btn-red btn-sm mt-3">Browse all products</Link>
          </div>
        )}
        <Link href="/shop" className="btn btn-outline mt-5 w-full sm:hidden">View all products</Link>
      </section>

      {/* ---------------- WHY ---------------- */}
      <section className="relative mt-20 overflow-hidden bg-ink py-16 text-white">
        <div className="absolute -right-20 -top-20 h-80 w-80 text-white/[0.04]" aria-hidden="true"><Gear teeth={16} className="gear-spin-rev h-full w-full" /></div>
        <div className="container-x relative">
          <Reveal><p className="eyebrow">Our promise</p><h2 className="section-title mt-2">Why choose Woodland?</h2></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(([t, d, icon], i) => (
              <Reveal key={t} delay={(i % 3) * 100}>
                <Tilt max={7} className="h-full">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-brand/60 hover:bg-white/[0.07]">
                    <span className="depth-1 grid h-12 w-12 place-items-center rounded-xl bg-brand text-white shadow-[0_10px_24px_-8px_var(--red-glow)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                    </span>
                    <h3 className="mt-4 text-2xl">{t}</h3>
                    <p className="mt-1 text-sm text-silver">{d}</p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW TO ORDER ---------------- */}
      <section className="container-x mt-20">
        <Reveal><p className="eyebrow">Simple</p><h2 className="section-title mt-2">How to order</h2></Reveal>
        <ol className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Search", "Find your required spare part."],
            ["Add to cart", "Select the product and quantity."],
            ["Submit order", "Enter your contact and delivery information."],
            ["WhatsApp", "Send your complete order to Woodland and confirm the details with the sales team."],
          ].map(([t, d], i) => (
            <li key={t}>
              <Reveal delay={i * 110}>
                <Tilt max={6} className="h-full">
                  <div className="card h-full p-6">
                    <span className="display text-6xl leading-none text-brand/20">0{i + 1}</span>
                    <h3 className="-mt-3 text-2xl">{t}</h3>
                    <p className="mt-1 text-sm text-muted">{d}</p>
                  </div>
                </Tilt>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- INSTAGRAM ---------------- */}
      <section className="container-x mt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink-2 to-[#2a0b12] p-8 text-center text-white sm:p-12">
            <div className="absolute -left-10 -top-10 h-48 w-48 text-brand/25" aria-hidden="true"><Gear teeth={12} className="gear-spin h-full w-full" /></div>
            <div className="absolute -bottom-12 -right-8 h-56 w-56 text-white/[0.06]" aria-hidden="true"><Gear teeth={14} className="gear-spin-rev h-full w-full" /></div>
            <h2 className="section-title relative">Follow us on Instagram</h2>
            <p className="relative mx-auto mt-2 max-w-lg text-sm text-silver">Follow {SITE.instagramHandle} for new arrivals, product education and updates.</p>
            <a href={SITE.instagramUrl} target="_blank" rel="noopener" className="btn btn-red relative mt-5">Follow on Instagram</a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
