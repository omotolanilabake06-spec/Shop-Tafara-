"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { saveSettings } from "@/lib/db/settings";
import { resetToSeed } from "@/lib/db/reset";
import type { Settings } from "@/lib/types";

export type SettingsState = { error?: string; errors?: Record<string, string>; savedAt?: number };

const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveSettingsAction(_: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin();
  let s: Settings;
  try {
    s = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "Something went wrong reading the form." };
  }
  const errors: Record<string, string> = {};
  if (!email.test(s.store.email)) errors.storeEmail = "Enter a valid email address.";
  if (!email.test(s.notifications.ownerEmail)) errors.ownerEmail = "Enter a valid email address.";
  s.store.instagram = s.store.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");

  s.bank = { bankName: s.bank.bankName.trim(), accountName: s.bank.accountName.trim(), accountNumber: s.bank.accountNumber.replace(/\s/g, "") };
  if (!s.bank.bankName || !s.bank.accountName || !/^\d{10}$/.test(s.bank.accountNumber)) errors.bank = "Enter the bank, the account name and the 10-digit account number.";

  const p = s.production;
  for (const k of Object.keys(p) as (keyof typeof p)[]) {
    p[k] = Number(p[k]);
    if (!Number.isInteger(p[k]) || p[k] < 0 || p[k] > 60) errors.production = "Use whole numbers of working days.";
  }
  if (p.madeToOrderMin > p.madeToOrderMax || p.readyMadeMin > p.readyMadeMax) errors.production = "The first number can't be larger than the second.";

  s.delivery = s.delivery.map((z) => ({ ...z, name: z.name.trim(), description: z.description.trim(), fee: Number(String(z.fee).replace(/[₦,\s]/g, "")) }));
  s.delivery.forEach((z, i) => {
    if (!z.name) errors[`zone.${i}`] = "Give this delivery option a name.";
    else if (!Number.isInteger(z.fee) || z.fee < 0) errors[`zone.${i}`] = "Enter the fee in naira (0 for free).";
  });
  if (!s.delivery.some((z) => z.active)) errors.delivery = "Keep at least one delivery option switched on, or customers can't check out.";

  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted fields." };
  await saveSettings(s);
  updateTag("settings");
  return { savedAt: Date.now() };
}

export async function resetDemoAction() {
  await requireAdmin();
  if (process.env.DEMO_DATA !== "on") return;
  await resetToSeed();
  updateTag("catalog");
  updateTag("settings");
  refresh();
}
