import { countdown, eventAt } from "@/lib/orders/progress";
import type { Order } from "@/lib/orders/types";
import { formatDayShort, formatStamp } from "@/lib/working-days";

/** When an order is due, in plain words, for the orders table and order page. */
export function Due({ order }: { order: Order }) {
  const c = countdown(order);
  switch (c.state) {
    case "making":
      return (
        <span>
          <span className="tabular-nums">{c.daysLeft}</span> working {c.daysLeft === 1 ? "day" : "days"} left
          <span className="block text-[13px] text-soft">Ready by {formatDayShort(order.readyWindow.from)}</span>
        </span>
      );
    case "finishing":
      return (
        <span className="text-warn">
          Due now
          <span className="block text-[13px]">Latest {formatDayShort(order.readyWindow.to)}</span>
        </span>
      );
    case "late":
      return (
        <span className="font-medium text-sold">
          <span className="tabular-nums">{c.daysLate}</span> working {c.daysLate === 1 ? "day" : "days"} late
          <span className="block text-[13px] font-normal">Promised {formatDayShort(order.readyWindow.to)}</span>
        </span>
      );
  }
  if (order.status === "ready") return <span>{order.delivery.method === "pickup" ? "Waiting for collection" : "Waiting to be sent"}</span>;
  if (order.status === "dispatched") return <span className="text-soft">With {order.dispatch?.courier ?? "courier"}</span>;
  if (order.status === "cancelled") return <span className="text-soft">Cancelled</span>;
  const at = eventAt(order, order.status);
  return <span className="text-soft">{at ? `Delivered ${formatStamp(at)}` : "—"}</span>;
}
