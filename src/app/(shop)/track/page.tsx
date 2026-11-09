import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/order/track-form";
import { trackingPath } from "@/lib/orders/messages";
import { buildSampleOrders } from "@/lib/orders/sample-orders";
import { STATUS_LABEL } from "@/lib/orders/progress";
import { USING_SAMPLE_ORDERS } from "@/lib/orders/store";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Follow your Shop Tafara order from the atelier to your door.",
};

export default function TrackPage() {
  return (
    <div className="gutter pb-28">
      <header className="mx-auto max-w-[560px] pb-12 pt-10 text-center sm:pb-14 sm:pt-16">
        <p className="caps-sm text-muted">Your order</p>
        <h1 className="display mt-3 text-[40px] sm:text-[56px]">Track your order</h1>
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          Every piece is made for you after you order. Follow it here, from our atelier to your door.
        </p>
      </header>

      <TrackForm />

      <p className="mx-auto mt-10 max-w-[420px] text-center text-[14px] leading-relaxed text-muted">
        Can&rsquo;t find your order number?{" "}
        <Link href="/contact" className="text-ink underline underline-offset-4">
          Contact us
        </Link>{" "}
        and we will look it up for you.
      </p>

      {USING_SAMPLE_ORDERS && <SampleOrders />}
    </div>
  );
}

/** Preview helper while orders are sample data. Disappears once the database is connected. */
function SampleOrders() {
  const samples = buildSampleOrders(new Date("2026-01-01"));
  return (
    <aside className="mx-auto mt-20 max-w-[560px] border border-dashed border-line p-6">
      <p className="caps-sm text-muted">Preview · sample orders</p>
      <ul className="mt-4 divide-y divide-line">
        {samples.map((o) => (
          <li key={o.number}>
            <Link
              href={trackingPath(o)}
              className="flex items-baseline justify-between gap-4 py-3 text-[14px] transition-colors hover:text-muted"
            >
              <span className="tabular-nums">{o.number}</span>
              <span className="truncate text-muted">{o.customer.email}</span>
              <span className="caps-sm shrink-0">{STATUS_LABEL[o.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
