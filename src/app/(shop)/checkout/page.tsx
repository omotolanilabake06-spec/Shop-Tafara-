import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getProducts, getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/** Guest checkout by bank transfer. The bag lives in the browser, so the form itself is a client component. */
export default async function CheckoutPage() {
  const [settings, products] = await Promise.all([getSettings(), getProducts()]);
  // Today's prices, so the total the customer transfers matches what the order is checked against.
  const prices: Record<string, number> = {};
  for (const p of products) {
    if (p.kind === "clothing") prices[p.slug] = p.price;
    else for (const v of p.variants) prices[`${p.slug}|${v.scent}|${v.size}`] = v.price;
  }
  return (
    <CheckoutForm
      prices={prices}
      zones={settings.delivery.filter((z) => z.active)}
      bank={settings.bank}
      whatsapp={settings.store.whatsapp}
      production={settings.production}
    />
  );
}
