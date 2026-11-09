// Replaces all orders and payments with the sample ones. The catalogue (products, categories,
// collections) and settings are never touched, so the client's real products are safe.
// Never run once real orders exist.
import { orderRows } from "@/lib/orders/store";
import { toEventRows, toPaymentRow } from "./payments";
import { buildSeed } from "./seed";
import { db, must } from "./supabase";

// Children first, so foreign keys never block a delete. `neq` on the key matches every row.
const WIPE = [
  ["payment_events", "id", 0],
  ["payments", "reference", ""],
  ["order_notes", "id", 0],
  ["order_messages", "id", 0],
  ["order_events", "id", 0],
  ["order_items", "id", 0],
  ["orders", "number", ""],
] as const;

export async function resetToSeed() {
  const seed = buildSeed();
  for (const [table, key, none] of WIPE) must(await db().from(table).delete().neq(key, none), `clearing ${table}`);

  const rows = seed.orders.map(orderRows);
  must(await db().from("orders").insert(rows.map((r) => r.order)), "adding orders");
  must(await db().from("order_items").insert(rows.flatMap((r) => r.items)), "adding order items");
  must(await db().from("order_events").insert(rows.flatMap((r) => r.events)), "adding order history");
  must(await db().from("order_messages").insert(rows.flatMap((r) => r.messages)), "adding sent messages");
  const notes = rows.flatMap((r) => r.notes);
  if (notes.length) must(await db().from("order_notes").insert(notes), "adding studio notes");
  must(await db().from("payments").insert(seed.payments.map(toPaymentRow)), "adding payments");
  must(await db().from("payment_events").insert(seed.payments.flatMap((p) => toEventRows(p.reference, p.events))), "adding payment history");
}
