import type { Metadata } from "next";
import Link from "next/link";
import { SITE, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Woodland",
  description: "About WOODLAND INTERNATIONAL STORE, an automotive spare parts business in Kariakoo, Dar es Salaam.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-4xl">About Woodland</h1>
      <p className="mt-4 leading-relaxed">
        WOODLAND INTERNATIONAL STORE is an automotive spare parts business based in Kariakoo, Dar es Salaam, Tanzania. We help vehicle owners, mechanics,
        workshops, and spare parts buyers find suitable automotive components through convenient product browsing and direct assistance from our sales team.
      </p>
      <p className="mt-4 leading-relaxed">
        Our focus is on helping customers identify the right spare parts, understand product information, confirm vehicle compatibility, and order conveniently through WhatsApp.
      </p>
      <p className="mt-4 leading-relaxed">
        Our commitment is to provide responsive customer service, transparent product information, and convenient access to automotive spare parts.
      </p>
      <div className="card card-grey mt-8 p-5 text-sm">
        <h2 className="text-2xl">Visit the shop</h2>
        <p className="mt-1">{SITE.address}</p>
        <p>{SITE.whatsappDisplay} · {SITE.altPhoneDisplay}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn btn-red">Browse products</Link>
        <a href={waLink()} target="_blank" rel="noopener" className="btn btn-wa">WhatsApp us</a>
      </div>
    </div>
  );
}
