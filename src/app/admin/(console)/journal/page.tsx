import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Empty, PageHeader, button, td, th } from "@/components/admin/ui";
import { listAllPosts } from "@/lib/db/journal";
import { formatPostDate } from "@/lib/journal";

export const metadata: Metadata = { title: "Journal" };

export default function JournalAdminPage({ searchParams }: PageProps<"/admin/journal">) {
  return (
    <>
      <PageHeader
        title="Journal"
        description="Stories for the Journal page and the homepage. Drafts are only visible here."
        actions={
          <Link href="/admin/journal/new" className={button.primary}>
            + New story
          </Link>
        }
      />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Posts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Posts({ searchParams }: Pick<PageProps<"/admin/journal">, "searchParams">) {
  const [{ deleted }, posts] = await Promise.all([searchParams, listAllPosts()]);
  return (
    <>
      {deleted && <p className="mb-5 rounded-[3px] border border-line bg-paper px-4 py-3 text-[15px] text-ok">Story deleted.</p>}
      <div className="overflow-hidden rounded-[4px] border border-line bg-paper">
        {posts.length === 0 ? (
          <Empty title="No stories yet">
            <Link href="/admin/journal/new" className={button.quiet}>
              Write the first one
            </Link>
          </Empty>
        ) : (
          <table className="w-full">
            <thead className="border-b border-line bg-[#faf8f5]">
              <tr>
                <th className={th}>Story</th>
                <th className={`${th} hidden sm:table-cell`}>Topic</th>
                <th className={th}>Status</th>
                <th className={`${th} hidden md:table-cell`}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf8f5]">
                  <td className={td}>
                    <Link href={`/admin/journal/${p.id}`} className="flex items-center gap-4">
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-stone">
                        {p.cover && <Image src={p.cover} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="font-medium hover:underline">{p.title}</span>
                    </Link>
                  </td>
                  <td className={`${td} hidden text-soft sm:table-cell`}>{p.topic}</td>
                  <td className={td}>
                    <Badge tone={p.status === "published" ? "green" : "neutral"}>{p.status === "published" ? "Published" : "Draft"}</Badge>
                  </td>
                  <td className={`${td} hidden text-soft md:table-cell`}>{formatPostDate(p.publishedAt) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
