import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRow, CollectionEditor, NewCategory } from "@/components/admin/category-editors";
import { Card, PageHeader } from "@/components/admin/ui";
import { listAllCategories, listAllCollections, listAllProducts } from "@/lib/db/products";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories & collections"
        description="Categories build the Shop menu. Hide one (like Bags) to take it and its products off the site until you are ready."
      />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const [categories, collections, products] = await Promise.all([listAllCategories(), listAllCollections(), listAllProducts()]);
  const count = (slug: string) => products.filter((p) => p.categories.includes(slug)).length;
  const clothing = categories.filter((c) => c.department === "clothing");
  const tops = clothing.filter((c) => !c.parent);
  const ordered = tops.flatMap((t) => [t, ...clothing.filter((c) => c.parent === t.slug)]);
  const home = categories.filter((c) => c.department === "home");

  return (
    <div className="space-y-6">
      <Card title="Clothing categories" description="Shown in the Shop menu in this order.">
        <ul className="-my-1 divide-y divide-line">
          {ordered.map((c) => (
            <CategoryRow key={c.slug} category={c} parents={tops} productCount={count(c.slug)} />
          ))}
        </ul>
        <div className="mt-5 border-t border-line pt-5">
          <NewCategory parents={tops} />
        </div>
      </Card>

      <Card title="TAFARA HOME">
        <ul className="-my-1 divide-y divide-line">
          {home.map((c) => (
            <CategoryRow key={c.slug} category={c} parents={[]} productCount={count(c.slug)} />
          ))}
        </ul>
      </Card>

      <Card title="Collections" description="Each collection has its own page and appears on the homepage.">
        <div className="space-y-8 divide-y divide-line">
          {collections.map((c) => (
            <div key={c.slug} className="pt-8 first:pt-0">
              <CollectionEditor collection={c} productCount={products.filter((p) => p.collection === c.slug).length} />
            </div>
          ))}
          <div className="pt-8">
            <p className="mb-4 font-medium">Add a collection</p>
            <CollectionEditor />
          </div>
        </div>
      </Card>
    </div>
  );
}
