import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { moveOrder } from "@/app/admin/actions";
import { Due } from "@/components/admin/due";
import { CancelOrder, NoteForm } from "@/components/admin/order-forms";
import { PaymentBadge, StatusBadge } from "@/components/admin/status-badge";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, PageHeader, Pair, button, input } from "@/components/admin/ui";
import { paymentsForOrder } from "@/lib/db/payments";
import { isPdf, receiptUrl } from "@/lib/db/receipts";
import { formatNaira } from "@/lib/format";
import { customerMessage, trackingPath } from "@/lib/orders/messages";
import { ADMIN_STATUS_LABEL, isLate, nextStatus } from "@/lib/orders/progress";
import { getOrder } from "@/lib/orders/store";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { formatDay, formatStamp } from "@/lib/working-days";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[number]">): Promise<Metadata> {
  return { title: (await params).number };
}

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <AdminOrder params={params} />
    </Suspense>
  );
}

const CHANNEL: Record<Order["payment"]["channel"], string> = { card: "Card", bank_transfer: "Bank transfer", ussd: "USSD" };

async function AdminOrder({ params }: Pick<PageProps<"/admin/orders/[number]">, "params">) {
  const { number } = await params;
  const [order, payments] = await Promise.all([getOrder(number), paymentsForOrder(number)]);
  if (!order) notFound();
  const receipt = order.payment.receipt ? { url: await receiptUrl(order.payment.receipt), pdf: isPdf(order.payment.receipt) } : null;
  const next = nextStatus(order);
  const refundable = payments.some((p) => p.status === "success" || p.status === "partially_refunded");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "All orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="lining-nums tabular-nums">{order.number}</span>
            <StatusBadge status={order.status} late={isLate(order)} />
          </span>
        }
        description={
          <>
            Placed {formatStamp(order.placedAt)} by {order.customer.name} · {formatNaira(order.total)}{" "}
            {order.status === "pending_payment" ? "by bank transfer, not yet confirmed" : `paid by ${CHANNEL[order.payment.channel].toLowerCase()}`}
          </>
        }
        actions={
          <a href={trackingPath(order)} target="_blank" className={button.secondary}>
            Customer&rsquo;s view ↗
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          {order.status === "cancelled" ? (
            <Card title="Cancelled">
              <p className="text-soft">{order.cancelReason ?? "No reason was given."}</p>
            </Card>
          ) : next ? (
            <NextStep order={order} next={next} receipt={receipt} />
          ) : (
            <Card title="Complete">
              <p className="text-soft">This order has been delivered. Nothing more to do.</p>
            </Card>
          )}

          <Card title={`What to make (${order.items.reduce((n, i) => n + i.qty, 0)} ${order.items.length === 1 && order.items[0].qty === 1 ? "piece" : "pieces"})`} flush>
            {order.note && (
              <div className="border-b border-line bg-[#fbf3e4] px-6 py-4">
                <p className="text-[14px] font-medium text-warn">Note from the customer</p>
                <p className="mt-1 text-[16px] leading-relaxed text-ink">&ldquo;{order.note}&rdquo;</p>
              </div>
            )}
            <ul className="divide-y divide-line">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-4 px-6 py-4">
                  <div className="relative aspect-[2/3] w-[64px] shrink-0 overflow-hidden rounded-[2px] bg-stone">
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-6 gap-y-1">
                    <div>
                      <p className="text-[16px] font-medium">{item.name}</p>
                      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[15px]">
                        {item.options.map((o) => (
                          <div key={o.label} className="contents">
                            <dt className="text-soft">{o.label}</dt>
                            <dd className="font-medium">{o.value}</dd>
                          </div>
                        ))}
                        <dt className="text-soft">Quantity</dt>
                        <dd className="font-medium tabular-nums">{item.qty}</dd>
                      </dl>
                    </div>
                    <p className="tabular-nums">{formatNaira(item.unitPrice * item.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line px-6 py-4">
              <Pair label="Subtotal">{formatNaira(order.subtotal)}</Pair>
              <Pair label={order.delivery.label}>{order.delivery.fee ? formatNaira(order.delivery.fee) : "Free"}</Pair>
              <div className="mt-1.5 flex justify-between border-t border-line pt-3 text-[16px] font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Studio notes" description="Private. Customers never see these.">
            {order.staffNotes?.length ? (
              <ul className="mb-5 space-y-3">
                {order.staffNotes.map((n, i) => (
                  <li key={i} className="rounded-[3px] bg-stone px-4 py-3">
                    <p className="text-[15px] leading-relaxed">{n.text}</p>
                    <p className="mt-1 text-[13px] text-soft">{formatStamp(n.at)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <NoteForm number={order.number} />
          </Card>

          <Card title="Activity">
            <Activity order={order} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Ready to ship">
            {order.status === "pending_payment" ? (
              <p className="text-[15px] text-soft">The dates are set when you confirm the payment.</p>
            ) : (
              <p className="text-[16px]">
                {formatDay(order.readyWindow.from)}
                <span className="block text-[14px] text-soft">at the latest {formatDay(order.readyWindow.to)}</span>
              </p>
            )}
            <div className="mt-3 border-t border-line pt-3">
              <Due order={order} />
            </div>
          </Card>

          <Card title="Customer">
            <p className="font-medium">{order.customer.name}</p>
            <ul className="mt-2 space-y-1.5 text-[15px]">
              <li>
                <a href={`mailto:${order.customer.email}?subject=Your order ${order.number}`} className={button.quiet}>
                  {order.customer.email}
                </a>
              </li>
              <li>
                <a href={`tel:${order.customer.phone.replace(/\s/g, "")}`} className={button.quiet}>
                  {order.customer.phone}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className={button.quiet}>
                  WhatsApp ↗
                </a>
              </li>
            </ul>
            <Link href={`/admin/customers?q=${encodeURIComponent(order.customer.email)}`} className="mt-3 inline-block text-[14px] text-soft hover:text-ink">
              See all their orders →
            </Link>
          </Card>

          <Card title={order.delivery.label}>
            {order.delivery.address.length ? (
              <address className="not-italic leading-relaxed">
                {order.delivery.address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
            ) : (
              <p className="text-soft">Collecting from the studio.</p>
            )}
            {order.dispatch && (
              <p className="mt-3 border-t border-line pt-3">
                Sent with {order.dispatch.courier}
                {order.dispatch.trackingNumber && <span className="block tabular-nums text-soft">Tracking {order.dispatch.trackingNumber}</span>}
              </p>
            )}
          </Card>

          {order.payment.provider === "bank_transfer" && (
            <Card title="Bank transfer">
              <p className="tabular-nums">{formatNaira(order.total)}</p>
              <p className="text-[14px] text-soft">To {order.payment.account}</p>
              <p className="mt-3 border-t border-line pt-3 text-[15px]">
                {order.payment.paidAt ? `Confirmed ${formatStamp(order.payment.paidAt)}` : <span className="font-medium text-sold">Not confirmed yet</span>}
              </p>
              {receipt?.url ? (
                <a href={receipt.url} target="_blank" rel="noreferrer" className={`${button.quiet} mt-2 inline-block`}>
                  View receipt ↗
                </a>
              ) : (
                <p className="mt-1 text-[14px] text-soft">No receipt uploaded. Check WhatsApp.</p>
              )}
            </Card>
          )}

          {payments.length > 0 && (
          <Card title="Payments" flush>
            <ul className="divide-y divide-line">
              {payments.map((p) => (
                <li key={p.reference}>
                  <Link href={`/admin/payments/${p.reference}`} className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-[#faf8f5]">
                    <span>
                      <span className="block tabular-nums">{formatNaira(p.amount)}</span>
                      <span className="block text-[13px] text-soft">
                        {p.method} · {p.reference}
                      </span>
                    </span>
                    <PaymentBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          )}

          {order.status !== "delivered" && order.status !== "cancelled" && <CancelOrder number={order.number} canRefund={refundable} />}
        </div>
      </div>
    </>
  );
}

const ACTION: Record<OrderStatus, { title: string; hint: string }> = {
  pending_payment: { title: "Check payment", hint: "" },
  confirmed: {
    title: "Confirm payment",
    hint: "Press this once you have seen the transfer arrive in the bank account. The production dates start from today.",
  },
  in_production: { title: "Start production", hint: "Press this when the fabric is cut and the piece is with the tailor." },
  ready: { title: "Mark as ready", hint: "Press this when the piece is finished, pressed and checked." },
  dispatched: { title: "Mark as sent", hint: "Press this when the order has been handed to the courier or rider." },
  delivered: { title: "Mark as delivered", hint: "Press this when the customer has received the order." },
  cancelled: { title: "Cancel order", hint: "" },
};

function NextStep({ order, next, receipt }: { order: Order; next: OrderStatus; receipt: { url: string | null; pdf: boolean } | null }) {
  const pickup = order.delivery.method === "pickup";
  const action =
    next === "delivered" && pickup ? { title: "Mark as collected", hint: "Press this when the customer has collected the order." } : ACTION[next];
  const message = customerMessage(order, next);
  const first = order.customer.name.split(" ")[0];

  return (
    <section className="rounded-[4px] border-2 border-ink bg-paper">
      <div className="px-6 pb-2 pt-5">
        <p className="text-[14px] font-medium text-soft">Next step</p>
        <h2 className="mt-0.5 font-serif text-[30px] leading-tight">{action.title}</h2>
        <p className="mt-1 text-[15px] text-soft">{action.hint}</p>
        {order.status === "pending_payment" && (
          <div className="mt-4 rounded-[3px] border border-line bg-[#faf8f5] px-4 py-4">
            <p className="text-[15px]">
              Look for <b className="font-medium tabular-nums">{formatNaira(order.total)}</b> from <b className="font-medium">{order.customer.name}</b> in{" "}
              {order.payment.account ?? "the shop account"}.
            </p>
            {receipt?.url ? (
              receipt.pdf ? (
                <a href={receipt.url} target="_blank" rel="noreferrer" className={`${button.secondary} mt-3`}>
                  Open the receipt (PDF) ↗
                </a>
              ) : (
                <a href={receipt.url} target="_blank" rel="noreferrer" className="mt-3 block w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived private link */}
                  <img src={receipt.url} alt={`Payment receipt for ${order.number}`} className="max-h-[420px] w-auto rounded-[2px] border border-line" />
                  <span className="mt-1.5 block text-[13px] text-soft">Open full size ↗</span>
                </a>
              )
            ) : (
              <p className="mt-2 text-[14px] text-soft">
                No receipt uploaded. They may have sent it on{" "}
                <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, "").replace(/^0/, "234")}`} target="_blank" rel="noreferrer" className={button.quiet}>
                  WhatsApp ↗
                </a>
                .
              </p>
            )}
            <p className="mt-3 text-[13px] text-soft">If the money never arrives, cancel the order below.</p>
          </div>
        )}
      </div>

      <form action={moveOrder} className="px-6 pb-6 pt-4">
        <input type="hidden" name="number" value={order.number} />
        <input type="hidden" name="to" value={next} />

        {next === "dispatched" && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Courier</span>
              <select name="courier" defaultValue="Studio rider" className={input}>
                <option>Studio rider</option>
                <option>GIG Logistics</option>
                <option>DHL Express</option>
                <option>Kwik Delivery</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Tracking number (optional)</span>
              <input name="trackingNumber" className={input} autoComplete="off" />
            </label>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-[3px] border border-line">
            <label className="flex cursor-pointer items-start gap-3 border-b border-line bg-[#faf8f5] px-4 py-3">
              <input type="checkbox" name="notify" defaultChecked className="mt-1 h-4 w-4 accent-ink" />
              <span className="text-[15px]">
                <span className="font-medium">Send {first} an email and text message</span>
                <span className="block text-[14px] text-soft">
                  {order.customer.email} · {order.customer.phone}
                </span>
              </span>
            </label>
            <div className="space-y-3 px-4 py-4 text-[15px] leading-relaxed">
              <div>
                <p className="text-[13px] font-medium text-soft">Email</p>
                <p className="font-medium">{message.subject}</p>
                <p className="text-soft">{message.body}</p>
              </div>
              <div>
                <p className="text-[13px] font-medium text-soft">Text message</p>
                <p className="text-soft">{message.sms}</p>
              </div>
            </div>
          </div>
        )}

        <SubmitButton pending="Updating…" className={`${button.primary} w-full sm:w-auto sm:px-8`}>
          {action.title}
        </SubmitButton>
      </form>
    </section>
  );
}

function Activity({ order }: { order: Order }) {
  type Entry = { at: string; text: React.ReactNode; tone?: "red" };
  const entries: Entry[] = [
    ...order.history.map((e) => ({
      at: e.at,
      text:
        e.status === "pending_payment" ? (
          "Order placed: customer says they have paid by bank transfer"
        ) : e.status === "confirmed" ? (
          order.payment.provider === "bank_transfer" ? "Payment confirmed" : "Paid and confirmed"
        ) : (
          <>
            Moved to <b className="font-medium">{ADMIN_STATUS_LABEL[e.status]}</b>
            {e.note ? ` · ${e.note}` : ""}
          </>
        ),
    })),
    ...order.messages.map((m) => ({
      at: m.at,
      tone: m.result === "failed" ? ("red" as const) : undefined,
      text: (
        <>
          {m.channel === "email" ? "Email" : "Text"} {m.result === "failed" ? "failed to send" : m.result === "logged" ? "prepared (not sent: provider not connected)" : "sent"} to {m.to}
          <span className="text-soft"> · {customerMessage(order, m.about)?.subject ?? m.about}</span>
        </>
      ),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ol className="space-y-2.5">
      {entries.map((e, i) => (
        <li key={i} className="grid gap-x-4 text-[15px] sm:grid-cols-[130px_1fr]">
          <span className="text-[14px] tabular-nums text-soft">{formatStamp(e.at)}</span>
          <span className={e.tone === "red" ? "text-sold" : ""}>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}
