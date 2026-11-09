"use client";

import Image from "next/image";
import Link from "next/link";
import { closeCart, removeLine, setQty, type CartLine } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

export function CartLines({ lines, compact = false, tabbable = true }: { lines: CartLine[]; compact?: boolean; tabbable?: boolean }) {
  const tab = tabbable ? 0 : -1;
  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => (
        <li key={line.key} className={`grid gap-5 py-6 ${compact ? "grid-cols-[88px_1fr]" : "grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr]"}`}>
          <Link href={`/products/${line.slug}`} onClick={closeCart} className="relative block aspect-[2/3] bg-stone" tabIndex={tab}>
            <Image src={line.image} alt={line.name} fill sizes="140px" className="object-cover" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/products/${line.slug}`} onClick={closeCart} className="caps hover:text-muted" tabIndex={tab}>
                {line.name}
              </Link>
              <span className="shrink-0 text-[14px] tabular-nums">{formatNaira(line.price * line.qty)}</span>
            </div>
            <dl className="mt-2 space-y-0.5 text-[13px] text-muted">
              {line.options.map((o) => (
                <div key={o.label} className="flex gap-1.5">
                  <dt>{o.label}:</dt>
                  <dd>{o.value}</dd>
                </div>
              ))}
              {line.kind === "clothing" && <p className="pt-1">Made to order</p>}
            </dl>
            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex items-center border border-line" role="group" aria-label={`Quantity for ${line.name}`}>
                <button
                  type="button"
                  className="h-9 w-9 text-[15px] disabled:text-line"
                  onClick={() => setQty(line.key, line.qty - 1)}
                  disabled={line.qty <= 1}
                  aria-label="Decrease quantity"
                  tabIndex={tab}
                >
                  −
                </button>
                <span className="w-8 text-center text-[13px] tabular-nums" aria-live="polite">
                  {line.qty}
                </span>
                <button
                  type="button"
                  className="h-9 w-9 text-[15px] disabled:text-line"
                  onClick={() => setQty(line.key, line.qty + 1)}
                  disabled={line.maxQty !== undefined && line.qty >= line.maxQty}
                  aria-label="Increase quantity"
                  tabIndex={tab}
                >
                  +
                </button>
              </div>
              <button type="button" className="caps-sm link-hover text-muted" onClick={() => removeLine(line.key)} tabIndex={tab}>
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
