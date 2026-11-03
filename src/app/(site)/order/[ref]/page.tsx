import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { messageTextFor, orderByRefAndToken, orderItems, STATUS_LABEL, whatsappUrlFor, type OrderStatus } from "@/lib/orders";
import { SITE, tsh } from "@/lib/site";
import { OrderHandoff } from "@/components/order-handoff";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string; open?: string; track?: string }> };

const FLOW: OrderStatus[] = ["pending_confirmation", "price_confirmed", "confirmed", "preparing", "ready_for_pickup", "completed"];

export default async function OrderPage({ params, searchParams }: Props) {
  const t = await getT();
  const { ref } = await params;
  const { t: token, open, track } = await searchParams;
  // The access token in the link is the only way to view an order: guessing a reference is not enough.
  const order = token ? await orderByRefAndToken(ref, token) : undefined;
  if (!order) notFound();

  const items = await orderItems(order.id);
  // Only the status and the date are shown to customers. Staff notes stay internal.
  const history = await all<{ status: OrderStatus; created_at: string }>("SELECT status, created_at FROM order_status_history WHERE order_id = ? ORDER BY id", order.id);
  const delivery = order.delivery_method !== "pickup";
  const flow = delivery ? FLOW.map((s) => (s === "ready_for_pickup" ? ("out_for_delivery" as OrderStatus) : s)) : FLOW;
  const current = order.status === "awaiting_customer" ? "pending_confirmation" : order.status;
  const idx = flow.indexOf(current);
  const cancelled = order.status === "cancelled";
  const showHandoff = order.status === "pending_confirmation" && order.handoff_status !== "confirmed_by_staff";

  return (
    <div className="container-x max-w-2xl py-10">
      <p className="eyebrow">{track ? t("Order tracking") : t("Order saved")}</p>
      <h1 className="partno mt-1 text-3xl normal-case not-italic">{order.ref}</h1>
      <p className="mt-1 text-sm text-muted">{t("Keep this reference. You can follow your order any time on the Track order page.")}</p>

      <section className="card mt-5 p-5" aria-label={t("Order status")}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Current status")}</p>
        <p className={`mt-1 text-2xl font-extrabold ${cancelled ? "text-brand" : ""}`}>{t(STATUS_LABEL[order.status])}</p>
        {order.status === "awaiting_customer" && <p className="mt-1 text-sm font-bold text-brand">{t("We are waiting for your reply. Please check WhatsApp.")}</p>}
        {cancelled ? (
          <p className="mt-2 text-sm text-muted">{t("This order was cancelled. Contact us if you think this is a mistake.")}</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {flow.map((s, i) => {
              const done = i < idx || order.status === "completed";
              const now = i === idx && order.status !== "completed";
              return (
                <li key={s} className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${done ? "bg-green-600 text-white" : now ? "bg-brand text-white pulse" : "bg-surface text-muted ring-1 ring-line"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-sm ${now ? "font-extrabold" : done ? "font-semibold" : "text-muted"}`}>{t(STATUS_LABEL[s])}</span>
                </li>
              );
            })}
          </ol>
        )}
        {history.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-bold">{t("Status history")}</summary>
            <ul className="mt-2 space-y-1 text-muted">
              {history.map((h, i) => <li key={i}>{h.created_at} · {t(STATUS_LABEL[h.status])}</li>)}
            </ul>
          </details>
        )}
      </section>

      {showHandoff && (
        <>
          <div className="mt-5 rounded-lg border-2 border-wa-dark bg-green-50 p-4 text-sm">
            <p className="font-bold">{t("One more step: send the message in WhatsApp.")}</p>
            <p className="mt-1">
              {t("Opening WhatsApp only fills in your message.")} <b>{t("You must press Send")}</b> {t("inside WhatsApp so the Woodland sales team receives it. We do not mark your order as confirmed until our staff have spoken to you.")}
            </p>
          </div>
          <OrderHandoff
            reference={order.ref}
            token={order.access_token}
            waUrl={await whatsappUrlFor(order)}
            message={await messageTextFor(order)}
            autoNote={open === "1"}
          />
        </>
      )}

      <section className="card mt-6 p-5 text-sm">
        <h2 className="text-xl">{t("Your items")}</h2>
        <ul className="mt-2 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>{i.qty} × {i.name} <span className="partno text-xs text-muted">{i.part_number}</span></span>
              <span className="shrink-0 font-bold">{(i.confirmed_unit_price ?? i.unit_price) !== null ? tsh((i.confirmed_unit_price ?? i.unit_price)! * i.qty) : t("Price to be confirmed")}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1">
          <div className="flex justify-between"><dt>{t("Known-price subtotal")}</dt><dd className="font-bold">{tsh(order.known_subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{t("Delivery fee")}</dt><dd>{order.delivery_fee !== null ? tsh(order.delivery_fee) : t("To be confirmed")}</dd></div>
          <div className="flex justify-between text-base"><dt className="font-bold">{t("Final total")}</dt><dd className="font-extrabold">{order.final_total !== null ? tsh(order.final_total) : t("To be confirmed by Woodland")}</dd></div>
        </dl>
      </section>

      <div className="card card-grey mt-6 p-4 text-sm">
        <p className="font-bold">{t("What happens next")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>{t("Woodland confirms stock, fitment, final prices and delivery with you.")}</li>
          <li>{t("Final pricing and availability will be confirmed by Woodland.")}</li>
          {!delivery && <li>{t("Pickup location")}: {SITE.address}.</li>}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-outline">{t("Continue shopping")}</Link>
        <Link href="/track" className="btn btn-outline">{t("Track another order")}</Link>
      </div>
    </div>
  );
}
