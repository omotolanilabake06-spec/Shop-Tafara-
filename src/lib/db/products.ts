// Products, categories and collections in Supabase. The storefront reads them through the cached
// functions in lib/catalog.ts; the admin uses the list/get functions here, which are always fresh.
import { connection } from "next/server";
import type { Category, ColourKey, Collection, HomeVariant, Product } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { db, isDuplicate, must, newId } from "./supabase";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type ProductInput = DistributiveOmit<Product, "createdAt" | "updatedAt" | "id"> & { id?: string };

// Rows as stored ---------------------------------------------------------------------------

type VariantRow = { id: string; product_id: string; scent: string; size: string; price: number; stock: number; sort_order: number };
type ProductRow = {
  id: string;
  slug: string;
  kind: Product["kind"];
  status: Product["status"];
  name: string;
  description: string;
  collection: string | null;
  categories: string[];
  images: Product["images"];
  specs: Product["specs"];
  sort_order: number;
  price: number | null;
  colours: string[];
  sizes: string[];
  created_at: string;
  updated_at: string;
  product_variants?: VariantRow[];
};
type CategoryRow = {
  slug: string;
  name: string;
  parent: string | null;
  department: Category["department"];
  visible: boolean;
  blurb: string | null;
  sort_order: number;
};
type CollectionRow = Collection;

const PRODUCT_COLUMNS = "*, product_variants(*)";

export function toProduct(r: ProductRow): Product {
  const base = {
    id: r.id,
    slug: r.slug,
    status: r.status,
    name: r.name,
    description: r.description,
    collection: r.collection ?? undefined,
    categories: r.categories,
    images: r.images,
    specs: r.specs,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
  if (r.kind === "home") {
    const variants: HomeVariant[] = [...(r.product_variants ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({ id: v.id, scent: v.scent, size: v.size, price: v.price, stock: v.stock }));
    return { ...base, kind: "home", variants };
  }
  return { ...base, kind: "clothing", price: r.price ?? 0, colours: r.colours as ColourKey[], sizes: r.sizes };
}

export function toProductRow(p: Product): Omit<ProductRow, "product_variants"> {
  return {
    id: p.id,
    slug: p.slug,
    kind: p.kind,
    status: p.status,
    name: p.name,
    description: p.description,
    collection: p.collection ?? null,
    categories: p.categories,
    images: p.images,
    specs: p.specs,
    sort_order: p.sortOrder,
    price: p.kind === "clothing" ? p.price : null,
    colours: p.kind === "clothing" ? p.colours : [],
    sizes: p.kind === "clothing" ? p.sizes : [],
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

const toCategory = (r: CategoryRow): Category => ({
  slug: r.slug,
  name: r.name,
  parent: r.parent ?? undefined,
  department: r.department,
  visible: r.visible,
  blurb: r.blurb ?? undefined,
  sortOrder: r.sort_order,
});

export const toCategoryRow = (c: Category): CategoryRow => ({
  slug: c.slug,
  name: c.name,
  parent: c.parent ?? null,
  department: c.department,
  visible: c.visible,
  blurb: c.blurb ?? null,
  sort_order: c.sortOrder ?? 0,
});

// Reads ------------------------------------------------------------------------------------
// fetch* functions are uncached and request-agnostic, so lib/catalog.ts can wrap them in "use cache".

export async function fetchProducts() {
  const rows = must<ProductRow[]>(
    await db().from("products").select(PRODUCT_COLUMNS).order("sort_order").order("name"),
    "loading products",
  );
  return rows.map(toProduct);
}

export async function fetchCategories() {
  const rows = must<CategoryRow[]>(await db().from("categories").select("*").order("sort_order").order("name"), "loading categories");
  return rows.map(toCategory);
}

export async function fetchCollections() {
  return must<CollectionRow[]>(await db().from("collections").select("*").order("name"), "loading collections");
}

export async function listAllProducts() {
  await connection();
  return fetchProducts();
}

export async function getProductById(id: string) {
  await connection();
  const row = must<ProductRow | null>(
    await db().from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle(),
    "loading a product",
  );
  return row ? toProduct(row) : null;
}

export async function listAllCategories() {
  await connection();
  return fetchCategories();
}

export async function listAllCollections() {
  await connection();
  return fetchCollections();
}

export { slugify };

// Product writes ---------------------------------------------------------------------------

async function uniqueSlug(wanted: string, ownId?: string) {
  const base = slugify(wanted) || "product";
  const rows = must<{ id: string; slug: string }[]>(
    await db().from("products").select("id, slug").like("slug", `${base}%`),
    "checking product links",
  );
  const taken = new Set(rows.filter((r) => r.id !== ownId).map((r) => r.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Creates or updates a product. Returns the saved product, with its slug made unique if needed. */
export async function saveProduct(input: ProductInput): Promise<Product> {
  const now = new Date().toISOString();
  const existing = input.id
    ? must<{ id: string; created_at: string } | null>(
        await db().from("products").select("id, created_at").eq("id", input.id).maybeSingle(),
        "loading a product",
      )
    : null;

  // Two saves racing for the same link: the loser picks the next free one and tries again.
  for (let attempt = 0; ; attempt++) {
    const product = {
      ...input,
      slug: await uniqueSlug(input.slug || input.name, existing?.id),
      id: existing?.id ?? newId("prd"),
      createdAt: existing?.created_at ?? now,
      updatedAt: now,
    } as Product;
    const { error } = await db().from("products").upsert(toProductRow(product));
    if (isDuplicate(error) && attempt < 3) continue;
    if (error) throw new Error(`Database error while saving a product: ${error.message}`);

    const variants = product.kind === "home" ? product.variants : [];
    must(await db().rpc("replace_product_variants", { p_product: product.id, p_variants: variants }), "saving sizes and stock");
    return product;
  }
}

export async function deleteProduct(id: string) {
  const rows = must<{ id: string }[]>(await db().from("products").delete().eq("id", id).select("id"), "deleting a product");
  return rows.length > 0;
}

export async function setProductStatus(id: string, status: Product["status"]) {
  must(await db().from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", id), "updating a product");
}

/** A copy saved as a draft, for adding a similar piece quickly. */
export async function duplicateProduct(id: string) {
  const row = must<ProductRow | null>(
    await db().from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle(),
    "loading a product",
  );
  if (!row) return null;
  const original = toProduct(row);
  const copy = structuredClone(original) as ProductInput & Partial<Product>;
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  // Variant ids are unique across the shop, so the copy gets its own.
  if (copy.kind === "home") copy.variants = copy.variants.map((v) => ({ ...v, id: newId("var") }));
  return saveProduct({ ...copy, name: `${original.name} (copy)`, slug: `${original.slug}-copy`, status: "draft" } as ProductInput);
}

/**
 * Lowers stock after a paid TAFARA HOME order, atomically per line. Returns the variants that
 * didn't have enough left, so checkout (Phase 3) can flag them for the studio.
 */
export async function takeStock(lines: { variantId: string; qty: number }[]) {
  const short: string[] = [];
  for (const line of lines) {
    const ok = must<boolean>(await db().rpc("take_stock", { p_variant: line.variantId, p_qty: line.qty }), "updating stock");
    if (!ok) short.push(line.variantId);
  }
  return short;
}

// Categories and collections ---------------------------------------------------------------

export async function saveCategory(category: Category, isNew: boolean) {
  if (isNew) {
    const count = must<CategoryRow[]>(await db().from("categories").select("slug"), "loading categories").length;
    const { error } = await db()
      .from("categories")
      .insert(toCategoryRow({ ...category, sortOrder: category.sortOrder ?? count + 1 }));
    if (isDuplicate(error)) return { error: "A category with this link already exists." };
    if (error) throw new Error(`Database error while adding a category: ${error.message}`);
  } else {
    must(await db().from("categories").update(toCategoryRow(category)).eq("slug", category.slug), "saving a category");
  }
  return { ok: true as const };
}

const inUse = (n: number, where: string, fix: string) =>
  `${n} product${n === 1 ? " is" : "s are"} still in this ${where}. Move ${n === 1 ? "it" : "them"} first${fix}.`;

export async function deleteCategory(slug: string) {
  const { count: used } = await db().from("products").select("id", { count: "exact", head: true }).contains("categories", [slug]);
  if (used) return { error: inUse(used, "category", ", or hide the category instead") };
  const { count: children } = await db().from("categories").select("slug", { count: "exact", head: true }).eq("parent", slug);
  if (children) return { error: "This category has sub-categories. Delete or move those first." };
  must(await db().from("categories").delete().eq("slug", slug), "deleting a category");
  return { ok: true as const };
}

export async function saveCollection(collection: Collection, isNew: boolean) {
  if (isNew) {
    const { error } = await db().from("collections").insert(collection);
    if (isDuplicate(error)) return { error: "A collection with this link already exists." };
    if (error) throw new Error(`Database error while adding a collection: ${error.message}`);
  } else {
    must(await db().from("collections").update(collection).eq("slug", collection.slug), "saving a collection");
  }
  return { ok: true as const };
}

export async function deleteCollection(slug: string) {
  const { count: used } = await db().from("products").select("id", { count: "exact", head: true }).eq("collection", slug);
  if (used) return { error: inUse(used, "collection", "") };
  must(await db().from("collections").delete().eq("slug", slug), "deleting a collection");
  return { ok: true as const };
}
