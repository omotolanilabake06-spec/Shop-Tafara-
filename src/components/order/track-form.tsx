"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type LookupState, lookupOrder } from "@/app/(shop)/track/actions";

const field =
  "mt-2 block h-[52px] w-full border border-line bg-paper px-4 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink";

export function TrackForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, {});

  if (state.orders) {
    return (
      <div className="mx-auto max-w-[560px]">
        <p className="caps-sm text-center text-muted">Your orders</p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {state.orders.map((o) => (
            <li key={o.number}>
              <Link href={o.href} className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-muted">
                <span className="min-w-0">
                  <span className="caps block">{o.status}</span>
                  <span className="mt-1.5 block truncate text-[14px] text-muted">{o.pieces}</span>
                  <span className="mt-0.5 block text-[13px] text-muted tabular-nums">
                    {o.number} · {o.placed} · {o.total}
                  </span>
                </span>
                <span aria-hidden className="text-[18px] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto max-w-[420px]" noValidate>
      <label className="block">
        <span className="caps-sm">Email address</span>
        <input
          name="email"
          type="email"
          defaultValue={state.email}
          placeholder="The email you ordered with"
          autoComplete="email"
          required
          className={field}
        />
      </label>
      <label className="mt-6 block">
        <span className="caps-sm">Phone number</span>
        <input
          name="phone"
          type="tel"
          defaultValue={state.phone}
          placeholder="The number you ordered with"
          autoComplete="tel"
          required
          className={field}
        />
      </label>
      <p role="alert" aria-live="polite" className="mt-4 min-h-[1.5em] text-[14px] leading-relaxed text-sold">
        {state.error}
      </p>
      <button type="submit" className="btn btn-solid mt-2 w-full" disabled={pending}>
        {pending ? "Finding your order…" : "See my order"}
      </button>
    </form>
  );
}
