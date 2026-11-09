// Adds one real product from a JSON spec: converts its photos (HEIC/JPG/PNG) to web-sized JPGs with
// macOS `sips`, uploads them to Supabase Storage and saves the product as the admin would.
// Usage: pnpm db:import-product path/to/product.json
// Re-running with the same name updates that product (photos are uploaded again).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { saveImage } from "../src/lib/db/media.ts";
import { type ProductInput, fetchProducts, saveProduct, slugify } from "../src/lib/db/products.ts";
import { COLOURS } from "../src/lib/fabric.ts";
import type { ColourKey, ProductImage } from "../src/lib/types.ts";

type Spec = {
  name: string;
  status?: "active" | "draft";
  categories: string[];
  collection?: string;
  description: string;
  price: number;
  colours: ColourKey[];
  sizes: string[];
  specs: { label: string; value: string }[];
  /** Paths relative to the spec file (or absolute), in display order. */
  photos: { file: string; colour?: ColourKey; alt: string }[];
};

const LONG_EDGE = 2400;

const specPath = resolve(process.argv[2] ?? "");
const spec: Spec = JSON.parse(readFileSync(specPath, "utf8"));
const unknown = spec.colours.filter((c) => !COLOURS.some((x) => x.key === c));
if (unknown.length) throw new Error(`Unknown colours: ${unknown.join(", ")}. Add them to src/lib/fabric.ts first.`);

const work = mkdtempSync(join(tmpdir(), "tafara-import-"));
const images: ProductImage[] = [];
try {
  for (const [i, photo] of spec.photos.entries()) {
    const source = resolve(dirname(specPath), photo.file);
    const out = join(work, `${i + 1}.jpg`);
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", "-Z", String(LONG_EDGE), source, "--out", out], { stdio: "ignore" });
    const file = new File([readFileSync(out)], `${i + 1}.jpg`, { type: "image/jpeg" });
    const src = await saveImage(file);
    images.push({ src, alt: photo.alt, ...(photo.colour ? { colour: photo.colour } : {}) });
    console.log(`  uploaded ${basename(source)}${photo.colour ? ` (${photo.colour})` : ""}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const existing = (await fetchProducts()).find((p) => p.slug === slugify(spec.name));
const product = await saveProduct({
  id: existing?.id,
  slug: slugify(spec.name),
  kind: "clothing",
  status: spec.status ?? "active",
  name: spec.name,
  categories: spec.categories,
  collection: spec.collection,
  description: spec.description,
  price: spec.price,
  colours: spec.colours,
  sizes: spec.sizes,
  specs: spec.specs,
  images,
  sortOrder: existing?.sortOrder ?? 0,
} as ProductInput);

console.log(`${existing ? "Updated" : "Added"} ${product.name} → /products/${product.slug} (${product.status})`);
