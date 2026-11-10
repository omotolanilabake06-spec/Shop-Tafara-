"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { type CheckoutState, placeOrder } from "@/app/(shop)/checkout/actions";
import { type CartLine, clearCart, useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import type { DeliveryZone, Settings } from "@/lib/types";

const field =
  "mt-2 block h-[52px] w-full border border-line bg-paper px-4 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink aria-[invalid=true]:border-sold";

type Details = { name: string; email: string; phone: string; delivery: string; address: string; city: string; state: string; country: string; note: string };

/** Phone photos of receipts are large: shrink them in the browser so the upload is quick. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
}

const priceOf = (line: CartLine, prices: Record<string, number>) =>
  line.kind === "clothing"
    ? (prices[line.slug] ?? line.price)
    : (prices[`${line.slug}|${line.options.find((o) => o.label === "Scent")?.value}|${line.options.find((o) => o.label === "Size")?.value}`] ?? line.price);

export function CheckoutForm({
  prices,
  zones,
  bank,
  whatsapp,
  production,
}: {
  prices: Record<string, number>;
  zones: DeliveryZone[];
  bank: Settings["bank"];
  whatsapp: string;
  production: Settings["production"];
}) {
  const router = useRouter();
  const { lines } = useCart();
  const [d, setD] = useState<Details>({ name: "", email: "", phone: "", delivery: zones[0]?.id ?? "", address: "", city: "", state: "", country: "", note: "" });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [copied, setCopied] = useState("");
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  // What was sent with the last attempt: a field's error disappears as soon as the customer changes it.
  const [sent, setSent] = useState<Details | null>(null);
  const errors = Object.fromEntries(
    Object.entries(state.errors ?? {}).filter(([k]) => !(k in d) || !sent || d[k as keyof Details] === sent[k as keyof Details]),
  );

  useEffect(() => {
    if (!state.placed) return;
    clearCart();
    router.replace(state.placed);
  }, [state.placed, router]);

  if (state.placed) {
    return (
      <div className="gutter flex min-h-[55vh] flex-col items-center justify-center py-24 text-center">
        <p className="caps-sm text-muted">Order placed</p>
        <h1 className="display mt-4 text-[40px] sm:text-[52px]">Thank you</h1>
        <p className="mt-4 text-[14px] text-muted">Opening your order…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="gutter flex min-h-[55vh] flex-col items-center justify-center py-24 text-center">
        <h1 className="display text-[40px] sm:text-[52px]">Your bag is empty</h1>
        <p className="mt-4 text-[14px] text-muted">Add a piece to your bag to check out.</p>
        <Link href="/shop" className="btn btn-solid mt-9">
          Continue shopping
        </Link>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === d.delivery);
  const subtotal = lines.reduce((n, l) => n + priceOf(l, prices) * l.qty, 0);
  const total = state.total ?? subtotal + (zone?.fee ?? 0);
  const madeToOrder = lines.some((l) => l.kind === "clothing");
  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const digits = whatsapp.replace(/\D/g, "");
  const waText = encodeURIComponent(`Hello Shop Tafara, I have just transferred ${formatNaira(total)} for my order${d.name ? ` (${d.name.trim()})` : ""}. Here is my receipt.`);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? "" : c)), 2000);
    } catch {}
  };

  const pick = async (file: File | undefined) => {
    if (!file) return setReceipt(null);
    setPreparing(true);
    setReceipt(await shrink(file));
    setPreparing(false);
  };

  const input = (k: keyof Details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="caps-sm">{label}</span>
      <input name={k} value={d[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} className={field} {...props} />
      {errors[k] && <span className="mt-2 block text-[13px] text-sold">{errors[k]}</span>}
    </label>
  );

  return (
    <form
      action={(form) => {
        form.set("cart", JSON.stringify(lines.map((l) => ({ slug: l.slug, qty: l.qty, options: l.options }))));
        form.set("shownTotal", String(total));
        form.set("delivery", d.delivery);
        if (receipt) form.set("receipt", receipt);
        setSent(d);
        action(form);
      }}
      className="gutter mx-auto max-w-[1180px] pb-28 pt-10 sm:pt-14"
      noValidate
    >
      <h1 className="display text-center text-[40px] sm:text-[52px]">Checkout</h1>
      <p className="caps-sm mt-3 text-center text-muted">No account needed</p>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_400px] lg:gap-20">
        <div className="space-y-14">
          {/* Honeypot: hidden from people, filled in by bots. */}
          <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <Step n="01" title="Your details">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">{input("name", "Full name", { autoComplete: "name" })}</div>
              {input("email", "Email address", { type: "email", autoComplete: "email", placeholder: "For your order updates" })}
              {input("phone", "Phone (WhatsApp)", { type: "tel", autoComplete: "tel", placeholder: "0803 000 0000" })}
            </div>
          </Step>

          <Step n="02" title="Delivery">
            <fieldset>
              <legend className="sr-only">Choose delivery</legend>
              <div className="divide-y divide-line border border-line">
                {zones.map((z) => (
                  <label key={z.id} className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors ${d.delivery === z.id ? "bg-stone" : "hover:bg-stone/60"}`}>
                    <input
                      type="radio"
                      name="zone"
                      value={z.id}
                      checked={d.delivery === z.id}
                      onChange={() => setD((x) => ({ ...x, delivery: z.id }))}
                      className="mt-1 h-4 w-4 accent-ink"
                    />
                    <span className="flex-1">
                      <span className="block text-[15px]">{z.name}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{z.description}</span>
                    </span>
                    <span className="text-[15px] tabular-nums">{z.fee ? formatNaira(z.fee) : "Free"}</span>
                  </label>
                ))}
              </div>
              {errors.delivery && <p className="mt-2 text-[13px] text-sold">{errors.delivery}</p>}
            </fieldset>

            {zone && !zone.pickup && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">{input("address", "Street address", { autoComplete: "street-address", placeholder: "House number, street and area" })}</div>
                {input("city", "Town or city", { autoComplete: "address-level2" })}
                {input("state", zone.id === "international" ? "Region or postcode" : "State", { autoComplete: "address-level1" })}
                {zone.id === "international" && <div className="sm:col-span-2">{input("country", "Country", { autoComplete: "country-name" })}</div>}
              </div>
            )}

            <label className="mt-8 block">
              <span className="caps-sm">Note for the studio (optional)</span>
              <textarea
                name="note"
                value={d.note}
                onChange={set("note")}
                rows={3}
                placeholder="Anything we should know, such as your height for a maxi length"
                className="mt-2 block w-full border border-line bg-paper px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
              />
            </label>
          </Step>

          <Step n="03" title="Pay by bank transfer">
            <div className="bg-ink px-6 py-8 text-paper sm:px-9">
              <p className="caps-sm text-paper/60">Amount to transfer</p>
              <p className="display mt-2 text-[44px] leading-none lining-nums sm:text-[52px]">{formatNaira(total)}</p>
              <dl className="mt-8 divide-y divide-paper/15 border-y border-paper/15">
                <BankRow label="Bank" value={bank.bankName} />
                <BankRow label="Account name" value={bank.accountName} />
                <BankRow
                  label="Account number"
                  value={<span className="text-[20px] tracking-[0.08em] tabular-nums">{bank.accountNumber}</span>}
                  action={
                    <button type="button" onClick={() => copy("account", bank.accountNumber)} className="caps-sm text-paper/70 underline underline-offset-4 hover:text-paper">
                      {copied === "account" ? "Copied" : "Copy"}
                    </button>
                  }
                />
                <BankRow
                  label="Amount"
                  value={<span className="tabular-nums">{formatNaira(total)}</span>}
                  action={
                    <button type="button" onClick={() => copy("amount", String(total))} className="caps-sm text-paper/70 underline underline-offset-4 hover:text-paper">
                      {copied === "amount" ? "Copied" : "Copy"}
                    </button>
                  }
                />
              </dl>
              <p className="mt-6 text-[13px] leading-relaxed text-paper/70">Please use your full name as the transfer description, so we can match your payment quickly.</p>
            </div>

            <div className="mt-8">
              <p className="caps-sm">Your receipt</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">Upload a screenshot or photo of your transfer receipt. It helps us confirm your order faster.</p>
              <label
                className={`mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-8 text-center transition-colors hover:border-ink ${
                  errors.receipt ? "border-sold" : "border-line"
                } ${receipt ? "bg-stone" : ""}`}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0])}
                  aria-describedby="receipt-hint"
                />
                {preparing ? (
                  <span className="text-[14px] text-muted">Preparing your receipt…</span>
                ) : receipt ? (
                  <>
                    <span className="text-[15px]">✓ {receipt.name}</span>
                    <span className="mt-1 text-[13px] text-muted underline underline-offset-4">Choose a different file</span>
                  </>
                ) : (
                  <>
                    <span className="text-[15px]">Upload your receipt</span>
                    <span id="receipt-hint" className="mt-1 text-[13px] text-muted">
                      Photo, screenshot or PDF
                    </span>
                  </>
                )}
              </label>
              {errors.receipt && <p className="mt-2 text-[13px] text-sold">{errors.receipt}</p>}

              {digits && (
                <p className="mt-5 text-[14px] leading-relaxed text-muted">
                  Or{" "}
                  <a href={`https://wa.me/${digits}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
                    send your receipt to us on WhatsApp
                  </a>
                  .
                </p>
              )}
            </div>
          </Step>
        </div>

        <aside className="h-fit bg-stone p-7 lg:sticky lg:top-[132px]">
          <h2 className="caps">Your order</h2>
          <ul className="mt-6 space-y-5">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4">
                <div className="relative aspect-[2/3] w-[60px] shrink-0 overflow-hidden bg-sand">
                  {l.image && <Image src={l.image} alt="" fill sizes="60px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-3 text-[14px]">
                  <div>
                    <p className="caps-sm">{l.name}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {l.options.map((o) => o.value).join(" · ")}
                      {l.qty > 1 && ` · Qty ${l.qty}`}
                    </p>
                  </div>
                  <p className="tabular-nums">{formatNaira(priceOf(l, prices) * l.qty)}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{zone?.name ?? "Delivery"}</dt>
              <dd className="tabular-nums">{zone ? (zone.fee ? formatNaira(zone.fee) : "Free") : "—"}</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="caps">Total</span>
            <span className="text-[19px] tabular-nums">{formatNaira(total)}</span>
          </div>
          {madeToOrder && (
            <p className="mt-5 text-[13px] leading-relaxed text-muted">
              Made to order in Lagos. Ready to ship in {production.madeToOrderMin}–{production.madeToOrderMax} working days after we confirm your payment.
            </p>
          )}

          <p role="alert" aria-live="polite" className="mt-5 text-[14px] leading-relaxed text-sold empty:hidden">
            {pending || (state.errors && Object.keys(errors).length === 0 && !state.total) ? "" : state.error}
          </p>
          <button type="submit" className="btn btn-solid mt-6 w-full" disabled={pending || preparing}>
            {pending ? "Placing your order…" : "I have made payment"}
          </button>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-muted">
            Press this once you have transferred {formatNaira(total)}. We will email you as soon as your payment is confirmed.
          </p>
        </aside>
      </div>
    </form>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-7 flex items-baseline gap-4 border-b border-line pb-4">
        <span className="caps-sm text-muted tabular-nums">{n}</span>
        <span className="caps">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function BankRow({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="caps-sm text-paper/60">{label}</dt>
      <dd className="flex items-center gap-4 text-right text-[15px]">
        {value}
        {action}
      </dd>
    </div>
  );
}
