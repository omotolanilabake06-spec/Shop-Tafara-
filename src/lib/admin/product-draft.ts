import type { ProductDraft } from "@/app/admin/(console)/products/actions";
import { CLOTHING_SIZES } from "@/lib/fabric";
import type { Product } from "@/lib/types";

/** The editable form state for a product. */
export function toDraft(p: Product): ProductDraft {
  return {
    id: p.id,
    kind: p.kind,
    name: p.name,
    slug: p.slug,
    description: p.description,
    status: p.status,
    categories: p.categories,
    collection: p.collection ?? "",
    images: p.images,
    sortOrder: String(p.sortOrder),
    price: p.kind === "clothing" ? String(p.price) : "",
    colours: p.kind === "clothing" ? p.colours : [],
    sizes: p.kind === "clothing" ? p.sizes : [],
    variants: p.kind === "home" ? p.variants.map((v) => ({ ...v, price: String(v.price), stock: String(v.stock) })) : [],
    specs: p.specs,
  };
}

export function blankDraft(kind: Product["kind"], sortOrder: number): ProductDraft {
  return {
    kind,
    name: "",
    slug: "",
    description: "",
    status: "draft",
    categories: kind === "home" ? ["tafara-home"] : [],
    collection: "",
    images: [],
    sortOrder: String(sortOrder),
    price: "",
    colours: [],
    sizes: kind === "clothing" ? [...CLOTHING_SIZES] : [],
    variants: kind === "home" ? [{ id: `var_${crypto.randomUUID().slice(0, 8)}`, scent: "", size: "", price: "", stock: "" }] : [],
    specs:
      kind === "clothing"
        ? [
            { label: "Fabric", value: "" },
            { label: "Fit", value: "" },
            { label: "Care", value: "" },
          ]
        : [],
  };
}
