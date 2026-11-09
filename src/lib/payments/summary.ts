import type { Payment } from "./types";

export const PERIODS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "all", label: "All time", days: Infinity },
] as const;

export function inPeriod(p: Payment, days: number, now = Date.now()) {
  return days === Infinity || now - new Date(p.paidAt ?? p.createdAt).getTime() <= days * 86_400_000;
}

const settled = (p: Payment) => p.status === "success" || p.status === "partially_refunded" || p.status === "refunded";

/** Money in, refunds out, Paystack fees and what lands in the bank. */
export function summarise(payments: Payment[]) {
  const paid = payments.filter(settled);
  const gross = paid.reduce((n, p) => n + p.amount, 0);
  const refunded = paid.reduce((n, p) => n + p.refunded, 0);
  const fees = paid.reduce((n, p) => n + p.fees, 0);
  return {
    count: paid.length,
    gross,
    refunded,
    fees,
    net: gross - refunded - fees,
    failed: payments.filter((p) => p.status === "failed").length,
    abandoned: payments.filter((p) => p.status === "abandoned").length,
    average: paid.length ? Math.round(gross / paid.length) : 0,
  };
}
