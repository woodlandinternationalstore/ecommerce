import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { userCount } from "@/lib/auth";
import { setupOwner } from "../auth-actions";

export const metadata: Metadata = { title: "Owner setup", robots: { index: false } };

export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await userCount() > 0) notFound();
  const { error } = await searchParams;
  const needsToken = !!process.env.SETUP_TOKEN;
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-4xl">Create the owner account</h1>
      <p className="mt-2 text-sm text-muted">This page works once, to create the first Super Admin. It disappears after that.</p>
      <form action={setupOwner} className="card mt-6 space-y-3 p-5">
        {needsToken && <div><label className="label" htmlFor="token">Setup token</label><input id="token" name="token" type="password" className="field" required /></div>}
        <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" className="field" required /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="field" required /></div>
        <div><label className="label" htmlFor="password">Password (10+ characters)</label><input id="password" name="password" type="password" className="field" minLength={10} autoComplete="new-password" required /></div>
        {error && <p role="alert" className="text-sm font-bold text-brand">{error}</p>}
        <button className="btn btn-red w-full">Create owner account</button>
      </form>
    </div>
  );
}
