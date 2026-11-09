"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import {
  type ProductInput,
  deleteProduct,
  duplicateProduct,
  fetchCategories,
  fetchCollections,
  saveProduct,
  setProductStatus,
} from "@/lib/db/products";
import { COLOURS } from "@/lib/fabric";
import type { ColourKey, Product, ProductImage } from "@/lib/types";

export type ProductDraft = {
  id?: string;
  kind: Product["kind"];
  name: string;
  slug: string;
  description: string;
  status: Product["status"];
  categories: string[];
  collection: string;
  images: ProductImage[];
  sortOrder: string;
  price: string;
  colours: ColourKey[];
  sizes: string[];
  variants: { id: string; scent: string; size: string; price: string; stock: string }[];
  specs: { label: string; value: string }[];
};

export type SaveState = { errors?: Record<string, string>; error?: string; savedAt?: number };

const toNaira = (v: string) => Number(String(v).replace(/[₦,\s]/g, ""));
const isWhole = (n: number) => Number.isInteger(n) && n >= 0;

export async function saveProductAction(_: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  let d: ProductDraft;
  try {
    d = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "Something went wrong reading the form. Please try again." };
  }

  const errors: Record<string, string> = {};
  const [categories, collections] = await Promise.all([fetchCategories(), fetchCollections()]);
  const name = d.name.trim();
  if (!name) errors.name = "Give the product a name.";
  else if (name.length > 120) errors.name = "Keep the name under 120 characters.";
  if (!d.description.trim()) errors.description = "Add a short description. It appears under the price.";

  const known = new Set(categories.map((c) => c.slug));
  const chosen = d.categories.filter((c) => known.has(c));
  if (!chosen.length) errors.categories = "Choose at least one category.";
  const wrongDept = chosen.some((slug) => categories.find((c) => c.slug === slug)!.department !== (d.kind === "home" ? "home" : "clothing"));
  if (wrongDept) errors.categories = d.kind === "home" ? "TAFARA HOME products go in TAFARA HOME categories." : "Clothing can't go in TAFARA HOME categories.";
  if (d.collection && !collections.some((c) => c.slug === d.collection)) errors.collection = "That collection no longer exists.";

  // A photo keeps its colour only while that colour is still offered (clothing only).
  const offered = new Set(d.kind === "clothing" ? d.colours : []);
  const images: ProductImage[] = d.images
    .filter((i) => i.src)
    .map((i) => ({ src: i.src, alt: i.alt.trim() || name, ...(i.colour && offered.has(i.colour) ? { colour: i.colour } : {}) }));
  if (d.status === "active" && !images.length) errors.images = "Add at least one photo before publishing, or save as a draft.";

  const sortOrder = Number(d.sortOrder || 0);
  if (!Number.isFinite(sortOrder)) errors.sortOrder = "Use a number.";
  const specs = d.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })).filter((s) => s.label && s.value);

  let product: ProductInput | null = null;
  const base = {
    id: d.id,
    slug: d.slug.trim(),
    name,
    status: d.status,
    categories: chosen,
    collection: d.collection || undefined,
    description: d.description.trim(),
    images,
    sortOrder,
    specs,
  };

  if (d.kind === "clothing") {
    const price = toNaira(d.price);
    if (!d.price.trim() || !isWhole(price) || price === 0) errors.price = "Enter the price in naira, e.g. 185000.";
    const colours = d.colours.filter((c) => COLOURS.some((x) => x.key === c));
    if (!colours.length) errors.colours = "Choose at least one fabric colour.";
    const sizes = d.sizes.map((s) => s.trim()).filter(Boolean);
    product = { ...base, kind: "clothing", price, colours, sizes };
  } else {
    const variants = d.variants.map((v) => ({ id: v.id, scent: v.scent.trim(), size: v.size.trim(), price: toNaira(v.price), stock: Number(v.stock) }));
    if (!variants.length) errors.variants = "Add at least one scent and size.";
    variants.forEach((v, i) => {
      if (!v.scent || !v.size) errors[`variant.${i}`] = "Fill in the scent and the size.";
      else if (!isWhole(v.price) || v.price === 0) errors[`variant.${i}`] = "Enter a price in naira.";
      else if (!isWhole(v.stock)) errors[`variant.${i}`] = "Stock must be a whole number (0 or more).";
    });
    const combos = new Set(variants.map((v) => `${v.scent.toLowerCase()}|${v.size.toLowerCase()}`));
    if (combos.size < variants.length) errors.variants = "Each scent and size combination should appear once.";
    product = { ...base, kind: "home", variants };
  }

  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted fields." };

  const saved = await saveProduct(product!);
  updateTag("catalog");
  if (!d.id) redirect(`/admin/products/${saved.id}?created=1`);
  return { savedAt: Date.now() };
}

export async function deleteProductAction(form: FormData) {
  await requireAdmin();
  await deleteProduct(String(form.get("id")));
  updateTag("catalog");
  redirect("/admin/products?deleted=1");
}

export async function duplicateProductAction(form: FormData) {
  await requireAdmin();
  const copy = await duplicateProduct(String(form.get("id")));
  updateTag("catalog");
  redirect(copy ? `/admin/products/${copy.id}?created=1` : "/admin/products");
}

export async function setStatusAction(form: FormData) {
  await requireAdmin();
  await setProductStatus(String(form.get("id")), form.get("status") === "active" ? "active" : "draft");
  updateTag("catalog");
}
