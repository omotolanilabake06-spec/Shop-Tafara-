import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderItems } from "@/components/order/order-items";
import { ProgressPanel } from "@/components/order/progress-panel";
import { Timeline } from "@/components/order/timeline";
import { formatNaira } from "@/lib/format";
import { madeToOrder } from "@/lib/orders/progress";
import { getSettings } from "@/lib/catalog";
import { getOrderWithKey } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { formatDay, lagosDate } from "@/lib/working-days";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

// Reached from the link in every order email, or from the form on /track.
export default function OrderPage({ searchParams }: PageProps<"/track/order">) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderView searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderView({ searchParams }: Pick<PageProps<"/track/order">, "searchParams">) {
  const { n, key, placed } = await searchParams;
  const [order, settings] = await Promise.all([
    typeof n === "string" && typeof key === "string" ? getOrderWithKey(n, key) : null,
    getSettings(),
  ]);
  if (!order) return <NoOrder />;
  const contact = settings.store.email;
  const whatsapp = settings.store.whatsapp.replace(/\D/g, "");
  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello Shop Tafara, here is my payment receipt for order ${order.number} (${formatNaira(order.total)}).`)}`;
  const checking = order.status === "pending_payment";

  const first = order.customer.name.split(" ")[0];
  const { headline, line } = intro(order);

  return (
    <article className="gutter pb-28">
      <header className="mx-auto max-w-[760px] pb-10 pt-10 text-center sm:pb-12 sm:pt-14">
        <p className="caps-sm text-muted">
          Order <span className="tabular-nums">{order.number}</span> &nbsp;·&nbsp; Placed {formatDay(lagosDate(order.placedAt))}
        </p>
        <h1 className="display mt-4 text-[40px] sm:text-[56px]">{headline}</h1>
        <p className="mx-auto mt-5 max-w-[52ch] text-[14px] leading-relaxed text-muted">
          {order.status === "confirmed" || checking ? `Thank you, ${first}. ` : ""}
          {line}
        </p>
        {placed && (
          <p className="mx-auto mt-6 max-w-[52ch] border-t border-line pt-6 text-[13px] leading-relaxed text-muted">
            We have emailed you a link to this page. To check on your order any time, tap{" "}
            <Link href="/track" className="text-ink underline underline-offset-4">
              Track my order
            </Link>{" "}
            at the top of the website and enter your email and phone number.
          </p>
        )}
        {checking && !order.payment.receipt && whatsapp && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-solid mt-8">
            Send your receipt on WhatsApp
          </a>
        )}
      </header>

      <div className="mx-auto max-w-[1040px]">
        <ProgressPanel order={order} production={settings.production} />

        <section aria-label="Order steps" className="border-b border-line px-2 py-12 sm:py-14">
          <Timeline order={order} />
        </section>

        <div className="grid gap-14 pt-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-20">
          <section aria-labelledby="pieces">
            <h2 id="pieces" className="caps mb-5">
              Your order
            </h2>
            <OrderItems items={order.items} />
            <dl className="mt-6 space-y-2.5 text-[14px]">
              <Row label="Subtotal" value={formatNaira(order.subtotal)} />
              <Row label={order.delivery.label} value={order.delivery.fee ? formatNaira(order.delivery.fee) : "Free"} />
              <div className="flex justify-between border-t border-line pt-4 text-[15px]">
                <dt className="caps">Total</dt>
                <dd className="tabular-nums">{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </section>

          <aside className="space-y-10 text-[14px] leading-relaxed">
            <Detail title={order.delivery.method === "pickup" ? "Collection" : "Delivering to"}>
              <p className="text-ink">{order.customer.name}</p>
              {order.delivery.method === "pickup" ? (
                <p>From our Lagos studio. We will arrange a time with you once your piece is ready.</p>
              ) : (
                order.delivery.address.map((l) => <p key={l}>{l}</p>)
              )}
            </Detail>
            <Detail title="Payment">
              {order.payment.provider === "bank_transfer" ? (
                <p>
                  Bank transfer of <span className="tabular-nums">{formatNaira(order.total)}</span>
                  <br />
                  {checking ? (
                    <>
                      We are checking it now{order.payment.receipt ? ", with the receipt you uploaded." : "."}
                      {!order.payment.receipt && whatsapp && (
                        <>
                          {" "}
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
                            Send your receipt
                          </a>
                        </>
                      )}
                    </>
                  ) : order.payment.paidAt ? (
                    `Received ${formatDay(lagosDate(order.payment.paidAt))}`
                  ) : (
                    "Received"
                  )}
                </p>
              ) : (
                <p>
                  Paid by {CHANNEL[order.payment.channel]} through Paystack
                  <br />
                  <span className="tabular-nums">Ref. {order.payment.reference}</span>
                </p>
              )}
            </Detail>
            {order.note && (
              <Detail title="Your note">
                <p className="text-[14px] text-ink">&ldquo;{order.note}&rdquo;</p>
              </Detail>
            )}
            <Detail title="Need anything?">
              <p>
                Write to{" "}
                <a href={`mailto:${contact}?subject=Order ${order.number}`} className="text-ink underline underline-offset-4">
                  {contact}
                </a>{" "}
                quoting your order number, and we will reply personally.
              </p>
            </Detail>
          </aside>
        </div>
      </div>
    </article>
  );
}

const CHANNEL: Record<Order["payment"]["channel"], string> = { card: "card", bank_transfer: "bank transfer", ussd: "USSD" };

function intro(order: Order) {
  const many = order.items.filter((i) => i.kind === "clothing").reduce((n, i) => n + i.qty, 0) > 1;
  const piece = many ? "Your pieces are" : "Your piece is";
  switch (order.status) {
    case "pending_payment":
      return {
        headline: "We are checking your payment",
        line: `Your order is placed. As soon as your transfer of ${formatNaira(order.total)} reaches us, we will confirm it by email${
          madeToOrder(order) ? " and begin making your piece" : ""
        }.`,
      };
    case "confirmed":
      return {
        headline: "Your order is confirmed",
        line: madeToOrder(order)
          ? "We have received your payment and your order is booked into our Lagos atelier."
          : "We have received your payment and are preparing your order.",
      };
    case "in_production":
      return { headline: `${piece} being made`, line: "Your fabric has been cut and your order is being sewn in our Lagos atelier." };
    case "ready":
      return order.delivery.method === "pickup"
        ? { headline: "Ready to collect", line: "Finished, pressed and waiting for you at the studio." }
        : { headline: `${piece} ready`, line: "Finished, pressed and checked. It will be on its way to you shortly." };
    case "dispatched":
      return { headline: "On its way to you", line: "Your order has left the studio and is with our delivery partner." };
    case "delivered":
      return { headline: "Delivered", line: "Thank you for choosing Shop Tafara. We hope you love wearing it." };
    case "cancelled":
      return { headline: "Order cancelled", line: "This order has been cancelled. Please contact us if you have any questions." };
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <dt>{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="caps mb-3 text-ink">{title}</h2>
      <div className="text-muted">{children}</div>
    </section>
  );
}

function NoOrder() {
  return (
    <div className="gutter flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="caps-sm text-muted">Your order</p>
      <h1 className="display mt-4 text-[40px] sm:text-[52px]">We couldn&rsquo;t open this order</h1>
      <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-muted">
        The link may be incomplete. Enter the email and phone number you ordered with to find it.
      </p>
      <Link href="/track" className="btn btn-solid mt-9">
        Track my order
      </Link>
    </div>
  );
}

function OrderSkeleton() {
  const block = "bg-stone animate-pulse [animation-duration:2.4s]";
  return (
    <div className="gutter pb-28" aria-busy>
      <div className="flex flex-col items-center pb-12 pt-14">
        <div className={`h-2.5 w-48 ${block}`} />
        <div className={`mt-6 h-11 w-80 max-w-full ${block}`} />
      </div>
      <div className={`mx-auto h-[300px] max-w-[1040px] ${block}`} />
    </div>
  );
}
