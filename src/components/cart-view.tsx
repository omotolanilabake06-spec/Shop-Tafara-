"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { CartLines } from "./cart-lines";

export function CartView() {
  const { lines, count, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="gutter flex min-h-[55vh] flex-col items-center justify-center py-24 text-center">
        <h1 className="display text-[40px] sm:text-[52px]">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-solid mt-9">
          Continue shopping
        </Link>
      </div>
    );
  }

  const madeToOrder = lines.some((l) => l.kind === "clothing");

  return (
    <div className="gutter mx-auto max-w-[1180px] pb-28 pt-10 sm:pt-14">
      <h1 className="display text-center text-[40px] sm:text-[52px]">Your bag</h1>
      <p className="caps-sm mt-3 text-center text-muted">
        {count} {count === 1 ? "item" : "items"}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
        <div className="border-t border-line">
          <CartLines lines={lines} />
        </div>

        <aside className="h-fit bg-stone p-7 lg:sticky lg:top-[132px]">
          <h2 className="caps">Order summary</h2>
          <dl className="mt-6 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-muted">Calculated at checkout</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="caps">Total</span>
            <span className="text-[17px] tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          {madeToOrder && (
            <p className="mt-5 text-[13px] leading-relaxed text-muted">
              Clothing is made to order and ready to ship in 5–7 working days after payment.
            </p>
          )}
          <Link href="/checkout" className="btn btn-solid mt-6 w-full">
            Checkout
          </Link>
          <p className="mt-4 text-center text-[12px] text-muted">Pay by bank transfer · No account needed</p>
        </aside>
      </div>
    </div>
  );
}
