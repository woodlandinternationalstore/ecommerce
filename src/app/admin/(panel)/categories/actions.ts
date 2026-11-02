"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { uniqueSlug } from "@/lib/catalog";
import { saveImage } from "@/lib/uploads";

export async function saveCategory(formData: FormData) {
  await requirePerm("categories");
  const id = Number(formData.get("id") || 0);
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) redirect("/admin/categories?error=Category name is required.");
  const description = String(formData.get("description") ?? "").trim().slice(0, 400);
  const order = Number(formData.get("display_order") || 0);
  const published = formData.get("published") === "on" ? 1 : 0;
  let image: string | null | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const res = await saveImage(file);
    if ("error" in res) redirect(`/admin/categories?error=${encodeURIComponent(res.error)}`);
    image = (res as { url: string }).url;
  }
  if (id && await get("SELECT 1 FROM categories WHERE id = ?", id)) {
    await run("UPDATE categories SET name=?, description=?, display_order=?, published=? WHERE id=?", name, description, Number.isInteger(order) ? order : 0, published, id);
    if (image) await run("UPDATE categories SET image_url = ? WHERE id = ?", image, id);
  } else {
    await run("INSERT INTO categories(name, slug, description, display_order, published, image_url) VALUES(?,?,?,?,?,?)",
      name, await uniqueSlug(name, "categories"), description, Number.isInteger(order) ? order : 0, published, image ?? null);
  }
  revalidatePath("/", "layout");
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(formData: FormData) {
  await requirePerm("categories");
  await run("DELETE FROM categories WHERE id = ?", Number(formData.get("id")));
  revalidatePath("/", "layout");
  redirect("/admin/categories?saved=1");
}
