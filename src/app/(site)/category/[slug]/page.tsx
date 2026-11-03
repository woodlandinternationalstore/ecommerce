import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categoryBySlug } from "@/lib/catalog";
import { getT } from "@/lib/i18n-server";
import { ProductList } from "@/components/product-list";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await categoryBySlug((await params).slug);
  if (!c) return {};
  return { title: `${c.name} | Auto Spare Parts`, description: c.description, alternates: { canonical: `/category/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const t = await getT();
  const { slug } = await params;
  const c = await categoryBySlug(slug);
  if (!c) notFound();
  const sp = await searchParams;
  return (
    <div>
      <section className="hero text-white">
        <div className="container-x py-8">
          <nav aria-label="Breadcrumb" className="text-xs text-silver">
            <Link href="/">{t("Home")}</Link> / <Link href="/categories">{t("Categories")}</Link> / {t(c.name)}
          </nav>
          <h1 className="mt-2 text-4xl">{t(c.name)}</h1>
          <p className="mt-1 max-w-xl text-sm text-silver">{t(c.description)}</p>
        </div>
      </section>
      <div className="container-x py-8"><ProductList sp={sp} basePath={`/category/${c.slug}`} fixedCategory={c.slug} /></div>
    </div>
  );
}
