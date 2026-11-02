import { all, get, run, tx } from "./db";
import { parseCsv } from "./csv";
import { parseCompat } from "./compat";
import { refreshSearch, setStock, uniqueSlug } from "./catalog";

export const IMPORT_COLUMNS = [
  "name", "oem_number", "alt_part_numbers", "brand", "category", "description", "vehicles", "condition", "authenticity", "unit",
  "price_tzs", "price_mode", "stock_qty", "low_stock_threshold", "published", "featured",
] as const;
type Col = (typeof IMPORT_COLUMNS)[number];

const CONDITIONS = ["new", "used", "refurbished"];
const AUTH = ["genuine_verified", "oem_quality", "aftermarket", "unverified"];
const MODES = ["exact", "request", "message"];
const PRICE_COLS: Col[] = ["price_tzs", "price_mode"];

export type ImportRow = {
  line: number;
  key: string;
  action: "create" | "update" | "error";
  values: Partial<Record<Col, string>>;
  errors: string[];
};
export type ImportPreview = { columns: Col[]; rows: ImportRow[]; ignored: string[]; unknownColumns: string[] };

export function templateCsv() {
  return `${IMPORT_COLUMNS.join(",")}\r\n"Front Lower Arm","48068-0K090","48068-0K091;48068-0K092","Toyota","Suspension Parts","Example description","Toyota|Hilux|Revo|GUN125|2016-2023|2.8L Diesel;Toyota|Fortuner","new","unverified","piece","","request","","3","no","no"\r\n`;
}

const yes = (s: string | undefined) => /^(yes|y|true|1)$/i.test((s ?? "").trim());

/** Validate a CSV and decide, per row, whether it creates or updates a product. Writes nothing. */
export function previewImport(text: string, canPrice: boolean): ImportPreview {
  const table = parseCsv(text);
  if (table.length < 2) return { columns: [], rows: [], ignored: [], unknownColumns: [] };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const unknownColumns = header.filter((h) => !(IMPORT_COLUMNS as readonly string[]).includes(h));
  let columns = header.filter((h): h is Col => (IMPORT_COLUMNS as readonly string[]).includes(h));
  const ignored: string[] = [];
  if (!canPrice) {
    for (const c of PRICE_COLS) if (columns.includes(c)) ignored.push(`${c} (you do not have the pricing permission)`);
    columns = columns.filter((c) => !PRICE_COLS.includes(c));
  }
  const cats = new Map(all<{ id: number; name: string }>("SELECT id, name FROM categories").map((c) => [c.name.toLowerCase(), c.id]));
  const seen = new Map<string, number>();

  const rows: ImportRow[] = table.slice(1).map((cells, i) => {
    const line = i + 2;
    const values: Partial<Record<Col, string>> = {};
    header.forEach((h, idx) => {
      if ((columns as string[]).includes(h)) values[h as Col] = (cells[idx] ?? "").trim();
    });
    const errors: string[] = [];
    const name = values.name ?? "";
    const oem = values.oem_number ?? "";

    // match on part number first (exact text), then on name
    let existing = oem ? get<{ id: number }>("SELECT id FROM products WHERE oem_number = ? AND archived = 0", oem) : undefined;
    if (!existing && name) existing = get<{ id: number }>("SELECT id FROM products WHERE lower(name) = lower(?) AND oem_number = ? AND archived = 0", name, oem);
    const key = oem || name.toLowerCase();

    if (!columns.includes("name") && !existing) errors.push("name column is required to create products");
    if (columns.includes("name") && !name) errors.push("name is missing");
    if (!oem && columns.includes("oem_number") && !existing) errors.push("part number is missing");
    if (key) {
      if (seen.has(key)) errors.push(`duplicate of line ${seen.get(key)}`);
      else seen.set(key, line);
    } else errors.push("row has no part number or name");

    const p = values.price_tzs;
    if (p) {
      if (!/^\d+$/.test(p) || Number(p) <= 0) errors.push("price_tzs must be a whole number above 0, digits only");
    }
    if (values.price_mode && !MODES.includes(values.price_mode)) errors.push(`price_mode must be one of ${MODES.join(", ")}`);
    if (values.price_mode === "exact" && columns.includes("price_tzs") && !p) errors.push("price_mode exact needs a price_tzs");
    if (values.stock_qty && !/^\d+$/.test(values.stock_qty)) errors.push("stock_qty must be a whole number, 0 or more");
    if (values.low_stock_threshold && !/^\d+$/.test(values.low_stock_threshold)) errors.push("low_stock_threshold must be a whole number");
    if (values.condition && !CONDITIONS.includes(values.condition)) errors.push(`condition must be one of ${CONDITIONS.join(", ")}`);
    if (values.authenticity && !AUTH.includes(values.authenticity)) errors.push(`authenticity must be one of ${AUTH.join(", ")}`);
    if (values.category && !cats.has(values.category.toLowerCase())) errors.push(`category "${values.category}" does not exist; create it first`);
    if (values.vehicles) {
      const c = parseCompat(values.vehicles.split(";").join("\n"));
      errors.push(...c.errors);
    }
    return { line, key, action: errors.length ? "error" : existing ? "update" : "create", values, errors };
  });
  return { columns, rows, ignored, unknownColumns };
}

/** Apply the valid rows of a preview. Only columns present in the file are written; everything else is untouched. */
export function applyImport(preview: ImportPreview, userId: number) {
  const cats = new Map(all<{ id: number; name: string }>("SELECT id, name FROM categories").map((c) => [c.name.toLowerCase(), c.id]));
  let created = 0;
  let updated = 0;
  tx(() => {
    for (const r of preview.rows) {
      if (r.action === "error") continue;
      const v = r.values;
      const oem = v.oem_number ?? "";
      let id = oem ? get<{ id: number }>("SELECT id FROM products WHERE oem_number = ? AND archived = 0", oem)?.id : undefined;
      if (!id && v.name) id = get<{ id: number }>("SELECT id FROM products WHERE lower(name) = lower(?) AND oem_number = ? AND archived = 0", v.name, oem)?.id;
      if (!id) {
        id = Number(run("INSERT INTO products(name, slug) VALUES(?,?)", v.name ?? "", uniqueSlug(`${v.name} ${oem}`, "products")).lastInsertRowid);
        created++;
      } else updated++;

      const set: string[] = [];
      const args: unknown[] = [];
      const put = (col: string, val: unknown) => { set.push(`${col} = ?`); args.push(val); };
      if (v.name !== undefined && v.name) put("name", v.name);
      if (v.oem_number !== undefined) put("oem_number", v.oem_number);
      for (const c of ["brand", "description", "condition", "authenticity", "unit", "price_mode"] as const) {
        if (v[c] !== undefined && v[c] !== "") put(c, v[c]);
      }
      if (v.price_tzs !== undefined) put("price_tzs", v.price_tzs === "" ? null : Number(v.price_tzs));
      if (v.low_stock_threshold) put("low_stock_threshold", Number(v.low_stock_threshold));
      if (v.category !== undefined && v.category) put("category_id", cats.get(v.category.toLowerCase()));
      if (v.published !== undefined && v.published !== "") put("published", yes(v.published) ? 1 : 0);
      if (v.featured !== undefined && v.featured !== "") put("featured", yes(v.featured) ? 1 : 0);
      if (set.length) run(`UPDATE products SET ${set.join(", ")}, updated_at = datetime('now') WHERE id = ?`, ...args, id);

      if (v.stock_qty) setStock(id, Number(v.stock_qty), "Stock Correction", userId);
      if (v.alt_part_numbers !== undefined && v.alt_part_numbers !== "") {
        run("DELETE FROM product_alt_numbers WHERE product_id = ?", id);
        for (const a of new Set(v.alt_part_numbers.split(";").map((s) => s.trim()).filter(Boolean))) {
          run("INSERT INTO product_alt_numbers(product_id, part_number) VALUES(?,?)", id, a);
        }
      }
      if (v.vehicles !== undefined && v.vehicles !== "") {
        run("DELETE FROM product_compat WHERE product_id = ?", id);
        for (const c of parseCompat(v.vehicles.split(";").join("\n")).rows) {
          run("INSERT INTO product_compat(product_id, make, model, generation, chassis_code, year_from, year_to, engine) VALUES(?,?,?,?,?,?,?,?)",
            id, c.make, c.model, c.generation, c.chassis, c.from, c.to, c.engine);
        }
      }
      refreshSearch(id);
    }
  });
  return { created, updated };
}

export function exportRows() {
  const prods = all<Record<string, string | number | null>>(
    `SELECT p.id, p.name, p.oem_number, p.brand, c.name AS category, p.description, p.condition, p.authenticity, p.unit, p.price_tzs, p.price_mode,
      p.stock_qty, p.low_stock_threshold, p.published, p.featured FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.archived = 0 ORDER BY p.id`,
  );
  return prods.map((p) => {
    const alts = all<{ part_number: string }>("SELECT part_number FROM product_alt_numbers WHERE product_id = ?", p.id as number).map((a) => a.part_number).join(";");
    const veh = all<{ make: string; model: string; generation: string; chassis_code: string; year_from: number | null; year_to: number | null; engine: string }>(
      "SELECT * FROM product_compat WHERE product_id = ?", p.id as number,
    ).map((c) => [c.make, c.model, c.generation, c.chassis_code, c.year_from ? `${c.year_from}${c.year_to && c.year_to !== c.year_from ? `-${c.year_to}` : ""}` : "", c.engine].join("|")).join(";");
    return [p.name, p.oem_number, alts, p.brand, p.category, p.description, veh, p.condition, p.authenticity, p.unit, p.price_tzs, p.price_mode, p.stock_qty, p.low_stock_threshold, p.published ? "yes" : "no", p.featured ? "yes" : "no"];
  });
}
