import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_FILE = ":memory:";

let D: typeof import("../src/lib/db");
let I: typeof import("../src/lib/product-import");
let C: typeof import("../src/lib/csv");

beforeAll(async () => {
  D = await import("../src/lib/db");
  I = await import("../src/lib/product-import");
  C = await import("../src/lib/csv");
});

describe("csv", () => {
  it("keeps part numbers as text and handles quotes and commas", () => {
    expect(C.parseCsv('name,pn\r\n"Arm, front","00123-AB"\r\n')).toEqual([["name", "pn"], ["Arm, front", "00123-AB"]]);
  });
  it("neutralises formula injection on export", () => {
    expect(C.toCsv([["=SUM(A1)"]])).toContain("'=SUM(A1)");
  });
});

describe("product import", () => {
  it("previews errors, duplicates and bad prices without writing", () => {
    const csv = "name,oem_number,price_tzs\nArm,00123-AB,15000\nArm again,00123-AB,10\nBad price,X-1,12.5\n,X-2,\n";
    const p = I.previewImport(csv, true);
    expect(p.rows.map((r) => r.action)).toEqual(["create", "error", "error", "error"]);
    expect(D.get<{ n: number }>("SELECT COUNT(*) n FROM products")!.n).toBe(0);
  });
  it("creates, then updates only the columns present and logs stock", () => {
    D.run("INSERT INTO users(email, name, password_hash, role) VALUES('t@x.co', 'T', 'x', 'super_admin')");
    const first = I.previewImport("name,oem_number,brand,price_tzs,price_mode\nSpark Plug,0045-SP,NGK,5000,exact\n", true);
    I.applyImport(first, 1);
    const stockOnly = I.previewImport("oem_number,stock_qty\n0045-SP,12\n", false);
    expect(stockOnly.rows[0].action).toBe("update");
    I.applyImport(stockOnly, 1);
    const p = D.get<{ name: string; brand: string; price_tzs: number; stock_qty: number; oem_number: string }>("SELECT * FROM products WHERE oem_number = '0045-SP'")!;
    expect(p).toMatchObject({ name: "Spark Plug", brand: "NGK", price_tzs: 5000, stock_qty: 12, oem_number: "0045-SP" });
    expect(D.get<{ n: number }>("SELECT COUNT(*) n FROM stock_movements")!.n).toBe(1);
  });
  it("ignores price columns for users without the pricing permission", () => {
    const p = I.previewImport("oem_number,price_tzs\n0045-SP,1\n", false);
    expect(p.ignored.length).toBe(1);
    expect(p.columns).not.toContain("price_tzs");
  });
});
