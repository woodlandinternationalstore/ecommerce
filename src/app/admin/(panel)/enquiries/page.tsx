import { all, run } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SITE, waLink } from "@/lib/site";

type Enq = { id: number; ref: string; name: string; phone: string; part: string; vehicle: string; message: string; status: string; created_at: string };

async function setStatus(fd: FormData) {
  "use server";
  await requirePerm("enquiries");
  const status = String(fd.get("status"));
  if (["new", "contacted", "closed"].includes(status)) run("UPDATE enquiries SET status = ? WHERE id = ?", status, Number(fd.get("id")));
  revalidatePath("/admin/enquiries");
}

export default async function Enquiries() {
  await requirePerm("enquiries");
  const rows = all<Enq>("SELECT * FROM enquiries ORDER BY id DESC LIMIT 300");
  return (
    <div className="space-y-5">
      <h1 className="text-4xl">Customer enquiries</h1>
      {rows.length === 0 && <p className="text-sm text-muted">No enquiries yet.</p>}
      {rows.map((e) => {
        const d = e.phone.replace(/\D/g, "");
        return (
          <article key={e.id} className="card space-y-1 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <b>{e.ref}</b><span className="text-muted">{e.created_at}</span>
              <form action={setStatus} className="ml-auto flex gap-2"><input type="hidden" name="id" value={e.id} />
                <select name="status" defaultValue={e.status} className="field !min-h-9 !py-1 !text-sm"><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
                <button className="btn btn-outline btn-sm">Save</button></form>
            </div>
            <p><b>{e.name}</b> · {e.phone}</p>
            {(e.part || e.vehicle) && <p className="text-muted">{e.part} {e.vehicle && `· ${e.vehicle}`}</p>}
            <p className="whitespace-pre-line">{e.message}</p>
            <a className="btn btn-wa btn-sm mt-1" target="_blank" rel="noopener" href={waLink(`Hello ${e.name}, this is ${SITE.name} replying to your enquiry ${e.ref}.`, d.startsWith("0") ? `255${d.slice(1)}` : d)}>Reply on WhatsApp</a>
          </article>
        );
      })}
    </div>
  );
}
