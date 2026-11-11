"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import type { Colour, Product } from "@/lib/types";
import { photosFor, useProductColour } from "./product-colour";

/** Option pickers + add to bag. Clothing: colour and size. TAFARA HOME: scent and size, stock-aware. */
export function ProductPurchase({ product, colours }: { product: Product; colours: Colour[] }) {
  return product.kind === "clothing" ? <ClothingPurchase product={product} colours={colours} /> : <HomePurchase product={product} />;
}

function ClothingPurchase({ product, colours }: { product: Extract<Product, { kind: "clothing" }>; colours: Colour[] }) {
  const options = colours.filter((c) => product.colours.includes(c.key));
  const { colour: colourKey, setColour: chooseColour } = useProductColour();
  // A piece in one colour needs no choice.
  const colour = options.find((c) => c.key === colourKey) ?? (options.length === 1 ? options[0] : null);
  const setColour = (c: Colour) => chooseColour(c.key);
  const [size, setSize] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const needsSize = product.sizes.length > 0;
  const missingColour = !colour;
  const missingSize = needsSize && !size;

  const add = () => {
    setTried(true);
    if (missingColour || missingSize) return;
    addToCart({
      key: [product.slug, colour.key, size].filter(Boolean).join("|"),
      slug: product.slug,
      name: product.name,
      image: photosFor(product.images, colour.key)[0].src,
      price: product.price,
      kind: "clothing",
      options: [{ label: "Colour", value: colour.name }, ...(size ? [{ label: "Size", value: size }] : [])],
    });
  };

  return (
    <div>
      <fieldset className="mt-9">
        <legend className="caps flex w-full justify-between">
          <span>
            Colour<span className="text-muted">{colour ? `: ${colour.name}` : ""}</span>
          </span>
        </legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {options.map((c) => {
            const selected = colour?.key === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setColour(c)}
                aria-pressed={selected}
                aria-label={c.name}
                title={c.name}
                className={`group flex w-[58px] flex-col items-center gap-2 pb-1 outline-offset-2`}
              >
                <span
                  className={`block h-[42px] w-[42px] ring-1 ring-offset-[3px] transition-shadow duration-300 ${
                    selected ? "ring-ink" : "ring-black/10 group-hover:ring-black/40"
                  }`}
                  style={{ background: c.hex }}
                />
                <span className={`text-[11px] leading-tight transition-colors ${selected ? "text-ink" : "text-muted"}`}>{c.name}</span>
              </button>
            );
          })}
        </div>
        {tried && missingColour && <p className="mt-2 text-[13px] text-sold">Please choose a colour.</p>}
      </fieldset>

      {needsSize && (
        <fieldset className="mt-8">
          <legend className="caps flex w-full items-baseline justify-between">
            <span>
              Size<span className="text-muted">{size ? `: ${size}` : ""}</span>
            </span>
          </legend>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`h-11 border text-[12px] tracking-wide transition-colors duration-300 ${
                  size === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                }`}
              >
                {s.replace("UK ", "")}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">UK sizing</p>
          {tried && missingSize && <p className="mt-2 text-[13px] text-sold">Please choose a size.</p>}
        </fieldset>
      )}

      <p className="mt-8 border-l border-ink pl-4 text-[14px] leading-relaxed">
        <span className="font-normal">Made to order.</span> Ready to ship in 5–7 working days.
      </p>

      <button type="button" onClick={add} className="btn btn-solid mt-6 w-full">
        Add to bag <span className="text-paper/60">·</span> {formatNaira(product.price)}
      </button>

      <div className="mt-5 flex justify-center gap-8">
        <Link href="/size-guide" className="caps-sm link-line">
          Size guide
        </Link>
        <Link href="/colour-card" className="caps-sm link-line">
          Colour card
        </Link>
      </div>
    </div>
  );
}

function HomePurchase({ product }: { product: Extract<Product, { kind: "home" }> }) {
  const scents = useMemo(() => [...new Set(product.variants.map((v) => v.scent))], [product]);
  const sizes = useMemo(() => [...new Set(product.variants.map((v) => v.size))], [product]);
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [scent, setScent] = useState(firstInStock.scent);
  const [size, setSize] = useState(firstInStock.size);

  const variant = product.variants.find((v) => v.scent === scent && v.size === size);
  const soldOut = !variant || variant.stock <= 0;
  const stockOf = (sc: string, sz: string) => product.variants.find((v) => v.scent === sc && v.size === sz)?.stock ?? 0;

  const add = () => {
    if (!variant || soldOut) return;
    addToCart({
      key: `${product.slug}|${variant.id}`,
      slug: product.slug,
      name: product.name,
      image: product.images[0].src,
      price: variant.price,
      kind: "home",
      maxQty: variant.stock,
      options: [
        { label: "Scent", value: variant.scent },
        { label: "Size", value: variant.size },
      ],
    });
  };

  return (
    <div>
      {scents.length > 1 && (
        <OptionRow label="Scent" value={scent}>
          {scents.map((s) => (
            <Choice key={s} selected={s === scent} unavailable={!sizes.some((sz) => stockOf(s, sz) > 0)} onClick={() => setScent(s)}>
              {s}
            </Choice>
          ))}
        </OptionRow>
      )}
      {sizes.length > 1 && (
        <OptionRow label="Size" value={size}>
          {sizes.map((s) => (
            <Choice key={s} selected={s === size} unavailable={stockOf(scent, s) <= 0} onClick={() => setSize(s)}>
              {s}
            </Choice>
          ))}
        </OptionRow>
      )}

      <p className="mt-8 text-[14px]" aria-live="polite">
        {soldOut ? (
          <span className="text-sold">Sold out. We are pouring more.</span>
        ) : variant.stock <= 3 ? (
          <span>Only {variant.stock} left. Ready to ship in 1–3 working days.</span>
        ) : (
          <span>In stock. Ready to ship in 1–3 working days.</span>
        )}
      </p>

      <button type="button" onClick={add} disabled={soldOut} className="btn btn-solid mt-6 w-full">
        {soldOut ? "Sold out" : <>Add to bag <span className="text-paper/60">·</span> {formatNaira(variant.price)}</>}
      </button>
    </div>
  );
}

function OptionRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-8">
      <legend className="caps">
        {label}
        <span className="text-muted">: {value}</span>
      </legend>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Choice({ selected, unavailable, onClick, children }: { selected: boolean; unavailable: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-11 border px-5 text-[13px] transition-colors duration-300 ${
        selected ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
      } ${unavailable && !selected ? "text-muted line-through decoration-muted/60" : ""}`}
    >
      {children}
      {unavailable && <span className="sr-only"> (sold out)</span>}
    </button>
  );
}
