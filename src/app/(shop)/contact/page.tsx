import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPhotos, getSettings } from "@/lib/catalog";
import { CONTACT_PHOTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about sizing, colours or an order? Message Shop Tafara on WhatsApp, by email or on Instagram.",
};

const HELP = [
  { label: "Track your order", href: "/track" },
  { label: "Size guide", href: "/size-guide" },
  { label: "Colour card", href: "/colour-card" },
  { label: "Delivery & returns", href: "/delivery" },
];

export default async function ContactPage() {
  const [{ store }, [photo]] = await Promise.all([getSettings(), getPhotos([CONTACT_PHOTO])]);
  const whatsapp = store.whatsapp.replace(/\D/g, "");

  return (
    <div className="grid md:grid-cols-2">
      {photo && (
        <div className="relative aspect-[4/5] bg-stone md:aspect-auto md:min-h-[calc(100svh-120px)]">
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 50vw, 100vw" loading="eager" fetchPriority="high" className="object-cover" />
        </div>
      )}

      <div className={`gutter flex flex-col justify-center py-16 md:px-12 md:py-20 lg:px-20 ${photo ? "" : "md:col-span-2"}`}>
        <p className="caps-sm text-muted">Contact</p>
        <h1 className="display mt-4 max-w-[14ch] text-[44px] leading-[1] sm:text-[60px]">We would love to hear from you</h1>
        <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-muted">
          Questions about sizing, colours or an order? Send us a message and the studio will get back to you.
        </p>

        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-solid mt-10 w-full sm:w-auto sm:self-start sm:px-10">
            Chat on WhatsApp
          </a>
        )}

        <dl className="mt-12 divide-y divide-line border-y border-line">
          {whatsapp && (
            <Row label="WhatsApp">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-line">
                {store.whatsapp}
              </a>
            </Row>
          )}
          <Row label="Email">
            <a href={`mailto:${store.email}`} className="link-line">
              {store.email}
            </a>
          </Row>
          {store.instagram && (
            <Row label="Instagram">
              <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" className="link-line">
                @{store.instagram}
              </a>
            </Row>
          )}
          <Row label="Studio">{store.address}. Visits by appointment only.</Row>
        </dl>

        <nav aria-label="Quick help" className="mt-12">
          <p className="caps-sm text-muted">Quick help</p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {HELP.map((h) => (
              <li key={h.href}>
                <Link href={h.href} className="caps link-line">
                  {h.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-4">
      <dt className="caps-sm pt-0.5">{label}</dt>
      <dd className="text-[14px] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}
