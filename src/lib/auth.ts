import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { all, get, run } from "./db";

export type Role = "super_admin" | "sales" | "inventory";
export type Perm = "orders" | "enquiries" | "products" | "stock" | "pricing" | "categories" | "vehicles" | "import" | "users" | "settings";

const PERMS: Record<Role, Perm[] | "all"> = {
  super_admin: "all",
  sales: ["orders", "enquiries"],
  inventory: ["products", "stock", "categories", "vehicles", "import"],
};

export function can(role: Role, perm: Perm) {
  const p = PERMS[role];
  return p === "all" || p.includes(perm);
}

export const ROLE_LABEL: Record<Role, string> = { super_admin: "Super Admin", sales: "Sales Staff", inventory: "Inventory Staff" };

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const COOKIE = "wis_session";
const DAYS = 7;

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + DAYS * 86400_000);
  await run("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?,?,?)", sha(token), userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", sha(token));
  jar.delete(COOKIE);
}

export type Staff = { id: number; email: string; name: string; role: Role };

export async function currentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await get<Staff & { expires_at: string }>(
    `SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND u.active = 1`,
    sha(token),
  );
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await run("DELETE FROM sessions WHERE token_hash = ?", sha(token));
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

/** Use at the top of every admin page and server action. Enforced server-side, never just by hiding buttons. */
export async function requirePerm(perm: Perm): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  if (!can(staff.role, perm)) redirect("/admin?denied=1");
  return staff;
}

export async function userCount() {
  return (await get<{ n: number }>("SELECT COUNT(*) n FROM users"))!.n;
}

export function listUsers() {
  return all<{ id: number; email: string; name: string; role: Role; active: number; created_at: string }>(
    "SELECT id, email, name, role, active, created_at FROM users ORDER BY id",
  );
}

// --- simple in-memory rate limiter (per server process) ---
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}
