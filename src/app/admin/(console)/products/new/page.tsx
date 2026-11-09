import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { blankDraft } from "@/lib/admin/product-draft";
import { listAllCategories, listAllCollections, listAllProducts } from "@/lib/db/products";
import { CLOTHING_SIZES, COLOURS } from "@/lib/fabric";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <NewProduct searchParams={searchParams} />
    </Suspense>
  );
}

async function NewProduct({ searchParams }: Pick<PageProps<"/admin/products/new">, "searchParams">) {
  const [{ type }, categories, collections, products] = await Promise.all([searchParams, listAllCategories(), listAllCollections(), listAllProducts()]);
  const kind = type === "home" ? "home" : "clothing";
  const nextPosition = Math.max(0, ...products.filter((p) => p.kind === kind).map((p) => p.sortOrder)) + 1;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={kind === "home" ? "New TAFARA HOME product" : "New clothing piece"}
        description={
          <>
            {kind === "home" ? "Ready-made, with stock per scent and size." : "Made to order, with one price for every colour and size."}{" "}
            <Link href={kind === "home" ? "/admin/products/new" : "/admin/products/new?type=home"} className="underline underline-offset-4 hover:text-ink">
              {kind === "home" ? "Adding clothing instead?" : "Adding a candle or scent instead?"}
            </Link>
          </>
        }
      />
      <ProductForm
        key={kind}
        initial={blankDraft(kind, nextPosition)}
        categories={categories}
        collections={collections}
        colours={COLOURS}
        standardSizes={CLOTHING_SIZES}
      />
    </>
  );
}
