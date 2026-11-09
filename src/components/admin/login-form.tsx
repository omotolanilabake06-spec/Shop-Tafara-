"use client";

import { useActionState } from "react";
import { type LoginState, signIn } from "@/app/admin/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="caps-sm">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 block h-[52px] w-full border border-line bg-paper px-4 text-[15px] outline-none transition-colors focus:border-ink"
        />
      </label>
      <p role="alert" aria-live="polite" className="mt-3 min-h-[1.5em] text-[14px] text-sold">
        {state.error}
      </p>
      <button type="submit" className="btn btn-solid mt-2 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
