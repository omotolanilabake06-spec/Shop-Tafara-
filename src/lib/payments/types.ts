export type PaymentStatus = "success" | "failed" | "abandoned" | "refunded" | "partially_refunded";

export type PaymentEvent = {
  at: string;
  type: "initialized" | "success" | "failed" | "abandoned" | "refund" | "note";
  message: string;
  /** Who did it, for admin actions. Gateway events have no actor. */
  by?: string;
};

/** One Paystack transaction. Phase 3 creates these from Paystack's verified webhook. */
export type Payment = {
  reference: string;
  /** Set once the payment succeeded and an order was created from it. */
  orderNumber?: string;
  customer: { name: string; email: string };
  /** Naira. */
  amount: number;
  /** Paystack's fee, deducted before settlement. */
  fees: number;
  refunded: number;
  channel: "card" | "bank_transfer" | "ussd";
  /** e.g. "Visa •••• 4081" or "GTBank transfer". */
  method: string;
  status: PaymentStatus;
  /** Paystack's own wording for failures, e.g. "Declined by bank". */
  gatewayResponse?: string;
  createdAt: string;
  paidAt?: string;
  events: PaymentEvent[];
};
