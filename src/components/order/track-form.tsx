"use client";

import { useActionState } from "react";
import { type LookupState, lookupOrder } from "@/app/(shop)/track/actions";

const field =
  "mt-2 block h-[52px] w-full border border-line bg-paper px-4 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink";

export function TrackForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, {});
  return (
    <form action={action} className="mx-auto max-w-[420px]" noValidate>
      <label className="block">
        <span className="caps-sm">Order number</span>
        <input
          name="number"
          defaultValue={state.number}
          placeholder="TAF-10482"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className={field}
        />
      </label>
      <label className="mt-6 block">
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
      <p role="alert" aria-live="polite" className="mt-4 min-h-[1.5em] text-[14px] leading-relaxed text-sold">
        {state.error}
      </p>
      <button type="submit" className="btn btn-solid mt-2 w-full" disabled={pending}>
        {pending ? "Finding your order…" : "Track my order"}
      </button>
    </form>
  );
}
