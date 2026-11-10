// Order reads and writes in Supabase. Pages, the admin and the tracking page only call these functions.
import { connection } from "next/server";
import { recordPayment } from "@/lib/db/payments";
import { fetchProducts, takeStock } from "@/lib/db/products";
import { fetchSettings } from "@/lib/db/settings";
import { db, must } from "@/lib/db/supabase";
import type { Settings } from "@/lib/types";
import { addWorkingDays, lagosDate } from "@/lib/working-days";
import { notifyCustomer } from "./notify";
import { madeToOrder, nextStatus } from "./progress";
import type { Order, OrderItem, OrderStatus, SentMessage, StatusEvent } from "./types";

/** True while orders are sample data. The tracking page lists demo links while it is. */
export const USING_SAMPLE_ORDERS = process.env.DEMO_DATA === "on";

const normalise = (number: string) =>
  number.trim().toUpperCase().replace(/^#/, "").replace(/^(TAF)?[\s-]*/, "TAF-");

// Rows as stored ---------------------------------------------------------------------------

type ItemRow = { id: number; slug: string; name: string; image: string; kind: OrderItem["kind"]; options: OrderItem["options"]; qty: number; unit_price: number };
type EventRow = { id: number; status: OrderStatus; at: string; note: string | null };
type MessageRow = { id: number; channel: SentMessage["channel"]; to: string; about: OrderStatus; at: string; result: SentMessage["result"] | null; error: string | null };
type NoteRow = { id: number; text: string; at: string };
type OrderRow = {
  number: string;
  access_key: string;
  placed_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery: Order["delivery"];
  subtotal: number;
  total: number;
  note: string | null;
  payment: Order["payment"];
  ready_from: string;
  ready_to: string;
  dispatch: Order["dispatch"] | null;
  cancel_reason: string | null;
  order_items?: ItemRow[];
  order_events?: EventRow[];
  order_messages?: MessageRow[];
  order_notes?: NoteRow[];
};

const COLUMNS = "*, order_items(*), order_events(*), order_messages(*), order_notes(*)";
const inOrder = <T extends { id: number }>(rows: T[] = []) => [...rows].sort((a, b) => a.id - b.id);

function toOrder(r: OrderRow): Order {
  const notes = inOrder(r.order_notes).map((n) => ({ at: n.at, text: n.text }));
  return {
    number: r.number,
    accessKey: r.access_key,
    placedAt: r.placed_at,
    customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone },
    delivery: r.delivery,
    items: inOrder(r.order_items).map((i) => ({
      slug: i.slug,
      name: i.name,
      image: i.image,
      kind: i.kind,
      options: i.options,
      qty: i.qty,
      unitPrice: i.unit_price,
    })),
    subtotal: r.subtotal,
    total: r.total,
    note: r.note ?? undefined,
    payment: r.payment,
    status: r.status,
    history: inOrder(r.order_events).map((e) => ({ status: e.status, at: e.at, note: e.note ?? undefined })),
    readyWindow: { from: r.ready_from, to: r.ready_to },
    dispatch: r.dispatch ?? undefined,
    messages: inOrder(r.order_messages).map((m) => ({
      channel: m.channel,
      to: m.to,
      about: m.about,
      at: m.at,
      result: m.result ?? undefined,
      error: m.error ?? undefined,
    })),
    staffNotes: notes.length ? notes : undefined,
    cancelReason: r.cancel_reason ?? undefined,
  };
}

/** Child rows for an order, ready to insert. Used here and by the seed. */
export const orderRows = (o: Order) => ({
  order: {
    number: o.number,
    access_key: o.accessKey,
    placed_at: o.placedAt,
    status: o.status,
    customer_name: o.customer.name,
    customer_email: o.customer.email,
    customer_phone: o.customer.phone,
    delivery: o.delivery,
    subtotal: o.subtotal,
    total: o.total,
    note: o.note ?? null,
    payment: o.payment,
    ready_from: o.readyWindow.from,
    ready_to: o.readyWindow.to,
    dispatch: o.dispatch ?? null,
    cancel_reason: o.cancelReason ?? null,
  },
  items: itemRows(o.number, o.items),
  events: eventRows(o.number, o.history),
  messages: messageRows(o.number, o.messages),
  notes: (o.staffNotes ?? []).map((n) => ({ order_number: o.number, text: n.text, at: n.at })),
});

const itemRows = (number: string, items: OrderItem[]) =>
  items.map((i) => ({
    order_number: number,
    slug: i.slug,
    name: i.name,
    image: i.image,
    kind: i.kind,
    options: i.options,
    qty: i.qty,
    unit_price: i.unitPrice,
  }));

const eventRows = (number: string, events: StatusEvent[]) =>
  events.map((e) => ({ order_number: number, status: e.status, at: e.at, note: e.note ?? null }));

const messageRows = (number: string, messages: SentMessage[]) =>
  messages.map((m) => ({ order_number: number, channel: m.channel, to: m.to, about: m.about, at: m.at, result: m.result ?? null, error: m.error ?? null }));

// Reads ------------------------------------------------------------------------------------

/** Newest first. */
export async function listOrders() {
  await connection();
  const rows = must<OrderRow[]>(await db().from("orders").select(COLUMNS).order("placed_at", { ascending: false }), "loading orders");
  return rows.map(toOrder);
}

export async function getOrder(number: string) {
  await connection();
  const row = must<OrderRow | null>(
    await db().from("orders").select(COLUMNS).eq("number", normalise(number)).maybeSingle(),
    "loading an order",
  );
  return row ? toOrder(row) : null;
}

/** Customer lookup on /track: both the order number and the email on the order must match. */
export async function findOrderForCustomer(number: string, email: string) {
  const order = await getOrder(number);
  return order && order.customer.email.toLowerCase() === email.trim().toLowerCase() ? order : null;
}

/** Customer view from the tracking link in their emails. */
export async function getOrderWithKey(number: string, key: string) {
  const order = await getOrder(number);
  return order && order.accessKey === key ? order : null;
}

// Writes -----------------------------------------------------------------------------------

/** Ready-to-ship dates counted from `day`, using the production times in Settings. */
export function readyWindow(items: Pick<OrderItem, "kind">[], production: Settings["production"], day = lagosDate()) {
  const days = madeToOrder({ items: items as OrderItem[] })
    ? { min: production.madeToOrderMin, max: production.madeToOrderMax }
    : { min: production.readyMadeMin, max: production.readyMadeMax };
  return { from: addWorkingDays(day, days.min), to: addWorkingDays(day, days.max) };
}

export type NewOrder = Pick<Order, "customer" | "delivery" | "items" | "note"> & { account: string; receipt?: string };

/**
 * Saves a checkout as an order waiting for its bank transfer to be confirmed. The order number and
 * tracking key come from the database. Prices must already be checked against the catalogue.
 */
export async function createOrder(input: NewOrder) {
  const settings = await fetchSettings();
  const subtotal = input.items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const window = readyWindow(input.items, settings.production);
  const created = must<{ number: string }>(
    await db()
      .from("orders")
      .insert({
        status: "pending_payment",
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        delivery: input.delivery,
        subtotal,
        total: subtotal + input.delivery.fee,
        note: input.note || null,
        payment: { provider: "bank_transfer", reference: "", channel: "bank_transfer", account: input.account, receipt: input.receipt },
        ready_from: window.from,
        ready_to: window.to,
      })
      .select("number")
      .single(),
    "saving an order",
  );
  const number = created.number;
  must(
    await db()
      .from("orders")
      .update({ payment: { provider: "bank_transfer", reference: number, channel: "bank_transfer", account: input.account, receipt: input.receipt } })
      .eq("number", number),
    "saving an order",
  );
  must(await db().from("order_items").insert(itemRows(number, input.items)), "saving order items");
  must(await db().from("order_events").insert(eventRows(number, [{ status: "pending_payment", at: new Date().toISOString() }])), "saving order history");

  const order = (await getOrder(number))!;
  const sent = await notifyCustomer(order, "pending_payment");
  if (sent.length) must(await db().from("order_messages").insert(messageRows(number, sent)), "saving sent messages");
  return order;
}

/**
 * The studio has seen the transfer arrive: the production promise starts today, the payment is
 * recorded for the Payments page and takings, and TAFARA HOME stock is taken.
 */
async function confirmPayment(order: Order) {
  const settings = await fetchSettings();
  const paidAt = new Date().toISOString();
  const payment = { ...order.payment, paidAt };
  const window = readyWindow(order.items, settings.production);
  /** Runs once the order has actually moved, so a double click can't record the money twice. */
  const record = async () => {
  await recordPayment({
    reference: order.number,
    orderNumber: order.number,
    customer: { name: order.customer.name, email: order.customer.email },
    amount: order.total,
    fees: 0,
    refunded: 0,
    channel: "bank_transfer",
    method: `Bank transfer · ${settings.bank.bankName}`,
    status: "success",
    createdAt: order.placedAt,
    paidAt,
    events: [{ at: paidAt, type: "success", message: "Transfer confirmed by the studio" }],
  });

  const home = order.items.filter((i) => i.kind === "home");
  if (home.length) {
    const products = await fetchProducts();
    const lines = home.flatMap((i) => {
      const p = products.find((x) => x.slug === i.slug);
      const scent = i.options.find((o) => o.label === "Scent")?.value;
      const size = i.options.find((o) => o.label === "Size")?.value;
      const v = p?.kind === "home" ? p.variants.find((x) => x.scent === scent && x.size === size) : undefined;
      return v ? [{ variantId: v.id, qty: i.qty }] : [];
    });
    await takeStock(lines);
  }
  };
  return { changes: { payment, readyWindow: window }, record };
}

/**
 * Moves an order one step along its journey and, unless told not to, tells the customer.
 * Only the next step is allowed, and the update only applies if the order is still where the
 * admin saw it, so a double click or a stale tab can't skip ahead.
 */
export async function advanceOrder(
  number: string,
  to: OrderStatus,
  { notify = true, dispatch }: { notify?: boolean; dispatch?: Order["dispatch"] } = {},
) {
  const order = await getOrder(number);
  if (!order || nextStatus(order) !== to) return null;

  const changes: Partial<OrderRow> = { status: to };
  if (to === "dispatched") changes.dispatch = dispatch ?? null;
  let paid: Awaited<ReturnType<typeof confirmPayment>> | undefined;
  if (order.status === "pending_payment") {
    paid = await confirmPayment(order);
    Object.assign(changes, { payment: paid.changes.payment, ready_from: paid.changes.readyWindow.from, ready_to: paid.changes.readyWindow.to });
  }
  const moved = must<{ number: string }[]>(
    await db().from("orders").update(changes).eq("number", order.number).eq("status", order.status).select("number"),
    "updating an order",
  );
  if (!moved.length) return null;
  await paid?.record();

  const event: StatusEvent = { status: to, at: new Date().toISOString() };
  must(await db().from("order_events").insert(eventRows(order.number, [event])), "saving order history");
  const updated: Order = {
    ...order,
    ...paid?.changes,
    status: to,
    dispatch: to === "dispatched" ? dispatch : order.dispatch,
    history: [...order.history, event],
  };
  if (!notify) return updated;

  const sent = await notifyCustomer(updated, to);
  if (sent.length) must(await db().from("order_messages").insert(messageRows(order.number, sent)), "saving sent messages");
  return { ...updated, messages: [...updated.messages, ...sent] };
}

export async function cancelOrder(number: string, reason: string) {
  const n = normalise(number);
  const moved = must<{ number: string }[]>(
    await db()
      .from("orders")
      .update({ status: "cancelled", cancel_reason: reason || null })
      .eq("number", n)
      .not("status", "in", "(delivered,cancelled)")
      .select("number"),
    "cancelling an order",
  );
  if (!moved.length) return null;
  must(
    await db().from("order_events").insert(eventRows(n, [{ status: "cancelled", at: new Date().toISOString(), note: reason || undefined }])),
    "saving order history",
  );
  return getOrder(n);
}

export async function addStaffNote(number: string, text: string) {
  must(await db().from("order_notes").insert({ order_number: normalise(number), text, author: "Studio" }), "saving a note");
}

export type Customer = {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
  firstOrder: string;
  lastOrder: string;
  lastOrderNumber: string;
  city: string;
};

/** Customers are everyone who has ordered, grouped by email. Guest checkout needs no accounts. */
export async function listCustomers(): Promise<Customer[]> {
  const orders = await listOrders();
  const byEmail = new Map<string, Customer>();
  for (const o of [...orders].reverse()) {
    const key = o.customer.email.toLowerCase();
    const prev = byEmail.get(key);
    const counted = o.status !== "cancelled";
    byEmail.set(key, {
      email: o.customer.email,
      name: o.customer.name,
      phone: o.customer.phone,
      orders: (prev?.orders ?? 0) + (counted ? 1 : 0),
      spent: (prev?.spent ?? 0) + (counted ? o.total : 0),
      firstOrder: prev?.firstOrder ?? o.placedAt,
      lastOrder: o.placedAt,
      lastOrderNumber: o.number,
      city: o.delivery.address.at(-1) ?? o.delivery.label,
    });
  }
  return [...byEmail.values()].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
}
