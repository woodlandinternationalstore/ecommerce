"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { SITE, waLink } from "@/lib/site";

type ChatLink = { label: string; href: string; external?: boolean };
type Msg = { from: "bot" | "me"; text: string; links?: ChatLink[] };
type Hit = { name: string; slug: string; oem: string };

const has = (s: string, re: RegExp) => re.test(s);

/**
 * Floating helper. It is a scripted assistant (no AI service): it answers common questions, searches the catalogue,
 * and hands over to the sales team on WhatsApp. It never invents prices, stock or fitment.
 */
export function ChatWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const wa = (text: string): ChatLink => ({ label: t("Chat with sales on WhatsApp"), href: waLink(text, SITE.whatsapp), external: true });

  useEffect(() => {
    if (open && !started.current) {
      started.current = true;
      setMsgs([{ from: "bot", text: t("Hello! I'm the Woodland assistant (automated). I can help you find a part, track an order, or connect you with our sales team.") }]);
    }
  }, [open, t]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const bot = (text: string, links?: ChatLink[]) => setMsgs((m) => [...m, { from: "bot", text, links }]);

  async function answer(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    const l = q.toLowerCase();
    const ref = /WIS-\d{8}-\d{4}/i.exec(q)?.[0];

    if (ref || has(l, /track|status|where is my order|my order|fuatilia|hali ya oda|oda yangu|oda yangu iko wapi/)) {
      return bot(t("You can follow your order with its reference and the phone number you used. Staff update the status as they confirm and prepare it."), [{ label: t("Track my order"), href: "/track" }]);
    }
    if (has(l, /deliver|shipping|ship|usafirish|kupelek|peleka|mkoa/)) {
      return bot(t("You can collect at our shop in Kariakoo or ask for delivery. Delivery times and charges are confirmed by our sales team for each order."), [wa("Hello, I would like to ask about delivery.")]);
    }
    if (has(l, /pay|payment|mpesa|m-pesa|card|lipa|malipo|cash|pesa/)) {
      return bot(t("There is no online payment on this website. Send your order, and our sales team confirms the final price and how to pay with you on WhatsApp."), [wa("Hello, I would like to ask about payment.")]);
    }
    if (has(l, /price|cost|bei|how much|kiasi/)) {
      return bot(t("Prices are shown only when they are confirmed. For parts marked Price on request, tap Ask on the part and our team will quote you."), [{ label: t("Browse parts"), href: "/shop" }]);
    }
    if (has(l, /fit|compat|vehicle|chassis|inafaa|gari|model|year/)) {
      return bot(t("Fitment can vary by model, year, chassis and engine. Use the vehicle finder, then confirm the part number with our sales team before you order."), [{ label: t("Vehicle finder"), href: "/finder" }, wa("Hello, please help me confirm fitment for my vehicle.")]);
    }
    if (has(l, /where|address|location|shop|open|hours|time|wapi|anuani|saa ngapi|fungua|kariakoo/)) {
      return bot(`${t("Our shop is at")} ${SITE.address}. ${t("Ask us on WhatsApp for opening hours.")}`, [wa("Hello, what are your opening hours?")]);
    }
    if (has(l, /how.*order|order|buy|agiza|nunua|jinsi/)) {
      return bot(t("1) Search for the part. 2) Tap Order now. 3) Fill in your details. 4) Send the order on WhatsApp and our team confirms it with you."), [{ label: t("Browse parts"), href: "/shop" }]);
    }
    if (has(l, /human|agent|staff|sales|person|whatsapp|mtu|ongea|msaada|help me/)) {
      return bot(t("Our sales team will be glad to help you directly."), [wa("Hello, I need help from the sales team.")]);
    }
    if (has(l, /^(hi|hello|hey|habari|mambo|salaam|hujambo)\b/)) {
      return bot(t("Hello! Type a part name or part number, or choose an option below."));
    }

    // otherwise treat it as a part search
    setBusy(true);
    try {
      const r = await fetch(`/api/suggest?q=${encodeURIComponent(q.slice(0, 80))}`);
      const hits: Hit[] = r.ok ? (await r.json()).hits : [];
      if (hits.length) {
        bot(t("I found these parts. Open one to see the price and order it:"), [
          ...hits.slice(0, 5).map((h) => ({ label: `${h.name}${h.oem ? ` · ${h.oem}` : ""}`, href: `/product/${h.slug}` })),
          { label: t("See all results"), href: `/shop?q=${encodeURIComponent(q)}` },
        ]);
      } else {
        bot(t("I could not find that part. Please check the part number, or send the details to our sales team."), [wa(`Hello, I am looking for: ${q}`)]);
      }
    } catch {
      bot(t("Sorry, I could not search right now. You can reach our sales team on WhatsApp."), [wa(`Hello, I am looking for: ${q}`)]);
    } finally {
      setBusy(false);
    }
  }

  const quick = [t("Find a part"), t("Track my order"), t("Delivery"), t("Payment"), t("Fitment help")];

  return (
    <div className="no-print">
      {open && (
        <section
          role="dialog"
          aria-label={t("Woodland assistant")}
          className="fixed bottom-[92px] right-3 z-50 flex max-h-[72vh] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] md:bottom-24 md:right-6"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-extrabold">W</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="display text-lg">{t("Woodland assistant")}</p>
              <p className="text-[11px] text-white/70">{t("Automated helper · sales team on WhatsApp")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("Close chat")} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          <div className="flex-1 space-y-2.5 overflow-y-auto bg-surface p-3" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${m.from === "me" ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-white text-ink shadow-sm ring-1 ring-line"}`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.links && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {m.links.map((k) =>
                        k.external ? (
                          <a key={k.href} href={k.href} target="_blank" rel="noopener" className="rounded-lg bg-wa px-3 py-2 text-center text-xs font-extrabold text-[#06230f]">{k.label}</a>
                        ) : (
                          <Link key={k.href} href={k.href} onClick={() => setOpen(false)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold hover:border-brand hover:text-brand">{k.label}</Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-muted">{t("Searching…")}</p>}
            <div ref={end} />
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-line bg-white px-3 pt-2">
            {quick.map((qk) => (
              <button
                key={qk}
                type="button"
                onClick={() => (qk === t("Find a part") ? (setMsgs((m) => [...m, { from: "me", text: qk }]), bot(t("Type the part name or part number, for example brake pad or 48068-0K090."))) : answer(qk))}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-bold hover:border-brand hover:text-brand"
              >
                {qk}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = input;
              setInput("");
              void answer(v);
            }}
            className="flex gap-2 bg-white p-3"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} className="field !min-h-11" placeholder={t("Type a part or a question")} aria-label={t("Type a part or a question")} maxLength={120} />
            <button className="btn btn-red btn-sm !min-h-11" aria-label={t("Send")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t("Close chat") : t("Open chat")}
        className={`${open ? "" : "nudge "}fixed bottom-[76px] right-3 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_14px_30px_-8px_rgba(200,16,46,0.7)] transition hover:scale-105 md:bottom-6 md:right-6 md:h-16 md:w-16`}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.2A8 8 0 1121 12z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="3" /></svg>
        )}
      </button>
    </div>
  );
}
