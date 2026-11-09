"use client";

import { createContext, useContext, useState } from "react";
import type { ColourKey, ProductImage } from "@/lib/types";

// The colour chosen on a product page, shared by the colour picker and the photo gallery.
const ProductColour = createContext<{ colour: ColourKey | null; setColour: (c: ColourKey) => void }>({
  colour: null,
  setColour: () => {},
});

export function ProductColourProvider({ children }: { children: React.ReactNode }) {
  const [colour, setColourState] = useState<ColourKey | null>(null);
  const setColour = (next: ColourKey) => {
    if (next === colour) return;
    setColourState(next);
    // Desktop: the gallery is a tall column, so a new colour's (fewer) photos can leave the page scrolled
    // past them. Bring the photos back into view. Phones swipe inside a fixed-height strip, so no jump there.
    if (window.matchMedia("(min-width: 1024px)").matches) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return <ProductColour value={{ colour, setColour }}>{children}</ProductColour>;
}

export const useProductColour = () => useContext(ProductColour);

/** Photos for a colour: its own photos plus untagged ones. All photos until a colour is chosen, or if none are tagged. */
export function photosFor(images: ProductImage[], colour: ColourKey | null) {
  if (!colour) return images;
  const matching = images.filter((im) => !im.colour || im.colour === colour);
  return matching.some((im) => im.colour === colour) ? matching : images;
}
