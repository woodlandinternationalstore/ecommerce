"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" aria-label={`Shopping cart, ${count} items`} className={`relative flex h-11 min-w-11 items-center justify-center rounded-lg px-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.5 8H6" /></svg>
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{count}</span>
      )}
    </Link>
  );
}

export function CartBadge() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span>;
}
