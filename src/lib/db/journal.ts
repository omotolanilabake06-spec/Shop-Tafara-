// Journal stories in Supabase. The shop reads them through the cached functions in lib/journal.ts;
// the admin uses the list/get functions here, which are always fresh.
import { connection } from "next/server";
import type { JournalPost } from "@/lib/types";
import { slugify } from "./products";
import { db, isDuplicate, must, newId } from "./supabase";

type PostRow = {
  id: string;
  slug: string;
  status: JournalPost["status"];
  title: string;
  topic: string;
  excerpt: string;
  cover: string | null;
  cover_alt: string;
  body: string;
  products: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const toPost = (r: PostRow): JournalPost => ({
  id: r.id,
  slug: r.slug,
  status: r.status,
  title: r.title,
  topic: r.topic,
  excerpt: r.excerpt,
  cover: r.cover ?? undefined,
  coverAlt: r.cover_alt,
  body: r.body,
  products: r.products,
  publishedAt: r.published_at ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Every story, newest first (drafts by last edit). Uncached, so lib/journal.ts can wrap it in "use cache". */
export async function fetchPosts() {
  const rows = must<PostRow[]>(
    await db().from("journal_posts").select("*").order("published_at", { ascending: false, nullsFirst: true }).order("updated_at", { ascending: false }),
    "loading journal stories",
  );
  return rows.map(toPost);
}

export async function listAllPosts() {
  await connection();
  return fetchPosts();
}

export async function getPostById(id: string) {
  await connection();
  const row = must<PostRow | null>(await db().from("journal_posts").select("*").eq("id", id).maybeSingle(), "loading a story");
  return row ? toPost(row) : null;
}

export type PostInput = Omit<JournalPost, "id" | "createdAt" | "updatedAt"> & { id?: string };

async function uniqueSlug(wanted: string, ownId?: string) {
  const base = slugify(wanted) || "story";
  const rows = must<{ id: string; slug: string }[]>(
    await db().from("journal_posts").select("id, slug").like("slug", `${base}%`),
    "checking story links",
  );
  const taken = new Set(rows.filter((r) => r.id !== ownId).map((r) => r.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Creates or updates a story. Publishing for the first time stamps today's date unless one is given. */
export async function savePost(input: PostInput): Promise<JournalPost> {
  const now = new Date().toISOString();
  const existing = input.id
    ? must<{ id: string; created_at: string } | null>(
        await db().from("journal_posts").select("id, created_at").eq("id", input.id).maybeSingle(),
        "loading a story",
      )
    : null;

  for (let attempt = 0; ; attempt++) {
    const row: PostRow = {
      id: existing?.id ?? newId("jrn"),
      slug: await uniqueSlug(input.slug || input.title, existing?.id),
      status: input.status,
      title: input.title,
      topic: input.topic,
      excerpt: input.excerpt,
      cover: input.cover ?? null,
      cover_alt: input.coverAlt,
      body: input.body,
      products: input.products,
      published_at: input.publishedAt ?? (input.status === "published" ? now : null),
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    const { error } = await db().from("journal_posts").upsert(row);
    if (isDuplicate(error) && attempt < 3) continue;
    if (error) throw new Error(`Database error while saving a story: ${error.message}`);
    return toPost(row);
  }
}

export async function deletePost(id: string) {
  must(await db().from("journal_posts").delete().eq("id", id), "deleting a story");
}
