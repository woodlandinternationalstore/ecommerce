export const SITE = {
  name: "WOODLAND INTERNATIONAL STORE",
  short: "Woodland",
  slogan: "GENUINE AUTO SPARE PARTS",
  tagline: "QUALITY PARTS • TRUSTED SERVICE • BEST PRICES",
  address: "Ungoni & Kipande Street, Kariakoo, Dar es Salaam, Tanzania",
  whatsapp: "255771889889",
  whatsappDisplay: "+255 771 889 889",
  altPhone: "255790991992",
  altPhoneDisplay: "+255 790 991 992",
  instagramHandle: "@woodland_internationalstore",
  instagramUrl: "https://www.instagram.com/woodland_internationalstore/",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const VEHICLE_BRANDS = ["Toyota", "Nissan", "Ford", "Mitsubishi", "Foton", "GWM", "Isuzu"];

export function waLink(text?: string, number: string = SITE.whatsapp) {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function tsh(n: number) {
  return `TSh ${n.toLocaleString("en-US")}`;
}
