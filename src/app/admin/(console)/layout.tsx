import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/admin/actions";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col text-[15px] font-normal text-ink lg:flex-row">
      <aside className="border-b border-line bg-paper lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-3 px-4 pb-3 pt-4 lg:sticky lg:top-0 lg:h-dvh lg:gap-0 lg:px-5 lg:py-7">
          <div className="flex items-center justify-between lg:block lg:px-3">
            <Link href="/admin" aria-label="Admin overview" className="relative block h-[34px] w-[80px] lg:h-[44px] lg:w-[104px]">
              <Image src="/brand/logo-dark.png" alt="Shop Tafara" fill sizes="104px" loading="eager" className="object-contain object-left" />
            </Link>
            <p className="hidden text-[13px] text-soft lg:mt-2 lg:block">Studio admin</p>
            <form action={signOut} className="lg:hidden">
              <button type="submit" className="text-[14px] text-soft hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
          <nav aria-label="Admin" className="lg:mt-9">
            <Suspense fallback={<AdminNavLinks />}>
              <AdminNav />
            </Suspense>
          </nav>
          <div className="hidden border-t border-line pt-5 lg:mt-auto lg:block lg:px-3">
            <Link href="/" target="_blank" className="block py-1.5 text-[14px] text-soft hover:text-ink">
              View shop ↗
            </Link>
            <form action={signOut}>
              <button type="submit" className="block py-1.5 text-[14px] text-soft hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
