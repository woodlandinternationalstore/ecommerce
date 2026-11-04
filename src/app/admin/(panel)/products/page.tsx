import Link from "next/link";
import { all, get } from "@/lib/db";
import { can, requirePerm } from "@/lib/auth";
import { categories, effectiveStock, STOCK_LABEL, type Product } from "@/lib/catalog";
import { tsh } from "@/lib/site";
import { loadDemoData, quickToggle, removeDemoData } from "./actions";

type Sp = { q?: string; cat?: string; status?: string; page?: string; msg?: string };

export default async function Products({ searchParams }: { searchParams: Promise<Sp> }) {
  const staff = await requirePerm("products");
  const sp = await searchParams;
  const where = ["1=1"];
  const args: unknown[] = [];
  if (sp.q) {
    const t = `%${sp.q.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(p.search_text LIKE ? ESCAPE '\\' OR p.norm_text LIKE ? ESCAPE '\\')");
    args.push(t, `%${sp.q.toLowerCase().replace(/[^a-z0-9]/g, "")}%`);
  }
  if (sp.cat) { where.push("p.category_id = ?"); args.push(Number(sp.cat)); }
  const st = sp.status;
  if (st === "published") where.push("p.published = 1 AND p.archived = 0");
  else if (st === "unpublished") where.push("p.published = 0 AND p.archived = 0");
  else if (st === "archived") where.push("p.archived = 1");
  else if (st === "out") where.push("p.stock_qty = 0 AND p.archived = 0");
  else if (st === "low") where.push("p.stock_qty > 0 AND p.stock_qty <= p.low_stock_threshold AND p.archived = 0");
  else if (st === "noprice") where.push("(p.price_mode != 'exact' OR p.price_tzs IS NULL) AND p.archived = 0");
  else where.push("p.archived = 0");

  const page = Math.max(1, Number(sp.page) || 1);
  const size = 25;
  const total = (await get<{ n: number }>(`SELECT COUNT(*) n FROM products p WHERE ${where.join(" AND ")}`, ...args))!.n;
  const rows = await all<Product>(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(" AND ")} ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    ...args, size, (page - 1) * size,
  );
  const cats = await categories(false);
  const hasDemo = (await get<{ n: number }>("SELECT COUNT(*) n FROM products WHERE is_demo = 1"))!.n > 0;
  const qs = (over: Record<string, string>) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.cat ? { cat: sp.cat } : {}), ...(st ? { status: st } : {}), ...over }).toString()}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-4xl">Products</h1>
        <Link href="/admin/products/new" className="btn btn-red btn-sm">Add product</Link>
        <Link href="/admin/import" className="btn btn-outline btn-sm">Import / Export</Link>
        {hasDemo ? (
          <form action={removeDemoData}><button className="btn btn-outline btn-sm">Remove DEMO products</button></form>
        ) : (
          <form action={loadDemoData}><button className="btn btn-outline btn-sm">Add DEMO products</button></form>
        )}
      </div>
      {sp.msg && <p role="status" className="rounded bg-surface p-3 text-sm font-bold text-ink ring-1 ring-line">{sp.msg}</p>}

      <form className="card flex flex-wrap items-end gap-2 p-3" method="get">
        <div className="min-w-48 flex-1"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Name, part number, vehicle" /></div>
        <div><label className="label" htmlFor="cat">Category</label>
          <select id="cat" name="cat" defaultValue={sp.cat ?? ""} className="field"><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="status">Show</label>
          <select id="status" name="status" defaultValue={st ?? ""} className="field">
            <option value="">All active</option><option value="published">Published</option><option value="unpublished">Unpublished</option>
            <option value="out">Out of stock</option><option value="low">Low stock</option><option value="noprice">No price</option><option value="archived">Archived</option>
          </select></div>
        <button className="btn btn-red">Filter</button>
      </form>

      <p className="text-sm text-muted">{total} products</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase"><tr><th className="p-3">Product</th><th>Part no.</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><Link className="font-bold hover:text-brand" href={`/admin/products/${p.id}`}>{p.name}</Link>{p.is_demo ? <span className="badge ml-2 bg-surface text-muted ring-1 ring-line">DEMO</span> : null}</td>
                <td className="partno text-xs">{p.oem_number}</td>
                <td>{p.category_name ?? "—"}</td>
                <td>{p.price_mode === "exact" && p.price_tzs ? tsh(p.price_tzs) : <span className="text-muted">On request</span>}</td>
                <td>{p.stock_qty ?? "?"} <span className="text-xs text-muted">{STOCK_LABEL[effectiveStock(p)]}</span></td>
                <td>{p.archived ? "Archived" : p.published ? "Published" : "Draft"}{p.featured ? " · ★" : ""}</td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <form action={quickToggle} className="inline">
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="published" />
                    <input type="hidden" name="back" value={`/admin/products${qs({})}`} />
                    <button className="text-xs font-bold underline">{p.published ? "Unpublish" : "Publish"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">No products match. Add one or import a CSV.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-3">
        {page > 1 && <Link className="btn btn-outline btn-sm" href={qs({ page: String(page - 1) })}>Previous</Link>}
        <span className="text-sm">Page {page} of {Math.max(1, Math.ceil(total / size))}</span>
        {page * size < total && <Link className="btn btn-outline btn-sm" href={qs({ page: String(page + 1) })}>Next</Link>}
      </div>
      <span hidden>{can(staff.role, "pricing") ? "" : ""}</span>
    </div>
  );
}
