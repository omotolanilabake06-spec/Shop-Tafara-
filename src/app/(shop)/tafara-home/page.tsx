import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import { getCategory, getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "TAFARA HOME",
  description: "Scented candles, reed diffusers and room sprays from Shop Tafara, Lagos.",
};

export default async function TafaraHomePage() {
  const category = await getCategory("tafara-home");
  if (!category) notFound();
  const products = await getProducts({ category: "tafara-home" });
  // Shown only once there are home products; the banner uses the first one's photo.
  if (!products.length) notFound();

  return (
    <>
      <section className="relative">
        <div className="relative aspect-[4/3] w-full sm:aspect-[24/9]">
          <Image src={products[0].images[0].src} alt="" fill sizes="100vw" loading="eager" fetchPriority="high" className="object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="display text-[44px] tracking-[0.04em] sm:text-[76px]">{category.name}</h1>
          {category.blurb && <p className="mt-4 max-w-[44ch] text-[14px] leading-relaxed">{category.blurb}</p>}
        </div>
      </section>
      <section aria-label="Home products" className="gutter py-16 sm:py-20">
        <ProductGrid products={products} eagerCount={4} />
      </section>
    </>
  );
}
