"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { openCart, useCart } from "@/lib/cart";

export type NavLink = { label: string; href: string; children?: NavLink[] };
export type NavItem = NavLink & { feature?: { image: string; title: string; href: string } };

export type Announcement = { enabled: boolean; text: string; detail: string };

type HeaderProps = { nav: NavItem[]; announcement: Announcement };

/**
 * The path is only known per request on pages like /shop/[category], so the header streams in
 * behind a fallback that is the same solid header (only the homepage overlays its hero).
 */
export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderView {...props} pathname="" />}>
      <HeaderWithPath {...props} />
    </Suspense>
  );
}

function HeaderWithPath(props: HeaderProps) {
  return <HeaderView {...props} pathname={usePathname()} />;
}

function HeaderView({ nav, announcement, pathname }: HeaderProps & { pathname: string }) {
  const bar = announcement.enabled && announcement.text;
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useCart();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const solid = !overlay || scrolled || openMenu !== null || mobileOpen;
  const tone = solid ? "text-ink" : "text-white";

  const enter = (label: string) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${solid ? "bg-paper" : "bg-transparent"}`}
        onMouseLeave={leave}
      >
        {bar && (
          <p className="caps-sm flex h-9 items-center justify-center bg-ink px-4 text-center text-[#efe9df]">
            {announcement.text}
            {announcement.detail && <span className="hidden sm:inline"> &nbsp;·&nbsp; {announcement.detail}</span>}
          </p>
        )}

        <div
          className={`gutter grid h-[60px] grid-cols-[1fr_auto_1fr] items-center border-b transition-colors duration-500 lg:flex lg:h-[79px] lg:gap-10 lg:px-12 ${tone} ${
            solid ? "border-line" : "border-transparent"
          }`}
        >
          {/* Phone: burger, centred logo, bag. Desktop: logo, nav beside it, bag far right. */}
          <button
            type="button"
            className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-500 ${mobileOpen ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-500 ${mobileOpen ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
          <Link href="/" aria-label="Shop Tafara, home" className="relative block h-[40px] w-[94px] lg:h-[58px] lg:w-[136px] lg:shrink-0">
            <Image
              src="/brand/logo-dark.png"
              alt="Shop Tafara"
              fill
              sizes="136px"
              loading="eager"
              className={`object-contain transition-opacity duration-500 ${solid ? "opacity-100" : "opacity-0"}`}
            />
            <Image
              src="/brand/logo-light.png"
              alt=""
              fill
              sizes="136px"
              loading="eager"
              className={`object-contain transition-opacity duration-500 ${solid ? "opacity-0" : "opacity-100"}`}
            />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {nav.map((item) => (
                <li key={item.label} onMouseEnter={() => (item.children ? enter(item.label) : setOpenMenu(null))}>
                  <Link
                    href={item.href}
                    className="caps link-hover inline-flex items-center gap-1.5 py-6"
                    aria-current={pathname === item.href ? "page" : undefined}
                    aria-expanded={item.children ? openMenu === item.label : undefined}
                    onFocus={() => item.children && enter(item.label)}
                  >
                    {item.label}
                    {item.children && (
                      <svg
                        width="9"
                        height="6"
                        viewBox="0 0 9 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        aria-hidden
                        className={`transition-transform duration-300 ${openMenu === item.label ? "rotate-180" : ""}`}
                      >
                        <path d="M1 1l3.5 3.5L8 1" />
                      </svg>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Track my order (desktop) + bag */}
          <div className="flex items-center justify-end gap-7 lg:ml-auto">
            <Link
              href="/track"
              className="caps link-hover hidden py-6 lg:inline-block"
              aria-current={pathname.startsWith("/track") ? "page" : undefined}
            >
              Track my order
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center"
              aria-label={`Shopping bag, ${count} items`}
            >
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M2 6.5h16V21H2z" />
                <path d="M6.5 9V4.5a3.5 3.5 0 0 1 7 0V9" />
              </svg>
              {count > 0 && (
                <span className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-current px-1 text-[10px] tabular-nums">
                  <span className={solid ? "text-paper" : "text-ink"}>{count}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop dropdown panels */}
        {nav
          .filter((item) => item.children)
          .map((item) => (
            <div
              key={item.label}
              onMouseEnter={() => enter(item.label)}
              className={`absolute inset-x-0 top-full hidden border-b border-line bg-paper transition-[opacity,visibility] duration-300 lg:block ${
                openMenu === item.label ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="gutter mx-auto grid grid-cols-[1fr_auto] gap-16 py-12">
                <ul className="grid auto-cols-[minmax(120px,180px)] grid-flow-col gap-x-10 xl:gap-x-14">
                  {item.children!.map((child) => (
                    <li key={child.href}>
                      <Link href={child.href} className="caps link-hover" tabIndex={openMenu === item.label ? 0 : -1}>
                        {child.label}
                      </Link>
                      {child.children && (
                        <ul className="mt-5 space-y-3">
                          {child.children.map((g) => (
                            <li key={g.href}>
                              <Link
                                href={g.href}
                                className="text-[13px] text-muted transition-colors hover:text-ink"
                                tabIndex={openMenu === item.label ? 0 : -1}
                              >
                                {g.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                {item.feature && (
                  <Link href={item.feature.href} className="group block w-[280px]" tabIndex={openMenu === item.label ? 0 : -1}>
                    <span className="relative block aspect-[4/3] overflow-hidden bg-stone">
                      <Image
                        src={item.feature.image}
                        alt=""
                        fill
                        sizes="280px"
                        className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="caps mt-3 block">{item.feature.title}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-0 bottom-0 ${bar ? "top-[96px]" : "top-[60px]"} z-30 overflow-y-auto bg-paper transition-[opacity,visibility] duration-400 lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Mobile" className="gutter py-6">
          <ul>
            {nav.map((item) => (
              <MobileItem key={item.label} item={item} tabbable={mobileOpen} />
            ))}
            <MobileItem item={{ label: "Track my order", href: "/track" }} tabbable={mobileOpen} />
          </ul>
        </nav>
      </div>

      {/* Spacer so content starts below the fixed header, except where the hero sits under it. */}
      {!overlay && <div aria-hidden className={bar ? "h-[96px] lg:h-[115px]" : "h-[60px] lg:h-[79px]"} />}
    </>
  );
}

function MobileItem({ item, tabbable }: { item: NavItem; tabbable: boolean }) {
  const [open, setOpen] = useState(false);
  const tab = tabbable ? 0 : -1;
  if (!item.children) {
    return (
      <li className="border-b border-line">
        <Link href={item.href} className="display block py-5 text-[28px]" tabIndex={tab}>
          {item.label}
        </Link>
      </li>
    );
  }
  return (
    <li className="border-b border-line">
      <button
        type="button"
        className="display flex w-full items-center justify-between py-5 text-left text-[28px]"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        tabIndex={tab}
      >
        {item.label}
        <span className={`text-xl font-light transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <ul className="overflow-hidden">
          {item.children.flatMap((c) => [c, ...(c.children ?? []).map((g) => ({ ...g, nested: true }))]).map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className={`caps block py-3 ${"nested" in c ? "pl-5 text-muted" : ""}`}
                tabIndex={open && tabbable ? 0 : -1}
              >
                {c.label}
              </Link>
            </li>
          ))}
          <li className="h-4" />
        </ul>
      </div>
    </li>
  );
}
