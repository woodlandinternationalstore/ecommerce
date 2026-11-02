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
    <div>
      <section className="hero text-white">
        <div className="container-x py-9 md:py-12">
          <p className="eyebrow hero-in">Shop</p>
          <h1 className="hero-in mt-2 text-4xl sm:text-5xl" style={{ "--d": "100ms" } as React.CSSProperties}>{sp.q ? `Results for “${sp.q}”` : "Shop all spare parts"}</h1>
        </div>
      </section>
      <div className="container-x py-8"><ProductList sp={sp} basePath="/shop" /></div>
    </div>
  );
}
