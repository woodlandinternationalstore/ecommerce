import Link from "next/link";
import { categories, featuredProducts, vehicleSummaries, effectiveStock, maxOrderQty } from "@/lib/catalog";
import { all } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { SITE, tsh, VEHICLE_BRANDS, waLink } from "@/lib/site";
import { AddToCart } from "@/components/add-to-cart";
import { AskButton } from "@/components/ask-button";
import { Gear } from "@/components/gear";
import { HomeFinder, type FinderMake } from "@/components/home-finder";
import { HeroScene } from "@/components/hero-scene";
import { Reveal, Tilt } from "@/components/motion";
import { ProductImage, StockBadge } from "@/components/product-bits";

const WA_ICON = "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .9 2.2.1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z";

const WHY = [
  ["Genuine parts", "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM8.5 12l2.5 2.5L15.5 10"],
  ["Quality guaranteed", "M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 14l-1.5 7 5-3 5 3-1.5-7"],
  ["Trusted service", "M3 12l5 5 3-3 3 3 7-7M3 12l4-4 4 3 3-3 5 4"],
  ["Competitive prices", "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01"],
  ["Order via WhatsApp", WA_ICON],
  ["Kariakoo location", "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"],
] as const;

export default async function Home() {
  const t = await getT();
  const [cats, featured] = await Promise.all([categories(), featuredProducts(10)]);
  const [vehicles, makeRows, modelRows, genRows] = await Promise.all([
    vehicleSummaries(featured.map((p) => p.id)),
    all<{ id: number; name: string }>("SELECT id, name FROM vehicle_makes ORDER BY name"),
    all<{ id: number; make_id: number; name: string }>("SELECT id, make_id, name FROM vehicle_models ORDER BY name"),
    all<{ id: number; model_id: number; name: string }>("SELECT id, model_id, name FROM vehicle_generations ORDER BY year_from NULLS LAST, name"),
  ]);
  const makes: FinderMake[] = makeRows.map((mk) => ({
    name: mk.name,
    models: modelRows.filter((m) => m.make_id === mk.id).map((m) => ({ name: m.name, gens: genRows.filter((g) => g.model_id === m.id).map((g) => ({ id: g.id, name: g.name })) })),
  }));

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero-light">
        <div className="container-x relative grid items-center lg:min-h-[540px] lg:grid-cols-[0.95fr_1.3fr]">
          <div className="relative z-10 py-8 lg:py-14">
            <h1 className="hero-in text-[clamp(2rem,4.2vw,3.2rem)] leading-[1.12]" style={{ "--d": "60ms" } as React.CSSProperties}>
              {t("The right part.")}<br /><span className="text-brand">{t("The right fit.")}</span><br />{t("The Woodland standard.")}
            </h1>
            <p className="hero-in mt-5 max-w-md text-[16.5px] font-medium leading-relaxed text-ink-2" style={{ "--d": "260ms" } as React.CSSProperties}>
              {t("Find quality automotive spare parts for Toyota, Nissan, Ford, Mitsubishi, Foton and other supported vehicle brands. Find the part you need and confirm your order directly with us.")}
            </p>
            <div className="hero-in mt-6 flex flex-col gap-3 sm:flex-row" style={{ "--d": "420ms" } as React.CSSProperties}>
              <Link href="/shop" className="btn btn-red">{t("Shop all parts")} <span aria-hidden="true">→</span></Link>
              <Link href="/finder" className="btn btn-outline hidden border-brand text-brand sm:inline-flex">{t("Find parts for my vehicle")} <span aria-hidden="true">→</span></Link>
            </div>
            <ul className="hero-in mt-6 hidden gap-6 text-xs font-bold leading-tight sm:flex" style={{ "--d": "560ms" } as React.CSSProperties}>
              {[[t("Automotive"), t("Spare parts")], [t("Vehicle fitment"), t("assistance")], [t("Direct WhatsApp"), t("ordering")]].map(([a, b], i) => (
                <li key={a} className={`flex items-center gap-2 ${i ? "border-l border-line pl-6" : ""}`}>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 7" /></svg>
                  </span>
                  <span>{a}<br />{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative -mx-5 lg:mx-0">
            <HeroScene alt="Toyota Hilux and Land Cruiser Prado with automotive spare parts" />
          </div>
        </div>
      </section>

      {/* ---------------- VEHICLE FINDER ---------------- */}
      <section className="container-x relative z-10 -mt-3 lg:-mt-5">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-26px_rgba(23,24,27,0.5)] ring-1 ring-line lg:grid lg:grid-cols-[330px_1fr]">
            <div className="relative flex items-center gap-4 bg-brand p-5 text-white lg:slant-red">
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0"><path d="M5 16l1.5-5h11L19 16M5 16v3h2v-1.5h10V19h2v-3M5 16h14M8 13h.01M16 13h.01" /></svg>
              <div>
                <h2 className="text-xl leading-tight sm:text-2xl">{t("Find the right part for your vehicle")}</h2>
                <p className="mt-1 text-xs text-white/85">{t("Start with your vehicle details to discover compatible spare parts.")}</p>
              </div>
            </div>
            <div className="p-4 sm:p-5"><HomeFinder makes={makes} /></div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- BRAND MARQUEE ---------------- */}
      <section className="marquee marquee-pause mt-10 overflow-hidden bg-ink py-3.5" aria-label="Vehicle brands">
        <div className="marquee-track">
          {[...VEHICLE_BRANDS, ...VEHICLE_BRANDS, ...VEHICLE_BRANDS, ...VEHICLE_BRANDS].map((b, i) => (
            <Link key={`${b}-${i}`} href={`/shop?q=${encodeURIComponent(b)}`} className="display mx-7 flex items-center gap-7 text-xl text-white/85 transition hover:text-white">
              {b}<span className="text-brand" aria-hidden="true">✦</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- SHOP BY CATEGORY ---------------- */}
      <section className="container-x mt-12 lg:mt-14">
        <Reveal>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4">
              <h2 className="bar-title text-2xl sm:text-3xl">{t("Shop by category")}</h2>
              <p className="hidden text-xs text-muted sm:block">{t("Everything you need to keep your vehicle performing at its best.")}</p>
            </div>
            <Link href="/categories" className="btn btn-outline btn-sm whitespace-nowrap">{t("View all categories")} <span aria-hidden="true">→</span></Link>
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:flex lg:gap-2 lg:overflow-x-auto lg:pb-2 lg:[scrollbar-width:none]">
            {cats.map((c) => (
              <li key={c.id} className="lg:w-[118px] lg:shrink-0">
                <Tilt max={9} className="h-full"><Link href={`/category/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_16px_30px_-18px_rgba(23,24,27,0.5)]">
                  <span className="block h-[88px] overflow-hidden bg-white sm:h-24">
                    {c.cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={c.cover} alt="" loading="lazy" className="h-full w-full object-contain p-2 transition duration-700 group-hover:scale-110" />
                      : <span className="grid h-full place-items-center text-silver"><Gear teeth={10} className="h-10 w-10" /></span>}
                  </span>
                  <span className="flex flex-1 items-center justify-between gap-1 px-2.5 pb-3 pt-1 text-[13px] font-bold leading-tight">
                    <span>{t(c.name)}</span><span className="text-brand" aria-hidden="true">→</span>
                  </span>
                </Link></Tilt>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      <section className="container-x mt-10">
        <Reveal>
          <div className="flex items-end justify-between gap-3">
            <h2 className="bar-title text-2xl sm:text-3xl">{t("Featured products")}</h2>
            <Link href="/shop" className="btn btn-outline btn-sm whitespace-nowrap">{t("View all products")} <span aria-hidden="true">→</span></Link>
          </div>
        </Reveal>
        {featured.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 5) * 70}>
                <Tilt max={5} className="h-full"><article className="pcard flex h-full gap-3 rounded-xl border border-line bg-white p-3 xl:flex-col">
                  <Link href={`/product/${p.slug}`} className="pimg block w-24 shrink-0 overflow-hidden rounded-lg xl:w-full">
                    <ProductImage src={p.main_image} alt={`${p.name} ${p.oem_number}`.trim()} className="h-24 w-full xl:h-36" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/product/${p.slug}`} className="pname text-[15.5px] hover:text-brand">{p.name}</Link>
                    <span className="partno text-[12.5px] text-muted">{p.oem_number}</span>
                    {vehicles.get(p.id) && <span className="text-[11px] text-muted">{vehicles.get(p.id)}</span>}
                    {effectiveStock(p) !== "tbc" && <span><StockBadge p={p} /></span>}
                    <span className="mt-auto pt-1 text-base font-extrabold text-brand">
                      {p.price_mode === "exact" && p.price_tzs ? tsh(p.price_tzs) : <span className="text-sm">{t("Price on request")}</span>}
                    </span>
                    <AddToCart productId={p.id} maxQty={maxOrderQty(p)} compact />
                    <AskButton name={p.name} partNumber={p.oem_number} slug={p.slug} className="w-full" />
                  </div>
                </article></Tilt>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card card-grey mt-4 p-6 text-center">
            <p className="font-bold">{t("Featured products will appear here once they are published.")}</p>
            <Link href="/shop" className="btn btn-red btn-sm mt-3">{t("Browse all products")}</Link>
          </div>
        )}
      </section>

      {/* ---------------- TRUST STRIP (mobile) ---------------- */}
      <section className="container-x mt-8 lg:hidden">
        <ul className="grid grid-cols-3 divide-x divide-line rounded-xl bg-surface py-3 text-center text-[11px] font-bold leading-tight">
          {["Genuine parts", "Trusted service", "Best prices"].map((label) => (
            <li key={label} className="flex flex-col items-center gap-1 px-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM8.5 12l2.5 2.5L15.5 10" /></svg>
              {t(label)}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- WHY + CONTACT BAND ---------------- */}
      <section className="mt-10 overflow-hidden bg-white lg:mt-12">
        <div className="hidden bg-white lg:grid lg:grid-cols-[250px_1fr_360px]">
          <div className="flex items-center bg-ink px-8 py-6 [clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]">
            <h2 className="text-3xl leading-none text-white">{t("Why choose Woodland?")}</h2>
          </div>
          <ul className="grid grid-cols-6 items-center divide-x divide-line">
            {WHY.map(([label, d]) => (
              <li key={label} className="flex flex-col items-center gap-2 px-2 py-4 text-center text-[10.5px] font-extrabold uppercase leading-tight">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c8102e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                {t(label)}
              </li>
            ))}
          </ul>
          <ContactBlock t={t} />
        </div>
        <div className="container-x grid gap-3 pb-6 lg:hidden">
          <a href={waLink()} target="_blank" rel="noopener" className="flex items-center gap-4 rounded-xl bg-wa p-4 text-[#06230f] shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d={WA_ICON} /></svg>
            <span><span className="display block text-xl">{t("Order directly on WhatsApp")}</span><span className="text-sm font-semibold">{t("Click to chat with us")}</span></span>
          </a>
          <div className="flex items-center gap-3 rounded-xl bg-brand p-4 text-white">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <span className="text-sm font-bold">Kariakoo, Ungoni &amp; Kipande Street, Dar es Salaam<br /><a href={`tel:+${SITE.whatsapp}`} className="font-extrabold">{SITE.whatsappDisplay}</a> · <a href={`tel:+${SITE.altPhone}`} className="font-extrabold">{SITE.altPhoneDisplay}</a></span>
          </div>
        </div>
      </section>

      {/* ---------------- INSTAGRAM ---------------- */}
      <section className="container-x mt-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-center text-white sm:p-10">
            <div className="absolute -left-10 -top-10 h-44 w-44 text-brand/30" aria-hidden="true"><Gear teeth={12} className="gear-spin h-full w-full" /></div>
            <div className="absolute -bottom-12 -right-8 h-52 w-52 text-white/[0.06]" aria-hidden="true"><Gear teeth={14} className="gear-spin-rev h-full w-full" /></div>
            <h2 className="relative text-3xl">{t("Follow us on Instagram")}</h2>
            <p className="relative mx-auto mt-2 max-w-lg text-sm text-silver">{t("Follow {handle} for new arrivals, product education and updates.", { handle: SITE.instagramHandle })}</p>
            <a href={SITE.instagramUrl} target="_blank" rel="noopener" className="btn btn-red relative mt-5">{t("Follow on Instagram")}</a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ContactBlock({ t }: { t: (s: string) => string }) {
  return (
    <div className="relative flex items-center gap-4 bg-brand px-8 py-5 text-white [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
      <div className="pl-6 text-[11px] font-bold leading-snug">
        <p className="uppercase">Kariakoo – Ungoni &amp; Kipande Street</p>
        <p className="text-white/85">Dar es Salaam, Tanzania</p>
        <p className="mt-1 text-base font-extrabold">
          <a href={`tel:+${SITE.whatsapp}`}>{SITE.whatsappDisplay}</a><br /><a href={`tel:+${SITE.altPhone}`}>{SITE.altPhoneDisplay}</a>
        </p>
      </div>
      <a href={waLink()} target="_blank" rel="noopener" aria-label={t("Order on WhatsApp")} className="ml-auto grid h-14 w-14 shrink-0 place-items-center rounded-full bg-wa text-[#06230f] pulse-wa">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d={WA_ICON} /></svg>
      </a>
    </div>
  );
}
