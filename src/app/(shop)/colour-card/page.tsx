import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { COLOURS } from "@/lib/catalog";

export const metadata: Metadata = { title: "Colour card" };

export default function ColourCardPage() {
  return (
    <TextPage
      eyebrow="Help"
      title="Colour card"
      intro="Every piece is made in one of our ten fabric colours. Each product page shows which colours that piece comes in."
    >
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-5">
        {COLOURS.map((c) => (
          <li key={c.key}>
            <span className="block aspect-[3/4] ring-1 ring-black/5" style={{ background: c.hex }} />
            <span className="caps mt-3 block text-ink">{c.name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-12 text-center text-[13px]">
        Colours can look slightly different on each screen. If you would like to see a fabric sample before ordering, please
        contact us.
      </p>
    </TextPage>
  );
}
