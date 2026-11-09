"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { photosFor, useProductColour } from "./product-colour";

/** Shows the chosen colour's photos once a colour is picked; remounts so the swipe starts at the first one. */
export function ProductGallery({ images }: { images: ProductImage[] }) {
  const { colour } = useProductColour();
  return <Photos key={colour ?? "all"} images={photosFor(images, colour)} />;
}

function Photos({ images }: { images: ProductImage[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  return (
    <div>
      {/* Mobile: swipe */}
      <div className="relative lg:hidden">
        <div
          ref={track}
          onScroll={() => {
            const el = track.current;
            if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((im, i) => (
            <div key={im.src} className="relative aspect-[2/3] w-full shrink-0 snap-center bg-stone">
              <Image src={im.src} alt={im.alt} fill sizes="100vw" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} className="object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-hidden>
            {images.map((im, i) => (
              <span key={im.src} className={`h-px w-6 bg-white transition-opacity ${i === index ? "opacity-100" : "opacity-40"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: two-up grid of large photos */}
      <div className="hidden grid-cols-2 gap-2.5 lg:grid">
        {images.map((im, i) => (
          <div key={im.src} className="relative aspect-[2/3] bg-stone">
            <Image src={im.src} alt={im.alt} fill sizes="30vw" loading={i < 2 ? "eager" : "lazy"} className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
