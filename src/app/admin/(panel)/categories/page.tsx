import { requirePerm } from "@/lib/auth";
import { categories } from "@/lib/catalog";
import { deleteCategory, saveCategory } from "./actions";

export default async function Categories({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePerm("categories");
  const sp = await searchParams;
  const cats = categories(false);
  const Form = ({ c }: { c?: (typeof cats)[number] }) => (
    <form action={saveCategory} encType="multipart/form-data" className="card grid gap-3 p-4 md:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div><label className="label">Name *</label><input name="name" defaultValue={c?.name} className="field" required /></div>
      <div><label className="label">Display order</label><input name="display_order" inputMode="numeric" defaultValue={c?.display_order ?? 0} className="field" /></div>
      <div className="md:col-span-2"><label className="label">Description</label><textarea name="description" rows={2} defaultValue={c?.description} className="field" /></div>
      <div><label className="label">Image (JPG/PNG/WebP, max 3 MB)</label><input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="field" /></div>
      <div className="flex items-end gap-4">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={c ? !!c.published : true} /> Published</label>
        <button className="btn btn-red btn-sm">{c ? "Save" : "Add category"}</button>
      </div>
      {c && <p className="text-xs text-muted md:col-span-2">/category/{c.slug} · {c.n} published products</p>}
    </form>
  );
  return (
    <div className="space-y-5">
      <h1 className="text-4xl">Categories</h1>
      {sp.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{sp.error}</p>}
      {sp.saved && <p role="status" className="rounded bg-green-50 p-3 text-sm font-bold text-green-800">Saved.</p>}
      <h2 className="text-2xl">Add a category</h2>
      <Form />
      <h2 className="text-2xl">Existing categories</h2>
      {cats.map((c) => (
        <div key={c.id} className="space-y-1">
          <Form c={c} />
          <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="text-xs font-bold underline">Delete {c.name} (products stay, uncategorised)</button></form>
        </div>
      ))}
    </div>
  );
}
