export type ColourKey =
  | "black"
  | "chocolate"
  | "ivory"
  | "olive"
  | "peach"
  | "terracotta"
  | "red"
  | "turquoise"
  | "lilac"
  | "baby-pink"
  | "navy-blue"
  | "orange"
  | "pink"
  | "cream" | "stripe-green" | "green" | "blue" | "mauve" | "purple-adire";

export type Colour = { key: ColourKey; name: string; hex: string };

export type ProductImage = { src: string; alt: string; colour?: ColourKey };

export type Category = {
  slug: string;
  /** Order in menus and filters. */
  sortOrder?: number;
  name: string;
  /** Parent category slug, e.g. "mini-dresses" sits under "dresses". */
  parent?: string;
  /** Hidden categories (Bags, until launch) are left out of menus, listings and routes. */
  visible: boolean;
  department: "clothing" | "home";
  /** One-line intro shown under the category title. */
  blurb?: string;
};

type BaseProduct = {
  /** Stable id; the slug can change when a product is renamed, the id never does. */
  id: string;
  slug: string;
  /** Drafts are saved in the admin but never shown in the shop. */
  status: "active" | "draft";
  name: string;
  /** Categories the piece is listed in. A mini dress lists both "dresses" and "mini-dresses". */
  categories: string[];
  collection?: string;
  description: string;
  /** `colour` ties a photo to one fabric colour, so choosing that colour shows its photos. */
  images: ProductImage[];
  /** Lower numbers show first on listing pages. */
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Made-to-order clothing and accessories: one price, customer picks colour (and size). */
export type ClothingProduct = BaseProduct & {
  kind: "clothing";
  /** Price in naira. */
  price: number;
  colours: ColourKey[];
  /** Empty for one-size pieces such as scarves and bags. */
  sizes: string[];
  specs: { label: string; value: string }[];
};

export type HomeVariant = {
  id: string;
  scent: string;
  size: string;
  price: number;
  stock: number;
};

/** Ready-made TAFARA HOME products: priced and stocked per scent + size. */
export type HomeProduct = BaseProduct & {
  kind: "home";
  variants: HomeVariant[];
  specs: { label: string; value: string }[];
};

export type Product = ClothingProduct | HomeProduct;

export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  image: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  /** Shown under the option at checkout, e.g. "1–2 working days after your piece is ready". */
  description: string;
  fee: number;
  active: boolean;
  /** Pickup zones need no address. */
  pickup?: boolean;
};

export type Settings = {
  store: { email: string; phone: string; whatsapp: string; instagram: string; address: string };
  announcement: { enabled: boolean; text: string; detail: string };
  production: { madeToOrderMin: number; madeToOrderMax: number; readyMadeMin: number; readyMadeMax: number };
  delivery: DeliveryZone[];
  /** The account customers transfer to at checkout. */
  bank: { bankName: string; accountName: string; accountNumber: string };
  notifications: { ownerEmail: string; sms: boolean };
};

/** A Journal story. `body` is plain text: blank lines split paragraphs, "## " starts a heading, "> " a pull quote. */
export type JournalPost = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  /** Short label above the title, e.g. "The pieces" or "The studio". */
  topic: string;
  /** One or two sentences for cards and search results. */
  excerpt: string;
  cover?: string;
  coverAlt: string;
  body: string;
  /** Product slugs shown under the story as "Shop the story". */
  products: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};
