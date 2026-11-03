"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLang } from "@/lib/i18n";
import { setLang } from "@/app/lang-action";

/** EN | SW switch. Stores the choice in a cookie and refreshes the page in the new language. */
export function LangToggle({ className = "" }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();

  function pick(next: "en" | "sw") {
    if (next === lang) return;
    start(async () => {
      await setLang(next);
      router.refresh();
    });
  }

  const btn = (code: "en" | "sw", label: string) => (
    <button
      type="button"
      onClick={() => pick(code)}
      aria-pressed={lang === code}
      aria-label={code === "en" ? "English" : "Kiswahili"}
      className={`px-2.5 py-1 text-xs font-extrabold transition ${lang === code ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}
    >
      {label}
    </button>
  );

  return (
    <span className={`inline-flex overflow-hidden rounded-md border border-white/40 ${pending ? "opacity-60" : ""} ${className}`} role="group" aria-label="Language">
      {btn("en", "EN")}
      {btn("sw", "SW")}
    </span>
  );
}
