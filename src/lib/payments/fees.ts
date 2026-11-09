/**
 * Paystack's local transaction fee: 1.5% + ₦100, with the ₦100 waived under ₦2,500, capped at ₦2,000.
 * Used for estimates only; the real fee comes back on each verified transaction.
 */
export function paystackFee(amount: number) {
  const fee = amount * 0.015 + (amount >= 2500 ? 100 : 0);
  return Math.min(Math.round(fee), 2000);
}
