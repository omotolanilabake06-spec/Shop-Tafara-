// Tells the customer (and, for new orders, the owner) when an order moves on.
import { fetchSettings } from "@/lib/db/settings";
import { esc, orderEmailHtml } from "@/lib/notify/email-template";
import { sendEmail, sendSms } from "@/lib/notify/providers";
import { formatNaira } from "@/lib/format";
import { customerMessage, trackingUrl } from "./messages";
import type { Order, OrderStatus, SentMessage } from "./types";

const origin = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function notifyCustomer(order: Order, status: OrderStatus): Promise<SentMessage[]> {
  const message = customerMessage(order, status);
  if (!message) return [];
  const settings = await fetchSettings();
  const link = trackingUrl(order);

  const sent: SentMessage[] = [];
  const email = await sendEmail({
    to: order.customer.email,
    subject: message.subject,
    html: orderEmailHtml({ order, message, link, settings, origin: origin() }),
    text: `${message.heading}\n\n${message.body}\n\nTrack your order: ${link}`,
    replyTo: settings.store.email,
  });
  sent.push({ channel: "email", to: order.customer.email, about: status, at: new Date().toISOString(), ...email });

  if (settings.notifications.sms && order.customer.phone) {
    const sms = await sendSms({ to: order.customer.phone, text: message.sms });
    sent.push({ channel: "sms", to: order.customer.phone, about: status, at: new Date().toISOString(), ...sms });
  }
  return sent;
}

/** New-order alert for the studio. Called by checkout once Paystack confirms payment (Phase 3). */
export async function notifyOwnerOfOrder(order: Order) {
  const settings = await fetchSettings();
  const lines = order.items.map((i) => `${i.qty} × ${i.name} (${i.options.map((o) => o.value).join(", ")})`).join("\n");
  const note = order.note ? `<p><i>Note: ${esc(order.note)}</i></p>` : "";
  return sendEmail({
    to: settings.notifications.ownerEmail,
    subject: `New order ${order.number} · ${formatNaira(order.total)}`,
    html: `<p style="font:15px/1.6 Helvetica,Arial,sans-serif">New order <b>${order.number}</b> from ${esc(order.customer.name)}.</p><pre style="font:14px/1.6 Helvetica,Arial,sans-serif">${esc(lines)}</pre>${note}<p><a href="${origin()}/admin/orders/${order.number}">Open in admin</a></p>`,
    text: `New order ${order.number} from ${order.customer.name}\n\n${lines}\n\nOpen: ${origin()}/admin/orders/${order.number}`,
  });
}
