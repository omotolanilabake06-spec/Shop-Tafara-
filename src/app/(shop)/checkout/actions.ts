"use server";

import { fetchProducts } from "@/lib/db/products";
import { receiptProblem, saveReceipt } from "@/lib/db/receipts";
import { fetchSettings } from "@/lib/db/settings";
import { formatNaira } from "@/lib/format";
import { trackingPath } from "@/lib/orders/messages";
import { notifyOwnerOfOrder } from "@/lib/orders/notify";
import { createOrder } from "@/lib/orders/store";
import type { Order, OrderItem } from "@/lib/orders/types";
import { COLOURS } from "@/lib/fabric";
import { zoneRegion } from "@/lib/types";

export type CheckoutState = {
  error?: string;
  errors?: Record<string, string>;
  /** Set once the order is saved: the page clears the bag and opens this tracking link. */
  placed?: string;
  /** The checked total, when it differs from the one the customer was shown. */
  total?: number;
};

type Line = { slug: string; qty: number; options: { label: string; value: string }[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

/**
 * "I have made payment": checks the bag against the live catalogue (the browser's prices are only for
 * display), saves the receipt if there is one, and creates the order for the studio to confirm.
 */
export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  // Bots fill every field; people never see this one.
  if (text(form, "company")) return { error: "Something went wrong. Please try again." };

  const settings = await fetchSettings();
  const errors: Record<string, string> = {};
  const name = text(form, "name", 120);
  const email = text(form, "email", 254).toLowerCase();
  const phone = text(form, "phone", 30);
  const note = text(form, "note", 1000);
  if (!name) errors.name = "Please enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address. We send your order updates here.";
  if (phone.replace(/\D/g, "").length < 7) errors.phone = "Please enter a phone number we can reach you on.";

  const zone = settings.delivery.find((z) => z.active && z.id === text(form, "delivery"));
  if (!zone) errors.delivery = "Please choose how you would like to receive your order.";
  const abroad = zone ? zoneRegion(zone) === "international" : false;
  const address = zone?.pickup
    ? []
    : [text(form, "address"), text(form, "city", 80), text(form, "state", 80), abroad ? text(form, "country", 80) : ""].filter(Boolean);
  if (zone && !zone.pickup) {
    if (!text(form, "address")) errors.address = "Please enter your street address.";
    if (!text(form, "city", 80)) errors.city = "Please enter your town or city.";
    if (!text(form, "state", 80)) errors.state = abroad ? "Please enter your region or postcode." : "Please enter your state.";
    if (abroad && !text(form, "country", 80)) errors.country = "Please enter your country.";
  }

  let lines: Line[] = [];
  try {
    lines = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {}
  if (!Array.isArray(lines) || lines.length === 0) return { error: "Your bag is empty. Add a piece before checking out." };

  const receipt = form.get("receipt");
  const hasReceipt = receipt instanceof File && receipt.size > 0;
  if (hasReceipt) {
    const problem = receiptProblem(receipt);
    if (problem) errors.receipt = problem;
  }
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted details." };

  // Price every line from the catalogue.
  const products = await fetchProducts();
  const items: OrderItem[] = [];
  for (const line of lines.slice(0, 30)) {
    const p = products.find((x) => x.slug === line.slug && x.status === "active");
    const qty = Math.floor(Number(line.qty));
    const option = (label: string) => line.options?.find((o) => o.label === label)?.value;
    if (!p || !(qty >= 1 && qty <= 20)) return { error: `${p?.name ?? "A piece in your bag"} is no longer available. Please remove it from your bag.` };
    if (p.kind === "clothing") {
      const colour = COLOURS.find((c) => c.name === option("Colour") && p.colours.includes(c.key));
      const size = option("Size");
      if (!colour || (p.sizes.length > 0 && !p.sizes.includes(size ?? ""))) {
        return { error: `The colour or size you chose for ${p.name} is no longer offered. Please remove it from your bag and add it again.` };
      }
      items.push({
        slug: p.slug,
        name: p.name,
        image: (p.images.find((i) => i.colour === colour.key) ?? p.images[0])?.src ?? "",
        kind: "clothing",
        options: [{ label: "Colour", value: colour.name }, ...(size && p.sizes.length ? [{ label: "Size", value: size }] : [])],
        qty,
        unitPrice: p.price,
      });
    } else {
      const v = p.variants.find((x) => x.scent === option("Scent") && x.size === option("Size"));
      if (!v || v.stock < qty) return { error: `${p.name}${v ? ` (${v.scent}, ${v.size})` : ""} doesn't have enough stock left. Please update your bag.` };
      items.push({
        slug: p.slug,
        name: p.name,
        image: p.images[0]?.src ?? "",
        kind: "home",
        options: [
          { label: "Scent", value: v.scent },
          { label: "Size", value: v.size },
        ],
        qty,
        unitPrice: v.price,
      });
    }
  }

  // The customer transferred the total they were shown. If a price changed since, stop and show the new one.
  const total = items.reduce((n, i) => n + i.unitPrice * i.qty, 0) + zone!.fee;
  if (total !== Number(form.get("shownTotal"))) {
    return {
      error: `A price has just been updated, so your total is now ${formatNaira(total)}. Please make sure you transfer this amount, then press the button again.`,
      total,
    };
  }

  const delivery: Order["delivery"] = {
    method: ({ lagos: "lagos", nigeria: "nationwide", international: "international", pickup: "pickup" } as const)[zoneRegion(zone!)],
    label: zone!.name,
    address,
    fee: zone!.fee,
  };

  try {
    const order = await createOrder({
      customer: { name, email, phone },
      delivery,
      items,
      note: note || undefined,
      account: `${settings.bank.bankName} · ${settings.bank.accountNumber} · ${settings.bank.accountName}`,
      receipt: hasReceipt ? await saveReceipt(receipt) : undefined,
    });
    const alert = await notifyOwnerOfOrder(order);
    if (alert.result === "failed") console.error(`[checkout] owner alert for ${order.number} failed: ${alert.error}`);
    return { placed: `${trackingPath(order)}&placed=1` };
  } catch (e) {
    console.error("[checkout]", e);
    return { error: (e as Error).message.startsWith("Your receipt") ? (e as Error).message : "We couldn't place your order just now. Please try again, or message us on WhatsApp." };
  }
}
