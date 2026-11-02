import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { STATUS_COLOR } from "@/lib/order-admin";
import { DELIVERY_LABEL, HANDOFF_LABEL, HANDOFF_STATES, orderItems, ORDER_STATUSES, STATUS_LABEL, type OrderRow } from "@/lib/orders";
import { SITE, tsh, waLink } from "@/lib/site";
import { addNote, saveFinance, setHandoff, updateStatus } from "../actions";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function OrderDetail({ params, searchParams }: Props) {
  await requirePerm("orders");
  const o = get<OrderRow>("SELECT * FROM orders WHERE id = ?", Number((await params).id));
  if (!o) notFound();
  const { error, saved } = await searchParams;
  const items = orderItems(o.id);
  const history = all<{ status: keyof typeof STATUS_LABEL; note: string; created_at: string; who: string | null }>(
    "SELECT h.status, h.note, h.created_at, u.name AS who FROM order_status_history h LEFT JOIN users u ON u.id = h.user_id WHERE h.order_id = ? ORDER BY h.id DESC", o.id,
  );
  const notes = all<{ note: string; created_at: string; who: string | null }>(
    "SELECT n.note, n.created_at, u.name AS who FROM order_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.order_id = ? ORDER BY n.id DESC", o.id,
  );
  const digits = o.whatsapp.replace(/\D/g, "");
  const contactLink = waLink(`Hello ${o.customer_name}, this is ${SITE.name} about your order ${o.ref}.`, digits.startsWith("0") ? `255${digits.slice(1)}` : digits);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link href="/admin/orders" className="text-sm font-bold underline">← Orders</Link>
        <h1 className="mr-auto text-4xl">{o.ref}</h1>
        <span className={`badge ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
        <a href={contactLink} target="_blank" rel="noopener" className="btn btn-wa btn-sm">Contact on WhatsApp</a>
        <PrintButton />
      </div>
      <h1 className="hidden text-3xl print:block">{SITE.name} — Order {o.ref}</h1>
      {saved && <p role="status" className="no-print rounded bg-green-50 p-3 text-sm font-bold text-green-800">Saved.</p>}
      {error && <p role="alert" className="no-print rounded bg-red-50 p-3 text-sm font-bold text-brand">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4 text-sm">
          <h2 className="text-2xl">Customer</h2>
          <dl className="mt-2 grid grid-cols-[130px_1fr] gap-y-1">
            <dt className="text-muted">Name</dt><dd>{o.customer_name}</dd>
            <dt className="text-muted">WhatsApp</dt><dd>{o.whatsapp}</dd>
            <dt className="text-muted">Alt phone</dt><dd>{o.alt_phone || "—"}</dd>
            <dt className="text-muted">Email</dt><dd>{o.email || "—"}</dd>
            <dt className="text-muted">Prefers</dt><dd>{o.contact_method}</dd>
            <dt className="text-muted">Created</dt><dd>{o.created_at}</dd>
          </dl>
        </section>
        <section className="card p-4 text-sm">
          <h2 className="text-2xl">Delivery & vehicle</h2>
          <dl className="mt-2 grid grid-cols-[130px_1fr] gap-y-1">
            <dt className="text-muted">Method</dt><dd>{DELIVERY_LABEL[o.delivery_method as keyof typeof DELIVERY_LABEL] ?? o.delivery_method}</dd>
            <dt className="text-muted">Location</dt><dd>{o.delivery_location || "—"}</dd>
            <dt className="text-muted">Region</dt><dd>{o.region || "—"}</dd>
            <dt className="text-muted">Vehicle</dt><dd className="whitespace-pre-line">{o.vehicle_info || "—"}</dd>
            <dt className="text-muted">Customer notes</dt><dd className="whitespace-pre-line">{o.notes || "—"}</dd>
          </dl>
        </section>
      </div>

      <form action={saveFinance} className="card p-4">
        <input type="hidden" name="id" value={o.id} />
        <h2 className="text-2xl">Items & confirmed pricing</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th>Product (at order time)</th><th>Part no.</th><th>Qty</th><th>Website price</th><th className="no-print">Confirmed unit price</th></tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2 font-bold">{i.name}<div className="text-xs font-normal text-muted">{i.vehicle}</div></td>
                  <td className="partno text-xs">{i.part_number}</td><td>{i.qty}</td>
                  <td>{i.unit_price !== null ? tsh(i.unit_price) : <b className="text-brand">Price on request</b>}</td>
                  <td className="no-print"><input name={`cp_${i.id}`} inputMode="numeric" defaultValue={i.confirmed_unit_price ?? ""} className="field w-32" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">Known-price subtotal: <b>{tsh(o.known_subtotal)}</b> · Items needing price confirmation: <b>{o.unknown_count}</b></p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="delivery_fee">Delivery fee (TSh, when confirmed)</label><input id="delivery_fee" name="delivery_fee" inputMode="numeric" defaultValue={o.delivery_fee ?? ""} className="field" /></div>
          <div><label className="label" htmlFor="final_total">Final confirmed total (TSh)</label><input id="final_total" name="final_total" inputMode="numeric" defaultValue={o.final_total ?? ""} className="field" /></div>
        </div>
        <p className="mt-2 text-sm">Delivery fee: {o.delivery_fee !== null ? tsh(o.delivery_fee) : "To be confirmed"} · Final total: {o.final_total !== null ? tsh(o.final_total) : "To be confirmed"}</p>
        <button className="btn btn-red btn-sm no-print mt-3">Save prices & totals</button>
      </form>

      <div className="no-print grid gap-4 md:grid-cols-2">
        <form action={updateStatus} className="card space-y-2 p-4">
          <input type="hidden" name="id" value={o.id} />
          <h2 className="text-2xl">Order status</h2>
          <select name="status" defaultValue={o.status} className="field">{ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <input name="note" className="field" placeholder="Note for the history (optional)" />
          <button className="btn btn-red btn-sm">Update status</button>
        </form>
        <form action={setHandoff} className="card space-y-2 p-4">
          <input type="hidden" name="id" value={o.id} />
          <h2 className="text-2xl">WhatsApp handoff</h2>
          <p className="text-xs text-muted">Separate from order status. Set to Confirmed by Staff only after you have seen the customer&apos;s message.</p>
          <select name="handoff" defaultValue={o.handoff_status} className="field">{HANDOFF_STATES.map((s) => <option key={s} value={s}>{HANDOFF_LABEL[s]}</option>)}</select>
          <button className="btn btn-outline btn-sm">Update handoff</button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-2xl">Internal notes</h2>
          <form action={addNote} className="no-print mt-2 flex gap-2"><input type="hidden" name="id" value={o.id} /><input name="note" className="field" placeholder="Staff-only note" required /><button className="btn btn-outline btn-sm">Add</button></form>
          <ul className="mt-2 space-y-2 text-sm">{notes.map((n, i) => <li key={i}><span className="text-xs text-muted">{n.created_at} · {n.who ?? "staff"}</span><br />{n.note}</li>)}{notes.length === 0 && <li className="text-muted">No notes.</li>}</ul>
        </section>
        <section className="card p-4">
          <h2 className="text-2xl">Status history</h2>
          <ul className="mt-2 space-y-2 text-sm">{history.map((h, i) => <li key={i}><b>{STATUS_LABEL[h.status]}</b> <span className="text-xs text-muted">{h.created_at} · {h.who ?? "customer/system"}</span>{h.note && <><br />{h.note}</>}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
