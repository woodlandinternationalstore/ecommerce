import { all } from "./db";
import { ORDER_STATUSES, type OrderRow } from "./orders";

export type OrderSearch = { q?: string; status?: string; from?: string; to?: string };

export const STATUS_COLOR: Record<string, string> = {
  pending_confirmation: "bg-brand/10 text-brand", awaiting_customer: "bg-surface text-ink ring-1 ring-line", price_confirmed: "bg-surface text-ink ring-1 ring-line",
  confirmed: "bg-ink text-white", preparing: "bg-ink text-white", ready_for_pickup: "bg-ink text-white",
  out_for_delivery: "bg-ink text-white", completed: "bg-surface text-muted", cancelled: "bg-surface text-brand line-through",
};

export function ordersQuery(sp: OrderSearch) {
  const where = ["1=1"];
  const args: unknown[] = [];
  if (sp.q) {
    const t = `%${sp.q.trim().replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(ref ILIKE ? OR customer_name ILIKE ? OR whatsapp ILIKE ? OR alt_phone ILIKE ?)");
    args.push(t, t, t, t);
  }
  if (sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status)) { where.push("status = ?"); args.push(sp.status); }
  if (sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from)) { where.push("substr(created_at, 1, 10) >= ?"); args.push(sp.from); }
  if (sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)) { where.push("substr(created_at, 1, 10) <= ?"); args.push(sp.to); }
  return all<OrderRow>(`SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT 500`, ...args);
}
