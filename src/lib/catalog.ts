// The storefront's read path for catalogue data. Everything is cached and tagged, and the admin
// expires the tags when it saves, so the shop updates straight away without rebuilding.
import { cacheLife, cacheTag } from "next/cache";
import { fetchCategories, fetchCollections, fetchProducts } from "./db/products";
import { fetchSettings } from "./db/settings";
import type { Category, Product } from "./types";

export { COLOURS } from "./fabric";

/** On sale only when published and every category it belongs to is switched on. */
function onSale(p: Product, categories: Category[]) {
  const visible = new Set(categories.filter((c) => c.visible).map((c) => c.slug));
  return p.status === "active" && p.categories.every((c) => visible.has(c));
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return (await fetchCategories()).filter((c) => c.visible);
}

/**
 * Categories worth showing in menus: visible ones holding at least one product on sale, plus the
 * parents of those. Empty categories come back by themselves once a product is added to them.
 */
export async function getStockedCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  const used = new Set(products.filter((p) => onSale(p, categories)).flatMap((p) => p.categories));
  const visible = categories.filter((c) => c.visible);
  return visible.filter((c) => used.has(c.slug) || visible.some((child) => child.parent === c.slug && used.has(child.slug)));
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return (await fetchCategories()).find((c) => c.slug === slug && c.visible);
}

export async function getProducts(filter?: { category?: string; collection?: string; department?: Category["department"] }) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  return products
    .filter((p) => onSale(p, categories))
    .filter((p) => !filter?.category || p.categories.includes(filter.category))
    .filter((p) => !filter?.collection || p.collection === filter.collection)
    .filter((p) => !filter?.department || (filter.department === "home") === (p.kind === "home"));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  return products.find((p) => p.slug === slug && onSale(p, categories));
}

export async function getCollection(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return (await fetchCollections()).find((c) => c.slug === slug);
}

export async function getCollections() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return fetchCollections();
}

/** Resolves homepage/about photo picks against the live products. Missing products or photos give undefined. */
export async function getPhotos(refs: { product: string; photo: number }[]) {
  const products = await getProducts();
  return refs.map((r) => {
    const image = products.find((p) => p.slug === r.product)?.images;
    return image ? (image[r.photo] ?? image[0]) : undefined;
  });
}

/** Store details, announcement bar, production times and delivery zones. */
export async function getSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");
  return fetchSettings();
}
