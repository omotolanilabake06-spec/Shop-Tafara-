import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaymentNoteForm, RefundForm } from "@/components/admin/payment-forms";
import { PaymentBadge } from "@/components/admin/status-badge";
import { Card, PageHeader, Pair, button } from "@/components/admin/ui";
import { getPayment } from "@/lib/db/payments";
import { formatNaira } from "@/lib/format";
import type { PaymentEvent } from "@/lib/payments/types";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Payment" };

export default function PaymentPage({ params }: PageProps<"/admin/payments/[reference]">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <PaymentDetail params={params} />
    </Suspense>
  );
}

const EVENT: Record<PaymentEvent["type"], { label: string; dot: string }> = {
  initialized: { label: "Checkout started", dot: "bg-[#cfc7bc]" },
  success: { label: "Paid", dot: "bg-ok" },
  failed: { label: "Failed", dot: "bg-sold" },
  abandoned: { label: "Abandoned", dot: "bg-[#cfc7bc]" },
  refund: { label: "Refund", dot: "bg-warn" },
  note: { label: "Note", dot: "bg-ink" },
};

async function PaymentDetail({ params }: Pick<PageProps<"/admin/payments/[reference]">, "params">) {
  const payment = await getPayment((await params).reference);
  if (!payment) notFound();
  const settled = payment.status === "success" || payment.status === "partially_refunded" || payment.status === "refunded";
  const refundable = payment.amount - payment.refunded;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/payments", label: "Payments" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="lining-nums tabular-nums">{formatNaira(payment.amount)}</span>
            <PaymentBadge status={payment.status} />
          </span>
        }
        description={`${payment.method} · ${payment.customer.name} · ${formatStamp(payment.paidAt ?? payment.createdAt)}`}
        actions={
          payment.orderNumber && (
            <Link href={`/admin/orders/${payment.orderNumber}`} className={button.secondary}>
              Open order {payment.orderNumber}
            </Link>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card title="History">
            <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
              {[...payment.events].reverse().map((e, i) => (
                <li key={i} className="relative pl-7">
                  <span className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-paper ${EVENT[e.type].dot}`} aria-hidden />
                  <p className="text-[15px]">
                    <span className="font-medium">{EVENT[e.type].label}</span>
                    <span className="text-soft"> · {formatStamp(e.at)}</span>
                    {e.by && <span className="text-soft"> · by {e.by}</span>}
                  </p>
                  <p className="mt-0.5 text-[15px] text-soft">{e.message}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 border-t border-line pt-5">
              <PaymentNoteForm reference={payment.reference} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Breakdown">
            <dl>
              <Pair label="Amount">{formatNaira(payment.amount)}</Pair>
              {settled && (
                <>
                  <Pair label="Refunded">{payment.refunded ? `−${formatNaira(payment.refunded)}` : "—"}</Pair>
                  <Pair label="Paystack fee">−{formatNaira(payment.fees)}</Pair>
                  <div className="mt-1.5 flex justify-between border-t border-line pt-3 text-[16px] font-medium">
                    <dt>To your bank</dt>
                    <dd className="tabular-nums">{formatNaira(payment.amount - payment.refunded - payment.fees)}</dd>
                  </div>
                </>
              )}
            </dl>
            {!settled && payment.gatewayResponse && <p className="mt-3 text-[15px] text-sold">Paystack said: {payment.gatewayResponse}</p>}
            {!settled && !payment.orderNumber && (
              <p className="mt-3 text-[14px] text-soft">No money was taken and no order was created.</p>
            )}
          </Card>

          <Card title="Details">
            <dl>
              <Pair label="Reference">
                <span className="tabular-nums">{payment.reference}</span>
              </Pair>
              <Pair label="Method">{payment.method}</Pair>
              <Pair label="Customer">{payment.customer.name}</Pair>
              <Pair label="Email">
                <a href={`mailto:${payment.customer.email}`} className={button.quiet}>
                  {payment.customer.email}
                </a>
              </Pair>
              <Pair label="Started">{formatStamp(payment.createdAt)}</Pair>
              {payment.paidAt && <Pair label="Paid">{formatStamp(payment.paidAt)}</Pair>}
            </dl>
          </Card>

          {refundable > 0 && (payment.status === "success" || payment.status === "partially_refunded") && (
            <Card title="Refund" description={`${formatNaira(refundable)} can still be refunded.`}>
              <RefundForm reference={payment.reference} refundable={refundable} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
