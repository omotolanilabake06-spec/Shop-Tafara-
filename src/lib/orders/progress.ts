// Everything the tracking page and admin need to describe where an order is.
import { lagosDate, workingDaysBetween } from "@/lib/working-days";
import type { Order, OrderStatus } from "./types";

/** Clothing is made to order; TAFARA HOME is ready-made, so it skips the atelier. */
export const PRODUCTION_DAYS = { madeToOrder: { min: 5, max: 7 }, readyMade: { min: 1, max: 2 } };

export const madeToOrder = (order: Pick<Order, "items">) => order.items.some((i) => i.kind === "clothing");

export const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Order confirmed",
  in_production: "In the atelier",
  ready: "Ready",
  dispatched: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Admin wording, shorter and about the work rather than the customer. */
export const ADMIN_STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "To start",
  in_production: "In the atelier",
  ready: "Ready",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Customer label for a status, worded for studio pickup where that applies. */
export function statusLabel(order: Order, status: OrderStatus) {
  if (order.delivery.method === "pickup") {
    if (status === "ready") return "Ready to collect";
    if (status === "delivered") return "Collected";
  }
  return STATUS_LABEL[status];
}

/** The journey for this order: ready-made pieces skip the atelier, pickups skip dispatch. */
export function steps(order: Order): OrderStatus[] {
  const s: OrderStatus[] = ["confirmed"];
  if (madeToOrder(order)) s.push("in_production");
  s.push("ready");
  if (order.delivery.method !== "pickup") s.push("dispatched");
  s.push("delivered");
  return s;
}

/** The next status the owner can move an order to, or null when it is finished. */
export function nextStatus(order: Order): OrderStatus | null {
  const s = steps(order);
  const i = s.indexOf(order.status);
  return i === -1 || i === s.length - 1 ? null : s[i + 1];
}

export type Countdown =
  | { state: "making"; daysLeft: number; elapsed: number; total: number }
  | { state: "finishing"; daysLeft: number }
  | { state: "late"; daysLate: number }
  | { state: "done" };

/** Working days until the piece should be ready. `today` is passed in so the result is pure. */
export function countdown(order: Order, today = lagosDate()): Countdown {
  if (order.status !== "confirmed" && order.status !== "in_production") return { state: "done" };
  const placed = lagosDate(order.placedAt);
  const toFrom = workingDaysBetween(today, order.readyWindow.from);
  if (toFrom > 0) {
    const total = workingDaysBetween(placed, order.readyWindow.from);
    return { state: "making", daysLeft: toFrom, elapsed: total - toFrom, total };
  }
  const toEnd = workingDaysBetween(today, order.readyWindow.to);
  if (toEnd >= 0) return { state: "finishing", daysLeft: toEnd };
  return { state: "late", daysLate: -toEnd };
}

export const isLate = (order: Order, today?: string) => countdown(order, today).state === "late";

export function eventAt(order: Order, status: OrderStatus) {
  return order.history.findLast((e) => e.status === status)?.at;
}
