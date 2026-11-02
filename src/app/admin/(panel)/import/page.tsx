import { get } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import type { ImportPreview } from "@/lib/product-import";
import { cancelImport, confirmImport, uploadCsv } from "./actions";

type Sp = { error?: string; preview?: string; done?: string };

export default async function ImportPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const staff = await requirePerm("import");
  const sp = await searchParams;
  const raw = sp.preview ? get<{ value: string }>("SELECT value FROM settings WHERE key = ?", `import_preview_${staff.id}`)?.value : undefined;
  const preview = raw ? (JSON.parse(raw) as ImportPreview) : null;
  const ok = preview?.rows.filter((r) => r.action !== "error") ?? [];
  const bad = preview?.rows.filter((r) => r.action === "error") ?? [];
  const [created, updated] = (sp.done ?? "").split("-");

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Import / export products</h1>
      {sp.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-brand">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded bg-green-50 p-3 text-sm font-bold text-green-800">Import complete: {created} created, {updated} updated.</p>}

      <section className="card space-y-3 p-4">
        <h2 className="text-2xl">1. Upload a CSV</h2>
        <p className="text-sm text-muted">
          Only the columns in your file are written, so a file with just <code>oem_number</code> and <code>stock_qty</code> updates stock without touching anything else.
          Products are matched by part number. Nothing is saved until you confirm the preview. Excel files: save as CSV (UTF-8) first, and format part-number cells as Text so leading zeros are kept.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/import/template" className="btn btn-outline btn-sm">Download template</a>
          <a href="/admin/import/export" className="btn btn-outline btn-sm">Export all products</a>
        </div>
        <form action={uploadCsv} className="flex flex-wrap items-end gap-2">
          <div><label className="label" htmlFor="file">CSV file (max 4 MB)</label><input id="file" name="file" type="file" accept=".csv,text/csv" className="field" required /></div>
          <button className="btn btn-red">Preview import</button>
        </form>
      </section>

      {preview && (
        <section className="card space-y-3 p-4">
          <h2 className="text-2xl">2. Review the preview</h2>
          <p className="text-sm"><b>{ok.filter((r) => r.action === "create").length}</b> to create · <b>{ok.filter((r) => r.action === "update").length}</b> to update · <b className="text-brand">{bad.length}</b> with errors (these are skipped)</p>
          {preview.ignored.length > 0 && <p className="text-sm text-brand">Ignored columns: {preview.ignored.join(", ")}</p>}
          {preview.unknownColumns.length > 0 && <p className="text-sm text-muted">Unknown columns ignored: {preview.unknownColumns.join(", ")}</p>}
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase"><tr><th className="p-2">Line</th><th>Action</th><th>Name</th><th>Part no.</th><th>Problems</th></tr></thead>
              <tbody className="divide-y divide-line">
                {preview.rows.slice(0, 300).map((r) => (
                  <tr key={r.line}>
                    <td className="p-2">{r.line}</td>
                    <td><span className={`badge ${r.action === "error" ? "bg-red-100 text-red-800" : r.action === "create" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-900"}`}>{r.action}</span></td>
                    <td>{r.values.name}</td><td className="partno text-xs">{r.values.oem_number}</td>
                    <td className="text-xs text-brand">{r.errors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <form action={confirmImport}><button className="btn btn-red" disabled={ok.length === 0}>Confirm import of {ok.length} rows</button></form>
            <form action={cancelImport}><button className="btn btn-outline">Cancel</button></form>
          </div>
        </section>
      )}
    </div>
  );
}
