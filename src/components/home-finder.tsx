"use client";

import { useMemo, useState } from "react";

export type FinderMake = { name: string; models: { name: string; gens: { id: number; name: string }[] }[] };

/** Make / model / year / generation picker that sends the visitor to the full finder with the choices filled in. */
export function HomeFinder({ makes }: { makes: FinderMake[] }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const models = useMemo(() => makes.find((m) => m.name === make)?.models ?? [], [makes, make]);
  const gens = useMemo(() => models.find((m) => m.name === model)?.gens ?? [], [models, model]);
  const year = new Date().getFullYear();
  const years = Array.from({ length: year - 1989 }, (_, i) => year - i);

  return (
    <form action="/finder" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
      <div>
        <label className="label" htmlFor="hf-make">Select make</label>
        <select id="hf-make" name="make" className="field" value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}>
          <option value="">Make</option>
          {makes.map((m) => <option key={m.name}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="hf-model">Select model</label>
        <select id="hf-model" name="model" className="field" value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
          <option value="">{make ? (models.length ? "Model" : "No models added yet") : "Model"}</option>
          {models.map((m) => <option key={m.name}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="hf-year">Select year</label>
        <select id="hf-year" name="year" className="field" defaultValue="">
          <option value="">Year</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="hf-gen">Generation (optional)</label>
        <select id="hf-gen" name="gen" className="field" disabled={!gens.length}>
          <option value="">{gens.length ? "Generation" : "Not sure"}</option>
          {gens.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <button className="btn btn-red sm:col-span-2 lg:col-span-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        Find compatible parts
      </button>
    </form>
  );
}
