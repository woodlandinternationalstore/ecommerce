import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="container-x max-w-3xl space-y-4 py-10 text-sm leading-relaxed">
      <h1 className="text-4xl">Privacy policy</h1>
      <p>This policy explains how {SITE.name} handles personal information collected through this website. The business owner should review it, and a legal adviser where appropriate, before launch.</p>
      <h2 className="text-2xl">What we collect</h2>
      <p>When you place an order or send an enquiry we collect the details you enter: your name, phone number, optional alternative phone and email, delivery location, vehicle details, and notes. We do not collect payment details on this website.</p>
      <h2 className="text-2xl">How we use it</h2>
      <p>We use your details only to confirm stock, fitment, prices and delivery, to contact you about your order or enquiry, and to keep order records. Your cart is stored in your own browser.</p>
      <h2 className="text-2xl">Who can see it</h2>
      <p>Only authorised Woodland staff can view orders and enquiries. Order confirmation pages need a private link that is only shown to you. When you send your order on WhatsApp, the message is handled by WhatsApp under its own terms.</p>
      <h2 className="text-2xl">Contact</h2>
      <p>To ask about or request removal of your information, contact us on {SITE.whatsappDisplay}.</p>
    </div>
  );
}
