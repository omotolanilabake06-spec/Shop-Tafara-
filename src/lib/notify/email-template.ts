// Branded HTML email. Table layout and inline styles, because that is what email clients render reliably.
import { formatNaira } from "@/lib/format";
import type { CustomerMessage } from "@/lib/orders/messages";
import type { Order } from "@/lib/orders/types";
import type { Settings } from "@/lib/types";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export function orderEmailHtml({ order, message, link, settings, origin }: { order: Order; message: CustomerMessage; link: string; settings: Settings; origin: string }) {
  const items = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e4ded6;width:64px;vertical-align:top">
          <img src="${origin}${esc(i.image)}" width="56" height="84" alt="" style="display:block;object-fit:cover;background:#f5f2ed">
        </td>
        <td style="padding:14px 0 14px 16px;border-bottom:1px solid #e4ded6;vertical-align:top;font:14px/1.5 ${SANS};color:#161412">
          <div style="letter-spacing:.12em;text-transform:uppercase;font-size:12px">${esc(i.name)}</div>
          <div style="color:#6f675f;font-size:13px">${i.options.map((o) => esc(o.value)).join(" · ")}${i.qty > 1 ? ` · Qty ${i.qty}` : ""}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e4ded6;text-align:right;vertical-align:top;font:14px ${SANS};color:#161412">${formatNaira(i.unitPrice * i.qty)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(message.subject)}</title></head>
<body style="margin:0;background:#f5f2ed">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
        <tr><td align="center" style="padding:36px 32px 8px">
          <img src="${origin}/brand/logo-dark.png" width="120" alt="Shop Tafara" style="display:block">
        </td></tr>
        <tr><td align="center" style="padding:24px 32px 0;font:400 34px/1.15 ${SERIF};color:#161412">${esc(message.heading)}</td></tr>
        <tr><td align="center" style="padding:16px 40px 0;font:15px/1.7 ${SANS};color:#4d4741">${esc(message.body)}</td></tr>
        <tr><td align="center" style="padding:28px 32px 8px">
          <a href="${esc(link)}" style="display:inline-block;background:#161412;color:#ffffff;text-decoration:none;font:12px ${SANS};letter-spacing:.22em;text-transform:uppercase;padding:16px 32px">Track your order</a>
        </td></tr>
        <tr><td style="padding:28px 32px 0">
          <div style="font:12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#6f675f;padding-bottom:4px">Order ${esc(order.number)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}
            <tr><td colspan="2" style="padding:14px 0 0;font:14px ${SANS};color:#6f675f">${esc(order.delivery.label)}</td>
                <td style="padding:14px 0 0;text-align:right;font:14px ${SANS};color:#161412">${order.delivery.fee ? formatNaira(order.delivery.fee) : "Free"}</td></tr>
            <tr><td colspan="2" style="padding:8px 0 0;font:13px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#161412">Total</td>
                <td style="padding:8px 0 0;text-align:right;font:15px ${SANS};color:#161412">${formatNaira(order.total)}</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:36px 32px 36px;font:13px/1.7 ${SANS};color:#6f675f">
          Questions? Reply to this email or write to <a href="mailto:${esc(settings.store.email)}" style="color:#161412">${esc(settings.store.email)}</a>.
        </td></tr>
      </table>
      <p style="font:12px ${SANS};color:#6f675f;letter-spacing:.14em;text-transform:uppercase;margin:20px 0 0">Shop Tafara · Made to order in Lagos</p>
    </td></tr>
  </table>
</body></html>`;
}
