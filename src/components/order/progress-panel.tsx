import { formatDay, formatStamp } from "@/lib/working-days";
import { countdown, eventAt, madeToOrder } from "@/lib/orders/progress";
import type { Settings } from "@/lib/types";
import type { Order } from "@/lib/orders/types";

/** The large "how long until it's ready" block at the top of the tracking page. */
export function ProgressPanel({ order, production }: { order: Order; production: Settings["production"] }) {
  const c = countdown(order);
  const days = madeToOrder(order)
    ? { min: production.madeToOrderMin, max: production.madeToOrderMax }
    : { min: production.readyMadeMin, max: production.readyMadeMax };

  let figure: React.ReactNode;
  let caption: string;
  let detail: React.ReactNode;

  if (c.state === "making") {
    figure = <span className="tabular-nums">{c.daysLeft}</span>;
    caption = c.daysLeft === 1 ? "working day to go" : "working days to go";
    detail = (
      <>
        <Bar value={c.elapsed / c.total} />
        <p className="mt-6 text-[15px] text-ink">Expected ready {formatDay(order.readyWindow.from)}</p>
        <p className="mt-1.5 text-[13px] text-muted">and no later than {formatDay(order.readyWindow.to)}</p>
      </>
    );
  } else if (c.state === "finishing") {
    figure = "Final touches";
    caption = "being finished and checked";
    detail = (
      <>
        <Bar value={0.92} />
        <p className="mt-6 text-[15px] text-ink">Ready by {formatDay(order.readyWindow.to)}</p>
      </>
    );
  } else if (c.state === "late") {
    figure = "A little longer";
    caption = "worth the wait";
    detail = (
      <p className="mx-auto mt-6 max-w-[42ch] text-[15px] leading-relaxed text-muted">
        Your piece needs a little more time to be just right. We will be in touch personally with your new date.
      </p>
    );
  } else if (order.status === "ready") {
    figure = order.delivery.method === "pickup" ? "Ready to collect" : "Ready";
    caption = "finished, pressed and checked";
    detail = (
      <p className="mt-6 text-[15px] text-muted">
        {order.delivery.method === "pickup"
          ? "Reply to your confirmation email to arrange a time to collect."
          : "We are preparing it for delivery and will send tracking details shortly."}
      </p>
    );
  } else if (order.status === "dispatched") {
    figure = "On its way";
    caption = order.dispatch?.courier ? `with ${order.dispatch.courier}` : "to you";
    detail = order.dispatch?.trackingNumber ? (
      <p className="mt-6 text-[15px] text-ink">
        Tracking number <span className="tabular-nums">{order.dispatch.trackingNumber}</span>
      </p>
    ) : null;
  } else if (order.status === "delivered") {
    const at = eventAt(order, "delivered");
    figure = order.delivery.method === "pickup" ? "Collected" : "Delivered";
    caption = at ? formatStamp(at) : "";
    detail = <p className="mt-6 text-[15px] text-muted">We hope it feels made for you, because it was.</p>;
  } else {
    figure = "Cancelled";
    caption = "this order was cancelled";
    detail = null;
  }

  return (
    <section aria-label="Order progress" className="bg-stone px-6 py-14 text-center sm:py-16">
      <p className="display text-[64px] leading-none lining-nums sm:text-[88px]">{figure}</p>
      <p className="caps mt-4 text-muted">{caption}</p>
      {detail}
      {(c.state === "making" || c.state === "finishing") && (
        <p className="mx-auto mt-8 max-w-[46ch] text-[12px] leading-relaxed text-muted">
          {madeToOrder(order)
            ? `Made-to-order pieces are ready to ship in ${days.min}–${days.max} working days. We count Monday to Friday, excluding public holidays.`
            : `Ready-made pieces are packed within ${days.min}–${days.max} working days.`}
        </p>
      )}
    </section>
  );
}

function Bar({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0.06, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Production progress"
      className="mx-auto mt-9 h-px w-full max-w-[320px] bg-line"
    >
      <div className="h-px bg-ink" style={{ width: `${pct}%` }} />
    </div>
  );
}
