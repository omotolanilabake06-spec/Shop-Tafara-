"use client";

// Cart lives in localStorage so it survives refreshes. Prices here are for display only:
// checkout (Phase 3) re-prices every line from the database before taking payment.
import { useSyncExternalStore } from "react";

export type CartLine = {
  /** slug + chosen options, so the same dress in two colours is two lines. */
  key: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  options: { label: string; value: string }[];
  kind: "clothing" | "home";
  /** Home products only: cap quantity at available stock. */
  maxQty?: number;
};

const STORAGE_KEY = "tafara.cart.v1";
const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) lines = JSON.parse(raw);
  } catch {
    lines = EMPTY;
  }
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage full: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const current = useSyncExternalStore(
    subscribe,
    () => (load(), lines),
    () => EMPTY,
  );
  const count = current.reduce((n, l) => n + l.qty, 0);
  const subtotal = current.reduce((n, l) => n + l.qty * l.price, 0);
  return { lines: current, count, subtotal };
}

const clamp = (line: CartLine, qty: number) => Math.max(1, Math.min(qty, line.maxQty ?? 20));

export function addToCart(line: Omit<CartLine, "qty">, qty = 1) {
  load();
  const existing = lines.find((l) => l.key === line.key);
  if (existing) {
    commit(lines.map((l) => (l.key === line.key ? { ...l, qty: clamp(l, l.qty + qty) } : l)));
  } else {
    commit([...lines, { ...line, qty: clamp({ ...line, qty }, qty) }]);
  }
  openCart();
}

export function setQty(key: string, qty: number) {
  commit(lines.map((l) => (l.key === key ? { ...l, qty: clamp(l, qty) } : l)));
}

export function removeLine(key: string) {
  commit(lines.filter((l) => l.key !== key));
}

// Drawer open state, shared between the header bag icon and add-to-cart.
let drawerOpen = false;
const drawerListeners = new Set<() => void>();
export function openCart() {
  drawerOpen = true;
  drawerListeners.forEach((l) => l());
}
export function closeCart() {
  drawerOpen = false;
  drawerListeners.forEach((l) => l());
}
export function useCartDrawer() {
  return useSyncExternalStore(
    (l) => (drawerListeners.add(l), () => drawerListeners.delete(l)),
    () => drawerOpen,
    () => false,
  );
}

/** Empties the bag once an order has been placed. */
export function clearCart() {
  load();
  commit(EMPTY);
}
