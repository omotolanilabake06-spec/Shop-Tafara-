import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JournalCard } from "@/components/journal-card";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/catalog";
import { formatPostDate, getPublishedPost, getPublishedPosts, parseBody, readingMinutes } from "@/lib/journal";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  // At least one entry keeps the build happy before the first story exists; it simply 404s.
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", images: post.cover ? [{ url: post.cover }] : undefined },
  };
}

export default function StoryPage({ params }: PageProps<"/journal/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <Story params={params} />
    </Suspense>
  );
}

async function Story({ params }: Pick<PageProps<"/journal/[slug]">, "params">) {
  const { slug } = await params;
  const [post, posts, products] = await Promise.all([getPublishedPost(slug), getPublishedPosts(), getProducts()]);
  if (!post) notFound();
  const featured = post.products.map((s) => products.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <article>
      <header className="grid border-b border-line md:grid-cols-2">
        <div className="gutter order-2 flex flex-col items-center justify-center py-14 text-center md:order-1 md:py-20">
          <nav aria-label="Breadcrumb" className="caps-sm text-muted">
            <Link href="/journal" className="hover:text-ink">
              Journal
            </Link>
            {post.topic && (
              <>
                <span className="mx-2">/</span>
                {post.topic}
              </>
            )}
          </nav>
          <h1 className="display mt-5 max-w-[16ch] text-[42px] leading-[1] sm:text-[60px]">{post.title}</h1>
          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted">{post.excerpt}</p>
          <p className="caps-sm mt-6 text-muted">
            {formatPostDate(post.publishedAt)} · {readingMinutes(post.body)} min read
          </p>
        </div>
        <div className="relative order-1 aspect-[4/5] bg-stone md:order-2 md:aspect-auto md:min-h-[720px]">
          {post.cover && <Image src={post.cover} alt={post.coverAlt} fill sizes="(min-width: 768px) 50vw, 100vw" loading="eager" fetchPriority="high" className="object-cover" />}
        </div>
      </header>

      <div className="gutter mx-auto max-w-[680px] py-16 sm:py-24">
        {parseBody(post.body).map((b, i) =>
          b.kind === "h2" ? (
            <h2 key={i} className="caps mb-5 mt-14 text-ink first:mt-0">
              {b.text}
            </h2>
          ) : b.kind === "quote" ? (
            <blockquote key={i} className="display my-14 border-y border-line py-10 text-center text-[30px] leading-[1.1] sm:text-[38px]">
              {b.text}
            </blockquote>
          ) : (
            <p key={i} className="mb-6 text-[16px] leading-[1.9] text-[#4a443e]">
              {b.text}
            </p>
          ),
        )}
      </div>

      {featured.length > 0 && (
        <section aria-labelledby="shop-story" className="border-t border-line px-2.5 py-16 lg:px-5 lg:py-20">
          <h2 id="shop-story" className="caps mb-10 text-center">
            Shop the story
          </h2>
          <ProductGrid products={featured} />
        </section>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-stories" className="gutter border-t border-line py-16 lg:py-20">
          <h2 id="more-stories" className="caps mb-10 text-center">
            More from the Journal
          </h2>
          <div className="grid gap-x-2.5 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <JournalCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
