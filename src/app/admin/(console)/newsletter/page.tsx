import type { Metadata } from "next";
import { Suspense } from "react";
import { Empty, PageHeader, Stat, button, td, th } from "@/components/admin/ui";
import { listSubscribers } from "@/lib/db/newsletter";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  return (
    <>
      <PageHeader title="Newsletter" description="Everyone who has signed up on the website. Download the list to use in your email tool." />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Subscribers />
      </Suspense>
    </>
  );
}

async function Subscribers() {
  const subscribers = await listSubscribers();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[200px]">
          <Stat label="Sign-ups" value={subscribers.length} />
        </div>
        <a href="/admin/newsletter-export" className={button.secondary}>
          Download CSV
        </a>
      </div>
      <div className="mt-5 overflow-hidden rounded-[4px] border border-line bg-paper">
        {subscribers.length === 0 ? (
          <Empty title="No sign-ups yet" />
        ) : (
          <table className="w-full">
            <thead className="border-b border-line bg-[#faf8f5]">
              <tr>
                <th className={th}>Email</th>
                <th className={th}>First name</th>
                <th className={th}>Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscribers.map((s) => (
                <tr key={s.email}>
                  <td className={td}>
                    <a href={`mailto:${s.email}`} className="break-all hover:underline">
                      {s.email}
                    </a>
                  </td>
                  <td className={td}>{s.firstName || "—"}</td>
                  <td className={`${td} text-[14px] text-soft`}>{formatStamp(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
