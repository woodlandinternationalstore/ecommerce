import type { Metadata } from "next";
import { categories } from "@/lib/catalog";
import { CategoryBrowser } from "@/components/category-browser";

export const metadata: Metadata = { title: "Spare Parts Categories", alternates: { canonical: "/categories" } };

export default async function Categories() {
  const cats = await categories();
  return (
    <div className="container-x py-10">
      <p className="eyebrow">Browse</p>
      <h1 className="mt-2 text-5xl">Spare parts categories</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">Search or sort to find a category quickly, or use the shop search to look up a part number directly.</p>
      <div className="mt-6"><CategoryBrowser cats={cats} variant="page" /></div>
    </div>
  );
}
