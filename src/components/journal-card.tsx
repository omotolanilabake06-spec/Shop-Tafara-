import Image from "next/image";
import Link from "next/link";
import { formatPostDate, readingMinutes } from "@/lib/journal";
import type { JournalPost } from "@/lib/types";

/** Portrait cover with topic, title and summary underneath. Used on the Journal page and the homepage. */
export function JournalCard({ post }: { post: JournalPost }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        {post.cover && (
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[2.4s] ease-[var(--ease-soft)] group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="mt-5 text-center">
        {post.topic && <p className="caps-sm text-muted">{post.topic}</p>}
        <h3 className="display mx-auto mt-2 max-w-[22ch] text-[26px] leading-[1.05]">{post.title}</h3>
        <p className="mx-auto mt-3 max-w-[46ch] text-[13px] leading-relaxed text-muted">{post.excerpt}</p>
        <p className="caps-sm mt-4 text-muted">
          {formatPostDate(post.publishedAt)} · {readingMinutes(post.body)} min read
        </p>
      </div>
    </Link>
  );
}
