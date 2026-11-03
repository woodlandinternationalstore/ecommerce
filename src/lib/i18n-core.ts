import { SW } from "./sw";

export type Lang = "en" | "sw";

/** English text is the key. Swahili comes from the dictionary; anything missing falls back to English. */
export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  let out = lang === "sw" ? (SW[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
