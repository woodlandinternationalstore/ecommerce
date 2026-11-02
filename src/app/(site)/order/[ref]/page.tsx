import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { messageTextFor, orderByRefAndToken, whatsappUrlFor } from "@/lib/orders";
import { SITE } from "@/lib/site";
import { OrderHandoff } from "@/components/order-handoff";

export const metadata: Metadata = { title: "Order Confirmation", robots: { index: false, follow: false } };

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string; open?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { ref } = await params;
  const { t, open } = await searchParams;
  // The access token in the link is the only way to view an order: guessing a reference is not enough.
  const order = t ? await orderByRefAndToken(ref, t) : undefined;
  if (!order) notFound();

  return (
    <div className="container-x max-w-2xl py-10">
      <p className="display text-sm tracking-widest text-brand">Order saved</p>
      <h1 className="mt-1 text-4xl">{order.ref}</h1>
      <p className="mt-2 text-sm">Keep this reference. We received your order details on our system with status <b>Pending Confirmation</b>.</p>

      <div className="mt-5 rounded-lg border-2 border-wa-dark bg-green-50 p-4 text-sm">
        <p className="font-bold">One more step: send the message in WhatsApp.</p>
        <p className="mt-1">
          Opening WhatsApp only fills in your message. <b>You must press Send</b> inside WhatsApp so the Woodland sales team receives it.
          We do not mark your order as confirmed until our staff have spoken to you.
        </p>
      </div>

      <OrderHandoff
        reference={order.ref}
        token={order.access_token}
        waUrl={await whatsappUrlFor(order)}
        message={await messageTextFor(order)}
        autoNote={open === "1"}
      />

      <div className="card card-grey mt-8 p-4 text-sm">
        <p className="font-bold">What happens next</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Woodland confirms stock, fitment, final prices and delivery with you on {order.contact_method === "phone" ? "a phone call" : "WhatsApp"}.</li>
          <li>Final pricing and availability will be confirmed by Woodland.</li>
          {order.delivery_method === "pickup" && <li>Pickup location: {SITE.address}.</li>}
        </ul>
      </div>
      <Link href="/shop" className="btn btn-outline mt-6">Continue shopping</Link>
    </div>
  );
}
