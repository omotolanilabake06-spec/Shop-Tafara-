// Words the customer receives at each step, by email and SMS. One place so the client can review them.
import { formatNaira } from "@/lib/format";
import { formatDay } from "@/lib/working-days";
import { madeToOrder } from "./progress";
import type { Order, OrderStatus } from "./types";

export type CustomerMessage = { subject: string; heading: string; body: string; sms: string };

export const trackingPath = (order: Pick<Order, "number" | "accessKey">) => `/track/order?n=${order.number}&key=${order.accessKey}`;

export function trackingUrl(order: Order, origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") {
  return `${origin}${trackingPath(order)}`;
}

/** The update sent when an order moves to `status`, or null for steps with no message. */
export function customerMessage(order: Order, status: OrderStatus): CustomerMessage | null {
  const first = order.customer.name.split(" ")[0];
  const link = trackingUrl(order);
  const pickup = order.delivery.method === "pickup";
  const transfer = order.payment.provider === "bank_transfer";
  switch (status) {
    case "pending_payment":
      return {
        subject: `We have received your order ${order.number}`,
        heading: `Thank you, ${first}`,
        body: `We have received your order and are now checking your transfer of ${formatNaira(order.total)}. As soon as it reaches our account, we will confirm your order by email${madeToOrder(order) ? " and begin making your piece" : ""}. You can follow your order at any time.`,
        sms: `Shop Tafara: thank you, ${first}. We have received order ${order.number} and are checking your payment. Track it here: ${link}`,
      };
    case "confirmed":
      return {
        subject: transfer ? `Payment received: order ${order.number} is confirmed` : `Your Shop Tafara order ${order.number}`,
        heading: transfer ? `Your order is confirmed` : `Thank you, ${first}`,
        body: madeToOrder(order)
          ? `${transfer ? "We have received your payment. " : ""}Your order is confirmed and booked into our Lagos atelier. Your piece will be made for you and ready to ship by ${formatDay(order.readyWindow.to)}. You can follow every step at any time.`
          : `${transfer ? "We have received your payment. " : ""}Your order is confirmed. We will pack it with care and let you know the moment it is on its way.`,
        sms: `Shop Tafara: ${transfer ? "payment received. " : `thank you, ${first}. `}Order ${order.number} is confirmed. Track it here: ${link}`,
      };
    case "in_production":
      return {
        subject: `Your piece is being made`,
        heading: `Your piece is in the atelier`,
        body: `Your fabric has been cut and your piece is now being sewn in our Lagos atelier. We will write again the moment it is finished.`,
        sms: `Shop Tafara: your piece for order ${order.number} is now being made. Follow it here: ${link}`,
      };
    case "ready":
      return {
        subject: pickup ? `Your piece is ready to collect` : `Your piece is ready`,
        heading: pickup ? `Ready when you are` : `Your piece is ready`,
        body: pickup
          ? `Your order is finished, pressed and waiting for you at the studio. Reply to this email to arrange a time to collect.`
          : `Your order is finished, pressed and checked. We are preparing it for delivery and will send tracking details as soon as it leaves the studio.`,
        sms: pickup
          ? `Shop Tafara: order ${order.number} is ready to collect. Reply to arrange a time.`
          : `Shop Tafara: good news, ${first}. Order ${order.number} is ready and will be dispatched shortly.`,
      };
    case "dispatched": {
      const via = order.dispatch?.courier ? ` with ${order.dispatch.courier}` : "";
      const ref = order.dispatch?.trackingNumber ? ` Tracking number: ${order.dispatch.trackingNumber}.` : "";
      return {
        subject: `Your order is on its way`,
        heading: `On its way to you`,
        body: `Your order has left the studio${via}.${ref}`,
        sms: `Shop Tafara: order ${order.number} is on its way${via}.${ref}`,
      };
    }
    case "delivered":
      return {
        subject: `Delivered: order ${order.number}`,
        heading: `Enjoy wearing it`,
        body: `Your order has been delivered. We hope it feels made for you, because it was. Tag @shoptafara when you wear it.`,
        sms: `Shop Tafara: order ${order.number} has been delivered. Thank you, ${first}.`,
      };
    case "cancelled":
      return null;
  }
}
