import { SITE, waLink } from "./site";

export type MessageItem = {
  name: string;
  partNumber: string;
  vehicle: string;
  qty: number;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type MessageOrder = {
  ref: string;
  customerName: string;
  whatsapp: string;
  altPhone: string;
  deliveryMethod: string;
  deliveryLocation: string;
  region: string;
  contactMethod: string;
  vehicleInfo: string;
  notes: string;
  items: MessageItem[];
  knownSubtotal: number;
  unknownCount: number;
};

const money = (n: number) => `TZS ${n.toLocaleString("en-US")}`;
const orDash = (s: string) => (s.trim() ? s.trim() : "-");

export function buildOrderMessage(o: MessageOrder): string {
  const lines: string[] = [
    SITE.name,
    "NEW CUSTOMER ORDER",
    `Order Reference: ${o.ref}`,
    "",
    "CUSTOMER DETAILS",
    `Name: ${o.customerName}`,
    `WhatsApp: ${o.whatsapp}`,
    `Alternative Phone: ${orDash(o.altPhone)}`,
    `Preferred Contact: ${o.contactMethod === "phone" ? "Phone call" : "WhatsApp"}`,
    "",
    "DELIVERY DETAILS",
    `Method: ${o.deliveryMethod}`,
    `Location: ${orDash(o.deliveryLocation)}`,
    `Region: ${orDash(o.region)}`,
    "",
    "ORDER ITEMS",
  ];
  o.items.forEach((it, i) => {
    lines.push(
      `${i + 1}. Product: ${it.name}`,
      `   Part Number: ${orDash(it.partNumber)}`,
      `   Vehicle: ${orDash(it.vehicle)}`,
      `   Quantity: ${it.qty}`,
      `   Unit Price: ${it.unitPrice !== null ? money(it.unitPrice) : "Price on Request"}`,
      `   Line Total: ${it.lineTotal !== null ? money(it.lineTotal) : "To Be Confirmed"}`,
    );
  });
  lines.push(
    "",
    "ORDER SUMMARY",
    `Known-Price Subtotal: ${money(o.knownSubtotal)}`,
    `Items Requiring Price Confirmation: ${o.unknownCount}`,
    "Delivery Fee: To Be Confirmed",
    "Final Order Total: To Be Confirmed by Woodland",
    "",
    "Vehicle Details:",
    orDash(o.vehicleInfo),
    "",
    "Customer Notes:",
    orDash(o.notes),
    "",
    "Please confirm stock availability, correct vehicle fitment, final prices, and delivery arrangements.",
    "Thank you for choosing Woodland International Store.",
    "Kariakoo — Ungoni & Kipande Street",
    `WhatsApp: ${SITE.whatsappDisplay}`,
    `Alternative Contact: ${SITE.altPhoneDisplay}`,
  );
  return lines.join("\n");
}

export const orderWhatsAppUrl = (o: MessageOrder) => waLink(buildOrderMessage(o));

export function buildProductEnquiry(p: { name: string; partNumber: string; qty: number; url: string }) {
  return [
    "WOODLAND INTERNATIONAL STORE",
    "PRODUCT ENQUIRY",
    `Product: ${p.name}`,
    `Part Number: ${orDash(p.partNumber)}`,
    `Quantity: ${p.qty}`,
    `Product Page: ${p.url}`,
    "",
    "Please confirm availability, price and fitment.",
  ].join("\n");
}

export function buildEnquiryMessage(e: { ref: string; name: string; phone: string; part: string; vehicle: string; message: string }) {
  return [
    "WOODLAND INTERNATIONAL STORE",
    "CUSTOMER ENQUIRY",
    `Enquiry Reference: ${e.ref}`,
    `Name: ${e.name}`,
    `Phone: ${e.phone}`,
    `Part / Part Number: ${orDash(e.part)}`,
    `Vehicle: ${orDash(e.vehicle)}`,
    "",
    e.message,
  ].join("\n");
}
