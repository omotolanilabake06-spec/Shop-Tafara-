import { COLOURS } from "@/lib/fabric";
import { displayPrice, isSoldOut } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

const hexFor = new Map(COLOURS.map((c) => [c.key, c.hex]));

export function ProductGrid({ products, eagerCount = 0 }: { products: Product[]; eagerCount?: number }) {
  if (products.length === 0) {
    return <p className="display py-24 text-center text-[26px] text-muted">New pieces are on their way.</p>;
  }
  // Fewer than four pieces: keep the card size and centre the row instead of leaving empty columns.
  const desktop =
    products.length >= 4
      ? "lg:grid-cols-4"
      : ["", "lg:mx-auto lg:max-w-[25%] lg:grid-cols-1", "lg:mx-auto lg:max-w-[50%] lg:grid-cols-2", "lg:mx-auto lg:max-w-[75%] lg:grid-cols-3"][products.length];
  return (
    <div className={`grid grid-cols-2 gap-x-2.5 gap-y-9 lg:gap-y-12 ${desktop}`}>
      {products.map((p, i) => (
        <ProductCard
          key={p.slug}
          eager={i < eagerCount}
          product={{
            slug: p.slug,
            name: p.name,
            price: displayPrice(p),
            images: p.images,
            soldOut: isSoldOut(p),
            swatches: p.kind === "clothing" ? p.colours.map((c) => hexFor.get(c)!) : undefined,
          }}
        />
      ))}
    </div>
  );
}
