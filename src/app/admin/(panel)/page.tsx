import Link from "next/link";
import { all, get } from "@/lib/db";
import { can, currentStaff } from "@/lib/auth";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const n = (sql: string, ...p: unknown[]) => get<{ n: number }>(sql, ...p)!.n;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  // any signed-in staff may see the dashboard; sections inside are limited by role
  const staff = (await currentStaff())!;
  const { denied } = await searchParams;
  const showProducts = can(staff.role, "products");
  const showOrders = can(staff.role, "orders");

  const today = new Date().toISOString().slice(0, 10);
  const stats: [string, number | string][] = [];
  if (showProducts) {
    const low = n(`SELECT COUNT(*) n FROM products WHERE archived = 0 AND stock_qty IS NOT NULL AND stock_qty > 0 AND stock_qty <= low_stock_threshold`);
    stats.push(
      ["Total products", n("SELECT COUNT(*) n FROM products WHERE archived = 0")],
      ["Published", n("SELECT COUNT(*) n FROM products WHERE archived = 0 AND published = 1")],
      ["Out of stock", n("SELECT COUNT(*) n FROM products WHERE archived = 0 AND stock_qty = 0")],
      ["Low stock", low],
    );
  }
  if (showOrders) {
    stats.push(
      ["Total orders", n("SELECT COUNT(*) n FROM orders")],
      ["Pending", n("SELECT COUNT(*) n FROM orders WHERE status = 'pending_confirmation'")],
      ["Confirmed", n("SELECT COUNT(*) n FROM orders WHERE status IN ('confirmed','price_confirmed','preparing','ready_for_pickup','out_for_delivery')")],
      ["Completed", n("SELECT COUNT(*) n FROM orders WHERE status = 'completed'")],
      ["Received today", n("SELECT COUNT(*) n FROM orders WHERE date(created_at) = ?", today)],
    );
  }
  const recent = showOrders
    ? all<{ id: number; ref: string; customer_name: string; status: OrderStatus; created_at: string; known_subtotal: number; unknown_count: number }>(
        "SELECT id, ref, customer_name, status, created_at, known_subtotal, unknown_count FROM orders ORDER BY id DESC LIMIT 8",
      )
    : [];
  const requested = showOrders
    ? all<{ name: string; part_number: string; qty: number }>(
        `SELECT name, part_number, SUM(qty) qty FROM order_items GROUP BY product_id, name, part_number ORDER BY qty DESC LIMIT 5`,
      )
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl">Dashboard</h1>
      {denied && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">Your role does not allow access to that area.</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-xs font-bold uppercase text-muted">{k}</p><p className="display text-4xl">{v}</p></div>
        ))}
      </div>
      {showOrders && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-4">
            <h2 className="text-2xl">Recent orders</h2>
            {recent.length === 0 ? <p className="mt-2 text-sm text-muted">No orders yet.</p> : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {recent.map((o) => (
                  <li key={o.id} className="flex justify-between gap-2 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="font-bold hover:text-brand">{o.ref}</Link>
                    <span className="truncate">{o.customer_name}</span>
                    <span className="shrink-0 text-muted">{STATUS_LABEL[o.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-4">
            <h2 className="text-2xl">Most requested products</h2>
            {requested.length === 0 ? <p className="mt-2 text-sm text-muted">No data yet.</p> : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {requested.map((r, i) => <li key={i} className="flex justify-between gap-2 py-2"><span>{r.name} <span className="partno text-xs text-muted">{r.part_number}</span></span><b>{r.qty}</b></li>)}
              </ul>
            )}
          </section>
        </div>
      )}
      {stats.length === 0 && <p className="text-sm text-muted">Welcome. Use the menu to open your area.</p>}
    </div>
  );
}
