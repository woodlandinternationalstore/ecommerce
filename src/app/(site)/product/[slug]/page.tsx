import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  altNumbers, AUTH_LABEL, compatLabel, compatOf, effectiveStock, hasKnownPrice, maxOrderQty, productImages, publicProductBySlug, relatedProducts,
} from "@/lib/catalog";
import { SITE, waLink } from "@/lib/site";
import { buildProductEnquiry } from "@/lib/whatsapp";
import { AddToCart } from "@/components/add-to-cart";
import { EnquireButton, Price, ProductImage, StockBadge } from "@/components/product-bits";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewed } from "@/components/recently-viewed";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await publicProductBySlug((await params).slug);
  if (!p) return {};
  const title = `${p.name}${p.oem_number ? ` ${p.oem_number}` : ""}`;
  const description = (p.description || `${p.name} available from Woodland International Store, Kariakoo, Dar es Salaam.`).slice(0, 160);
  return {
    title, description, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, url: `/product/${p.slug}`, images: p.main_image ? [p.main_image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await publicProductBySlug((await params).slug);
  if (!p) notFound();
  const images = await productImages(p.id);
  const gallery = [...(p.main_image ? [{ id: 0, url: p.main_image, alt: p.name }] : []), ...images.filter((i) => i.url !== p.main_image)];
  const alts = await altNumbers(p.id);
  const compat = await compatOf(p.id);
  const related = await relatedProducts(p);
  const pageUrl = `${SITE.url}/product/${p.slug}`;
  const stock = effectiveStock(p);
  const enquiry = buildProductEnquiry({ name: p.name, partNumber: p.oem_number, qty: 1, url: pageUrl });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.oem_number || undefined,
    mpn: p.oem_number || undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    description: p.description || undefined,
    image: p.main_image ? [p.main_image] : undefined,
    offers: hasKnownPrice(p)
      ? {
          "@type": "Offer", priceCurrency: "TZS", price: p.price_tzs, url: pageUrl,
          availability: stock === "tbc" ? undefined : stock === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <div className="container-x py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link>
        {p.category_slug && <> / <Link href={`/category/${p.category_slug}`}>{p.category_name}</Link></>} / {p.name}
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <ProductImage src={gallery[0]?.url ?? null} alt={p.name} className="h-72 w-full rounded-lg border border-line sm:h-96" />
          {gallery.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {gallery.slice(1, 9).map((g) => (
                <a key={g.url} href={g.url} target="_blank" rel="noopener">
                  <ProductImage src={g.url} alt={g.alt || p.name} className="h-20 w-full rounded border border-line" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {p.brand && <p className="text-xs font-bold uppercase text-muted">{p.brand}</p>}
          <h1 className="text-4xl">{p.name}</h1>
          <p className="partno text-sm"><span className="font-bold">OEM / Part No:</span> {p.oem_number || "To be confirmed"}</p>
          {alts.length > 0 && (
            <p className="partno text-sm"><span className="font-bold">Alternative part numbers:</span> {alts.map((a) => a.part_number).join(", ")}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge p={p} />
            <span className="badge bg-surface text-muted">{AUTH_LABEL[p.authenticity] ?? "Not yet verified"}</span>
            <span className="badge bg-surface text-muted">{p.condition}</span>
          </div>
          <Price p={p} large />

          <div className="card card-grey space-y-3 p-4">
            <AddToCart productId={p.id} maxQty={maxOrderQty(p)} />
            <a href={waLink(enquiry)} target="_blank" rel="noopener" className="btn btn-wa w-full">Buy via WhatsApp</a>
            {!hasKnownPrice(p) && <EnquireButton name={p.name} partNumber={p.oem_number} className="w-full" />}
          </div>

          <p className="rounded-md border-l-4 border-brand bg-surface p-3 text-sm">
            Vehicle compatibility can vary by model, year, chassis, and engine. Please confirm the part number and vehicle details with Woodland before finalizing your order.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-2xl">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{p.description || "No description has been added yet. Contact us for details."}</p>
          <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Category</dt><dd>{p.category_name ?? "—"}</dd>
            <dt className="text-muted">Unit</dt><dd>{p.unit}</dd>
          </dl>
        </section>
        <section>
          <h2 className="text-2xl">Compatible vehicles</h2>
          {compat.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{compat.map((c) => <li key={c.id}>{compatLabel(c)}</li>)}</ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No compatibility recorded yet. Please confirm fitment with our sales team before ordering.</p>
          )}
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-3xl">Related products</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
      <RecentlyViewed slug={p.slug} />
    </div>
  );
}
