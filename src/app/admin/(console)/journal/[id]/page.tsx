import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JournalActions } from "@/components/admin/journal-actions";
import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/ui";
import { getPostById } from "@/lib/db/journal";
import { listAllProducts } from "@/lib/db/products";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Edit story" };

export default function EditStoryPage({ params, searchParams }: PageProps<"/admin/journal/[id]">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
      <EditStory params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** yyyy-mm-dd in Lagos. */
const lagosDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(iso));

async function EditStory({ params, searchParams }: PageProps<"/admin/journal/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [post, products] = await Promise.all([getPostById(id), listAllProducts()]);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/journal", label: "Journal" }}
        title={post.title}
        description={
          <>
            Last saved {formatStamp(post.updatedAt)}
            {post.status === "published" && (
              <>
                {" · "}
                <Link href={`/journal/${post.slug}`} target="_blank" className="underline underline-offset-4 hover:text-ink">
                  View on the site ↗
                </Link>
              </>
            )}
          </>
        }
      />
      {created && (
        <p className="mb-5 rounded-[3px] border border-[#cfe0c9] bg-[#eef6ec] px-4 py-3 text-[15px] text-ok">
          Story saved. {post.status === "draft" ? "It's a draft, so it isn't on the site yet." : "It's now live in the Journal."}
        </p>
      )}
      <JournalForm
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          topic: post.topic,
          excerpt: post.excerpt,
          cover: post.cover ? [{ src: post.cover, alt: post.coverAlt }] : [],
          body: post.body,
          products: post.products,
          status: post.status,
          date: post.publishedAt ? lagosDay(post.publishedAt) : "",
        }}
        products={products.map((p) => ({ slug: p.slug, name: p.name }))}
      />
      <JournalActions id={post.id} title={post.title} />
    </>
  );
}
