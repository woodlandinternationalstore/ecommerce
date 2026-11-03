import { all, get } from "./db";
import { maskAll, normalise, pricesVisible, PUBLIC_WHERE, type Product } from "./catalog";

export type SearchParams = {
  q?: string;
  category?: string;
  make?: string;
  model?: string;
  brand?: string;
  type?: string; // exact part name
  avail?: string; // "available" = in stock or low stock
  sort?: string;
  page?: number;
  pageSize?: number;
};

const esc = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Split a query into tokens; strip a trailing plural "s" so "pads" finds "pad". */
export function tokenize(q: string) {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith("s") && !/\d/.test(t) ? t.slice(0, -1) : t));
}

/** A query that looks like a part number: contains a digit and has no ordinary words around it. */
export function looksLikePartNumber(q: string) {
  const t = q.trim();
  return t.length >= 5 && /\d/.test(t) && /^[A-Za-z0-9][A-Za-z0-9\-/._ ]*$/.test(t) && t.split(/\s+/).length <= 2;
}

const LIST_COLS = `p.id, p.name, p.slug, p.category_id, p.brand, p.oem_number, p.description, p.main_image, p.condition, p.authenticity,
  p.unit, p.price_tzs, p.previous_price_tzs, p.price_mode, p.price_message, p.stock_qty, p.stock_status, p.low_stock_threshold,
  p.track_stock, p.allow_enquiry_oos, p.featured, p.published, p.archived, p.is_demo, p.created_at, p.updated_at, '' AS search_text,
  c.name AS category_name, c.slug AS category_slug`;

const AVAILABLE_SQL = "((p.stock_qty IS NULL AND p.stock_status IN ('in_stock','low_stock')) OR p.stock_qty > 0)";

export async function searchProducts(params: SearchParams) {
  const where: string[] = [PUBLIC_WHERE];
  const args: unknown[] = [];
  const tokens = tokenize(params.q ?? "");

  for (const tok of tokens) {
    const n = normalise(tok);
    if (n) {
      where.push("(p.search_text LIKE ? OR p.norm_text LIKE ?)");
      args.push(`%${esc(tok)}%`, `%${esc(n)}%`);
    } else {
      where.push("p.search_text LIKE ?");
      args.push(`%${esc(tok)}%`);
    }
  }
  if (params.category) {
    where.push("c.slug = ?");
    args.push(params.category);
  }
  if (params.type) {
    where.push("lower(p.name) = lower(?)");
    args.push(params.type);
  }
  if (params.brand) {
    where.push("lower(p.brand) = lower(?)");
    args.push(params.brand);
  }
  if (params.make || params.model) {
    let sub = "EXISTS (SELECT 1 FROM product_compat pc WHERE pc.product_id = p.id";
    if (params.make) {
      sub += " AND lower(pc.make) = lower(?)";
      args.push(params.make);
    }
    if (params.model) {
      sub += " AND lower(pc.model) = lower(?)";
      args.push(params.model);
    }
    where.push(sub + ")");
  }
  if (params.avail === "available") where.push(AVAILABLE_SQL);

  const from = `FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")}`;
  const pageSize = params.pageSize ?? 24;
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? "relevance";

  // Browsing without a query: let the database sort and page, so large catalogues stay fast.
  if (!tokens.length) {
    const order =
      sort === "price_asc" ? "CASE WHEN p.price_mode = 'exact' AND p.price_tzs > 0 THEN 0 ELSE 1 END, p.price_tzs ASC, p.name"
      : sort === "price_desc" ? "CASE WHEN p.price_mode = 'exact' AND p.price_tzs > 0 THEN 0 ELSE 1 END, p.price_tzs DESC, p.name"
      : sort === "newest" ? "p.created_at DESC, p.id DESC"
      : "p.name, p.id";
    const total = ((await get<{ n: number }>(`SELECT COUNT(*) AS n ${from}`, ...args))?.n) ?? 0;
    const items = await all<Product>(`SELECT ${LIST_COLS} ${from} ORDER BY ${order} LIMIT ? OFFSET ?`, ...args, pageSize, (page - 1) * pageSize);
    return { total, page, pageSize, items: await maskAll(items) };
  }

  // With a query: relevance ranking (exact part number first) needs the matches in memory; sets are small.
  const visible = await pricesVisible();
  const rows = await maskAll(await all<Product>(`SELECT ${LIST_COLS} ${from} LIMIT 600`, ...args));
  const qn = normalise(params.q ?? "");
  const score = (p: Product) => {
    if (!qn) return 9;
    if (normalise(p.oem_number) === qn) return 0;
    if (normalise(p.oem_number).startsWith(qn)) return 1;
    if (normalise(p.name).startsWith(qn)) return 2;
    return 5;
  };
  rows.sort((x, y) => {
    if (sort === "price_asc" || sort === "price_desc") {
      const px = x.price_mode === "exact" && x.price_tzs ? x.price_tzs : Infinity;
      const py = y.price_mode === "exact" && y.price_tzs ? y.price_tzs : Infinity;
      if (px !== py) return sort === "price_asc" ? px - py : py - px;
    } else if (sort === "newest") {
      return y.created_at.localeCompare(x.created_at);
    } else if (sort === "name") {
      return x.name.localeCompare(y.name);
    }
    return score(x) - score(y) || x.name.localeCompare(y.name);
  });
  void visible;
  return { total: rows.length, page, pageSize, items: rows.slice((page - 1) * pageSize, page * pageSize) };
}

export async function suggest(q: string, limit = 8) {
  if (q.trim().length < 2) return [];
  return (await searchProducts({ q, pageSize: limit })).items.map((p) => ({
    name: p.name, slug: p.slug, oem: p.oem_number, brand: p.brand,
  }));
}

export async function filterOptions() {
  return {
    brands: (
      await all<{ brand: string }>(
        `SELECT DISTINCT p.brand FROM products p LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${PUBLIC_WHERE} AND p.brand != '' ORDER BY p.brand`,
      )
    ).map((r) => r.brand),
  };
}

export type PartType = { name: string; n: number; min_price: number | null; max_price: number | null; image: string | null; category_name: string | null };

/** One row per distinct part name, so browsing shows "ABS Sensor (14 part numbers)" instead of 14 near-identical cards. */
export async function searchPartTypes(opts: { category?: string; page?: number; pageSize?: number }) {
  const where = [PUBLIC_WHERE];
  const args: unknown[] = [];
  if (opts.category) {
    where.push("c.slug = ?");
    args.push(opts.category);
  }
  const from = `FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")}`;
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const total = ((await get<{ n: number }>(`SELECT COUNT(DISTINCT p.name) AS n ${from}`, ...args))?.n) ?? 0;
  const items = await all<PartType>(
    `SELECT p.name, COUNT(*) AS n,
       MIN(CASE WHEN p.price_mode = 'exact' AND p.price_tzs > 0 THEN p.price_tzs END) AS min_price,
       MAX(CASE WHEN p.price_mode = 'exact' AND p.price_tzs > 0 THEN p.price_tzs END) AS max_price,
       MAX(p.main_image) AS image, MAX(c.name) AS category_name
     ${from} GROUP BY p.name ORDER BY p.name LIMIT ? OFFSET ?`,
    ...args, pageSize, (page - 1) * pageSize,
  );
  const show = await pricesVisible();
  return { total, page, pageSize, items: show ? items : items.map((t) => ({ ...t, min_price: null, max_price: null })) };
}
