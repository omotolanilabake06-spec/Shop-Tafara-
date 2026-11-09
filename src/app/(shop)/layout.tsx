import { ShopChrome } from "@/components/shop-chrome";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return <ShopChrome>{children}</ShopChrome>;
}
