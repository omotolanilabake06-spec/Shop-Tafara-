import Link from "next/link";
import { ShopChrome } from "@/components/shop-chrome";

export default function NotFound() {
  return (
    <ShopChrome>
      <div className="gutter flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="caps-sm text-muted">Page not found</p>
        <h1 className="display mt-4 text-[40px] sm:text-[56px]">This page has moved on</h1>
        <Link href="/shop" className="caps link-line mt-8">
          Continue shopping
        </Link>
      </div>
    </ShopChrome>
  );
}
