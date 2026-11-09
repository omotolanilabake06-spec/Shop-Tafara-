"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { addPaymentNote, recordRefund } from "@/lib/db/payments";

export type PaymentFormState = { error?: string; ok?: string };

export async function refundAction(_: PaymentFormState, form: FormData): Promise<PaymentFormState> {
  const admin = await requireAdmin();
  const amount = Number(String(form.get("amount") ?? "").replace(/[₦,\s]/g, ""));
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return { error: "Add a reason. It is kept with the payment for your records." };
  const result = await recordRefund(String(form.get("reference")), amount, reason, admin.name);
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: "Refund recorded." };
}

export async function paymentNoteAction(_: PaymentFormState, form: FormData): Promise<PaymentFormState> {
  const admin = await requireAdmin();
  const text = String(form.get("text") ?? "").trim();
  if (!text) return { error: "Write a note first." };
  await addPaymentNote(String(form.get("reference")), text.slice(0, 2000), admin.name);
  refresh();
  return { ok: "Note added." };
}
