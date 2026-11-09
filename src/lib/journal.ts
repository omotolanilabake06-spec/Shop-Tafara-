// The shop's read path for Journal stories: published only, cached, refreshed when the admin saves.
import { cacheLife, cacheTag } from "next/cache";
import { fetchPosts } from "./db/journal";

export async function getPublishedPosts() {
  "use cache";
  cacheLife("hours");
  cacheTag("journal");
  const now = Date.now();
  // A story with a future date stays hidden until then (the cache expires within hours).
  return (await fetchPosts()).filter((p) => p.status === "published" && p.publishedAt && Date.parse(p.publishedAt) <= now);
}

export async function getPublishedPost(slug: string) {
  return (await getPublishedPosts()).find((p) => p.slug === slug);
}

/** Blocks of a story body: blank lines split paragraphs, "## " starts a heading, "> " a pull quote. */
export type Block = { kind: "p" | "h2" | "quote"; text: string };

export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  const chunks = body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    if (chunk.startsWith("## ")) {
      // A heading is one line; anything typed straight under it is the next paragraph.
      const [heading, ...rest] = chunk.split("\n");
      blocks.push({ kind: "h2", text: heading.slice(3).trim() });
      if (rest.join(" ").trim()) blocks.push({ kind: "p", text: rest.join(" ").replace(/\s+/g, " ").trim() });
    } else if (chunk.startsWith("> ")) {
      blocks.push({ kind: "quote", text: chunk.replace(/^>\s?/gm, "").replace(/\s*\n\s*/g, " ").trim() });
    } else {
      blocks.push({ kind: "p", text: chunk.replace(/\s*\n\s*/g, " ") });
    }
  }
  return blocks;
}

/** Rough reading time at 220 words a minute, never under a minute. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));

export const formatPostDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date(iso)) : "";
