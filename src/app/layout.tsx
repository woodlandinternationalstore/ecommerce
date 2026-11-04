import type { Metadata, Viewport } from "next";
import { Barlow, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { I18nProvider } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

const barlow = Barlow({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-barlow", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Woodland International Store | Auto Spare Parts in Kariakoo, Dar es Salaam", template: "%s | Woodland International Store" },
  description:
    "Browse automotive spare parts for Toyota, Nissan, Ford, Mitsubishi, Foton and more. Search by part number or vehicle and order through WhatsApp. Kariakoo, Dar es Salaam.",
  openGraph: { siteName: SITE.name, type: "website", locale: "en_TZ" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#c8102e" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${barlow.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <I18nProvider lang={lang}>
          <CartProvider>
            {children}
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
