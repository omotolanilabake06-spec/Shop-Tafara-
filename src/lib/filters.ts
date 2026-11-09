import type { Category } from "./types";

/** Filter row for clothing listings: Shop all + top-level categories, or a parent's children. */
export function clothingFilters(categories: Category[], current?: Category) {
  const clothing = categories.filter((c) => c.department === "clothing");
  const parentSlug = current?.parent ?? current?.slug;
  const children = clothing.filter((c) => c.parent === parentSlug);

  if (current && children.length) {
    const parent = clothing.find((c) => c.slug === parentSlug)!;
    return [
      { label: `All ${parent.name.toLowerCase()}`, href: `/shop/${parent.slug}`, active: current.slug === parent.slug },
      ...children.map((c) => ({ label: c.name, href: `/shop/${c.slug}`, active: c.slug === current.slug })),
    ];
  }
  return [
    { label: "Shop all", href: "/shop", active: !current },
    ...clothing.filter((c) => !c.parent).map((c) => ({ label: c.name, href: `/shop/${c.slug}`, active: c.slug === current?.slug })),
  ];
}
