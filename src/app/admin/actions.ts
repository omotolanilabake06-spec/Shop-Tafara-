"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { SESSION_COOKIE, SESSION_DAYS, adminConfigured, createSession, passwordMatches } from "@/lib/admin/session";
import { paymentsForOrder, recordRefund } from "@/lib/db/payments";
import { advanceOrder, addStaffNote, cancelOrder } from "@/lib/orders/store";
import type { OrderStatus } from "@/lib/orders/types";

export type LoginState = { error?: string };
export type FormState = { error?: string; ok?: string };

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "The admin password has not been set up yet (ADMIN_PASSWORD)." };
  if (!passwordMatches(String(form.get("password") ?? ""))) return { error: "That password isn't right." };

  (await cookies()).set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DAYS * 86_400,
  });
  const next = String(form.get("next") ?? "");
  // Only ever return to an admin page, never to an outside address.
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function signOut() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function moveOrder(form: FormData) {
  await requireAdmin();
  const to = String(form.get("to")) as OrderStatus;
  const courier = String(form.get("courier") ?? "").trim();
  const trackingNumber = String(form.get("trackingNumber") ?? "").trim();
  await advanceOrder(String(form.get("number")), to, {
    notify: form.get("notify") === "on",
    dispatch: to === "dispatched" ? { courier: courier || "Studio rider", trackingNumber: trackingNumber || undefined } : undefined,
  });
  refresh();
}

export async function cancelOrderAction(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const number = String(form.get("number"));
  const reason = String(form.get("reason") ?? "").trim();
  if (form.get("confirm") !== "on") return { error: "Tick the box to confirm you want to cancel this order." };

  const order = await cancelOrder(number, reason);
  if (!order) return { error: "This order can no longer be cancelled." };

  if (form.get("refund") === "on") {
    const paid = (await paymentsForOrder(number)).find((p) => p.status === "success" || p.status === "partially_refunded");
    if (paid) {
      const result = await recordRefund(paid.reference, paid.amount - paid.refunded, reason || "Order cancelled", admin.name);
      if ("error" in result) return { error: `Order cancelled, but the refund failed: ${result.error}` };
    }
  }
  refresh();
  return { ok: "Order cancelled." };
}

export async function addOrderNote(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const text = String(form.get("text") ?? "").trim();
  if (!text) return { error: "Write a note first." };
  await addStaffNote(String(form.get("number")), text.slice(0, 2000));
  refresh();
  return { ok: "Note added." };
}
