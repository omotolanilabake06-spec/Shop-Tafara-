"use client";

import { useActionState, useMemo, useState } from "react";
import { type SettingsState, saveSettingsAction } from "@/app/admin/(console)/settings/actions";
import { formatNaira } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Card, Field, button, input, smallInput } from "./ui";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  const errors = state.errors ?? {};
  const [lastSave, setLastSave] = useState(state.savedAt);
  if (state.savedAt !== lastSave) {
    setLastSave(state.savedAt);
    setSaved(s);
  }
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(saved), [s, saved]);

  const store = <K extends keyof Settings["store"]>(k: K, v: string) => setS((x) => ({ ...x, store: { ...x.store, [k]: v } }));
  const prod = (k: keyof Settings["production"], v: string) => setS((x) => ({ ...x, production: { ...x.production, [k]: v as unknown as number } }));
  const zone = (i: number, patch: Partial<Settings["delivery"][number]>) =>
    setS((x) => ({ ...x, delivery: x.delivery.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));

  return (
    <form
      action={(form) => {
        form.set("payload", JSON.stringify(s));
        action(form);
      }}
      className="space-y-6"
    >
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-stone/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <p className="text-[15px]" aria-live="polite">
          {pending ? (
            "Saving…"
          ) : state.error ? (
            <span className="font-medium text-sold">{state.error}</span>
          ) : dirty ? (
            <span className="font-medium text-warn">Unsaved changes</span>
          ) : state.savedAt ? (
            <span className="font-medium text-ok">Settings saved. The shop is updated.</span>
          ) : (
            <span className="text-soft">Changes apply to the shop as soon as you save.</span>
          )}
        </p>
        <button type="submit" className={button.primary} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>

      <Card title="Store details" description="Shown on order emails, the contact page and the tracking page.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Customer service email" error={errors.storeEmail}>
            <input className={input} type="email" value={s.store.email} onChange={(e) => store("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={input} value={s.store.phone} onChange={(e) => store("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp number" hint="Include the country code, e.g. +234 803 000 0000.">
            <input className={input} value={s.store.whatsapp} onChange={(e) => store("whatsapp", e.target.value)} />
          </Field>
          <Field label="Instagram handle">
            <input className={input} value={s.store.instagram} onChange={(e) => store("instagram", e.target.value)} placeholder="shoptafara" />
          </Field>
          <Field label="Studio address" className="sm:col-span-2">
            <input className={input} value={s.store.address} onChange={(e) => store("address", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Announcement bar" description="The thin black bar at the very top of every page.">
        <label className="mb-5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={s.announcement.enabled}
            onChange={(e) => setS((x) => ({ ...x, announcement: { ...x.announcement, enabled: e.target.checked } }))}
            className="h-4 w-4 accent-ink"
          />
          <span className="font-medium">Show the announcement bar</span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Main message">
            <input className={input} value={s.announcement.text} onChange={(e) => setS((x) => ({ ...x, announcement: { ...x.announcement, text: e.target.value } }))} />
          </Field>
          <Field label="Second message" hint="Hidden on phones to keep the bar on one line.">
            <input className={input} value={s.announcement.detail} onChange={(e) => setS((x) => ({ ...x, announcement: { ...x.announcement, detail: e.target.value } }))} />
          </Field>
        </div>
        {s.announcement.enabled && (
          <p className="mt-4 rounded-[2px] bg-ink px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-[#efe9df]">
            {s.announcement.text}
            {s.announcement.detail && <> &nbsp;·&nbsp; {s.announcement.detail}</>}
          </p>
        )}
      </Card>

      <Card title="Production times" description="Counted in working days (Monday to Friday, excluding public holidays). New orders use these; existing orders keep their date.">
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-1.5 text-[14px] font-medium">Made-to-order clothing</legend>
            <div className="flex items-center gap-2">
              <input className={smallInput} inputMode="numeric" value={s.production.madeToOrderMin} onChange={(e) => prod("madeToOrderMin", e.target.value)} aria-label="Fewest days" />
              <span>to</span>
              <input className={smallInput} inputMode="numeric" value={s.production.madeToOrderMax} onChange={(e) => prod("madeToOrderMax", e.target.value)} aria-label="Most days" />
              <span>working days</span>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-[14px] font-medium">Ready-made (TAFARA HOME)</legend>
            <div className="flex items-center gap-2">
              <input className={smallInput} inputMode="numeric" value={s.production.readyMadeMin} onChange={(e) => prod("readyMadeMin", e.target.value)} aria-label="Fewest days" />
              <span>to</span>
              <input className={smallInput} inputMode="numeric" value={s.production.readyMadeMax} onChange={(e) => prod("readyMadeMax", e.target.value)} aria-label="Most days" />
              <span>working days</span>
            </div>
          </fieldset>
        </div>
        {errors.production && <p className="mt-3 text-[14px] font-medium text-sold">{errors.production}</p>}
      </Card>

      <Card title="Delivery options" description="What customers choose from at checkout, and what each costs. The fee is shown before they pay.">
        <ul className="space-y-4">
          {s.delivery.map((z, i) => (
            <li key={z.id} className={`rounded-[4px] border p-4 ${z.active ? "border-line" : "border-dashed border-[#d6cfc5] bg-[#faf8f5]"}`}>
              <div className="grid gap-4 sm:grid-cols-[1.2fr_160px]">
                <Field label="Name">
                  <input className={input} value={z.name} onChange={(e) => zone(i, { name: e.target.value })} />
                </Field>
                <Field label="Fee (₦)" hint={Number(z.fee) === 0 ? "Free" : formatNaira(Number(z.fee) || 0)}>
                  <input className={input} inputMode="numeric" value={z.fee} onChange={(e) => zone(i, { fee: e.target.value as unknown as number })} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <input className={input} value={z.description} onChange={(e) => zone(i, { description: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 text-[15px]">
                    <input type="checkbox" checked={z.active} onChange={(e) => zone(i, { active: e.target.checked })} className="h-4 w-4 accent-ink" />
                    Offered at checkout
                  </label>
                  <label className="flex items-center gap-2 text-[15px]">
                    <input type="checkbox" checked={Boolean(z.pickup)} onChange={(e) => zone(i, { pickup: e.target.checked })} className="h-4 w-4 accent-ink" />
                    Collection (no address needed)
                  </label>
                </div>
                <button
                  type="button"
                  className="text-[14px] text-sold hover:underline"
                  onClick={() => setS((x) => ({ ...x, delivery: x.delivery.filter((_, j) => j !== i) }))}
                >
                  Remove
                </button>
              </div>
              {errors[`zone.${i}`] && <p className="mt-2 text-[14px] font-medium text-sold">{errors[`zone.${i}`]}</p>}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`${button.secondary} mt-4`}
          onClick={() =>
            setS((x) => ({
              ...x,
              delivery: [...x.delivery, { id: `zone_${Math.random().toString(36).slice(2, 8)}`, name: "", description: "", fee: 0, active: true }],
            }))
          }
        >
          + Add delivery option
        </button>
        {errors.delivery && <p className="mt-3 text-[14px] font-medium text-sold">{errors.delivery}</p>}
      </Card>

      <Card title="Notifications">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Send new-order alerts to" error={errors.ownerEmail}>
            <input
              className={input}
              type="email"
              value={s.notifications.ownerEmail}
              onChange={(e) => setS((x) => ({ ...x, notifications: { ...x.notifications, ownerEmail: e.target.value } }))}
            />
          </Field>
          <label className="flex items-start gap-3 self-end rounded-[3px] border border-line px-4 py-3">
            <input
              type="checkbox"
              checked={s.notifications.sms}
              onChange={(e) => setS((x) => ({ ...x, notifications: { ...x.notifications, sms: e.target.checked } }))}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <span>
              <span className="block font-medium">Text customers as well as emailing</span>
              <span className="block text-[14px] text-soft">Each text costs a few naira through the SMS provider.</span>
            </span>
          </label>
        </div>
      </Card>
    </form>
  );
}
