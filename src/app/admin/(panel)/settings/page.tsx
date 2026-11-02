import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/db";

async function save(fd: FormData) {
  "use server";
  await requirePerm("settings");
  await setSetting("business_hours", String(fd.get("business_hours") ?? "").slice(0, 500));
  const map = String(fd.get("map_embed_url") ?? "").trim();
  // only Google Maps embeds are accepted, so an admin typo cannot embed an arbitrary site
  if (map && !/^https:\/\/www\.google\.com\/maps\/embed\?/.test(map)) redirect("/admin/settings?error=Map URL must be a Google Maps embed link.");
  await setSetting("map_embed_url", map);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export default async function Settings({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePerm("settings");
  const sp = await searchParams;
  return (
    <div className="space-y-5">
      <h1 className="text-4xl">Settings</h1>
      {sp.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{sp.error}</p>}
      {sp.saved && <p role="status" className="rounded bg-green-50 p-3 text-sm font-bold text-green-800">Saved.</p>}
      <form action={save} className="card max-w-xl space-y-3 p-4">
        <div><label className="label" htmlFor="h">Business hours (shown in footer and contact page)</label>
          <textarea id="h" name="business_hours" rows={4} defaultValue={await getSetting("business_hours")} className="field" placeholder="Enter the real opening hours" /></div>
        <div><label className="label" htmlFor="m">Google Maps embed URL (only after the location is verified)</label>
          <input id="m" name="map_embed_url" defaultValue={await getSetting("map_embed_url")} className="field" placeholder="https://www.google.com/maps/embed?pb=..." /></div>
        <button className="btn btn-red">Save settings</button>
      </form>
    </div>
  );
}
