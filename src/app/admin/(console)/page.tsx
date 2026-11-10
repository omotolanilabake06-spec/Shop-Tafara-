import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Due } from "@/components/admin/due";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, PageHeader, Stat, button } from "@/components/admin/ui";
import { listPayments } from "@/lib/db/payments";
import { listAllProducts } from "@/lib/db/products";
import { formatNaira } from "@/lib/format";
import { countdown, isLate } from "@/lib/orders/progress";
import { listOrders } from "@/lib/orders/store";
import { inPeriod, summarise } from "@/lib/payments/summary";
import { formatDay, formatStamp, lagosDate } from "@/lib/working-days";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <Overview />
    </Suspense>
  );
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

async function Overview() {
  const [orders, payments, products] = await Promise.all([listOrders(), listPayments(), listAllProducts()]);
  const month = lagosDate().slice(0, 7);
  const thisMonth = payments.filter((p) => (p.paidAt ?? p.createdAt).slice(0, 7) === month);
  const money = summarise(thisMonth);
  const week = summarise(payments.filter((p) => inPeriod(p, 7)));

  const open = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const late = open.filter((o) => isLate(o));
  const toCheck = open.filter((o) => o.status === "pending_payment");
  const toStart = open.filter((o) => o.status === "confirmed");
  const ready = open.filter((o) => o.status === "ready");
  const making = open.filter((o) => o.status === "confirmed" || o.status === "in_production");
  const dueSoon = making
    .filter((o) => {
      const c = countdown(o);
      return c.state === "finishing" || (c.state === "making" && c.daysLeft <= 2);
    })
    .sort((a, b) => a.readyWindow.from.localeCompare(b.readyWindow.from));
  const lowStock = products.flatMap((p) => (p.kind === "home" ? p.variants.filter((v) => v.stock <= 3).map((v) => ({ product: p, variant: v })) : []));
  const failedToday = payments.filter((p) => p.status === "failed" && inPeriod(p, 1));

  const attention = [
    toCheck.length && {
      tone: "red",
      text: `${toCheck.length} new ${toCheck.length === 1 ? "order is" : "orders are"} waiting for you to confirm the bank transfer`,
      href: "/admin/orders?view=pending_payment",
    },
    late.length && { tone: "red", text: `${late.length} ${late.length === 1 ? "order is" : "orders are"} past the promised date`, href: "/admin/orders?view=late" },
    toStart.length && { tone: "amber", text: `${toStart.length} new ${toStart.length === 1 ? "order" : "orders"} to start`, href: "/admin/orders?view=confirmed" },
    ready.length && { tone: "green", text: `${ready.length} finished ${ready.length === 1 ? "piece is" : "pieces are"} waiting to be sent`, href: "/admin/orders?view=ready" },
    lowStock.length && {
      tone: "amber",
      text: `${lowStock.length} TAFARA HOME ${lowStock.length === 1 ? "option is" : "options are"} low or sold out`,
      href: "/admin/products?view=low",
    },
    failedToday.length && { tone: "neutral", text: `${failedToday.length} failed ${failedToday.length === 1 ? "payment" : "payments"} in the last day`, href: "/admin/payments?status=failed&period=7d" },
  ].filter(Boolean) as { tone: string; text: string; href: string }[];

  const dot: Record<string, string> = { red: "bg-sold", amber: "bg-warn", green: "bg-ok", neutral: "bg-[#a39a90]" };

  return (
    <>
      <PageHeader
        title={greeting()}
        description={formatDay(lagosDate())}
        actions={
          <>
            <Link href="/admin/orders" className={button.secondary}>
              View orders
            </Link>
            <Link href="/admin/products/new" className={button.primary}>
              + Add product
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales this month" value={formatNaira(money.gross - money.refunded)} note={`${money.count} paid ${money.count === 1 ? "order" : "orders"}`} href="/admin/payments" />
        <Stat label="Last 7 days" value={formatNaira(week.gross - week.refunded)} note={`Average order ${formatNaira(week.average)}`} href="/admin/payments?period=7d" />
        <Stat label="Being made" value={making.length} note={`${dueSoon.length} due in the next 2 days`} href="/admin/orders?view=in_production" />
        <Stat label="Running late" value={late.length} note="Past the promised date" href="/admin/orders?view=late" tone={late.length ? "red" : undefined} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Card title="Needs your attention">
          {attention.length === 0 ? (
            <p className="text-soft">All clear. Nothing needs you right now.</p>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {attention.map((a) => (
                <li key={a.text}>
                  <Link href={a.href} className="group flex items-center gap-3 py-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[a.tone]}`} aria-hidden />
                    <span className="flex-1 group-hover:underline">{a.text}</span>
                    <span className="text-soft" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Due soonest" description="Pieces in the atelier, by ready date." flush>
          {making.length === 0 ? (
            <p className="px-6 py-5 text-soft">Nothing in the atelier.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...making]
                .sort((a, b) => a.readyWindow.from.localeCompare(b.readyWindow.from))
                .slice(0, 6)
                .map((o) => (
                  <li key={o.number}>
                    <Link href={`/admin/orders/${o.number}`} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-6 py-3.5 hover:bg-[#faf8f5]">
                      <span className="min-w-0">
                        <span className="font-medium tabular-nums">{o.number}</span> <span className="text-soft">· {o.customer.name}</span>
                        <span className="block truncate text-[14px] text-soft">
                          {o.items.map((i) => `${i.name} (${i.options.map((x) => x.value).join(", ")})`).join(" · ")}
                        </span>
                      </span>
                      <span className="text-[15px] sm:text-right">
                        <Due order={o} />
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Latest orders"
        className="mt-6"
        flush
        actions={
          <Link href="/admin/orders?view=all" className={button.quiet}>
            See all
          </Link>
        }
      >
        <ul className="divide-y divide-line">
          {orders.slice(0, 5).map((o) => (
            <li key={o.number}>
              <Link href={`/admin/orders/${o.number}`} className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-6 py-3.5 hover:bg-[#faf8f5] md:grid-cols-[140px_1fr_auto_120px]">
                <span>
                  <span className="font-medium tabular-nums">{o.number}</span>
                  <span className="block text-[13px] text-soft">{formatStamp(o.placedAt)}</span>
                </span>
                <span className="text-right md:text-left">{o.customer.name}</span>
                <StatusBadge status={o.status} late={isLate(o)} />
                <span className="text-right tabular-nums">{formatNaira(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
