import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, listUsers, requirePerm, ROLE_LABEL, type Role } from "@/lib/auth";
import { get, run } from "@/lib/db";

async function createUser(fd: FormData) {
  "use server";
  await requirePerm("users");
  const p = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(120),
    password: z.string().min(10, "Password must be at least 10 characters").max(200),
    role: z.enum(["super_admin", "sales", "inventory"]),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) redirect(`/admin/users?error=${encodeURIComponent(p.error.issues[0].message)}`);
  const v = p.data!;
  if (await get("SELECT 1 FROM users WHERE email = ?", v.email)) redirect("/admin/users?error=That email already has an account.");
  await run("INSERT INTO users(email, name, password_hash, role) VALUES(?,?,?,?)", v.email, v.name, hashPassword(v.password), v.role);
  redirect("/admin/users?saved=1");
}

async function updateUser(fd: FormData) {
  "use server";
  const me = await requirePerm("users");
  const id = Number(fd.get("id"));
  const role = String(fd.get("role"));
  const active = fd.get("active") === "on" ? 1 : 0;
  if (id === me.id) redirect("/admin/users?error=You cannot change your own role or deactivate yourself.");
  if (!["super_admin", "sales", "inventory"].includes(role)) redirect("/admin/users");
  await run("UPDATE users SET role = ?, active = ? WHERE id = ?", role, active, id);
  if (!active) await run("DELETE FROM sessions WHERE user_id = ?", id);
  redirect("/admin/users?saved=1");
}

export default async function Users({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requirePerm("users");
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Staff users</h1>
      {sp.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{sp.error}</p>}
      {sp.saved && <p role="status" className="rounded bg-surface p-3 text-sm font-bold text-ink ring-1 ring-line">Saved.</p>}
      <form action={createUser} className="card grid gap-3 p-4 md:grid-cols-5">
        <input name="name" className="field" placeholder="Name" required />
        <input name="email" type="email" className="field" placeholder="Email" required />
        <input name="password" type="password" className="field" placeholder="Temporary password (10+)" minLength={10} required />
        <select name="role" className="field" defaultValue="sales">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
        <button className="btn btn-red">Add staff</button>
      </form>
      <div className="card divide-y divide-line">
        {(await listUsers()).map((u) => (
          <form key={u.id} action={updateUser} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <input type="hidden" name="id" value={u.id} />
            <div className="min-w-48 flex-1"><b>{u.name}</b><br /><span className="text-muted">{u.email}</span></div>
            <select name="role" defaultValue={u.role} className="field !w-44" disabled={u.id === me.id}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
            <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={!!u.active} disabled={u.id === me.id} /> Active</label>
            {u.id !== me.id && <button className="btn btn-outline btn-sm">Save</button>}
          </form>
        ))}
      </div>
    </div>
  );
}
