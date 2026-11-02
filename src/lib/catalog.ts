import { all, get, run } from "./db";

import type { Compat, Product } from "./stock";
export * from "./stock";

const SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export const PUBLIC_WHERE = "p.published = 1 AND p.archived = 0 AND (p.category_id IS NULL OR c.published = 1)";

export const productBySlug = (slug: string) => get<Product>(`${SELECT} WHERE p.slug = ?`, slug);
export const productById = (id: number) => get<Product>(`${SELECT} WHERE p.id = ?`, id);
export const publicProductBySlug = (slug: string) => get<Product>(`${SELECT} WHERE p.slug = ? AND ${PUBLIC_WHERE}`, slug);
export const publicProductsByIds = (ids: number[]) =>
  ids.length ? all<Product>(`${SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")}) AND ${PUBLIC_WHERE}`, ...ids) : Promise.resolve([] as Product[]);

export const featuredProducts = (limit = 8) =>
  all<Product>(`${SELECT} WHERE ${PUBLIC_WHERE} AND p.featured = 1 ORDER BY p.updated_at DESC LIMIT ?`, limit);

export const relatedProducts = (p: Product, limit = 4) =>
  all<Product>(
    `${SELECT} WHERE ${PUBLIC_WHERE} AND p.id != ? AND (p.category_id = ? OR ?::integer IS NULL) ORDER BY p.updated_at DESC LIMIT ?`,
    p.id, p.category_id, p.category_id, limit,
  );

export const productImages = (id: number) =>
  all<{ id: number; url: string; alt: string; sort: number }>("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort, id", id);
export const altNumbers = (id: number) =>
  all<{ id: number; part_number: string }>("SELECT id, part_number FROM product_alt_numbers WHERE product_id = ? ORDER BY id", id);
export const compatOf = (id: number) => all<Compat>("SELECT * FROM product_compat WHERE product_id = ? ORDER BY id", id);

export async function vehicleSummary(id: number, max = 2) {
  const list = (await compatOf(id)).map((c) => [c.make, c.model, c.generation].filter(Boolean).join(" "));
  const uniq = [...new Set(list)];
  return uniq.length > max ? `${uniq.slice(0, max).join(", ")} +${uniq.length - max} more` : uniq.join(", ");
}

export type CategoryRow = { id: number; name: string; slug: string; description: string; image_url: string | null; published: number; display_order: number; n: number };
export function categories(onlyPublished = true) {
  return all<CategoryRow>(
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
export async function refreshSearch(productId: number) {
  const p = await productById(productId);
  if (!p) return;
  const alts = (await altNumbers(productId)).map((a) => a.part_number);
  const compat = (await compatOf(productId)).map((c) => [c.make, c.model, c.generation, c.chassis_code, c.engine].join(" "));
  const text = [p.name, p.brand, p.category_name ?? "", p.oem_number, ...alts, ...compat].join(" | ").toLowerCase();
  const norm = [p.name, p.brand, p.oem_number, ...alts, ...compat].map(normalise).join("|");
  await run("UPDATE products SET search_text = ?, norm_text = ? WHERE id = ?", text, norm, productId);
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "item";
}

export async function uniqueSlug(base: string, table: "products" | "categories", ignoreId?: number) {
  let slug = slugify(base);
  let i = 1;
  while (await get(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, slug, ignoreId ?? -1)) slug = `${slugify(base)}-${++i}`;
  return slug;
}

/** Write a stock movement and update the quantity together. Callers should be inside tx(). */
export async function setStock(productId: number, newQty: number, reason: string, userId: number | null) {
  const prev = await get<{ stock_qty: number | null }>("SELECT stock_qty FROM products WHERE id = ?", productId);
  if (!prev) throw new Error("Product not found");
  const diff = prev.stock_qty === null ? null : newQty - prev.stock_qty;
  await run("UPDATE products SET stock_qty = ?, updated_at = utcnow() WHERE id = ?", newQty, productId);
  await run(
    "INSERT INTO stock_movements(product_id, prev_qty, new_qty, diff, reason, user_id) VALUES(?,?,?,?,?,?)",
    productId, prev.stock_qty, newQty, diff, reason, userId,
  );
}

export const STOCK_REASONS = [
  "New Stock Received", "Sale", "Stock Correction", "Damaged Goods", "Returned Goods", "Manual Adjustment",
] as const;
