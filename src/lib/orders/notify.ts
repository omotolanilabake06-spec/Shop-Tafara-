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

/** New-order alert for the studio, sent when a customer presses "I have made payment". */
export async function notifyOwnerOfOrder(order: Order) {
  const settings = await fetchSettings();
  const lines = order.items.map((i) => `${i.qty} × ${i.name} (${i.options.map((o) => o.value).join(", ")})`);
  const admin = `${origin()}/admin/orders/${order.number}`;
  const receipt = order.payment.receipt ? "Receipt uploaded. Open the order to view it." : "No receipt uploaded. They may send it on WhatsApp.";
  const where = order.delivery.address.length ? order.delivery.address.join(", ") : "Collecting from the studio";
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6f675f;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;color:#161412">${value}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f2ed">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;font:15px/1.6 'Helvetica Neue',Helvetica,Arial,sans-serif">
  <tr><td style="padding:32px 32px 0">
    <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6f675f">New order · check payment</div>
    <div style="font:400 30px/1.2 Georgia,serif;color:#161412;margin-top:8px">${esc(order.number)} · ${formatNaira(order.total)}</div>
    <p style="color:#4d4741;margin:12px 0 0">${esc(order.customer.name)} says they have transferred <b>${formatNaira(order.total)}</b> to ${esc(order.payment.account ?? "the shop account")}. Check that the money has arrived, then confirm the payment in the admin.</p>
  </td></tr>
  <tr><td style="padding:20px 32px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
    ${row("Pieces", lines.map(esc).join("<br>"))}
    ${row("Customer", `${esc(order.customer.name)}<br>${esc(order.customer.email)}<br>${esc(order.customer.phone)}`)}
    ${row(esc(order.delivery.label), esc(where))}
    ${row("Receipt", receipt)}
    ${order.note ? row("Note", `<i>${esc(order.note)}</i>`) : ""}
  </table></td></tr>
  <tr><td style="padding:28px 32px 36px">
    <a href="${admin}" style="display:inline-block;background:#161412;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:.22em;text-transform:uppercase;padding:16px 28px">Open the order</a>
  </td></tr>
</table></td></tr></table></body></html>`;
  return sendEmail({
    to: settings.notifications.ownerEmail,
    subject: `New order ${order.number} · ${formatNaira(order.total)} · check payment`,
    html,
    text: `New order ${order.number} from ${order.customer.name}: ${formatNaira(order.total)} by bank transfer.\n\n${lines.join("\n")}\n\n${receipt}\n\nOpen: ${admin}`,
    replyTo: order.customer.email,
  });
}
