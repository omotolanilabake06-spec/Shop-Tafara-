import Image from "next/image";
import Link from "next/link";

type Props = { image: string; eyebrow?: string; title: string; cta: string; href: string; tall?: boolean };

/** Full-width campaign image with a single link, text centred low on the image. */
export function CampaignBanner({ image, eyebrow, title, cta, href, tall = true }: Props) {
  return (
    <Link href={href} className="group relative block overflow-hidden bg-stone text-white">
      <div className={`relative w-full ${tall ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[4/3] sm:aspect-[21/9]"}`}>
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-[2.4s] ease-[var(--ease-soft)] group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 via-20% to-black/0 to-45%" />
      </div>
      <div className="gutter absolute inset-x-0 bottom-0 pb-10 text-center sm:pb-14">
        {eyebrow && <p className="caps-sm">{eyebrow}</p>}
        <h2 className="display mt-2 text-[38px] sm:text-[52px]">{title}</h2>
        <span className="caps link-line mt-3">{cta}</span>
      </div>
    </Link>
  );
}
