import type { MetadataRoute } from "next";
import { all } from "@/lib/db";
import { PUBLIC_WHERE } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const pages = ["", "/shop", "/categories", "/finder", "/about", "/contact", "/faq", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const cats = (await all<{ slug: string }>("SELECT slug FROM categories WHERE published = 1")).map((c) => ({ url: `${base}/category/${c.slug}` }));
  const prods = (await all<{ slug: string; updated_at: string }>(
    `SELECT p.slug, p.updated_at FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${PUBLIC_WHERE}`,
  )).map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date(`${p.updated_at.replace(" ", "T")}Z`) }));
  return [...pages, ...cats, ...prods];
}
