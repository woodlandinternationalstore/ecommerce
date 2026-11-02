"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { id: number; qty: number };
const KEY = "wis_cart_v1";

type Ctx = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l) => Number.isInteger(l?.id) && Number.isInteger(l?.qty) && l.qty > 0)
      .map((l) => ({ id: l.id, qty: Math.min(l.qty, 999) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: cart still works for this page view */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add: (id, qty = 1) => {
        const cur = read();
        const hit = cur.find((l) => l.id === id);
        commit(hit ? cur.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, 999) } : l)) : [...cur, { id, qty }]);
      },
      setQty: (id, qty) => commit(qty <= 0 ? read().filter((l) => l.id !== id) : read().map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 999) } : l))),
      remove: (id) => commit(read().filter((l) => l.id !== id)),
      clear: () => commit([]),
    }),
    [lines, ready, commit],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
