"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE } from "@/lib/i18n-server";

export async function setLang(lang: "en" | "sw") {
  (await cookies()).set(LANG_COOKIE, lang === "sw" ? "sw" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
