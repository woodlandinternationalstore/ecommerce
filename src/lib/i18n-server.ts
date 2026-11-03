import { cookies } from "next/headers";
import { translate, type Lang } from "./i18n-core";

export const LANG_COOKIE = "wis_lang";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "sw" ? "sw" : "en";
}

/** Server components: const t = await getT(); t("Order now") */
export async function getT() {
  const lang = await getLang();
  return Object.assign((text: string, vars?: Record<string, string | number>) => translate(lang, text, vars), { lang });
}
