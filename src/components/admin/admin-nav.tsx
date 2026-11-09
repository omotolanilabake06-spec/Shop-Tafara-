"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Overview", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Journal", href: "/admin/journal" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Newsletter", href: "/admin/newsletter" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Settings", href: "/admin/settings" },
];

/** Wrap in <Suspense> with <AdminNavLinks /> as the fallback: the path is only known per request. */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

export function AdminNavLinks({ pathname = "" }: { pathname?: string }) {
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <ul className="-mx-2 flex gap-1 overflow-x-auto lg:mx-0 lg:flex-col lg:overflow-visible">
      {LINKS.map((l) => (
        <li key={l.href} className="shrink-0">
          <Link
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className="block rounded-[3px] px-3 py-2 text-[15px] text-soft transition-colors hover:bg-stone hover:text-ink aria-[current=page]:bg-stone aria-[current=page]:font-medium aria-[current=page]:text-ink"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
