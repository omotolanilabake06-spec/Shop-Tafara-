import type { Metadata } from "next";
import { Suspense } from "react";
import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/ui";
import { listAllProducts } from "@/lib/db/products";

export const metadata: Metadata = { title: "New story" };

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <NewStory />
    </Suspense>
  );
}

async function NewStory() {
  const products = await listAllProducts();
  return (
    <>
      <PageHeader back={{ href: "/admin/journal", label: "Journal" }} title="New story" />
      <JournalForm
        initial={{ title: "", slug: "", topic: "", excerpt: "", cover: [], body: "", products: [], status: "published", date: "" }}
        products={products.map((p) => ({ slug: p.slug, name: p.name }))}
      />
    </>
  );
}
