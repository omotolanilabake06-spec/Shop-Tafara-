import { cacheLife } from "next/cache";
import Link from "next/link";
import type { NavItem } from "./header";
import { CookieSettingsButton } from "./site-notices";

export function Footer({ nav, instagram }: { nav: NavItem[]; instagram: string }) {
  const shop = nav.find((n) => n.href === "/shop");
  const shopLinks = [
    { label: "Shop all", href: "/shop" },
    ...(shop?.children ?? []).filter((c) => c.href !== "/shop"),
    ...nav.filter((n) => n.href === "/tafara-home"),
  ];
  const collections = nav.find((n) => n.label === "Collections")?.children ?? [];
  const columns = [
    { title: "Shop", links: shopLinks },
    {
      title: "Help",
      links: [
        { label: "Track my order", href: "/track" },
        { label: "Size guide", href: "/size-guide" },
        { label: "Colour card", href: "/colour-card" },
        { label: "Delivery & returns", href: "/delivery" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy & cookies", href: "/privacy" },
      ],
    },
    {
      title: "Shop Tafara",
      links: [
        { label: "About", href: "/about" },
        ...nav.filter((n) => n.href === "/journal"),
        ...collections,
        { label: "Instagram", href: `https://instagram.com/${instagram}` },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-stone">
      <div className="gutter grid gap-12 pb-12 pt-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8 lg:pt-20">
        <div className="max-w-[340px]">
          <p className="caps">Made for you, in Lagos</p>
          <p className="mt-5 text-[14px] leading-relaxed text-muted">
            Every Shop Tafara piece is cut and sewn after your order is placed, in the fabric colour and size you choose.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="caps">{col.title}</p>
            <ul className="mt-5 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="gutter flex flex-col gap-2 border-t border-line py-6 text-muted sm:flex-row sm:justify-between">
        <p className="caps-sm">
          © <Year /> Shop Tafara
        </p>
        <div className="flex items-center gap-6">
          <CookieSettingsButton />
          <p className="caps-sm">Lagos, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}

async function Year() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
