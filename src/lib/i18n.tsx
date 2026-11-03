"use client";

import { createContext, useContext, type ReactNode } from "react";
import { translate, type Lang } from "./i18n-core";

export type { Lang };

const Ctx = createContext<Lang>("en");

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

/** Client components: const t = useT(); t("Order now") */
export function useT() {
  const lang = useContext(Ctx);
  return (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars);
}
