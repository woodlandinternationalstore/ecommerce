"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can, requirePerm } from "@/lib/auth";
import { get, run, setSetting } from "@/lib/db";
import { applyImport, previewImport, type ImportPreview } from "@/lib/product-import";

const key = (id: number) => `import_preview_${id}`;

export async function uploadCsv(formData: FormData) {
  const staff = await requirePerm("import");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/import?error=Choose a CSV file.");
  if ((file as File).size > 4 * 1024 * 1024) redirect("/admin/import?error=File is larger than 4 MB.");
  const text = await (file as File).text();
  const preview = previewImport(text, can(staff.role, "pricing"));
  if (preview.rows.length === 0) redirect("/admin/import?error=No data rows found. Check the header row and use the template.");
  setSetting(key(staff.id), JSON.stringify(preview));
  redirect("/admin/import?preview=1");
}

export async function confirmImport() {
  const staff = await requirePerm("import");
  const raw = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key(staff.id))?.value;
  if (!raw) redirect("/admin/import?error=Nothing to import. Upload a file first.");
  const preview = JSON.parse(raw!) as ImportPreview;
  const res = applyImport(preview, staff.id);
  run("DELETE FROM settings WHERE key = ?", key(staff.id));
  revalidatePath("/", "layout");
  redirect(`/admin/import?done=${res.created}-${res.updated}`);
}

export async function cancelImport() {
  const staff = await requirePerm("import");
  run("DELETE FROM settings WHERE key = ?", key(staff.id));
  redirect("/admin/import");
}
