import { all } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { addGeneration, addMake, addModel, removeVehicle } from "./actions";

type Gen = { id: number; model_id: number; name: string; chassis_code: string | null; year_from: number | null; year_to: number | null; engines: string };

export default async function Vehicles({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requirePerm("vehicles");
  const { msg } = await searchParams;
  const makes = all<{ id: number; name: string }>("SELECT * FROM vehicle_makes ORDER BY name");
  const models = all<{ id: number; make_id: number; name: string }>("SELECT * FROM vehicle_models ORDER BY name");
  const gens = all<Gen>("SELECT * FROM vehicle_generations ORDER BY year_from, name");
  const Del = ({ kind, id }: { kind: string; id: number }) => (
    <form action={removeVehicle} className="inline"><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><button className="ml-2 text-xs underline" aria-label="Remove">remove</button></form>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Vehicles</h1>
      <p className="text-sm text-muted">These lists feed the Vehicle Finder. Product compatibility is set on each product.</p>
      {msg && <p role="status" className="rounded bg-green-50 p-3 text-sm font-bold text-green-800">{msg}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <form action={addMake} className="card space-y-2 p-4"><h2 className="text-xl">Add make</h2><input name="name" className="field" placeholder="e.g. Toyota" required /><button className="btn btn-red btn-sm">Add</button></form>
        <form action={addModel} className="card space-y-2 p-4"><h2 className="text-xl">Add model</h2>
          <select name="make_id" className="field" required><option value="">Make</option>{makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input name="name" className="field" placeholder="e.g. Hilux" required /><button className="btn btn-red btn-sm">Add</button></form>
        <form action={addGeneration} className="card space-y-2 p-4"><h2 className="text-xl">Add generation</h2>
          <select name="model_id" className="field" required><option value="">Model</option>{models.map((m) => <option key={m.id} value={m.id}>{makes.find((k) => k.id === m.make_id)?.name} {m.name}</option>)}</select>
          <input name="name" className="field" placeholder="Generation, e.g. Revo" required />
          <input name="chassis_code" className="field" placeholder="Chassis code" />
          <div className="grid grid-cols-2 gap-2"><input name="year_from" className="field" placeholder="From year" inputMode="numeric" /><input name="year_to" className="field" placeholder="To year" inputMode="numeric" /></div>
          <input name="engines" className="field" placeholder="Engines, comma separated" /><button className="btn btn-red btn-sm">Add</button></form>
      </div>
      <div className="card p-4 text-sm">
        {makes.map((mk) => (
          <div key={mk.id} className="border-b border-line py-2 last:border-0">
            <b>{mk.name}</b><Del kind="make" id={mk.id} />
            <ul className="ml-4 list-disc">
              {models.filter((m) => m.make_id === mk.id).map((m) => (
                <li key={m.id}>{m.name}<Del kind="model" id={m.id} />
                  <ul className="ml-4 list-[circle] text-muted">
                    {gens.filter((g) => g.model_id === m.id).map((g) => (
                      <li key={g.id}>{g.name}{g.chassis_code ? ` (${g.chassis_code})` : ""} {g.year_from ?? ""}{g.year_to ? `–${g.year_to}` : ""} {g.engines && `· ${g.engines}`}<Del kind="gen" id={g.id} /></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
