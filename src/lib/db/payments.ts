// Payments as recorded from Paystack. Phase 3's webhook calls recordPayment; the admin reads and refunds.
import { connection } from "next/server";
import type { Payment, PaymentEvent } from "@/lib/payments/types";
import { db, must } from "./supabase";

type EventRow = { id: number; reference: string; type: PaymentEvent["type"]; message: string; by: string | null; at: string };
type PaymentRow = {
  reference: string;
  order_number: string | null;
  customer_name: string;
  customer_email: string;
  amount: number;
  fees: number;
  refunded: number;
  channel: Payment["channel"];
  method: string;
  status: Payment["status"];
  gateway_response: string | null;
  created_at: string;
  paid_at: string | null;
  payment_events?: EventRow[];
};

const COLUMNS = "*, payment_events(*)";

const toPayment = (r: PaymentRow): Payment => ({
  reference: r.reference,
  orderNumber: r.order_number ?? undefined,
  customer: { name: r.customer_name, email: r.customer_email },
  amount: r.amount,
  fees: r.fees,
  refunded: r.refunded,
  channel: r.channel,
  method: r.method,
  status: r.status,
  gatewayResponse: r.gateway_response ?? undefined,
  createdAt: r.created_at,
  paidAt: r.paid_at ?? undefined,
  events: [...(r.payment_events ?? [])]
    .sort((a, b) => a.at.localeCompare(b.at) || a.id - b.id)
    .map((e) => ({ at: e.at, type: e.type, message: e.message, by: e.by ?? undefined })),
});

export const toPaymentRow = (p: Payment): Omit<PaymentRow, "payment_events"> => ({
  reference: p.reference,
  order_number: p.orderNumber ?? null,
  customer_name: p.customer.name,
  customer_email: p.customer.email,
  amount: p.amount,
  fees: p.fees,
  refunded: p.refunded,
  channel: p.channel,
  method: p.method,
  status: p.status,
  gateway_response: p.gatewayResponse ?? null,
  created_at: p.createdAt,
  paid_at: p.paidAt ?? null,
});

export const toEventRows = (reference: string, events: PaymentEvent[]) =>
  events.map((e) => ({ reference, type: e.type, message: e.message, by: e.by ?? null, at: e.at }));

export async function listPayments() {
  await connection();
  const rows = must<PaymentRow[]>(
    await db().from("payments").select(COLUMNS).order("created_at", { ascending: false }),
    "loading payments",
  );
  return rows.map(toPayment);
}

export async function getPayment(reference: string) {
  await connection();
  const row = must<PaymentRow | null>(
    await db().from("payments").select(COLUMNS).eq("reference", reference).maybeSingle(),
    "loading a payment",
  );
  return row ? toPayment(row) : null;
}

export async function paymentsForOrder(orderNumber: string) {
  await connection();
  const rows = must<PaymentRow[]>(
    await db().from("payments").select(COLUMNS).eq("order_number", orderNumber).order("created_at"),
    "loading payments for an order",
  );
  return rows.map(toPayment);
}

/**
 * Inserts or updates a payment by reference and appends the events passed in. Paystack can send the
 * same webhook twice, so Phase 3 checks the stored status first and only passes events it hasn't seen.
 */
export async function recordPayment(payment: Payment) {
  must(await db().from("payments").upsert(toPaymentRow(payment)), "saving a payment");
  if (payment.events.length) must(await db().from("payment_events").insert(toEventRows(payment.reference, payment.events)), "saving payment history");
}

/**
 * Records a refund against a successful payment. Phase 3 sends it to Paystack's Refund API first
 * and only records it once Paystack accepts.
 */
export async function recordRefund(reference: string, amount: number, reason: string, by: string) {
  const p = must<PaymentRow | null>(
    await db().from("payments").select("amount, refunded, status").eq("reference", reference).maybeSingle(),
    "loading a payment",
  );
  if (!p) return { error: "Payment not found." };
  if (p.status !== "success" && p.status !== "partially_refunded") return { error: "Only successful payments can be refunded." };
  const left = p.amount - p.refunded;
  if (!(amount > 0) || amount > left) return { error: `Enter an amount between ₦1 and ₦${left.toLocaleString("en-NG")}.` };

  const refunded = p.refunded + amount;
  // Only applies if nobody else refunded in the meantime, so two tabs can't refund the same money twice.
  const changed = must<{ reference: string }[]>(
    await db()
      .from("payments")
      .update({ refunded, status: refunded >= p.amount ? "refunded" : "partially_refunded" })
      .eq("reference", reference)
      .eq("refunded", p.refunded)
      .select("reference"),
    "recording a refund",
  );
  if (!changed.length) return { error: "This payment changed while you were working on it. Reload the page and try again." };

  const event: PaymentEvent = {
    at: new Date().toISOString(),
    type: "refund",
    message: `Refunded ₦${amount.toLocaleString("en-NG")}${reason ? `: ${reason}` : ""}`,
    by,
  };
  must(await db().from("payment_events").insert(toEventRows(reference, [event])), "saving payment history");
  return { ok: true as const };
}

export async function addPaymentNote(reference: string, text: string, by: string) {
  must(
    await db().from("payment_events").insert(toEventRows(reference, [{ at: new Date().toISOString(), type: "note", message: text, by }])),
    "saving a note",
  );
}
