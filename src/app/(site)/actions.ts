"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { get, insert, tx } from "@/lib/db";
import { effectiveStock, hasKnownPrice, maxOrderQty, publicProductsByIds, STOCK_LABEL, vehicleSummary } from "@/lib/catalog";
import { rateLimit } from "@/lib/auth";
import { createOrder, markLinkOpened, OrderError, phoneSchema, whatsappUrlFor } from "@/lib/orders";
import type { CheckoutInput } from "@/lib/orders";
import { buildEnquiryMessage } from "@/lib/whatsapp";
import { waLink } from "@/lib/site";

export type CartProduct = {
  id: number; slug: string; name: string; partNumber: string; vehicle: string; price: number | null;
  stockLabel: string; maxQty: number | null; image: string | null;
};

/** Fresh product data for the browser cart. Ids that are no longer published are simply absent from the result. */
export async function getCartProducts(ids: number[]): Promise<CartProduct[]> {
  const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 60);
  const products = await publicProductsByIds(clean);
  return Promise.all(
    products.map(async (p) => ({
      id: p.id, slug: p.slug, name: p.name, partNumber: p.oem_number, vehicle: await vehicleSummary(p.id, 1),
      price: hasKnownPrice(p) ? p.price_tzs : null, stockLabel: STOCK_LABEL[effectiveStock(p)], maxQty: maxOrderQty(p), image: p.main_image,
    })),
  );
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export type SubmitResult =
  | { ok: true; ref: string; token: string; waUrl: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitOrder(input: CheckoutInput): Promise<SubmitResult> {
  if (!rateLimit(`order:${await clientIp()}`, 10, 10 * 60_000)) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again, or contact us on WhatsApp." };
  }
  try {
    const { order } = await createOrder(input);
    return { ok: true, ref: order.ref, token: order.access_token, waUrl: await whatsappUrlFor(order) };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
      return { ok: false, error: fieldErrors.items ?? "Please check the highlighted fields.", fieldErrors };
    }
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("order failed", e);
    return { ok: false, error: "We could not save your order. Nothing was lost: please try again in a moment." };
  }
}

export async function markWhatsAppOpened(ref: string, token: string) {
  return markLinkOpened(String(ref).slice(0, 40), String(token).slice(0, 80));
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: phoneSchema,
  part: z.string().trim().max(150).default(""),
  vehicle: z.string().trim().max(150).default(""),
  message: z.string().trim().min(5, "Tell us what you need").max(1500),
});

export type EnquiryResult =
  | { ok: true; ref: string; waUrl: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitEnquiry(input: z.input<typeof enquirySchema>): Promise<EnquiryResult> {
  if (!rateLimit(`enq:${await clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: "Too many enquiries. Please try again later." };
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const v = parsed.data;
  try {
    const ref = await tx(async () => {
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const n = (await get<{ n: number }>("SELECT COUNT(*) n FROM enquiries WHERE ref LIKE ?", `ENQ-${day}-%`))!.n + 1;
      const r = `ENQ-${day}-${String(n).padStart(4, "0")}`;
      await insert("INSERT INTO enquiries(ref, access_token, name, phone, part, vehicle, message) VALUES(?,?,?,?,?,?,?)",
        r, crypto.randomBytes(8).toString("hex"), v.name, v.phone, v.part, v.vehicle, v.message);
      return r;
    });
    return { ok: true, ref, waUrl: waLink(buildEnquiryMessage({ ref, ...v })) };
  } catch (e) {
    console.error("enquiry failed", e);
    return { ok: false, error: "We could not save your enquiry. Please try again or message us on WhatsApp." };
  }
}

