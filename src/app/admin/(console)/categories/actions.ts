"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { deleteCategory, deleteCollection, fetchCategories, saveCategory, saveCollection, slugify } from "@/lib/db/products";
import type { Category } from "@/lib/types";

export type CatState = { error?: string; ok?: string };

const done = (ok: string): CatState => {
  updateTag("catalog");
  refresh();
  return { ok };
};

export async function saveCategoryAction(_: CatState, form: FormData): Promise<CatState> {
  await requireAdmin();
  const isNew = form.get("new") === "1";
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Give the category a name." };
  const slug = isNew ? slugify(String(form.get("slug") || name)) : String(form.get("slug"));
  if (!slug) return { error: "Choose a link for the category." };
  const categories = await fetchCategories();
  const existing = categories.find((c) => c.slug === slug);
  const parent = String(form.get("parent") ?? "") || undefined;
  if (parent === slug) return { error: "A category can't sit inside itself." };
  const parentCat = parent ? categories.find((c) => c.slug === parent) : undefined;
  if (parent && !parentCat) return { error: "That parent category no longer exists." };
  if (parentCat?.parent) return { error: "Sub-categories can only go one level deep." };

  const category: Category = {
    slug,
    name,
    parent,
    visible: form.get("visible") === "on",
    department: (existing?.department ?? (form.get("department") === "home" ? "home" : "clothing")) as Category["department"],
    blurb: String(form.get("blurb") ?? "").trim() || undefined,
    sortOrder: Number(form.get("sortOrder")) || existing?.sortOrder,
  };
  const result = await saveCategory(category, isNew);
  if ("error" in result) return { error: result.error };
  return done(isNew ? `Added ${name}.` : "Saved.");
}

export async function deleteCategoryAction(_: CatState, form: FormData): Promise<CatState> {
  await requireAdmin();
  const result = await deleteCategory(String(form.get("slug")));
  if ("error" in result) return { error: result.error };
  return done("Deleted.");
}

export async function saveCollectionAction(_: CatState, form: FormData): Promise<CatState> {
  await requireAdmin();
  const isNew = form.get("new") === "1";
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Give the collection a name." };
  const slug = isNew ? slugify(name) : String(form.get("slug"));
  const image = String(form.get("image") ?? "");
  if (!image) return { error: "Add a campaign photo for the collection." };
  const result = await saveCollection(
    { slug, name, tagline: String(form.get("tagline") ?? "").trim(), intro: String(form.get("intro") ?? "").trim(), image },
    isNew,
  );
  if ("error" in result) return { error: result.error };
  return done(isNew ? `Added ${name}.` : "Saved.");
}

export async function deleteCollectionAction(_: CatState, form: FormData): Promise<CatState> {
  await requireAdmin();
  const result = await deleteCollection(String(form.get("slug")));
  if ("error" in result) return { error: result.error };
  return done("Deleted.");
}
