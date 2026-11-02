// Pure helpers and types with no database access, safe to import from client components.

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "tbc";

export type Product = {
  id: number; name: string; slug: string; category_id: number | null; category_name: string | null; category_slug: string | null;
  brand: string; oem_number: string; description: string; main_image: string | null; condition: string; authenticity: string;
  unit: string; price_tzs: number | null; previous_price_tzs: number | null; price_mode: "exact" | "request" | "message";
  price_message: string; stock_qty: number | null; stock_status: StockStatus; low_stock_threshold: number;
  track_stock: number; allow_enquiry_oos: number; featured: number; published: number; archived: number; is_demo: number;
  created_at: string; updated_at: string; search_text: string;
};

export const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "In Stock", low_stock: "Low Stock", out_of_stock: "Out of Stock", tbc: "Availability to Be Confirmed",
};
export const AUTH_LABEL: Record<string, string> = {
  genuine_verified: "Genuine (verified)", oem_quality: "OEM quality", aftermarket: "Aftermarket", unverified: "Not yet verified",
};

/** Effective availability. Never reports "in stock" when quantity is unknown unless staff set it explicitly. */
export function effectiveStock(p: Pick<Product, "stock_qty" | "stock_status" | "low_stock_threshold">): StockStatus {
  if (p.stock_qty === null || p.stock_qty === undefined) return p.stock_status;
  if (p.stock_qty <= 0) return "out_of_stock";
  if (p.stock_qty <= p.low_stock_threshold) return "low_stock";
  return "in_stock";
}

export function hasKnownPrice(p: Pick<Product, "price_mode" | "price_tzs">) {
  return p.price_mode === "exact" && p.price_tzs !== null && p.price_tzs > 0;
}

/** Max quantity a customer may order, or null when unlimited (not tracked / unknown / enquiry allowed). */
export function maxOrderQty(p: Product): number | null {
  const s = effectiveStock(p);
  if (s === "out_of_stock") return p.allow_enquiry_oos ? null : 0;
  if (p.track_stock && p.stock_qty !== null) return p.stock_qty;
  return null;
}


export type Compat = {
  id: number; make: string; model: string; generation: string; chassis_code: string;
  year_from: number | null; year_to: number | null; engine: string;
};

export function compatLabel(c: Pick<Compat, "make" | "model" | "generation" | "chassis_code" | "year_from" | "year_to" | "engine">) {
  const years = c.year_from || c.year_to ? `${c.year_from ?? ""}${c.year_to && c.year_to !== c.year_from ? `–${c.year_to}` : ""}` : "";
  return [c.make, c.model, c.generation, c.chassis_code && `(${c.chassis_code})`, years, c.engine].filter(Boolean).join(" ");
}

