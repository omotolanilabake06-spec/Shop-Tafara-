"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { type PostDraft, type PostSaveState, savePostAction } from "@/app/admin/(console)/journal/actions";
import { slugify } from "@/lib/slug";
import { ImageUploader } from "./image-uploader";
import { Card, Field, button, input, textarea } from "./ui";

const TOPICS = ["The pieces", "The studio", "Style notes", "Behind the scenes"];

export function JournalForm({ initial, products }: { initial: PostDraft; products: { slug: string; name: string }[] }) {
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [state, action, pending] = useActionState<PostSaveState, FormData>(savePostAction, {});
  const errors = state.errors ?? {};

  const [lastSave, setLastSave] = useState(state.savedAt);
  if (state.savedAt !== lastSave) {
    setLastSave(state.savedAt);
    setSaved(d);
  }
  const dirty = useMemo(() => JSON.stringify(d) !== JSON.stringify(saved), [d, saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => setD((x) => ({ ...x, [key]: value }));

  return (
    <form
      action={(form) => {
        form.set("payload", JSON.stringify(d));
        action(form);
      }}
      className="pb-8"
    >
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-stone/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <p className="text-[15px]" aria-live="polite">
          {pending ? (
            "Saving…"
          ) : state.error ? (
            <span className="font-medium text-sold">{state.error}</span>
          ) : dirty ? (
            <span className="font-medium text-warn">Unsaved changes</span>
          ) : state.savedAt ? (
            <span className="font-medium text-ok">All changes saved</span>
          ) : (
            <span className="text-soft">{d.id ? "No changes" : "New story"}</span>
          )}
        </p>
        <div className="flex gap-3">
          <Link href="/admin/journal" className={button.secondary}>
            {dirty ? "Discard" : "Back"}
          </Link>
          <button type="submit" className={button.primary} disabled={pending}>
            {pending ? "Saving…" : d.id ? "Save changes" : d.status === "published" ? "Publish story" : "Save draft"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <div className="space-y-6">
          <Card title="Story">
            <div className="space-y-5">
              <Field label="Title" error={errors.title}>
                <input
                  className={input}
                  value={d.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setD((x) => ({ ...x, title, slug: slugTouched ? x.slug : slugify(title) }));
                  }}
                  placeholder="e.g. The Àràbì Set: stripes woven, not printed"
                />
              </Field>
              <Field label="Summary" hint="One or two sentences. Shown on the Journal page, the homepage and in search results." error={errors.excerpt}>
                <textarea className={textarea} rows={3} value={d.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
              </Field>
              <Field
                label="Story"
                hint={
                  <>
                    Leave a blank line between paragraphs. Start a line with <code>## </code> for a small heading, or <code>&gt; </code> for a pull
                    quote.
                  </>
                }
                error={errors.body}
              >
                <textarea className={`${textarea} font-[inherit] leading-relaxed`} rows={18} value={d.body} onChange={(e) => set("body", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Cover photo" description="Shown at the top of the story and on its card. Portrait photos work best.">
            <ImageUploader images={d.cover} onChange={(cover) => set("cover", cover)} multiple={false} defaultAlt={d.title} />
            {errors.cover && <p className="mt-3 text-[14px] font-medium text-sold">{errors.cover}</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-[14px] font-medium">Status</legend>
                <div className="flex gap-2">
                  {(["published", "draft"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={d.status === s}
                      onClick={() => set("status", s)}
                      className={`h-10 rounded-full border px-4 text-[14px] ${d.status === s ? "border-ink bg-ink text-paper" : "border-[#d6cfc5] bg-paper hover:border-ink"}`}
                    >
                      {s === "published" ? "Published" : "Draft"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Field label="Date" hint="Shown on the story. Leave empty to use the day it is published." error={errors.date}>
                <input type="date" className={input} value={d.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Topic" hint="A short label above the title.">
                <input className={input} list="journal-topics" value={d.topic} onChange={(e) => set("topic", e.target.value)} />
                <datalist id="journal-topics">
                  {TOPICS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="Link" hint={`shoptafara.com/journal/${d.slug || "…"}`}>
                <input
                  className={input}
                  value={d.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
            </div>
          </Card>

          <Card title="Shop the story" description="Pieces shown under the story.">
            {products.length === 0 ? (
              <p className="text-[14px] text-soft">No products yet.</p>
            ) : (
              <ul className="space-y-2">
                {products.map((p) => {
                  const on = d.products.includes(p.slug);
                  return (
                    <li key={p.slug}>
                      <label className="flex items-center gap-3 text-[15px]">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => set("products", on ? d.products.filter((s) => s !== p.slug) : [...d.products, p.slug])}
                          className="h-4 w-4 accent-ink"
                        />
                        {p.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}
