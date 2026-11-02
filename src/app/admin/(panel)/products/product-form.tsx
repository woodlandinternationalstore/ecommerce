import { can, type Role } from "@/lib/auth";
import { categories, STOCK_REASONS, type Compat, type Product } from "@/lib/catalog";
import { saveProduct } from "./actions";

export function compatText(rows: Compat[]) {
  return rows.map((c) => [c.make, c.model, c.generation, c.chassis_code, c.year_from ? `${c.year_from}${c.year_to && c.year_to !== c.year_from ? `-${c.year_to}` : ""}` : "", c.engine].join(" | ")).join("\n");
}

export async function ProductForm({ p, alts, compat, role }: { p?: Product; alts: string[]; compat: Compat[]; role: Role }) {
  const cats = await categories(false);
  const price = can(role, "pricing");
  const stock = can(role, "stock");
  return (
    <form action={saveProduct} className="card space-y-4 p-4">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2"><label className="label" htmlFor="name">Product name *</label><input id="name" name="name" defaultValue={p?.name} className="field" required /></div>
        <div><label className="label" htmlFor="oem_number">OEM / manufacturer part number</label><input id="oem_number" name="oem_number" defaultValue={p?.oem_number} className="field partno" /></div>
        <div><label className="label" htmlFor="brand">Product brand</label><input id="brand" name="brand" defaultValue={p?.brand} className="field" /></div>
        <div><label className="label" htmlFor="category_id">Category</label>
          <select id="category_id" name="category_id" defaultValue={p?.category_id ?? ""} className="field"><option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="unit">Unit of measurement</label><input id="unit" name="unit" defaultValue={p?.unit ?? "piece"} className="field" /></div>
        <div><label className="label" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" defaultValue={p?.condition ?? "new"} className="field"><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></div>
        <div><label className="label" htmlFor="authenticity">Authenticity classification</label>
          <select id="authenticity" name="authenticity" defaultValue={p?.authenticity ?? "unverified"} className="field">
            <option value="unverified">Not yet verified</option><option value="genuine_verified">Genuine (verified)</option><option value="oem_quality">OEM quality</option><option value="aftermarket">Aftermarket</option>
          </select></div>
        <div className="md:col-span-2"><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={4} defaultValue={p?.description} className="field" /></div>
        <div><label className="label" htmlFor="alt_numbers">Alternative part numbers (one per line)</label><textarea id="alt_numbers" name="alt_numbers" rows={4} defaultValue={alts.join("\n")} className="field partno" /></div>
        <div><label className="label" htmlFor="compat">Compatible vehicles (one per line)</label>
          <textarea id="compat" name="compat" rows={4} defaultValue={compatText(compat)} className="field partno text-sm" placeholder="Toyota | Hilux | Revo | GUN125 | 2016-2023 | 2.8L Diesel" />
          <p className="mt-1 text-xs text-muted">Make | Model | Generation | Chassis code | Years | Engine. Only make and model are required.</p></div>
      </div>

      <fieldset className="grid gap-3 rounded-md bg-surface p-3 md:grid-cols-4" disabled={!price}>
        <legend className="display px-1 text-lg">Price {!price && <span className="text-xs normal-case text-muted">(Super Admin only)</span>}</legend>
        <div><label className="label" htmlFor="price_mode">Price display</label>
          <select id="price_mode" name="price_mode" defaultValue={p?.price_mode ?? "request"} className="field"><option value="exact">Show exact price</option><option value="request">Price on request (WhatsApp)</option><option value="message">Show enquiry message</option></select></div>
        <div><label className="label" htmlFor="price_tzs">Selling price (TSh)</label><input id="price_tzs" name="price_tzs" inputMode="numeric" defaultValue={p?.price_tzs ?? ""} className="field" /></div>
        <div><label className="label" htmlFor="previous_price_tzs">Previous price (optional)</label><input id="previous_price_tzs" name="previous_price_tzs" inputMode="numeric" defaultValue={p?.previous_price_tzs ?? ""} className="field" /></div>
        <div><label className="label" htmlFor="price_message">Enquiry message</label><input id="price_message" name="price_message" defaultValue={p?.price_message} className="field" /></div>
      </fieldset>

      <fieldset className="grid gap-3 rounded-md bg-surface p-3 md:grid-cols-4" disabled={!stock}>
        <legend className="display px-1 text-lg">Stock {!stock && <span className="text-xs normal-case text-muted">(no permission)</span>}</legend>
        <div><label className="label" htmlFor="stock_qty">Stock quantity (blank = unknown)</label><input id="stock_qty" name="stock_qty" inputMode="numeric" defaultValue={p?.stock_qty ?? ""} className="field" /></div>
        <div><label className="label" htmlFor="stock_reason">Reason for change</label>
          <select id="stock_reason" name="stock_reason" className="field" defaultValue="Manual Adjustment">{STOCK_REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div><label className="label" htmlFor="low_stock_threshold">Low-stock threshold</label><input id="low_stock_threshold" name="low_stock_threshold" inputMode="numeric" defaultValue={p?.low_stock_threshold ?? 3} className="field" /></div>
        <div><label className="label" htmlFor="stock_status">Status when quantity unknown</label>
          <select id="stock_status" name="stock_status" defaultValue={p?.stock_status ?? "tbc"} className="field"><option value="tbc">Availability to be confirmed</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="track_stock" defaultChecked={p ? !!p.track_stock : true} /> Limit orders to confirmed stock</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allow_enquiry_oos" defaultChecked={p ? !!p.allow_enquiry_oos : true} /> Out-of-stock can still be ordered as enquiry</label>
      </fieldset>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={!!p?.published} /> Published</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="featured" defaultChecked={!!p?.featured} /> Featured on homepage</label>
      </div>
      <button className="btn btn-red">{p ? "Save changes" : "Create product"}</button>
    </form>
  );
}
