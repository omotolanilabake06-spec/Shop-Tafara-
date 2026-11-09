import Image from "next/image";
import Link from "next/link";

export type Tile = { image: string; title: string; cta: string; href: string };

/** Row of three edge-to-edge images, each with a centred title and link. Stacks on phones. */
export function CategoryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section className="grid gap-2.5 md:grid-cols-3">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className="group relative block aspect-[4/5] overflow-hidden bg-stone text-white">
          <Image
            src={t.image}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-[2.4s] ease-[var(--ease-soft)] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 via-20% to-black/0 to-45%" />
          <div className="absolute inset-x-0 bottom-9 px-4 text-center">
            <h2 className="display text-[28px]">{t.title}</h2>
            <span className="caps link-line mt-2">{t.cta}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
