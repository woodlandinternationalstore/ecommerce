import Link from "next/link";
import { categories, featuredProducts } from "@/lib/catalog";
import { SITE, VEHICLE_BRANDS, waLink } from "@/lib/site";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";

export default async function Home() {
  const cats = await categories();
  const featured = await featuredProducts(8);
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x grid gap-8 py-12 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div>
            <p className="display text-sm tracking-[0.2em] text-brand">PREMIUM AUTO PARTS</p>
            <h1 className="mt-3 text-5xl sm:text-6xl">All your car spare parts in one place</h1>
            <p className="mt-4 max-w-xl text-base text-silver">
              Find quality automotive spare parts for Toyota, Nissan, Ford, Mitsubishi, Foton and other supported vehicle brands.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn btn-red">Shop now</Link>
              <Link href="/finder" className="btn border-white text-white hover:bg-white hover:text-ink">Find your spare part</Link>
              <a href={waLink()} target="_blank" rel="noopener" className="btn btn-wa">Order via WhatsApp</a>
            </div>
            <p className="mt-5 text-xs text-silver">GENUINE SPARE PARTS | QUALITY GUARANTEED. Availability and prices are confirmed by our sales team.</p>
          </div>
          <div className="self-center rounded-lg bg-white p-5 text-ink">
            <h2 className="text-2xl">Search by part number or vehicle</h2>
            <div className="mt-3"><SearchBox /></div>
            <p className="mt-3 text-xs text-muted">Try: 48068-0K090 · Hilux Revo lower arm · Prado 150 brake pads</p>
          </div>
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="text-3xl">Shop by vehicle brand</h2>
        <p className="mt-1 text-sm text-muted">Browse by vehicle compatibility. Woodland is not an authorised dealer of these manufacturers.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {VEHICLE_BRANDS.map((b) => (
            <Link key={b} href={`/shop?make=${encodeURIComponent(b)}`} className="card card-grey flex h-24 items-center justify-center text-center transition hover:border-brand hover:bg-white">
              <span className="display text-xl">{b}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="text-3xl">Shop by spare parts category</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <div key={c.id} className="card card-grey flex flex-col p-4">
              <h3 className="text-xl">{c.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{c.description}</p>
              <Link href={`/category/${c.slug}`} className="btn btn-outline btn-sm mt-3 self-start">View Products</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="text-3xl">Featured products</h2>
        {featured.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="card card-grey mt-5 p-6 text-center">
            <p className="font-bold">Featured products will appear here once they are published.</p>
            <Link href="/shop" className="btn btn-red btn-sm mt-3">Browse all products</Link>
          </div>
        )}
      </section>

      <section className="mt-12 bg-surface py-12">
        <div className="container-x">
          <h2 className="text-3xl">Why choose Woodland?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Genuine parts", "Help customers identify suitable genuine and quality spare parts."],
              ["Quality guaranteed", "Accurate product information and any applicable warranty terms configured by the business."],
              ["Trusted service", "Direct assistance from the Woodland sales team."],
              ["Competitive prices", "Enquire about product pricing and availability."],
              ["Convenient ordering", "Submit orders directly through WhatsApp."],
              ["Kariakoo location", "Easy to locate: Ungoni & Kipande Street, Kariakoo."],
            ].map(([t, d]) => (
              <div key={t} className="card p-5">
                <h3 className="text-xl text-brand">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="text-3xl">How to order</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Search", "Find your required spare part."],
            ["Add to cart", "Select the product and quantity."],
            ["Submit order", "Enter your contact and delivery information."],
            ["WhatsApp", "Send your complete order to Woodland and confirm the details with the sales team."],
          ].map(([t, d], i) => (
            <li key={t} className="card p-5">
              <span className="display text-4xl text-brand">{i + 1}</span>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x mt-12">
        <div className="rounded-lg bg-ink p-8 text-center text-white">
          <h2 className="text-3xl">Follow us on Instagram</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-silver">Follow {SITE.instagramHandle} for new arrivals, product education and updates.</p>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener" className="btn btn-red mt-4">Follow on Instagram</a>
        </div>
      </section>
    </>
  );
}
