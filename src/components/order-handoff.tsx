"use client";

import { useState } from "react";
import { markWhatsAppOpened } from "@/app/(site)/actions";

export function OrderHandoff({
  reference, token, waUrl, message, autoNote,
}: { reference: string; token: string; waUrl: string; message: string; autoNote: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setShowText(true);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      {autoNote && (
        <p role="status" className="rounded-md bg-amber-50 p-3 text-sm font-bold">
          Your browser blocked WhatsApp from opening automatically. Tap the green button below.
        </p>
      )}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener"
        className="btn btn-wa w-full"
        onClick={() => { void markWhatsAppOpened(reference, token); }}
      >
        Open WhatsApp and send my order
      </a>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-outline btn-sm" onClick={copy}>{copied ? "Copied" : "Copy order message"}</button>
        <button className="btn btn-outline btn-sm" onClick={() => setShowText((s) => !s)}>{showText ? "Hide message" : "Show message"}</button>
      </div>
      <p className="text-xs text-muted">WhatsApp did not open? Copy the message and paste it into a chat with +255 771 889 889.</p>
      {showText && (
        <textarea readOnly rows={14} className="field partno text-xs" value={message} aria-label="Order message" onFocus={(e) => e.currentTarget.select()} />
      )}
    </div>
  );
}
