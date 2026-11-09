// Homepage content. Photos are picked from the live products ({ product: slug, photo: index into its
// photos, counting from 0 }), so they are always the client's own and a section quietly drops out if
// its product is removed.
// Video: seamless loop, muted, 1920×1080 H.264 MP4 under 5 MB, plus WebM, a portrait cut for phones and a JPG poster.

export type PhotoRef = { product: string; photo: number };

export const HOMEPAGE = {
  heroVideo: {
    mp4: "/hero/tafara-hero-1080.mp4",
    webm: "/hero/tafara-hero-1080.webm",
    mobileMp4: "/hero/tafara-hero-720-portrait.mp4",
    poster: "/hero/tafara-hero-poster.jpg",
    mobilePoster: "/hero/tafara-hero-poster-portrait.jpg",
  },
  /** Shown over the film. A collection with pieces in it takes over the title and link once there is one. */
  hero: { title: "Made for you, in Lagos", cta: "Shop now", href: "/shop" },
  featuredCollection: "the-inner-courtyard",
  tiles: [
    { photo: { product: "arabi-set", photo: 5 }, title: "Sets", cta: "Shop sets", href: "/shop/sets" },
    { photo: { product: "echo", photo: 4 }, title: "Maxi dresses", cta: "Shop maxi dresses", href: "/shop/maxi-dresses" },
    { photo: { product: "clover-set", photo: 5 }, title: "Shop all", cta: "Shop every piece", href: "/shop" },
  ],
  /** Full-width banners: two portraits of one piece side by side, usually its two colours. */
  pairs: [
    {
      photos: [{ product: "clover-set", photo: 0 }, { product: "clover-set", photo: 4 }],
      eyebrow: "In orange and pink",
      title: "The Clover Set",
      cta: "Shop the set",
      href: "/products/clover-set",
    },
    {
      photos: [{ product: "arabi-set", photo: 2 }, { product: "arabi-set", photo: 7 }],
      eyebrow: "Handwoven aso-oke",
      title: "The Àràbì Set",
      cta: "Shop the set",
      href: "/products/arabi-set",
    },
  ],
  /** Photo beside the made-to-order story. */
  story: { product: "echo", photo: 6 } as PhotoRef,
};

/** About page photo: Echo in chocolate and ivory, side by side (chosen by the user). */
export const ABOUT_PHOTO: PhotoRef = { product: "echo", photo: 6 };

/** Contact page photo. */
export const CONTACT_PHOTO: PhotoRef = { product: "clover-set", photo: 6 };
