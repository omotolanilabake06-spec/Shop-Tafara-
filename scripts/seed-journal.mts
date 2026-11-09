// One-off: the first four Journal stories (2026-11-09), written from the client's own product notes.
// Safe to re-run: stories are matched by link and updated, never duplicated.
import { fetchPosts, savePost } from "../src/lib/db/journal.ts";
import { fetchProducts } from "../src/lib/db/products.ts";

const products = await fetchProducts();
const photo = (slug: string, i: number) => {
  const im = products.find((p) => p.slug === slug)?.images[i];
  if (!im) throw new Error(`No photo ${i} for ${slug}`);
  return im;
};
const existing = await fetchPosts();
// Same day, a few minutes apart, so the order below is the order on the page (last = newest).
const at = (n: number) => new Date(Date.now() - (stories.length - n) * 5 * 60_000).toISOString();

const stories = [
  {
    slug: "how-made-to-order-works",
    title: "How made to order works",
    topic: "The studio",
    excerpt: "Nothing at Shop Tafara is made in advance. Here is what happens between choosing your piece and wearing it.",
    cover: photo("arabi-set", 1),
    products: ["arabi-set", "clover-set", "echo"],
    body: `Every piece in our shop starts the same way: with you. We don't sew stock in advance and wait for it to sell. Your piece is cut and sewn after you order it.

## 1. Choose your piece
Pick the style, then the colour and your size. Our colour card shows every shade we work in, and the size guide will help you find your fit.

## 2. We begin
Once your order is placed, it goes to our studio in Lagos and we start cutting.

## 3. Ready in 5 to 7 working days
Pieces are ready to ship within 5 to 7 working days. You can follow every step on our Track your order page.

## 4. To your door
Delivery cost is shown at checkout, before you pay.

> Less waste, a better fit, and a piece that was always yours.

If you have a question along the way, message us on WhatsApp. We are happy to help with sizing, colours or an order.`,
  },
  {
    slug: "the-clover-set-gingham-smocked-and-ruffled",
    title: "The Clover Set: gingham, smocked and ruffled",
    topic: "The pieces",
    excerpt: "A smocked cotton gingham top and a fitted midi skirt, finished with ruffles at the hem, the cuffs and just below the knee.",
    cover: photo("clover-set", 2),
    products: ["clover-set"],
    body: `The Clover Set is two pieces in smocked cotton gingham, made to be worn together.

## The top
Long sleeves, a ruffle at the hem and a ruffle at each cuff. The smocking gives the top its shape, so it follows the body.

## The skirt
The skirt is fitted all the way down and ends just below the knee in a double layer of ruffles.

> Orange or pink, in gingham from the cuffs to the hem.

## In orange and pink
Clover comes in Orange and Pink, in UK sizes 6 to 22. It is sold as a set only and, like everything we make, it is cut and sewn in Lagos after you order.`,
  },
  {
    slug: "echo-a-long-dress-in-rows-of-ruffles",
    title: "Echo: a long dress in rows of ruffles",
    topic: "The pieces",
    excerpt: "A floor-length halter dress in crepe, smocked through the body and finished with layer upon layer of chiffon ruffles.",
    cover: photo("echo", 3),
    products: ["echo"],
    body: `Echo is our long dress. It ties at the back of the neck, leaves the back open and falls all the way to the floor.

## Smocked to fit
From the bust down to the hips, the crepe is smocked, so the dress holds close through the body. A zip at the back makes it easy to step into.

## Ruffles, in rows
Rows of chiffon ruffle trim are spaced down the length of the dress, and the hem finishes in layered chiffon ruffles.

> Smocked through the body, ruffled to the floor.

## Every colour on the card
We photographed Echo in Ivory and Chocolate, and it is made in every colour on our colour card: Ivory, Chocolate, Black, Baby Pink, Turquoise, Red, Terracotta, Lilac, Peach and Olive. Choose yours, with your size from UK 6 to 22, and the studio begins.`,
  },
  {
    slug: "the-arabi-set-stripes-woven-not-printed",
    title: "The Àràbì Set: stripes woven, not printed",
    topic: "The pieces",
    excerpt: "A handwoven aso-oke mini skirt and a ribbed cotton tank, made as one set. A closer look at the cloth, the cut and its two colours.",
    cover: photo("arabi-set", 6),
    products: ["arabi-set"],
    body: `Aso-oke is a hand-loomed cloth from south-west Nigeria, traditionally woven in narrow strips and worn for the days that matter. For the Àràbì Set, it becomes something to wear on an ordinary afternoon: a high-waisted mini skirt.

## The skirt
The stripes on the Àràbì skirt are not printed on. They are woven into the fabric itself, so they run true from the waistband to the hem. The skirt is cut straight, sits high on the waist and is lined.

## The tank
Above it sits a fitted, ribbed cotton tank with built-in padded cups and a scoop back. A contrast trim runs along the neckline and the straps.

> Made to be worn together, and sold only as a set.

## Two colours
In Ivory, a pale tank sits over a burgundy-striped skirt. In Navy Blue, a deep navy tank sits over a skirt striped in blues and reds. Both come in UK sizes 6 to 14, made to order in Lagos.`,
  },
];

for (const [i, s] of stories.entries()) {
  const prior = existing.find((p) => p.slug === s.slug);
  const saved = await savePost({
    id: prior?.id,
    slug: s.slug,
    title: s.title,
    topic: s.topic,
    excerpt: s.excerpt,
    cover: s.cover.src,
    coverAlt: s.cover.alt,
    body: s.body,
    products: s.products,
    status: "published",
    publishedAt: prior?.publishedAt ?? at(i),
  });
  console.log(`${prior ? "Updated" : "Published"}: ${saved.title} → /journal/${saved.slug}`);
}
