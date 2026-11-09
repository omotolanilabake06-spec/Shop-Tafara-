// Sample orders for designing the tracking page and admin before the database is connected (Phase 2).
// Dates are worked out from today so each order sits at a believable point in its journey.
import { addWorkingDays, lagosDate, subtractWorkingDays } from "@/lib/working-days";
import { PRODUCTION_DAYS, madeToOrder } from "./progress";
import type { Order, OrderItem, OrderStatus } from "./types";

type Draft = {
  number: string;
  accessKey: string;
  /** Working days ago the order was paid. */
  placedDaysAgo: number;
  status: OrderStatus;
  customer: Order["customer"];
  delivery: Order["delivery"];
  items: OrderItem[];
  note?: string;
  channel: Order["payment"]["channel"];
  dispatch?: Order["dispatch"];
};

const LEKKI: Order["delivery"] = {
  method: "lagos",
  label: "Lagos delivery",
  address: ["14 Admiralty Way", "Lekki Phase 1", "Lagos"],
  fee: 5000,
};

const DRAFTS: Draft[] = [
  {
    number: "TAF-10483",
    accessKey: "q3Lr8VwZ",
    placedDaysAgo: 0,
    status: "confirmed",
    customer: { name: "Zainab Bello", email: "zainab@example.com", phone: "+234 803 000 1483" },
    delivery: { method: "nationwide", label: "Nationwide delivery", address: ["7 Aminu Kano Crescent", "Wuse 2", "Abuja"], fee: 9000 },
    items: [
      { slug: "echo", name: "Echo", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/76c64b85-0492-4ad2-a5c2-edf3bd36d79d.jpg", kind: "clothing", options: [{ label: "Colour", value: "Lilac" }, { label: "Size", value: "UK 12" }], qty: 1, unitPrice: 65000 },
    ],
    note: "It's for my sister's wedding on the 14th. Could the hem sit just above the ankle?",
    channel: "bank_transfer",
  },
  {
    number: "TAF-10482",
    accessKey: "k7Qd2pX9",
    placedDaysAgo: 2,
    status: "in_production",
    customer: { name: "Adaeze Okafor", email: "adaeze@example.com", phone: "+234 802 000 1482" },
    delivery: LEKKI,
    items: [
      { slug: "echo", name: "Echo", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/ef82222f-4a89-49c2-919a-15a1db27793d.jpg", kind: "clothing", options: [{ label: "Colour", value: "Ivory" }, { label: "Size", value: "UK 10" }], qty: 1, unitPrice: 65000 },
    ],
    channel: "card",
  },
  {
    number: "TAF-10481",
    accessKey: "Hn4sT6yB",
    placedDaysAgo: 4,
    status: "in_production",
    customer: { name: "Tolu Bankole", email: "tolu@example.com", phone: "+234 809 000 1481" },
    delivery: { method: "lagos", label: "Lagos delivery", address: ["3 Glover Road", "Ikoyi", "Lagos"], fee: 5000 },
    items: [
      { slug: "clover-set", name: "Clover Set", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/15a25907-2cb9-489f-a3a6-d3d67bf91381.jpg", kind: "clothing", options: [{ label: "Colour", value: "Orange" }, { label: "Size", value: "UK 8" }], qty: 1, unitPrice: 57500 },
      { slug: "arabi-set", name: "Àràbì Set", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/7d967832-2dda-42f2-bcde-7fe2100efd95.jpg", kind: "clothing", options: [{ label: "Colour", value: "Navy Blue" }, { label: "Size", value: "UK 8" }], qty: 1, unitPrice: 55000 },
    ],
    channel: "card",
  },
  {
    number: "TAF-10479",
    accessKey: "Wc9mE2aR",
    placedDaysAgo: 6,
    status: "ready",
    customer: { name: "Kemi Adeyemi", email: "kemi@example.com", phone: "+234 806 000 1479" },
    delivery: { method: "pickup", label: "Studio pickup", address: [], fee: 0 },
    items: [
      { slug: "arabi-set", name: "Àràbì Set", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/a9e89834-acb1-41ef-8f10-48d25f4adec6.jpg", kind: "clothing", options: [{ label: "Colour", value: "Ivory" }, { label: "Size", value: "UK 10" }], qty: 1, unitPrice: 55000 },
    ],
    channel: "ussd",
  },
  {
    number: "TAF-10477",
    accessKey: "Pz5uJ8nD",
    placedDaysAgo: 8,
    status: "dispatched",
    customer: { name: "Ngozi Eze", email: "ngozi@example.com", phone: "+234 807 000 1477" },
    delivery: { method: "nationwide", label: "Nationwide delivery", address: ["22 Aba Road", "Port Harcourt", "Rivers"], fee: 9000 },
    items: [
      { slug: "echo", name: "Echo", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/76c64b85-0492-4ad2-a5c2-edf3bd36d79d.jpg", kind: "clothing", options: [{ label: "Colour", value: "Olive" }, { label: "Size", value: "UK 14" }], qty: 1, unitPrice: 65000 },
      { slug: "clover-set", name: "Clover Set", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/c81f9f8c-4ff5-46c4-81c9-8c7ae968bcbb.jpg", kind: "clothing", options: [{ label: "Colour", value: "Pink" }, { label: "Size", value: "UK 14" }], qty: 1, unitPrice: 57500 },
    ],
    channel: "card",
    dispatch: { courier: "GIG Logistics", trackingNumber: "GIG-4821-7730" },
  },
  {
    number: "TAF-10474",
    accessKey: "Rb1xF7gK",
    placedDaysAgo: 9,
    status: "in_production",
    customer: { name: "Funmi Lawal", email: "funmi@example.com", phone: "+234 805 000 1474" },
    delivery: LEKKI,
    items: [
      { slug: "clover-set", name: "Clover Set", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/c81f9f8c-4ff5-46c4-81c9-8c7ae968bcbb.jpg", kind: "clothing", options: [{ label: "Colour", value: "Pink" }, { label: "Size", value: "UK 16" }], qty: 1, unitPrice: 57500 },
    ],
    channel: "card",
  },
  {
    number: "TAF-10470",
    accessKey: "Ty6vN3cM",
    placedDaysAgo: 14,
    status: "delivered",
    customer: { name: "Amara Nwosu", email: "amara@example.com", phone: "+234 808 000 1470" },
    delivery: { method: "lagos", label: "Lagos delivery", address: ["9 Isaac John Street", "Ikeja GRA", "Lagos"], fee: 5000 },
    items: [
      { slug: "echo", name: "Echo", image: "https://skddmwadliizehdpwtot.supabase.co/storage/v1/object/public/media/products/76c64b85-0492-4ad2-a5c2-edf3bd36d79d.jpg", kind: "clothing", options: [{ label: "Colour", value: "Red" }, { label: "Size", value: "UK 8" }], qty: 1, unitPrice: 65000 },
    ],
    channel: "bank_transfer",
    dispatch: { courier: "Studio rider" },
  },
];

const FLOW: OrderStatus[] = ["confirmed", "in_production", "ready", "dispatched", "delivered"];

/** Lagos time on a given day, as an ISO instant. */
const at = (day: string, hour: number) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00+01:00`).toISOString();

export function buildSampleOrders(now = new Date()): Order[] {
  const today = lagosDate(now);
  return DRAFTS.map((d) => {
    const placedDay = subtractWorkingDays(today, d.placedDaysAgo);
    const placedAt = d.placedDaysAgo === 0 ? new Date(now.getTime() - 40 * 60_000).toISOString() : at(placedDay, 11);
    const days = madeToOrder(d) ? PRODUCTION_DAYS.madeToOrder : PRODUCTION_DAYS.readyMade;
    const readyWindow = { from: addWorkingDays(placedDay, days.min), to: addWorkingDays(placedDay, days.max) };

    // Replay the journey up to the current status, roughly a working day per step.
    const reached = FLOW.slice(0, FLOW.indexOf(d.status) + 1).filter(
      (s) => !(d.delivery.method === "pickup" && s === "dispatched"),
    );
    const history = reached.map((status, i) => {
      if (i === 0) return { status, at: placedAt };
      const offsets: Partial<Record<OrderStatus, number>> = { in_production: 1, ready: 6, dispatched: 7, delivered: 8 };
      return { status, at: at(addWorkingDays(placedDay, offsets[status] ?? i), 10 + i) };
    });
    const subtotal = d.items.reduce((n, i) => n + i.qty * i.unitPrice, 0);

    return {
      number: d.number,
      accessKey: d.accessKey,
      placedAt,
      customer: d.customer,
      delivery: d.delivery,
      items: d.items,
      subtotal,
      total: subtotal + d.delivery.fee,
      note: d.note,
      payment: { provider: "paystack", reference: `T${d.number.slice(4)}${d.accessKey.slice(0, 4).toUpperCase()}`, channel: d.channel, paidAt: placedAt },
      status: d.status,
      history,
      readyWindow,
      dispatch: d.dispatch,
      messages: history.flatMap((e) => [
        { channel: "email" as const, to: d.customer.email, about: e.status, at: e.at },
        { channel: "sms" as const, to: d.customer.phone, about: e.status, at: e.at },
      ]),
    };
  });
}
