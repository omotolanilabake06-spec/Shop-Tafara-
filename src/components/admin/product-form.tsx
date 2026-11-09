"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { type ProductDraft, type SaveState, saveProductAction } from "@/app/admin/(console)/products/actions";
import { formatNaira } from "@/lib/format";
import type { Category, Collection, Colour } from "@/lib/types";
import { ImageUploader } from "./image-uploader";
import { Card, Field, button, input, textarea } from "./ui";

const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SPEC_HINTS: Record<string, string> = {
  Fabric: "e.g. Silk satin, fully lined.",
  Fit: "e.g. True to size. Fitted at the bodice.",
  Care: "e.g. Dry clean only.",
};

const newVariantId = () => `var_${Math.random().toString(36).slice(2, 10)}`;

export function ProductForm({
  initial,
  categories,
  collections,
  colours,
  standardSizes,
}: {
  initial: ProductDraft;
  categories: Category[];
  collections: Collection[];
  colours: Colour[];
  standardSizes: string[];
}) {
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProductAction, {});
  const [customSize, setCustomSize] = useState("");
  const errors = state.errors ?? {};

  // After a successful save, the current form becomes the saved baseline.
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

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setD((x) => ({ ...x, [key]: value }));
  const dept = d.kind === "home" ? "home" : "clothing";
  const deptCategories = categories.filter((c) => c.department === dept);
  const tops = deptCategories.filter((c) => !c.parent);

  function toggleCategory(c: Category) {
    const on = d.categories.includes(c.slug);
    let next = on ? d.categories.filter((s) => s !== c.slug) : [...d.categories, c.slug];
    // A sub-category also lists the piece in its parent (a mini dress is also a dress).
    if (!on && c.parent && !next.includes(c.parent)) next = [...next, c.parent];
    // Unticking a parent unticks its children.
    if (on) next = next.filter((s) => categories.find((x) => x.slug === s)?.parent !== c.slug);
    set("categories", next);
  }

  const sizeList = [...standardSizes, ...d.sizes.filter((s) => !standardSizes.includes(s))];

  return (
    <form
      action={(form) => {
        form.set("payload", JSON.stringify(d));
        action(form);
      }}
      className="pb-8"
    >
      {/* Save bar */}
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
            <span className="text-soft">{d.id ? "No changes" : "New product"}</span>
          )}
        </p>
        <div className="flex gap-3">
          <Link href="/admin/products" className={button.secondary}>
            {dirty ? "Discard" : "Back"}
          </Link>
          <button type="submit" className={button.primary} disabled={pending}>
            {pending ? "Saving…" : d.id ? "Save changes" : d.status === "active" ? "Publish product" : "Save draft"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <div className="space-y-6">
          <Card title="Details">
            <div className="space-y-5">
              <Field label="Name" error={errors.name}>
                <input
                  className={input}
                  value={d.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setD((x) => ({ ...x, name, slug: slugTouched ? x.slug : slugify(name) }));
                  }}
                  placeholder="e.g. Atrium Mini Dress"
                />
              </Field>
              <Field label="Description" hint="One or two sentences. Shown under the price on the product page." error={errors.description}>
                <textarea className={textarea} value={d.description} onChange={(e) => set("description", e.target.value)} rows={4} />
              </Field>
            </div>
          </Card>

          <Card title="Photos" description="The first photo shows in the shop grid; the second appears when a shopper hovers over it. If a piece comes in more than one colour, set the colour each photo shows: choosing a colour in the shop then shows its photos.">
            <ImageUploader
              images={d.images}
              onChange={(images) => set("images", images)}
              defaultAlt={d.name}
              colourOptions={d.kind === "clothing" ? colours.filter((c) => d.colours.includes(c.key)) : undefined}
            />
            {errors.images && <p className="mt-3 text-[14px] font-medium text-sold">{errors.images}</p>}
          </Card>

          {d.kind === "clothing" ? (
            <Card title="Price, colours and sizes" description="Made to order: one price for every colour and size.">
              <div className="space-y-6">
                <Field label="Price (₦)" error={errors.price} className="max-w-[240px]">
                  <input className={input} inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value)} placeholder="185000" />
                  {Number(d.price) > 0 && <span className="mt-1.5 block text-[14px] text-soft">Shows as {formatNaira(Number(d.price))}</span>}
                </Field>

                <fieldset>
                  <legend className="mb-1.5 text-[14px] font-medium">Fabric colours available</legend>
                  <p className="mb-3 text-[13px] text-soft">The first colour you pick is the one shown first on the product page.</p>
                  <div className="flex flex-wrap gap-2">
                    {colours.map((c) => {
                      const on = d.colours.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("colours", on ? d.colours.filter((k) => k !== c.key) : [...d.colours, c.key])}
                          className={`flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-[14px] transition-colors ${
                            on ? "border-ink bg-ink text-paper" : "border-[#d6cfc5] bg-paper hover:border-ink"
                          }`}
                        >
                          <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: c.hex }} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-4 text-[14px]">
                    <button type="button" className={button.quiet} onClick={() => set("colours", colours.map((c) => c.key))}>
                      Select all
                    </button>
                    <button type="button" className={button.quiet} onClick={() => set("colours", [])}>
                      Clear
                    </button>
                  </div>
                  {errors.colours && <p className="mt-2 text-[14px] font-medium text-sold">{errors.colours}</p>}
                </fieldset>

                <fieldset>
                  <legend className="mb-1.5 text-[14px] font-medium">Sizes</legend>
                  <p className="mb-3 text-[13px] text-soft">Leave all unticked for one-size pieces such as scarves and bags.</p>
                  <div className="flex flex-wrap gap-2">
                    {sizeList.map((s) => {
                      const on = d.sizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("sizes", on ? d.sizes.filter((x) => x !== s) : sizeList.filter((x) => x === s || d.sizes.includes(x)))}
                          className={`h-10 min-w-[64px] rounded-[3px] border px-3 text-[14px] transition-colors ${
                            on ? "border-ink bg-ink text-paper" : "border-[#d6cfc5] bg-paper hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex max-w-[360px] gap-2">
                    <input
                      className={`${input} h-10`}
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      placeholder="Add another size, e.g. UK 20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customSize.trim() && !d.sizes.includes(customSize.trim())) set("sizes", [...d.sizes, customSize.trim()]);
                          setCustomSize("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={`${button.secondary} h-10`}
                      onClick={() => {
                        if (customSize.trim() && !d.sizes.includes(customSize.trim())) set("sizes", [...d.sizes, customSize.trim()]);
                        setCustomSize("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                </fieldset>
              </div>
            </Card>
          ) : (
            <Card title="Scents, sizes and stock" description="Ready-made: each scent and size has its own price and stock. At 0 it shows as sold out.">
              <div className="space-y-3">
                <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-3 text-[13px] font-medium text-soft sm:grid">
                  <span>Scent</span>
                  <span>Size</span>
                  <span>Price (₦)</span>
                  <span>In stock</span>
                  <span className="w-[72px]" />
                </div>
                {d.variants.map((v, i) => {
                  const update = (patch: Partial<typeof v>) => set("variants", d.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <div key={v.id}>
                      <div className="grid grid-cols-2 gap-3 rounded-[3px] border border-line p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:border-0 sm:p-0">
                        <input className={`${input} col-span-2 sm:col-span-1`} value={v.scent} onChange={(e) => update({ scent: e.target.value })} placeholder="Oud & Amber" aria-label="Scent" />
                        <input className={input} value={v.size} onChange={(e) => update({ size: e.target.value })} placeholder="200 g" aria-label="Size" />
                        <input className={input} inputMode="numeric" value={v.price} onChange={(e) => update({ price: e.target.value })} placeholder="35000" aria-label="Price" />
                        <input
                          className={`${input} ${Number(v.stock) === 0 && v.stock !== "" ? "border-sold text-sold" : ""}`}
                          inputMode="numeric"
                          value={v.stock}
                          onChange={(e) => update({ stock: e.target.value })}
                          placeholder="0"
                          aria-label="Stock"
                        />
                        <button
                          type="button"
                          onClick={() => set("variants", d.variants.filter((_, j) => j !== i))}
                          className="h-11 w-[72px] rounded-[3px] text-[14px] text-sold hover:bg-[#fcf4f2]"
                        >
                          Remove
                        </button>
                      </div>
                      {errors[`variant.${i}`] && <p className="mt-1 text-[14px] font-medium text-sold">{errors[`variant.${i}`]}</p>}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className={button.secondary}
                  onClick={() => {
                    const last = d.variants.at(-1);
                    set("variants", [...d.variants, { id: newVariantId(), scent: last?.scent ?? "", size: "", price: "", stock: "" }]);
                  }}
                >
                  + Add scent or size
                </button>
                {errors.variants && <p className="text-[14px] font-medium text-sold">{errors.variants}</p>}
              </div>
            </Card>
          )}

          <Card title="Product details" description="Shown as a list on the product page, e.g. Fabric, Fit, Care.">
            <div className="space-y-3">
              {d.specs.map((s, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                  <input
                    className={input}
                    value={s.label}
                    onChange={(e) => set("specs", d.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Fabric"
                    aria-label="Detail name"
                  />
                  <input
                    className={input}
                    value={s.value}
                    onChange={(e) => set("specs", d.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    placeholder={SPEC_HINTS[s.label] ?? "Details"}
                    aria-label="Detail"
                  />
                  <button type="button" onClick={() => set("specs", d.specs.filter((_, j) => j !== i))} className="h-11 rounded-[3px] px-3 text-[14px] text-sold hover:bg-[#fcf4f2]">
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className={button.secondary} onClick={() => set("specs", [...d.specs, { label: "", value: "" }])}>
                + Add detail
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-2">
              {(
                [
                  ["active", "Published", "On sale in the shop."],
                  ["draft", "Draft", "Saved here only. Customers can't see it."],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-[3px] border px-4 py-3 ${d.status === value ? "border-ink bg-[#faf8f5]" : "border-line"}`}
                >
                  <input type="radio" name="status-choice" checked={d.status === value} onChange={() => set("status", value)} className="mt-1 h-4 w-4 accent-ink" />
                  <span>
                    <span className="block font-medium">{label}</span>
                    <span className="block text-[14px] text-soft">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {d.id && initial.status === "active" && (
              <Link href={`/products/${initial.slug}`} target="_blank" className={`${button.quiet} mt-4`}>
                View in shop ↗
              </Link>
            )}
          </Card>

          <Card title="Where it appears">
            <fieldset>
              <legend className="mb-2 text-[14px] font-medium">Categories</legend>
              <ul className="space-y-1">
                {tops.map((top) => (
                  <li key={top.slug}>
                    <CategoryTick category={top} checked={d.categories.includes(top.slug)} onToggle={() => toggleCategory(top)} />
                    <ul className="ml-6">
                      {deptCategories
                        .filter((c) => c.parent === top.slug)
                        .map((c) => (
                          <li key={c.slug}>
                            <CategoryTick category={c} checked={d.categories.includes(c.slug)} onToggle={() => toggleCategory(c)} />
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ul>
              {errors.categories && <p className="mt-2 text-[14px] font-medium text-sold">{errors.categories}</p>}
            </fieldset>

            {d.kind === "clothing" && (
              <Field label="Collection" className="mt-5" error={errors.collection}>
                <select className={input} value={d.collection} onChange={(e) => set("collection", e.target.value)}>
                  <option value="">None</option>
                  {collections.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Position" hint="Lower numbers show first in the shop." className="mt-5" error={errors.sortOrder}>
              <input className={`${input} max-w-[120px]`} inputMode="numeric" value={d.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </Field>
          </Card>

          <Card title="Web address">
            <Field label="Link" hint={`shoptafara.com/products/${d.slug || "…"}`}>
              <input
                className={input}
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            {d.id && d.slug !== initial.slug && (
              <p className="mt-2 text-[13px] text-warn">Changing the link breaks any old links you have shared to this product.</p>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}

function CategoryTick({ category, checked, onToggle }: { category: Category; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[15px]">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 accent-ink" />
      {category.name}
      {!category.visible && <span className="rounded-full bg-[#eee9e2] px-2 text-[12px] text-soft">Hidden</span>}
    </label>
  );
}
