import type { Metadata } from "next";
import { Listing } from "@/components/listing";
import { getCategories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Dresses, tops, sets and accessories, each made to order in Lagos.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts({ department: "clothing" }), getCategories()]);

  // Each circle borrows a photo from its category, so it follows the live catalogue. Prefer a
  // product no other circle has used, since a dress also sits in Dresses and Mini Dresses.
  const used = new Set<string>();
  const circles = categories
    .filter((c) => c.department === "clothing")
    .flatMap((c) => {
      const inCategory = products.filter((p) => p.categories.includes(c.slug));
      const product = inCategory.find((p) => !used.has(p.slug)) ?? inCategory[0];
      const image = product?.images[0]?.src;
      if (!image) return [];
      used.add(product.slug);
      return [{ label: c.name, href: `/shop/${c.slug}`, image }];
    });

  return (
    <Listing
      title="Shop all"
      intro="Every piece is made to order in Lagos, in the fabric colour and size you choose."
      products={products}
      circles={circles}
    />
  );
}
