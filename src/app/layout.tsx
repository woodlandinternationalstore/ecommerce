import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { SITE } from "@/lib/site";

const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-sora", display: "swap" });
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
