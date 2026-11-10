import { formatDayShort, formatStamp } from "@/lib/working-days";
import { eventAt, statusLabel, steps } from "@/lib/orders/progress";
import type { Order } from "@/lib/orders/types";

/** The order's journey: vertical on phones, a single line across on larger screens. */
export function Timeline({ order }: { order: Order }) {
  const journey = steps(order);
  const current = journey.indexOf(order.status);

  return (
    <ol className="grid md:grid-flow-col md:auto-cols-fr">
      {journey.map((status, i) => {
        const reached = i <= current;
        const at = eventAt(order, status);
        const expected = !reached && status === "ready" && order.status !== "pending_payment" ? `Expected ${formatDayShort(order.readyWindow.from)}` : null;
        return (
          <li key={status} className="relative pb-9 pl-9 last:pb-0 md:pb-0 md:pl-0 md:pt-9 md:text-center">
            {i < journey.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[5px] top-4 bottom-0 w-px md:left-1/2 md:right-[-50%] md:top-[5px] md:bottom-auto md:h-px md:w-auto ${
                  i < current ? "bg-ink" : "bg-line"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`absolute left-0 top-1 h-[11px] w-[11px] rounded-full border md:left-1/2 md:top-0 md:-translate-x-1/2 ${
                i === current ? "border-ink bg-ink ring-4 ring-sand" : reached ? "border-ink bg-ink" : "border-line bg-paper"
              }`}
            />
            <p className={`caps ${reached ? "text-ink" : "text-muted"}`}>
              {statusLabel(order, status)}
              {i === current && <span className="sr-only"> (current step)</span>}
            </p>
            <p className="mt-1.5 text-[13px] text-muted tabular-nums">{at ? formatStamp(at) : expected}</p>
          </li>
        );
      })}
    </ol>
  );
}
