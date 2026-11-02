"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can, requirePerm } from "@/lib/auth";
import { get, run, tx } from "@/lib/db";
import { refreshSearch, setStock, STOCK_REASONS, uniqueSlug } from "@/lib/catalog";
import { saveImage } from "@/lib/uploads";
import { parseCompat } from "@/lib/compat";

const intOrNull = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().nonnegative().nullable());
const flag = (fd: FormData, k: string) => (fd.get(k) === "on" ? 1 : 0);

const schema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(200),
  category_id: intOrNull,
  brand: z.string().trim().max(80),
  oem_number: z.string().max(80).transform((s) => s.trim()),
  description: z.string().trim().max(5000),
  condition: z.enum(["new", "used", "refurbished"]),
  authenticity: z.enum(["genuine_verified", "oem_quality", "aftermarket", "unverified"]),
  unit: z.string().trim().min(1).max(30),
  low_stock_threshold: intOrNull,
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "tbc"]),
});

const priceSchema = z.object({
  price_tzs: intOrNull,
  previous_price_tzs: intOrNull,
  price_mode: z.enum(["exact", "request", "message"]),
  price_message: z.string().trim().max(300),
});

export async function saveProduct(formData: FormData) {
  const staff = await requirePerm("products");
  const id = Number(formData.get("id") || 0);
  const back = id ? `/admin/products/${id}` : "/admin/products/new";
  const fail = (m: string): never => redirect(`${back}?error=${encodeURIComponent(m)}`);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0].message);
  const v = parsed.data!;
  const compat = parseCompat(String(formData.get("compat") ?? ""));
  if (compat.errors.length) fail(compat.errors[0]);

  const alts = [...new Set(String(formData.get("alt_numbers") ?? "").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean))];
  const qtyRaw = String(formData.get("stock_qty") ?? "").trim();
  const newQty = qtyRaw === "" ? null : Number(qtyRaw);
  if (newQty !== null && (!Number.isInteger(newQty) || newQty < 0)) fail("Stock quantity must be a whole number, 0 or more.");

  let price: z.infer<typeof priceSchema> | null = null;
  if (can(staff.role, "pricing")) {
    const p = priceSchema.safeParse(Object.fromEntries(formData));
    if (!p.success) return fail(p.error.issues[0].message);
    price = p.data;
    if (price.price_mode === "exact" && !price.price_tzs) fail("Enter a selling price, or choose Price on request.");
  }

  const productId = tx(() => {
    let pid = id;
    if (!pid) {
      const slug = uniqueSlug(`${v.name} ${v.oem_number}`, "products");
      const r = run("INSERT INTO products(name, slug) VALUES(?,?)", v.name, slug);
      pid = Number(r.lastInsertRowid);
    } else if (!get("SELECT 1 FROM products WHERE id = ?", pid)) {
      throw new Error("missing");
    }
    run(
      `UPDATE products SET name=?, category_id=?, brand=?, oem_number=?, description=?, condition=?, authenticity=?, unit=?,
        low_stock_threshold=?, stock_status=?, track_stock=?, allow_enquiry_oos=?, featured=?, published=?, updated_at=datetime('now') WHERE id=?`,
      v.name, v.category_id, v.brand, v.oem_number, v.description, v.condition, v.authenticity, v.unit,
      v.low_stock_threshold ?? 3, v.stock_status, flag(formData, "track_stock"), flag(formData, "allow_enquiry_oos"),
      flag(formData, "featured"), can(staff.role, "products") ? flag(formData, "published") : 0, pid,
    );
    if (price) {
      run(
        "UPDATE products SET price_tzs=?, previous_price_tzs=?, price_mode=?, price_message=? WHERE id=?",
        price.price_mode === "exact" ? price.price_tzs : price.price_tzs, price.previous_price_tzs, price.price_mode, price.price_message, pid,
      );
    }
    // stock: only touched when the quantity actually changed, and only with the stock permission
    const cur = get<{ stock_qty: number | null }>("SELECT stock_qty FROM products WHERE id = ?", pid)!.stock_qty;
    if (can(staff.role, "stock") && newQty !== null && newQty !== cur) {
      const reason = (STOCK_REASONS as readonly string[]).includes(String(formData.get("stock_reason"))) ? String(formData.get("stock_reason")) : "Manual Adjustment";
      setStock(pid, newQty, reason, staff.id);
    }
    run("DELETE FROM product_alt_numbers WHERE product_id = ?", pid);
    for (const a of alts) run("INSERT INTO product_alt_numbers(product_id, part_number) VALUES(?,?)", pid, a);
    run("DELETE FROM product_compat WHERE product_id = ?", pid);
    for (const c of compat.rows) {
      run(
        "INSERT INTO product_compat(product_id, make, model, generation, chassis_code, year_from, year_to, engine) VALUES(?,?,?,?,?,?,?,?)",
        pid, c.make, c.model, c.generation, c.chassis, c.from, c.to, c.engine,
      );
    }
    refreshSearch(pid);
    return pid;
  });

  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function uploadImage(formData: FormData) {
  await requirePerm("products");
  const id = Number(formData.get("id"));
  const file = formData.get("image");
  const back = `/admin/products/${id}`;
  if (!(file instanceof File) || !get("SELECT 1 FROM products WHERE id = ?", id)) redirect(`${back}?error=Choose an image file.`);
  const res = await saveImage(file as File);
  if ("error" in res) redirect(`${back}?error=${encodeURIComponent(res.error)}`);
  const url = (res as { url: string }).url;
  const alt = String(formData.get("alt") ?? "").slice(0, 200);
  run("INSERT INTO product_images(product_id, url, alt, sort) VALUES(?,?,?,?)", id, url, alt, 0);
  if (!get<{ main_image: string | null }>("SELECT main_image FROM products WHERE id = ?", id)!.main_image) {
    run("UPDATE products SET main_image = ? WHERE id = ?", url, id);
  }
  run("UPDATE products SET updated_at = datetime('now') WHERE id = ?", id);
  revalidatePath("/", "layout");
  redirect(`${back}?saved=1`);
}

export async function setMainImage(formData: FormData) {
  await requirePerm("products");
  const id = Number(formData.get("id"));
  const url = String(formData.get("url"));
  if (get("SELECT 1 FROM product_images WHERE product_id = ? AND url = ?", id, url)) {
    run("UPDATE products SET main_image = ?, updated_at = datetime('now') WHERE id = ?", url, id);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${id}?saved=1`);
}

export async function deleteImage(formData: FormData) {
  await requirePerm("products");
  const id = Number(formData.get("id"));
  const imageId = Number(formData.get("imageId"));
  const img = get<{ url: string }>("SELECT url FROM product_images WHERE id = ? AND product_id = ?", imageId, id);
  if (img) {
    run("DELETE FROM product_images WHERE id = ?", imageId);
    const main = get<{ main_image: string | null }>("SELECT main_image FROM products WHERE id = ?", id)?.main_image;
    if (main === img.url) {
      const next = get<{ url: string }>("SELECT url FROM product_images WHERE product_id = ? ORDER BY id LIMIT 1", id);
      run("UPDATE products SET main_image = ? WHERE id = ?", next?.url ?? null, id);
    }
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${id}?saved=1`);
}

/** Quick toggles from the list page. */
export async function quickToggle(formData: FormData) {
  await requirePerm("products");
  const id = Number(formData.get("id"));
  const field = String(formData.get("field"));
  if (!["published", "featured", "archived"].includes(field)) return;
  run(`UPDATE products SET ${field} = 1 - ${field}, updated_at = datetime('now') WHERE id = ?`, id);
  revalidatePath("/", "layout");
  redirect(String(formData.get("back") || "/admin/products"));
}

export async function deleteProduct(formData: FormData) {
  await requirePerm("products");
  const id = Number(formData.get("id"));
  run("DELETE FROM products WHERE id = ?", id);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function loadDemoData() {
  await requirePerm("products");
  const cat = (slug: string) => get<{ id: number }>("SELECT id FROM categories WHERE slug = ?", slug)?.id ?? null;
  const demo: [string, string, string, string, string, string, string][] = [
    ["Front Lower Arm", "DEMO-48068-0K090", "suspension-parts", "Toyota", "Hilux", "Revo", "Toyota"],
    ["Brake Pad Set", "DEMO-04465-60320", "brake-systems", "Toyota", "Land Cruiser Prado", "150", "Toyota"],
    ["Oil Filter", "DEMO-90915-YZZD4", "filters-lubricants", "Toyota", "Corolla", "E120", "Toyota"],
    ["Front Wheel Bearing", "DEMO-40210-JK000", "bearings", "Nissan", "Patrol", "Y62", "Nissan"],
  ];
  tx(() => {
    for (const [name, oem, c, make, model, gen, brand] of demo) {
      if (get("SELECT 1 FROM products WHERE oem_number = ?", oem)) continue;
      const r = run(
        `INSERT INTO products(name, slug, category_id, oem_number, brand, description, price_mode, published, is_demo)
         VALUES(?,?,?,?,?,?, 'request', 1, 1)`,
        `${name} (DEMO)`, uniqueSlug(`${name} demo ${oem}`, "products"), cat(c), oem, brand,
        "DEMO DATA for testing only. Not a real product, price or stock record.",
      );
      const pid = Number(r.lastInsertRowid);
      run("INSERT INTO product_compat(product_id, make, model, generation) VALUES(?,?,?,?)", pid, make, model, gen);
      refreshSearch(pid);
    }
  });
  revalidatePath("/", "layout");
  redirect("/admin/products?msg=Demo products added. They are labelled DEMO and can be removed.");
}

export async function removeDemoData() {
  await requirePerm("products");
  run("DELETE FROM products WHERE is_demo = 1");
  revalidatePath("/", "layout");
  redirect("/admin/products?msg=Demo products removed.");
}
