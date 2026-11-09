"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type CardProduct = {
  slug: string;
  name: string;
  price: string;
  images: { src: string; alt: string }[];
  soldOut?: boolean;
  swatches?: string[];
};

/**
 * Large 2:3 photo with the name and price centred underneath.
 * Desktop: second photo fades in on hover. Touch: swipe between photos.
 */
export function ProductCard({ product, eager = false }: { product: CardProduct; eager?: boolean }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const [front, back] = product.images;

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="block" aria-label={`${product.name}, ${product.price}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-stone">
          {/* Touch: horizontal snap carousel */}
          <div
            ref={track}
            onScroll={onScroll}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(hover:hover)]:hidden"
          >
            {product.images.map((im, i) => (
              <div key={im.src} className="relative h-full w-full shrink-0 snap-center">
                <Image
                  src={im.src}
                  alt={i === 0 ? im.alt : ""}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  loading={eager && i === 0 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {/* Hover devices: crossfade to second image */}
          <div className="absolute inset-0 hidden [@media(hover:hover)]:block">
            <Image
              src={front.src}
              alt={front.alt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              loading={eager ? "eager" : "lazy"}
              className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-soft)] group-hover:scale-[1.02]"
            />
            {back && (
              <Image
                src={back.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-soft)] group-hover:opacity-100"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 [@media(hover:hover)]:hidden" aria-hidden>
              {product.images.map((im, i) => (
                <span key={im.src} className={`h-[3px] w-[3px] rounded-full bg-white transition-opacity ${i === index ? "opacity-100" : "opacity-50"}`} />
              ))}
            </div>
          )}
          {product.soldOut && <span className="caps-sm absolute left-3 top-3 bg-paper/90 px-2.5 py-1.5">Sold out</span>}
        </div>
        <div className="px-1 pt-3.5 pb-1 text-center">
          <h3 className="text-[12px] uppercase leading-snug tracking-[0.12em]">{product.name}</h3>
          <p className="mt-1.5 text-[13px] tabular-nums text-muted">{product.price}</p>
          {product.swatches && product.swatches.length > 0 && (
            <ul className="mt-2.5 flex justify-center gap-1.5" aria-label="Available colours">
              {product.swatches.slice(0, 6).map((hex) => (
                <li key={hex} className="h-2.5 w-2.5 ring-1 ring-black/10" style={{ background: hex }} />
              ))}
              {product.swatches.length > 6 && <li className="caps-sm leading-[10px] text-muted">+{product.swatches.length - 6}</li>}
            </ul>
          )}
        </div>
      </Link>
    </article>
  );
}
