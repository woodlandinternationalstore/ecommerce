import Link from "next/link";
import { all } from "@/lib/db";
import { categories, maxOrderQty, vehicleSummaries } from "@/lib/catalog";
import { getT } from "@/lib/i18n-server";
import { filterOptions, looksLikePartNumber, searchPartTypes, searchProducts, type SearchParams } from "@/lib/search";
import { SITE, tsh, waLink } from "@/lib/site";
import { AddToCart } from "./add-to-cart";
import { AskButton } from "./ask-button";
import { Reveal } from "./motion";
import { ProductCard } from "./product-card";
import { ProductImage } from "./product-bits";

type Sp = Record<string, string | undefined>;

export async function ProductList({ sp, basePath, fixedCategory }: { sp: Sp; basePath: string; fixedCategory?: string }) {
  const t = await getT();
  const category = fixedCategory ?? sp.category;
  const cats = await categories();
  const hasFilter = !!(sp.q || sp.make || sp.model || sp.brand || sp.avail);
  const mode: "variants" | "types" | "products" = sp.type ? "variants" : hasFilter ? "products" : "types";

  const link = (over: Sp) => {
    const merged: Sp = { ...sp, ...over };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v && !(fixedCategory && k === "category")) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const chips = (
    <nav aria-label={t("Categories")} className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {!fixedCategory && (
        <Link href={link({ category: undefined, type: undefined, page: undefined })} className={`chip shrink-0 ${!category ? "active" : ""}`}>{t("All parts")}</Link>
      )}
      {cats.map((c) => {
        const active = category === c.slug;
        const href = fixedCategory ? `/category/${c.slug}` : link({ category: c.slug, type: undefined, page: undefined });
        return <Link key={c.id} href={href} className={`chip shrink-0 ${active ? "active" : ""}`}>{t(c.name)}</Link>;
      })}
    </nav>
  );

  const toolbar = (showSort: boolean) => (
    <form action={basePath} method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
      {category && !fixedCategory && <input type="hidden" name="category" value={category} />}
      <div className="relative flex-1">
        <input name="q" defaultValue={sp.q} className="field pl-11" placeholder={t("Search part, part number or vehicle")} aria-label={t("Search")} />
        <svg className="pointer-events-none absolute left-3.5 top-3.5 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </div>
      {showSort && (
        <select name="sort" defaultValue={sp.sort ?? ""} className="field sm:w-52" aria-label={t("Sort by")}>
          <option value="">{t("Sort: Best match")}</option>
          <option value="name">{t("Name A–Z")}</option>
          <option value="price_asc">{t("Price: low to high")}</option>
          <option value="price_desc">{t("Price: high to low")}</option>
          <option value="newest">{t("Newest")}</option>
        </select>
      )}
      <button className="btn btn-red">{t("Search")}</button>
    </form>
  );

  // ---------- 1. browse by part type ----------
  if (mode === "types") {
    const res = await searchPartTypes({ category, page: Number(sp.page) || 1, pageSize: 24 });
    const pages = Math.max(1, Math.ceil(res.total / res.pageSize));
    return (
      <div>
        {chips}
        {toolbar(false)}
        <p className="mb-4 text-sm text-muted" aria-live="polite">{res.total} {t("part types. Open one to see every part number and price.")}</p>
        {res.items.length === 0 ? (
          <NoResults q="" exact={false} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {res.items.map((pt, i) => (
              <Reveal key={pt.name} delay={(i % 4) * 60}>
                <Link
                  href={link({ type: pt.name, page: undefined })}
                  className="pcard group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white"
                >
                  <span className="pimg block overflow-hidden bg-white"><ProductImage src={pt.image} alt={pt.name} className="h-36 w-full sm:h-44" /></span>
                  <span className="flex flex-1 flex-col gap-1 border-t border-line p-3.5">
                    <span className="pname text-[15px] leading-snug group-hover:text-brand">{pt.name}</span>
                    <span className="text-xs text-muted">{pt.n} {pt.n === 1 ? t("part number") : t("part numbers")}</span>
                    <span className="mt-auto pt-2 text-sm font-bold">
                      {pt.min_price ? <>{t("From")} {tsh(pt.min_price)}</> : <span className="text-brand">{t("Price on request")}</span>}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
        <Pager page={res.page} pages={pages} link={link} t={t} />
      </div>
    );
  }

  // ---------- 2. every part number of one part type ----------
  if (mode === "variants") {
    const res = await searchProducts({ type: sp.type, category, sort: sp.sort || "name", pageSize: 200 });
    const vehicles = await vehicleSummaries(res.items.map((p) => p.id));
    return (
      <div>
        {chips}
        <Link href={link({ type: undefined, page: undefined })} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">← {t("All part types")}</Link>
        <h2 className="text-4xl">{sp.type}</h2>
        <p className="mt-1 text-sm text-muted">{res.total} {res.total === 1 ? t("part number") : t("part numbers")}. {t("Check the part number against your old part, and ask us on WhatsApp if unsure.")}</p>
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {res.items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
              <Link href={`/product/${p.slug}`} className="block w-16 shrink-0 overflow-hidden rounded-lg border border-line sm:w-20">
                <ProductImage src={p.main_image} alt={p.name} className="h-16 w-full sm:h-20" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${p.slug}`} className="partno block text-base font-bold hover:text-brand">{p.oem_number || t("Part number to be confirmed")}</Link>
                {vehicles.get(p.id) && <p className="text-xs text-muted">{vehicles.get(p.id)}</p>}
                <p className="mt-0.5 text-sm font-bold">
                  {p.price_mode === "exact" && p.price_tzs ? tsh(p.price_tzs) : <span className="text-brand">{t("Price on request")}</span>}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <AskButton name={p.name} partNumber={p.oem_number} slug={p.slug} className="flex-1 sm:flex-none" />
                <div className="flex-[2] sm:w-32 sm:flex-none"><AddToCart productId={p.id} maxQty={maxOrderQty(p)} compact /></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---------- 3. search results / filtered products ----------
  const params: SearchParams = {
    q: sp.q, category, make: sp.make, model: sp.model, brand: sp.brand, avail: sp.avail, sort: sp.sort, page: Number(sp.page) || 1,
  };
  const res = await searchProducts(params);
  const vehicles = await vehicleSummaries(res.items.map((p) => p.id));
  const { brands } = await filterOptions();
  const makes = (await all<{ name: string }>("SELECT name FROM vehicle_makes ORDER BY name")).map((m) => m.name);
  const pages = Math.max(1, Math.ceil(res.total / res.pageSize));

  return (
    <div>
      {chips}
      {toolbar(true)}
      <details className="mb-4 rounded-xl border border-line bg-white p-3 text-sm" open={!!(sp.make || sp.brand || sp.avail)}>
        <summary className="cursor-pointer font-bold">{t("More filters")}</summary>
        <form action={basePath} method="get" className="mt-3 grid gap-3 sm:grid-cols-4">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {category && !fixedCategory && <input type="hidden" name="category" value={category} />}
          <div><label className="label" htmlFor="make">{t("Vehicle make")}</label>
            <select id="make" name="make" defaultValue={sp.make ?? ""} className="field"><option value="">{t("All makes")}</option>{makes.map((m) => <option key={m}>{m}</option>)}</select></div>
          <div><label className="label" htmlFor="brand">{t("Brand")}</label>
            <select id="brand" name="brand" defaultValue={sp.brand ?? ""} className="field"><option value="">{t("All brands")}</option>{brands.map((b) => <option key={b}>{b}</option>)}</select></div>
          <div><label className="label" htmlFor="avail">{t("Availability")}</label>
            <select id="avail" name="avail" defaultValue={sp.avail ?? ""} className="field"><option value="">{t("All")}</option><option value="available">{t("In stock / low stock")}</option></select></div>
          <div className="flex items-end gap-2"><button className="btn btn-red flex-1">{t("Apply")}</button><Link href={basePath} className="btn btn-outline flex-1">{t("Clear")}</Link></div>
        </form>
      </details>
      <p className="mb-3 text-sm text-muted" aria-live="polite">{res.total} {res.total === 1 ? t("product found") : t("products found")}</p>
      {res.items.length === 0 ? (
        <NoResults q={sp.q} exact={looksLikePartNumber(sp.q ?? "")} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {res.items.map((p) => <ProductCard key={p.id} p={p} vehicle={vehicles.get(p.id)} />)}
        </div>
      )}
      <Pager page={res.page} pages={pages} link={link} t={t} />
    </div>
  );
}

function Pager({ page, pages, link, t }: { page: number; pages: number; link: (o: Sp) => string; t: (s: string) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      {page > 1 && <Link className="btn btn-outline btn-sm" href={link({ page: String(page - 1) })}>{t("Previous")}</Link>}
      <span className="text-sm">{t("Page")} {page} {t("of")} {pages}</span>
      {page < pages && <Link className="btn btn-outline btn-sm" href={link({ page: String(page + 1) })}>{t("Next")}</Link>}
    </nav>
  );
}

export async function NoResults({ q, exact }: { q?: string; exact: boolean }) {
  const t = await getT();
  const text = `WOODLAND INTERNATIONAL STORE\nSPARE PART ENQUIRY\nI could not find: ${q || "(part not listed)"}\nPlease help me confirm the part and availability.`;
  return (
    <div className="card card-grey p-8 text-center">
      <h2 className="text-3xl">{t("We couldn't find that spare part")}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {t("Please confirm the part number or send the details to our Woodland sales team on WhatsApp.")}
        {exact && ` ${t("No similar parts are shown for an exact part number search, to avoid ordering the wrong part.")}`}
      </p>
      <a href={waLink(text, SITE.whatsapp)} target="_blank" rel="noopener" className="btn btn-wa mt-4">{t("Enquire via WhatsApp")}</a>
    </div>
  );
}
