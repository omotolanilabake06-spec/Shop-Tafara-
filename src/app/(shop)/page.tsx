import Image from "next/image";
import Link from "next/link";
import { CategoryTiles } from "@/components/category-tiles";
import { HeroVideo } from "@/components/hero-video";
import { JournalCard } from "@/components/journal-card";
import { PhotoPair } from "@/components/photo-pair";
import { ProductGrid } from "@/components/product-grid";
import { getCollection, getPhotos, getProducts } from "@/lib/catalog";
import { getPublishedPosts } from "@/lib/journal";
import { HOMEPAGE } from "@/lib/site";

export default async function Home() {
  const [collection, collectionPieces, allPieces] = await Promise.all([
    getCollection(HOMEPAGE.featuredCollection),
    getProducts({ collection: HOMEPAGE.featuredCollection }),
    getProducts({ department: "clothing" }),
  ]);
  // The featured collection leads once it has pieces; until then, the whole shop does.
  const featured = collection && collectionPieces.length > 0;
  const products = featured ? collectionPieces : [...allPieces].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const href = featured ? `/collections/${collection.slug}` : "/shop";

  const [tilePhotos, pairPhotos, [story], posts] = await Promise.all([
    getPhotos(HOMEPAGE.tiles.map((t) => t.photo)),
    Promise.all(HOMEPAGE.pairs.map((p) => getPhotos(p.photos))),
    getPhotos([HOMEPAGE.story]),
    getPublishedPosts(),
  ]);
  const tiles = HOMEPAGE.tiles.flatMap((t, i) => (tilePhotos[i] ? [{ ...t, image: tilePhotos[i].src }] : []));
  const pairs = HOMEPAGE.pairs.flatMap((p, i) => {
    const [a, b] = pairPhotos[i];
    return a && b ? [{ ...p, photos: [a, b] as [typeof a, typeof b] }] : [];
  });

  return (
    <div className="space-y-2.5">
      <HeroVideo
        {...HOMEPAGE.heroVideo}
        title={featured ? collection.name : HOMEPAGE.hero.title}
        cta={HOMEPAGE.hero.cta}
        href={featured ? href : HOMEPAGE.hero.href}
      />

      {tiles.length === 3 && <CategoryTiles tiles={tiles} />}

      <section aria-labelledby="pieces" className="px-2.5 py-14 lg:px-5 lg:py-20">
        <div className="mb-9 text-center lg:mb-12">
          <h2 id="pieces" className="text-[15px] font-normal uppercase tracking-[0.2em]">
            {featured ? collection.name : "New in"}
          </h2>
          <p className="mx-auto mt-3 max-w-[62ch] text-[13px] leading-relaxed">
            {featured ? collection.tagline : "Each piece is cut and sewn in Lagos after you order it."}
          </p>
        </div>
        <ProductGrid products={products.slice(0, 8)} eagerCount={0} />
        {products.length > 8 && (
          <div className="mt-12 text-center">
            <Link href={href} className="caps link-line">
              View all {products.length} pieces
            </Link>
          </div>
        )}
      </section>

      {pairs[0] && <PhotoPair {...pairs[0]} />}

      {/* The made-to-order story beside an editorial photo. */}
      <section className="grid items-stretch md:grid-cols-2">
        {story && (
          <div className="relative aspect-[3/4] bg-stone md:aspect-auto md:min-h-[640px]">
            <Image src={story.src} alt={story.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
        <div className={`gutter flex flex-col items-center justify-center py-16 text-center md:py-24 ${story ? "" : "md:col-span-2"}`}>
          <p className="caps-sm text-muted">Made to order</p>
          <h2 className="display mt-4 text-[38px] sm:text-[52px]">Cut for you, after you choose</h2>
          <p className="mx-auto mt-6 max-w-[44ch] text-[14px] leading-relaxed text-muted">
            Choose your piece, its colour and your size, and our studio in Lagos begins. Nothing is made in advance, so every
            piece is yours from the first cut. Ready to ship in 5–7 working days.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link href="/colour-card" className="caps link-line">
              Colour card
            </Link>
            <Link href="/size-guide" className="caps link-line">
              Size guide
            </Link>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section aria-labelledby="journal" className="gutter py-16 lg:py-24">
          <div className="mb-10 text-center lg:mb-14">
            <p className="caps-sm text-muted">Stories from the studio</p>
            <h2 id="journal" className="display mt-3 text-[38px] sm:text-[52px]">
              The Journal
            </h2>
          </div>
          <div className="grid gap-x-2.5 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <JournalCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/journal" className="caps link-line">
              Read the Journal
            </Link>
          </div>
        </section>
      )}

      {pairs[1] && <PhotoPair {...pairs[1]} />}
    </div>
  );
}
