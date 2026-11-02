import { all } from "./db";
import { effectiveStock, normalise, PUBLIC_WHERE, type Product } from "./catalog";

export type SearchParams = {
  q?: string;
  category?: string;
  make?: string;
  model?: string;
  brand?: string;
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

export function searchProducts(params: SearchParams) {
  const where: string[] = [PUBLIC_WHERE];
  const args: unknown[] = [];

  for (const tok of tokenize(params.q ?? "")) {
    const n = normalise(tok);
    if (n) {
      where.push("(p.search_text LIKE ? ESCAPE '\\' OR p.norm_text LIKE ? ESCAPE '\\')");
      args.push(`%${esc(tok)}%`, `%${esc(n)}%`);
    } else {
      where.push("p.search_text LIKE ? ESCAPE '\\'");
      args.push(`%${esc(tok)}%`);
    }
  }
  if (params.category) {
    where.push("c.slug = ?");
    args.push(params.category);
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

  let rows = all<Product>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p
     LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")} LIMIT 2000`,
    ...args,
  );

  if (params.avail === "available") {
    rows = rows.filter((p) => {
      const s = effectiveStock(p);
      return s === "in_stock" || s === "low_stock";
    });
  }

  const qn = normalise(params.q ?? "");
  const score = (p: Product) => {
    if (!qn) return 9;
    if (normalise(p.oem_number) === qn) return 0;
    if (normalise(p.oem_number).startsWith(qn)) return 1;
    if (normalise(p.name).startsWith(qn)) return 2;
    return 5;
  };
  const sort = params.sort ?? "relevance";
  rows.sort((a, b) => {
    if (sort === "price_asc" || sort === "price_desc") {
      const pa = a.price_mode === "exact" && a.price_tzs ? a.price_tzs : Infinity;
      const pb = b.price_mode === "exact" && b.price_tzs ? b.price_tzs : Infinity;
      if (pa !== pb) return sort === "price_asc" ? pa - pb : pb - pa;
    } else if (sort === "newest") {
      return b.created_at.localeCompare(a.created_at);
    } else if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    return score(a) - score(b) || a.name.localeCompare(b.name);
  });

  const pageSize = params.pageSize ?? 24;
  const page = Math.max(1, params.page ?? 1);
  return { total: rows.length, page, pageSize, items: rows.slice((page - 1) * pageSize, page * pageSize) };
}

export function suggest(q: string, limit = 8) {
  if (q.trim().length < 2) return [];
  return searchProducts({ q, pageSize: limit }).items.map((p) => ({
    name: p.name, slug: p.slug, oem: p.oem_number, brand: p.brand,
  }));
}

export function filterOptions() {
  return {
    brands: all<{ brand: string }>(
      `SELECT DISTINCT p.brand FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${PUBLIC_WHERE} AND p.brand != '' ORDER BY p.brand`,
    ).map((r) => r.brand),
  };
}
