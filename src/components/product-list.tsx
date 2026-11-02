import Link from "next/link";
import { all } from "@/lib/db";
import { categories } from "@/lib/catalog";
import { filterOptions, searchProducts, looksLikePartNumber, type SearchParams } from "@/lib/search";
import { SITE, waLink } from "@/lib/site";
import { ProductCard } from "./product-card";

type Sp = Record<string, string | undefined>;

export async function ProductList({ sp, basePath, fixedCategory }: { sp: Sp; basePath: string; fixedCategory?: string }) {
  const params: SearchParams = {
    q: sp.q, category: fixedCategory ?? sp.category, make: sp.make, model: sp.model, brand: sp.brand, avail: sp.avail,
    sort: sp.sort, page: Number(sp.page) || 1,
  };
  const res = await searchProducts(params);
  const { brands } = await filterOptions();
  const makes = (await all<{ name: string }>("SELECT name FROM vehicle_makes ORDER BY name")).map((m) => m.name);
  const models = sp.make
    ? (await all<{ name: string }>(
        "SELECT m.name FROM vehicle_models m JOIN vehicle_makes k ON k.id = m.make_id WHERE lower(k.name) = lower(?) ORDER BY m.name",
        sp.make,
      )).map((m) => m.name)
    : [];
  const cats = await categories();
  const pages = Math.max(1, Math.ceil(res.total / res.pageSize));

  const link = (over: Sp) => {
    const merged = { ...sp, ...over };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <form action={basePath} className="card card-grey space-y-3 self-start p-4" method="get">
        <h2 className="text-xl">Filters</h2>
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Part, number or vehicle" />
        </div>
        {!fixedCategory && (
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={sp.category ?? ""} className="field">
              <option value="">All categories</option>
              {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="make">Vehicle make</label>
          <select id="make" name="make" defaultValue={sp.make ?? ""} className="field">
            <option value="">All makes</option>
            {makes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        {models.length > 0 && (
          <div>
            <label className="label" htmlFor="model">Vehicle model</label>
            <select id="model" name="model" defaultValue={sp.model ?? ""} className="field">
              <option value="">All models</option>
              {models.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={sp.brand ?? ""} className="field">
            <option value="">All brands</option>
            {brands.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="avail">Availability</label>
          <select id="avail" name="avail" defaultValue={sp.avail ?? ""} className="field">
            <option value="">All</option>
            <option value="available">In stock / low stock</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sp.sort ?? ""} className="field">
            <option value="">Relevance</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <button className="btn btn-red w-full">Apply</button>
        <Link href={basePath} className="block text-center text-sm font-bold underline">Clear filters</Link>
      </form>

      <div>
        <p className="mb-3 text-sm text-muted" aria-live="polite">{res.total} {res.total === 1 ? "product" : "products"} found</p>
        {res.items.length === 0 ? (
          <NoResults q={sp.q} exact={looksLikePartNumber(sp.q ?? "")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {res.items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
        {pages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
            {res.page > 1 && <Link className="btn btn-outline btn-sm" href={link({ page: String(res.page - 1) })}>Previous</Link>}
            <span className="text-sm">Page {res.page} of {pages}</span>
            {res.page < pages && <Link className="btn btn-outline btn-sm" href={link({ page: String(res.page + 1) })}>Next</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}

export function NoResults({ q, exact }: { q?: string; exact: boolean }) {
  const text = `WOODLAND INTERNATIONAL STORE\nSPARE PART ENQUIRY\nI could not find: ${q || "(part not listed)"}\nPlease help me confirm the part and availability.`;
  return (
    <div className="card card-grey p-8 text-center">
      <h2 className="text-3xl">We couldn&apos;t find that spare part</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Please confirm the part number or send the details to our Woodland sales team on WhatsApp.
        {exact && " No similar parts are shown for an exact part number search, to avoid ordering the wrong part."}
      </p>
      <a href={waLink(text, SITE.whatsapp)} target="_blank" rel="noopener" className="btn btn-wa mt-4">Enquire via WhatsApp</a>
    </div>
  );
}
