import Link from "next/link";
import { redirect } from "next/navigation";
import { can, currentStaff, ROLE_LABEL, type Perm } from "@/lib/auth";
import { logout } from "../auth-actions";

export const metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };

const LINKS: { href: string; label: string; perm: Perm | null }[] = [
  { href: "/admin", label: "Dashboard", perm: null },
  { href: "/admin/orders", label: "Orders", perm: "orders" },
  { href: "/admin/enquiries", label: "Enquiries", perm: "enquiries" },
  { href: "/admin/products", label: "Products", perm: "products" },
  { href: "/admin/categories", label: "Categories", perm: "categories" },
  { href: "/admin/vehicles", label: "Vehicles", perm: "vehicles" },
  { href: "/admin/import", label: "Import / Export", perm: "import" },
  { href: "/admin/users", label: "Staff users", perm: "users" },
  { href: "/admin/settings", label: "Settings", perm: "settings" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-surface md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-ink text-white no-print md:min-h-screen">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/admin" className="display text-xl text-white">Woodland <span className="text-brand">Admin</span></Link>
          <p className="hidden text-xs text-silver md:mt-1 md:block">{staff.name} · {ROLE_LABEL[staff.role]}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:block md:space-y-1 md:px-3" aria-label="Admin">
          {LINKS.filter((l) => !l.perm || can(staff.role, l.perm)).map((l) => (
            <Link key={l.href} href={l.href} className="block whitespace-nowrap rounded px-3 py-2 text-sm font-bold hover:bg-white/10">{l.label}</Link>
          ))}
          <Link href="/" className="block whitespace-nowrap rounded px-3 py-2 text-sm text-silver hover:bg-white/10">View website</Link>
          <form action={logout}><button className="block w-full whitespace-nowrap rounded px-3 py-2 text-left text-sm text-silver hover:bg-white/10">Sign out</button></form>
        </nav>
      </aside>
      <div className="min-w-0 p-4 md:p-8">{children}</div>
    </div>
  );
}
