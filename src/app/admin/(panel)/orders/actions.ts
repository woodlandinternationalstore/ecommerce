"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { get, run, tx } from "@/lib/db";
import { HANDOFF_STATES, ORDER_STATUSES } from "@/lib/orders";

const intOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

export async function updateStatus(formData: FormData) {
  const staff = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  const note = String(formData.get("note") ?? "").slice(0, 500);
  if (!(ORDER_STATUSES as readonly string[]).includes(status) || !get("SELECT 1 FROM orders WHERE id = ?", id)) redirect(`/admin/orders/${id}?error=Invalid status`);
  tx(() => {
    run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", status, id);
    run("INSERT INTO order_status_history(order_id, status, note, user_id) VALUES(?,?,?,?)", id, status, note, staff.id);
  });
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function setHandoff(formData: FormData) {
  await requirePerm("orders");
  const id = Number(formData.get("id"));
  const h = String(formData.get("handoff"));
  if ((HANDOFF_STATES as readonly string[]).includes(h)) {
    run("UPDATE orders SET handoff_status = ?, updated_at = datetime('now') WHERE id = ?", h, id);
  }
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function addNote(formData: FormData) {
  const staff = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (note && get("SELECT 1 FROM orders WHERE id = ?", id)) run("INSERT INTO order_notes(order_id, user_id, note) VALUES(?,?,?)", id, staff.id, note);
  redirect(`/admin/orders/${id}?saved=1`);
}

/** Record confirmed unit prices, delivery fee and final total. Original snapshot prices are never overwritten. */
export async function saveFinance(formData: FormData) {
  await requirePerm("orders");
  const id = Number(formData.get("id"));
  const fee = intOrNull(formData.get("delivery_fee"));
  const total = intOrNull(formData.get("final_total"));
  if (Number.isNaN(fee) || Number.isNaN(total)) redirect(`/admin/orders/${id}?error=Amounts must be whole numbers of TSh`);
  const items = get<{ n: number }>("SELECT COUNT(*) n FROM order_items WHERE order_id = ?", id)!.n;
  tx(() => {
    for (const [k, v] of formData.entries()) {
      const m = /^cp_(\d+)$/.exec(k);
      if (!m) continue;
      const price = intOrNull(v);
      if (Number.isNaN(price)) throw new Error("bad price");
      run("UPDATE order_items SET confirmed_unit_price = ? WHERE id = ? AND order_id = ?", price, Number(m[1]), id);
    }
    run("UPDATE orders SET delivery_fee = ?, final_total = ?, updated_at = datetime('now') WHERE id = ?", fee, total, id);
  });
  void items;
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?saved=1`);
}
