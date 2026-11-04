import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/db";
import { resetPriceCache } from "@/lib/catalog";

async function save(fd: FormData) {
  "use server";
  await requirePerm("settings");
  await setSetting("business_hours", String(fd.get("business_hours") ?? "").slice(0, 500));
  const map = String(fd.get("map_embed_url") ?? "").trim();
  // only Google Maps embeds are accepted, so an admin typo cannot embed an arbitrary site
  if (map && !/^https:\/\/www\.google\.com\/maps\/embed\?/.test(map)) redirect("/admin/settings?error=Map URL must be a Google Maps embed link.");
  await setSetting("map_embed_url", map);
  await setSetting("show_prices", fd.get("show_prices") === "on" ? "1" : "0");
  resetPriceCache();
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
      {sp.saved && <p role="status" className="rounded bg-surface p-3 text-sm font-bold text-ink ring-1 ring-line">Saved.</p>}
      <form action={save} className="card max-w-xl space-y-3 p-4">
        <div><label className="label" htmlFor="h">Business hours (shown in footer and contact page)</label>
          <textarea id="h" name="business_hours" rows={4} defaultValue={await getSetting("business_hours")} className="field" placeholder="Enter the real opening hours" /></div>
        <div><label className="label" htmlFor="m">Google Maps embed URL (only after the location is verified)</label>
          <input id="m" name="map_embed_url" defaultValue={await getSetting("map_embed_url")} className="field" placeholder="https://www.google.com/maps/embed?pb=..." /></div>
        <label className="flex items-start gap-2 rounded-md bg-surface p-3 text-sm font-bold"><input type="checkbox" name="show_prices" defaultChecked={(await getSetting("show_prices", "1")) !== "0"} className="mt-1" /> <span>Show prices on the website<span className="block text-xs font-normal text-muted">When off, every part shows Price on request and orders are quoted by the sales team. Prices stay saved.</span></span></label>
        <label className="flex items-start gap-2 rounded-md bg-surface p-3 text-sm font-bold">
          <input type="checkbox" name="show_prices" defaultChecked={(await getSetting("show_prices", "1")) !== "0"} className="mt-1" />
          <span>Show prices on the website<span className="block text-xs font-normal text-muted">When off, every part shows Price on request and orders are quoted by the sales team. Prices stay saved.</span></span>
        </label>
        <button className="btn btn-red">Save settings</button>
      </form>
    </div>
  );
}
