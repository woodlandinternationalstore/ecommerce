import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import path from "node:path";
import { Pool, types } from "pg";

// Postgres returns bigint (COUNT) and numeric (SUM) as strings; this app only handles small whole numbers.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1700, (v) => Number(v));

type Result = { rows: Record<string, unknown>[]; rowCount: number };
type Queryable = { query(text: string, params?: unknown[]): Promise<Result> };
type Driver = Queryable & { transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T> };

const txStore = new AsyncLocalStorage<Queryable>();
type G = typeof globalThis & { __woodlandDriver?: Promise<Driver> };

async function makeDriver(): Promise<Driver> {
  if (process.env.DB_DRIVER === "pglite") {
    // In-process Postgres used by the automated tests only.
    const { PGlite } = await import("@electric-sql/pglite");
    const lite = new PGlite();
    const dir = path.resolve("db/migrations");
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".sql")).sort()) await lite.exec(fs.readFileSync(path.join(dir, f), "utf8"));
    const wrap = (q: { query: (t: string, p?: unknown[]) => Promise<{ rows: unknown[]; affectedRows?: number }> }): Queryable => ({
      query: async (t, p) => {
        const r = await q.query(t, p);
        return { rows: r.rows as Record<string, unknown>[], rowCount: r.affectedRows ?? r.rows.length };
      },
    });
    return { ...wrap(lite), transaction: (fn) => lite.transaction((t) => fn(wrap(t))) };
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Neon connection string (see .env.example).");
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 20_000 });
  const wrap = (q: { query: (t: string, p?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }> }): Queryable => ({
    query: async (t, p) => {
      const r = await q.query(t, p);
      return { rows: r.rows as Record<string, unknown>[], rowCount: r.rowCount ?? 0 };
    },
  });
  return {
    ...wrap(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(wrap(client));
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

function driver(): Promise<Driver> {
  const g = globalThis as G;
  return (g.__woodlandDriver ??= makeDriver());
}

/** Convert ? placeholders to $1, $2, ... so queries stay readable. */
function toPg(sql: string) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function exec(sql: string, params: unknown[]): Promise<Result> {
  const q = txStore.getStore() ?? (await driver());
  return q.query(toPg(sql), params);
}

/** Run fn in one transaction. Every all/get/run/insert inside fn uses it. Rolls back if fn throws. */
export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  if (txStore.getStore()) return fn(); // already inside a transaction
  const d = await driver();
  return d.transaction((q) => txStore.run(q, fn));
}

/** Serialise concurrent work (e.g. order numbering). Call inside tx(); released at commit. */
export async function advisoryLock(n: number) {
  await exec("SELECT pg_advisory_xact_lock(?)", [n]);
}

export async function all<T = Record<string, any>>(sql: string, ...p: any[]): Promise<T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (await exec(sql, p)).rows as T[];
}
export async function get<T = Record<string, any>>(sql: string, ...p: any[]): Promise<T | undefined> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (await exec(sql, p)).rows[0] as T | undefined;
}
export async function run(sql: string, ...p: any[]): Promise<{ rowCount: number }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const r = await exec(sql, p);
  return { rowCount: r.rowCount };
}
/** INSERT ... and return the new row's id. */
export async function insert(sql: string, ...p: any[]): Promise<number> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const r = await exec(`${sql} RETURNING id`, p);
  return Number(r.rows[0].id);
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  return (await get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key))?.value ?? fallback;
}
export async function setSetting(key: string, value: string) {
  await run("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}
