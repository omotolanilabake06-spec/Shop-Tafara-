"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { closeCart, useCart, useCartDrawer } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { CartLines } from "./cart-lines";

export function CartDrawer() {
  const open = useCartDrawer();
  const { lines, count, subtotal } = useCart();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus();
    };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close bag"
        tabIndex={-1}
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-paper outline-none transition-transform duration-500 ease-[var(--ease-soft)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-line px-6">
          <p className="caps">
            Your bag <span className="tabular-nums text-muted">({count})</span>
          </p>
          <button type="button" onClick={closeCart} className="caps link-hover" tabIndex={open ? 0 : -1}>
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="display text-[30px]">Your bag is empty</p>
            <Link href="/shop" onClick={closeCart} className="caps link-line mt-6" tabIndex={open ? 0 : -1}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <CartLines lines={lines} compact tabbable={open} />
            </div>
            <div className="border-t border-line px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-baseline justify-between">
                <span className="caps">Subtotal</span>
                <span className="text-[15px] tabular-nums">{formatNaira(subtotal)}</span>
              </div>
              <p className="mt-2 text-[13px] text-muted">Delivery is calculated at checkout.</p>
              <Link href="/checkout" onClick={closeCart} className="btn btn-solid mt-5 w-full" tabIndex={open ? 0 : -1}>
                Checkout
              </Link>
              <Link href="/cart" onClick={closeCart} className="caps link-hover mx-auto mt-4 block w-fit" tabIndex={open ? 0 : -1}>
                View bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
