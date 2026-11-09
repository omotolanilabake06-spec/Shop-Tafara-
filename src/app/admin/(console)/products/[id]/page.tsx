import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { toDraft } from "@/lib/admin/product-draft";
import { getProductById, listAllCategories, listAllCollections } from "@/lib/db/products";
import { CLOTHING_SIZES, COLOURS } from "@/lib/fabric";
import { listOrders } from "@/lib/orders/store";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories, collections, orders] = await Promise.all([getProductById(id), listAllCategories(), listAllCollections(), listOrders()]);
  if (!product) notFound();
  const orderCount = orders.filter((o) => o.items.some((i) => i.slug === product.slug)).length;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description={`${product.kind === "home" ? "TAFARA HOME" : "Made to order"} · last saved ${formatStamp(product.updatedAt)}${
          orderCount ? ` · in ${orderCount} ${orderCount === 1 ? "order" : "orders"}` : ""
        }`}
      />
      {created && (
        <p className="mb-5 rounded-[3px] border border-[#cfe0c9] bg-[#eef6ec] px-4 py-3 text-[15px] text-ok">
          Product saved. {product.status === "draft" ? "It's a draft, so it isn't in the shop yet." : "It's now live in the shop."}
        </p>
      )}
      <ProductForm initial={toDraft(product)} categories={categories} collections={collections} colours={COLOURS} standardSizes={CLOTHING_SIZES} />
      <ProductActions id={product.id} name={product.name} orderCount={orderCount} />
    </>
  );
}
