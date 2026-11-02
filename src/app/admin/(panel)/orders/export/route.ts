import { NextResponse } from "next/server";
import { can, currentStaff } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { ORDER_STATUSES, STATUS_LABEL, HANDOFF_LABEL } from "@/lib/orders";
import { all } from "@/lib/db";
import { ordersQuery } from "@/lib/order-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const staff = await currentStaff();
  if (!staff || !can(staff.role, "orders")) return new NextResponse("Forbidden", { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const orders = await ordersQuery(sp);
  const items = await all<{ order_id: number; name: string; part_number: string; qty: number }>("SELECT order_id, name, part_number, qty FROM order_items");
  const by = new Map<number, string[]>();
  for (const i of items) by.set(i.order_id, [...(by.get(i.order_id) ?? []), `${i.qty} x ${i.name} [${i.part_number}]`]);
  void ORDER_STATUSES;
  const csv = toCsv([
    ["Reference", "Created", "Customer", "WhatsApp", "Alt phone", "Email", "Delivery", "Location", "Region", "Items", "Known subtotal TZS", "Unpriced items", "Delivery fee TZS", "Final total TZS", "Status", "WhatsApp handoff"],
    ...orders.map((o) => [
      o.ref, o.created_at, o.customer_name, o.whatsapp, o.alt_phone, o.email, o.delivery_method, o.delivery_location, o.region,
      (by.get(o.id) ?? []).join("; "), o.known_subtotal, o.unknown_count, o.delivery_fee, o.final_total, STATUS_LABEL[o.status], HANDOFF_LABEL[o.handoff_status],
    ]),
  ]);
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="woodland-orders.csv"' } });
}
