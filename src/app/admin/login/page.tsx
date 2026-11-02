import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentStaff, userCount } from "@/lib/auth";
import { login } from "../auth-actions";

export const metadata: Metadata = { title: "Staff login", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentStaff()) redirect("/admin");
  if (await userCount() === 0) redirect("/admin/setup");
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-4xl">Woodland staff</h1>
      <form action={login} className="card mt-6 space-y-3 p-5">
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="field" autoComplete="username" required /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" className="field" autoComplete="current-password" required /></div>
        {error && <p role="alert" className="text-sm font-bold text-brand">{error}</p>}
        <button className="btn btn-red w-full">Sign in</button>
      </form>
    </div>
  );
}
