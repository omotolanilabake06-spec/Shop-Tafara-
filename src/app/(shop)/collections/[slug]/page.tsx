import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { ListingSkeleton } from "@/components/skeletons";
import { getCollection, getCollections, getProducts } from "@/lib/catalog";

export async function generateStaticParams() {
  const collections = await getCollections();
  // Cache Components needs at least one entry to build; before the first collection exists it simply 404s.
  return collections.length ? collections.map((c) => ({ slug: c.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  return c ? { title: c.name, description: c.intro } : {};
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: { params: PageProps<"/collections/[slug]">["params"] }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const products = await getProducts({ collection: slug });

  return (
    <>
      <section className="relative">
        <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]">
          <Image src={collection.image} alt="" fill sizes="100vw" loading="eager" fetchPriority="high" className="object-cover object-[50%_22%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="gutter absolute inset-x-0 bottom-0 pb-10 text-white sm:pb-14">
          <p className="caps-sm">Collection</p>
          <h1 className="display mt-3 text-[44px] sm:text-[72px]">{collection.name}</h1>
        </div>
      </section>
      <div className="gutter mx-auto max-w-[52ch] space-y-4 py-16 text-center sm:py-20">
        {collection.intro.split(/\n\s*\n/).map((para) => (
          <p key={para} className="text-[14px] leading-relaxed text-muted">
            {para}
          </p>
        ))}
      </div>
      <section aria-label="Pieces in this collection" className="gutter pb-24">
        <ProductGrid products={products} />
      </section>
    </>
  );
}
