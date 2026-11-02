import Link from "next/link";
import { ordersQuery, STATUS_COLOR } from "@/lib/order-admin";
import { requirePerm } from "@/lib/auth";
import { HANDOFF_LABEL, ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";
import { tsh } from "@/lib/site";

type Sp = { q?: string; status?: string; from?: string; to?: string };

export default async function Orders({ searchParams }: { searchParams: Promise<Sp> }) {
  await requirePerm("orders");
  const sp = await searchParams;
  const rows = await ordersQuery(sp);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-4xl">Orders</h1>
        <a href={`/admin/orders/export?${exportQs}`} className="btn btn-outline btn-sm">Export CSV</a>
      </div>
      <form className="card flex flex-wrap items-end gap-2 p-3" method="get">
        <div className="min-w-48 flex-1"><label className="label" htmlFor="q">Reference, name or phone</label><input id="q" name="q" defaultValue={sp.q} className="field" /></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="field"><option value="">All</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
        <div><label className="label" htmlFor="from">From</label><input id="from" type="date" name="from" defaultValue={sp.from} className="field" /></div>
        <div><label className="label" htmlFor="to">To</label><input id="to" type="date" name="to" defaultValue={sp.to} className="field" /></div>
        <button className="btn btn-red">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase"><tr><th className="p-3">Reference</th><th>Customer</th><th>Phone</th><th>Created</th><th>Known subtotal</th><th>Status</th><th>WhatsApp</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-bold hover:text-brand">{o.ref}</Link></td>
                <td>{o.customer_name}</td><td>{o.whatsapp}</td><td>{o.created_at}</td>
                <td>{tsh(o.known_subtotal)}{o.unknown_count > 0 && <span className="text-xs text-brand"> +{o.unknown_count} unpriced</span>}</td>
                <td><span className={`badge ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="text-xs">{HANDOFF_LABEL[o.handoff_status]}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
