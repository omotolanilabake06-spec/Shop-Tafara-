import Link from "next/link";
import type { Product } from "@/lib/types";
import { CategoryCircles, type Circle } from "./category-circles";
import { ProductGrid } from "./product-grid";

type Props = {
  title: string;
  intro?: string;
  products: Product[];
  /** Round category shortcuts, shown on the main shop page. */
  circles?: Circle[];
  /** Sibling/child category links shown as a quiet filter row. */
  filters?: { label: string; href: string; active?: boolean }[];
};

export function Listing({ title, intro, products, circles, filters }: Props) {
  return (
    <div className="pb-24">
      <header className="gutter pt-9 pb-9 text-center">
        <h1 className="text-[15px] font-normal uppercase tracking-[0.2em]">{title}</h1>
        {intro && <p className="mx-auto mt-4 max-w-[62ch] text-[13px] leading-relaxed">{intro}</p>}
      </header>

      {circles && <CategoryCircles circles={circles} />}

      <div className="mb-8 flex items-center justify-between gap-6 border-y border-line px-5 py-4 lg:mb-12">
        {filters && filters.length > 0 ? (
          <nav aria-label="Filter" className="-mx-1 flex gap-6 overflow-x-auto px-1 [scrollbar-width:none] sm:gap-9">
            {filters.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                aria-current={f.active ? "page" : undefined}
                className={`caps-sm link-hover shrink-0 ${f.active ? "" : "text-muted hover:text-ink"}`}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <p className="caps-sm shrink-0 text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="px-2.5 lg:px-5">
        <ProductGrid products={products} eagerCount={4} />
      </div>
    </div>
  );
}
