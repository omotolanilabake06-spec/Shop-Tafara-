import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPhotos } from "@/lib/catalog";
import { ABOUT_PHOTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Shop Tafara is a made-to-order womenswear house in Lagos. Every piece is cut and sewn after you order it.",
};

export default async function AboutPage() {
  const [photo] = await getPhotos([ABOUT_PHOTO]);
  return (
    <article className="grid md:grid-cols-2">
      {photo && (
        <div className="relative aspect-[4/5] bg-stone md:aspect-auto md:min-h-[calc(100svh-120px)]">
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 50vw, 100vw" loading="eager" fetchPriority="high" className="object-cover" />
        </div>
      )}
      <div className={`gutter flex flex-col items-center justify-center py-20 text-center md:px-12 md:py-24 lg:px-20 ${photo ? "" : "md:col-span-2"}`}>
        <p className="caps-sm text-muted">About</p>
        <h1 className="display mt-4 max-w-[15ch] text-[44px] leading-[1] sm:text-[64px]">Made for you, in Lagos</h1>
        <div className="mt-8 max-w-[44ch] space-y-5 text-[15px] leading-relaxed text-muted">
          <p>Shop Tafara is a womenswear house built on one idea: that a piece should be made for the woman who will wear it.</p>
          <p>
            Nothing is made in advance. When you choose a piece, its fabric colour and your size, our studio in Lagos begins cutting and sewing it
            for you.
          </p>
          <p>The result is less waste, a better fit and clothes that feel like they were always yours.</p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link href="/shop" className="btn btn-ghost">
            Shop the collection
          </Link>
          <Link href="/journal" className="btn btn-ghost">
            Read the Journal
          </Link>
        </div>
      </div>
    </article>
  );
}
