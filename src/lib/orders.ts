import crypto from "node:crypto";
import { z } from "zod";
import { advisoryLock, all, get, insert, run, tx } from "./db";
import { compatOf, compatLabel, hasKnownPrice, maskPrices, maxOrderQty, pricesVisible, productById, type Product } from "./catalog";
import { buildOrderMessage, orderWhatsAppUrl, type MessageOrder } from "./whatsapp";

export const ORDER_STATUSES = [
  "pending_confirmation", "awaiting_customer", "price_confirmed", "confirmed", "preparing", "ready_for_pickup",
  "out_for_delivery", "completed", "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Pending Confirmation", awaiting_customer: "Awaiting Customer Response", price_confirmed: "Price Confirmed",
  confirmed: "Confirmed", preparing: "Preparing Order", ready_for_pickup: "Ready for Pickup", out_for_delivery: "Out for Delivery",
  completed: "Completed", cancelled: "Cancelled",
};
export const HANDOFF_STATES = ["not_opened", "link_opened", "send_unverified", "confirmed_by_staff"] as const;
export type Handoff = (typeof HANDOFF_STATES)[number];
export const HANDOFF_LABEL: Record<Handoff, string> = {
  not_opened: "Not Opened", link_opened: "WhatsApp Link Opened", send_unverified: "Customer Send Unverified", confirmed_by_staff: "Confirmed by Staff",
};
export const DELIVERY_LABEL = {
  pickup: "Shop Pickup — Kariakoo, Dar es Salaam",
  local: "Local Delivery (subject to confirmation)",
  regions: "Delivery to Other Regions (subject to confirmation)",
} as const;

/** Accepts international numbers: optional +, 7–15 digits, spaces/dashes/parentheses allowed. */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => /^\+?[\d\s\-()]{7,24}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, {
    message: "Enter a valid phone number, e.g. +255 771 889 889",
  });

const clean = (max: number) => z.string().trim().max(max);

export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().min(8).max(80),
    name: z.string().trim().min(2, "Enter your full name").max(100),
    whatsapp: phoneSchema,
    altPhone: z.union([z.literal(""), phoneSchema]).default(""),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address").max(120)]).default(""),
    deliveryMethod: z.enum(["pickup", "local", "regions"]),
    deliveryLocation: clean(300).default(""),
    region: clean(100).default(""),
    contactMethod: z.enum(["whatsapp", "phone"]).default("whatsapp"),
    vehicleMake: clean(60).default(""),
    vehicleModel: clean(60).default(""),
    vehicleYear: clean(10).default(""),
    chassis: clean(60).default(""),
    engine: clean(60).default(""),
    fitment: clean(500).default(""),
    notes: clean(1000).default(""),
    items: z
      .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(999) }))
      .min(1, "Your cart is empty")
      .max(50),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod !== "pickup") {
      if (v.deliveryLocation.length < 3) ctx.addIssue({ code: "custom", path: ["deliveryLocation"], message: "Enter your delivery location" });
      if (v.region.length < 2) ctx.addIssue({ code: "custom", path: ["region"], message: "Enter your region or city" });
    }
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;

export class OrderError extends Error {}

async function nextRef(): Promise<string> {
  const d = new Date();
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const row = (await get<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE ref LIKE ?", `WIS-${day}-%`))!;
  let n = row.n + 1;
  let ref = `WIS-${day}-${String(n).padStart(4, "0")}`;
  while (await get("SELECT 1 FROM orders WHERE ref = ?", ref)) ref = `WIS-${day}-${String(++n).padStart(4, "0")}`;
  return ref;
}

export type OrderRow = {
  id: number; ref: string; access_token: string; customer_name: string; whatsapp: string; alt_phone: string; email: string;
  delivery_method: string; delivery_location: string; region: string; contact_method: string; vehicle_info: string; notes: string;
  known_subtotal: number; unknown_count: number; delivery_fee: number | null; final_total: number | null;
  status: OrderStatus; handoff_status: Handoff; created_at: string; updated_at: string;
};
export type OrderItemRow = {
  id: number; order_id: number; product_id: number | null; name: string; part_number: string; vehicle: string; qty: number;
  unit_price: number | null; line_total: number | null; confirmed_unit_price: number | null;
};

export const orderItems = (orderId: number) => all<OrderItemRow>("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", orderId);

export async function messageFor(order: OrderRow): Promise<MessageOrder> {
  const items = await orderItems(order.id);
  return {
    ref: order.ref,
    customerName: order.customer_name,
    whatsapp: order.whatsapp,
    altPhone: order.alt_phone,
    deliveryMethod: DELIVERY_LABEL[order.delivery_method as keyof typeof DELIVERY_LABEL] ?? order.delivery_method,
    deliveryLocation: order.delivery_location,
    region: order.region,
    contactMethod: order.contact_method,
    vehicleInfo: order.vehicle_info,
    notes: order.notes,
    items: items.map((i) => ({
      name: i.name, partNumber: i.part_number, vehicle: i.vehicle, qty: i.qty, unitPrice: i.unit_price, lineTotal: i.line_total,
    })),
    knownSubtotal: order.known_subtotal,
    unknownCount: order.unknown_count,
  };
}

/**
 * Create an order from browser input. Prices, names and stock come from the database only;
 * any price sent by the browser is ignored (the schema has no price field).
 * Repeating the same idempotencyKey returns the already-saved order.
 */
export async function createOrder(input: CheckoutInput) {
  const v = checkoutSchema.parse(input);

  return tx(async () => {
    await advisoryLock(7001); // one order at a time, so references never collide
    const existing = await get<OrderRow>("SELECT * FROM orders WHERE idempotency_key = ?", v.idempotencyKey);
    if (existing) return { order: existing, duplicate: true };

    // merge duplicate product lines
    const qtyBy = new Map<number, number>();
    for (const it of v.items) qtyBy.set(it.productId, (qtyBy.get(it.productId) ?? 0) + it.qty);

    const lines: { p: Product; qty: number }[] = [];
    for (const [id, qty] of qtyBy) {
      const raw = await productById(id);
      const p = raw ? maskPrices(raw, await pricesVisible()) : raw;
      if (!p || !p.published || p.archived) throw new OrderError("A product in your cart is no longer available. Please review your cart.");
      const max = maxOrderQty(p);
      if (max !== null && qty > max) {
        throw new OrderError(
          max === 0
            ? `"${p.name}" is out of stock. Please remove it from your cart or enquire on WhatsApp.`
            : `Only ${max} of "${p.name}" available. Please reduce the quantity.`,
        );
      }
      lines.push({ p, qty });
    }

    let known = 0;
    let unknown = 0;
    const rows = [];
    for (const { p, qty } of lines) {
      const unit = hasKnownPrice(p) ? p.price_tzs! : null;
      const total = unit !== null ? unit * qty : null;
      if (total !== null) known += total;
      else unknown += 1;
      const vehicle = (await compatOf(p.id)).slice(0, 3).map((c) => compatLabel({ ...c, year_from: null, year_to: null, engine: "", chassis_code: "" })).join(", ");
      rows.push({ p, qty, unit, total, vehicle });
    }

    const vehicleInfo = [
      [v.vehicleMake, v.vehicleModel, v.vehicleYear].filter(Boolean).join(" "),
      v.chassis && `Chassis: ${v.chassis}`,
      v.engine && `Engine: ${v.engine}`,
      v.fitment && `Fitment info: ${v.fitment}`,
    ].filter(Boolean).join("\n");

    const ref = await nextRef();
    const token = crypto.randomBytes(16).toString("hex");
    const orderId = await insert(
      `INSERT INTO orders(ref, access_token, idempotency_key, customer_name, whatsapp, alt_phone, email, delivery_method,
        delivery_location, region, contact_method, vehicle_info, notes, known_subtotal, unknown_count)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ref, token, v.idempotencyKey, v.name, v.whatsapp, v.altPhone, v.email, v.deliveryMethod,
      v.deliveryMethod === "pickup" ? "" : v.deliveryLocation, v.deliveryMethod === "pickup" ? "" : v.region,
      v.contactMethod, vehicleInfo, v.notes, known, unknown,
    );
    for (const r of rows) {
      await run(
        `INSERT INTO order_items(order_id, product_id, name, part_number, vehicle, qty, unit_price, line_total)
         VALUES(?,?,?,?,?,?,?,?)`,
        orderId, r.p.id, r.p.name, r.p.oem_number, r.vehicle, r.qty, r.unit, r.total,
      );
    }
    await run("INSERT INTO order_status_history(order_id, status, note) VALUES(?,?,?)", orderId, "pending_confirmation", "Order received from website");
    return { order: (await get<OrderRow>("SELECT * FROM orders WHERE id = ?", orderId))!, duplicate: false };
  });
}

export async function orderByRefAndToken(ref: string, token: string) {
  const o = await get<OrderRow>("SELECT * FROM orders WHERE ref = ?", ref);
  if (!o) return undefined;
  const a = Buffer.from(o.access_token);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? o : undefined;
}

/** Customer opened WhatsApp: only ever moves forward from "not_opened". Never touches order status. */
export async function markLinkOpened(ref: string, token: string) {
  const o = await orderByRefAndToken(ref, token);
  if (!o) return false;
  if (o.handoff_status === "not_opened") {
    await run("UPDATE orders SET handoff_status = 'link_opened', updated_at = utcnow() WHERE id = ?", o.id);
  }
  return true;
}

export const whatsappUrlFor = async (o: OrderRow) => orderWhatsAppUrl(await messageFor(o));
export const messageTextFor = async (o: OrderRow) => buildOrderMessage(await messageFor(o));

const digitsOf = (s: string) => s.replace(/\D/g, "");

/**
 * Customer tracking: the order reference and a phone number on the order (WhatsApp or alternative, compared by the
 * last 9 digits so +255 and 0 prefixes both work) must both match. Returns nothing for any mismatch.
 */
export async function findOrderForTracking(refInput: string, phoneInput: string) {
  const ref = String(refInput).trim().toUpperCase().slice(0, 40);
  const phone = digitsOf(String(phoneInput)).slice(-9);
  if (!/^WIS-\d{8}-\d{4}$/.test(ref) || phone.length < 7) return undefined;
  const o = await get<OrderRow>("SELECT * FROM orders WHERE ref = ?", ref);
  if (!o) return undefined;
  const ok = [o.whatsapp, o.alt_phone].some((p) => p && digitsOf(p).slice(-9) === phone);
  return ok ? o : undefined;
}
