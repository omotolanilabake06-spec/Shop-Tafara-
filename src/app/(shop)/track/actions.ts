"use server";

import { redirect } from "next/navigation";
import { formatNaira } from "@/lib/format";
import { trackingPath } from "@/lib/orders/messages";
import { statusLabel } from "@/lib/orders/progress";
import { findOrdersByContact } from "@/lib/orders/store";
import { formatDay, lagosDate } from "@/lib/working-days";

export type FoundOrder = { number: string; placed: string; status: string; total: string; pieces: string; href: string };
export type LookupState = { error?: string; email?: string; phone?: string; orders?: FoundOrder[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function lookupOrder(_: LookupState, form: FormData): Promise<LookupState> {
  const email = String(form.get("email") ?? "").trim().slice(0, 254);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 30);
  if (!EMAIL.test(email) || phone.replace(/\D/g, "").length < 7) {
    return { error: "Please enter the email address and phone number you used when you ordered.", email, phone };
  }

  const orders = await findOrdersByContact(email, phone);
  // One message for every miss, so the form can't be used to find out who has ordered.
  if (orders.length === 0) {
    return {
      error: "We couldn't find an order with those details. Please check they match what you entered at checkout, or message us and we will help.",
      email,
      phone,
    };
  }
  if (orders.length === 1) redirect(trackingPath(orders[0]));
  return {
    email,
    phone,
    orders: orders.map((o) => ({
      number: o.number,
      placed: formatDay(lagosDate(o.placedAt)),
      status: statusLabel(o, o.status),
      total: formatNaira(o.total),
      pieces: o.items.map((i) => (i.qty > 1 ? `${i.qty} × ${i.name}` : i.name)).join(", "),
      href: trackingPath(o),
    })),
  };
}
