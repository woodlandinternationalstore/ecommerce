import Link from "next/link";
import { effectiveStock, maxOrderQty, type Product } from "@/lib/catalog";
import { getT } from "@/lib/i18n-server";
import { AddToCart } from "./add-to-cart";
import { AskButton } from "./ask-button";
import { Tilt } from "./motion";
import { Price, ProductImage, StockBadge } from "./product-bits";

export async function ProductCard({ p, vehicle = "" }: { p: Product; vehicle?: string }) {
  const t = await getT();
  return (
    <Tilt max={5} className="h-full">
      <article className="pcard card flex h-full flex-col overflow-hidden">
        <Link href={`/product/${p.slug}`} className="pimg block overflow-hidden bg-white">
          <ProductImage src={p.main_image} alt={`${p.name} ${p.oem_number}`.trim()} className="h-40 w-full sm:h-48" />
        </Link>
        <div className="flex flex-1 flex-col gap-2 bg-surface p-4">
          {p.brand && <span className="text-[11px] font-bold uppercase text-muted">{p.brand}</span>}
          <h3 className="pname text-[16px]">
            <Link href={`/product/${p.slug}`} className="hover:text-brand">{p.name}</Link>
          </h3>
          <p className="partno w-fit rounded-md bg-white px-2 py-1 text-[12.5px] ring-1 ring-line">{p.oem_number || t("Part no. to be confirmed")}</p>
          {vehicle && <p className="text-xs text-muted">{vehicle}</p>}
          <div className="mt-1"><Price p={p} /></div>
          {effectiveStock(p) !== "tbc" && <div><StockBadge p={p} /></div>}
          <div className="mt-auto space-y-2 pt-3">
            <AddToCart productId={p.id} maxQty={maxOrderQty(p)} compact />
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/product/${p.slug}`} className="btn btn-outline btn-sm !px-2">{t("Details")}</Link>
              <AskButton name={p.name} partNumber={p.oem_number} slug={p.slug} />
            </div>
          </div>
        </div>
      </article>
    </Tilt>
  );
}
