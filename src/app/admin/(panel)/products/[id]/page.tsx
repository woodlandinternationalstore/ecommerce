import Link from "next/link";
import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { altNumbers, compatOf, productById, productImages } from "@/lib/catalog";
import { deleteImage, deleteProduct, quickToggle, setMainImage, uploadImage } from "../actions";
import { ProductForm } from "../product-form";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function EditProduct({ params, searchParams }: Props) {
  const staff = await requirePerm("products");
  const p = await productById(Number((await params).id));
  if (!p) notFound();
  const { error, saved } = await searchParams;
  const images = await productImages(p.id);
  const moves = await all<{ created_at: string; prev_qty: number | null; new_qty: number; diff: number | null; reason: string; who: string | null }>(
    `SELECT m.created_at, m.prev_qty, m.new_qty, m.diff, m.reason, u.name AS who FROM stock_movements m
     LEFT JOIN users u ON u.id = m.user_id WHERE m.product_id = ? ORDER BY m.id DESC LIMIT 30`, p.id,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/products" className="text-sm font-bold underline">← Products</Link>
        <h1 className="mr-auto text-4xl">{p.name}</h1>
        {p.published && !p.archived && <Link href={`/product/${p.slug}`} className="btn btn-outline btn-sm" target="_blank">View on site</Link>}
        <form action={quickToggle}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="archived" /><input type="hidden" name="back" value={`/admin/products/${p.id}`} />
          <button className="btn btn-outline btn-sm">{p.archived ? "Restore" : "Archive"}</button></form>
        <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="btn btn-outline btn-sm">Delete</button></form>
      </div>
      {saved && <p role="status" className="rounded bg-surface p-3 text-sm font-bold text-ink ring-1 ring-line">Saved.</p>}
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{error}</p>}

      <ProductForm p={p} alts={(await altNumbers(p.id)).map((a) => a.part_number)} compat={await compatOf(p.id)} role={staff.role} />

      <section className="card space-y-3 p-4">
        <h2 className="text-2xl">Images</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((i) => (
            <div key={i.id} className="space-y-1 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt={i.alt || p.name} className="h-28 w-full rounded border border-line object-contain" />
              <div className="flex gap-2">
                {p.main_image === i.url ? <b>Main</b> : (
                  <form action={setMainImage}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="url" value={i.url} /><button className="underline">Make main</button></form>
                )}
                <form action={deleteImage}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="imageId" value={i.id} /><button className="underline">Delete</button></form>
              </div>
            </div>
          ))}
        </div>
        <form action={uploadImage} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <div><label className="label" htmlFor="image">Upload JPG, PNG or WebP (max 3 MB)</label><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field" required /></div>
          <div><label className="label" htmlFor="alt">Alt text</label><input id="alt" name="alt" className="field" /></div>
          <button className="btn btn-outline">Upload</button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="text-2xl">Stock movement log</h2>
        {moves.length === 0 ? <p className="mt-2 text-sm text-muted">No stock changes recorded.</p> : (
          <div className="overflow-x-auto"><table className="mt-2 w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th>When</th><th>Previous</th><th>New</th><th>Diff</th><th>Reason</th><th>By</th></tr></thead>
            <tbody className="divide-y divide-line">{moves.map((m, i) => (
              <tr key={i}><td className="py-1">{m.created_at}</td><td>{m.prev_qty ?? "unknown"}</td><td>{m.new_qty}</td><td>{m.diff ?? "—"}</td><td>{m.reason}</td><td>{m.who ?? "—"}</td></tr>
            ))}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
