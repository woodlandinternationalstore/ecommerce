"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, rateLimit, userCount, verifyPassword } from "@/lib/auth";
import { get, run } from "@/lib/db";

const DUMMY = hashPassword("not-a-real-password");

async function ip() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!rateLimit(`login:${await ip()}:${email}`, 8, 15 * 60_000)) redirect("/admin/login?error=Too many attempts. Try again in 15 minutes.");
  const u = get<{ id: number; password_hash: string; active: number }>("SELECT id, password_hash, active FROM users WHERE email = ?", email);
  const ok = verifyPassword(password, u?.password_hash ?? DUMMY);
  if (!u || !ok || !u.active) redirect("/admin/login?error=Incorrect email or password.");
  await createSession(u.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const setupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(10, "Password must be at least 10 characters").max(200),
});

/** First-run only: creates the Super Admin. Disabled forever once any user exists. */
export async function setupOwner(formData: FormData) {
  if (userCount() > 0) redirect("/admin/login");
  const token = process.env.SETUP_TOKEN;
  if (process.env.NODE_ENV === "production" && !token) redirect("/admin/setup?error=Set the SETUP_TOKEN environment variable first.");
  if (token && String(formData.get("token") ?? "") !== token) redirect("/admin/setup?error=Incorrect setup token.");
  if (!rateLimit(`setup:${await ip()}`, 10, 15 * 60_000)) redirect("/admin/setup?error=Too many attempts.");
  const parsed = setupSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), password: formData.get("password"),
  });
  if (!parsed.success) redirect(`/admin/setup?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const v = parsed.data;
  const r = run("INSERT INTO users(email, name, password_hash, role) VALUES(?,?,?, 'super_admin')", v.email, v.name, hashPassword(v.password));
  await createSession(Number(r.lastInsertRowid));
  redirect("/admin");
}
