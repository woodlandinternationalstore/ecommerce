import { effectiveStock, hasKnownPrice, STOCK_LABEL, type Product } from "@/lib/stock";
import { SITE, tsh, waLink } from "@/lib/site";

export function StockBadge({ p }: { p: Pick<Product, "stock_qty" | "stock_status" | "low_stock_threshold"> }) {
  const s = effectiveStock(p);
  const cls = {
    in_stock: "bg-green-100 text-green-800",
    low_stock: "bg-amber-100 text-amber-900",
    out_of_stock: "bg-red-100 text-red-800",
    tbc: "bg-surface text-muted",
  }[s];
  return <span className={`badge ${cls}`}>{STOCK_LABEL[s]}</span>;
}

export function Price({ p, large = false }: { p: Product; large?: boolean }) {
  if (hasKnownPrice(p)) {
    return (
      <div>
        <span className={`font-bold ${large ? "text-3xl" : "text-lg"}`}>{tsh(p.price_tzs!)}</span>
        {p.previous_price_tzs && p.previous_price_tzs > p.price_tzs! && (
          <span className="ml-2 text-sm text-muted line-through">{tsh(p.previous_price_tzs)}</span>
        )}
      </div>
    );
  }
  return (
    <div>
      <span className={`display text-brand ${large ? "text-2xl" : "text-base"}`}>Price on request</span>
      {p.price_mode === "message" && p.price_message && <p className="mt-1 text-sm text-muted">{p.price_message}</p>}
    </div>
  );
}

export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-surface to-white text-center text-xs font-bold uppercase tracking-wide text-silver ${className}`} role="img" aria-label={`${alt} (photo not yet available)`}>
        Photo coming soon
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`object-contain bg-white ${className}`} />;
}

export function EnquireButton({ name, partNumber, className = "" }: { name: string; partNumber: string; className?: string }) {
  const text = `WOODLAND INTERNATIONAL STORE\nPRICE ENQUIRY\nProduct: ${name}\nPart Number: ${partNumber || "-"}\nPlease confirm the price and availability.`;
  return (
    <a href={waLink(text, SITE.whatsapp)} target="_blank" rel="noopener" className={`btn btn-wa btn-sm ${className}`}>
      Enquire via WhatsApp
    </a>
  );
}
