/** pending_payment: placed and paid by bank transfer, waiting for the studio to see the money arrive. */
export type OrderStatus = "pending_payment" | "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled";

export type OrderItem = {
  slug: string;
  name: string;
  image: string;
  kind: "clothing" | "home";
  /** Colour and size for clothing; scent and size for TAFARA HOME. */
  options: { label: string; value: string }[];
  qty: number;
  /** Naira, as charged at checkout. */
  unitPrice: number;
};

export type StatusEvent = { status: OrderStatus; at: string; note?: string };

export type SentMessage = {
  channel: "email" | "sms";
  to: string;
  /** Which update this was, e.g. "ready". */
  about: OrderStatus;
  at: string;
  /** "logged" while no provider is connected; "failed" keeps the error for the activity log. */
  result?: "sent" | "logged" | "failed";
  error?: string;
};

export type Order = {
  /** Customer-facing number, e.g. "TAF-10482". */
  number: string;
  /** Random secret in the tracking link, so an order number alone reveals nothing. */
  accessKey: string;
  placedAt: string;
  customer: { name: string; email: string; phone: string };
  delivery: {
    method: "lagos" | "nationwide" | "international" | "pickup";
    label: string;
    /** Address lines; empty for studio pickup. */
    address: string[];
    fee: number;
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
  note?: string;
  payment: {
    provider: "paystack" | "bank_transfer";
    reference: string;
    channel: "card" | "bank_transfer" | "ussd";
    /** Set when the payment is confirmed. */
    paidAt?: string;
    /** Bank transfers: the account the customer was shown, e.g. "Access Bank · 1897801255". */
    account?: string;
    /** Bank transfers: path of the uploaded receipt in the private "receipts" bucket. */
    receipt?: string;
  };
  status: OrderStatus;
  history: StatusEvent[];
  /**
   * The ready-to-ship promise, fixed when the payment is confirmed so later changes to
   * production times never move an existing customer's date.
   */
  readyWindow: { from: string; to: string };
  dispatch?: { courier: string; trackingNumber?: string };
  messages: SentMessage[];
  /** Private notes for the studio, never shown to the customer. */
  staffNotes?: { at: string; text: string }[];
  cancelReason?: string;
};
