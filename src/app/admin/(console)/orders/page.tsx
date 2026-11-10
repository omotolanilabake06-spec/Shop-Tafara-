import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Due } from "@/components/admin/due";
import { StatusBadge } from "@/components/admin/status-badge";
import { Empty, PageHeader, Stat, button, input, th } from "@/components/admin/ui";
import { formatNaira } from "@/lib/format";
import { isLate } from "@/lib/orders/progress";
import { listOrders } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Orders" };

const VIEWS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "open", label: "Open", match: (o) => !["delivered", "cancelled"].includes(o.status) },
  { key: "pending_payment", label: "Check payment", match: (o) => o.status === "pending_payment" },
  { key: "confirmed", label: "To start", match: (o) => o.status === "confirmed" },
  { key: "in_production", label: "In the atelier", match: (o) => o.status === "in_production" },
  { key: "ready", label: "Ready", match: (o) => o.status === "ready" },
  { key: "dispatched", label: "Dispatched", match: (o) => o.status === "dispatched" },
  { key: "late", label: "Late", match: (o) => isLate(o) },
  { key: "delivered", label: "Delivered", match: (o) => o.status === "delivered" },
  { key: "cancelled", label: "Cancelled", match: (o) => o.status === "cancelled" },
  { key: "all", label: "All", match: () => true },
];

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" description="Every order, from the payment check to the customer's door. Open an order to move it to its next step." />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const matchesSearch = (o: Order, q: string) =>
  [o.number, o.customer.name, o.customer.email, o.customer.phone, ...o.items.map((i) => i.name)].some((v) => v.toLowerCase().includes(q));

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const [{ view: requested, q: rawQ }, orders] = await Promise.all([searchParams, listOrders()]);
  const view = VIEWS.find((v) => v.key === requested) ?? VIEWS[0];
  const q = typeof rawQ === "string" ? rawQ.trim().toLowerCase() : "";
  const shown = orders.filter(q ? (o) => matchesSearch(o, q) : view.match);
  const late = orders.filter((o) => isLate(o)).length;
  const count = (key: string) => orders.filter(VIEWS.find((v) => v.key === key)!.match).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Check payment"
          value={count("pending_payment")}
          note="Transfers to confirm"
          href="?view=pending_payment"
          tone={count("pending_payment") ? "red" : undefined}
        />
        <Stat label="To start" value={count("confirmed")} note="Paid, not yet cut" href="?view=confirmed" />
        <Stat label="Ready to send" value={count("ready")} note="Finished pieces" href="?view=ready" />
        <Stat label="Running late" value={late} note="Past the promised date" href="?view=late" tone={late ? "red" : undefined} />
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter orders" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-1 whitespace-nowrap px-1">
            {VIEWS.map((v) => (
              <li key={v.key}>
                <Link
                  href={v.key === "open" ? "/admin/orders" : `?view=${v.key}`}
                  aria-current={!q && v.key === view.key ? "page" : undefined}
                  className="block rounded-full border border-transparent px-3.5 py-1.5 text-[14px] text-soft transition-colors hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-paper aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {v.label} <span className="tabular-nums text-[#8a8178]">{count(v.key)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="flex gap-2 lg:w-[340px]" role="search">
          <input name="q" defaultValue={q} placeholder="Search name, email, order or piece" aria-label="Search orders" className={input} />
          <button type="submit" className={button.secondary}>
            Search
          </button>
        </form>
      </div>

      {q && (
        <p className="mt-4 text-[15px] text-soft">
          {shown.length} {shown.length === 1 ? "order" : "orders"} matching &ldquo;{q}&rdquo; ·{" "}
          <Link href="/admin/orders" className={button.quiet}>
            Clear search
          </Link>
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-[4px] border border-line bg-paper">
        {shown.length === 0 ? (
          <Empty title="No orders here">Orders appear here as soon as a customer pays.</Empty>
        ) : (
          <table className="w-full">
            <thead className="hidden border-b border-line bg-[#faf8f5] md:table-header-group">
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>What to make</th>
                <th className={th}>Status</th>
                <th className={th}>Due</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((o) => (
                <tr
                  key={o.number}
                  className="relative grid grid-cols-2 gap-x-4 gap-y-2.5 px-5 py-4 transition-colors hover:bg-[#faf8f5] md:table-row md:p-0"
                >
                  <td className="md:px-5 md:py-4 md:align-top">
                    <Link href={`/admin/orders/${o.number}`} className="font-medium tabular-nums text-ink after:absolute after:inset-0">
                      {o.number}
                    </Link>
                    <span className="block text-[13px] text-soft">{formatStamp(o.placedAt)}</span>
                  </td>
                  <td className="text-right md:px-5 md:py-4 md:text-left md:align-top">
                    {o.customer.name}
                    <span className="block text-[13px] text-soft">{o.delivery.label}</span>
                  </td>
                  <td className="col-span-2 md:px-5 md:py-4 md:align-top">
                    {o.items.map((i, n) => (
                      <span key={n} className="block">
                        {i.qty > 1 && <span className="font-medium tabular-nums">{i.qty} × </span>}
                        {i.name} <span className="text-soft">· {i.options.map((x) => x.value).join(" · ")}</span>
                      </span>
                    ))}
                    {o.note && <span className="mt-1 inline-block text-[13px] font-medium text-warn">Customer left a note</span>}
                  </td>
                  <td className="md:px-5 md:py-4 md:align-top">
                    <StatusBadge status={o.status} late={isLate(o)} />
                  </td>
                  <td className="text-right md:px-5 md:py-4 md:text-left md:align-top">
                    <Due order={o} />
                  </td>
                  <td className="col-span-2 text-right tabular-nums md:px-5 md:py-4 md:align-top">{formatNaira(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
