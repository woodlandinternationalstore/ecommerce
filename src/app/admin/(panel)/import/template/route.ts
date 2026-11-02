import { NextResponse } from "next/server";
import { can, currentStaff } from "@/lib/auth";
import { templateCsv } from "@/lib/product-import";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await currentStaff();
  if (!staff || !can(staff.role, "import")) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(`﻿${templateCsv()}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="woodland-product-template.csv"' },
  });
}
