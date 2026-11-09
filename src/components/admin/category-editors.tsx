"use client";

import { useActionState, useState } from "react";
import {
  type CatState,
  deleteCategoryAction,
  deleteCollectionAction,
  saveCategoryAction,
  saveCollectionAction,
} from "@/app/admin/(console)/categories/actions";
import type { Category, Collection } from "@/lib/types";
import { ImageUploader } from "./image-uploader";
import { Badge, Field, button, input, textarea } from "./ui";

function Message({ state }: { state: CatState }) {
  if (state.error) return <p className="text-[14px] font-medium text-sold">{state.error}</p>;
  if (state.ok) return <p className="text-[14px] font-medium text-ok">{state.ok}</p>;
  return null;
}

export function CategoryRow({ category, parents, productCount }: { category: Category; parents: Category[]; productCount: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CatState, FormData>(saveCategoryAction, {});
  const [delState, del, deleting] = useActionState<CatState, FormData>(deleteCategoryAction, {});

  return (
    <li className={category.parent ? "pl-6 sm:pl-10" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="min-w-0">
          <p className="font-medium">
            {category.parent && <span className="mr-1.5 text-soft">↳</span>}
            {category.name}
          </p>
          <p className="text-[14px] text-soft">
            {productCount} {productCount === 1 ? "product" : "products"} · /shop/{category.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {category.visible ? <Badge tone="green">Showing in shop</Badge> : <Badge tone="amber">Hidden</Badge>}
          <button type="button" className={button.secondary} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {open && (
        <div className="mb-4 rounded-[4px] border border-line bg-[#faf8f5] p-5">
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="slug" value={category.slug} />
            <Field label="Name">
              <input name="name" defaultValue={category.name} className={input} />
            </Field>
            {category.department === "clothing" ? (
              <Field label="Sits inside">
                <select name="parent" defaultValue={category.parent ?? ""} className={input}>
                  <option value="">Nothing (top level)</option>
                  {parents
                    .filter((p) => p.slug !== category.slug)
                    .map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : (
              <span />
            )}
            <Field label="Intro line" hint="Optional. Shown under the title on the category page." className="sm:col-span-2">
              <input name="blurb" defaultValue={category.blurb ?? ""} className={input} />
            </Field>
            <Field label="Position in menus" className="max-w-[160px]">
              <input name="sortOrder" defaultValue={category.sortOrder ?? ""} inputMode="numeric" className={input} />
            </Field>
            <label className="flex items-start gap-3 self-end rounded-[3px] border border-line bg-paper px-4 py-3">
              <input type="checkbox" name="visible" defaultChecked={category.visible} className="mt-1 h-4 w-4 accent-ink" />
              <span>
                <span className="block font-medium">Show in the shop</span>
                <span className="block text-[14px] text-soft">When hidden, its products are hidden too.</span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" className={button.primary} disabled={pending}>
                {pending ? "Saving…" : "Save category"}
              </button>
              <Message state={state} />
            </div>
          </form>
          <form action={del} className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <input type="hidden" name="slug" value={category.slug} />
            <button type="submit" className={button.danger} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete category"}
            </button>
            <Message state={delState} />
          </form>
        </div>
      )}
    </li>
  );
}

export function NewCategory({ parents }: { parents: Category[] }) {
  const [state, action, pending] = useActionState<CatState, FormData>(saveCategoryAction, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="new" value="1" />
      <input type="hidden" name="visible" value="on" />
      <Field label="New category name">
        <input name="name" placeholder="e.g. Kaftans" className={input} />
      </Field>
      <Field label="Sits inside">
        <select name="parent" defaultValue="" className={input}>
          <option value="">Nothing (top level)</option>
          {parents.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <button type="submit" className={button.primary} disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </button>
      <div className="sm:col-span-3">
        <Message state={state} />
      </div>
    </form>
  );
}

export function CollectionEditor({ collection, productCount }: { collection?: Collection; productCount?: number }) {
  const isNew = !collection;
  const [image, setImage] = useState(collection?.image ? [{ src: collection.image, alt: collection.name }] : []);
  const [state, action, pending] = useActionState<CatState, FormData>(saveCollectionAction, {});
  const [delState, del, deleting] = useActionState<CatState, FormData>(deleteCollectionAction, {});

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <ImageUploader images={image} onChange={setImage} multiple={false} aspect="aspect-[4/3]" defaultAlt={collection?.name ?? ""} />
      <div>
        <form action={action} className="space-y-4">
          {!isNew && <input type="hidden" name="slug" value={collection.slug} />}
          {isNew && <input type="hidden" name="new" value="1" />}
          <input type="hidden" name="image" value={image[0]?.src ?? ""} />
          <Field label="Name">
            <input name="name" defaultValue={collection?.name} className={input} placeholder="e.g. The Inner Courtyard" />
          </Field>
          <Field label="Tagline" hint="One short line under the name on the homepage.">
            <input name="tagline" defaultValue={collection?.tagline} className={input} />
          </Field>
          <Field label="Introduction">
            <textarea name="intro" defaultValue={collection?.intro} rows={3} className={textarea} />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={button.primary} disabled={pending}>
              {pending ? "Saving…" : isNew ? "Add collection" : "Save collection"}
            </button>
            <Message state={state} />
          </div>
        </form>
        {!isNew && (
          <form action={del} className="mt-4 flex flex-wrap items-center gap-3">
            <input type="hidden" name="slug" value={collection.slug} />
            <button type="submit" className={button.danger} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete collection"}
            </button>
            <span className="text-[14px] text-soft">
              {productCount} {productCount === 1 ? "product" : "products"} in this collection
            </span>
            <Message state={delState} />
          </form>
        )}
      </div>
    </div>
  );
}
