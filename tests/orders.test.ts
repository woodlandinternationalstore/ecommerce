import { beforeAll, describe, expect, it } from "vitest";

process.env.DB_DRIVER = "pglite";

let D: typeof import("../src/lib/db");
let O: typeof import("../src/lib/orders");
let S: typeof import("../src/lib/search");
let C: typeof import("../src/lib/catalog");
let W: typeof import("../src/lib/whatsapp");

async function addProduct(o: Partial<{ name: string; oem: string; price: number | null; qty: number | null; published: number; make: string; model: string; allowOos: number }>) {
  const slug = await C.uniqueSlug(`${o.name}-${o.oem}`, "products");
  const id = await D.insert(
    `INSERT INTO products(name, slug, oem_number, brand, price_tzs, price_mode, stock_qty, published, allow_enquiry_oos)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    o.name ?? "Part", slug, o.oem ?? "", "Toyota", o.price ?? null, o.price ? "exact" : "request",
    o.qty ?? null, o.published ?? 1, o.allowOos ?? 1,
  );
  if (o.make) await D.run("INSERT INTO product_compat(product_id, make, model) VALUES(?,?,?)", id, o.make, o.model ?? "");
  await C.refreshSearch(id);
  return id;
}

const base = {
  name: "Asha Mwangi", whatsapp: "+255 712 345 678", deliveryMethod: "pickup" as const,
};
let n = 0;
const key = () => `test-key-${++n}-xxxxxxxx`;

beforeAll(async () => {
  D = await import("../src/lib/db");
  O = await import("../src/lib/orders");
  S = await import("../src/lib/search");
  C = await import("../src/lib/catalog");
  W = await import("../src/lib/whatsapp");
}, 60_000);

describe("search", () => {
  it("finds exact part numbers ignoring hyphens, case and spaces", async () => {
    await addProduct({ name: "Front Lower Arm", oem: "48068-0K090", make: "Toyota", model: "Hilux Revo" });
    for (const q of ["48068-0K090", "480680k090", "48068 0k090", "48068-0k"]) {
      expect((await S.searchProducts({ q })).items.map((p) => p.oem_number)).toContain("48068-0K090");
    }
  });
  it("finds by vehicle + part words and plurals", async () => {
    await addProduct({ name: "Brake Pad Set", oem: "04465-60320", make: "Toyota", model: "Prado 150" });
    expect((await S.searchProducts({ q: "Prado 150 brake pads" })).total).toBe(1);
  });
  it("does not return unrelated products for an unmatched part number", async () => {
    expect((await S.searchProducts({ q: "99999-XXXXX" })).total).toBe(0);
  });
  it("hides unpublished products", async () => {
    await addProduct({ name: "Hidden Widget", oem: "HID-111", published: 0 });
    expect((await S.searchProducts({ q: "hidden widget" })).total).toBe(0);
  });
  it("preserves leading zeros and hyphens exactly", async () => {
    const id = await addProduct({ name: "Gasket", oem: "00123-AB" });
    expect((await C.productById(id))!.oem_number).toBe("00123-AB");
  });
});

describe("createOrder", () => {
  it("saves order, snapshots lines and prices from the database", async () => {
    const a = await addProduct({ name: "Oil Filter", oem: "90915-YZZD4", price: 15000, qty: 10 });
    const b = await addProduct({ name: "Unpriced Arm", oem: "UP-1", price: null });
    const { order, duplicate } = await O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 2 }, { productId: b, qty: 1 }] });
    expect(duplicate).toBe(false);
    expect(order.ref).toMatch(/^WIS-\d{8}-\d{4}$/);
    expect(order.status).toBe("pending_confirmation");
    expect(order.handoff_status).toBe("not_opened");
    expect(order.known_subtotal).toBe(30000);
    expect(order.unknown_count).toBe(1);
    const items = await O.orderItems(order.id);
    expect(items.find((i) => i.name === "Unpriced Arm")!.unit_price).toBeNull();
    // later product edits must not change history
    await D.run("UPDATE products SET name = 'Renamed', price_tzs = 99999 WHERE id = ?", a);
    expect((await O.orderItems(order.id)).find((i) => i.part_number === "90915-YZZD4")!.name).toBe("Oil Filter");
  });
  it("is idempotent for repeated clicks", async () => {
    const a = await addProduct({ name: "Spark Plug", oem: "SP-1", price: 5000, qty: 50 });
    const k = key();
    const first = await O.createOrder({ ...base, idempotencyKey: k, items: [{ productId: a, qty: 1 }] });
    const second = await O.createOrder({ ...base, idempotencyKey: k, items: [{ productId: a, qty: 1 }] });
    expect(second.duplicate).toBe(true);
    expect(second.order.ref).toBe(first.order.ref);
  });
  it("gives two simultaneous orders different references", async () => {
    const a = await addProduct({ name: "Wiper", oem: "WP-1", price: 3000, qty: 50 });
    const [x, y] = await Promise.all([
      O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 1 }] }),
      O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 1 }] }),
    ]);
    expect(x.order.ref).not.toBe(y.order.ref);
  });
  it("rejects quantities above confirmed stock and unpublished products", async () => {
    const a = await addProduct({ name: "Pad", oem: "PAD-1", price: 1000, qty: 2 });
    await expect(O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 3 }] })).rejects.toThrow(/Only 2/);
    const h = await addProduct({ name: "Gone", oem: "G-1", published: 0 });
    await expect(O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: h, qty: 1 }] })).rejects.toThrow(/no longer available/);
  });
  it("does not reduce stock when an order is created", async () => {
    const a = await addProduct({ name: "Belt", oem: "BELT-1", price: 2000, qty: 5 });
    await O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 2 }] });
    expect((await C.productById(a))!.stock_qty).toBe(5);
  });
  it("validates delivery details and empty carts", async () => {
    await expect(O.createOrder({ ...base, idempotencyKey: key(), items: [] })).rejects.toThrow();
    const a = await addProduct({ name: "Hose", oem: "H-1", price: 100 });
    await expect(O.createOrder({ ...base, deliveryMethod: "local", idempotencyKey: key(), items: [{ productId: a, qty: 1 }] })).rejects.toThrow();
  });
  it("accepts international phone numbers", () => {
    expect(O.phoneSchema.safeParse("+44 20 7946 0958").success).toBe(true);
    expect(O.phoneSchema.safeParse("abc").success).toBe(false);
  });
  it("only opens the handoff link with the right token and never changes order status", async () => {
    const a = await addProduct({ name: "Cap", oem: "CAP-1", price: 100 });
    const { order } = await O.createOrder({ ...base, idempotencyKey: key(), items: [{ productId: a, qty: 1 }] });
    expect(await O.markLinkOpened(order.ref, "wrong")).toBe(false);
    expect(await O.markLinkOpened(order.ref, order.access_token)).toBe(true);
    const after = await D.get<{ status: string; handoff_status: string }>("SELECT status, handoff_status FROM orders WHERE id = ?", order.id);
    expect(after).toEqual({ status: "pending_confirmation", handoff_status: "link_opened" });
  });
});

describe("whatsapp message", () => {
  it("uses the primary number and encodes spaces, symbols and line breaks", async () => {
    const a = await addProduct({ name: "Lower Arm & Bush", oem: "48068-0K090", price: null, make: "Toyota", model: "Hilux Revo" });
    const { order } = await O.createOrder({ ...base, idempotencyKey: key(), notes: "Call me #1 & thanks", items: [{ productId: a, qty: 2 }] });
    const url = await O.whatsappUrlFor(order);
    expect(url.startsWith("https://wa.me/255771889889?text=")).toBe(true);
    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text).toBe(await O.messageTextFor(order));
    expect(text).toContain(`Order Reference: ${order.ref}`);
    expect(text).toContain("Part Number: 48068-0K090");
    expect(text).toContain("Quantity: 2");
    expect(text).toContain("Unit Price: Price on Request");
    expect(text).toContain("Line Total: To Be Confirmed");
    expect(text).toContain("Items Requiring Price Confirmation: 1");
    expect(text).toContain("Final Order Total: To Be Confirmed by Woodland");
    expect(text).toContain("Lower Arm & Bush");
    expect(url).not.toContain("\n");
    expect(url).toContain("%0A");
    expect(W.buildProductEnquiry({ name: "X", partNumber: "1", qty: 1, url: "u" })).toContain("Product Page: u");
  });
});
