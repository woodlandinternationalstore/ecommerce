import type { Metadata } from "next";

import { getT } from "@/lib/i18n-server";
export const metadata: Metadata = { title: "Frequently Asked Questions", alternates: { canonical: "/faq" } };

const FAQ: [string, string][] = [
  ["How do I order?", "Search for your part, add it to the cart, fill in the checkout form and press Send order via WhatsApp. Your order is saved on our system and WhatsApp opens with your message prefilled. You must press Send inside WhatsApp."],
  ["Do I pay on the website?", "No. There is no online payment. The Woodland sales team confirms availability, final prices and payment arrangements with you on WhatsApp."],
  ["Is my order confirmed when WhatsApp opens?", "No. Opening WhatsApp only prepares your message. Your order is confirmed once our staff have checked stock, fitment and prices with you."],
  ["Why do some products say Price on Request?", "We only show a price when it has been configured and verified. Use the Enquire via WhatsApp button for a quote."],
  ["How do I know a part fits my vehicle?", "Compatibility can vary by model, year, chassis and engine. Use the Vehicle Finder, then confirm the part number and vehicle details with our sales team before finalising your order."],
  ["What if I do not know the part number?", "Send us your vehicle make, model, year and chassis number in the checkout form or on WhatsApp, and we will help identify the part."],
  ["Do you deliver?", "Delivery is subject to confirmation. Delivery charges and times are confirmed by the sales team, and shop pickup in Kariakoo is available."],
];

export default async function Faq() {
  const t = await getT();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-4xl">{t("Frequently asked questions")}</h1>
      <div className="mt-6 divide-y divide-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="py-4">
            <summary className="cursor-pointer font-bold">{t(q)}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(a)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
