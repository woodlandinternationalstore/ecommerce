import { NextResponse } from "next/server";
import { all } from "@/lib/db";
import { PUBLIC_WHERE } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get("slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (!slugs.length) return NextResponse.json({ items: [] });
  const items = await all<{ name: string; slug: string; oem: string }>(
    `SELECT p.name, p.slug, p.oem_number AS oem FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug IN (${slugs.map(() => "?").join(",")}) AND ${PUBLIC_WHERE}`,
    ...slugs,
  );
  return NextResponse.json({ items });
}
