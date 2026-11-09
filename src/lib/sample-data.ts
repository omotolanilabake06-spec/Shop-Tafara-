// The default category tree, for setting up a fresh database. The catalogue itself (products and
// collections) is the client's own, added through the admin or `pnpm db:import-product`.
import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "dresses", name: "Dresses", visible: true, department: "clothing" },
  { slug: "mini-dresses", name: "Mini Dresses", parent: "dresses", visible: true, department: "clothing" },
  { slug: "maxi-dresses", name: "Maxi Dresses", parent: "dresses", visible: true, department: "clothing" },
  { slug: "tops", name: "Tops", visible: true, department: "clothing" },
  { slug: "sets", name: "Sets", visible: true, department: "clothing" },
  { slug: "accessories", name: "Accessories", visible: true, department: "clothing" },
  // Built now, switched off until the client is ready to sell bags.
  { slug: "bags", name: "Bags", parent: "accessories", visible: false, department: "clothing" },
  {
    slug: "tafara-home",
    name: "TAFARA HOME",
    visible: true,
    department: "home",
    blurb: "Scented candles, reed diffusers and room sprays, poured and blended in Lagos.",
  },
];
