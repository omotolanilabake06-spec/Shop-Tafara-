import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductColourProvider } from "@/components/product-colour";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductSkeleton } from "@/components/skeletons";
import { COLOURS, getCategory, getProduct, getProducts } from "@/lib/catalog";
import { displayPrice } from "@/lib/format";

export async function generateStaticParams() {
  const products = await getProducts();
  // At least one entry keeps the build happy with an empty shop; it simply 404s.
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [{ url: product.images[0].src }] },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({
  params,
}: {
  params: PageProps<"/products/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const primary = product.categories[product.categories.length - 1];
  const [category, related] = await Promise.all([
    getCategory(primary),
    getProducts({ category: product.categories[0] }),
  ]);
  const more = related.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <ProductColourProvider>
        <div className="lg:gutter grid lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14 lg:pt-6 xl:gap-20">
          <ProductGallery images={product.images} />

          <div className="gutter lg:px-0">
            <div className="pb-16 pt-8 lg:sticky lg:top-[132px] lg:pt-4">
              <nav aria-label="Breadcrumb" className="caps-sm text-muted">
                <Link
                  href={product.kind === "home" ? "/tafara-home" : "/shop"}
                  className="hover:text-ink"
                >
                  {product.kind === "home" ? "TAFARA HOME" : "Shop"}
                </Link>
                {category && product.kind === "clothing" && (
                  <>
                    <span className="mx-2">/</span>
                    <Link
                      href={`/shop/${category.slug}`}
                      className="hover:text-ink"
                    >
                      {category.name}
                    </Link>
                  </>
                )}
              </nav>

              <h1 className="display mt-5 text-[34px] sm:text-[40px]">
                {product.name}
              </h1>
              <p className="mt-3 text-[16px] tabular-nums">
                {displayPrice(product)}
              </p>
              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted">
                {product.description}
              </p>

              <ProductPurchase product={product} colours={COLOURS} />

              <dl className="mt-10 divide-y divide-line border-y border-line">
                {product.specs.map((s) => (
                  <div
                    key={s.label}
                    className="grid grid-cols-[96px_1fr] gap-4 py-4"
                  >
                    <dt className="caps-sm pt-0.5">{s.label}</dt>
                    <dd className="text-[14px] leading-relaxed text-muted">
                      {s.value}
                    </dd>
                  </div>
                ))}
                <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
                  <dt className="caps-sm pt-0.5">Delivery</dt>
                  <dd className="text-[14px] leading-relaxed text-muted">
                    Delivery cost is shown at checkout before you pay.{" "}
                    <Link
                      href="/delivery"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      Delivery &amp; returns
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </ProductColourProvider>

      {more.length > 0 && (
        <section
          aria-labelledby="more"
          className="gutter border-t border-line pb-24 pt-16"
        >
          <h2 id="more" className="caps mb-8 text-center">
            You may also like
          </h2>
          <ProductGrid products={more} />
        </section>
      )}
    </>
  );
}
