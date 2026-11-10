"use client";

import { useActionState, useState } from "react";
import { type PaymentFormState, paymentNoteAction, refundAction } from "@/app/admin/(console)/payments/actions";
import { formatNaira } from "@/lib/format";
import { Field, button, input, textarea } from "./ui";

export function RefundForm({ reference, refundable }: { reference: string; refundable: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(refundAction, {});
  if (state.ok) return <p className="text-[15px] font-medium text-ok">{state.ok}</p>;
  if (!open)
    return (
      <button type="button" className={button.secondary} onClick={() => setOpen(true)}>
        Refund…
      </button>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <Field label="Amount to refund (₦)" hint={`Up to ${formatNaira(refundable)}.`}>
        <input name="amount" defaultValue={refundable} inputMode="numeric" className={`${input} max-w-[220px]`} />
      </Field>
      <Field label="Reason">
        <textarea name="reason" rows={2} className={`${textarea} min-h-[64px]`} placeholder="e.g. Order cancelled before cutting" />
      </Field>
      <p className="rounded-[3px] bg-[#fbf3e4] px-3 py-2.5 text-[14px] text-warn">
        This records the refund only. Send the money back to the customer from the bank account as well.
      </p>
      {state.error && <p className="text-[14px] font-medium text-sold">{state.error}</p>}
      <div className="flex gap-3">
        <button type="submit" className={button.dangerSolid} disabled={pending}>
          {pending ? "Recording…" : "Record refund"}
        </button>
        <button type="button" className={button.secondary} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentNoteForm({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(paymentNoteAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="reference" value={reference} />
      <textarea name="text" rows={2} className={`${textarea} min-h-[64px]`} placeholder="Add a note to this payment's history" />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className={button.secondary} disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </button>
        {state.error && <p className="text-[14px] text-sold">{state.error}</p>}
      </div>
    </form>
  );
}
