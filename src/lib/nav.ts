import type { NavItem } from "@/components/header";
import { getCollections, getProducts, getStockedCategories } from "./catalog";
import { getPublishedPosts } from "./journal";

/**
 * Menu built from the live catalogue: only categories and collections that have pieces in them,
 * so adding a top or a candle brings Tops or TAFARA HOME back into the menu automatically.
 */
export async function getNav(): Promise<NavItem[]> {
  const [categories, allCollections, products, posts] = await Promise.all([getStockedCategories(), getCollections(), getProducts(), getPublishedPosts()]);
  const clothing = categories.filter((c) => c.department === "clothing");
  const childrenOf = (slug: string) =>
    clothing.filter((c) => c.parent === slug).map((c) => ({ label: c.name, href: `/shop/${c.slug}` }));
  const collections = allCollections.filter((c) => products.some((p) => p.collection === c.slug));
  const hasHome = categories.some((c) => c.department === "home");

  // The Shop menu's photo: the first collection, or else the newest piece.
  const newest = [...products].filter((p) => p.kind === "clothing").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const feature = collections[0]
    ? { image: collections[0].image, title: collections[0].name, href: `/collections/${collections[0].slug}` }
    : newest && { image: newest.images[0].src, title: `New in: ${newest.name}`, href: `/products/${newest.slug}` };

  return [
    {
      label: "Shop",
      href: "/shop",
      children: [
        { label: "Shop all", href: "/shop" },
        ...clothing
          .filter((c) => !c.parent)
          .map((c) => {
            const children = childrenOf(c.slug);
            return { label: c.name, href: `/shop/${c.slug}`, children: children.length ? children : undefined };
          }),
      ],
      feature,
    },
    ...(collections.length
      ? [
          {
            label: "Collections",
            href: `/collections/${collections[0].slug}`,
            children: collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
          },
        ]
      : []),
    ...(hasHome ? [{ label: "TAFARA HOME", href: "/tafara-home" }] : []),
    ...(posts.length ? [{ label: "Journal", href: "/journal" }] : []),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];
}
