import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JournalCard } from "@/components/journal-card";
import { formatPostDate, getPublishedPosts, readingMinutes } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal",
  description: "Stories from the Shop Tafara studio in Lagos: the pieces, the fabrics and how they are made.",
};

export default async function JournalPage() {
  const [featured, ...rest] = await getPublishedPosts();

  return (
    <div className="pb-24">
      <header className="gutter mx-auto max-w-[720px] pb-12 pt-10 text-center sm:pb-16 sm:pt-16">
        <p className="caps-sm text-muted">Stories from the studio</p>
        <h1 className="display mt-3 text-[44px] sm:text-[64px]">The Journal</h1>
      </header>

      {!featured ? (
        <p className="display py-24 text-center text-[26px] text-muted">The first stories are on their way.</p>
      ) : (
        <>
          {/* Latest story, large. */}
          <Link href={`/journal/${featured.slug}`} className="group grid border-y border-line md:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone md:aspect-auto md:min-h-[680px]">
              {featured.cover && (
                <Image
                  src={featured.cover}
                  alt={featured.coverAlt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover transition-transform duration-[2.4s] ease-[var(--ease-soft)] group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="gutter flex flex-col items-center justify-center py-14 text-center md:py-20">
              <p className="caps-sm text-muted">Latest{featured.topic ? ` · ${featured.topic}` : ""}</p>
              <h2 className="display mt-4 max-w-[16ch] text-[40px] leading-[1] sm:text-[56px]">{featured.title}</h2>
              <p className="mt-6 max-w-[46ch] text-[14px] leading-relaxed text-muted">{featured.excerpt}</p>
              <p className="caps-sm mt-6 text-muted">
                {formatPostDate(featured.publishedAt)} · {readingMinutes(featured.body)} min read
              </p>
              <span className="caps link-line mt-8">Read the story</span>
            </div>
          </Link>

          {rest.length > 0 && (
            <section aria-label="More stories" className="gutter mt-20 grid gap-x-2.5 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <JournalCard key={post.id} post={post} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
