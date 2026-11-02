"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { name: string; slug: string; oem: string };
const KEY = "wis_recent_v1";

export function RecentlyViewed({ slug }: { slug: string }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let slugs: string[] = [];
    try {
      slugs = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (!Array.isArray(slugs)) slugs = [];
    } catch {
      slugs = [];
    }
    const others = slugs.filter((s) => s !== slug).slice(0, 4);
    try {
      localStorage.setItem(KEY, JSON.stringify([slug, ...others].slice(0, 8)));
    } catch {
      /* ignore */
    }
    if (!others.length) return;
    fetch(`/api/recent?slugs=${encodeURIComponent(others.join(","))}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, [slug]);

  if (!items.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-3xl">Recently viewed</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <li key={i.slug} className="card card-grey p-3">
            <Link href={`/product/${i.slug}`} className="block font-bold hover:text-brand">{i.name}</Link>
            <span className="partno text-xs text-muted">{i.oem}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
