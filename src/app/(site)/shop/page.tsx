import type { Metadata } from "next";
import { ProductList } from "@/components/product-list";

export const metadata: Metadata = {
  title: "Shop All Spare Parts",
  description: "Search and filter automotive spare parts by category, vehicle, brand and part number.",
  alternates: { canonical: "/shop" },
};

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl">{sp.q ? `Results for “${sp.q}”` : "Shop all products"}</h1>
      <div className="mt-6"><ProductList sp={sp} basePath="/shop" /></div>
    </div>
  );
}
