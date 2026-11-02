import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { SITE } from "@/lib/site";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
