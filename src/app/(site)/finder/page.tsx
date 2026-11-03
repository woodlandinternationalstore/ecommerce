import type { Metadata } from "next";
import { all, get } from "@/lib/db";
import { compatOf, effectiveStock, maskAll, PUBLIC_WHERE, vehicleSummaries, type Product } from "@/lib/catalog";
import { SITE, waLink } from "@/lib/site";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Vehicle Compatibility Finder",
  description: "Select your vehicle make, model, year and engine to see spare parts matching our recorded compatibility.",
  alternates: { canonical: "/finder" },
};

type Sp = Record<string, string | undefined>;

export default async function Finder({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const makes = await all<{ id: number; name: string }>("SELECT * FROM vehicle_makes ORDER BY name");
  const make = makes.find((m) => m.name === sp.make);
  const models = make ? await all<{ id: number; name: string }>("SELECT id, name FROM vehicle_models WHERE make_id = ? ORDER BY name", make.id) : [];
  const model = models.find((m) => m.name === sp.model);
  const gens = model
    ? await all<{ id: number; name: string; chassis_code: string | null; year_from: number | null; year_to: number | null; engines: string }>(
        "SELECT * FROM vehicle_generations WHERE model_id = ? ORDER BY year_from, name", model.id,
      )
    : [];
  const gen = gens.find((g) => String(g.id) === sp.gen);
  const engines = [...new Set((gen ? [gen] : gens).flatMap((g) => g.engines.split(",").map((e) => e.trim()).filter(Boolean)))];
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : null;
  const engine = sp.engine || "";
  const part = (sp.part ?? "").slice(0, 120);

  let results: { p: Product; confirmed: boolean }[] | null = null;
  if (make && model) {
    const candidates = await maskAll(await all<Product>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${PUBLIC_WHERE} AND EXISTS (SELECT 1 FROM product_compat pc WHERE pc.product_id = p.id AND lower(pc.make) = lower(?) AND lower(pc.model) = lower(?))
       ORDER BY p.name LIMIT 300`,
      make.name, model.name,
    ));
    const tokens = part.toLowerCase().split(/\s+/).filter(Boolean);
    results = [];
    for (const p of candidates) {
      if (tokens.length && !tokens.every((t) => p.search_text.includes(t))) continue;
      let ok = false;
      let confirmed = false;
      for (const c of await compatOf(p.id)) {
        if (c.make.toLowerCase() !== make.name.toLowerCase() || c.model.toLowerCase() !== model.name.toLowerCase()) continue;
        const genOk = !gen || !c.generation || c.generation.toLowerCase() === gen.name.toLowerCase();
        const yearOk = year === null || ((c.year_from === null || year >= c.year_from) && (c.year_to === null || year <= c.year_to));
        const engOk = !engine || !c.engine || c.engine.toLowerCase() === engine.toLowerCase();
        if (!(genOk && yearOk && engOk)) continue;
        ok = true;
        const sure =
          (!gen || !!c.generation) && (year === null || (c.year_from !== null && c.year_to !== null)) && (!engine || !!c.engine);
        if (sure) confirmed = true;
      }
      if (ok) results.push({ p, confirmed });
    }
    void effectiveStock;
  }

  const finderVehicles = await vehicleSummaries((results ?? []).map((r) => r.p.id));
  const vehicleText = [make?.name, model?.name, gen?.name, year, engine].filter(Boolean).join(" ");
  const waText = `WOODLAND INTERNATIONAL STORE\nSPARE PART ENQUIRY\nVehicle: ${vehicleText || "-"}\nPart needed: ${part || "-"}\nPlease confirm availability and fitment.`;
  void get;

  return (
    <div className="container-x py-8">
      <h1 className="text-4xl">Vehicle compatibility finder</h1>
      <p className="mt-1 text-sm text-muted">Only compatibility recorded in our product database is shown.</p>

      <AutoSubmitForm action="/finder" className="card card-grey mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label" htmlFor="make">1. Vehicle make</label>
          <select id="make" name="make" className="field" defaultValue={sp.make ?? ""}>
            <option value="">Select make</option>
            {makes.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="model">2. Vehicle model</label>
          <select id="model" name="model" className="field" defaultValue={sp.model ?? ""} disabled={!make}>
            <option value="">{make ? "Select model" : "Select make first"}</option>
            {models.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gen">3. Generation / chassis (if known)</label>
          <select id="gen" name="gen" className="field" defaultValue={sp.gen ?? ""} disabled={!model}>
            <option value="">Not sure</option>
            {gens.map((g) => <option key={g.id} value={g.id}>{g.name}{g.chassis_code ? ` (${g.chassis_code})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">4. Vehicle year</label>
          <input id="year" name="year" className="field" inputMode="numeric" maxLength={4} placeholder="e.g. 2021" defaultValue={sp.year ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="engine">5. Engine (if applicable)</label>
          <select id="engine" name="engine" className="field" defaultValue={sp.engine ?? ""} disabled={!model}>
            <option value="">Not sure</option>
            {engines.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="part">Spare part needed (optional)</label>
          <input id="part" name="part" className="field" placeholder="e.g. brake pads" defaultValue={part} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3"><button className="btn btn-red">Show matching parts</button></div>
      </AutoSubmitForm>

      {results && (
        <section className="mt-8" aria-live="polite">
          <h2 className="text-2xl">{results.length} {results.length === 1 ? "part" : "parts"} for {vehicleText}</h2>
          <p className="mt-2 rounded-md border-l-4 border-brand bg-surface p-3 text-sm font-bold">
            PLEASE CONFIRM FITMENT WITH OUR SALES TEAM BEFORE ORDERING.
          </p>
          {results.length === 0 ? (
            <p className="mt-4 text-sm">No parts with recorded compatibility for this vehicle yet. Send us the details and we will help.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {results.map(({ p, confirmed }) => (
                <div key={p.id}>
                  <ProductCard p={p} vehicle={finderVehicles.get(p.id)} />
                  {!confirmed && <p className="mt-1 text-xs font-bold text-brand">Fitment uncertain: please confirm with our sales team.</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {make && model && (
        <a href={waLink(waText, SITE.whatsapp)} target="_blank" rel="noopener" className="btn btn-wa mt-6">Send vehicle details on WhatsApp</a>
      )}
    </div>
  );
}
