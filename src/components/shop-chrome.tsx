import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SiteNotices } from "@/components/site-notices";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSettings } from "@/lib/catalog";
import { getNav } from "@/lib/nav";

/** Storefront frame: header, footer and bag drawer. The admin area has its own. */
export async function ShopChrome({ children }: { children: React.ReactNode }) {
  const [nav, settings] = await Promise.all([getNav(), getSettings()]);
  return (
    <>
      <Header nav={nav} announcement={settings.announcement} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer nav={nav} instagram={settings.store.instagram} />
      <CartDrawer />
      <SiteNotices />
      <WhatsAppButton number={settings.store.whatsapp} />
    </>
  );
}
