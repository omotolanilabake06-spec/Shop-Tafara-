import Image from "next/image";
import Link from "next/link";

export type Circle = { label: string; href: string; image: string };

/** Round category shortcuts above a listing. Scrolls sideways on phones. */
export function CategoryCircles({ circles }: { circles: Circle[] }) {
  if (circles.length === 0) return null;
  return (
    <nav aria-label="Categories" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="mx-auto flex w-max gap-4 px-4 pb-10 sm:gap-6">
        {circles.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="group block w-[96px] text-center sm:w-[144px]">
              <span className="relative block aspect-square overflow-hidden rounded-full bg-stone">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="144px"
                  className="object-cover object-top transition-transform duration-[1.6s] ease-[var(--ease-soft)] group-hover:scale-[1.05]"
                />
              </span>
              <span className="mt-3 block text-[13px]">{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
