import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { OrderItem } from "@/lib/orders/types";

export function OrderItems({ items, linkProducts = true }: { items: OrderItem[]; linkProducts?: boolean }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const name = <span className="caps">{item.name}</span>;
        return (
          <li key={`${item.slug}-${i}`} className="flex gap-5 py-5">
            <div className="relative aspect-[2/3] w-[76px] shrink-0 bg-stone">
              <Image src={item.image} alt="" fill sizes="76px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row">
              <div>
                {linkProducts ? (
                  <Link href={`/products/${item.slug}`} className="link-hover">
                    {name}
                  </Link>
                ) : (
                  name
                )}
                <dl className="mt-2 space-y-0.5 text-[13px] text-muted">
                  {item.options.map((o) => (
                    <div key={o.label} className="flex gap-1.5">
                      <dt>{o.label}:</dt>
                      <dd className="text-ink">{o.value}</dd>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <dt>Quantity:</dt>
                    <dd className="text-ink tabular-nums">{item.qty}</dd>
                  </div>
                </dl>
              </div>
              <p className="text-[14px] tabular-nums sm:text-right">{formatNaira(item.unitPrice * item.qty)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
