import { NextResponse } from "next/server";
import { suggest } from "@/lib/search";
import { rateLimit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`suggest:${ip}`, 120, 60_000)) return NextResponse.json({ hits: [] }, { status: 429 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ hits: await suggest(q.slice(0, 80)) });
}
