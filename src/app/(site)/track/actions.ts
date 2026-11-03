"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/auth";
import { findOrderForTracking } from "@/lib/orders";

const digits = (s: string) => s.replace(/\D/g, "");

export type TrackResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Customers find their order with the reference plus the phone number used on the order.
 * Both must match; the answer never says which one was wrong.
 */
export async function trackOrder(refInput: string, phoneInput: string): Promise<TrackResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`track:${ip}`, 8, 10 * 60_000)) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const o = await findOrderForTracking(refInput, phoneInput);
  if (!o) return { ok: false, error: "We could not find an order with those details. Check the reference and the phone number used on the order." };
  return { ok: true, url: `/order/${o.ref}?t=${o.access_token}&track=1` };
}
