import { all, get, run, db } from "./db";

export type Product = {
  id: number; name: string; slug: string; category_id: number | null; category_name: string | null; category_slug: string | null;
  brand: string; oem_number: string; description: string; main_image: string | null; condition: string; authenticity: string;
  unit: string; price_tzs: number | null; previous_price_tzs: number | null; price_mode: "exact" | "request" | "message";
  price_message: string; stock_qty: number | null; stock_status: StockStatus; low_stock_threshold: number;
  track_stock: number; allow_enquiry_oos: number; featured: number; published: number; archived: number; is_demo: number;
  created_at: string; updated_at: string; search_text: string;
};
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "tbc";

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

const SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export const PUBLIC_WHERE = "p.published = 1 AND p.archived = 0 AND (p.category_id IS NULL OR c.published = 1)";

export const productBySlug = (slug: string) => get<Product>(`${SELECT} WHERE p.slug = ?`, slug);
export const productById = (id: number) => get<Product>(`${SELECT} WHERE p.id = ?`, id);
export const publicProductBySlug = (slug: string) => get<Product>(`${SELECT} WHERE p.slug = ? AND ${PUBLIC_WHERE}`, slug);
export const publicProductsByIds = (ids: number[]) =>
  ids.length ? all<Product>(`${SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")}) AND ${PUBLIC_WHERE}`, ...ids) : [];

export const featuredProducts = (limit = 8) =>
  all<Product>(`${SELECT} WHERE ${PUBLIC_WHERE} AND p.featured = 1 ORDER BY p.updated_at DESC LIMIT ?`, limit);

export const relatedProducts = (p: Product, limit = 4) =>
  all<Product>(
    `${SELECT} WHERE ${PUBLIC_WHERE} AND p.id != ? AND (p.category_id = ? OR ? IS NULL) ORDER BY p.updated_at DESC LIMIT ?`,
    p.id, p.category_id, p.category_id, limit,
  );

export const productImages = (id: number) =>
  all<{ id: number; url: string; alt: string; sort: number }>("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort, id", id);
export const altNumbers = (id: number) =>
  all<{ id: number; part_number: string }>("SELECT id, part_number FROM product_alt_numbers WHERE product_id = ? ORDER BY id", id);
export type Compat = {
  id: number; make: string; model: string; generation: string; chassis_code: string;
  year_from: number | null; year_to: number | null; engine: string;
};
export const compatOf = (id: number) => all<Compat>("SELECT * FROM product_compat WHERE product_id = ? ORDER BY id", id);

export function compatLabel(c: Pick<Compat, "make" | "model" | "generation" | "chassis_code" | "year_from" | "year_to" | "engine">) {
  const years = c.year_from || c.year_to ? `${c.year_from ?? ""}${c.year_to && c.year_to !== c.year_from ? `–${c.year_to}` : ""}` : "";
  return [c.make, c.model, c.generation, c.chassis_code && `(${c.chassis_code})`, years, c.engine].filter(Boolean).join(" ");
}

export function vehicleSummary(id: number, max = 2) {
  const list = compatOf(id).map((c) => [c.make, c.model, c.generation].filter(Boolean).join(" "));
  const uniq = [...new Set(list)];
  return uniq.length > max ? `${uniq.slice(0, max).join(", ")} +${uniq.length - max} more` : uniq.join(", ");
}

export function categories(onlyPublished = true) {
  return all<{ id: number; name: string; slug: string; description: string; image_url: string | null; published: number; display_order: number; n: number }>(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.published = 1 AND p.archived = 0) AS n
     FROM categories c ${onlyPublished ? "WHERE c.published = 1" : ""} ORDER BY c.display_order, c.name`,
  );
}
export const categoryBySlug = (slug: string) =>
  get<{ id: number; name: string; slug: string; description: string; image_url: string | null; published: number }>(
    "SELECT * FROM categories WHERE slug = ? AND published = 1", slug,
  );

export const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Rebuild the search columns for one product. Call after any change to a product, its numbers or compatibility. */
export function refreshSearch(productId: number) {
  const p = productById(productId);
  if (!p) return;
  const alts = altNumbers(productId).map((a) => a.part_number);
  const compat = compatOf(productId).map((c) => [c.make, c.model, c.generation, c.chassis_code, c.engine].join(" "));
  const text = [p.name, p.brand, p.category_name ?? "", p.oem_number, ...alts, ...compat].join(" | ").toLowerCase();
  const norm = [p.name, p.brand, p.oem_number, ...alts, ...compat].map(normalise).join("|");
  run("UPDATE products SET search_text = ?, norm_text = ? WHERE id = ?", text, norm, productId);
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "item";
}

export function uniqueSlug(base: string, table: "products" | "categories", ignoreId?: number) {
  let slug = slugify(base);
  let i = 1;
  while (get(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, slug, ignoreId ?? -1)) slug = `${slugify(base)}-${++i}`;
  return slug;
}

/** Write a stock movement and update the quantity together. Callers should be inside tx(). */
export function setStock(productId: number, newQty: number, reason: string, userId: number | null) {
  const prev = get<{ stock_qty: number | null }>("SELECT stock_qty FROM products WHERE id = ?", productId);
  if (!prev) throw new Error("Product not found");
  const diff = prev.stock_qty === null ? null : newQty - prev.stock_qty;
  run("UPDATE products SET stock_qty = ?, updated_at = datetime('now') WHERE id = ?", newQty, productId);
  run(
    "INSERT INTO stock_movements(product_id, prev_qty, new_qty, diff, reason, user_id) VALUES(?,?,?,?,?,?)",
    productId, prev.stock_qty, newQty, diff, reason, userId,
  );
}

export const STOCK_REASONS = [
  "New Stock Received", "Sale", "Stock Correction", "Damaged Goods", "Returned Goods", "Manual Adjustment",
] as const;

void db;
