// Everything the tracking page and admin need to describe where an order is.
import { lagosDate, workingDaysBetween } from "@/lib/working-days";
import type { Order, OrderStatus } from "./types";

/** Clothing is made to order; TAFARA HOME is ready-made, so it skips the atelier. */
export const PRODUCTION_DAYS = { madeToOrder: { min: 5, max: 7 }, readyMade: { min: 1, max: 2 } };

export const madeToOrder = (order: Pick<Order, "items">) => order.items.some((i) => i.kind === "clothing");

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Order placed",
  confirmed: "Payment confirmed",
  in_production: "In the atelier",
  ready: "Ready",
  dispatched: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Admin wording, shorter and about the work rather than the customer. */
export const ADMIN_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Check payment",
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

/**
 * The journey for this order: bank-transfer orders start with the payment check, ready-made
 * pieces skip the atelier, pickups skip dispatch.
 */
export function steps(order: Order): OrderStatus[] {
  const s: OrderStatus[] = order.payment.provider === "bank_transfer" ? ["pending_payment", "confirmed"] : ["confirmed"];
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

/** Delivered orders are kept this long for returns and questions before they can be deleted. */
export const KEEP_DELIVERED_DAYS = 90;

/**
 * Whether the studio may delete this order. Cancelled and unpaid orders can go at once, delivered
 * orders after KEEP_DELIVERED_DAYS; orders a customer is still waiting for are protected.
 * Returns null when deleting is allowed, or the reason it isn't.
 */
export function deleteBlock(order: Order, now = new Date()): string | null {
  if (order.status === "cancelled" || order.status === "pending_payment") return null;
  if (order.status === "delivered") {
    const at = [...order.history].reverse().find((e) => e.status === "delivered")?.at ?? order.placedAt;
    const days = Math.floor((now.getTime() - new Date(at).getTime()) / 86_400_000);
    return days >= KEEP_DELIVERED_DAYS ? null : `Delivered orders can be deleted ${KEEP_DELIVERED_DAYS} days after delivery (${KEEP_DELIVERED_DAYS - days} more days).`;
  }
  return "A customer is still waiting for this order, so it can't be deleted. Cancel it first if it isn't going ahead.";
}
