import type { HomeProduct, Product } from "./types";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export function formatNaira(amount: number) {
  return naira.format(amount);
}

/** Listing price: clothing has one price; home products show "From" the cheapest variant. */
export function displayPrice(p: Product) {
  if (p.kind === "clothing") return formatNaira(p.price);
  const prices = p.variants.map((v) => v.price);
  const min = Math.min(...prices);
  return prices.some((x) => x !== min) ? `From ${formatNaira(min)}` : formatNaira(min);
}

export function isSoldOut(p: Product) {
  return p.kind === "home" && p.variants.every((v) => v.stock <= 0);
}

export function inStockVariants(p: HomeProduct) {
  return p.variants.filter((v) => v.stock > 0);
}
