import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Empty, PageHeader, button, input, th } from "@/components/admin/ui";
import { listAllCategories, listAllProducts } from "@/lib/db/products";
import { COLOURS } from "@/lib/fabric";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/types";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Products" };

const VIEWS: { key: string; label: string; match: (p: Product) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "active", label: "Published", match: (p) => p.status === "active" },
  { key: "draft", label: "Drafts", match: (p) => p.status === "draft" },
  { key: "clothing", label: "Clothing", match: (p) => p.kind === "clothing" },
  { key: "home", label: "TAFARA HOME", match: (p) => p.kind === "home" },
  { key: "low", label: "Low stock", match: (p) => p.kind === "home" && p.variants.some((v) => v.stock <= 3) },
];

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the shop. Drafts are only visible here."
        actions={
          <>
            <Link href="/admin/products/new?type=home" className={button.secondary}>
              + TAFARA HOME product
            </Link>
            <Link href="/admin/products/new" className={button.primary}>
              + Add clothing
            </Link>
          </>
        }
      />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Products searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const [{ view: requested, q: rawQ, deleted }, products, categories] = await Promise.all([searchParams, listAllProducts(), listAllCategories()]);
  const view = VIEWS.find((v) => v.key === requested) ?? VIEWS[0];
  const q = typeof rawQ === "string" ? rawQ.trim().toLowerCase() : "";
  const shown = products.filter(view.match).filter((p) => !q || p.name.toLowerCase().includes(q));
  const hidden = new Set(categories.filter((c) => !c.visible).map((c) => c.slug));
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <>
      {deleted && <p className="mb-5 rounded-[3px] border border-line bg-paper px-4 py-3 text-[15px] text-ok">Product deleted.</p>}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter products" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-1 whitespace-nowrap px-1">
            {VIEWS.map((v) => (
              <li key={v.key}>
                <Link
                  href={v.key === "all" ? "/admin/products" : `?view=${v.key}`}
                  aria-current={v.key === view.key ? "page" : undefined}
                  className="block rounded-full border border-transparent px-3.5 py-1.5 text-[14px] text-soft hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-paper aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {v.label} <span className="tabular-nums text-[#8a8178]">{products.filter(v.match).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="flex gap-2 lg:w-[320px]" role="search">
          {view.key !== "all" && <input type="hidden" name="view" value={view.key} />}
          <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className={input} />
          <button type="submit" className={button.secondary}>
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 overflow-hidden rounded-[4px] border border-line bg-paper">
        {shown.length === 0 ? (
          <Empty title="No products here">
            <Link href="/admin/products/new" className={button.quiet}>
              Add your first product
            </Link>
          </Empty>
        ) : (
          <table className="w-full">
            <thead className="hidden border-b border-line bg-[#faf8f5] md:table-header-group">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Price</th>
                <th className={th}>Options</th>
                <th className={th}>Status</th>
                <th className={th}>Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((p) => {
                const inHidden = p.categories.some((c) => hidden.has(c));
                return (
                  <tr key={p.id} className="relative grid grid-cols-[56px_1fr] gap-x-4 gap-y-1 px-5 py-4 hover:bg-[#faf8f5] md:table-row md:p-0">
                    <td className="row-span-4 md:w-[1%] md:py-3 md:pl-5 md:pr-0 md:align-middle" aria-hidden>
                      <div className="relative aspect-[2/3] w-[48px] overflow-hidden rounded-[2px] bg-stone">
                        {p.images[0] && <Image src={p.images[0].src} alt="" fill sizes="48px" className="object-cover" />}
                      </div>
                    </td>
                    <td className="md:px-5 md:py-3 md:align-middle">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-ink after:absolute after:inset-0">
                        {p.name}
                      </Link>
                      <span className="block text-[13px] text-soft">{p.categories.map(categoryName).join(" · ")}</span>
                    </td>
                    <td className="tabular-nums md:px-5 md:py-3 md:align-middle">
                      {p.kind === "clothing" ? formatNaira(p.price) : `From ${formatNaira(Math.min(...p.variants.map((v) => v.price)))}`}
                    </td>
                    <td className="text-[14px] md:px-5 md:py-3 md:align-middle">
                      {p.kind === "clothing" ? (
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex gap-0.5" aria-label={`${p.colours.length} colours`}>
                            {p.colours.map((key) => {
                              const c = COLOURS.find((x) => x.key === key)!;
                              return <span key={key} title={c.name} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c.hex }} />;
                            })}
                          </span>
                          <span className="text-soft">{p.sizes.length ? `${p.sizes.length} sizes` : "One size"}</span>
                        </span>
                      ) : (
                        <span className="block space-y-0.5">
                          {p.variants.map((v) => (
                            <span key={v.id} className="block">
                              {v.scent} · {v.size}:{" "}
                              <span className={`font-medium tabular-nums ${v.stock === 0 ? "text-sold" : v.stock <= 3 ? "text-warn" : ""}`}>
                                {v.stock === 0 ? "sold out" : `${v.stock} left`}
                              </span>
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="md:px-5 md:py-3 md:align-middle">
                      <span className="flex flex-wrap gap-1.5">
                        {p.status === "active" ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                        {inHidden && <Badge tone="amber">Category hidden</Badge>}
                      </span>
                    </td>
                    <td className="text-[14px] text-soft md:px-5 md:py-3 md:align-middle">{formatStamp(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
