// Sample orders and their payments, for showing the admin and order tracking before real orders
// arrive. Loaded by `pnpm db:seed` and "Reset demo data" in Settings (only shown while DEMO_DATA=on).
// They never touch the catalogue: products, categories, collections and settings are left alone.
import { buildSampleOrders } from "@/lib/orders/sample-orders";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";
import { paystackFee } from "@/lib/payments/fees";
import type { Settings } from "@/lib/types";

export type SeedData = { orders: Order[]; payments: Payment[] };

export const DEFAULT_SETTINGS: Settings = {
  store: {
    email: "hello@shoptafara.com",
    phone: "+234 800 000 0000",
    whatsapp: "+234 800 000 0000",
    instagram: "shoptafara",
    address: "Lagos, Nigeria",
  },
  announcement: { enabled: true, text: "Made to order in Lagos", detail: "Ready to ship in 5–7 working days" },
  production: { madeToOrderMin: 5, madeToOrderMax: 7, readyMadeMin: 1, readyMadeMax: 2 },
  delivery: [
    { id: "lagos", name: "Lagos delivery", description: "Delivered by our rider, 1–2 working days after dispatch.", fee: 5000, active: true },
    { id: "nationwide", name: "Nationwide delivery", description: "Door to door with GIG Logistics, 2–4 working days.", fee: 9000, active: true },
    { id: "international", name: "International (DHL Express)", description: "3–6 working days after dispatch. Duties may apply.", fee: 45000, active: true },
    { id: "pickup", name: "Studio pickup", description: "Collect from our Lagos studio once your piece is ready.", fee: 0, active: true, pickup: true },
  ],
  notifications: { ownerEmail: "hello@shoptafara.com", sms: true },
};

const METHOD: Record<Order["payment"]["channel"], string[]> = {
  card: ["Visa •••• 4081", "Mastercard •••• 2210", "Verve •••• 7719"],
  bank_transfer: ["Bank transfer · GTBank", "Bank transfer · Access"],
  ussd: ["USSD · *737#"],
};

const minus = (iso: string, minutes: number) => new Date(new Date(iso).getTime() - minutes * 60_000).toISOString();

function paymentsFor(orders: Order[]): Payment[] {
  const payments: Payment[] = orders.map((o, i) => ({
    reference: o.payment.reference,
    orderNumber: o.number,
    customer: { name: o.customer.name, email: o.customer.email },
    amount: o.total,
    fees: paystackFee(o.total),
    refunded: 0,
    channel: o.payment.channel,
    method: METHOD[o.payment.channel][i % METHOD[o.payment.channel].length],
    status: "success",
    gatewayResponse: "Approved",
    createdAt: minus(o.placedAt, 4),
    paidAt: o.placedAt,
    events: [
      { at: minus(o.placedAt, 4), type: "initialized", message: "Checkout started on Paystack" },
      { at: o.placedAt, type: "success", message: `Payment approved. Order ${o.number} created.` },
    ],
  }));

  // A declined card before a successful bank transfer, and a checkout that was never finished.
  const zainab = orders.find((o) => o.number === "TAF-10483");
  if (zainab) {
    payments.push({
      reference: "T10483DECL",
      customer: { name: zainab.customer.name, email: zainab.customer.email },
      amount: zainab.total,
      fees: 0,
      refunded: 0,
      channel: "card",
      method: "Mastercard •••• 5532",
      status: "failed",
      gatewayResponse: "Declined by bank",
      createdAt: minus(zainab.placedAt, 12),
      events: [
        { at: minus(zainab.placedAt, 12), type: "initialized", message: "Checkout started on Paystack" },
        { at: minus(zainab.placedAt, 11), type: "failed", message: "Card declined by the issuing bank" },
      ],
    });
  }
  const tolu = orders.find((o) => o.number === "TAF-10481");
  if (tolu) {
    payments.push({
      reference: "T20991ABND",
      customer: { name: "Chioma Obi", email: "chioma@example.com" },
      amount: 70000,
      fees: 0,
      refunded: 0,
      channel: "card",
      method: "Card",
      status: "abandoned",
      createdAt: minus(tolu.placedAt, 300),
      events: [
        { at: minus(tolu.placedAt, 300), type: "initialized", message: "Checkout started on Paystack" },
        { at: minus(tolu.placedAt, 270), type: "abandoned", message: "Customer closed the payment window" },
      ],
    });
  }

  // A partial refund on a delivered order.
  const amara = payments.find((p) => p.orderNumber === "TAF-10470");
  if (amara) {
    amara.status = "partially_refunded";
    amara.refunded = 5000;
    amara.events.push({
      at: new Date(new Date(amara.paidAt!).getTime() + 10 * 86_400_000).toISOString(),
      type: "refund",
      message: "Refunded ₦5,000: delivery fee returned, rider arrived a day late",
      by: "Studio",
    });
  }
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildSeed(): SeedData {
  const orders = buildSampleOrders();
  return { orders, payments: paymentsFor(orders) };
}
