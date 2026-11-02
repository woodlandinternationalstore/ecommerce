"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Hit = { name: string; slug: string; oem: string; brand: string };

export function SearchBox({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);
  const listId = useId();

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        if (r.ok) setHits((await r.json()).hits);
      } catch {
        /* aborted or offline: no suggestions */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <form
      ref={box}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        className="field pr-12"
        type="search"
        name="q"
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Search part, part number or vehicle"
        aria-label="Search spare parts"
        aria-controls={listId}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <button type="submit" aria-label="Search" className="absolute right-0 top-0 flex h-[46px] w-11 items-center justify-center text-brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
      {open && hits.length > 0 && (
        <ul id={listId} className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-auto rounded-lg border border-line bg-white shadow-lg">
          {hits.map((h) => (
            <li key={h.slug}>
              <a href={`/product/${h.slug}`} className="block border-b border-line px-3 py-2.5 last:border-0 hover:bg-surface">
                <span className="block text-sm font-bold">{h.name}</span>
                <span className="partno block text-xs text-muted">
                  {h.oem || "No part number"} {h.brand && `· ${h.brand}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
