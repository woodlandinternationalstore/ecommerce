import Link from "next/link";
import { maxOrderQty, vehicleSummary, type Product } from "@/lib/catalog";
import { AddToCart } from "./add-to-cart";
import { Price, ProductImage, StockBadge } from "./product-bits";

export async function ProductCard({ p }: { p: Product }) {
  const vehicle = await vehicleSummary(p.id);
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link href={`/product/${p.slug}`} className="block">
        <ProductImage src={p.main_image} alt={`${p.name} ${p.oem_number}`.trim()} className="h-36 w-full sm:h-44" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 bg-surface p-3">
        {p.brand && <span className="text-[11px] font-bold uppercase text-muted">{p.brand}</span>}
        <h3 className="text-[17px] leading-tight">
          <Link href={`/product/${p.slug}`} className="hover:text-brand">{p.name}</Link>
        </h3>
        <p className="partno text-xs font-bold">{p.oem_number ? `PN: ${p.oem_number}` : "Part number to be confirmed"}</p>
        {vehicle && <p className="text-xs text-muted">{vehicle}</p>}
        <div className="mt-1"><Price p={p} /></div>
        <div><StockBadge p={p} /></div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Link href={`/product/${p.slug}`} className="btn btn-outline btn-sm">View Details</Link>
          <AddToCart productId={p.id} maxQty={maxOrderQty(p)} compact />
        </div>
      </div>
    </article>
  );
}
