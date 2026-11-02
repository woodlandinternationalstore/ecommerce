import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/lib/catalog";

export const metadata: Metadata = { title: "Spare Parts Categories", alternates: { canonical: "/categories" } };

export default async function Categories() {
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl">Spare parts categories</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(await categories()).map((c) => (
          <div key={c.id} className="card card-grey flex flex-col p-4">
            <h2 className="text-2xl">{c.name}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{c.description}</p>
            <p className="mt-2 text-xs text-muted">{c.n} {c.n === 1 ? "product" : "products"} listed</p>
            <Link href={`/category/${c.slug}`} className="btn btn-red btn-sm mt-3 self-start">View Products</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
