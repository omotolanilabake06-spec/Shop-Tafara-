"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { type SignupState, signUp } from "@/app/newsletter-actions";

const CONSENT_KEY = "tafara-cookie-consent";
const NEWSLETTER_KEY = "tafara-newsletter";
const OPEN_COOKIES = "tafara:open-cookie-settings";
const POPUP_DELAY = 4000;
const SNOOZE_DAYS = 30;
// Never interrupt someone who is buying, tracking an order or reading the policy.
const QUIET_PATHS = ["/cart", "/checkout", "/track", "/privacy"];

// Browser storage can be blocked (private windows, strict settings), so failures are ignored.
function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

/** "all" or "essential". Check this before loading any optional analytics. */
export function cookieConsent() {
  return read(CONSENT_KEY);
}

function popupIsDue() {
  if (QUIET_PATHS.some((p) => window.location.pathname.startsWith(p))) return false;
  const saved = read(NEWSLETTER_KEY);
  if (saved === "subscribed") return false;
  const snoozedAt = Number(saved);
  return !snoozedAt || Date.now() - snoozedAt > SNOOZE_DAYS * 86_400_000;
}

/** Cookie choice and newsletter invitation, each shown until the visitor has answered. */
export function SiteNotices() {
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const cookies = setTimeout(() => {
      if (!cookieConsent()) setCookiesOpen(true);
    }, 400);
    const popup = setTimeout(() => {
      if (popupIsDue()) setPopupOpen(true);
    }, POPUP_DELAY);
    const reopen = () => setCookiesOpen(true);
    window.addEventListener(OPEN_COOKIES, reopen);
    return () => {
      clearTimeout(cookies);
      clearTimeout(popup);
      window.removeEventListener(OPEN_COOKIES, reopen);
    };
  }, []);

  const choose = (choice: "all" | "essential") => {
    write(CONSENT_KEY, choice);
    setCookiesOpen(false);
  };

  return (
    <>
      {popupOpen && <NewsletterPopup onClose={() => setPopupOpen(false)} />}
      {cookiesOpen && <CookieBanner onChoose={choose} />}
    </>
  );
}

function CookieBanner({ onChoose }: { onChoose: (choice: "all" | "essential") => void }) {
  return (
    <section
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-paper px-5 py-4 text-ink sm:flex sm:items-center sm:justify-between sm:gap-8 lg:px-12"
    >
      <p className="max-w-[80ch] text-[13px] leading-relaxed">
        We use essential cookies and browser storage to keep your bag and your choices. Optional analytics would only run if you accept.{" "}
        <Link href="/privacy#cookies" className="underline underline-offset-2">
          Learn more
        </Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button type="button" onClick={() => onChoose("essential")} className="caps-sm h-10 flex-1 border border-ink px-5 sm:flex-none">
          Essential only
        </button>
        <button type="button" onClick={() => onChoose("all")} className="caps-sm h-10 flex-1 bg-ink px-5 text-paper sm:flex-none">
          Accept all
        </button>
      </div>
    </section>
  );
}

const field =
  "h-11 w-full border border-white/70 bg-transparent px-3 text-[14px] text-white outline-none transition-colors placeholder:text-white/70 focus:border-white";

function NewsletterPopup({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, {});
  const panel = useRef<HTMLDivElement>(null);
  const subscribed = Boolean(state.ok);

  const dismiss = useCallback(() => {
    if (!subscribed) write(NEWSLETTER_KEY, String(Date.now()));
    onClose();
  }, [subscribed, onClose]);

  useEffect(() => {
    if (subscribed) write(NEWSLETTER_KEY, "subscribed");
  }, [subscribed]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [dismiss]);

  return (
    <div className="popup-in fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4" onClick={dismiss}>
      <div
        ref={panel}
        role="dialog"
        aria-labelledby="newsletter-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-full w-full max-w-[400px] overflow-y-auto bg-black text-white outline-none md:max-w-[800px] md:grid-cols-2"
      >
        <div className="relative hidden min-h-[520px] md:block">
          <Image src="/hero/tafara-hero-poster-portrait.jpg" alt="" fill sizes="400px" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 via-40% to-black/0" />
          <p className="display absolute inset-x-0 bottom-9 text-center text-[34px]">Made for you, in Lagos</p>
        </div>

        <div className="flex flex-col justify-center px-8 py-12 text-center md:px-11">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>

          {subscribed ? (
            <div aria-live="polite">
              <h2 id="newsletter-title" className="display text-[38px]">
                Thank you
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-white/85">You are on the list. We will be in touch when something new arrives.</p>
              <button type="button" onClick={dismiss} className="caps mt-8 h-12 w-full bg-white text-black">
                Continue shopping
              </button>
            </div>
          ) : (
            <>
              <h2 id="newsletter-title" className="display text-[38px]">
                First to know
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-white/85">Sign up for early access to new pieces and collections from Shop Tafara.</p>

              <form action={action} className="mt-7 space-y-3 text-left">
                <input name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" className={field} />
                <input name="firstName" type="text" autoComplete="given-name" maxLength={80} placeholder="First name" aria-label="First name" className={field} />
                {/* Spam trap, hidden from people. */}
                <input name="company" type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                {state.error && (
                  <p role="alert" className="text-[13px] text-white">
                    {state.error}
                  </p>
                )}
                <button type="submit" disabled={pending} className="caps mt-2 h-12 w-full bg-white text-black disabled:opacity-60">
                  {pending ? "Signing up" : "Sign up"}
                </button>
              </form>

              <button type="button" onClick={dismiss} className="mt-5 self-center text-[13px] underline underline-offset-4">
                No thanks
              </button>
              <p className="mt-6 text-[11px] leading-relaxed text-white/70">
                By signing up, you agree to receive marketing emails from Shop Tafara. Unsubscribe at any time. See our{" "}
                <Link href="/privacy" onClick={dismiss} className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Footer link that lets visitors change their cookie choice later. */
export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIES))} className="caps-sm transition-colors hover:text-ink">
      Cookie settings
    </button>
  );
}
