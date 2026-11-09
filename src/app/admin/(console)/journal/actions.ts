"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { deletePost, getPostById, savePost } from "@/lib/db/journal";
import type { JournalPost } from "@/lib/types";

export type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  topic: string;
  excerpt: string;
  cover: { src: string; alt: string }[];
  body: string;
  products: string[];
  status: JournalPost["status"];
  /** yyyy-mm-dd, Lagos date. Empty: today, when first published. */
  date: string;
};

export type PostSaveState = { errors?: Record<string, string>; error?: string; savedAt?: number };

export async function savePostAction(_: PostSaveState, form: FormData): Promise<PostSaveState> {
  await requireAdmin();
  let d: PostDraft;
  try {
    d = JSON.parse(String(form.get("payload")));
  } catch {
    return { error: "Something went wrong reading the form. Please try again." };
  }

  const errors: Record<string, string> = {};
  const title = d.title.trim();
  if (!title) errors.title = "Give the story a title.";
  else if (title.length > 140) errors.title = "Keep the title under 140 characters.";
  const published = d.status === "published";
  if (published && !d.excerpt.trim()) errors.excerpt = "Add a short summary. It shows on the Journal page and the homepage.";
  if (published && !d.cover[0]?.src) errors.cover = "Add a cover photo before publishing, or save as a draft.";
  if (published && !d.body.trim()) errors.body = "Write the story before publishing, or save as a draft.";
  if (d.date && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) errors.date = "Use a date like 2026-11-09.";
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted fields." };

  // Keep the original time when the date is unchanged; today means now (never later today, which
  // would hide the story until then); any other day means noon in Lagos, so it never slips a day.
  const lagosDay = (at: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(at);
  const existing = d.id ? await getPostById(d.id) : null;
  let publishedAt: string | undefined;
  if (d.date && existing?.publishedAt && lagosDay(new Date(existing.publishedAt)) === d.date) publishedAt = existing.publishedAt;
  else if (d.date === lagosDay(new Date())) publishedAt = new Date().toISOString();
  else if (d.date) publishedAt = new Date(`${d.date}T12:00:00+01:00`).toISOString();

  const saved = await savePost({
    id: d.id,
    slug: d.slug.trim(),
    title,
    topic: d.topic.trim(),
    excerpt: d.excerpt.trim(),
    cover: d.cover[0]?.src || undefined,
    coverAlt: d.cover[0]?.alt.trim() || title,
    body: d.body.trim(),
    products: d.products,
    status: d.status,
    publishedAt,
  });
  updateTag("journal");
  if (!d.id) redirect(`/admin/journal/${saved.id}?created=1`);
  return { savedAt: Date.now() };
}

export async function deletePostAction(form: FormData) {
  await requireAdmin();
  await deletePost(String(form.get("id")));
  updateTag("journal");
  redirect("/admin/journal?deleted=1");
}
