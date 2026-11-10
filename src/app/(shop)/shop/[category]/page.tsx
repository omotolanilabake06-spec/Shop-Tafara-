import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Listing } from "@/components/listing";
import { ListingSkeleton } from "@/components/skeletons";
import { getCategories, getCategory, getProducts, getStockedCategories } from "@/lib/catalog";
import { clothingFilters } from "@/lib/filters";

export async function generateStaticParams() {
  const categories = await getCategories();
  const clothing = categories.filter((c) => c.department === "clothing");
  // At least one entry keeps the build happy with no categories; it simply 404s.
  return clothing.length ? clothing.map((c) => ({ category: c.slug })) : [{ category: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  return category ? { title: category.name } : {};
}

export default function CategoryPage({ params }: PageProps<"/shop/[category]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CategoryListing params={params} />
    </Suspense>
  );
}

async function CategoryListing({ params }: { params: PageProps<"/shop/[category]">["params"] }) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  // Hidden categories (Bags, until switched on) 404 rather than leak.
  if (!category || category.department !== "clothing") notFound();

  // Filter links only to categories with pieces in them.
  const [products, categories] = await Promise.all([getProducts({ category: slug }), getStockedCategories()]);

  return (
    <Listing
      title={category.name}
      intro={category.blurb}
      products={products}
      filters={clothingFilters(categories, category)}
    />
  );
}
