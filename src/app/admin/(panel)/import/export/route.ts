import { NextResponse } from "next/server";
import { can, currentStaff } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { exportRows, IMPORT_COLUMNS } from "@/lib/product-import";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await currentStaff();
  if (!staff || !can(staff.role, "import")) return new NextResponse("Forbidden", { status: 403 });
  const rows = exportRows();
  // staff without pricing permission still get a complete file, but prices are blanked
  const priceIdx = [IMPORT_COLUMNS.indexOf("price_tzs"), IMPORT_COLUMNS.indexOf("price_mode")];
  const out = can(staff.role, "pricing") ? rows : rows.map((r) => r.map((c, i) => (priceIdx.includes(i) ? "" : c)));
  return new NextResponse(toCsv([[...IMPORT_COLUMNS], ...out]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="woodland-products.csv"' },
  });
}
