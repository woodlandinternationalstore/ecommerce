// Applies db/migrations/*.sql to the database in DATABASE_URL, once each, in order.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/migrate.mjs");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
const dir = path.resolve("db/migrations");
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".sql")).sort()) {
  const done = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [f]);
  if (done.rowCount) { console.log("skip   ", f); continue; }
  await client.query("BEGIN");
  try {
    await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
    await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [f]);
    await client.query("COMMIT");
    console.log("applied", f);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("FAILED ", f, e.message);
    process.exit(1);
  }
}
await client.end();
