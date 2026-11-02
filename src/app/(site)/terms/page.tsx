import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms and Conditions", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <div className="container-x max-w-3xl space-y-4 py-10 text-sm leading-relaxed">
      <h1 className="text-4xl">Terms and conditions</h1>
      <p>The business owner should review these terms, and a legal adviser where appropriate, before launch.</p>
      <h2 className="text-2xl">Orders</h2>
      <p>Submitting an order on this website sends an order request to WOODLAND INTERNATIONAL STORE. It is not a confirmed sale. An order is confirmed only when our sales team confirms stock, fitment, price and delivery with you. Opening WhatsApp does not send your message; you must press Send in WhatsApp.</p>
      <h2 className="text-2xl">Prices and availability</h2>
      <p>Prices are shown only when configured. Items marked Price on Request are quoted by our sales team. Subtotals shown on the website exclude such items and any delivery charges, and are not final order totals. Final pricing and availability are confirmed by Woodland.</p>
      <h2 className="text-2xl">Vehicle compatibility</h2>
      <p>Compatibility can vary by model, year, chassis and engine. Customers should confirm the part number and vehicle details with Woodland before finalising an order.</p>
      <h2 className="text-2xl">Delivery</h2>
      <p>Delivery is subject to confirmation. Delivery times and charges are given by Woodland on a per-order basis.</p>
      <h2 className="text-2xl">Warranty and returns</h2>
      <p>Any applicable warranty or returns terms are those confirmed by Woodland for the specific product at the time of sale.</p>
    </div>
  );
}
