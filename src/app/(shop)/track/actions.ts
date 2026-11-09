"use server";

import { redirect } from "next/navigation";
import { trackingPath } from "@/lib/orders/messages";
import { findOrderForCustomer } from "@/lib/orders/store";

export type LookupState = { error?: string; number?: string; email?: string };

export async function lookupOrder(_: LookupState, form: FormData): Promise<LookupState> {
  const number = String(form.get("number") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  if (!number || !email) return { error: "Please enter your order number and email address.", number, email };

  const order = await findOrderForCustomer(number, email);
  // One message for every miss, so the form can't be used to discover order numbers.
  if (!order) {
    return {
      error: "We couldn't find an order with those details. Your order number is in your confirmation email.",
      number,
      email,
    };
  }
  redirect(trackingPath(order));
}
