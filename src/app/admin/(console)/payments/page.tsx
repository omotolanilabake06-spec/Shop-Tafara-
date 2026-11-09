import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PAYMENT_LABEL, PaymentBadge } from "@/components/admin/status-badge";
import { Empty, PageHeader, Stat, button, input, th } from "@/components/admin/ui";
import { listPayments } from "@/lib/db/payments";
import { formatNaira } from "@/lib/format";
import { PERIODS, inPeriod, summarise } from "@/lib/payments/summary";
import type { PaymentStatus } from "@/lib/payments/types";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Payments" };

const STATUSES: (PaymentStatus | "all")[] = ["all", "success", "partially_refunded", "refunded", "failed", "abandoned"];

export default function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Every payment attempt through Paystack: successful, refunded, failed and abandoned."
        actions={
          <a href="/admin/payments-export" className={button.secondary}>
            Download CSV
          </a>
        }
      />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Payments searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Payments({ searchParams }: Pick<PageProps<"/admin/payments">, "searchParams">) {
  const [sp, all] = await Promise.all([searchParams, listPayments()]);
  const period = PERIODS.find((p) => p.key === sp.period) ?? PERIODS[1];
  const status = STATUSES.includes(sp.status as PaymentStatus) ? (sp.status as PaymentStatus | "all") : "all";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const inRange = all.filter((p) => inPeriod(p, period.days));
  const s = summarise(inRange);
  const shown = inRange
    .filter((p) => status === "all" || p.status === status)
    .filter((p) => !q || [p.reference, p.customer.name, p.customer.email, p.orderNumber ?? ""].some((v) => v.toLowerCase().includes(q)));

  const link = (patch: Record<string, string>) => {
    const params = new URLSearchParams({ period: period.key, status, ...(q ? { q } : {}), ...patch });
    if (params.get("status") === "all") params.delete("status");
    if (params.get("period") === "30d") params.delete("period");
    return `?${params}`;
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={link({ period: p.key })}
            aria-current={p.key === period.key ? "page" : undefined}
            className="rounded-full border border-transparent px-3.5 py-1.5 text-[14px] text-soft hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-paper aria-[current=page]:font-medium aria-[current=page]:text-ink"
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Received" value={formatNaira(s.gross)} note={`${s.count} successful ${s.count === 1 ? "payment" : "payments"}`} />
        <Stat label="Refunded" value={formatNaira(s.refunded)} note="Sent back to customers" />
        <Stat label="Paystack fees" value={formatNaira(s.fees)} note="Estimated 1.5% + ₦100" />
        <Stat label="To your bank" value={formatNaira(s.net)} note="After refunds and fees" tone="green" />
      </div>
      {(s.failed > 0 || s.abandoned > 0) && (
        <p className="mt-3 text-[14px] text-soft">
          Also {s.failed} failed and {s.abandoned} abandoned {s.failed + s.abandoned === 1 ? "attempt" : "attempts"} in this period. A customer may have tried
          again; check before contacting them.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter payments" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-1 whitespace-nowrap px-1">
            {STATUSES.map((st) => (
              <li key={st}>
                <Link
                  href={link({ status: st })}
                  aria-current={st === status ? "page" : undefined}
                  className="block rounded-full border border-transparent px-3.5 py-1.5 text-[14px] text-soft hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-paper aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {st === "all" ? "All" : PAYMENT_LABEL[st]}{" "}
                  <span className="tabular-nums text-[#8a8178]">{inRange.filter((p) => st === "all" || p.status === st).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="flex gap-2 lg:w-[340px]" role="search">
          <input type="hidden" name="period" value={period.key} />
          <input name="q" defaultValue={q} placeholder="Reference, name, email or order" aria-label="Search payments" className={input} />
          <button type="submit" className={button.secondary}>
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 overflow-hidden rounded-[4px] border border-line bg-paper">
        {shown.length === 0 ? (
          <Empty title="No payments here">Payments appear as soon as customers check out.</Empty>
        ) : (
          <table className="w-full">
            <thead className="hidden border-b border-line bg-[#faf8f5] md:table-header-group">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Method</th>
                <th className={th}>Order</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((p) => (
                <tr key={p.reference} className="relative grid grid-cols-2 gap-x-4 gap-y-2 px-5 py-4 hover:bg-[#faf8f5] md:table-row md:p-0">
                  <td className="md:px-5 md:py-4">
                    <Link href={`/admin/payments/${p.reference}`} className="text-ink after:absolute after:inset-0">
                      {formatStamp(p.paidAt ?? p.createdAt)}
                    </Link>
                    <span className="block text-[13px] tabular-nums text-soft">{p.reference}</span>
                  </td>
                  <td className="text-right md:px-5 md:py-4 md:text-left">
                    {p.customer.name}
                    <span className="block text-[13px] text-soft">{p.customer.email}</span>
                  </td>
                  <td className="text-[14px] md:px-5 md:py-4">
                    {p.method}
                    {p.gatewayResponse && p.status === "failed" && <span className="block text-[13px] text-sold">{p.gatewayResponse}</span>}
                  </td>
                  <td className="text-right text-[14px] tabular-nums md:px-5 md:py-4 md:text-left">{p.orderNumber ?? <span className="text-soft">No order</span>}</td>
                  <td className="md:px-5 md:py-4">
                    <PaymentBadge status={p.status} />
                  </td>
                  <td className="text-right tabular-nums md:px-5 md:py-4">
                    <span className={p.status === "failed" || p.status === "abandoned" ? "text-soft line-through" : "font-medium"}>{formatNaira(p.amount)}</span>
                    {p.refunded > 0 && <span className="block text-[13px] text-warn">−{formatNaira(p.refunded)} refunded</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
