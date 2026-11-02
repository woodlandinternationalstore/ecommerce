import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','sales','inventory')), active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
  image_url TEXT, published INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS vehicle_makes (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS vehicle_models (
  id INTEGER PRIMARY KEY, make_id INTEGER NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE, name TEXT NOT NULL,
  UNIQUE (make_id, name));
CREATE TABLE IF NOT EXISTS vehicle_generations (
  id INTEGER PRIMARY KEY, model_id INTEGER NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE, name TEXT NOT NULL,
  chassis_code TEXT, year_from INTEGER, year_to INTEGER, engines TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT NOT NULL DEFAULT '', oem_number TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
  main_image TEXT, condition TEXT NOT NULL DEFAULT 'new', authenticity TEXT NOT NULL DEFAULT 'unverified',
  unit TEXT NOT NULL DEFAULT 'piece',
  price_tzs INTEGER CHECK (price_tzs IS NULL OR price_tzs > 0), previous_price_tzs INTEGER,
  price_mode TEXT NOT NULL DEFAULT 'request' CHECK (price_mode IN ('exact','request','message')),
  price_message TEXT NOT NULL DEFAULT '',
  stock_qty INTEGER CHECK (stock_qty IS NULL OR stock_qty >= 0),
  stock_status TEXT NOT NULL DEFAULT 'tbc' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock','tbc')),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3, track_stock INTEGER NOT NULL DEFAULT 1,
  allow_enquiry_oos INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0, search_text TEXT NOT NULL DEFAULT '', norm_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_products_oem ON products(oem_number);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL, alt TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS product_alt_numbers (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, part_number TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_alt_pn ON product_alt_numbers(part_number);
CREATE TABLE IF NOT EXISTS product_compat (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  make TEXT NOT NULL, model TEXT NOT NULL, generation TEXT NOT NULL DEFAULT '', chassis_code TEXT NOT NULL DEFAULT '',
  year_from INTEGER, year_to INTEGER, engine TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_compat ON product_compat(make, model);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY, ref TEXT NOT NULL UNIQUE, access_token TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL, whatsapp TEXT NOT NULL, alt_phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  delivery_method TEXT NOT NULL, delivery_location TEXT NOT NULL DEFAULT '', region TEXT NOT NULL DEFAULT '',
  contact_method TEXT NOT NULL DEFAULT 'whatsapp', vehicle_info TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  known_subtotal INTEGER NOT NULL DEFAULT 0, unknown_count INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER, final_total INTEGER,
  status TEXT NOT NULL DEFAULT 'pending_confirmation', handoff_status TEXT NOT NULL DEFAULT 'not_opened',
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL, part_number TEXT NOT NULL DEFAULT '', vehicle TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL CHECK (qty > 0), unit_price INTEGER, line_total INTEGER, confirmed_unit_price INTEGER);
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS order_notes (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id), note TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  prev_qty INTEGER, new_qty INTEGER NOT NULL, diff INTEGER, reason TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY, ref TEXT NOT NULL UNIQUE, access_token TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
  part TEXT NOT NULL DEFAULT '', vehicle TEXT NOT NULL DEFAULT '', message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT (datetime('now')));
`;

type G = typeof globalThis & { __woodlandDb?: DatabaseSync };

export function db(): DatabaseSync {
  const g = globalThis as G;
  if (g.__woodlandDb) return g.__woodlandDb;
  const file = process.env.DATABASE_FILE === ":memory:" ? ":memory:" : path.resolve(process.env.DATABASE_FILE ?? "data/woodland.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  d.exec(SCHEMA);
  g.__woodlandDb = d;
  seedReference(d);
  return d;
}

/** Run fn inside a transaction; rolls back on throw. */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type P = any[];
export const all = <T = Row>(sql: string, ...p: P) => db().prepare(sql).all(...p) as T[];
export const get = <T = Row>(sql: string, ...p: P) => db().prepare(sql).get(...p) as T | undefined;
export const run = (sql: string, ...p: P) => db().prepare(sql).run(...p);

export function getSetting(key: string, fallback = ""): string {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value ?? fallback;
}
export function setSetting(key: string, value: string) {
  run("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}

const CATEGORIES: [string, string][] = [
  ["Engine Parts", "Components for the engine block, head, timing and fuel-air systems."],
  ["Suspension Parts", "Lower arms, bushes, shock absorbers, ball joints and links."],
  ["Brake Systems", "Brake pads, discs, calipers, hoses and related parts."],
  ["Filters & Lubricants", "Oil, air, fuel and cabin filters, plus engine oils and fluids."],
  ["Electrical Parts", "Alternators, starters, sensors, switches and wiring components."],
  ["Bearings", "Wheel, gearbox and engine bearings."],
  ["Cooling Systems", "Radiators, water pumps, thermostats, hoses and fans."],
  ["Transmission Parts", "Clutch, gearbox and drivetrain components."],
  ["Lighting Systems", "Headlamps, tail lamps, indicators and bulbs."],
  ["Body Parts", "Bumpers, grilles, mirrors, panels and trim."],
  ["Steering Components", "Tie rod ends, racks, pumps and steering joints."],
  ["Fuel System Components", "Fuel pumps, injectors, lines and filters."],
  ["Wheel Hubs and Bearings", "Hub assemblies, wheel bearings and studs."],
  ["Other Spare Parts", "Other automotive spare parts. Ask us if you cannot find yours."],
];

function seedReference(d: DatabaseSync) {
  const n = (d.prepare("SELECT COUNT(*) n FROM categories").get() as { n: number }).n;
  if (n > 0) return;
  const cat = d.prepare("INSERT INTO categories(name, slug, description, display_order) VALUES(?,?,?,?)");
  CATEGORIES.forEach(([name, desc], i) => cat.run(name, name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), desc, i + 1));
  const make = d.prepare("INSERT OR IGNORE INTO vehicle_makes(name) VALUES(?)");
  for (const m of ["Toyota", "Nissan", "Ford", "Mitsubishi", "Foton", "GWM", "Isuzu"]) make.run(m);
}
