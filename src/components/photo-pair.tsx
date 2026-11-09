import Image from "next/image";
import Link from "next/link";

type Photo = { src: string; alt: string };
type Props = {
  photos: [Photo, Photo];
  eyebrow?: string;
  title?: string;
  cta?: string;
  href?: string;
  /** Above the fold (About page): load straight away. */
  priority?: boolean;
};

/**
 * Two portrait photos side by side as one full-width banner, with optional text across the seam.
 * Portraits fill the width without losing heads or hems to a landscape crop. Phones show the first one.
 */
export function PhotoPair({ photos, eyebrow, title, cta, href, priority = false }: Props) {
  const body = (
    <>
      <div className="grid md:grid-cols-2 md:gap-2.5">
        {photos.map((p, i) => (
          <div key={p.src} className={`relative aspect-[3/4] overflow-hidden bg-stone ${i === 1 ? "hidden md:block" : ""}`}>
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority && i === 0 ? "high" : "auto"}
              className={`object-cover ${href ? "transition-transform duration-[2.4s] ease-[var(--ease-soft)] group-hover:scale-[1.03]" : ""}`}
            />
          </div>
        ))}
      </div>
      {title && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 via-25% to-black/0 to-50%" />
          <div className="gutter absolute inset-x-0 bottom-0 pb-10 text-center text-white sm:pb-14">
            {eyebrow && <p className="caps-sm">{eyebrow}</p>}
            <h2 className="display mt-2 text-[38px] sm:text-[56px]">{title}</h2>
            {cta && <span className="caps link-line mt-3">{cta}</span>}
          </div>
        </>
      )}
    </>
  );

  return href ? (
    <Link href={href} className="group relative block">
      {body}
    </Link>
  ) : (
    <section className="relative">{body}</section>
  );
}
