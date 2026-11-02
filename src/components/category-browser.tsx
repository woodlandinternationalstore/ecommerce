"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type Cat = { id: number; name: string; slug: string; description: string; n: number; cover?: string | null };

const COLLAPSED = 8;

/** Searchable, sortable category list. Shows a short list by default so the page is not a wall of boxes. */
export function CategoryBrowser({ cats, variant = "page" }: { cats: Cat[]; variant?: "home" | "page" }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"default" | "az" | "parts">("default");
  const [all, setAll] = useState(false);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = t ? cats.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(t)) : [...cats];
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "parts") list.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    if (!t && !all && variant === "home") list = list.slice(0, COLLAPSED);
    return list;
  }, [cats, q, sort, all, variant]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            className="field pl-11"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories, e.g. brake, filter, bearing"
            aria-label="Search categories"
          />
          <svg className="pointer-events-none absolute left-3.5 top-3.5 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </div>
        <select className="field sm:w-48" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort categories">
          <option value="default">Sort: Featured order</option>
          <option value="az">Sort: A to Z</option>
          <option value="parts">Sort: Most parts</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl bg-surface p-6 text-center text-sm">
          No category matches “{q}”. Try the shop search, or ask us on WhatsApp.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_18px_34px_-20px_rgba(23,24,27,0.5)]"
              >
                {c.cover && (
                  <span className="block h-28 overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.cover} alt="" loading="lazy" className="h-full w-full object-contain p-2 transition duration-700 group-hover:scale-110" />
                  </span>
                )}
                <span className="flex flex-1 flex-col border-t border-line p-4">
                <span className="flex items-start justify-between gap-2">
                  <span className="display text-xl leading-tight">{c.name}</span>
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-brand transition group-hover:bg-brand group-hover:text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </span>
                <span className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</span>
                <span className="mt-3 text-[11px] font-bold uppercase tracking-wider text-brand">
                  {c.n} {c.n === 1 ? "part" : "parts"}
                </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {variant === "home" && !q && cats.length > COLLAPSED && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAll((v) => !v)}>
            {all ? "Show fewer" : `Show all ${cats.length} categories`}
          </button>
          <Link href="/categories" className="btn btn-outline btn-sm">Open categories page</Link>
        </div>
      )}
    </div>
  );
}
